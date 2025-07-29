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
    if (filePath.startsWith('uploads/')) {
        return filePath;
    }
    const relativePath = filePath.split('\\uploads\\')[1];
    if (relativePath) {
        return `uploads/${relativePath}`;
    }
    return filePath;
};

// Route cập nhật profile shipper
router.put('/profile', protect, async (req, res) => {
    try {
        if (req.user.constructor.modelName !== 'Driver') {
            return res.status(403).json({ 
                success: false,
                message: 'Không có quyền tài xế' 
            });
        }

        const { fullName, phone, avatar, cmndFront, cmndBack, licensePlateImage } = req.body;
        const driverId = req.user._id;

        if (!fullName || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Họ và tên và số điện thoại là bắt buộc'
            });
        }

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
            return res.status(404).json({ 
                success: false,
                message: 'Không tìm thấy tài xế' 
            });
        }

        const { password, ...driverData } = updatedDriver.toObject();
        res.json({
            success: true,
            data: driverData
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Lỗi xác thực',
                errors: messages
            });
        }
        res.status(500).json({ 
            success: false,
            message: 'Lỗi cập nhật hồ sơ',
            error: error.message 
        });
    }
});

// Route upload file
router.post('/upload', protect, upload.single('file'), (req, res) => {
    try {
        if (req.user.constructor.modelName !== 'Driver') {
            return res.status(403).json({ 
                success: false,
                message: 'Không có quyền tài xế' 
            });
        }

        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                message: 'Không có file nào được tải lên' 
            });
        }
        
        const filePath = `uploads/${req.file.filename}`;
        res.json({ 
            success: true,
            filePath 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Lỗi tải file lên',
            error: error.message 
        });
    }
});

// Get available orders
router.get('/available', protect, async (req, res) => {
  try {
    if (req.user.constructor.modelName !== 'Driver') {
      return res.status(403).json({ 
        success: false,
        message: 'Không có quyền tài xế' 
      });
    }

    // Kiểm tra các giao dịch hoa hồng loại 'pending' (tức là tài xế còn nợ hoa hồng theo luồng cũ)
    // Hoặc nếu quy định là tài xế có số dư âm thì không cho nhận đơn mới.
    // Nếu luồng thanh toán thay đổi, phần này cần được xem xét lại.
    // Hiện tại, ta sẽ bỏ qua điều kiện hoa hồng quá 3 ngày nếu luồng là user trả trước.

    // Theo luồng mới, tài xế có thể nhận đơn ngay khi user thanh toán thành công
    const availableOrders = await Order.find({ 
      status: 'payment_successful', // Chỉ lấy đơn đã thanh toán và đang chờ shipper
      driverId: { $exists: false }
    }).populate('userId', 'fullName phone');

    res.json(availableOrders);
  } catch (error) {
    console.error('Lỗi lấy danh sách đơn hàng khả dụng:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy đơn hàng khả dụng' });
  }
});

// Accept order (logic này vẫn giữ nguyên vì nó xác nhận shipper nhận đơn)
router.post('/:orderId/accept', protect, async (req, res) => {
  try {
    if (req.user.constructor.modelName !== 'Driver') {
      return res.status(403).json({ 
        success: false,
        message: 'Không có quyền tài xế' 
      });
    }

    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    // Kiểm tra trạng thái đơn hàng: chỉ chấp nhận đơn khi đã thanh toán thành công và chưa có tài xế
    if (order.status !== 'payment_successful' || order.driverId) {
      return res.status(400).json({ message: 'Đơn hàng không khả dụng để nhận' });
    }

    order.driverId = req.user._id;
    order.status = 'accepted';
    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    console.error('Lỗi chấp nhận đơn hàng:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi chấp nhận đơn hàng' });
  }
});

// Get shipper's orders
router.get('/orders', protect, async (req, res) => {
  try {
    if (req.user.constructor.modelName !== 'Driver') {
      return res.status(403).json({ 
        success: false,
        message: 'Không có quyền tài xế' 
      });
    }

    const orders = await Order.find({ 
      driverId: req.user._id,
      status: { $nin: ['pending_payment', 'payment_successful', 'payment_failed', 'refunded'] } // Loại trừ các trạng thái liên quan đến thanh toán ban đầu
    }).populate('userId', 'fullName phone');

    res.json(orders);
  } catch (error) {
    console.error('Lỗi lấy đơn hàng của shipper:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy đơn hàng của shipper' });
  }
});

