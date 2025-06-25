const express = require('express');
const router = express.Router();
const reportController = require('../controller/reportController');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const Report = require('../model/reportModel');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Create a new report (requires user authentication)
router.post('/', protect, authorize('user'), reportController.createReport);

// Get all reports (requires admin authentication)
router.get('/all', protect, authorize('admin'), reportController.getAllReports);

// Get reports by authenticated user
router.get('/my-reports', protect, authorize('user'), async (req, res) => {
  try {
    const reports = await Report.find({ reporterID: req.user._id })
      .populate('order_id')
      .populate('reported_user_id', 'fullName')
      .sort({ createdAt: -1 });

    res.json({ reports });
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update report status (requires admin authentication)
router.patch('/:id/status', protect, authorize('admin'), reportController.updateReportStatus);

// Upload file route
router.post('/upload', protect, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                message: 'No file uploaded' 
            });
        }
        
        // Return the relative file path
        const filePath = `uploads/${req.file.filename}`;
        res.json({ 
            success: true,
            filePath 
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error uploading file',
            error: error.message 
        });
    }
});

module.exports = router; 