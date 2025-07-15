const mongoose = require("mongoose");

const qrPaymentSchema = new mongoose.Schema({
  transactionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'CompanyTransaction'
  },
  bulkBillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BulkBill'
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
qrPaymentSchema.index({ bulkBillId: 1 });
qrPaymentSchema.index({ bulkTransactionIds: 1 }, { sparse: true });

// Middleware để xử lý trước khi lưu
qrPaymentSchema.pre('save', function(next) {
  // Nếu là bulk payment, cần có bulkBillId
  if (this.bulkPayment && !this.bulkBillId) {
    next(new Error('BulkBillId is required for bulk payments'));
    return;
  }
  // Nếu không phải bulk payment, cần có transactionId
  if (!this.bulkPayment && !this.transactionId) {
    next(new Error('TransactionId is required for non-bulk payments'));
    return;
  }
  next();
});

module.exports = mongoose.model('QRPayment', qrPaymentSchema); 