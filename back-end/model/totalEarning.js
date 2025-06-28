const mongoose = require("mongoose");

const totalEarningSchema = new mongoose.Schema({
  driverAssigmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'DriverAssigment', required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true }, // 👉 THÊM TRƯỜNG NÀY
  amount: { type: Number, required: true },
  date: { type: String, required: true } // ví dụ: '2025-06-27'
});

module.exports = mongoose.model('TotalEarning', totalEarningSchema);
