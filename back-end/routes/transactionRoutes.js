const express = require("express");
const router = express.Router();
const transactionController = require("../controller/transactionController");
const { protect, authorize } = require('../middleware/auth');

// Bảo vệ tất cả các routes
router.use(protect);

// Routes cho tài xế
router.get("/driver/pending", authorize('driver'), transactionController.getDriverPendingCommissions);
router.get("/driver/history", authorize('driver'), transactionController.getDriverCommissionHistory);
router.get("/driver/overview", authorize('driver'), transactionController.getDriverCommissionOverview);

// Routes cho QR Payment
router.post("/qr/create/:transactionId", authorize('driver'), transactionController.createQRPayment);
router.post("/qr/bulk/create", authorize('driver'), transactionController.createBulkQRPayment);
router.get("/qr/bulk/status/:bulkPaymentId", authorize('driver'), transactionController.checkBulkQRPaymentStatus);
router.post("/qr/simulate-payment", authorize('driver'), transactionController.simulateQRPayment);
router.get("/qr/status/:transactionId", authorize('driver'), transactionController.checkQRPaymentStatus);

// Routes cho admin
router.get('/admin/commissions', authorize('admin'), transactionController.getAdminCommissions);
router.get('/admin/drivers', authorize('admin'), transactionController.getDriversList);
router.post('/admin/commissions/:transactionId/confirm', authorize('admin'), transactionController.adminConfirmPayment);

module.exports = router;
