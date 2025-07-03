const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const Driver = require('../model/driverModel');
const Order = require('../model/orderModel');
const mongoose = require('mongoose');
const TotalEarning = require('../model/totalEarning');
const CompanyTransaction = require('../model/companyTransisModel');
const DriverAssignment = require('../model/driverAssigmentModel');

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
    console.log('=== UPDATE ORDER STATUS ===');
    // Kiểm tra xem user có phải là driver không
    if (req.user.constructor.modelName !== 'Driver') {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized as driver' 
      });
    }

    const { status, statusDescription } = req.body;
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

    const oldStatus = order.status;
    order.status = status;
    if ((status === 'completed' || status === 'failed') && statusDescription) {
      order.statusDescription = statusDescription;
    }
    await order.save();

    console.log('Order updated:', {
      orderId: order._id,
      oldStatus,
      newStatus: status,
      statusDescription: order.statusDescription,
      price: order.price
    });

    // Nếu đơn hàng vừa được cập nhật thành completed
    if (status === 'completed' && oldStatus !== 'completed') {
      try {
        console.log('Creating earnings records...');
        
        // Tạo bản ghi DriverAssignment
        const driverAssignment = new DriverAssignment({
          driverId: req.user._id,
          orderId: order._id,
          amount: order.price,
          status: true,
          date: new Date().toISOString().split('T')[0]
        });
        await driverAssignment.save();
        console.log('Driver assignment created:', driverAssignment);

        // Tạo bản ghi TotalEarning
        const totalEarning = new TotalEarning({
          driverAssigmentId: driverAssignment._id,
          driverId: req.user._id,
          amount: order.price,
          date: new Date().toISOString().split('T')[0]
        });
        await totalEarning.save();
        console.log('Total earning created:', totalEarning);

        // Tính hoa hồng (10% giá trị đơn hàng)
        const commissionRate = 0.1;
        const commissionAmount = order.price * commissionRate;

        // Tạo bản ghi CompanyTransaction
        const transaction = new CompanyTransaction({
          driverId: req.user._id,
          total_earning_id: totalEarning._id,
          amount: commissionAmount,
          status: 'pending'
        });
        await transaction.save();
        console.log('Commission transaction created:', transaction);
      } catch (error) {
        console.error('Error creating earnings records:', error);
        // Không throw error ở đây để vẫn trả về success cho việc update order
      }
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
});

// Get shipper's earnings statistics
router.get('/earnings', protect, async (req, res) => {
  try {
    console.log('=== GET EARNINGS ===');
    console.log('User:', req.user);

    // Kiểm tra xem user có phải là driver không
    if (req.user.constructor.modelName !== 'Driver') {
      console.log('Not authorized as driver');
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized as driver' 
      });
    }

    if (!req.user._id) {
      console.log('User ID not found');
      return res.status(400).json({
        success: false,
        message: 'User ID not found'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);

    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);

    console.log('Dates:', {
      today: today.toISOString(),
      oneWeekAgo: oneWeekAgo.toISOString(),
      oneMonthAgo: oneMonthAgo.toISOString()
    });

    const driverId = new mongoose.Types.ObjectId(req.user._id);
    console.log('Driver ID:', driverId);

    // Sử dụng aggregation để tính toán
    const stats = await Order.aggregate([
      {
        $match: {
          driverId: driverId,
          status: 'completed'
        }
      },
      {
        $facet: {
          today: [
            {
              $match: {
                updatedAt: { $gte: today }
              }
            },
            {
              $group: {
                _id: null,
                earnings: { $sum: '$price' },
                count: { $sum: 1 }
              }
            }
          ],
          thisWeek: [
            {
              $match: {
                updatedAt: { $gte: oneWeekAgo }
              }
            },
            {
              $group: {
                _id: null,
                earnings: { $sum: '$price' },
                count: { $sum: 1 }
              }
            }
          ],
          thisMonth: [
            {
              $match: {
                updatedAt: { $gte: oneMonthAgo }
              }
            },
            {
              $group: {
                _id: null,
                earnings: { $sum: '$price' },
                count: { $sum: 1 }
              }
            }
          ],
          total: [
            {
              $group: {
                _id: null,
                earnings: { $sum: '$price' },
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    console.log('Aggregation results:', JSON.stringify(stats, null, 2));

    // Format kết quả
    const earnings = {
      today: stats[0].today[0]?.earnings || 0,
      thisWeek: stats[0].thisWeek[0]?.earnings || 0,
      thisMonth: stats[0].thisMonth[0]?.earnings || 0,
      total: stats[0].total[0]?.earnings || 0,
      deliveries: {
        today: stats[0].today[0]?.count || 0,
        thisWeek: stats[0].thisWeek[0]?.count || 0,
        thisMonth: stats[0].thisMonth[0]?.count || 0,
        total: stats[0].total[0]?.count || 0
      }
    };

    console.log('Final earnings:', earnings);

    res.json({
      success: true,
      data: earnings
    });
  } catch (error) {
    console.error('Error getting earnings:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error getting earnings statistics',
      error: error.message 
    });
  }
});

module.exports = router; 