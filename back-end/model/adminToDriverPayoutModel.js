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
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending' // Mặc định là 'pending' khi tài xế gửi yêu cầu
    },
    payoutDate: {
        type: Date,
        default: Date.now
    },
    adminId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false // THAY ĐỔI TỪ TRUE THÀNH FALSE, AdminId không bắt buộc khi yêu cầu đang pending
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AdminToDriverPayout', adminToDriverPayoutSchema);