const express = require('express');
const cors = require('cors');
const db = require('./database');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(express.json());

// เชื่อมต่อฐานข้อมูลเมื่อเริ่มเซิร์ฟเวอร์
db.connectDatabase()
    .then(() => {
        console.log('✅ เชื่อมต่อฐานข้อมูล MySQL สำเร็จ!');
    })
    .catch((err) => {
        console.error('❌ เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล:', err.message);
        console.error('🛑 เซิร์ฟเวอร์จะทำงานต่อไป แต่การใช้งานอาจมีปัญหา');
    });

// API Routes

// 1. ดึงข้อมูลนักเรียนทั้งหมด
app.get('/api/students', async (req, res) => {
    try {
        const classroom = req.query.classroom;
        let students;
        
        if (classroom) {
            students = await db.getStudentsByClassroom(classroom);
        } else {
            students = await db.getAllStudents();
        }
        
        res.json(students);
    } catch (err) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลนักเรียน:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลนักเรียน' });
    }
});

// 1.1 ดึงข้อมูลชั้นเรียนทั้งหมด
app.get('/api/classrooms', async (req, res) => {
    try {
        const classrooms = await db.getClassrooms();
        res.json(classrooms);
    } catch (err) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลชั้นเรียน:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลชั้นเรียน' });
    }
});

// 2. อัพเดทสถานะนักเรียน
app.put('/api/students/:studentId/status', async (req, res) => {
    try {
        const { studentId } = req.params;
        const { status, classroom } = req.body;
        
        if (!studentId || !status || !classroom) {
            return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน' });
        }
        
        await db.updateStudentStatus(studentId, status, classroom);
        res.json({ success: true });
    } catch (err) {
        console.error('เกิดข้อผิดพลาดในการอัพเดทสถานะนักเรียน:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพเดทสถานะนักเรียน' });
    }
});

// 3. ดึงข้อมูลการเข้าเรียน
app.get('/api/attendance', async (req, res) => {
    try {
        const { date, timeSlot, classroom } = req.query;
        let attendance;
        
        if (date && timeSlot && classroom) {
            attendance = await db.getAttendanceByDateTimeSlotAndClassroom(date, timeSlot, classroom);
        } else if (date && timeSlot) {
            attendance = await db.getAttendanceByDateAndTimeSlot(date, timeSlot);
        } else if (date && classroom) {
            attendance = await db.getAttendanceByDateAndClassroom(date, classroom);
        } else if (date) {
            attendance = await db.getAttendanceByDate(date);
        } else {
            attendance = await db.getAttendanceData();
        }
        
        res.json(attendance);
    } catch (err) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลการเข้าเรียน:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการเข้าเรียน' });
    }
});

// 3. เพิ่มข้อมูลการเข้าเรียน
app.post('/api/attendance', async (req, res) => {
    try {
        const { studentId, date, timeSlot, status } = req.body;
        
        // ตรวจสอบว่ามีข้อมูลการเข้าเรียนอยู่แล้วหรือไม่
        const exists = await db.checkAttendanceExists(studentId, date, timeSlot);
        if (exists) {
            return res.status(400).json({ error: 'มีข้อมูลการเข้าเรียนในวันและช่วงเวลานี้แล้ว' });
        }
        
        // ใช้ชื่อผู้ใช้ปัจจุบันเป็นผู้บันทึก
        const createdBy = req.body.createdBy || 'admin';
        const result = await db.addAttendance(studentId, date, timeSlot, status, createdBy);
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        console.error('เกิดข้อผิดพลาดในการเพิ่มข้อมูลการเข้าเรียน:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลการเข้าเรียน' });
    }
});

// 4. ลบข้อมูลการเข้าเรียน
app.delete('/api/attendance/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.body.currentUser || { role: 'admin' };
        
        const result = await db.deleteAttendance(id, currentUser);
        
        if (result.affectedRows === 0) {
            return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ลบข้อมูลนี้' });
        }
        
        res.json({ success: true });
    } catch (err) {
        console.error('เกิดข้อผิดพลาดในการลบข้อมูลการเข้าเรียน:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบข้อมูลการเข้าเรียน' });
    }
});

// 4.1 ลบข้อมูลการเช็คชื่อเก่าตามวันที่และช่วงเวลา
app.delete('/api/attendance/clear', async (req, res) => {
    try {
        const { date, timeSlot, classroom, currentUser } = req.body;
        
        if (!date || !timeSlot) {
            return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน' });
        }
        
        await db.clearAttendanceByDateAndTimeSlot(date, timeSlot, classroom, currentUser);
        res.json({ success: true });
    } catch (err) {
        console.error('เกิดข้อผิดพลาดในการลบข้อมูลการเช็คชื่อเก่า:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบข้อมูลการเช็คชื่อเก่า' });
    }
});

// 4.2 ล้างประวัติการเช็คชื่อทั้งหมด
app.delete('/api/attendance/clear-all', async (req, res) => {
    try {
        const currentUser = req.body.currentUser || { role: 'admin' };
        
        await db.clearAllAttendance(currentUser);
        res.json({ success: true, message: 'ล้างประวัติการเช็คชื่อทั้งหมดแล้ว' });
    } catch (err) {
        console.error('เกิดข้อผิดพลาดในการล้างประวัติการเช็คชื่อทั้งหมด:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการล้างประวัติการเช็คชื่อทั้งหมด' });
    }
});

