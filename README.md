# ระบบเช็คชื่อนักเรียน (Student Attendance System)

ระบบเช็คชื่อนักเรียนที่พัฒนาด้วย Node.js, Express และ MySQL

## การ Deploy บน Railway

### ขั้นตอนที่ 1: เตรียม Repository
1. สร้าง repository บน GitHub
2. Push โค้ดขึ้น GitHub

### ขั้นตอนที่ 2: Deploy บน Railway
1. ไปที่ [Railway.app](https://railway.app)
2. สมัครสมาชิกด้วย GitHub
3. กด "New Project" > "Deploy from GitHub repo"
4. เลือก repository ของคุณ
5. Railway จะ deploy อัตโนมัติ

### ขั้นตอนที่ 3: ตั้งค่าฐานข้อมูล
1. ใน Railway dashboard กด "New" > "Database" > "MySQL"
2. ตั้งค่า Environment Variables:
   - `DB_HOST`: host ของ MySQL (จาก Railway)
   - `DB_USER`: username ของ MySQL
   - `DB_PASSWORD`: password ของ MySQL
   - `DB_NAME`: ชื่อฐานข้อมูล
   - `DB_PORT`: 3306
   - `FRONTEND_URL`: URL ของ frontend (ถ้ามี)

### ขั้นตอนที่ 4: Import ฐานข้อมูล
1. ใช้ไฟล์ `database_setup.sql` หรือ `student_db_setup.sql`
2. Import เข้าฐานข้อมูล MySQL บน Railway

## การใช้งาน
- API จะทำงานที่ URL ที่ Railway ให้
- ตรวจสอบสถานะ: `{URL}/api/health`
- Frontend: `{URL}/`

## Environment Variables
- `PORT`: พอร์ตที่เซิร์ฟเวอร์จะทำงาน (Railway จะตั้งให้อัตโนมัติ)
- `DB_HOST`: MySQL host
- `DB_USER`: MySQL username
- `DB_PASSWORD`: MySQL password
- `DB_NAME`: MySQL database name
- `DB_PORT`: MySQL port (ปกติ 3306)
- `FRONTEND_URL`: URL ของ frontend (ถ้ามี) 