const User = require('../model/userModel');
const Driver = require('../model/driverModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// --- Đăng ký User ---
exports.registerUser = async (req, res) => {
    try {
        const { fullName, email, phone, password, address } = req.body;
        const avatar = req.file?.path || '';

        // Kiểm tra email đã tồn tại chưa (cả trong User và Driver)
        if (await User.findOne({ email })) {
            return res.status(400).json({ message: 'Email đã được sử dụng (User)' });
        }
        if (await Driver.findOne({ email })) {
            return res.status(400).json({ message: 'Email đã được sử dụng (Driver)' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            fullName,
            email,
            phone,
            password: hashedPassword,
            address,
            avatar
        });

        const saved = await user.save();
        const { password: _, ...userData } = saved._doc;

        res.status(201).json({ message: 'Đăng ký user thành công', user: userData });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server (registerUser)', error: err.message });
    }
};

// --- Đăng ký Driver ---
exports.registerDriver = async (req, res) => {
    try {
        const { fullName, email, phone, password, address } = req.body;

        // Kiểm tra các file ảnh bắt buộc
        if (!req.files?.avatar?.[0] || 
            !req.files?.licensePlateImage?.[0] || 
            !req.files?.cmndFront?.[0] || 
            !req.files?.cmndBack?.[0]) {
            return res.status(400).json({ 
                message: 'Vui lòng upload đầy đủ: ảnh đại diện, ảnh biển số xe, ảnh CMND/CCCD mặt trước và sau' 
            });
        }

        // Lấy đường dẫn các file ảnh
        const avatar = req.files.avatar[0].path;
        const licensePlateImage = req.files.licensePlateImage[0].path;
        const cmndFront = req.files.cmndFront[0].path;
        const cmndBack = req.files.cmndBack[0].path;

        // Kiểm tra email đã tồn tại chưa (cả trong User và Driver)
        if (await User.findOne({ email })) {
            return res.status(400).json({ message: 'Email đã được sử dụng (User)' });
        }
        if (await Driver.findOne({ email })) {
            return res.status(400).json({ message: 'Email đã được sử dụng (Driver)' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const driver = new Driver({
            fullName,
            email,
            phone,
            password: hashedPassword,
            address,
            avatar,
            licensePlateImage,
            cmndFront,
            cmndBack
        });

        const saved = await driver.save();
        const { password: _, ...driverData } = saved._doc;

        res.status(201).json({ 
            message: 'Đăng ký tài xế thành công. Vui lòng đợi admin phê duyệt tài khoản của bạn.', 
            driver: driverData 
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server (registerDriver)', error: err.message });
    }
};

// --- Login chung cho cả User & Driver ---
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        let account = await User.findOne({ email });
        let role = null;

        if (account) {
            // Check nếu là admin
            role = account.isAdmin ? 'admin' : 'user';
            console.log('Found user account:', { email, role });
        } else {
            // Nếu không tìm thấy trong User thì tìm trong Driver
            account = await Driver.findOne({ email });
            if (account) {
                role = 'driver';
                console.log('Found driver account:', { email, role });
            }
        }

        if (!account) {
            console.log('Account not found:', { email });
            return res.status(400).json({ message: 'Email không tồn tại' });
        }

        // Kiểm tra trạng thái tài khoản
        if (!account.status && !account.isAdmin) {
            if (account.role === 'driver') {
                return res.status(403).json({ 
                    message: 'Tài khoản của bạn chưa được phê duyệt hoặc đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.' 
                });
            } else {
                return res.status(403).json({ 
                    message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.' 
                });
            }
        }

        // So sánh mật khẩu
        console.log('Comparing passwords...');
        const isMatch = await bcrypt.compare(password, account.password);
        console.log('Password match:', isMatch);

        if (!isMatch) {
            return res.status(400).json({ message: 'Sai mật khẩu' });
        }

        const token = jwt.sign(
            { id: account._id, role }, 
            process.env.JWT_SECRET_KEY , 
            { expiresIn: '1d' }
        );

        const { password: _, ...accountData } = account._doc;

        console.log('Login successful:', { email, role });

        res.status(200).json({
            message: 'Đăng nhập thành công',
            token,
            user: {
                ...accountData,
                role
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Lỗi server (login)', error: err.message });
    }
};