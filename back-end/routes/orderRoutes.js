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
  completeOrder // 👈 thêm dòng này
} = require('../controller/orderController');
const Order = require('../model/orderModel');

// Protect all routes
router.use(protect);

// Get user's orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate('driverId', 'fullName phone')
      .sort('-createdAt');
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error while fetching orders' });
  }
});

// Route definitions
router.post('/', createOrder);
router.get('/:id', getOrderById);
router.put('/:id', updateOrder);
router.delete('/:id', deleteOrder);
router.post('/:id/accept', authorize('shipper', 'driver'), acceptOrder);

// ✅ Thêm route hoàn tất đơn
router.post('/:id/complete', authorize('shipper', 'driver'), completeOrder);

module.exports = router;
