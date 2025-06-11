const {default: mongoose} = require("mongoose");
const totalEarningSchema = new mongoose.Schema({
    driverAssigmentId:{type: mongoose.Schema.Types.ObjectId, ref: 'DriverAssigment', required: true},
    amount:{type: Number, required: true},
    date:{type: String, required: true},
})