const {default: mongoose} = require("mongoose");
const driverAssigmentSchema = new mongoose.Schema({
    driverId:{type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true},
    orderId:{type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true},
    amount:{type: Number, required: true},
    status:{type: Boolean, default: true},
    date:{type: String, required: true},
});

module.exports = mongoose.model('DriverAssigment', driverAssigmentSchema);
