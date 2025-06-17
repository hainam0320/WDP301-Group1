const mongoose = require("mongoose");
const { Schema } = mongoose;

const rateSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    driverId: { type: Schema.Types.ObjectId, ref: 'Driver', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    rate: { type: Number, required: true },
    comment: { type: String},
});

module.exports = mongoose.model('Rate', rateSchema);
