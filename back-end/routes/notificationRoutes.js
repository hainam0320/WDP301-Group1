const express = require('express');
const router = express.Router();
const notificationController = require('../controller/notificationController');
const { protect, restrictTo } = require('../middleware/auth');

// Tất cả các route dưới đây đều yêu cầu đăng nhập
router.use(protect);

// Lấy tất cả thông báo cho người dùng hiện tại
router.get('/', notificationController.getNotifications);

// Đánh dấu một thông báo là đã đọc
router.patch('/:id/read', notificationController.markAsRead);

// Đánh dấu tất cả thông báo là đã đọc
router.patch('/read-all', notificationController.markAllAsRead);

module.exports = router; 