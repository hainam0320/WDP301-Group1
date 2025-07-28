const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  acceptOrder,
  completeOrder,
  userConfirmCompletion // Thêm dòng này
} = require('../controller/orderController');
const Order = require('../model/orderModel');

// Protect all routes
router.use(protect);

// Get user's orders (filter by userId)
router.get('/user', async (req, res) => { // Đổi route thành /user để tránh trùng với /api/orders cho admin
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate('driverId', 'fullName phone')
      .sort('-createdAt');
    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Server error while fetching orders' });
  }
});

// Route definitions (đơn hàng chung, có thể dành cho admin nếu không có filter userId)
router.post('/', authorize('user'), createOrder); // Chỉ user tạo đơn
router.get('/:id', getOrderById); // Có thể cần authorize
router.put('/:id', authorize('user', 'driver', 'admin'), updateOrder); // Có thể cần authorize chi tiết hơn
router.delete('/:id', authorize('admin'), deleteOrder); // Chỉ admin xóa

// Shipper chấp nhận đơn hàng
router.post('/:id/accept', authorize('shipper', 'driver'), acceptOrder);

// Shipper hoàn tất đơn hàng
router.post('/:id/complete', authorize('shipper', 'driver'), completeOrder);

// User xác nhận hoàn thành đơn hàng (NEW ROUTE)
router.post('/:id/user-confirm-completion', authorize('user'), userConfirmCompletion);

module.exports = router;