# 🚀 Quick Start Guide - Networking Project

## ⚡ 5 ขั้นตอนง่ายๆ ในการ Deploy

### 1️⃣ สร้าง GitHub Repository
```bash
# ในโฟลเดอร์โปรเจค
git init
git add .
git commit -m "Initial commit: Networking Project"
git remote add origin https://github.com/YOUR_USERNAME/networking.git
git push -u origin main
```

### 2️⃣ Deploy บน Railway
1. ไปที่ [Railway.app](https://railway.app)
2. กด "Start Deploying" > "Deploy with GitHub"
3. เลือก repository `networking`
4. กด "Deploy Now"

### 3️⃣ เพิ่ม MySQL Database
1. ใน Railway project กด "New" > "Database" > "MySQL"
2. Copy connection details
3. ไปที่ "Variables" และเพิ่ม:
   ```
   DB_HOST=your_mysql_host
   DB_USER=your_mysql_user
   DB_PASSWORD=your_mysql_password
   DB_NAME=student_attendance
   DB_PORT=3306
   NODE_ENV=production
   FRONTEND_URL=https://www.attscommu.site
   ```

### 4️⃣ ตั้งค่า Custom Domain
1. ใน Railway กด "Settings" > "Domains"
2. เพิ่ม domain: `www.attscommu.site`
3. ตั้งค่า DNS records ใน domain provider

### 5️⃣ Import Database
1. ใช้ไฟล์ `database_setup.sql`
2. Import เข้า MySQL บน Railway
3. ตรวจสอบ API: `https://www.attscommu.site/api/health`

## ✅ ตรวจสอบการทำงาน
```bash
# Health check
curl https://www.attscommu.site/api/health

# Test API
curl https://www.attscommu.site/api/students
curl https://www.attscommu.site/api/classrooms
```

## 🎯 เป้าหมาย
- **GitHub**: Repository ชื่อ "networking"
- **Railway**: Deploy อัตโนมัติ
- **Domain**: www.attscommu.site
- **Status**: ✅ Live & Working

## 🆘 ปัญหาที่พบบ่อย
- **Build Failed**: ตรวจสอบ `package.json`
- **Database Error**: ตรวจสอบ Environment Variables
- **Domain Not Working**: รอ DNS propagation

## 📞 ขอความช่วยเหลือ
- อ่าน `DEPLOY.md` สำหรับรายละเอียด
- สร้าง Issue บน GitHub
- Email: support@attscommu.site 