// User credentials (ในระบบจริงควรเก็บในฐานข้อมูล)
const users = [
    { username: 'admin', password: 'admin123', role: 'admin', displayName: 'ผู้ดูแลระบบ' },
    { username: 'teacher1', password: 'teach123', role: 'teacher', displayName: 'อ.สมศรี' },
    { username: 'teacher2', password: 'teach456', role: 'teacher', displayName: 'อ.สมชาย' },
    { username: 'commu', password: 'attscommu', role: 'commu', displayName: 'แผนกวิชาสื่อสาร' }
];

// Current user
let currentUser = null;

// Global variables
let students = [];
let attendanceData = {};
let currentClassroom = '';
let timeSlots = [
    { id: 'morning', name: '🌅 ภาคเช้า', time: '08:00 - 12:00' },
    { id: 'afternoon', name: '☀️ ภาคบ่าย', time: '13:00 - 16:00' }
];

// Background slideshow variables
let backgroundImages = [];
let currentImageIndex = 0;
let slideshowInterval = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadTimeSlots();
    loadBackgroundImages();
    startSlideshow();
    // เพิ่ม event สำหรับอัปโหลดรูปโปรไฟล์
    const profilePicInput = document.getElementById('profilePicInput');
    const profilePicPreview = document.getElementById('profilePicPreview');
    if (profilePicInput && profilePicPreview) {
        profilePicInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    profilePicPreview.src = evt.target.result;
                    profilePicPreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                profilePicPreview.src = '';
                profilePicPreview.style.display = 'none';
            }
        });
    }
});

// Check if user is logged in
function checkAuth() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainApp();
    } else {
        showLoginScreen();
    }
}

// Show login screen
function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
}

// Show main app
function showMainApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('userDisplay').textContent = `👤 ${currentUser.displayName}`;
    
    // Set teacher name if user is teacher
    if (currentUser.role === 'teacher') {
        document.getElementById('teacherName').value = currentUser.displayName;
    }
    
    // Show/hide admin-only buttons
    toggleAdminButtons();
    
    // Initialize app
    updateCurrentDate();
    loadSavedData();
    
    // โหลดข้อมูลชั้นเรียนและคาบเรียนจากฐานข้อมูล
    loadClassrooms();
    loadTimeSlotsFromDB();
    updateUserProfilePicSmall();
}

// Toggle admin-only buttons visibility
function toggleAdminButtons() {
    const isAdmin = currentUser && currentUser.role === 'admin';
    
    // Hide/show all admin-only buttons
    const adminButtons = document.querySelectorAll('.admin-only');
    adminButtons.forEach(button => {
        button.style.display = isAdmin ? 'block' : 'none';
    });
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('https://web-production-9c35d.up.railway.app/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(data.user));
        document.getElementById('loginError').style.display = 'none';
        showMainApp();
    } else {
        document.getElementById('loginError').textContent = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
            document.getElementById('loginError').style.display = 'block';
        }
    } catch (error) {
        console.error('Login error:', error);
        document.getElementById('loginError').textContent = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
        document.getElementById('loginError').style.display = 'block';
    }
}

// Logout
function logout() {
    if (confirm('ต้องการออกจากระบบหรือไม่?')) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        showLoginScreen();
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    }
}

// Update current date
function updateCurrentDate() {
    const date = new Date();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    document.getElementById('currentDate').textContent = date.toLocaleDateString('th-TH', options);
    document.getElementById('reportDate').value = date.toISOString().split('T')[0];
}

// Switch tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');

    // Update attendance info when switching to attendance tab
    if (tabName === 'attendance') {
        updateAttendanceInfo();
    }
    
    // Refresh data when switching to report tab
    if (tabName === 'report') {
        refreshReportData();
    }
    
    // Refresh data when switching to statistics tab
    if (tabName === 'statistics') {
        refreshStatisticsData();
    }
}

// รีเฟรชข้อมูลในแท็บรายงาน
function refreshReportData() {
    const reportDate = document.getElementById('reportDate');
    const exportClassroom = document.getElementById('exportClassroom');
    const exportTimeSlot = document.getElementById('exportTimeSlot');
    
    // ล้างข้อมูลเก่า
    const reportBody = document.getElementById('reportBody');
    const reportTable = document.getElementById('reportTable');
    const exportSection = document.getElementById('exportSection');
    
    if (reportBody) reportBody.innerHTML = '';
    if (reportTable) reportTable.style.display = 'none';
    if (exportSection) exportSection.innerHTML = '';
    
    // รีเซ็ตฟอร์ม
    if (reportDate) reportDate.value = '';
    if (exportClassroom) exportClassroom.value = '';
    if (exportTimeSlot) exportTimeSlot.value = '';
}

// รีเฟรชข้อมูลในแท็บสถิติ
function refreshStatisticsData() {
    const statsClassroom = document.getElementById('statsClassroom');
    const statsStartDate = document.getElementById('statsStartDate');
    const statsEndDate = document.getElementById('statsEndDate');
    
    // ล้างข้อมูลเก่า
    const statsBody = document.getElementById('statsBody');
    const statsTable = document.getElementById('statsTable');
    
    if (statsBody) statsBody.innerHTML = '';
    if (statsTable) statsTable.style.display = 'none';
    
    // รีเซ็ตฟอร์ม
    if (statsClassroom) statsClassroom.value = '';
    if (statsStartDate) statsStartDate.value = '';
    if (statsEndDate) statsEndDate.value = '';
}

