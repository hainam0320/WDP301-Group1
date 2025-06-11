const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Đăng nhập
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user._id, isAdmin: user.isAdmin },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        const { password: _, ...userData } = user._doc;

        res.status(200).json({ message: 'Login successful', token, user: userData });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
