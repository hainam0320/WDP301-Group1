const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const User = require('../model/userModel');

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

// Route cập nhật profile user
router.put('/profile', protect, async (req, res) => {
    try {
        console.log('=== UPDATE USER PROFILE ===');
        console.log('User:', req.user);
        console.log('Body:', req.body);

        // Kiểm tra xem user có phải là user thường không
        if (req.user.constructor.modelName !== 'User') {
            console.log('Not authorized as user');
            return res.status(403).json({ 
                success: false,
                message: 'Not authorized as user' 
            });
        }

        const { fullName, phone, address, avatar } = req.body;
        const userId = req.user._id;

        // Validate input
        if (!fullName || !phone || !address) {
            console.log('Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Full name, phone and address are required'
            });
        }

        // Cập nhật thông tin user trong database
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                fullName,
                phone,
                address,
                avatar: getRelativePath(avatar),
                updatedAt: Date.now()
            },
            { 
                new: true,
                runValidators: true 
            }
        );

        if (!updatedUser) {
            console.log('User not found');
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        console.log('Profile updated successfully');
        console.log('Updated user:', updatedUser);

        // Loại bỏ password trước khi gửi response
        const { password, ...userData } = updatedUser.toObject();
        res.json({
            success: true,
            data: userData
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

        // Kiểm tra xem user có phải là user thường không
        if (req.user.constructor.modelName !== 'User') {
            console.log('Not authorized as user');
            return res.status(403).json({ 
                success: false,
                message: 'Not authorized as user' 
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

// Lấy profile user hiện tại
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// Xác thực email
const userController = require('../controller/userController');
router.post('/verify-email/send', protect, userController.sendEmailVerification);
router.post('/verify-email/confirm', protect, userController.verifyEmailCode);
router.post('/forgot-password/send', userController.sendForgotPasswordCode);
router.post('/forgot-password/reset', userController.resetPassword);
// Change password
router.post('/change-password', protect, userController.changePassword);

module.exports = router; 