// Update order status by shipper
router.put('/orders/:orderId/status', protect, async (req, res) => {
  try {
    if (req.user.constructor.modelName !== 'Driver') {
      return res.status(403).json({ 
        success: false,
        message: 'Không có quyền tài xế' 
      });
    }

    const { status, statusDescription } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái là bắt buộc'
      });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    if (order.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền cập nhật đơn hàng này'
      });
    }

    const oldStatus = order.status;
    order.status = status;
    if ((status === 'shipper_completed' || status === 'failed') && statusDescription) {
      order.statusDescription = statusDescription;
    } else {
        order.statusDescription = undefined; // Clear description if not applicable
    }
    await order.save();

    // Loại bỏ logic tạo CompanyTransaction và TotalEarning ở đây
    // vì việc này sẽ được xử lý khi người dùng xác nhận hoàn tất đơn hàng.

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái đơn hàng:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi cập nhật trạng thái đơn hàng',
      error: error.message
    });
  }
});

// Get shipper's earnings statistics (logic này vẫn cần để hiển thị thu nhập)
router.get('/earnings', protect, async (req, res) => {
  try {
    if (req.user.constructor.modelName !== 'Driver') {
      return res.status(403).json({ 
        success: false,
        message: 'Không có quyền tài xế' 
      });
    }

    const driverId = new mongoose.Types.ObjectId(req.user._id);

    // Tính toán thu nhập dựa trên các giao dịch payout_to_driver thành công
    const stats = await CompanyTransaction.aggregate([
      {
        $match: {
          driverId: driverId,
          type: 'payout_to_driver',
          status: 'disbursed_to_driver' // Chỉ tính tiền đã giải ngân
        }
      },
      {
        $facet: {
          today: [
            {
              $match: {
                processed_at: { $gte: new Date(new Date().setHours(0,0,0,0)) }
              }
            },
            {
              $group: {
                _id: null,
                earnings: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            }
          ],
          thisWeek: [
            {
              $match: {
                processed_at: { $gte: new Date(new Date().setDate(new Date().getDate() - 7)) }
              }
            },
            {
              $group: {
                _id: null,
                earnings: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            }
          ],
          thisMonth: [
            {
              $match: {
                processed_at: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) }
              }
            },
            {
              $group: {
                _id: null,
                earnings: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            }
          ],
          total: [
            {
              $group: {
                _id: null,
                earnings: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            }
          ],
          // Lấy số dư hiện tại từ Driver model
          currentBalance: [
            { $lookup: { from: 'drivers', localField: 'driverId', foreignField: '_id', as: 'driverInfo' } },
            { $unwind: '$driverInfo' },
            { $project: { _id: 0, balance: '$driverInfo.balance' } }
          ]
        }
      }
    ]);

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
      },
      currentBalance: stats[0].currentBalance[0]?.balance || 0 // Thêm số dư hiện tại
    };

    res.json({
      success: true,
      data: earnings
    });
  } catch (error) {
    console.error('Lỗi lấy thống kê thu nhập:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi lấy thống kê thu nhập',
      error: error.message 
    });
  }
});

// GET count of available orders
router.get('/orders/available/count', protect, async (req, res) => {
  try {
    if (req.user.constructor.modelName !== 'Driver') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const count = await Order.countDocuments({ 
      status: 'payment_successful', // Chỉ đếm đơn đã thanh toán
      driverId: { $exists: false } 
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching available orders count' });
  }
});

// GET count of ongoing orders for the current driver
router.get('/orders/ongoing/count', protect, async (req, res) => {
  try {
    if (req.user.constructor.modelName !== 'Driver') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const count = await Order.countDocuments({
      driverId: req.user._id,
      status: { $in: ['accepted', 'in_progress'] } // Trạng thái đang thực hiện
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching ongoing orders count' });
  }
});

module.exports = router;