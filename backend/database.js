const mysql = require('mysql2');
const bcrypt = require('bcrypt');

// สร้าง pool connection แบบ promise
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'mainline.proxy.rlwy.net',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'HZzcsKocblZEYqkeQxjKfsfJYnlgnKSm',
    database: process.env.DB_NAME || 'railway',
    port: process.env.DB_PORT || 47811,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise();

// ฟังก์ชันทดสอบเชื่อมต่อฐานข้อมูล
async function connectDatabase() {
    try {
        const connection = await pool.getConnection();
        connection.release();
        console.log('✅ เชื่อมต่อฐานข้อมูล MySQL สำเร็จ!');
    } catch (error) {
        console.error('❌ เชื่อมต่อฐานข้อมูล MySQL ไม่สำเร็จ:', error.message);
        throw error;
    }
}

// ฟังก์ชันดึงข้อมูลนักเรียนทั้งหมด
async function getAllStudents() {
    const [rows] = await pool.query('SELECT * FROM students ORDER BY student_id');
    return rows;
}

// ฟังก์ชันดึงข้อมูลนักเรียนตามห้องเรียน
async function getStudentsByClassroom(classroom) {
    const [rows] = await pool.query('SELECT * FROM students WHERE classroom = ? ORDER BY student_id', [classroom]);
    return rows;
}

// ฟังก์ชันดึงข้อมูลการเข้าเรียน
async function getAttendanceData() {
    const [rows] = await pool.query(`
        SELECT 
            a.id,
            a.student_id,
            s.name as student_name,
            s.classroom,
            a.date,
            a.time_slot,
            a.status,
            a.created_at
        FROM attendance a
        JOIN students s ON a.student_id = s.student_id
        ORDER BY a.date DESC, a.time_slot
    `);
    return rows;
}

// ฟังก์ชันดึงข้อมูลช่วงเวลา
async function getTimeSlots() {
    const [rows] = await pool.query('SELECT * FROM time_slots ORDER BY start_time');
    return rows;
}

// ฟังก์ชันดึงข้อมูลผู้ใช้
async function getUsers() {
    const [rows] = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY username');
    return rows;
}

// ฟังก์ชันเพิ่มข้อมูลการเข้าเรียน
async function addAttendance(studentId, date, timeSlot, status, createdBy = 'admin') {
    const [result] = await pool.query(
        'INSERT INTO attendance (student_id, date, time_slot, status, created_by) VALUES (?, ?, ?, ?, ?)',
        [studentId, date, timeSlot, status, createdBy]
    );
    return result;
}

// ฟังก์ชันตรวจสอบการเข้าเรียน
async function checkAttendanceExists(studentId, date, timeSlot) {
    const [rows] = await pool.query(
        'SELECT * FROM attendance WHERE student_id = ? AND date = ? AND time_slot = ?',
        [studentId, date, timeSlot]
    );
    return rows.length > 0;
}

// ฟังก์ชันลบข้อมูลการเข้าเรียน
async function deleteAttendance(id) {
    const [result] = await pool.query('DELETE FROM attendance WHERE id = ?', [id]);
    return result;
}

// ฟังก์ชันเพิ่มช่วงเวลาใหม่
async function addTimeSlot(startTime, endTime, description) {
    const [result] = await pool.query(
        'INSERT INTO time_slots (start_time, end_time, description) VALUES (?, ?, ?)',
        [startTime, endTime, description]
    );
    return result;
}

// ฟังก์ชันลบช่วงเวลา
async function deleteTimeSlot(id) {
    const [result] = await pool.query('DELETE FROM time_slots WHERE id = ?', [id]);
    return result;
}

// ฟังก์ชันอัพเดทสถานะนักเรียน
async function updateStudentStatus(studentId, status, classroom) {
    const [result] = await pool.query(
        'UPDATE students SET status = ? WHERE student_id = ? AND classroom = ?',
        [status, studentId, classroom]
    );
    return result;
}

// ฟังก์ชันตรวจสอบผู้ใช้และเช็ค password ด้วย bcrypt
async function checkUser(username, password) {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
        return null; // ไม่พบผู้ใช้
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return null; // รหัสผ่านไม่ถูกต้อง
    }
    return user; // ล็อกอินสำเร็จ
}

