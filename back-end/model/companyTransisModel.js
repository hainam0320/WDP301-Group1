const { default: mongoose } = require("mongoose");

const companyTransactionSchema = new mongoose.Schema({
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        // Có thể không bắt buộc nếu đây là giao dịch tổng của công ty
        // Nhưng nếu là hoa hồng của tài xế thì vẫn cần
    },
    userId: { // Thêm userId để biết giao dịch này liên quan đến đơn hàng của user nào
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    orderId: { // Thêm orderId để biết giao dịch này thuộc về đơn hàng nào
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
    },
    // total_earning_id có thể không còn cần thiết nếu thay đổi luồng tính toán thu nhập
    // total_earning_id: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'TotalEarning',
    //     required: true // Tùy chỉnh nếu không còn bắt buộc
    // },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    // Trạng thái giao dịch:
    // held: Tiền user thanh toán đang được hệ thống giữ
    // commission_collected: Hoa hồng đã được trích
    // disbursed_to_driver: Tiền đã giải ngân cho tài xế
    // refunded_to_user: Tiền đã hoàn trả cho user
    // disputed: Giao dịch đang bị tranh chấp
    status: {
        type: String,
        required: true,
        enum: ['held', 'commission_collected', 'disbursed_to_driver', 'refunded_to_user', 'disputed', 'completed'],
        default: 'held' // Mặc định là tiền đang được giữ
    },
    type: { // Loại giao dịch: hoa hồng, giải ngân cho tài xế, hoàn tiền, rút tiền
        type: String,
        required: true,
        enum: ['user_payment_held', 'commission', 'payout_to_driver', 'refund', 'withdrawal'],
    },
    // Các trường liên quan đến thanh toán/giải ngân có thể cần được chỉnh sửa
    payment_method: { // Phương thức thanh toán gốc của user (VNPAY) hoặc phương thức giải ngân
        type: String,
        enum: ['vnpay', 'bank_transfer', 'momo'], // Thêm các phương thức phù hợp
    },
    transactionRefId: { // ID giao dịch bên thứ 3 (VNPAY ID, Bank transaction ID)
        type: String,
    },
    processed_at: { // Thời điểm tiền được xử lý (trích, giải ngân, hoàn)
        type: Date
    },
    processed_by: { // User/Admin/System xử lý giao dịch
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    remarks: {
        type: String
    }
}, {
    timestamps: true // adds createdAt and updatedAt fields
});

// Tạo index cho các trường quan trọng
companyTransactionSchema.index({ driverId: 1, status: 1 });
companyTransactionSchema.index({ orderId: 1 });
companyTransactionSchema.index({ userId: 1 });

module.exports = mongoose.model('CompanyTransaction', companyTransactionSchema);