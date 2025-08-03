const Report = require('../model/reportModel');
const Order = require('../model/orderModel');
const Notification = require('../model/notificationModel');
const fs = require('fs').promises;
const path = require('path');
const CompanyTransaction = require('../model/companyTransisModel'); // Added import for CompanyTransaction

// Helper function to delete image files
const deleteImageFiles = async (imagePaths) => {
    if (!imagePaths) return;
    
    const images = imagePaths.split(',').filter(img => img.trim());
    for (const imagePath of images) {
        try {
            await fs.unlink(path.join(__dirname, '..', imagePath));
        } catch (error) {
            console.error(`Error deleting image ${imagePath}:`, error);
        }
    }
};

// Create a new report
exports.createReport = async (req, res) => {
    try {
        console.log('=== CREATE REPORT ===');
        console.log('Request body:', req.body);
        console.log('User:', req.user);

        const { order_id, type, description, image } = req.body;
        const reporterID = req.user._id;

        // Validate required fields
        if (!order_id || !type || !description) {
            console.log('Validation failed:', { order_id, type, description });
            return res.status(400).json({ 
                message: 'Vui lòng điền đầy đủ thông tin báo cáo',
                details: {
                    order_id: !order_id ? 'Thiếu mã đơn hàng' : null,
                    type: !type ? 'Thiếu loại báo cáo' : null,
                    description: !description ? 'Thiếu nội dung báo cáo' : null
                }
            });
        }

        // Validate report type
        const validTypes = ['spam', 'inappropriate', 'fraud', 'other', 'late', 'damage', 'lost'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ 
                message: 'Loại báo cáo không hợp lệ',
                validTypes 
            });
        }

        // Check if the order exists and is completed
        const order = await Order.findById(order_id);
        if (!order) {
            return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
        }

        

        // Check if the reporter is the customer who created the order
        if (order.userId.toString() !== reporterID.toString()) {
            return res.status(403).json({ message: 'Bạn không có quyền báo cáo đơn hàng này' });
        }

        // Check if a report already exists for this order
        const existingReport = await Report.findOne({ 
            order_id,
            reporterID: reporterID
        });

        if (existingReport) {
            return res.status(400).json({ 
                message: 'Bạn đã báo cáo đơn hàng này trước đó',
                existingReport 
            });
        }

        // Create the report
        const newReport = new Report({
            reporterID,
            reported_user_id: order.driverId,
            order_id,
            type,
            description,
            image: image || '',
            status: 'pending'
        });

        const savedReport = await newReport.save();

        // Populate necessary fields for response
        const populatedReport = await Report.findById(savedReport._id)
            .populate('reporterID', 'fullName email')
            .populate('reported_user_id', 'fullName email')
            .populate('order_id');

        res.status(201).json({
            message: 'Báo cáo đã được gửi thành công',
            report: populatedReport
        });

        // === Cập nhật trạng thái đơn hàng sang 'disputed' ===
        order.status = 'disputed';
        await order.save();

        // === Cập nhật CompanyTransaction liên quan sang 'disputed' ===
        console.log('Updating CompanyTransaction to disputed due to user report for order:', order._id);
        
        const updateResult = await CompanyTransaction.updateMany(
          { orderId: order._id },
          { $set: { status: 'disputed' } }
        );
        
        console.log('Updated CompanyTransaction count due to user report:', updateResult.modifiedCount);

    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({ 
            message: 'Lỗi server khi tạo báo cáo', 
            error: error.message 
        });
    }
};