// ฟังก์ชันดึงสถิติการเข้าเรียนของนักเรียนแต่ละคนในช่วงวันที่
async function getAttendanceStatistics(classroom, startDate, endDate) {
    const [rows] = await pool.query(`
        SELECT 
            s.student_id,
            s.name as student_name,
            s.classroom,
            SUM(a.status = 'present') as present,
            SUM(a.status = 'absent') as absent,
            SUM(a.status = 'sick') as sick,
            SUM(a.status = 'activity') as activity,
            SUM(a.status = 'home') as home
        FROM students s
        LEFT JOIN attendance a ON s.student_id = a.student_id
            AND a.date BETWEEN ? AND ?
        WHERE s.classroom = ?
        GROUP BY s.student_id, s.name, s.classroom
        ORDER BY s.student_id
    `, [startDate, endDate, classroom]);
    return rows;
}

// -- ฟังก์ชันเพิ่มเติมตามที่ขอ --

// ดึงข้อมูลชั้นเรียนทั้งหมด
async function getClassrooms() {
    const [rows] = await pool.query('SELECT * FROM classrooms ORDER BY classroom_name');
    return rows;
}

// ดึงข้อมูลการเข้าเรียนตามวันที่, ช่วงเวลา และห้องเรียน
async function getAttendanceByDateTimeSlotAndClassroom(date, timeSlot, classroom) {
    const [rows] = await pool.query(`
        SELECT a.*, s.name as student_name, s.classroom
        FROM attendance a
        JOIN students s ON a.student_id = s.student_id
        WHERE a.date = ? AND a.time_slot = ? AND s.classroom = ?
        ORDER BY a.student_id
    `, [date, timeSlot, classroom]);
    return rows;
}

// ดึงข้อมูลการเข้าเรียนตามวันที่และช่วงเวลา
async function getAttendanceByDateAndTimeSlot(date, timeSlot) {
    const [rows] = await pool.query(`
        SELECT a.*, s.name as student_name, s.classroom
        FROM attendance a
        JOIN students s ON a.student_id = s.student_id
        WHERE a.date = ? AND a.time_slot = ?
        ORDER BY s.classroom, a.student_id
    `, [date, timeSlot]);
    return rows;
}

// ดึงข้อมูลการเข้าเรียนตามวันที่และห้องเรียน
async function getAttendanceByDateAndClassroom(date, classroom) {
    const [rows] = await pool.query(`
        SELECT a.*, s.name as student_name, s.classroom
        FROM attendance a
        JOIN students s ON a.student_id = s.student_id
        WHERE a.date = ? AND s.classroom = ?
        ORDER BY a.time_slot, a.student_id
    `, [date, classroom]);
    return rows;
}

// ดึงข้อมูลการเข้าเรียนตามวันที่
async function getAttendanceByDate(date) {
    const [rows] = await pool.query(`
        SELECT a.*, s.name as student_name, s.classroom
        FROM attendance a
        JOIN students s ON a.student_id = s.student_id
        WHERE a.date = ?
        ORDER BY s.classroom, a.time_slot, a.student_id
    `, [date]);
    return rows;
}

// ลบข้อมูลการเข้าเรียนตามวันที่, ช่วงเวลา และ (ถ้ามี) ห้องเรียน
async function clearAttendanceByDateAndTimeSlot(date, timeSlot, classroom) {
    let query = 'DELETE a FROM attendance a JOIN students s ON a.student_id = s.student_id WHERE a.date = ? AND a.time_slot = ?';
    const params = [date, timeSlot];

    if (classroom) {
        query += ' AND s.classroom = ?';
        params.push(classroom);
    }

    const [result] = await pool.query(query, params);
    return result;
}

// ลบข้อมูลการเข้าเรียนทั้งหมด
async function clearAllAttendance() {
    const [result] = await pool.query('DELETE FROM attendance');
    return result;
}

module.exports = {
    connectDatabase,
    getAllStudents,
    getStudentsByClassroom,
    getAttendanceData,
    getTimeSlots,
    getUsers,
    addAttendance,
    checkAttendanceExists,
    deleteAttendance,
    addTimeSlot,
    deleteTimeSlot,
    updateStudentStatus,
    checkUser,
    getAttendanceStatistics,

    // export ฟังก์ชันใหม่
    getClassrooms,
    getAttendanceByDateTimeSlotAndClassroom,
    getAttendanceByDateAndTimeSlot,
    getAttendanceByDateAndClassroom,
    getAttendanceByDate,
    clearAttendanceByDateAndTimeSlot,
    clearAllAttendance,
};
