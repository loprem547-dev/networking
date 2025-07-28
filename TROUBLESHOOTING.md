# คู่มือแก้ไขปัญหา (Troubleshooting Guide)

## ปัญหาการเชื่อมต่อฐานข้อมูล

### 1. ตรวจสอบ MySQL Server
```bash
# Windows (ถ้าใช้ XAMPP)
# เปิด XAMPP Control Panel และกด Start ที่ MySQL

# Windows (ถ้าติดตั้ง MySQL แยก)
# เปิด Services.msc และตรวจสอบว่า MySQL ทำงานอยู่

# Linux/Mac
sudo systemctl status mysql
# หรือ
sudo service mysql status
```

### 2. ตรวจสอบการตั้งค่าการเชื่อมต่อ
แก้ไขไฟล์ `backend/database.js`:
```javascript
const connection = mysql.createConnection({
    host: 'localhost',           // หรือ IP address ของ MySQL Server
    user: 'root',               // username ของ MySQL
    password: 'root',           // password ของ MySQL (แก้ไขตามที่ตั้งไว้)
    database: 'student_db',     // ชื่อฐานข้อมูล
    port: 3306                  // port ของ MySQL (ปกติ 3306)
});
```

### 3. สร้างฐานข้อมูล
1. เปิด MySQL Workbench หรือ phpMyAdmin
2. รันไฟล์ `student_db_setup.sql`
3. หรือรันคำสั่ง SQL ต่อไปนี้:

```sql
-- สร้างฐานข้อมูล
CREATE DATABASE IF NOT EXISTS student_db;
USE student_db;

-- สร้างตารางต่างๆ (ดูไฟล์ student_db_setup.sql)
```

### 4. ตรวจสอบสิทธิ์ผู้ใช้
```sql
-- ตรวจสอบผู้ใช้
SELECT User, Host FROM mysql.user WHERE User = 'root';

-- สร้างผู้ใช้ใหม่ (ถ้าจำเป็น)
CREATE USER 'root'@'localhost' IDENTIFIED BY 'root';
GRANT ALL PRIVILEGES ON student_db.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

### 5. ทดสอบการเชื่อมต่อ
```bash
# ใช้ MySQL command line
mysql -u root -p -h localhost

# หรือใช้ Node.js
node -e "
const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'student_db'
});
connection.connect((err) => {
    if (err) {
        console.error('Error:', err.message);
    } else {
        console.log('Connected successfully!');
    }
    connection.end();
});
"
```

## ปัญหาการรันเซิร์ฟเวอร์

### 1. ติดตั้ง Dependencies
```bash
cd backend
npm install
```

### 2. ตรวจสอบ Port
```bash
# ตรวจสอบว่า port 3001 ไม่ถูกใช้งาน
netstat -an | grep 3001
# หรือ
lsof -i :3001
```

### 3. รันเซิร์ฟเวอร์
```bash
cd backend
npm start
```

## ปัญหาการเข้าถึง API

### 1. ตรวจสอบ CORS
ถ้าเกิดปัญหา CORS ให้แก้ไขไฟล์ `backend/server.js`:
```javascript
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'file://'],
    credentials: true
}));
```

### 2. ทดสอบ API
```bash
# ทดสอบ health check
curl http://localhost:3001/api/health

# ทดสอบ login
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## ปัญหาการแสดงข้อมูลในหน้าเว็บ

### 1. ตรวจสอบ Console
เปิด Developer Tools (F12) และดู Console tab

### 2. ตรวจสอบ Network
ดู Network tab ใน Developer Tools เพื่อตรวจสอบ API calls

### 3. ทดสอบการเชื่อมต่อ
เปิดไฟล์ `index.html` และทดสอบการเข้าสู่ระบบ

## ข้อความผิดพลาดที่พบบ่อย

### ER_ACCESS_DENIED_ERROR
- ตรวจสอบ username/password
- ตรวจสอบสิทธิ์ผู้ใช้

### ECONNREFUSED
- MySQL Server ไม่ทำงาน
- Port ไม่ถูกต้อง

### ER_BAD_DB_ERROR
- ฐานข้อมูลไม่มีอยู่
- รันไฟล์ `student_db_setup.sql`

### ER_NO_SUCH_TABLE
- ตารางไม่มีอยู่
- รันไฟล์ `student_db_setup.sql`

## การแก้ไขปัญหาแบบทีละขั้นตอน

1. **ตรวจสอบ MySQL Server**
   - เปิด XAMPP/WAMP หรือ MySQL Service
   - ทดสอบการเชื่อมต่อด้วย MySQL Workbench

2. **สร้างฐานข้อมูล**
   - รันไฟล์ `student_db_setup.sql`
   - ตรวจสอบว่าตารางถูกสร้างแล้ว

3. **ตั้งค่าการเชื่อมต่อ**
   - แก้ไขไฟล์ `backend/database.js`
   - ตรวจสอบ username/password

4. **รันเซิร์ฟเวอร์**
   ```bash
   cd backend
   npm install
   npm start
   ```

5. **ทดสอบการทำงาน**
   - เปิดไฟล์ `index.html`
   - เข้าสู่ระบบด้วย admin/admin123
   - ทดสอบการโหลดข้อมูลนักเรียน

## ติดต่อขอความช่วยเหลือ

หากยังมีปัญหา กรุณาแจ้ง:
- ข้อความผิดพลาดที่แสดง
- ระบบปฏิบัติการที่ใช้
- เวอร์ชันของ MySQL
- ขั้นตอนที่ทำก่อนเกิดปัญหา 