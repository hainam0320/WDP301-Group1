const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const Driver = require('../model/driverModel');
const Order = require('../model/orderModel');

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

// Get available orders
router.get('/available', protect, async (req, res) => {
  try {
    // Kiểm tra xem user có phải là driver không
    if (req.user.constructor.modelName !== 'Driver') {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized as driver' 
      });
    }

    const availableOrders = await Order.find({ 
      status: 'pending',
      driverId: { $exists: false }
    }).populate('userId', 'name phone');

    res.json(availableOrders);
  } catch (error) {
    console.error('Error fetching available orders:', error);
    res.status(500).json({ message: 'Error fetching available orders' });
  }
});

// Accept order
router.post('/:orderId/accept', protect, async (req, res) => {
  try {
    // Kiểm tra xem user có phải là driver không
    if (req.user.constructor.modelName !== 'Driver') {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized as driver' 
      });
    }

    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.driverId) {
      return res.status(400).json({ message: 'Order already accepted by another driver' });
    }

    order.driverId = req.user._id;
    order.status = 'accepted';
    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    console.error('Error accepting order:', error);
    res.status(500).json({ message: 'Error accepting order' });
  }
});

// Get shipper's orders
router.get('/orders', protect, async (req, res) => {
  try {
    // Kiểm tra xem user có phải là driver không
    if (req.user.constructor.modelName !== 'Driver') {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized as driver' 
      });
    }

    const orders = await Order.find({ 
      driverId: req.user._id 
    }).populate('userId', 'name phone');

    res.json(orders);
  } catch (error) {
    console.error('Error fetching shipper orders:', error);
    res.status(500).json({ message: 'Error fetching shipper orders' });
  }
});

// Update order status
router.put('/orders/:orderId/status', protect, async (req, res) => {
  try {
    // Kiểm tra xem user có phải là driver không
    if (req.user.constructor.modelName !== 'Driver') {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized as driver' 
      });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Kiểm tra xem đơn hàng có phải của shipper này không
    if (order.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    order.status = status;
    await order.save();

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating order status' 
    });
  }
});

// Get shipper's earnings statistics
router.get('/earnings', protect, async (req, res) => {
  try {
    // Kiểm tra xem user có phải là driver không
    if (req.user.constructor.modelName !== 'Driver') {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized as driver' 
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);

    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);

    // Lấy các đơn hàng đã hoàn thành
    const completedOrders = await Order.find({
      driverId: req.user._id,
      status: 'completed'
    });

    // Tính toán thống kê
    const earnings = {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      total: 0,
      totalDeliveries: completedOrders.length
    };

    completedOrders.forEach(order => {
      const orderDate = new Date(order.updatedAt);
      earnings.total += order.price;

      if (orderDate >= today) {
        earnings.today += order.price;
      }
      if (orderDate >= oneWeekAgo) {
        earnings.thisWeek += order.price;
      }
      if (orderDate >= oneMonthAgo) {
        earnings.thisMonth += order.price;
      }
    });

    res.json({
      success: true,
      data: earnings
    });
  } catch (error) {
    console.error('Error getting earnings:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error getting earnings statistics' 
    });
  }
});

const handleMapClick = (location) => {
  if (!isSelectingPoint) return;
  handleLocationSelect(location, isSelectingPoint);
  setIsSelectingPoint(null);
};

module.exports = router; 