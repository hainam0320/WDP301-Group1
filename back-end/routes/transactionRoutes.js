const express = require("express");
const router = express.Router();
const transactionController = require("../controller/transactionController");
const { protect, authorize } = require('../middleware/auth');

// Bảo vệ tất cả các routes
router.use(protect);
// ===== DRIVER COMMISSION MANAGEMENT =====
router.get("/driver/pending", authorize('driver'), transactionController.getDriverPendingCommissions);
router.get("/driver/history", authorize('driver'), transactionController.getDriverCommissionHistory);
router.get("/driver/overview", authorize('driver'), transactionController.getDriverCommissionOverview);

// ===== BULK BILL MANAGEMENT =====
router.post("/bulk-bill/create", authorize('driver'), transactionController.createBulkBill);
router.post('/bulk-bills/:bulkBillId/cancel', authorize('driver'), transactionController.cancelBulkBill);
router.get("/driver/bulk-bills", authorize('driver'), transactionController.getDriverBulkBills);
router.get("/admin/bulk-bills", authorize('admin'), transactionController.getAdminBulkBills);

// ===== PAYMENT CONFIRMATION =====
router.post('/admin/bulk-bills/:bulkBillId/confirm', authorize('admin'), transactionController.adminConfirmBulkPayment);
router.post('/qr/payment/:paymentCode/status', authorize('driver'), transactionController.updateBulkQRPaymentStatus);

// ===== ADMIN ROUTES =====
router.get('/admin/bulk-bills', authorize('admin'), transactionController.getAdminBulkBills);
router.get('/admin/bulk-bills/:billId', authorize('admin'), transactionController.getAdminBulkBillDetails);
router.post('/admin/bulk-bills/:bulkBillId/confirm', authorize('admin'), transactionController.adminConfirmBulkPayment);

module.exports = router;
