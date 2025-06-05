const {default: mongoose} = require("mongoose");
const driverSchema = new mongoose.Schema({
    fullName: {type: String, required: true},
    Bsx: {type: String, required: true},
    email:{type: String, required: true},
    phone:{type: String, required: true},
    password:{type: String, required: true},
    cmnd:{type: String, required: true},
    address:{type: String, required: true},
    avatar:{type: String, required: true},
    status:{type: Boolean, default: true},
});

module.exports = mongoose.model('Driver', driverSchema);