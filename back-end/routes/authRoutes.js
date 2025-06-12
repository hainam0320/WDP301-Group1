const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const upload = require('../middleware/upload');

// Đăng ký User (upload 1 ảnh avatar)
router.post('/register-user', upload.single('avatar'), authController.registerUser);

// Đăng ký Driver (upload 2 ảnh: avatar + cmnd)
router.post(
  '/register-driver',
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'cmnd', maxCount: 1 }
  ]),
  authController.registerDriver
);

// Đăng nhập chung
router.post('/login', authController.login);

module.exports = router;
