const User = require('../models/userModel'); // Đảm bảo đường dẫn đúng với project của bạn
const bcrypt = require('bcryptjs');

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
