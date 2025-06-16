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
exports.getRatesByDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    const rates = await Rate.find({ driverId })
      .populate('userId', 'name email')
      .populate('driverId', 'name vehicle')
      .populate('orderId');
    if (!rates || rates.length === 0) {
      return res.status(404).json({ message: 'No ratings found for this driver' });
    }
    res.status(200).json(rates);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching ratings by driver', error: error.message });
  }
};
exports.updateRatesByDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    const updateData = req.body;
    const result = await Rate.updateMany(
      { driverId },
      { $set: updateData },
      { runValidators: true }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'No ratings found for this driver' });
    }
    res.status(200).json({ message: `${result.modifiedCount} rate(s) updated` });
  } catch (error) {
    res.status(500).json({ message: 'Error updating ratings by driver', error: error.message });
  }
};