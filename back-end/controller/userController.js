const User = require('../model/userModel'); // Đảm bảo đường dẫn đúng với project của bạn
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// Lấy danh sách tất cả người dùng
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password'); // Ẩn mật khẩu khi trả về
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// Tạo người dùng mới
exports.createUser = async (req, res) => {
    try {
        const { fullName, email, phone, password, address, avatar } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            fullName,
            email,
            phone,
            password: hashedPassword,
            address,
            avatar,
        });

        await newUser.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// Lấy thông tin người dùng theo ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// Cập nhật người dùng
exports.updateUser = async (req, res) => {
    try {
        const { fullName, phone, address, avatar, status, isAdmin } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { fullName, phone, address, avatar, status, isAdmin },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User updated successfully', user: updatedUser });
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// Xóa người dùng
exports.deleteUser = async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// Gửi mã xác thực email
exports.sendEmailVerification = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.emailVerified) return res.status(400).json({ message: 'Email đã được xác thực' });

        // Tạo mã xác thực
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        user.emailVerificationCode = code;
        await user.save();

        // Gửi email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Mã xác thực email',
            text: `Mã xác thực email của bạn là: ${code}`
        });
        res.json({ message: 'Đã gửi mã xác thực về email' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi gửi mã xác thực', error: err.message });
    }
};

// Xác nhận mã xác thực email
exports.verifyEmailCode = async (req, res) => {
    try {
        const userId = req.user._id;
        const { code } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.emailVerified) return res.status(400).json({ message: 'Email đã được xác thực' });
        if (user.emailVerificationCode !== code) {
            return res.status(400).json({ message: 'Mã xác thực không đúng' });
        }
        user.emailVerified = true;
        user.emailVerificationCode = undefined;
        await user.save();
        res.json({ message: 'Xác thực email thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi xác thực email', error: err.message });
    }
};

// Gửi mã quên mật khẩu
exports.sendForgotPasswordCode = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'Email không tồn tại' });

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        user.emailVerificationCode = code;
        await user.save();

        // Gửi email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Mã đặt lại mật khẩu',
            text: `Mã đặt lại mật khẩu của bạn là: ${code}`
        });
        res.json({ message: 'Đã gửi mã đặt lại mật khẩu về email' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi gửi mã', error: err.message });
    }
};

// Đặt lại mật khẩu
exports.resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'Email không tồn tại' });
        if (user.emailVerificationCode !== code) {
            return res.status(400).json({ message: 'Mã xác thực không đúng' });
        }
        user.password = await bcrypt.hash(newPassword, 10);
        user.emailVerificationCode = undefined;
        await user.save();
        res.json({ message: 'Đặt lại mật khẩu thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi đặt lại mật khẩu', error: err.message });
    }
};

// Đổi mật khẩu
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user._id;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
        }
        // Validate new password
        const pwRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
        if (!pwRegex.test(newPassword)) {
            return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự, chứa chữ hoa và số' });
        }
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.json({ success: true, message: 'Đổi mật khẩu thành công' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi đổi mật khẩu', error: err.message });
    }
};
