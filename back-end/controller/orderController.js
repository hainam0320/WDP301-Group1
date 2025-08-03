/* controllers/orderController.js */
const Order = require('../model/orderModel');
const DriverAssigment = require('../model/driverAssigmentModel');
const TotalEarning = require('../model/totalEarning');
const CompanyTransaction = require('../model/companyTransisModel');
const Notification = require('../model/notificationModel');
const Driver = require('../model/driverModel'); // Thêm để truy cập Driver model

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
      distance_km,
      itemType, // Thêm cho loại delivery
      weight_kg, // Thêm cho loại delivery
      dimensions // Thêm cho loại delivery
    } = req.body;

    // Validate required fields
    if (!userId || !type || !phone || !pickupaddress || !dropupaddress || !timeStart || !price || !distance_km) {
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

    // Tạo đơn hàng với trạng thái chờ thanh toán
    const newOrder = new Order({
      userId,
      type,
      phone,
      pickupaddress,
      dropupaddress,
      timeStart,
      timeEnd,
      price,
      status: 'pending_payment', // Trạng thái mặc định mới: chờ thanh toán
      paymentStatus: 'unpaid',
      distance_km,
      itemType,
      weight_kg,
      dimensions
    });

    const savedOrder = await newOrder.save();

    // Không thông báo cho tài xế ngay lập tức, mà chờ sau khi thanh toán thành công.
    // Logic thông báo cho tài xế sẽ nằm trong paymentController.js sau khi VNPAY callback thành công.

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Dữ liệu đơn hàng không hợp lệ',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return res.status(400).json({
        message: 'Lỗi cơ sở dữ liệu khi tạo đơn hàng',
        error: error.message
      });
    }
    res.status(500).json({ message: 'Lỗi server khi tạo đơn hàng' });
  }
};

// Get all orders (for general purpose, might filter by user later)
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

    // Chỉ cho phép nhận đơn nếu trạng thái là 'payment_successful' và chưa có tài xế
    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        driverId: { $exists: false }, // Only update if no driver is assigned
        status: 'payment_successful' // Chỉ nhận đơn khi thanh toán đã thành công và tiền đã giữ
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

    // === Cập nhật driverId cho transaction user_payment_held ===
    if (order) {
      await CompanyTransaction.updateMany(
        { orderId: order._id, type: 'user_payment_held', driverId: { $exists: false } },
        { $set: { driverId: driverId } }
      );
    }

    if (!order) {
      const existingOrder = await Order.findById(orderId);
      if (existingOrder && existingOrder.driverId) {
        return res.status(400).json({
          message: 'Đơn hàng này đã được shipper khác nhận',
          order: existingOrder
        });
      }
      if (existingOrder && existingOrder.status !== 'payment_successful') {
        return res.status(400).json({
            message: `Đơn hàng không ở trạng thái khả dụng để nhận (${existingOrder.status})`
        });
      }
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng hoặc đơn hàng không khả dụng' });
    }

    const notification = new Notification({
      recipient: order.userId,
      recipientModel: 'User',
      title: 'Tài xế đã nhận đơn!',
      message: `Tài xế ${req.user.fullName} đang trên đường đến chỗ bạn.`,
      type: 'ORDER_ACCEPTED',
      link: `/order-tracking/${order._id}`
    });
    await notification.save();

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

// Shipper đánh dấu đơn hàng hoàn thành
exports.completeOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const driverId = req.user._id;
    const { statusDescription, isFailed } = req.body; // Thêm trường isFailed để xác định giao hàng thất bại

    // Nếu shipper báo giao hàng thất bại, chuyển trạng thái sang 'disputed'
    let newStatus = 'shipper_completed';
    if (isFailed === true || (statusDescription && (
      statusDescription.toLowerCase().includes('fail') || 
      statusDescription.toLowerCase().includes('thất bại') ||
      statusDescription.toLowerCase().includes('dispute') ||
      statusDescription.toLowerCase().includes('tranh chấp')
    ))) {
      newStatus = 'disputed';
      console.log('Order will be marked as disputed due to delivery failure');
    }

    const order = await Order.findOneAndUpdate(
      { _id: orderId, driverId: driverId, status: { $in: ['accepted', 'in_progress'] } }, // Chỉ hoàn thành đơn đang accepted/in_progress
      { status: newStatus, timeEnd: new Date().toISOString(), statusDescription: statusDescription || (newStatus === 'disputed' ? 'Giao hàng thất bại' : 'Hoàn thành bởi tài xế') },
      { new: true }
    );

    // Nếu đơn hàng bị tranh chấp, cập nhật CompanyTransaction liên quan sang 'disputed'
    if (order && newStatus === 'disputed') {
      console.log('Updating CompanyTransaction to disputed for order:', order._id);
      
      const updateResult = await CompanyTransaction.updateMany(
        { orderId: order._id },
        { $set: { status: 'disputed' } }
      );
      
      console.log('Updated CompanyTransaction count:', updateResult.modifiedCount);
    }

    if (!order) {
      return res.status(404).json({ message: 'Đơn không tồn tại, không thuộc tài xế này hoặc không ở trạng thái phù hợp để hoàn thành' });
    }

    // Không tạo DriverAssigment, TotalEarning, CompanyTransaction ở đây nữa.
    // Việc này sẽ được xử lý khi user xác nhận hoàn tất.

    res.json({
      message: 'Shipper đã đánh dấu hoàn thành đơn hàng',
      order,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái đơn hàng (shipper_completed)' });
  }
};

