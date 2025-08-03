const User = require('../model/userModel');
const Driver = require('../model/driverModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');

// Helper function để kiểm tra email đã tồn tại trong cả User và Driver
const checkEmailExists = async (email) => {
    const existingUser = await User.findOne({ email });
    const existingDriver = await Driver.findOne({ email });
    
    if (existingUser) {
        return { exists: true, type: 'user', message: 'Email đã được sử dụng bởi tài khoản người dùng' };
    }
    if (existingDriver) {
        return { exists: true, type: 'driver', message: 'Email đã được sử dụng bởi tài khoản tài xế' };
    }
    
    return { exists: false };
};

// --- Đăng ký User ---
exports.registerUser = async (req, res) => {
    try {
        const { fullName, email, phone, password, address } = req.body;
        const avatar = req.file?.path || '';

        // Kiểm tra email đã tồn tại chưa (cả trong User và Driver)
        const emailCheck = await checkEmailExists(email);
        if (emailCheck.exists) {
            return res.status(400).json({ message: emailCheck.message });
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
        const emailCheck = await checkEmailExists(email);
        if (emailCheck.exists) {
            return res.status(400).json({ message: emailCheck.message });
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
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
exports.loginWithGoogle = async (req, res) => {
    try {
        const { idToken } = req.body;

        // Kiểm tra idToken có tồn tại và hợp lệ không
        if (!idToken || idToken === '' || idToken === null) {
            return res.status(400).json({ message: 'Token không hợp lệ' });
        }

        // Kiểm tra GOOGLE_CLIENT_ID có được cấu hình không
        if (!process.env.GOOGLE_CLIENT_ID) {
            console.error('GOOGLE_CLIENT_ID chưa được cấu hình');
            return res.status(500).json({ message: 'Cấu hình Google OAuth chưa hoàn tất' });
        }

        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        const { email, name, picture } = payload;

        // Kiểm tra email có tồn tại không
        if (!email) {
            return res.status(400).json({ message: 'Email không hợp lệ từ Google' });
        }

        // Kiểm tra email đã tồn tại trong cả User và Driver
        const emailCheck = await checkEmailExists(email);
        let user;
        
        if (emailCheck.exists) {
            // Nếu email đã tồn tại trong Driver, không cho phép đăng nhập Google
            if (emailCheck.type === 'driver') {
                return res.status(400).json({ 
                    message: 'Email này đã được sử dụng bởi tài khoản tài xế. Vui lòng đăng nhập bằng tài khoản tài xế.' 
                });
            }
            
            // Nếu email tồn tại trong User, sử dụng tài khoản đó
            user = await User.findOne({ email });
            
            // Cập nhật thông tin nếu user đã tồn tại
            if (user.loginMethod !== 'google') {
                user.loginMethod = 'google';
                user.emailVerified = true;
                if (picture) user.avatar = picture;
                await user.save();
            }
            console.log('Existing Google user logged in:', email);
        } else {
            // Nếu chưa có thì tạo user mới
            user = new User({
                fullName: name || 'Google User',
                email,
                password: 'google_oauth_user', // placeholder cho Google OAuth users
                avatar: picture || '',
                phone: 'Chưa cập nhật',
                address: 'Chưa cập nhật',
                loginMethod: 'google',
                emailVerified: true, // Google users đã được xác thực email
            });

            await user.save();
            console.log('Created new Google user:', email);
        }

        // Check nếu user bị khóa
        if (user.status === false) {
            return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa.' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.isAdmin ? 'admin' : 'user' },
            process.env.JWT_SECRET_KEY,
            { expiresIn: '1d' }
        );

        const { password: _, ...userData } = user._doc;

        res.status(200).json({
            message: 'Đăng nhập Google thành công',
            token,
            user: {
                ...userData,
                role: user.isAdmin ? 'admin' : 'user'
            }
        });
    } catch (err) {
        console.error('Google login error:', err);
        
        // Xử lý các lỗi cụ thể từ Google OAuth
        if (err.message.includes('Invalid token') || 
            err.message.includes('The verifyIdToken method requires an ID Token') ||
            err.message.includes('Invalid ID token') ||
            err.message.includes('Wrong number of segments in token')) {
            return res.status(400).json({ message: 'Token Google không hợp lệ' });
        }
        
        if (err.message.includes('Token used too late') || 
            err.message.includes('Token expired')) {
            return res.status(400).json({ message: 'Token Google đã hết hạn' });
        }

        // Xử lý lỗi khi không có GOOGLE_CLIENT_ID
        if (err.message.includes('GOOGLE_CLIENT_ID')) {
            return res.status(500).json({ message: 'Cấu hình Google OAuth chưa hoàn tất' });
        }

        res.status(500).json({ message: 'Lỗi server (loginWithGoogle)', error: err.message });
    }
};