-- สร้างฐานข้อมูล attendance_system
CREATE DATABASE IF NOT EXISTS attendance_system;
USE attendance_system;

-- สร้างตารางผู้ใช้ (users)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'teacher', 'commu') NOT NULL DEFAULT 'teacher',
    display_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตารางนักเรียน (students)
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    classroom VARCHAR(50) NOT NULL,
    status ENUM('present', 'absent', 'sick', 'activity', 'home') DEFAULT 'present',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตารางการเข้าเรียน (attendance)
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    status ENUM('present', 'absent', 'sick', 'activity', 'home') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- สร้างตารางช่วงเวลา (time_slots)
CREATE TABLE IF NOT EXISTS time_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    description VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- เพิ่มข้อมูลผู้ใช้เริ่มต้น
INSERT INTO users (username, password, role, display_name) VALUES
('admin', 'admin123', 'admin', 'ผู้ดูแลระบบ'),
('teacher1', 'teach123', 'teacher', 'อ.สมศรี'),
('teacher2', 'teach456', 'teacher', 'อ.สมชาย'),
('commu', 'attscommu', 'commu', 'แผนกวิชาสื่อสาร');

-- เพิ่มข้อมูลช่วงเวลาเริ่มต้น
INSERT INTO time_slots (start_time, end_time, description) VALUES
('08:00:00', '12:00:00', '🌅 ภาคเช้า'),
('13:00:00', '16:00:00', '☀️ ภาคบ่าย');

-- เพิ่มข้อมูลนักเรียนตัวอย่าง
INSERT INTO students (student_id, name, classroom) VALUES
('6401234567', 'สมชาย ใจดี', 'y1-com-sec-1'),
('6401234568', 'สมหญิง รักเรียน', 'y1-com-sec-1'),
('6401234569', 'สมศักดิ์ มั่นคง', 'y1-com-sec-1'),
('6401234570', 'สมปอง ตั้งใจ', 'y1-com-sec-2'),
('6401234571', 'สมพร สดใส', 'y1-com-sec-2'),
('6401234572', 'สมบูรณ์ ครบถ้วน', 'y1-com-sec-2'),
('6401234573', 'สมหมาย หมายมั่น', 'y1-com-sec-3'),
('6401234574', 'สมศรี สวยงาม', 'y1-com-sec-3'),
('6401234575', 'สมศิริ ดีงาม', 'y1-com-sec-3'),
('6401234576', 'สมชาย คอมพิวเตอร์', 'y1-com-comp'),
('6401234577', 'สมหญิง ไอที', 'y1-com-comp'),
('6401234578', 'สมศักดิ์ เทคโนโลยี', 'y1-com-comp'),
('6501234567', 'ปีที่2 คนที่1', 'y2-com-sec-1'),
('6501234568', 'ปีที่2 คนที่2', 'y2-com-sec-1'),
('6501234569', 'ปีที่2 คนที่3', 'y2-com-sec-1'),
('6501234570', 'ปีที่2 คนที่4', 'y2-com-sec-2'),
('6501234571', 'ปีที่2 คนที่5', 'y2-com-sec-2'),
('6501234572', 'ปีที่2 คนที่6', 'y2-com-sec-2'),
('6501234573', 'ปีที่2 คนที่7', 'y2-com-sec-3'),
('6501234574', 'ปีที่2 คนที่8', 'y2-com-sec-3'),
('6501234575', 'ปีที่2 คนที่9', 'y2-com-sec-3'),
('6501234576', 'ปีที่2 คนที่10', 'y2-com-comp'),
('6501234577', 'ปีที่2 คนที่11', 'y2-com-comp'),
('6501234578', 'ปีที่2 คนที่12', 'y2-com-comp');

-- สร้าง Index เพื่อเพิ่มประสิทธิภาพการค้นหา
CREATE INDEX idx_students_classroom ON students(classroom);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_student_date ON attendance(student_id, date); 