const User = require('../model/userModel');
const Driver = require('../model/driverModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// --- Đăng ký User ---
exports.registerUser = async (req, res) => {
    try {
        const { fullName, email, phone, password, address } = req.body;
        const avatar = req.file?.path || '';

        if (await User.findOne({ email })) {
            return res.status(400).json({ message: 'Email đã được sử dụng (User)' });
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
        const { fullName, Bsx, email, phone, password, address } = req.body;

        const avatar = req.files?.avatar?.[0]?.path || '';
        const cmnd = req.files?.cmnd?.[0]?.path || '';

        if (!avatar || !cmnd) {
            return res.status(400).json({ message: 'Cần upload cả avatar và CMND' });
        }

        if (await Driver.findOne({ email })) {
            return res.status(400).json({ message: 'Email đã được sử dụng (Driver)' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const driver = new Driver({
            fullName,
            Bsx,
            email,
            phone,
            password: hashedPassword,
            address,
            avatar,
            cmnd
        });

        const saved = await driver.save();
        const { password: _, ...driverData } = saved._doc;

        res.status(201).json({ message: 'Đăng ký driver thành công', driver: driverData });
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
    } else {
      // Nếu không tìm thấy trong User thì tìm trong Driver
      account = await Driver.findOne({ email });
      if (account) {
        role = 'driver';
      }
    }

    if (!account) {
      return res.status(400).json({ message: 'Email không tồn tại' });
    }

    if (password !== account.password) {
  return res.status(400).json({ message: 'Sai mật khẩu ' });
}

    const token = jwt.sign({ id: account._id, role }, process.env.JWT_SECRET_KEY, {
      expiresIn: '1d',
    });

    const { password: _, ...accountData } = account._doc;

    res.status(200).json({
      message: 'Đăng nhập thành công',
      token,
      role,
      user: accountData,
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server (login)', error: err.message });
  }
};