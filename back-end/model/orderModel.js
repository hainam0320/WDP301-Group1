const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderSchema = new Schema({
  userId:           { type: Schema.Types.ObjectId, ref: 'User',   required: true },
  driverId:         { type: Schema.Types.ObjectId, ref: 'Driver' },
  type:             { type: String, enum: ['order','delivery'], default: 'order', required: true },
  phone:            { type: String, required: true },
  pickupaddress:    { type: String, required: true },
  dropupaddress:    { type: String, required: true },
  timeStart:        { type: String, required: true },
  timeEnd:          { type: String },
  price:            { type: Number, required: true },
  // Cập nhật enum cho trường status để phản ánh luồng thanh toán mới
  status:           { 
    type: String, 
    required: true,
    enum: [
      'pending_payment',      // Đơn hàng chờ thanh toán từ user
      'payment_successful',   // User đã thanh toán, tiền đang được giữ (chờ shipper nhận)
      'payment_failed',       // Thanh toán thất bại
      'accepted',             // Shipper đã nhận đơn
      'in_progress',          // Shipper đang thực hiện
      'shipper_completed',    // Shipper đã đánh dấu hoàn thành
      'user_confirmed_completion', // User đã xác nhận hoàn thành, tiền đã giải ngân cho shipper
      'disputed',             // Có tranh chấp, admin can thiệp
      'refunded',             // Đã hoàn tiền cho user
      'failed'                // Đơn hàng thất bại (không phải do thanh toán)
    ],
    default: 'pending_payment' // Trạng thái mặc định mới
  },
  statusDescription: { type: String },
  distance_km:      { type: Number, required: true },
  // Thêm trường cho thanh toán online
  paymentStatus:    { 
    type: String, 
    enum: ['unpaid', 'paid', 'refunded', 'pending_refund', 'disputed_payment'], 
    default: 'unpaid' 
  },
  paymentMethod:    { type: String, enum: ['cod', 'vnpay'], default: 'vnpay' },
  vnpayTransactionId: { type: String }, // Lưu mã giao dịch VNPAY
  // Trường hợp hàng hóa (chỉ cho loại delivery)
  itemType:         { type: String },
  weight_kg:        { type: Number },
  dimensions:       { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);