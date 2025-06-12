const {default: mongoose} = require("mongoose");
const orderSchema = new mongoose.Schema({
    userId:{type:Schema.Types.ObjectId, ref: 'User', required: true},
    driverId:{type:Schema.Types.ObjectId, ref: 'Driver', required: true},
    nameOrder:{type: String, required: true},
    type:{type: String,enum : ['order', 'delivery'], default: 'order', required: true},
    phone:{type: String, required: true},
    pickupaddress:{type: String, required: true},
    dropupaddress:{type: String, required: true},
    timeStart:{type: String, required: true},
    timeEnd:{type: String, required: true},
    price:{type: Number, required: true},
    status:{type: String, required: true},
    distance_km:{type: Number, required: true},
})

module.exports = mongoose.model('Order', orderSchema);