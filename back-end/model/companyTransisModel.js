const mongoose = require("mongoose");

const companyTransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid', 'confirmed'], default: 'pending' },
    payos_payment_id: { type: String },
    orderCode: { type: String }, // Đã thay đổi từ Number thành String
    payment_method: { type: String, enum: ['payos'], default: 'payos' },
    paid_at: Date,
    confirmed_at: Date,
    confirmed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    remarks: String
}, { timestamps: true });

module.exports = mongoose.model('CompanyTransaction', companyTransactionSchema);