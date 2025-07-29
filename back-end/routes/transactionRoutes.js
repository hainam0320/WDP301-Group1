const express = require("express");
const router = express.Router();
const transactionController = require("../controller/transactionController");
const { protect, authorize } = require('../middleware/auth');

// Bảo vệ tất cả các routes
router.use(protect);

// ===== DRIVER EARNINGS AND PAYOUTS =====
// Lấy danh sách các khoản hoa hồng (tiền hệ thống giữ từ user cho tài xế)
router.get("/driver/commissions", authorize('driver'), transactionController.getDriverCommissions);
// Lấy lịch sử giải ngân cho tài xế
router.get("/driver/payout-history", authorize('driver'), transactionController.getDriverPayoutHistory);
// Lấy tổng quan thu nhập tài xế
router.get("/driver/overview", authorize('driver'), transactionController.getDriverEarningsOverview);

// ===== ADMIN TRANSACTION MANAGEMENT =====
// Lấy danh sách tất cả các giao dịch (tiền đang giữ, hoa hồng, giải ngân, hoàn tiền)
router.get("/admin/all", authorize('admin'), transactionController.getAdminTransactions);
// Lấy chi tiết một giao dịch
router.get("/admin/:transactionId", authorize('admin'), transactionController.getAdminTransactionDetails);
// Admin xử lý tranh chấp / hoàn tiền / giải ngân lại (từ trạng thái 'disputed')
router.post("/admin/:transactionId/resolve", authorize('admin'), transactionController.adminResolveTransaction);

// Routes cho ví tiền
router.get("/user/wallet", authorize('user'), transactionController.getUserWallet);
router.get("/driver/wallet", authorize('driver'), transactionController.getDriverWallet);

// Các routes liên quan đến BulkBill và QRPayment của luồng cũ có thể được xóa hoặc tái cấu trúc
// Tùy thuộc vào việc bạn có muốn giữ chức năng rút tiền của tài xế thông qua QR nữa không.
// Tạm thời, tôi sẽ loại bỏ các route này để đơn giản hóa luồng mới tập trung vào user trả trước.
/*
// ===== BULK BILL MANAGEMENT (CŨ - Bỏ đi hoặc Tái cấu trúc cho tính năng khác) =====
// router.post("/bulk-bill/create", authorize('driver'), transactionController.createBulkBill);
// router.post('/bulk-bills/:bulkBillId/cancel', authorize('driver'), transactionController.cancelBulkBill);
// router.get("/driver/bulk-bills", authorize('driver'), transactionController.getDriverBulkBills);
// router.get("/admin/bulk-bills", authorize('admin'), transactionController.getAdminBulkBills); // Có thể tái sử dụng cho các bill khác

// ===== PAYMENT CONFIRMATION (CŨ - Bỏ đi hoặc Tái cấu trúc cho tính năng khác) =====
// router.post('/admin/bulk-bills/:bulkBillId/confirm', authorize('admin'), transactionController.adminConfirmBulkPayment);
// router.post('/qr/payment/:paymentCode/status', authorize('driver'), transactionController.updateBulkQRPaymentStatus);
// router.get('/admin/bulk-bills/:billId', authorize('admin'), transactionController.getAdminBulkBillDetails);
*/

module.exports = router;