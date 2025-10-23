const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const staffController = require('../controllers/staffController');

// ✅ Store staff images in /uploads/images/staff
const staffUploadDir = path.join(__dirname, '../uploads/images/staff');
if (!fs.existsSync(staffUploadDir)) fs.mkdirSync(staffUploadDir, { recursive: true });

// ✅ Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, staffUploadDir),
  filename: (req, file, cb) => {
    const userId = req.body.uid || 'unknown';
    const extension = path.extname(file.originalname).toLowerCase();
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const newFilename = `${userId}_${date}_${time}${extension}`;

    // Delete old files for the same user
    fs.readdirSync(staffUploadDir).forEach(f => {
      if (f.startsWith(userId)) fs.unlinkSync(path.join(staffUploadDir, f));
    });

    cb(null, newFilename);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  cb(null, allowed.includes(file.mimetype));
};

const upload = multer({ storage, fileFilter });

// ✅ Upload staff profile photo
router.post('/upload-photo', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No valid image file uploaded' });
  res.json({ photo_url: `/uploads/images/staff/${req.file.filename}` });
});

// ✅ Staff routes
router.post('/invite', staffController.sendInvite);
router.post('/complete-registration', staffController.completeRegistration);
router.get('/profile', staffController.getStaffProfile);
router.get('/all', staffController.getAllStaff);
router.get('/invite-info', staffController.getInviteInfo);

// ✅ New: Edit staff (name, username, profile_picture)
router.put('/edit', staffController.editStaff);

// ✅ New: Delete staff by ID
router.delete('/delete/:id', staffController.deleteStaff);

module.exports = router;