// Load saved data from localStorage
function loadSavedData() {
    const savedStudents = localStorage.getItem('students');
    const savedAttendance = localStorage.getItem('attendanceData');
    
    if (savedStudents) {
        students = JSON.parse(savedStudents);
    }
    
    if (savedAttendance) {
        attendanceData = JSON.parse(savedAttendance);
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('students', JSON.stringify(students));
    localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
}

// Update class options based on year level
function updateClassOptions() {
    const yearLevel = document.getElementById('yearLevel').value;
    const classSelect = document.getElementById('classSelect');
    
    classSelect.innerHTML = '<option value="">-- เลือกตอนเรียน --</option>';
    
    if (yearLevel === '1') {
        classSelect.innerHTML += `
            <option value="y1-com-sec-1">📱 สื่อสารตอน 1</option>
            <option value="y1-com-sec-2">📱 สื่อสารตอน 2</option>
            <option value="y1-com-sec-3">📱 สื่อสารตอน 3</option>
            <option value="y1-com-comp">💻 สื่อสารคอม</option>
        `;
        classSelect.disabled = false;
    } else if (yearLevel === '2') {
        classSelect.innerHTML += `
            <option value="y2-com-sec-1">📱 สื่อสารตอน 1</option>
            <option value="y2-com-sec-2">📱 สื่อสารตอน 2</option>
            <option value="y2-com-sec-3">📱 สื่อสารตอน 3</option>
            <option value="y2-com-comp">💻 สื่อสารคอม</option>
        `;
        classSelect.disabled = false;
    } else {
        classSelect.disabled = true;
    }
}

// ดึงข้อมูลนักเรียนจาก MySQL ผ่าน API
async function fetchStudentsFromMySQL() {
    const classroom = document.getElementById('classSelect').value;
    if (!classroom) return;
    try {
        const res = await fetch(`http://localhost:3001/api/students?classroom=${encodeURIComponent(classroom)}`);
        if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลนักเรียนจาก MySQL ได้');
        students = await res.json();
        displayStudents(students);
    } catch (err) {
        showAlert('เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล', 'error');
        students = [];
        displayStudents([]);
    }
}

// ปรับ loadStudents ให้เรียก fetchStudentsFromMySQL แทน
function loadStudents() {
    fetchStudentsFromMySQL();
}

// ฟังก์ชันเมื่อเลือกห้องเรียน
function onClassroomChange() {
    const classroom = document.getElementById('classSelect').value;
    if (classroom) {
        fetchStudentsFromMySQL();
        updateAttendanceInfo();
    } else {
        // ล้างข้อมูลเมื่อไม่ได้เลือกห้องเรียน
        students = [];
        displayStudents([]);
    }
}

// Display students in attendance grid
function displayStudents(studentList) {
    const grid = document.getElementById('attendanceGrid');
    grid.innerHTML = '';

    studentList.forEach(student => {
        const card = document.createElement('div');
        card.className = `student-card ${student.status || 'present'}`;
        card.innerHTML = `
            <div class="student-name">${student.name}</div>
            <div class="student-id">รหัส: ${student.student_id}</div>
            <div class="status-buttons">
                <button class="status-btn ${student.status === 'present' ? 'active' : ''}" 
                        onclick="setStatus('${student.student_id}', 'present')" style="background: #28a745; color: white;">
                    มา
                </button>
                <button class="status-btn ${student.status === 'absent' ? 'active' : ''}" 
                        onclick="setStatus('${student.student_id}', 'absent')" style="background: #dc3545; color: white;">
                    ขาด
                </button>
                <button class="status-btn ${student.status === 'sick' ? 'active' : ''}" 
                        onclick="setStatus('${student.student_id}', 'sick')" style="background: #ffc107; color: #333;">
                    ป่วย
                </button>
                <button class="status-btn ${student.status === 'activity' ? 'active' : ''}" 
                        onclick="setStatus('${student.student_id}', 'activity')" style="background: #17a2b8; color: white;">
                    กิจกรรม
                </button>
                <button class="status-btn ${student.status === 'home' ? 'active' : ''}" 
                        onclick="setStatus('${student.student_id}', 'home')" style="background: #6c757d; color: white;">
                    กลับบ้าน
                </button>
            </div>
        `;
        grid.appendChild(card);
    });

    updateSummary();
}

// Set student status
async function setStatus(studentId, status) {
    const classroom = document.getElementById('classSelect').value;
    
    if (!classroom) {
        showAlert('กรุณาเลือกตอนเรียนก่อน', 'error');
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:3001/api/students/${studentId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status, classroom })
        });
        
        if (response.ok) {
            // อัพเดทข้อมูลในหน้าเว็บ
            const student = students.find(s => s.student_id === studentId);
    if (student) {
        student.status = status;
                displayStudents(students);
                updateSummary();
            }
        } else {
            const errorData = await response.json();
            showAlert(errorData.error || 'เกิดข้อผิดพลาดในการอัพเดทสถานะ', 'error');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showAlert('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
}

// Update attendance summary
function updateSummary() {
    const classroom = document.getElementById('classSelect').value;
    const classStudents = students.filter(s => s.classroom === classroom);
    
    const counts = {
        present: 0,
        absent: 0,
        sick: 0,
        activity: 0,
        home: 0
    };

    classStudents.forEach(student => {
        counts[student.status || 'present']++;
    });

    document.getElementById('presentCount').textContent = counts.present;
    document.getElementById('absentCount').textContent = counts.absent;
    document.getElementById('sickCount').textContent = counts.sick;
    document.getElementById('activityCount').textContent = counts.activity;
    document.getElementById('homeCount').textContent = counts.home;
}

// Update attendance info
function updateAttendanceInfo() {
    const yearLevel = document.getElementById('yearLevel').value;
    const classSelect = document.getElementById('classSelect').value;
    
    // แสดงชั้นปี
    const yearText = {
        '1': 'ชั้นปีที่ 1',
        '2': 'ชั้นปีที่ 2'
    };
    document.getElementById('currentYear').textContent = yearText[yearLevel] || '-';
    
    // แสดงตอนเรียน
    const classText = {
        'y1-com-sec-1': '📱 สื่อสารตอน 1',
        'y1-com-sec-2': '📱 สื่อสารตอน 2',
        'y1-com-sec-3': '📱 สื่อสารตอน 3',
        'y1-com-comp': '💻 สื่อสารคอม',
        'y2-com-sec-1': '📱 สื่อสารตอน 1',
        'y2-com-sec-2': '📱 สื่อสารตอน 2',
        'y2-com-sec-3': '📱 สื่อสารตอน 3',
        'y2-com-comp': '💻 สื่อสารคอม'
    };
    document.getElementById('currentClass').textContent = 
        classText[classSelect] || '-';
    document.getElementById('currentTeacher').textContent = 
        document.getElementById('teacherName').value || '-';
    
    const timeSlot = document.getElementById('timeSlot').value;
    const selectedSlot = timeSlots.find(s => s.id === timeSlot);
    document.getElementById('currentTimeSlot').textContent = 
        selectedSlot ? selectedSlot.name : '-';
}

// Save attendance
async function saveAttendance() {
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('th-TH');
    const teacher = document.getElementById('teacherName').value;
    const timeSlot = document.getElementById('timeSlot').value;
    const classroom = document.getElementById('classSelect').value;

    if (!classroom || !teacher || !timeSlot) {
        showAlert('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
        return;
    }

    const classStudents = students.filter(s => s.classroom === classroom);
    
    try {
        // ลบข้อมูลการเช็คชื่อเก่าในวันและช่วงเวลานี้
        const selectedSlot = timeSlots.find(s => s.id === timeSlot);
        const timeSlotText = selectedSlot ? selectedSlot.name : timeSlot;
        
        await fetch(`http://localhost:3001/api/attendance/clear`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                date,
                timeSlot: timeSlotText,
                classroom,
                currentUser: currentUser
            })
        });
        
        // บันทึกข้อมูลใหม่ทีละคน
        for (const student of classStudents) {
            await fetch('http://localhost:3001/api/attendance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    studentId: student.student_id,
                    date,
                    timeSlot: timeSlotText,
                    status: student.status || 'present'
                })
            });
        }
        
        showAlert('บันทึกการเช็กชื่อสำเร็จ (ลบข้อมูลเก่าแล้ว)', 'success');
        
        // รีเซ็ตสถานะนักเรียน
        classStudents.forEach(student => {
            student.status = null;
        });
        displayStudents(classStudents);
        updateSummary();
        
        // รีเฟรชข้อมูลในแท็บรายงานและสถิติ
        refreshReportData();
        refreshStatisticsData();
        
    } catch (error) {
        console.error('Error saving attendance:', error);
        showAlert('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    }
}

// Load report
async function loadReport() {
    const date = document.getElementById('reportDate').value;
    const classroom = document.getElementById('exportClassroom').value;
    const timeSlot = document.getElementById('exportTimeSlot').value;
    const tbody = document.getElementById('reportBody');
    const table = document.getElementById('reportTable');
    const loading = document.getElementById('loading');

    tbody.innerHTML = '';
    
    if (!date) {
        table.style.display = 'none';
        return;
    }

    loading.classList.add('active');
    
    try {
        let url = `http://localhost:3001/api/attendance?date=${date}`;
        if (classroom) url += `&classroom=${encodeURIComponent(classroom)}`;
        if (timeSlot) url += `&timeSlot=${encodeURIComponent(timeSlot)}`;
        
        const response = await fetch(url);
        const records = await response.json();
        
        if (records.length === 0) {
            table.style.display = 'none';
            loading.classList.remove('active');
            return;
        }
        
        // จัดกลุ่มข้อมูลตาม time_slot
        const groupedRecords = groupRecordsByTimeSlot(records);
        
        // แสดงข้อมูลในตาราง
        Object.keys(groupedRecords).forEach(timeSlot => {
            const records = groupedRecords[timeSlot];
            
            // เพิ่มหัวข้อสำหรับแต่ละ time slot
            const headerRow = tbody.insertRow();
            headerRow.className = 'time-slot-header';
            headerRow.innerHTML = `
                <td colspan="6" style="background: #007bff; color: white; font-weight: bold; text-align: center;">
                    📅 ${timeSlot} - ${date}
                </td>
            `;
            
            // แสดงข้อมูลนักเรียนในแต่ละ time slot
            records.forEach(record => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${record.student_id}</td>
                    <td>${record.student_name}</td>
                    <td><span class="status-badge ${record.status}">${getStatusText(record.status)}</span></td>
                    <td>${record.time_slot}</td>
                    <td>${formatDate(record.created_at)}</td>
                    <td>
                        <button onclick="exportTimeSlotToExcel('${date}', '${timeSlot}')" class="btn-export">
                            📊 ส่งออก Excel
                        </button>
                    </td>
                `;
            });
        });

        loading.classList.remove('active');
        table.style.display = 'table';
        
        // แสดงปุ่มส่งออกทั้งหมด
        showExportAllButton(date, classroom, timeSlot);
    } catch (error) {
        console.error('Error loading report:', error);
        showAlert('เกิดข้อผิดพลาดในการโหลดรายงาน', 'error');
        loading.classList.remove('active');
    }
}

// Get status text in Thai
function getStatusText(status) {
    const statusMap = {
        'present': 'มาเรียน',
        'absent': 'ขาดเรียน',
        'sick': 'ลาป่วย',
        'activity': 'ไปกิจกรรม',
        'home': 'ลากลับบ้าน'
    };
    return statusMap[status] || status;
}

// จัดกลุ่มข้อมูลตาม time slot
function groupRecordsByTimeSlot(records) {
    const grouped = {};
    records.forEach(record => {
        if (!grouped[record.time_slot]) {
            grouped[record.time_slot] = [];
        }
        grouped[record.time_slot].push(record);
    });
    return grouped;
}

// แสดงปุ่มส่งออกทั้งหมด
function showExportAllButton(date, classroom, timeSlot) {
    const exportSection = document.getElementById('exportSection');
    if (!exportSection) return;
    
    let buttonText = '📊 ส่งออกรายงานทั้งหมดเป็น Excel';
    if (classroom) {
        buttonText = `📊 ส่งออกรายงาน ${classroom} เป็น Excel`;
    }
    if (timeSlot) {
        buttonText = `📊 ส่งออกรายงาน ${timeSlot} เป็น Excel`;
    }
    
    exportSection.innerHTML = `
        <button onclick="exportAllToExcel('${date}', '${classroom || ''}', '${timeSlot || ''}')" class="btn-export-all">
            ${buttonText}
        </button>
    `;
}

// ส่งออก Excel สำหรับ time slot เดียว
async function exportTimeSlotToExcel(date, timeSlot) {
    try {
        const response = await fetch(`http://localhost:3001/api/attendance?date=${date}&timeSlot=${encodeURIComponent(timeSlot)}`);
        const records = await response.json();
        
        if (records.length === 0) {
            showAlert('ไม่มีข้อมูลสำหรับส่งออก', 'error');
            return;
        }
        
        generateExcelFile(records, `${date}_${timeSlot.replace(/[^a-zA-Z0-9]/g, '_')}`);
        showAlert('ส่งออกไฟล์ Excel สำเร็จ', 'success');
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        showAlert('เกิดข้อผิดพลาดในการส่งออกไฟล์', 'error');
    }
}

// ส่งออกรายงานทั้งหมดเป็น Excel
async function exportAllToExcel(date, classroom = '', timeSlot = '') {
    try {
        let url = `http://localhost:3001/api/attendance?date=${date}`;
        if (classroom) url += `&classroom=${encodeURIComponent(classroom)}`;
        if (timeSlot) url += `&timeSlot=${encodeURIComponent(timeSlot)}`;
        
        const response = await fetch(url);
        const records = await response.json();
        
        if (records.length === 0) {
            showAlert('ไม่มีข้อมูลสำหรับส่งออก', 'error');
            return;
        }
        
        let filename = `${date}_รายงานการเช็คชื่อ`;
        if (classroom) filename += `_${classroom}`;
        if (timeSlot) filename += `_${timeSlot}`;
        
        generateExcelFile(records, filename);
        showAlert('ส่งออกไฟล์ Excel สำเร็จ', 'success');
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        showAlert('เกิดข้อผิดพลาดในการส่งออกไฟล์', 'error');
    }
}

// สร้างไฟล์ Excel
function generateExcelFile(records, filename) {
    // สร้าง HTML table สำหรับ Excel
    let html = `
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                .header { background-color: #007bff; color: white; text-align: center; font-weight: bold; }
                .status-present { background-color: #d4edda; }
                .status-absent { background-color: #f8d7da; }
                .status-sick { background-color: #fff3cd; }
                .status-activity { background-color: #d1ecf1; }
                .status-home { background-color: #e2e3e5; }
            </style>
        </head>
        <body>
    `;
    
    // จัดกลุ่มข้อมูลตาม time slot
    const groupedRecords = groupRecordsByTimeSlot(records);
    
    Object.keys(groupedRecords).forEach(timeSlot => {
        const slotRecords = groupedRecords[timeSlot];
        
        // หัวข้อสำหรับแต่ละ time slot
        html += `
            <table style="margin-bottom: 30px;">
                <tr class="header">
                    <td colspan="6">📅 รายงานการเช็คชื่อ - ${timeSlot} - ${formatDateThai(records[0].date)}</td>
                </tr>
                <tr>
                    <th>ลำดับ</th>
                    <th>รหัสนักเรียน</th>
                    <th>ชื่อ-นามสกุล</th>
                    <th>สถานะ</th>
                    <th>ช่วงเวลา</th>
                    <th>วันที่บันทึก</th>
                </tr>
        `;
        
        // ข้อมูลนักเรียน
        slotRecords.forEach((record, index) => {
            const statusClass = `status-${record.status}`;
            html += `
                <tr class="${statusClass}">
                    <td>${index + 1}</td>
                    <td>${record.student_id}</td>
                    <td>${record.student_name}</td>
                    <td>${getStatusText(record.status)}</td>
                    <td>${record.time_slot}</td>
                    <td>${formatDate(record.created_at)}</td>
                </tr>
            `;
        });
        
        // สรุปสถิติ
        const stats = calculateStats(slotRecords);
        html += `
                <tr style="background-color: #f8f9fa; font-weight: bold;">
                    <td colspan="3">สรุป</td>
                    <td>มาเรียน: ${stats.present} คน</td>
                    <td>ขาดเรียน: ${stats.absent} คน</td>
                    <td>อื่นๆ: ${stats.others} คน</td>
                </tr>
            </table>
        `;
    });
    
    html += '</body></html>';
    
    // สร้างไฟล์และดาวน์โหลด
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// คำนวณสถิติ
function calculateStats(records) {
    const stats = { present: 0, absent: 0, others: 0 };
    records.forEach(record => {
        if (record.status === 'present') {
            stats.present++;
        } else if (record.status === 'absent') {
            stats.absent++;
        } else {
            stats.others++;
        }
    });
    return stats;
}

// จัดรูปแบบวันที่
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('th-TH');
}

// จัดรูปแบบวันที่ภาษาไทย
function formatDateThai(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    return date.toLocaleDateString('th-TH', options);
}

// โหลดข้อมูลชั้นเรียนจากฐานข้อมูล
async function loadClassrooms() {
    try {
        const response = await fetch('http://localhost:3001/api/classrooms');
        const classrooms = await response.json();
        
        // อัปเดต dropdown ชั้นเรียนในหน้ารายงาน
        const exportClassroomSelect = document.getElementById('exportClassroom');
        const statsClassroomSelect = document.getElementById('statsClassroom');
        
        if (exportClassroomSelect) {
            exportClassroomSelect.innerHTML = '<option value="">-- เลือกชั้นปี/ตอน --</option>';
            classrooms.forEach(classroom => {
                exportClassroomSelect.innerHTML += `<option value="${classroom.classroom}">${classroom.display_name}</option>`;
            });
        }
        
        if (statsClassroomSelect) {
            statsClassroomSelect.innerHTML = '<option value="">-- เลือกชั้นปี/ตอน --</option>';
            classrooms.forEach(classroom => {
                statsClassroomSelect.innerHTML += `<option value="${classroom.classroom}">${classroom.display_name}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading classrooms:', error);
    }
}

// โหลดข้อมูลคาบเรียนจากฐานข้อมูล
async function loadTimeSlotsFromDB() {
    try {
        const response = await fetch('http://localhost:3001/api/time-slots');
        const timeSlots = await response.json();
        
        // อัปเดต dropdown คาบเรียนในหน้ารายงาน
        const exportTimeSlotSelect = document.getElementById('exportTimeSlot');
        
        if (exportTimeSlotSelect) {
            exportTimeSlotSelect.innerHTML = '<option value="">-- เลือกคาบเรียน --</option>';
            timeSlots.forEach(slot => {
                exportTimeSlotSelect.innerHTML += `<option value="${slot.description}">${slot.description} (${slot.start_time} - ${slot.end_time})</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading time slots:', error);
    }
}

// ล้างประวัติการเช็คชื่อทั้งหมด
async function clearAllAttendanceHistory() {
    if (!currentUser || currentUser.role !== 'admin') {
        showAlert('คุณไม่มีสิทธิ์ในการล้างประวัติการเช็คชื่อ (สำหรับผู้ดูแลระบบเท่านั้น)', 'error');
        return;
    }
    
    if (!confirm('⚠️ คุณแน่ใจหรือไม่ที่จะล้างประวัติการเช็คชื่อทั้งหมด?\n\nการดำเนินการนี้จะลบข้อมูลการเช็คชื่อทั้งหมดและไม่สามารถกู้คืนได้!')) {
        return;
    }
    
    // ยืนยันอีกครั้ง
    if (!confirm('🔴 ยืนยันอีกครั้ง: คุณต้องการล้างประวัติการเช็คชื่อทั้งหมดจริงหรือไม่?')) {
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3001/api/attendance/clear-all', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                currentUser: currentUser
            })
        });
        
        if (response.ok) {
            showAlert('ล้างประวัติการเช็คชื่อทั้งหมดแล้ว', 'success');
            
            // ล้างข้อมูลในตาราง
            const reportBody = document.getElementById('reportBody');
            const statsBody = document.getElementById('statsBody');
            const reportTable = document.getElementById('reportTable');
            const statsTable = document.getElementById('statsTable');
            
            if (reportBody) reportBody.innerHTML = '';
            if (statsBody) statsBody.innerHTML = '';
            if (reportTable) reportTable.style.display = 'none';
            if (statsTable) statsTable.style.display = 'none';
            
            // รีเซ็ตฟอร์ม
            const reportDate = document.getElementById('reportDate');
            const exportClassroom = document.getElementById('exportClassroom');
            const exportTimeSlot = document.getElementById('exportTimeSlot');
            const statsClassroom = document.getElementById('statsClassroom');
            const statsStartDate = document.getElementById('statsStartDate');
            const statsEndDate = document.getElementById('statsEndDate');
            
            if (reportDate) reportDate.value = '';
            if (exportClassroom) exportClassroom.value = '';
            if (exportTimeSlot) exportTimeSlot.value = '';
            if (statsClassroom) statsClassroom.value = '';
            if (statsStartDate) statsStartDate.value = '';
            if (statsEndDate) statsEndDate.value = '';
            
            // ล้างปุ่มส่งออก
            const exportSection = document.getElementById('exportSection');
            if (exportSection) exportSection.innerHTML = '';
            
        } else {
            const error = await response.json();
            showAlert(error.error || 'เกิดข้อผิดพลาดในการล้างประวัติ', 'error');
        }
    } catch (error) {
        console.error('Error clearing attendance history:', error);
        showAlert('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
}

// โหลดสถิติการเข้าเรียนของนักเรียน
async function loadStudentStatistics() {
    const classroom = document.getElementById('statsClassroom').value;
    const startDate = document.getElementById('statsStartDate').value;
    const endDate = document.getElementById('statsEndDate').value;
    const tbody = document.getElementById('statsBody');
    const table = document.getElementById('statsTable');
    const loading = document.getElementById('statsLoading');

    tbody.innerHTML = '';
    
    if (!classroom || !startDate || !endDate) {
        table.style.display = 'none';
        return;
    }

    loading.classList.add('active');
    
    try {
        const response = await fetch(`http://localhost:3001/api/attendance/statistics?classroom=${classroom}&startDate=${startDate}&endDate=${endDate}`);
        const statistics = await response.json();
        
        if (statistics.length === 0) {
            table.style.display = 'none';
            loading.classList.remove('active');
            return;
        }
        
        statistics.forEach(stat => {
            const attendanceRate = ((stat.present / (stat.present + stat.absent + stat.sick + stat.activity + stat.home)) * 100).toFixed(1);
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${stat.student_id}</td>
                <td>${stat.student_name}</td>
                <td style="color: #28a745; font-weight: bold;">${stat.present}</td>
                <td style="color: #dc3545; font-weight: bold;">${stat.absent}</td>
                <td style="color: #ffc107; font-weight: bold;">${stat.sick}</td>
                <td style="color: #17a2b8; font-weight: bold;">${stat.activity}</td>
                <td style="color: #6c757d; font-weight: bold;">${stat.home}</td>
                <td style="color: ${attendanceRate >= 80 ? '#28a745' : attendanceRate >= 60 ? '#ffc107' : '#dc3545'}; font-weight: bold;">
                    ${attendanceRate}%
                </td>
            `;
        });

        loading.classList.remove('active');
        table.style.display = 'table';
    } catch (error) {
        console.error('Error loading statistics:', error);
        showAlert('เกิดข้อผิดพลาดในการโหลดสถิติ', 'error');
        loading.classList.remove('active');
    }
}

// Clear all students
async function clearAllStudents() {
    if (!currentUser || currentUser.role !== 'admin') {
        showAlert('คุณไม่มีสิทธิ์ในการลบข้อมูลนักเรียนทั้งหมด (สำหรับผู้ดูแลระบบเท่านั้น)', 'error');
        return;
    }
    
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบข้อมูลนักเรียนทั้งหมด?')) return;
    
    try {
        const response = await fetch('http://localhost:3001/api/students', {
            method: 'DELETE'
        });
        
        if (response.ok) {
        students = [];
            displayStudents([]);
        showAlert('ลบข้อมูลนักเรียนทั้งหมดแล้ว', 'success');
        } else {
            showAlert('เกิดข้อผิดพลาดในการลบข้อมูล', 'error');
        }
    } catch (error) {
        console.error('Error clearing students:', error);
        showAlert('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
}

// Show alert
function showAlert(message, type) {
    const alert = document.getElementById(type + 'Alert');
    alert.textContent = message;
    alert.style.display = 'block';
    
    setTimeout(() => {
        alert.style.display = 'none';
    }, 3000);
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Load time slots from localStorage
function loadTimeSlots() {
    const savedTimeSlots = localStorage.getItem('timeSlots');
    if (savedTimeSlots) {
        timeSlots = JSON.parse(savedTimeSlots);
    }
    updateTimeSlotOptions();
}

// Save time slots to localStorage
function saveTimeSlots() {
    localStorage.setItem('timeSlots', JSON.stringify(timeSlots));
    updateTimeSlotOptions();
}

// Update time slot options in select
function updateTimeSlotOptions() {
    const timeSlotSelect = document.getElementById('timeSlot');
    if (!timeSlotSelect) return;
    
    timeSlotSelect.innerHTML = '<option value="">-- เลือกช่วงเวลา --</option>';
    timeSlots.forEach(slot => {
        timeSlotSelect.innerHTML += `<option value="${slot.id}">${slot.name} (${slot.time})</option>`;
    });
}

// Add new time slot (admin only)
function addTimeSlot() {
    if (!currentUser || currentUser.role !== 'admin') {
        showAlert('คุณไม่มีสิทธิ์ในการเพิ่มช่วงเวลา (สำหรับผู้ดูแลระบบเท่านั้น)', 'error');
        return;
    }

    const name = prompt('ชื่อช่วงเวลา (เช่น 🌅 ภาคเช้า):');
    if (!name) return;
    
    const time = prompt('ช่วงเวลา (เช่น 08:00 - 12:00):');
    if (!time) return;
    
    const id = 'slot_' + Date.now();
    timeSlots.push({ id, name, time });
    saveTimeSlots();
    showAlert('เพิ่มช่วงเวลาใหม่สำเร็จ', 'success');
}

// Edit time slot (admin only)
function editTimeSlot(slotId) {
    if (!currentUser || currentUser.role !== 'admin') {
        showAlert('คุณไม่มีสิทธิ์ในการแก้ไขช่วงเวลา (สำหรับผู้ดูแลระบบเท่านั้น)', 'error');
            return;
        }

    const slot = timeSlots.find(s => s.id === slotId);
    if (!slot) return;
    
    const name = prompt('ชื่อช่วงเวลาใหม่:', slot.name);
    if (!name) return;
    
    const time = prompt('ช่วงเวลาใหม่:', slot.time);
    if (!time) return;
    
    slot.name = name;
    slot.time = time;
    saveTimeSlots();
    showAlert('แก้ไขช่วงเวลาสำเร็จ', 'success');
}

// Delete time slot (admin only)
function deleteTimeSlot(slotId) {
    if (!currentUser || currentUser.role !== 'admin') {
        showAlert('คุณไม่มีสิทธิ์ในการลบช่วงเวลา (สำหรับผู้ดูแลระบบเท่านั้น)', 'error');
        return;
    }
    
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบช่วงเวลานี้?')) return;
    
    timeSlots = timeSlots.filter(s => s.id !== slotId);
    saveTimeSlots();
    showAlert('ลบช่วงเวลาสำเร็จ', 'success');
}

// Show time slot management (admin only)
function showTimeSlotManagement() {
    if (!currentUser || currentUser.role !== 'admin') {
        showAlert('คุณไม่มีสิทธิ์ในการจัดการช่วงเวลา (สำหรับผู้ดูแลระบบเท่านั้น)', 'error');
        return;
    }
    
    const modal = document.getElementById('timeSlotModal');
    const content = document.getElementById('timeSlotContent');
    
    let html = `
        <h3>จัดการช่วงเวลา</h3>
        <button onclick="addTimeSlot()" style="background: #28a745; margin-bottom: 15px;">
            ➕ เพิ่มช่วงเวลาใหม่
        </button>
        <table class="time-slot-table">
            <thead>
                <tr>
                    <th>ชื่อ</th>
                    <th>ช่วงเวลา</th>
                    <th>การจัดการ</th>
                </tr>
            </thead>
            <tbody>
    `;

    timeSlots.forEach(slot => {
        html += `
            <tr>
                <td>${slot.name}</td>
                <td>${slot.time}</td>
                <td>
                    <button onclick="editTimeSlot('${slot.id}')" style="background: #ffc107; color: #333; padding: 5px 10px; font-size: 12px;">
                        ✏️ แก้ไข
                    </button>
                    <button onclick="deleteTimeSlot('${slot.id}')" style="background: #dc3545; padding: 5px 10px; font-size: 12px;">
                        🗑️ ลบ
                    </button>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    content.innerHTML = html;
    modal.style.display = 'block';
}

// Close time slot modal
function closeTimeSlotModal() {
    document.getElementById('timeSlotModal').style.display = 'none';
}

// Load background images from localStorage
function loadBackgroundImages() {
    const savedImages = localStorage.getItem('backgroundImages');
    if (savedImages) {
        backgroundImages = JSON.parse(savedImages);
    }
    updateBackgroundImage();
}

// Save background images to localStorage
function saveBackgroundImages() {
    localStorage.setItem('backgroundImages', JSON.stringify(backgroundImages));
}

// Update background image with transition
function updateBackgroundImage() {
    const slideshow = document.querySelector('.slideshow');
    if (slideshow && backgroundImages.length > 0) {
        slideshow.style.backgroundImage = `url('${backgroundImages[currentImageIndex]}')`;
    }
}

// Start slideshow
function startSlideshow() {
    if (slideshowInterval) {
        clearInterval(slideshowInterval);
    }
    slideshowInterval = setInterval(() => {
        currentImageIndex = (currentImageIndex + 1) % backgroundImages.length;
        updateBackgroundImage();
    }, 5000); // Change image every 5 seconds
}

// Stop slideshow
function stopSlideshow() {
    if (slideshowInterval) {
        clearInterval(slideshowInterval);
        slideshowInterval = null;
    }
}

// Add new background image (admin only)
function addBackgroundImage() {
    if (!currentUser || currentUser.role !== 'admin') {
        showAlert('คุณไม่มีสิทธิ์ในการเพิ่มภาพพื้นหลัง (สำหรับผู้ดูแลระบบเท่านั้น)', 'error');
        return;
    }
    
    const imageUrl = prompt('กรอก URL ของภาพพื้นหลัง:');
    if (!imageUrl) return;
    
    // Validate URL
    try {
        new URL(imageUrl);
    } catch (e) {
        showAlert('URL ไม่ถูกต้อง กรุณากรอก URL ที่ถูกต้อง', 'error');
        return;
    }
    
    backgroundImages.push(imageUrl);
    saveBackgroundImages();
    showAlert('เพิ่มภาพพื้นหลังสำเร็จ', 'success');
    updateBackgroundManagement();
}

// Edit background image (admin only)
function editBackgroundImage(index) {
    if (!currentUser || currentUser.role !== 'admin') {
        showAlert('คุณไม่มีสิทธิ์ในการแก้ไขภาพพื้นหลัง (สำหรับผู้ดูแลระบบเท่านั้น)', 'error');
        return;
    }
    
    const imageUrl = prompt('กรอก URL ใหม่ของภาพพื้นหลัง:', backgroundImages[index]);
    if (!imageUrl) return;
    
    // Validate URL
    try {
        new URL(imageUrl);
    } catch (e) {
        showAlert('URL ไม่ถูกต้อง กรุณากรอก URL ที่ถูกต้อง', 'error');
        return;
    }
    
    backgroundImages[index] = imageUrl;
    saveBackgroundImages();
    updateBackgroundImage();
    showAlert('แก้ไขภาพพื้นหลังสำเร็จ', 'success');
    updateBackgroundManagement();
}

// Delete background image (admin only)
function deleteBackgroundImage(index) {
    if (!currentUser || currentUser.role !== 'admin') {
        showAlert('คุณไม่มีสิทธิ์ในการลบภาพพื้นหลัง (สำหรับผู้ดูแลระบบเท่านั้น)', 'error');
        return;
    }
    
    if (backgroundImages.length <= 1) {
        showAlert('ไม่สามารถลบภาพได้ ต้องมีภาพพื้นหลังอย่างน้อย 1 ภาพ', 'error');
        return;
    }
    
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบภาพพื้นหลังนี้?')) return;
    
    backgroundImages.splice(index, 1);
    saveBackgroundImages();
    
    // Adjust current index if needed
    if (currentImageIndex >= backgroundImages.length) {
        currentImageIndex = 0;
    }
    
    updateBackgroundImage();
    showAlert('ลบภาพพื้นหลังสำเร็จ', 'success');
    updateBackgroundManagement();
}

// Show background management (admin only)
function showBackgroundManagement() {
    if (!currentUser || currentUser.role !== 'admin') {
        showAlert('คุณไม่มีสิทธิ์ในการจัดการภาพพื้นหลัง (สำหรับผู้ดูแลระบบเท่านั้น)', 'error');
        return;
    }
    
    const modal = document.getElementById('backgroundModal');
    const content = document.getElementById('backgroundContent');
    
    updateBackgroundManagement();
    modal.style.display = 'block';
}

// Update background management content
function updateBackgroundManagement() {
    const content = document.getElementById('backgroundContent');
    if (!content) return;
    
    let html = `
        <h3>จัดการภาพพื้นหลัง</h3>
        <button onclick="addBackgroundImage()" style="background: #28a745; margin-bottom: 15px;">
            ➕ เพิ่มภาพพื้นหลังใหม่
        </button>
        <div class="background-grid">
    `;
    
    backgroundImages.forEach((image, index) => {
        html += `
            <div class="background-item">
                <img src="${image}" alt="Background ${index + 1}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIEVycm9yPC90ZXh0Pjwvc3ZnPg=='">
                <div class="background-controls">
                    <button onclick="editBackgroundImage(${index})" style="background: #ffc107; color: #333; padding: 5px 10px; font-size: 12px;">
                        ✏️ แก้ไข
                    </button>
                    <button onclick="deleteBackgroundImage(${index})" style="background: #dc3545; padding: 5px 10px; font-size: 12px;">
                        🗑️ ลบ
                    </button>
                </div>
            </div>
        `;
    });
    
    html += `
        </div>
        <div style="margin-top: 15px;">
            <label>การตั้งค่าการเปลี่ยนภาพ:</label>
            <select id="slideshowSpeed" onchange="changeSlideshowSpeed()">
                <option value="3000">เร็ว (3 วินาที)</option>
                <option value="5000" selected>ปกติ (5 วินาที)</option>
                <option value="8000">ช้า (8 วินาที)</option>
                <option value="0">ปิดการเปลี่ยนภาพ</option>
            </select>
        </div>
    `;
    
    content.innerHTML = html;
}

// Change slideshow speed
function changeSlideshowSpeed() {
    const speed = parseInt(document.getElementById('slideshowSpeed').value);
    if (speed === 0) {
        stopSlideshow();
    } else {
        startSlideshow();
        if (slideshowInterval) {
            clearInterval(slideshowInterval);
            slideshowInterval = setInterval(() => {
                currentImageIndex = (currentImageIndex + 1) % backgroundImages.length;
                updateBackgroundImage();
            }, speed);
        }
    }
}

// Close background modal
function closeBackgroundModal() {
    document.getElementById('backgroundModal').style.display = 'none';
}

function exportAttendanceToExcel() {
    // ดึงข้อมูลที่จำเป็น
    const classroom = document.getElementById('classSelect').value;
    const timeSlotId = document.getElementById('timeSlot').value;
    const teacher = document.getElementById('teacherName').value;
    const date = new Date().toISOString().split('T')[0];
    if (!classroom || !timeSlotId) {
        showAlert('กรุณาเลือกตอนเรียนและช่วงเวลาก่อนส่งออก', 'error');
        return;
    }
    // หาชื่อช่วงเวลา
    const selectedSlot = timeSlots.find(s => s.id === timeSlotId);
    const timeSlotText = selectedSlot ? selectedSlot.name : timeSlotId;
    // กรองนักเรียนตาม classroom
    const classStudents = students.filter(s => s.classroom === classroom);
    // เตรียมข้อมูลสำหรับ export
    let html = `
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                .header { background-color: #007bff; color: white; text-align: center; font-weight: bold; }
            </style>
        </head>
        <body>
            <table>
                <tr class="header">
                    <td colspan="6">📊 รายงานการเช็คชื่อ - ${date} - ${timeSlotText}</td>
                </tr>
                <tr>
                    <th>ลำดับ</th>
                    <th>รหัสนักเรียน</th>
                    <th>ชื่อ-นามสกุล</th>
                    <th>ตอน</th>
                    <th>สถานะ</th>
                    <th>ครูผู้เช็คชื่อ</th>
                </tr>
    `;
    classStudents.forEach((student, idx) => {
        html += `
            <tr>
                <td>${idx + 1}</td>
                <td>${student.student_id}</td>
                <td>${student.name}</td>
                <td>${student.classroom}</td>
                <td>${getStatusText(student.status || 'present')}</td>
                <td>${teacher}</td>
            </tr>
        `;
    });
    // สรุปสถิติ
    const stats = { present: 0, absent: 0, sick: 0, activity: 0, home: 0 };
    classStudents.forEach(student => {
        stats[student.status || 'present']++;
    });
    html += `
        <tr style="background-color: #f8f9fa; font-weight: bold;">
            <td colspan="2">สรุป</td>
            <td>มาเรียน: ${stats.present} คน</td>
            <td>ขาดเรียน: ${stats.absent} คน</td>
            <td>ป่วย: ${stats.sick} คน, กิจกรรม: ${stats.activity} คน, กลับบ้าน: ${stats.home} คน</td>
            <td></td>
        </tr>
    `;
    html += '</table></body></html>';
    // สร้างไฟล์และดาวน์โหลด
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `รายงานการเช็คชื่อ_${date}_${classroom}_${timeSlotId}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    showAlert('ส่งออกไฟล์ Excel สำเร็จ', 'success');
}

function openUserSettings() {
    const modal = document.getElementById('userSettingsModal');
    const nameInput = document.getElementById('userProfileName');
    const picPreview = document.getElementById('userProfilePicPreview');
    // โหลดข้อมูล user ปัจจุบัน
    if (currentUser) {
        nameInput.value = currentUser.displayName || '';
        if (currentUser.profilePic) {
            picPreview.src = currentUser.profilePic;
            picPreview.style.display = 'block';
        } else {
            picPreview.src = '';
            picPreview.style.display = 'none';
        }
    }
    modal.style.display = 'block';
}
function closeUserSettings() {
    document.getElementById('userSettingsModal').style.display = 'none';
}
function saveUserSettings() {
    const nameInput = document.getElementById('userProfileName');
    const picPreview = document.getElementById('userProfilePicPreview');
    if (currentUser) {
        currentUser.displayName = nameInput.value;
        if (picPreview.src && picPreview.style.display !== 'none') {
            currentUser.profilePic = picPreview.src;
        }
        // อัปเดตชื่อที่แสดงทันที
        document.getElementById('userDisplay').textContent = `👤 ${currentUser.displayName}`;
        updateUserProfilePicSmall();
        // เก็บลง localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
    closeUserSettings();
}
// อัปเดตรูปโปรไฟล์ใน modal
const userProfilePicInput = document.getElementById('userProfilePicInput');
const userProfilePicPreview = document.getElementById('userProfilePicPreview');
if (userProfilePicInput && userProfilePicPreview) {
    userProfilePicInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                userProfilePicPreview.src = evt.target.result;
                userProfilePicPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            userProfilePicPreview.src = '';
            userProfilePicPreview.style.display = 'none';
        }
    });
}

function updateUserProfilePicSmall() {
    const img = document.getElementById('userProfilePicSmall');
    if (currentUser && currentUser.profilePic) {
        img.src = currentUser.profilePic;
        img.style.display = 'inline-block';
    } else {
        img.src = '';
        img.style.display = 'none';
    }
}
// เรียกใช้หลัง login, saveUserSettings, และตอนโหลดหน้า