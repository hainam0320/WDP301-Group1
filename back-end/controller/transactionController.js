const CompanyTransaction = require("../model/companyTransisModel");
const TotalEarning = require("../model/totalEarning"); // Có thể không cần thiết nữa nếu TotalEarning được tạo ở orderController
const QRPayment = require("../model/qrPaymentModel"); // Có thể chỉ dùng cho các thanh toán khác, không phải hoa hồng
const BulkBill = require("../model/bulkBillModel"); // Có thể chỉ dùng cho các thanh toán khác, không phải hoa hồng
const qrcode = require('qrcode'); // Có thể không cần nếu không dùng QR cho hoa hồng
const crypto = require('crypto'); // Có thể không cần nếu không dùng QR cho hoa hồng
const Driver = require('../model/driverModel');
const mongoose = require('mongoose');

// ===== DRIVER EARNINGS AND PAYOUTS (CẬP NHẬT TỪ COMMISSION MANAGEMENT) =====

// Lấy danh sách các khoản hoa hồng (tiền hệ thống đã giữ từ user)
exports.getDriverCommissions = async (req, res) => {
  try {
    const driverId = req.user._id;

    const commissions = await CompanyTransaction.find({
      driverId: driverId,
      type: 'commission', // Chỉ lấy các giao dịch loại hoa hồng
      status: 'commission_collected' // Hoa hồng đã được trích
    })
    .populate('orderId')
    .sort('-processed_at');

    const totalAmount = commissions.reduce((sum, trans) => sum + trans.amount, 0);

    res.json({
      transactions: commissions,
      totalAmount: totalAmount,
      count: commissions.length
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách hoa hồng tài xế:", error);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// Lấy lịch sử giải ngân cho tài xế
exports.getDriverPayoutHistory = async (req, res) => {
  try {
    const driverId = req.user._id;

    const payouts = await CompanyTransaction.find({
      driverId: driverId,
      type: 'payout_to_driver', // Chỉ lấy các giao dịch giải ngân
      status: 'disbursed_to_driver' // Đã giải ngân
    })
    .populate('orderId')
    .sort('-processed_at');

    const totalPayouts = payouts.reduce((sum, trans) => sum + trans.amount, 0);

    res.json({
      payouts: payouts,
      totalPayouts: totalPayouts,
      count: payouts.length
    });
  } catch (error) {
    console.error("Lỗi lấy lịch sử giải ngân:", error);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// Lấy tổng quan về thu nhập của tài xế
exports.getDriverEarningsOverview = async (req, res) => {
  try {
    const driverId = req.user._id;

    // Lấy tổng số dư hiện tại của tài xế
    const driver = await Driver.findById(driverId).select('balance');
    const currentBalance = driver ? driver.balance : 0;

    // Lấy tổng tiền hoa hồng đã trích
    const totalCommissions = await CompanyTransaction.aggregate([
        { $match: { driverId: new mongoose.Types.ObjectId(driverId), type: 'commission', status: 'commission_collected' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalCommissionCollected = totalCommissions[0]?.total || 0;

    // Lấy tổng tiền đã giải ngân cho tài xế
    const totalPayouts = await CompanyTransaction.aggregate([
        { $match: { driverId: new mongoose.Types.ObjectId(driverId), type: 'payout_to_driver', status: 'disbursed_to_driver' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalPayoutDisbursed = totalPayouts[0]?.total || 0;

    res.json({
      overview: {
        currentBalance,
        totalCommissionCollected,
        totalPayoutDisbursed,
      }
    });
  } catch (error) {
    console.error("Lỗi lấy tổng quan thu nhập tài xế:", error);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// ADMIN: Lấy danh sách các giao dịch liên quan đến tiền đang được giữ (hoa hồng, giải ngân)
exports.getAdminTransactions = async (req, res) => {
  try {
    const { startDate, endDate, driverId, userId, status, type } = req.query;
    
    const query = {};
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (status) query.status = status;
    if (type) query.type = type;

    if (driverId) query.driverId = driverId;
    if (userId) query.userId = userId;

    const transactions = await CompanyTransaction.find(query)
      .populate('driverId', 'fullName email phone')
      .populate('userId', 'fullName email phone')
      .populate('orderId')
      .sort('-createdAt');

    // Tính toán thống kê
    const stats = {
      totalAmount: 0,
      heldAmount: 0, // Tiền đang được giữ
      commissionCollectedAmount: 0,
      payoutDisbursedAmount: 0,
      refundedAmount: 0,
      disputedAmount: 0
    };

    transactions.forEach(trans => {
      stats.totalAmount += trans.amount;
      switch (trans.status) {
        case 'held':
          stats.heldAmount += trans.amount;
          break;
        case 'commission_collected':
          stats.commissionCollectedAmount += trans.amount;
          break;
        case 'disbursed_to_driver':
          stats.payoutDisbursedAmount += trans.amount;
          break;
        case 'refunded_to_user':
          stats.refundedAmount += trans.amount;
          break;
        case 'disputed':
          stats.disputedAmount += trans.amount;
          break;
      }
    });

    res.json({
      success: true,
      transactions,
      stats
    });
  } catch (error) {
    console.error('Error getting admin transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách giao dịch'
    });
  }
};

// ADMIN: Lấy chi tiết một giao dịch
exports.getAdminTransactionDetails = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await CompanyTransaction.findById(transactionId)
      .populate('driverId', 'fullName email phone')
      .populate('userId', 'fullName email phone')
      .populate('orderId');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch'
      });
    }

    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error('Error getting transaction details:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết giao dịch'
    });
  }
};

// ADMIN: Xử lý tranh chấp / hoàn tiền (từ trạng thái 'disputed' của CompanyTransaction)
exports.adminResolveTransaction = async (req, res) => {
    try {
        console.log('=== ADMIN RESOLVE TRANSACTION ===');
        const { transactionId } = req.params;
        const { newStatus, remarks } = req.body;
        const adminId = req.user._id;

        console.log('Transaction ID:', transactionId);
        console.log('New Status:', newStatus);
        console.log('Remarks:', remarks);
        console.log('Admin ID:', adminId);

        const transaction = await CompanyTransaction.findById(transactionId);
        if (!transaction) {
            console.log('Transaction not found');
            return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
        }

        console.log('Found transaction:', {
            id: transaction._id,
            status: transaction.status,
            orderId: transaction.orderId,
            driverId: transaction.driverId,
            userId: transaction.userId,
            amount: transaction.amount
        });

        if (transaction.status !== 'disputed') {
            console.log('Transaction not in disputed status');
            return res.status(400).json({ message: 'Giao dịch không ở trạng thái tranh chấp để xử lý.' });
        }

        // Thực hiện logic hoàn tiền/giải ngân lại (nếu có tích hợp với cổng thanh toán)
        // Ví dụ: gọi API hoàn tiền của VNPAY nếu type là 'refund'
        // Đối với ví dụ này, chúng ta chỉ cập nhật trạng thái nội bộ.

        if (newStatus === 'disbursed_to_driver') {
            console.log('Processing disbursement to driver...');
            // Logic giải ngân cho tài xế (90% giá trị đơn hàng)
            const order = await require('../model/orderModel').findById(transaction.orderId);
            if (!order) {
                console.log('Order not found:', transaction.orderId);
                return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
            }
            
            console.log('Found order:', {
                id: order._id,
                price: order.price,
                status: order.status
            });
            
            const disbursementAmount = order.price * 0.9; // 90% giá trị đơn hàng
            console.log('Disbursement amount:', disbursementAmount);
            
            transaction.status = 'disbursed_to_driver';
            transaction.type = 'payout_to_driver';
            transaction.amount = disbursementAmount; // Cập nhật số tiền thực tế giải ngân
            transaction.processed_by = adminId;
            transaction.processed_at = new Date();
            transaction.remarks = remarks || `Đã giải ngân 90% giá trị đơn hàng cho tài xế.`;

            // Tăng số dư cho tài xế
            console.log('Updating driver balance for ID:', transaction.driverId);
            const driver = await Driver.findByIdAndUpdate(
                transaction.driverId,
                { $inc: { balance: disbursementAmount } }, // Giải ngân 90% giá trị đơn hàng
                { new: true }
            );
            if (!driver) {
                console.error('Driver not found for dispute payout:', transaction.driverId);
                throw new Error('Không tìm thấy tài xế để giải ngân.');
            }
            
            console.log('Driver balance updated:', driver.balance);
            
            // Cập nhật trạng thái Order
            await require('../model/orderModel').findByIdAndUpdate(
                transaction.orderId,
                { paymentStatus: 'paid', status: 'driver_paid' }
            );
            console.log('Order status updated');
            
        } else if (newStatus === 'refunded_to_user') {
            console.log('Processing refund to user...');
            // Logic hoàn tiền cho user (100% giá trị đơn hàng)
            const order = await require('../model/orderModel').findById(transaction.orderId);
            if (!order) {
                console.log('Order not found:', transaction.orderId);
                return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
            }
            
            console.log('Found order:', {
                id: order._id,
                price: order.price,
                status: order.status
            });
            
            const refundAmount = order.price; // 100% giá trị đơn hàng
            console.log('Refund amount:', refundAmount);
            
            transaction.status = 'refunded_to_user';
            transaction.type = 'refund';
            transaction.amount = refundAmount; // Cập nhật số tiền thực tế hoàn
            transaction.processed_by = adminId;
            transaction.processed_at = new Date();
            transaction.remarks = remarks || `Đã hoàn tiền 100% giá trị đơn hàng cho khách hàng.`;

            // Tăng số dư cho user
            console.log('Updating user balance for ID:', transaction.userId);
            const user = await require('../model/userModel').findByIdAndUpdate(
                transaction.userId,
                { $inc: { balance: refundAmount } }, // Hoàn tiền 100% giá trị đơn hàng
                { new: true }
            );
            if (!user) {
                console.error('User not found for refund:', transaction.userId);
                throw new Error('Không tìm thấy người dùng để hoàn tiền.');
            }
            
            console.log('User balance updated:', user.balance);

            // Cập nhật trạng thái Order
            await require('../model/orderModel').findByIdAndUpdate(
                transaction.orderId,
                { paymentStatus: 'refunded', status: 'refunded' }
            );
            console.log('Order status updated');
            
        } else {
            console.log('Invalid status:', newStatus);
            return res.status(400).json({ message: 'Trạng thái xử lý không hợp lệ.' });
        }
        
        console.log('Saving transaction...');
        await transaction.save();
        console.log('Transaction saved successfully');
        
        res.json({ message: 'Giải quyết tranh chấp thành công', transaction });

    } catch (error) {
        console.error('Error resolving transaction dispute:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ message: 'Lỗi server khi giải quyết tranh chấp', error: error.message });
    }
};

// Loại bỏ các hàm `createBulkBill`, `getDriverBulkBills`, `adminConfirmBulkPayment`, `updateBulkQRPaymentStatus`, `cancelBulkBill`
// hoặc tái cấu trúc chúng nếu chúng được sử dụng cho mục đích khác (ví dụ: tài xế rút tiền).
// Hiện tại, tôi sẽ xóa chúng để làm rõ luồng thanh toán mới.

/*
// Các hàm quản lý BulkBill và QRPayment cũ (TÀI XẾ TRẢ HOA HỒNG) - Sẽ không còn được sử dụng trong luồng mới hoặc được tái cấu trúc cho mục đích rút tiền
// Tạo hóa đơn tổng cho nhiều giao dịch (driver tạo)
exports.createBulkBill = async (req, res) => { /* LOGIC CŨ */ // }

// Lấy danh sách hóa đơn tổng của tài xế (driver xem)
// exports.getDriverBulkBills = async (req, res) => { /* LOGIC CŨ */ // }

// ADMIN: Xác nhận thanh toán hóa đơn tổng (admin xác nhận driver đã trả hoa hồng)
// exports.adminConfirmBulkPayment = async (req, res) => { /* LOGIC CŨ */ // }

// Cập nhật trạng thái thanh toán QR (driver xác nhận đã quét QR)
// exports.updateBulkQRPaymentStatus = async (req, res) => { /* LOGIC CŨ */ // }

// Hủy hóa đơn tổng khi đóng QR không thanh toán
// exports.cancelBulkBill = async (req, res) => { /* LOGIC CŨ */ // }

// Lấy thông tin ví và lịch sử giao dịch cho User
exports.getUserWallet = async (req, res) => {
  try {
    const userId = req.user._id;

    // Lấy thông tin user hiện tại
    const user = await require('../model/userModel').findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    // Lấy lịch sử giao dịch liên quan đến user này
    const transactions = await CompanyTransaction.find({
      userId: userId,
      status: { $in: ['refunded_to_user', 'disputed'] } // Chỉ lấy các giao dịch hoàn tiền hoặc tranh chấp
    })
    .populate('orderId')
    .populate('processed_by', 'fullName')
    .sort('-processed_at');

    res.json({
      success: true,
      data: {
        balance: user.balance,
        transactions: transactions
      }
    });
  } catch (error) {
    console.error("Lỗi lấy thông tin ví user:", error);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// Lấy thông tin ví và lịch sử giao dịch cho Driver
exports.getDriverWallet = async (req, res) => {
  try {
    const driverId = req.user._id;

    // Lấy thông tin driver hiện tại
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: "Không tìm thấy tài xế." });
    }

    // Lấy lịch sử giao dịch liên quan đến driver này (giải ngân và tranh chấp)
    const transactions = await CompanyTransaction.find({
      driverId: driverId,
      status: { $in: ['disbursed_to_driver', 'disputed'] } // Chỉ lấy các giao dịch giải ngân hoặc tranh chấp
    })
    .populate('orderId')
    .populate('processed_by', 'fullName')
    .sort('-processed_at');

    // Lấy lịch sử doanh thu từ các đơn hàng đã hoàn thành
    const Order = require('../model/orderModel');
    const completedOrders = await Order.find({
      driverId: driverId,
      status: 'user_confirmed_completion' // Chỉ lấy đơn hàng đã được user xác nhận hoàn thành
    })
    .populate('userId', 'fullName phone')
    .sort('-updatedAt');

    // Tạo các giao dịch doanh thu 90% từ đơn hàng đã hoàn thành
    const revenueTransactions = completedOrders.map(order => ({
      _id: `revenue_${order._id}`, // ID giả để phân biệt
      type: 'revenue',
      status: 'completed',
      amount: order.price * 0.9, // 90% doanh thu
      orderId: order,
      userId: order.userId,
      processed_at: order.updatedAt,
      remarks: `Doanh thu 90% từ đơn hàng #${order._id.toString().slice(-6)}`,
      isRevenueTransaction: true // Flag để phân biệt với giao dịch thật
    }));

    // Kết hợp giao dịch thật và giao dịch doanh thu, sắp xếp theo thời gian
    const allTransactions = [...transactions, ...revenueTransactions]
      .sort((a, b) => new Date(b.processed_at || b.createdAt) - new Date(a.processed_at || a.createdAt));

    // Tính tổng doanh thu
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.price, 0);

    res.json({
      success: true,
      data: {
        balance: driver.balance,
        transactions: allTransactions,
        revenueHistory: completedOrders,
        totalRevenue: totalRevenue,
        totalOrders: completedOrders.length
      }
    });
  } catch (error) {
    console.error("Lỗi lấy thông tin ví driver:", error);
    res.status(500).json({ message: "Lỗi server." });
  }
};
