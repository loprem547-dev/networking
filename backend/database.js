const mysql = require('mysql2');

// สร้างการเชื่อมต่อฐานข้อมูล MySQL
const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',           // หรือ IP address ของ MySQL Server
    user: process.env.DB_USER || 'root',               // username ของ MySQL
    password: process.env.DB_PASSWORD || 'atts',            // password ของ MySQL (ถ้ามี)
    database: process.env.DB_NAME || 'student_db', // ชื่อฐานข้อมูล
    port: process.env.DB_PORT || 3306                  // port ของ MySQL (ปกติ 3306)
});

// ฟังก์ชันเชื่อมต่อฐานข้อมูล
function connectDatabase() {
    return new Promise((resolve, reject) => {
        // ตรวจสอบการเชื่อมต่อ
        connection.connect((err) => {
            if (err) {
                console.error('❌ เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล:', err.message);
                console.error('🔧 ตรวจสอบการตั้งค่าดังนี้:');
                console.error('   - MySQL Server ทำงานอยู่หรือไม่');
                console.error('   - Host: ' + connection.config.host);
                console.error('   - Port: ' + connection.config.port);
                console.error('   - User: ' + connection.config.user);
                console.error('   - Database: ' + connection.config.database);
                reject(err);
            } else {
                console.log('✅ เชื่อมต่อฐานข้อมูล MySQL สำเร็จ!');
                console.log('📊 Database: ' + connection.config.database);
                resolve();
            }
        });
    });
}

// ฟังก์ชันดึงข้อมูลนักเรียนทั้งหมด
function getAllStudents() {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM students ORDER BY student_id';
        connection.query(query, (err, results) => {
            if (err) {
                console.error('เกิดข้อผิดพลาดในการดึงข้อมูลนักเรียน:', err);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

// ฟังก์ชันดึงข้อมูลการเข้าเรียน
function getAttendanceData() {
    return new Promise((resolve, reject) => {
        const query = `
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
        `;
        connection.query(query, (err, results) => {
            if (err) {
                console.error('เกิดข้อผิดพลาดในการดึงข้อมูลการเข้าเรียน:', err);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

// ฟังก์ชันดึงข้อมูลช่วงเวลา
function getTimeSlots() {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM time_slots ORDER BY start_time';
        connection.query(query, (err, results) => {
            if (err) {
                console.error('เกิดข้อผิดพลาดในการดึงข้อมูลช่วงเวลา:', err);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

// ฟังก์ชันดึงข้อมูลผู้ใช้
function getUsers() {
    return new Promise((resolve, reject) => {
        const query = 'SELECT id, username, role, created_at FROM users ORDER BY username';
        connection.query(query, (err, results) => {
            if (err) {
                console.error('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:', err);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

// ฟังก์ชันเพิ่มข้อมูลการเข้าเรียน
function addAttendance(studentId, date, timeSlot, status) {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO attendance (student_id, date, time_slot, status) VALUES (?, ?, ?, ?)';
        connection.query(query, [studentId, date, timeSlot, status], (err, result) => {
            if (err) {
                console.error('เกิดข้อผิดพลาดในการเพิ่มข้อมูลการเข้าเรียน:', err);
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

// ฟังก์ชันตรวจสอบการเข้าเรียน
function checkAttendanceExists(studentId, date, timeSlot) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM attendance WHERE student_id = ? AND date = ? AND time_slot = ?';
        connection.query(query, [studentId, date, timeSlot], (err, results) => {
            if (err) {
                console.error('เกิดข้อผิดพลาดในการตรวจสอบข้อมูลการเข้าเรียน:', err);
                reject(err);
            } else {
                resolve(results.length > 0);
            }
        });
    });
}

// ฟังก์ชันลบข้อมูลการเข้าเรียน
function deleteAttendance(id) {
    return new Promise((resolve, reject) => {
        const query = 'DELETE FROM attendance WHERE id = ?';
        connection.query(query, [id], (err, result) => {
            if (err) {
                console.error('เกิดข้อผิดพลาดในการลบข้อมูลการเข้าเรียน:', err);
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

// ฟังก์ชันเพิ่มช่วงเวลาใหม่
function addTimeSlot(startTime, endTime, description) {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO time_slots (start_time, end_time, description) VALUES (?, ?, ?)';
        connection.query(query, [startTime, endTime, description], (err, result) => {
            if (err) {
                console.error('เกิดข้อผิดพลาดในการเพิ่มช่วงเวลา:', err);
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

// ฟังก์ชันลบช่วงเวลา
function deleteTimeSlot(id) {
    return new Promise((resolve, reject) => {
        const query = 'DELETE FROM time_slots WHERE id = ?';
        connection.query(query, [id], (err, result) => {
            if (err) {
                console.error('เกิดข้อผิดพลาดในการลบช่วงเวลา:', err);
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

// ฟังก์ชันอัพเดทสถานะนักเรียน
function updateStudentStatus(studentId, status, classroom) {
    return new Promise((resolve, reject) => {
        const query = 'UPDATE students SET status = ? WHERE student_id = ? AND classroom = ?';
        connection.query(query, [status, studentId, classroom], (err, result) => {
            if (err) {
                console.error('เกิดข้อผิดพลาดในการอัพเดทสถานะนักเรียน:', err);
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

// ฟังก์ชันดึงข้อมูลนักเรียนตามห้องเรียน
function getStudentsByClassroom(classroom) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM students WHERE classroom = ? ORDER BY student_id';
        connection.query(query, [classroom], (err, results) => {
            if (err) {
                console.error('เกิดข้อผิดพลาดในการดึงข้อมูลนักเรียนตามห้องเรียน:', err);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

// ฟังก์ชันตรวจสอบผู้ใช้
function checkUser(username, password) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
        connection.query(query, [username, password], (err, results) => {
            if (err) {
                console.error('เกิดข้อผิดพลาดในการตรวจสอบผู้ใช้:', err);
                reject(err);
            } else {
                resolve(results.length > 0 ? results[0] : null);
            }
        });
    });
}

// ฟังก์ชันดึงสถิติการเข้าเรียนของนักเรียนแต่ละคนในช่วงวันที่
function getAttendanceStatistics(classroom, startDate, endDate) {
    return new Promise((resolve, reject) => {
        const query = `
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
        `;
        connection.query(query, [startDate, endDate, classroom], (err, results) => {
            if (err) {
                console.error('เกิดข้อผิดพลาดในการดึงสถิติการเข้าเรียน:', err);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

module.exports = {
    connection,
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
    getAttendanceStatistics
}; 