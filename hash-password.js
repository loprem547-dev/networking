const bcrypt = require('bcrypt');

// 👉 เปลี่ยนรหัสผ่านตรงนี้ให้เป็นของจริงที่คุณต้องการ
const plainPassword = '123456';

bcrypt.hash(plainPassword, 10).then(hash => {
    console.log('🔐 Bcrypt hash ที่ได้คือ:\n', hash);
}).catch(err => {
    console.error('❌ เกิดข้อผิดพลาด:', err);
});
const bcrypt = require('bcrypt');

const password = 'commu'; // รหัสผ่านที่ต้องการแปลง
const saltRounds = 10;

bcrypt.hash(password, saltRounds, function(err, hash) {
    if (err) {
        console.error('เกิดข้อผิดพลาดในการแฮชรหัสผ่าน:', err);
        return;
    }
    console.log('🔐 Bcrypt hash สำหรับรหัสผ่าน "commu":');
    console.log(hash);
});