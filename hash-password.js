const bcrypt = require('bcrypt');

// 👉 เปลี่ยนรหัสผ่านตรงนี้ให้เป็นของจริงที่คุณต้องการ
const plainPassword = '123456';

bcrypt.hash(plainPassword, 10).then(hash => {
    console.log('🔐 Bcrypt hash ที่ได้คือ:\n', hash);
}).catch(err => {
    console.error('❌ เกิดข้อผิดพลาด:', err);
});