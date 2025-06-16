const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const Driver = require('../model/driverModel');

// Cấu hình multer cho việc upload file
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

// Hàm chuyển đổi đường dẫn file thành định dạng URL
const getRelativePath = (filePath) => {
    if (!filePath) return '';
    // Nếu path đã là đường dẫn tương đối
    if (filePath.startsWith('uploads/')) {
        return filePath;
    }
    // Chuyển đổi đường dẫn đầy đủ thành tương đối
    const relativePath = filePath.split('\\uploads\\')[1];
    if (relativePath) {
        return `uploads/${relativePath}`;
    }
    return filePath;
};

// Route cập nhật profile shipper
router.put('/profile', protect, async (req, res) => {
    try {
        console.log('=== UPDATE PROFILE ===');
        console.log('User:', req.user);
        console.log('Body:', req.body);

        // Kiểm tra xem user có phải là driver không
        if (req.user.constructor.modelName !== 'Driver') {
            console.log('Not authorized as driver');
            return res.status(403).json({ 
                success: false,
                message: 'Not authorized as driver' 
            });
        }

        const { fullName, phone, avatar, cmndFront, cmndBack, licensePlateImage } = req.body;
        const driverId = req.user._id;

        // Validate input
        if (!fullName || !phone) {
            console.log('Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Full name and phone are required'
            });
        }

        // Cập nhật thông tin driver trong database
        const updatedDriver = await Driver.findByIdAndUpdate(
            driverId,
            {
                fullName,
                phone,
                avatar: getRelativePath(avatar),
                cmndFront: getRelativePath(cmndFront),
                cmndBack: getRelativePath(cmndBack),
                licensePlateImage: getRelativePath(licensePlateImage),
                updatedAt: Date.now()
            },
            { 
                new: true,
                runValidators: true 
            }
        );

        if (!updatedDriver) {
            console.log('Driver not found');
            return res.status(404).json({ 
                success: false,
                message: 'Driver not found' 
            });
        }

        console.log('Profile updated successfully');
        console.log('Updated driver:', updatedDriver);

        // Loại bỏ password trước khi gửi response
        const { password, ...driverData } = updatedDriver.toObject();
        res.json({
            success: true,
            data: driverData
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: messages
            });
        }

        // Handle other errors
        res.status(500).json({ 
            success: false,
            message: 'Error updating profile',
            error: error.message 
        });
    }
});

// Route upload file
router.post('/upload', protect, upload.single('file'), (req, res) => {
    try {
        console.log('=== UPLOAD FILE ===');
        console.log('User:', req.user);
        console.log('File:', req.file);

        // Kiểm tra xem user có phải là driver không
        if (req.user.constructor.modelName !== 'Driver') {
            console.log('Not authorized as driver');
            return res.status(403).json({ 
                success: false,
                message: 'Not authorized as driver' 
            });
        }

        if (!req.file) {
            console.log('No file uploaded');
            return res.status(400).json({ 
                success: false,
                message: 'No file uploaded' 
            });
        }
        
        // Trả về đường dẫn file đã upload
        const filePath = `uploads/${req.file.filename}`; // Sử dụng đường dẫn tương đối
        console.log('File uploaded successfully:', filePath);
        
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

const handleMapClick = (location) => {
  if (!isSelectingPoint) return;
  handleLocationSelect(location, isSelectingPoint);
  setIsSelectingPoint(null);
};

module.exports = router; 