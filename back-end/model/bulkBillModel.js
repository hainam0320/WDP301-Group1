const mongoose = require("mongoose");

const bulkBillSchema = new mongoose.Schema({
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        required: true
    },
    transactions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CompanyTransaction'
    }],
    qr_payment_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QRPayment'
    },
    total_amount: {
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
    timestamps: true
});

// Tạo index cho các trường quan trọng
bulkBillSchema.index({ driverId: 1, status: 1 });

module.exports = mongoose.model('BulkBill', bulkBillSchema); 