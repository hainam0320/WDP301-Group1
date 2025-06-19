const jwt = require('jsonwebtoken');
const User = require('../model/userModel');
const Driver = require('../model/driverModel');

exports.protect = async (req, res, next) => {
    try {
        console.log('=== PROTECT MIDDLEWARE ===');
        console.log('Headers:', req.headers);
        let token;

        // Check if token exists in headers
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
            console.log('Token found:', token);
        }

        if (!token) {
            console.log('No token found in request');
            return res.status(401).json({
                success: false,
                error: 'Not authorized to access this route'
            });
        }

        try {
            // Verify token
            console.log('Verifying token...');
            const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
            console.log('Token decoded:', decoded);
            
            // Kiểm tra trong cả hai bảng User và Driver
            let user = await User.findById(decoded.id);
            let isDriver = false;

            if (!user) {
                // Nếu không tìm thấy trong User, kiểm tra trong Driver
                user = await Driver.findById(decoded.id);
                if (user) {
                    isDriver = true;
                } else {
                    return res.status(401).json({
                        success: false,
                        error: 'User not found'
                    });
                }
            }

            console.log('User found:', {
                id: user._id,
                email: user.email,
                isDriver: isDriver
            });
            
            req.user = user;
            req.isDriver = isDriver;
            next();
        } catch (err) {
            console.error('Token verification error:', err);
            return res.status(401).json({
                success: false,
                error: 'Not authorized to access this route'
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        console.log('=== AUTHORIZE MIDDLEWARE ===');
        console.log('Required roles:', roles);
        console.log('Is Driver:', req.isDriver);
        
        // Nếu là Driver, cho phép truy cập các route của shipper
        if (req.isDriver) {
            if (roles.includes('driver') || roles.includes('shipper')) {
                console.log('Access granted: Valid driver');
                return next();
            }
        } else {
            // Nếu là User, kiểm tra role
            if (req.user.isAdmin || roles.includes(req.user.role)) {
                console.log('Access granted: Valid user role');
                return next();
            }
        }

        console.log('Access denied: Invalid role');
        return res.status(403).json({
            success: false,
            error: 'Not authorized to access this route'
        });
    };
}; 