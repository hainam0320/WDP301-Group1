const express = require("express");
const router = express.Router();
const transactionController = require("../controller/transactionController");
const { protect, authorize } = require('../middleware/auth');

// Bảo vệ tất cả các routes
router.use(protect);

// ===== DRIVER COMMISSION MANAGEMENT (OLD FLOW: DRIVER PAYS ADMIN) =====
router.get("/driver/pending", authorize('driver'), transactionController.getDriverPendingCommissions);
router.get("/driver/history", authorize('driver'), transactionController.getDriverCommissionHistory);
router.get("/driver/overview", authorize('driver'), transactionController.getDriverCommissionOverview);

// ===== BULK BILL MANAGEMENT (OLD FLOW: DRIVER PAYS ADMIN) =====
router.post("/bulk-bill/create", authorize('driver'), transactionController.createBulkBill);
router.post('/bulk-bills/:bulkBillId/cancel', authorize('driver'), transactionController.cancelBulkBill);
router.get("/driver/bulk-bills", authorize('driver'), transactionController.getDriverBulkBills);
// ===== DRIVER PAYOUTS (NEW FLOW: ADMIN PAYS DRIVER) =====
router.get("/driver/payouts/balance", authorize('driver'), transactionController.getDriverPayoutsBalance);
router.get("/driver/payouts/history", authorize('driver'), transactionController.getDriverPayoutsHistory);

// ===== ADMIN ROUTES (RELATED TO OLD FLOW) =====
router.get("/admin/bulk-bills", authorize('admin'), transactionController.getAdminBulkBills); // Đã có ở trên nhưng đặt lại cho rõ
router.get("/admin/bulk-bills/:billId", authorize('admin'), transactionController.getAdminBulkBillDetails);
router.post('/admin/bulk-bills/:bulkBillId/confirm', authorize('admin'), transactionController.adminConfirmBulkPayment); // Đã có ở trên nhưng đặt lại cho rõ
// ===== PAYMENT CONFIRMATION (OLD FLOW) =====
// Đây có vẻ là route cập nhật status của QR payment, nên giữ lại
router.post('/qr/payment/:paymentCode/status', authorize('driver'), transactionController.updateBulkQRPaymentStatus);

module.exports = router;
