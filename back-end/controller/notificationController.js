const Notification = require('../model/notificationModel');

// Lấy tất cả thông báo cho người dùng/tài xế hiện tại
exports.getNotifications = async (req, res) => {
    try {
        const recipientId = req.user.id;
        const recipientModel = req.user.role === 'driver' ? 'Driver' : 'User';

        const notifications = await Notification.find({ 
            recipient: recipientId, 
            recipientModel: recipientModel 
        })
        .sort({ createdAt: -1 })
        .limit(50);

        const unreadCount = await Notification.countDocuments({ 
            recipient: recipientId, 
            recipientModel: recipientModel, 
            isRead: false 
        });

        res.json({
            notifications,
            unreadCount
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy thông báo' });
    }
};

// Đánh dấu một thông báo là đã đọc
exports.markAsRead = async (req, res) => {
    try {
        const recipientId = req.user.id;
        const recipientModel = req.user.role === 'driver' ? 'Driver' : 'User';

        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: recipientId, recipientModel: recipientModel },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Không tìm thấy thông báo hoặc bạn không có quyền' });
        }

        res.json(notification);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Đánh dấu tất cả thông báo là đã đọc
exports.markAllAsRead = async (req, res) => {
    try {
        const recipientId = req.user.id;
        const recipientModel = req.user.role === 'driver' ? 'Driver' : 'User';

        await Notification.updateMany(
            { recipient: recipientId, recipientModel: recipientModel, isRead: false },
            { isRead: true }
        );

        res.json({ message: 'Tất cả thông báo đã được đánh dấu là đã đọc' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
}; 