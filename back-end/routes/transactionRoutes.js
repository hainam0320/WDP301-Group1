const express = require("express");
const router = express.Router();
const transactionController = require("../controller/transactionController");
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// --- DRIVER PAYOUTS (NEW FLOW: ADMIN PAYS DRIVER) ---
// Các route này cho phép tài xế xem số dư và lịch sử nhận tiền từ admin
router.get("/driver/payouts/balance", authorize('driver'), transactionController.getDriverPayoutsBalance);
router.get("/driver/payouts/history", authorize('driver'), transactionController.getDriverPayoutsHistory);
router.post("/driver/payouts/request", authorize('driver'), transactionController.requestPayout);
router.get("/driver/payouts/requests", authorize('driver'), transactionController.getDriverPayoutRequests);


// --- ADMIN ROUTES (LIÊN QUAN ĐẾN BULK BILL CŨ VÀ NEW PAYOUT FLOW) ---

// Các route quản lý bulk bill cũ (tài xế trả công ty) - Vẫn giữ lại cho admin
router.get("/admin/bulk-bills", authorize('admin'), transactionController.getAdminBulkBills);
router.get("/admin/bulk-bills/:billId", authorize('admin'), transactionController.getAdminBulkBillDetails);
router.post('/admin/bulk-bills/:bulkBillId/confirm', authorize('admin'), transactionController.adminConfirmBulkPayment);

// Các route cho Admin xử lý yêu cầu chi trả mới
router.get("/admin/payouts/requests/pending", authorize('admin'), transactionController.getAdminPendingPayoutRequests);
router.post("/admin/payouts/:payoutId/process", authorize('admin'), transactionController.processPayoutRequest);
router.get("/admin/payouts/history", authorize('admin'), transactionController.getAdminPayoutsHistory); // ROUTE MỚI: Admin lấy toàn bộ lịch sử chi trả

module.exports = router;