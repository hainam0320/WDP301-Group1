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
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    paid_at: {
        type: Date
    }
}, {
    timestamps: true // adds createdAt and updatedAt fields
});

module.exports = mongoose.model('CompanyTransaction', companyTransactionSchema);