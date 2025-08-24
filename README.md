# Networking - Student Attendance System

ระบบจัดการการเข้าเรียนของนักเรียนที่พัฒนาด้วย Node.js, Express และ MySQL

## 🌐 Live Demo
- **Website**: [www.attscommu.site](https://www.attscommu.site)
- **Backend API**: [https://networking-production.up.railway.app](https://networking-production.up.railway.app)

## 🚀 Features
- ระบบจัดการข้อมูลนักเรียน
- ระบบบันทึกการเข้าเรียน
- ระบบจัดการชั้นเรียน
- API สำหรับ Frontend และ Mobile App
- ระบบฐานข้อมูล MySQL

## 🛠️ Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Authentication**: bcrypt
- **CORS**: Enabled for cross-origin requests
- **Deployment**: Railway

## 📁 Project Structure
```
attscommu/
├── backend/
│   ├── server.js          # Main server file
│   ├── database.js        # Database connection & queries
│   └── backgrounds/       # Background images
├── index.html             # Main frontend
├── register.html          # Registration page
├── styles.css             # CSS styles
├── app.js                 # Frontend JavaScript
└── package.json           # Dependencies
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MySQL Database
- npm or yarn

### Installation
1. Clone the repository
```bash
git clone https://github.com/yourusername/networking.git
cd networking
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Set up database
```bash
mysql -u root -p < database_setup.sql
```

5. Start the server
```bash
npm start
```

## 🌐 API Endpoints

### Students
- `GET /api/students` - Get all students
- `GET /api/students?classroom=1` - Get students by classroom
- `PUT /api/students/:id/status` - Update student status

### Classrooms
- `GET /api/classrooms` - Get all classrooms

### Attendance
- `GET /api/attendance` - Get attendance data
- `GET /api/attendance?date=2024-01-01` - Get attendance by date

## 🚀 Deployment

### Railway
This project is configured for Railway deployment with:
- Automatic builds from GitHub
- Environment variable management
- Custom domain support

### Environment Variables for Railway
- `DB_HOST` - Database host
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `PORT` - Server port (Railway sets this automatically)

## 📝 License
MIT License

## 👥 Contributors
- Your Name - Initial work

## 🤝 Support
For support, email support@attscommu.site or create an issue on GitHub. 