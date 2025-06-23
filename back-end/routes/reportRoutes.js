const express = require('express');
const router = express.Router();
const reportController = require('../controller/reportController');
const { protect, authorize } = require('../middleware/auth');

// Create a new report (requires user authentication)
router.post('/', protect, authorize('user'), reportController.createReport);

// Get all reports (requires admin authentication)
router.get('/all', protect, authorize('admin'), reportController.getAllReports);

// Get reports by authenticated user
router.get('/my-reports', protect, authorize('user'), reportController.getUserReports);

// Update report status (requires admin authentication)
router.patch('/:id/status', protect, authorize('admin'), reportController.updateReportStatus);

module.exports = router; 