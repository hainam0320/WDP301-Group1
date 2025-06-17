/* controllers/orderController.js */
const Order = require('../model/orderModel');

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
    const orders = await Order.find();
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
    const driverId = req.user._id; // Assuming the driver's ID is in the request user object

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

    res.json({
      message: 'Nhận đơn hàng thành công',
      order: order
    });
  } catch (error) {
    console.error('Error accepting order:', error);
    res.status(500).json({ message: 'Lỗi server khi nhận đơn hàng' });
  }
};