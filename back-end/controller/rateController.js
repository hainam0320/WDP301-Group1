// controllers/rateController.js
const Rate = require('../model/rateModel');

// Create a new rating
exports.createRate = async (req, res) => {
  try {
    const { userId, driverId, orderId, rate, comment } = req.body;
    const newRate = new Rate({ userId, driverId, orderId, rate, comment });
    const savedRate = await newRate.save();
    res.status(201).json(savedRate);
  } catch (error) {
    res.status(500).json({ message: 'Error creating rate', error: error.message });
  }
};

// Get rates by orderId
exports.getRatesByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const rates = await Rate.find({ orderId: orderId })
      .populate('userId', 'fullName email')
      .populate('driverId', 'fullName');
    
    res.status(200).json(rates);
  } catch (error) {
    console.error('Error getting rates by order:', error);
    res.status(500).json({ message: 'Error fetching rates for order', error: error.message });
  }
};

