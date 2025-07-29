const {default: mongoose} = require("mongoose");
const userSchema = new mongoose.Schema({
    fullName: {type: String, required: true},
    email: {type: String, required: true},
    phone:{type: String, required: true},
    password:{type: String, required: true},
    isAdmin:{type: Boolean, default: false},
    role: {type: String, enum: ['user', 'admin'], default: 'user'},
    address:{type: String, required: true},
    avatar:{type: String, required: true},
    status:{type: Boolean, default: true},
    emailVerified: { type: Boolean, default: false },
    emailVerificationCode: { type: String },
    balance: { type: Number, default: 0 }, // Thêm trường số dư ví cho user
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);