const Report = require('../model/reportModel');
const Order = require('../model/orderModel');

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

        if (order.status !== 'completed') {
            return res.status(400).json({ message: 'Chỉ có thể báo cáo đơn hàng đã hoàn thành' });
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

        res.json({
            message: 'Cập nhật trạng thái báo cáo thành công',
            report: updatedReport
        });
    } catch (error) {
        console.error('Error updating report status:', error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái báo cáo' });
    }
}; 