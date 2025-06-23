const {default: mongoose} = require("mongoose");
const userSchema = new mongoose.Schema({
    fullName: {type: String, required: true},
    email: {type: String, required: true},
    phone:{type: String, required: true},
    password:{type: String, required: true},
    role: {type: String, enum: ['user', 'admin'], default: 'user'},
    address:{type: String, required: true},
    avatar:{type: String, required: true},
    status:{type: Boolean, default: true},
});

module.exports = mongoose.model('User', userSchema);