const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getStats,
  getUsers,
  getOrders,
  getRevenue,
  deleteUser,
  updateUserStatus,
  getShipperOrders,
  updateDriverStatus
} = require('../controller/adminController');

// Protect all routes and require admin role
router.use(protect);
router.use(authorize('admin'));

// Dashboard stats
router.get('/stats', getStats);

// User management
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/status', updateUserStatus);
// Driver management
router.patch('/drivers/:driverId/status', updateDriverStatus);

// Order management
router.get('/orders', getOrders);

// Get shipper orders with filters
router.get('/shipper/:id/orders', getShipperOrders);

// Revenue reports
router.get('/revenue', getRevenue);

module.exports = router; 