const User = require('../model/userModel');
const Order = require('../model/orderModel');
const Rate = require('../model/rateModel');
const Driver = require('../model/driverModel');
const mongoose = require('mongoose');

// Get dashboard statistics
exports.getStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get total users and drivers
    const [totalUsers, totalShippers] = await Promise.all([
      User.countDocuments({ isAdmin: false }), // Không đếm admin
      Driver.countDocuments({ status: true }) // Chỉ đếm tài xế đang hoạt động
    ]);

    // Get orders statistics
    const [totalOrders, todayOrders, completedOrders] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ status: 'completed' })
    ]);

    // Calculate total revenue
    const revenueAgg = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // Get active drivers (those who have completed orders today)
    const activeDrivers = await Order.distinct('driverId', {
      status: 'in-progress',
      updatedAt: { $gte: today }
    });

    // Get new users today
    const [newUsers, newDrivers] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: today }, isAdmin: false }),
      Driver.countDocuments({ createdAt: { $gte: today } })
    ]);

    // Calculate completion rate
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    // Get average rating
    const ratingAgg = await Rate.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rate' } } }
    ]);
    const averageRating = ratingAgg[0]?.avgRating || 0;

    // Calculate average delivery time (mock data for now)
    const averageDeliveryTime = 35; // In minutes

    // Calculate monthly growth (mock data for now)
    const monthlyGrowth = 12;

    res.json({
      totalUsers,
      totalShippers, // Changed from totalDrivers to totalShippers
      totalOrders,
      totalRevenue,
      todayOrders,
      activeDrivers: activeDrivers.length,
      newUsers: newUsers + newDrivers,
      completedOrders,
      completionRate,
      averageRating,
      averageDeliveryTime,
      monthlyGrowth
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ message: 'Error getting dashboard statistics' });
  }
};

// Get all users and drivers
exports.getUsers = async (req, res) => {
  try {
    // Get regular users (excluding admins)
    const users = await User.find({ isAdmin: false })
      .select('fullName email phone status createdAt avatar')
      .sort('-createdAt');

    // Get drivers
    const drivers = await Driver.find()
      .select('fullName email phone status createdAt avatar licensePlateImage')
      .sort('-createdAt');

    // Format users
    const formattedUsers = users.map(user => ({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      status: user.status,
      createdAt: user.createdAt,
      avatar: user.avatar,
      type: 'user'
    }));

    // Format drivers
    const formattedDrivers = drivers.map(driver => ({
      _id: driver._id,
      fullName: driver.fullName,
      email: driver.email,
      phone: driver.phone,
      status: driver.status,
      createdAt: driver._id.getTimestamp(), // Nếu không có createdAt thì lấy từ ObjectId
      avatar: driver.avatar,
      licensePlateImage: driver.licensePlateImage,
      type: 'driver'
    }));

    // Combine and send both users and drivers
    const allUsers = [...formattedUsers, ...formattedDrivers];
    
    res.json(allUsers);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Error getting users' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    // Try to find and delete from User collection
    let user = await User.findById(req.params.id);
    if (user) {
      await User.findByIdAndDelete(req.params.id);
      return res.json({ message: 'User deleted successfully' });
    }

    // If not found in User collection, try Driver collection
    let driver = await Driver.findById(req.params.id);
    if (driver) {
      await Driver.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Driver deleted successfully' });
    }

    return res.status(404).json({ message: 'User/Driver not found' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
};

// Update user status
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const newStatus = status === 'active';

    // Try to update in User collection
    let user = await User.findById(req.params.id);
    if (user) {
      user = await User.findByIdAndUpdate(
        req.params.id,
        { status: status },
        { new: true }
      );
      return res.json(user);
    }

    // If not found in User collection, try Driver collection
    let driver = await Driver.findById(req.params.id);
    if (driver) {
      driver = await Driver.findByIdAndUpdate(
        req.params.id,
        { status: newStatus },
        { new: true }
      );
      // Format driver response to match user structure
      const formattedDriver = {
        _id: driver._id,
        name: driver.fullName,
        email: driver.email,
        phone: driver.phone,
        role: 'driver',
        status: driver.status ? 'active' : 'inactive',
        createdAt: driver._id.getTimestamp()
      };
      return res.json(formattedDriver);
    }

    return res.status(404).json({ message: 'User/Driver not found' });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Error updating user status' });
  }
};

// Get all orders
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name')
      .populate('driverId', 'name')
      .sort('-createdAt');

    const formattedOrders = orders.map(order => ({
      _id: order._id,
      customer: order.userId.name,
      shipper: order.driverId ? order.driverId.name : 'Pending',
      from: order.pickupaddress,
      to: order.dropupaddress,
      price: order.price,
      status: order.status,
      date: order.createdAt
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ message: 'Error getting orders' });
  }
};

// Get revenue data
exports.getRevenue = async (req, res) => {
  try {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonth = new Date().getMonth();
    
    // Get last 3 months of revenue data
    const revenueData = await Promise.all(
      [2, 1, 0].map(async (monthsAgo) => {
        const monthIndex = (currentMonth - monthsAgo + 12) % 12;
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - monthsAgo);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        
        const [monthlyStats] = await Order.aggregate([
          {
            $match: {
              status: 'completed',
              createdAt: { $gte: startDate, $lt: endDate }
            }
          },
          {
            $group: {
              _id: null,
              revenue: { $sum: '$price' },
              orders: { $sum: 1 }
            }
          }
        ]);

        // Calculate growth (mock data for now)
        const growth = monthsAgo === 0 ? '+15%' : 
                      monthsAgo === 1 ? '+8%' : '+12%';

        return {
          month: `Tháng ${monthIndex + 1}`,
          revenue: monthlyStats?.revenue || 0,
          orders: monthlyStats?.orders || 0,
          growth
        };
      })
    );

    res.json(revenueData);
  } catch (error) {
    console.error('Error getting revenue data:', error);
    res.status(500).json({ message: 'Error getting revenue data' });
  }
}; 