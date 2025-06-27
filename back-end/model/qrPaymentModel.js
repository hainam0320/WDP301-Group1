const mongoose = require("mongoose");

const qrPaymentSchema = new mongoose.Schema({
  transactionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'CompanyTransaction'
  },
  qrCode: { 
    type: String, 
    required: true 
  },
  paymentCode: {
    type: String,
    required: true,
    unique: true
  },
  amount: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'expired'],
    default: 'pending'
  },
  expiryTime: { 
    type: Date,
    default: function() {
      return new Date(Date.now() + 15 * 60 * 1000); // 15 phút
    }
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  completedAt: {
    type: Date
  },
  bulkPayment: {
    type: Boolean,
    default: false
  },
  bulkTransactionIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompanyTransaction'
  }]
});

// Tạo index cho các trường quan trọng
qrPaymentSchema.index({ transactionId: 1 });
qrPaymentSchema.index({ paymentCode: 1 }, { unique: true });
qrPaymentSchema.index({ status: 1, expiryTime: 1 });
qrPaymentSchema.index({ bulkTransactionIds: 1 }, { sparse: true });

// Middleware để xử lý trước khi lưu
qrPaymentSchema.pre('save', function(next) {
  // Nếu là bulk payment, transactionId không bắt buộc
  if (this.bulkPayment && this.bulkTransactionIds && this.bulkTransactionIds.length > 0) {
    this.transactionId = this.bulkTransactionIds[0];
  } else if (!this.bulkPayment && !this.transactionId) {
    next(new Error('TransactionId is required for non-bulk payments'));
    return;
  }
  next();
});

module.exports = mongoose.model('QRPayment', qrPaymentSchema); 