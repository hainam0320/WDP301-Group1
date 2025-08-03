const Driver = require('../model/driverModel');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// Lấy tất cả tài xế
exports.getAllDrivers = async (req, res) => {
    try {
        const drivers = await Driver.find().select('-password');
        res.status(200).json(drivers);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
    }
};

// Tạo tài xế mới
exports.createDriver = async (req, res) => {
    try {
        const { fullName, Bsx, email, phone, password, cmnd, address, avatar } = req.body;

        const existingDriver = await Driver.findOne({ email });
        if (existingDriver) {
            return res.status(400).json({ message: 'Email đã tồn tại' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newDriver = new Driver({
            fullName,
            Bsx,
            email,
            phone,
            password: hashedPassword,
            cmnd,
            address,
            avatar
        });

        await newDriver.save();
        res.status(201).json({ message: 'Tạo tài xế thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
    }
};

// Lấy thông tin tài xế theo ID
exports.getDriverById = async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.id).select('-password');
        if (!driver) return res.status(404).json({ message: 'Không tìm thấy tài xế' });

        res.status(200).json(driver);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
    }
};

// Cập nhật tài xế
exports.updateDriver = async (req, res) => {
    try {
        const { fullName, Bsx, phone, cmnd, address, avatar, status } = req.body;

        const updatedDriver = await Driver.findByIdAndUpdate(
            req.params.id,
            { fullName, Bsx, phone, cmnd, address, avatar, status },
            { new: true }
        ).select('-password');

        if (!updatedDriver) {
            return res.status(404).json({ message: 'Không tìm thấy tài xế' });
        }

        res.status(200).json({ message: 'Cập nhật thành công', driver: updatedDriver });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
    }
};

// Xóa tài xế
exports.deleteDriver = async (req, res) => {
    try {
        const deleted = await Driver.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Không tìm thấy tài xế' });

        res.status(200).json({ message: 'Xóa tài xế thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
    }
};

// Gửi mã xác thực email cho driver
exports.sendEmailVerification = async (req, res) => {
    try {
        const driverId = req.user._id;
        const driver = await Driver.findById(driverId);
        if (!driver) return res.status(404).json({ message: 'Driver not found' });
        if (driver.emailVerified) return res.status(400).json({ message: 'Email đã được xác thực' });

        // Tạo mã xác thực
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        driver.emailVerificationCode = code;
        await driver.save();

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
            to: driver.email,
            subject: 'Mã xác thực email - Tài xế',
            text: `Mã xác thực email của bạn là: ${code}`
        });
        res.json({ message: 'Đã gửi mã xác thực về email' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi gửi mã xác thực', error: err.message });
    }
};

// Xác nhận mã xác thực email cho driver
exports.verifyEmailCode = async (req, res) => {
    try {
        const driverId = req.user._id;
        const { code } = req.body;
        const driver = await Driver.findById(driverId);
        if (!driver) return res.status(404).json({ message: 'Driver not found' });
        if (driver.emailVerified) return res.status(400).json({ message: 'Email đã được xác thực' });
        if (driver.emailVerificationCode !== code) {
            return res.status(400).json({ message: 'Mã xác thực không đúng' });
        }
        driver.emailVerified = true;
        driver.emailVerificationCode = undefined;
        await driver.save();
        res.json({ message: 'Xác thực email thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi xác thực email', error: err.message });
    }
};

// Gửi mã quên mật khẩu cho driver
exports.sendForgotPasswordCode = async (req, res) => {
    try {
        const { email } = req.body;
        const driver = await Driver.findOne({ email });
        if (!driver) return res.status(404).json({ message: 'Email không tồn tại' });

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        driver.emailVerificationCode = code;
        await driver.save();

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
            to: driver.email,
            subject: 'Mã đặt lại mật khẩu - Tài xế',
            text: `Mã đặt lại mật khẩu của bạn là: ${code}`
        });
        res.json({ message: 'Đã gửi mã đặt lại mật khẩu về email' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi gửi mã', error: err.message });
    }
};

// Đặt lại mật khẩu cho driver
exports.resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;
        const driver = await Driver.findOne({ email });
        if (!driver) return res.status(404).json({ message: 'Email không tồn tại' });
        if (driver.emailVerificationCode !== code) {
            return res.status(400).json({ message: 'Mã xác thực không đúng' });
        }
        driver.password = await bcrypt.hash(newPassword, 10);
        driver.emailVerificationCode = undefined;
        await driver.save();
        res.json({ message: 'Đặt lại mật khẩu thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi đặt lại mật khẩu', error: err.message });
    }
};

// Đổi mật khẩu cho driver
exports.changePassword = async (req, res) => {
    try {
        const driverId = req.user._id;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });
        }
        const driver = await Driver.findById(driverId);
        if (!driver) {
            return res.status(404).json({ success: false, message: 'Driver not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, driver.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
        }

        driver.password = await bcrypt.hash(newPassword, 10);
        await driver.save();

        res.json({ success: true, message: 'Đổi mật khẩu thành công' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi đổi mật khẩu', error: err.message });
    }
};
