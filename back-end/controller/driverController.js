const Driver = require('../models/driverModel');

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
