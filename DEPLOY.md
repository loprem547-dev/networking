# 🚀 Deployment Guide - Networking Project

## 📋 Prerequisites
- GitHub account
- Railway account (free tier available)
- Domain name: www.attscommu.site

## 🔄 Step 1: Push to GitHub

### 1.1 Initialize Git Repository
```bash
git init
git add .
git commit -m "Initial commit: Networking - Student Attendance System"
```

### 1.2 Create GitHub Repository
1. ไปที่ [GitHub.com](https://github.com)
2. กด "New repository"
3. ตั้งชื่อ: `networking`
4. เลือก "Public" หรือ "Private"
5. กด "Create repository"

### 1.3 Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/networking.git
git branch -M main
git push -u origin main
```

## 🚂 Step 2: Deploy on Railway

### 2.1 สมัคร Railway
1. ไปที่ [Railway.app](https://railway.app)
2. กด "Start Deploying"
3. เลือก "Deploy with GitHub"
4. Authorize Railway ให้เข้าถึง GitHub

### 2.2 Create New Project
1. กด "New Project"
2. เลือก "Deploy from GitHub repo"
3. เลือก repository `networking`
4. กด "Deploy Now"

### 2.3 Set Environment Variables
ใน Railway dashboard:

1. **Database Variables:**
   ```
   DB_HOST=your_mysql_host
   DB_USER=your_mysql_user
   DB_PASSWORD=your_mysql_password
   DB_NAME=student_attendance
   DB_PORT=3306
   ```

2. **Server Variables:**
   ```
   NODE_ENV=production
   FRONTEND_URL=https://www.attscommu.site
   ```

### 2.4 Add MySQL Database
1. ใน Railway project กด "New"
2. เลือก "Database" > "MySQL"
3. Railway จะสร้าง MySQL instance ให้
4. Copy connection details ไปใส่ใน Environment Variables

## 🌐 Step 3: Custom Domain Setup

### 3.1 Add Custom Domain
1. ใน Railway project กด "Settings"
2. เลือก "Domains"
3. กด "Add Domain"
4. ใส่: `www.attscommu.site`

### 3.2 DNS Configuration
ใน DNS provider ของคุณ (เช่น Cloudflare, GoDaddy):

**Type A Record:**
```
Name: www
Value: Railway IP address (จาก Railway dashboard)
TTL: 300
```

**Type CNAME Record:**
```
Name: @
Value: www.attscommu.site
TTL: 300
```

## 🔧 Step 4: Database Setup

### 4.1 Import Database Schema
1. ใช้ไฟล์ `database_setup.sql` หรือ `student_db_setup.sql`
2. Import เข้า MySQL database บน Railway
3. ใช้ MySQL Workbench หรือ phpMyAdmin

### 4.2 Verify Database Connection
ตรวจสอบว่า API เชื่อมต่อฐานข้อมูลได้:
```bash
curl https://www.attscommu.site/api/students
```

## ✅ Step 5: Verification

### 5.1 Health Check
```bash
curl https://www.attscommu.site/
```

### 5.2 API Test
```bash
# Test students endpoint
curl https://www.attscommu.site/api/students

# Test classrooms endpoint
curl https://www.attscommu.site/api/classrooms
```

## 🚨 Troubleshooting

### Common Issues:
1. **Build Failed**: ตรวจสอบ `package.json` และ dependencies
2. **Database Connection Error**: ตรวจสอบ Environment Variables
3. **Domain Not Working**: รอ DNS propagation (อาจใช้เวลา 24-48 ชั่วโมง)
4. **CORS Error**: ตรวจสอบ `FRONTEND_URL` ใน Environment Variables

### Railway Logs:
1. ใน Railway dashboard กด "Deployments"
2. เลือก deployment ล่าสุด
3. กด "View Logs" เพื่อดู error messages

## 📱 Mobile App Integration

### API Base URL:
```
https://www.attscommu.site/api
```

### CORS Configuration:
Railway จะจัดการ CORS ให้อัตโนมัติตาม `FRONTEND_URL` ที่ตั้งไว้

## 🔄 Continuous Deployment

Railway จะ deploy อัตโนมัติทุกครั้งที่ push code ขึ้น GitHub main branch

## 📞 Support
- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- GitHub Issues: [github.com/YOUR_USERNAME/networking/issues](https://github.com/YOUR_USERNAME/networking/issues)
- Email: support@attscommu.site 