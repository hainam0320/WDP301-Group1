const mongoose = require("mongoose");
const { Schema } = mongoose;

const adminToDriverPayoutSchema = new Schema({
    driverId: {
        type: Schema.Types.ObjectId,
        ref: 'Driver',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'], // pending (nếu có yêu cầu từ tài xế), completed (đã chi trả), cancelled (bị admin hủy)
        default: 'completed' // Mặc định là 'completed' nếu admin trực tiếp ghi nhận chi trả thành công
    },
    payoutDate: {
        type: Date,
        default: Date.now // Thời gian chi trả được ghi nhận/thực hiện
    },
    adminId: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Admin được quản lý trong User model (isAdmin: true)
        required: true // Bắt buộc phải do một admin ghi nhận
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true // Thêm createdAt và updatedAt
});

module.exports = mongoose.model('AdminToDriverPayout', adminToDriverPayoutSchema);