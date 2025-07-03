/* controllers/orderController.js */
const Order = require('../model/orderModel');
const DriverAssigment = require('../model/driverAssigmentModel');
const TotalEarning = require('../model/totalEarning');
const CompanyTransaction = require('../model/companyTransisModel');
const Notification = require('../model/notificationModel');

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const {
      userId,
      type,
      phone,
      pickupaddress,
      dropupaddress,
      timeStart,
      timeEnd,
      price,
      status,
      distance_km
    } = req.body;

    // Validate required fields
    if (!userId || !type || !phone || !pickupaddress || !dropupaddress || !timeStart || !price || !status || !distance_km) {
      return res.status(400).json({
        message: 'Vui lòng điền đầy đủ thông tin đơn hàng',
        missingFields: {
          userId: !userId,
          type: !type,
          phone: !phone,
          pickupaddress: !pickupaddress,
          dropupaddress: !dropupaddress,
          timeStart: !timeStart,
          price: !price,
          status: !status,
          distance_km: !distance_km
        }
      });
    }

    // Validate userId matches authenticated user
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({
        message: 'Không có quyền tạo đơn hàng cho người dùng khác'
      });
    }

    const newOrder = new Order({
      userId,
      type,
      phone,
      pickupaddress,
      dropupaddress,
      timeStart,
      timeEnd,
      price,
      status,
      distance_km
    });

    const savedOrder = await newOrder.save();

    // Thông báo cho tất cả các tài xế đang online
    const { io, connectedUsers } = req;
    if (connectedUsers && connectedUsers.driver) {
      const driverSockets = Object.values(connectedUsers.driver);
      driverSockets.forEach(socketId => {
        io.to(socketId).emit('new_order_available', {
          title: 'Có đơn hàng mới!',
          message: `Một đơn hàng mới vừa được tạo gần bạn.`,
          order: savedOrder,
        });
      });
    }

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    // Check for validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Dữ liệu đơn hàng không hợp lệ',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    // Check for MongoDB errors
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return res.status(400).json({
        message: 'Lỗi cơ sở dữ liệu khi tạo đơn hàng',
        error: error.message
      });
    }
    res.status(500).json({ message: 'Lỗi server khi tạo đơn hàng' });
  }
};

// Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('driverId', 'fullName phone avatar licensePlateImage');
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error while fetching orders' });
  }
};

// Get a single order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error while fetching order' });
  }
};

// Update an existing order
exports.updateOrder = async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedOrder) return res.status(404).json({ message: 'Order not found' });
    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Server error while updating order' });
  }
};

// Delete an order
exports.deleteOrder = async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Server error while deleting order' });
  }
};

// Accept an order by driver
exports.acceptOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const driverId = req.user._id;
    const { io, connectedUsers } = req;

    // Use findOneAndUpdate with conditions to ensure atomicity
    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        driverId: { $exists: false }, // Only update if no driver is assigned
        status: 'pending' // Only update if order is still pending
      },
      {
        driverId: driverId,
        status: 'accepted'
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!order) {
      // Check if the order was already taken
      const existingOrder = await Order.findById(orderId);
      if (existingOrder && existingOrder.driverId) {
        return res.status(400).json({
          message: 'Đơn hàng này đã được shipper khác nhận',
          order: existingOrder
        });
      }
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng hoặc đơn hàng không khả dụng' });
    }

    // Tạo và lưu thông báo vào DB
    const notification = new Notification({
      recipient: order.userId,
      recipientModel: 'User',
      title: 'Tài xế đã nhận đơn!',
      message: `Tài xế ${req.user.fullName} đang trên đường đến chỗ bạn.`,
      type: 'ORDER_ACCEPTED',
      link: `/order-tracking/${order._id}`
    });
    await notification.save();

    // Gửi thông báo cho người dùng đã tạo đơn hàng
    const userId = order.userId.toString();
    const userSocketId = (connectedUsers && connectedUsers.user) ? connectedUsers.user[userId] : null;

    if (userSocketId) {
      io.to(userSocketId).emit('notification', {
        title: 'Tài xế đã nhận đơn!',
        message: `Tài xế ${req.user.fullName} đang trên đường đến chỗ bạn.`,
        orderId: order._id,
        type: 'ORDER_ACCEPTED'
      });
    }

    res.json({
      message: 'Nhận đơn hàng thành công',
      order: order
    });
  } catch (error) {
    console.error('Error accepting order:', error);
    res.status(500).json({ message: 'Lỗi server khi nhận đơn hàng' });
  }
};

exports.completeOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const driverId = req.user._id; // Shipper xác nhận hoàn tất

    // 1. Cập nhật trạng thái đơn
    const order = await Order.findOneAndUpdate(
      { _id: orderId, driverId: driverId },
      { status: 'completed', timeEnd: new Date().toISOString() },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Đơn không tồn tại hoặc không thuộc tài xế này' });
    }

    // 2. Tạo DriverAssigment nếu chưa có
    const existingAssignment = await DriverAssigment.findOne({ orderId });
    let assignment = existingAssignment;

    if (!assignment) {
      assignment = await DriverAssigment.create({
        driverId,
        orderId,
        amount: order.price,
        date: new Date().toISOString().split("T")[0]
      });
    }

    // 3. Tạo TotalEarning
    const earning = await TotalEarning.create({
      driverAssigmentId: assignment._id,
      driverId: driverId,
      amount: assignment.amount,
      date: assignment.date
    });

    // 4. Tạo CompanyTransaction (hoa hồng 10%)
    const commission = await CompanyTransaction.create({
      driverId,
      total_earning_id: earning._id,
      amount: earning.amount * 0.1,
      status: 'pending'
    });

    res.json({
      message: 'Hoàn tất đơn và ghi nhận thu nhập thành công',
      order,
      earning,
      commission
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi hoàn tất đơn' });
  }
};
