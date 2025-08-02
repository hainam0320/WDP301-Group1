// models/DriverTransaction.js
const mongoose = require('mongoose');

const driverTransactionSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  amount: { type: Number, required: true },
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }], // hoặc totalEarning ids
  status: { type: String, enum: ['paid'], default: 'paid' },
  note: String,
  paidAt: { type: Date, default: Date.now },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('DriverTransaction', driverTransactionSchema);
