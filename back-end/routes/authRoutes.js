const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const upload = require('../middleware/upload');

// Đăng ký User (upload 1 ảnh avatar)
router.post('/register-user', upload.single('avatar'), authController.registerUser);

// Đăng ký Driver (upload nhiều ảnh: avatar, biển số xe, CMND 2 mặt)
router.post('/register-driver', upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'licensePlateImage', maxCount: 1 },
    { name: 'cmndFront', maxCount: 1 },
    { name: 'cmndBack', maxCount: 1 }
]), authController.registerDriver);

// Đăng nhập
router.post('/login', authController.login);

module.exports = router;
