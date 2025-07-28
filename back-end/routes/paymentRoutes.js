// back-end/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controller/paymentController');
const { protect, authorize } = require('../middleware/auth');

// Route để khởi tạo thanh toán VNPAY (chỉ user)
router.post('/create-vnpay-payment', protect, authorize('user'), paymentController.createVnPayPayment);

// Route xử lý callback từ VNPAY (không cần authenticate, VNPAY gọi về)
// Đảm bảo route này được public, VNPAY sẽ gọi nó trực tiếp
router.get('/vnpay_return', paymentController.vnpayReturn);
router.post('/vnpay_ipn', paymentController.vnpayReturn); // VNPAY IPN (Instant Payment Notification)

module.exports = router;