// Người dùng xác nhận hoàn thành đơn hàng (NEW FUNCTION)
exports.userConfirmCompletion = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user._id;
    const { io, connectedUsers } = req;

    const order = await Order.findOne({ _id: orderId, userId: userId });

    if (!order) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại hoặc không thuộc về bạn' });
    }

    if (order.status !== 'shipper_completed') {
      return res.status(400).json({ message: 'Đơn hàng chưa được shipper hoàn thành hoặc đã được xác nhận.' });
    }

    // Kiểm tra xem có tranh chấp nào đang diễn ra cho đơn hàng này không
    const existingReport = await require('../model/reportModel').findOne({ order_id: order._id, status: { $in: ['pending', 'reviewed'] } });
    if (existingReport) {
        return res.status(400).json({ message: 'Đơn hàng đang có tranh chấp. Vui lòng chờ admin giải quyết.' });
    }

    // Cập nhật trạng thái đơn hàng sang user_confirmed_completion
    order.status = 'user_confirmed_completion';
    await order.save();

    // Bước 1: Trích hoa hồng (10%)
    const commissionRate = 0.1;
    const commissionAmount = order.price * commissionRate;

    const commissionTransaction = new CompanyTransaction({
        userId: order.userId,
        driverId: order.driverId,
        orderId: order._id,
        amount: commissionAmount,
        status: 'commission_collected', // Trạng thái mới: hoa hồng đã được trích
        type: 'commission',
        processed_at: new Date(),
        remarks: `Hoa hồng ${commissionRate * 100}% từ đơn hàng ${order._id}`
    });
    await commissionTransaction.save();

    // Bước 2: Giải ngân 90% còn lại vào ví của shipper
    const shipperPayout = order.price - commissionAmount;

    // Cập nhật balance cho tài xế
    const driver = await Driver.findByIdAndUpdate(
        order.driverId,
        { $inc: { balance: shipperPayout } }, // Tăng số dư của tài xế
        { new: true }
    );

    if (!driver) {
        console.error('Driver not found for payout:', order.driverId);
        // Có thể cần rollback hoặc xử lý lỗi mạnh mẽ hơn ở đây
        return res.status(500).json({ message: 'Không tìm thấy tài xế để giải ngân.' });
    }

    const payoutTransaction = new CompanyTransaction({
        userId: order.userId, // Giao dịch này vẫn liên quan đến user đặt đơn
        driverId: order.driverId,
        orderId: order._id,
        amount: shipperPayout,
        status: 'disbursed_to_driver', // Trạng thái mới: đã giải ngân cho tài xế
        type: 'payout_to_driver',
        payment_method: 'system_transfer', // Hoặc 'bank_transfer' nếu có tích hợp
        processed_at: new Date(),
        remarks: `Giải ngân 90% cho tài xế từ đơn hàng ${order._id}`
    });
    await payoutTransaction.save();

    // Cập nhật trạng thái đơn hàng sang driver_paid sau khi giải ngân thành công
    order.status = 'driver_paid';
    await order.save();

    // Tạo bản ghi TotalEarning để theo dõi tổng thu nhập của tài xế
    // (Nếu TotalEarning chỉ dùng để theo dõi tổng tiền trước hoa hồng, có thể tạo ở đây)
    const totalEarning = new TotalEarning({
        driverId: order.driverId,
        orderId: order._id, // Có thể thêm orderId vào TotalEarning model
        amount: order.price, // Tổng tiền của đơn hàng trước khi trừ hoa hồng
        date: new Date().toISOString().split("T")[0]
    });
    await totalEarning.save();

    // Thông báo cho tài xế về việc nhận tiền
    const driverSocketId = (connectedUsers && connectedUsers.driver) ? connectedUsers.driver[order.driverId.toString()] : null;
    if (driverSocketId) {
        io.to(driverSocketId).emit('notification', {
            title: 'Bạn đã nhận thanh toán!',
            message: `Bạn vừa nhận ${shipperPayout.toLocaleString()} VNĐ từ đơn hàng #${order._id.slice(-6)}.`,
            type: 'GENERAL',
            link: '/shipper/earnings'
        });
    }

    res.json({
      message: 'Xác nhận hoàn tất đơn hàng thành công. Tiền đã được giải ngân.',
      order,
      commissionTransaction,
      payoutTransaction,
      newDriverBalance: driver.balance
    });

  } catch (error) {
    console.error('Error confirming order completion:', error);
    res.status(500).json({ message: 'Lỗi server khi xác nhận hoàn tất đơn hàng' });
  }
};