// 4.3 ดึงสถิติการเข้าเรียน
app.get('/api/attendance/statistics', async (req, res) => {
    try {
        const { classroom, startDate, endDate } = req.query;
        
        if (!classroom || !startDate || !endDate) {
            return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน' });
        }
        
        const statistics = await db.getAttendanceStatistics(classroom, startDate, endDate);
        res.json(statistics);
    } catch (err) {
        console.error('เกิดข้อผิดพลาดในการดึงสถิติการเข้าเรียน:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงสถิติการเข้าเรียน' });
    }
});

// 5. ดึงข้อมูลช่วงเวลา
app.get('/api/time-slots', async (req, res) => {
    try {
        const timeSlots = await db.getTimeSlots();
        res.json(timeSlots);
    } catch (err) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลช่วงเวลา:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลช่วงเวลา' });
    }
});

// 6. เพิ่มช่วงเวลาใหม่
app.post('/api/time-slots', async (req, res) => {
    try {
        const { startTime, endTime, description } = req.body;
        const result = await db.addTimeSlot(startTime, endTime, description);
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        console.error('เกิดข้อผิดพลาดในการเพิ่มช่วงเวลา:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเพิ่มช่วงเวลา' });
    }
});

// 7. ลบช่วงเวลา
app.delete('/api/time-slots/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.deleteTimeSlot(id);
        res.json({ success: true });
    } catch (err) {
        console.error('เกิดข้อผิดพลาดในการลบช่วงเวลา:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบช่วงเวลา' });
    }
});

// 8. ดึงข้อมูลผู้ใช้
app.get('/api/users', async (req, res) => {
    try {
        const users = await db.getUsers();
        res.json(users);
    } catch (err) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' });
    }
});

// 9. ตรวจสอบการเข้าสู่ระบบ
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await db.checkUser(username, password);
        
        if (user) {
            delete user.password;
            user.displayName = user.display_name;
            res.json({ success: true, user });
        } else {
            res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }
    } catch (err) {
        console.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
    }
});

// 10. สมัครสมาชิกใหม่
app.post('/api/register', async (req, res) => {
    try {
        const { username, displayName, email, tel, password } = req.body;
        
        // ตรวจสอบข้อมูลที่จำเป็น
        if (!username || !displayName || !email || !tel || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'กรุณากรอกข้อมูลให้ครบถ้วน' 
            });
        }
        
        // ตรวจสอบรูปแบบข้อมูล
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const telRegex = /^[0-9]{10}$/;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
        
        if (!usernameRegex.test(username)) {
            return res.status(400).json({ 
                success: false, 
                message: 'ชื่อผู้ใช้งานต้องมี 3-20 ตัวอักษร และใช้เฉพาะตัวอักษร ตัวเลข และ _ เท่านั้น' 
            });
        }
        
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'รูปแบบอีเมล์ไม่ถูกต้อง' 
            });
        }
        
        if (!telRegex.test(tel)) {
            return res.status(400).json({ 
                success: false, 
                message: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก' 
            });
        }
        
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ 
                success: false, 
                message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร และมีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก และตัวเลขอย่างน้อยอย่างละ 1 ตัว' 
            });
        }
        
        // ตรวจสอบว่าชื่อผู้ใช้งานซ้ำหรือไม่
        const existingUser = await db.checkUsernameExists(username);
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว' 
            });
        }
        
        // ตรวจสอบว่าอีเมล์ซ้ำหรือไม่
        const existingEmail = await db.checkEmailExists(email);
        if (existingEmail) {
            return res.status(400).json({ 
                success: false, 
                message: 'อีเมล์นี้มีอยู่ในระบบแล้ว' 
            });
        }
        
        // สร้างผู้ใช้ใหม่
        const result = await db.createUser(username, displayName, email, tel, password);
        
        if (result.success) {
            res.json({ 
                success: true, 
                message: 'สมัครสมาชิกสำเร็จ!',
                userId: result.userId 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: result.message || 'เกิดข้อผิดพลาดในการสร้างบัญชีผู้ใช้' 
            });
        }
        
    } catch (err) {
        console.error('เกิดข้อผิดพลาดในการสมัครสมาชิก:', err);
        res.status(500).json({ 
            success: false, 
            message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' 
        });
    }
});

// เสิร์ฟไฟล์ static จาก root (เช่น styles.css, app.js, logo.png)
app.use(express.static(path.join(__dirname, '..')));

// เสิร์ฟไฟล์ภาพในโฟลเดอร์ backgrounds
app.use('/backgrounds', express.static(path.join(__dirname, 'backgrounds')));

// เสิร์ฟ index.html เมื่อเข้า /
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// 10. ตรวจสอบสถานะการเชื่อมต่อฐานข้อมูล
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'เซิร์ฟเวอร์ทำงานปกติ',
        database: 'MySQL',
        timestamp: new Date().toISOString()
    });
});

// เพิ่ม route สำหรับดึงภาพพื้นหลัง
app.get('/api/backgrounds', (req, res) => {
    const dirPath = path.join(__dirname, 'backgrounds');
    fs.readdir(dirPath, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'ไม่สามารถอ่านโฟลเดอร์ภาพพื้นหลังได้' });
        }
        const imageFiles = files.filter(f => /\.(jpg|jpeg|png)$/i.test(f));
        const urls = imageFiles.map(f => `/backgrounds/${f}`);
        res.json(urls);
    });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 เซิร์ฟเวอร์ทำงานที่พอร์ต ${PORT}`);
    console.log(`📡 API พร้อมใช้งานที่ http://localhost:${PORT}`);
    console.log(`🔗 ตรวจสถานะ: http://localhost:${PORT}/api/health`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Database: ${process.env.DB_HOST ? 'Configured' : 'Not configured'}`);
});
