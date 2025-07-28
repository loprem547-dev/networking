-- อัปเดตตาราง attendance เพื่อเพิ่มฟิลด์ผู้บันทึก
ALTER TABLE attendance ADD COLUMN created_by VARCHAR(100) DEFAULT 'admin';

-- อัปเดตข้อมูลเก่าให้เป็น admin
UPDATE attendance SET created_by = 'admin' WHERE created_by IS NULL;

-- เพิ่ม index สำหรับการค้นหา
CREATE INDEX idx_attendance_created_by ON attendance(created_by); 