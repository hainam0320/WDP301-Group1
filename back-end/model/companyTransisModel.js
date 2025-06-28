const { default: mongoose } = require("mongoose");

const companyTransactionSchema = new mongoose.Schema({
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        required: true
    },
    total_earning_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TotalEarning',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'paid', 'confirmed', 'rejected'],
        default: 'pending'
    },
    payment_method: {
        type: String,
        enum: ['qr'],
        default: 'qr'
    },
    qr_payment_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QRPayment'
    },
    paid_at: {
        type: Date
    },
    confirmed_at: {
        type: Date
    },
    confirmed_by: {
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
companyTransactionSchema.index({ qr_payment_id: 1 }, { sparse: true });

module.exports = mongoose.model('CompanyTransaction', companyTransactionSchema);