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
        cb(null, path.join(__dirname, '..', 'uploads'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 5 // Maximum 5 files at once
    },
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Chỉ chấp nhận file ảnh!'), false);
        }
        cb(null, true);
    }
});

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

// Update report with additional information (requires user authentication)
router.put('/:id', protect, authorize('user'), reportController.updateReport);

// Upload file route - now supports multiple files
router.post('/upload', protect, (req, res, next) => {
    console.log('=== UPLOAD REPORT IMAGES ===');
    console.log('Request headers:', req.headers);
    console.log('User authenticated:', req.user ? 'Yes' : 'No');
    
    upload.array('files', 5)(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: 'File quá lớn. Kích thước tối đa là 5MB'
                    });
                }
                if (err.code === 'LIMIT_FILE_COUNT') {
                    return res.status(400).json({
                        success: false,
                        message: 'Quá nhiều file. Tối đa 5 file một lần'
                    });
                }
                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    return res.status(400).json({
                        success: false,
                        message: 'Tên field không đúng. Sử dụng "files"'
                    });
                }
                return res.status(400).json({
                    success: false,
                    message: 'Lỗi upload file: ' + err.message
                });
            }
            
            if (err.message && err.message.includes('Chỉ chấp nhận file ảnh')) {
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }
            
            return res.status(400).json({
                success: false,
                message: 'Lỗi upload file: ' + err.message
            });
        }
        
        try {
            console.log('Request body keys:', Object.keys(req.body));
            console.log('Files received:', req.files ? req.files.length : 0);
            
            if (!req.files || req.files.length === 0) {
                console.log('No files received');
                return res.status(400).json({ 
                    success: false,
                    message: 'Không có file nào được tải lên' 
                });
            }
            
            console.log('Files details:', req.files.map(f => ({
                originalname: f.originalname,
                filename: f.filename,
                size: f.size,
                mimetype: f.mimetype
            })));
            
            // Return the relative file paths
            const filePaths = req.files.map(file => `uploads/${file.filename}`);
            console.log('File paths to return:', filePaths);
            
            res.json({ 
                success: true,
                filePaths 
            });
        } catch (error) {
            console.error('Error uploading files:', error);
            res.status(500).json({ 
                success: false,
                message: error.message || 'Lỗi khi tải file lên',
                error: error.message 
            });
        }
    });
});



module.exports = router; 