// Get all reports (for admin)
exports.getAllReports = async (req, res) => {
    try {
        const reports = await Report.find()
            .populate('reporterID', 'fullName email')
            .populate('reported_user_id', 'fullName email')
            .populate('order_id')
            .sort('-createdAt');

        res.json({
            count: reports.length,
            reports
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách báo cáo' });
    }
};

// Get reports by user
exports.getUserReports = async (req, res) => {
    try {
        const reports = await Report.find({ reporterID: req.user._id })
            .populate('reported_user_id', 'fullName email')
            .populate('order_id')
            .sort('-createdAt');

        res.json({
            count: reports.length,
            reports
        });
    } catch (error) {
        console.error('Error fetching user reports:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách báo cáo của người dùng' });
    }
};

// Update report status (for admin)
exports.updateReportStatus = async (req, res) => {
    try {
        const { status, admin_note } = req.body;
        const { io, connectedUsers } = req;

        if (!status) {
            return res.status(400).json({ message: 'Vui lòng cung cấp trạng thái báo cáo' });
        }

        const validStatuses = ['pending', 'reviewed', 'resolved', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                message: 'Trạng thái báo cáo không hợp lệ',
                validStatuses 
            });
        }

        const updatedReport = await Report.findByIdAndUpdate(
            req.params.id,
            { 
                status, 
                admin_note: admin_note || '',
                updatedAt: Date.now()
            },
            { 
                new: true,
                runValidators: true 
            }
        ).populate('reporterID', 'fullName email')
         .populate('reported_user_id', 'fullName email')
         .populate('order_id');

        if (!updatedReport) {
            return res.status(404).json({ message: 'Không tìm thấy báo cáo' });
        }

        // Tạo và lưu thông báo
        const notification = new Notification({
            recipient: updatedReport.reporterID._id,
            recipientModel: 'User',
            title: 'Báo cáo của bạn đã được cập nhật',
            message: `Trạng thái mới: ${status}. ${admin_note ? `Phản hồi: ${admin_note}` : ''}`,
            type: 'REPORT_UPDATED',
            link: `/my-reports` // Hoặc có thể là một link chi tiết hơn
        });
        await notification.save();

        // Gửi thông báo cho người dùng đã tạo báo cáo
        const reporterId = updatedReport.reporterID._id.toString();
        const userSocketId = (connectedUsers && connectedUsers.user) ? connectedUsers.user[reporterId] : null;

        if (userSocketId) {
            io.to(userSocketId).emit('notification', {
                title: 'Báo cáo của bạn đã được cập nhật',
                message: `Trạng thái mới: ${status}. ${admin_note ? `Phản hồi: ${admin_note}` : ''}`,
                reportId: updatedReport._id,
                type: 'REPORT_UPDATED'
            });
        }

        res.json({
            message: 'Cập nhật trạng thái báo cáo thành công',
            report: updatedReport
        });
    } catch (error) {
        console.error('Error updating report status:', error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái báo cáo' });
    }
};

// Update report (for user to add additional information)
exports.updateReport = async (req, res) => {
    try {
        const reportId = req.params.id;
        const { type, description, image, removedImages } = req.body;
        const userId = req.user._id;

        console.log('Update report request:', { reportId, type, description, image, removedImages });

        // Find the existing report
        const existingReport = await Report.findById(reportId);
        if (!existingReport) {
            return res.status(404).json({ message: 'Không tìm thấy báo cáo' });
        }

        // Check if the user owns this report
        if (existingReport.reporterID.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Bạn không có quyền cập nhật báo cáo này' });
        }

        // Check if report can still be updated
        if (existingReport.status === 'resolved' || existingReport.status === 'rejected') {
            return res.status(400).json({ 
                message: 'Không thể cập nhật báo cáo đã được giải quyết hoặc từ chối' 
            });
        }

        // Handle removed images if any
        if (removedImages && Array.isArray(removedImages) && removedImages.length > 0) {
            await deleteImageFiles(removedImages.join(','));
        }

        // Prepare update data
        const updateData = {
            type: type || existingReport.type,
            description: description || existingReport.description,
            status: 'pending', // Reset status to pending when user adds new information
            updatedAt: Date.now()
        };

        // Handle image update
        if (image !== undefined) {
            updateData.image = Array.isArray(image) ? image.join(',') : image;
        }

        console.log('Update data:', updateData);

        // Update the report
        const updatedReport = await Report.findByIdAndUpdate(
            reportId,
            updateData,
            { 
                new: true,
                runValidators: true 
            }
        ).populate('reporterID', 'fullName email')
         .populate('reported_user_id', 'fullName email')
         .populate('order_id');

        if (!updatedReport) {
            return res.status(404).json({ message: 'Không tìm thấy báo cáo để cập nhật' });
        }

        console.log('Updated report:', updatedReport);

        res.json({
            message: 'Cập nhật báo cáo thành công',
            report: updatedReport
        });

    } catch (error) {
        console.error('Error updating report:', error);
        res.status(500).json({ 
            message: 'Lỗi server khi cập nhật báo cáo',
            error: error.message 
        });
    }
}; 