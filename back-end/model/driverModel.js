const {default: mongoose} = require("mongoose");
const driverSchema = new mongoose.Schema({
    fullName: {type: String, required: true},
    email:{type: String, required: true},
    phone:{type: String, required: true},
    password:{type: String, required: true},
    address:{type: String, required: true},
    avatar:{type: String, required: true},
    licensePlateImage:{type: String, required: true}, // Ảnh biển số xe
    cmndFront:{type: String, required: true}, // Ảnh CMND mặt trước
    cmndBack:{type: String, required: true}, // Ảnh CMND mặt sau
    status:{type: Boolean, default: true},
});

module.exports = mongoose.model('Driver', driverSchema);