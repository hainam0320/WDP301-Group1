const CompanyTransaction = require("../model/companyTransisModel");
const TotalEarning = require("../model/totalEarning");
const QRPayment = require("../model/qrPaymentModel");
const BulkBill = require("../model/bulkBillModel");
const qrcode = require('qrcode');
const crypto = require('crypto');
const Driver = require('../model/driverModel');
const mongoose = require('mongoose');

// Lấy danh sách các khoản hoa hồng cần thanh toán của tài xế
exports.getDriverPendingCommissions = async (req, res) => {
  try {
    const driverId = req.user._id;

    const pendingTransactions = await CompanyTransaction.find({
      driverId: driverId,
      status: "pending"
    })
    .populate({
      path: 'total_earning_id',
      populate: {
        path: 'driverAssigmentId',
        populate: {
          path: 'orderId'
        }
      }
    })
    .sort('-createdAt');

    // Tính tổng số tiền cần thanh toán
    const totalAmount = pendingTransactions.reduce((sum, trans) => sum + trans.amount, 0);

    res.json({
      transactions: pendingTransactions,
      totalAmount: totalAmount,
      count: pendingTransactions.length
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách hoa hồng:", error);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// Lấy lịch sử thanh toán hoa hồng của tài xế
exports.getDriverCommissionHistory = async (req, res) => {
  try {
    const driverId = req.user._id;

    const transactions = await CompanyTransaction.find({
      driverId: driverId,
      status: { $in: ['paid', 'confirmed', 'rejected'] } // Include all non-pending statuses
    })
    .populate({
      path: 'total_earning_id',
      populate: {
        path: 'driverAssigmentId',
        populate: {
          path: 'orderId'
        }
      }
    })
    .sort('-paid_at');

    // Group transactions by status
    const transactionsByStatus = {
      paid: transactions.filter(t => t.status === 'paid'),
      confirmed: transactions.filter(t => t.status === 'confirmed'),
      rejected: transactions.filter(t => t.status === 'rejected')
    };

    // Calculate totals by status
    const totalsByStatus = {
      paid: transactionsByStatus.paid.reduce((sum, t) => sum + t.amount, 0),
      confirmed: transactionsByStatus.confirmed.reduce((sum, t) => sum + t.amount, 0),
      rejected: transactionsByStatus.rejected.reduce((sum, t) => sum + t.amount, 0)
    };

    res.json({
      transactions: transactions,
      transactionsByStatus: transactionsByStatus,
      totalsByStatus: totalsByStatus,
      count: transactions.length
    });
  } catch (error) {
    console.error("Lỗi lấy lịch sử thanh toán:", error);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// Xác nhận thanh toán hoa hồng (cho admin)
exports.adminConfirmPayment = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { status, remarks } = req.body;
    const adminId = req.user._id;

    // Kiểm tra giao dịch
    const transaction = await CompanyTransaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch'
      });
    }

    // Chỉ cho phép xác nhận các giao dịch đã thanh toán (status = 'paid')
    if (transaction.status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Giao dịch không ở trạng thái chờ xác nhận'
      });
    }

    // Chỉ cho phép chuyển sang trạng thái 'confirmed' hoặc 'rejected'
    if (!['confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    // Cập nhật trạng thái giao dịch
    transaction.status = status;
    transaction.confirmed_at = new Date();
    transaction.confirmed_by = adminId;
    transaction.remarks = remarks;
    await transaction.save();

    res.status(200).json({
      success: true,
      message: status === 'confirmed' ? 'Đã xác nhận thanh toán' : 'Đã từ chối thanh toán',
      data: transaction
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xác nhận thanh toán',
      error: error.message
    });
  }
};

// Lấy tổng quan về hoa hồng của tài xế
exports.getDriverCommissionOverview = async (req, res) => {
  try {
    const driverId = req.user._id;

    // Lấy tất cả giao dịch của tài xế theo từng trạng thái
    const [pendingTransactions, paidTransactions, confirmedTransactions, rejectedTransactions] = await Promise.all([
      CompanyTransaction.find({ driverId, status: "pending" }),
      CompanyTransaction.find({ driverId, status: "paid" }),
      CompanyTransaction.find({ driverId, status: "confirmed" }),
      CompanyTransaction.find({ driverId, status: "rejected" })
    ]);

    // Tính toán tổng tiền cho từng trạng thái
    const totalPending = pendingTransactions.reduce((sum, trans) => sum + trans.amount, 0);
    const totalPaid = paidTransactions.reduce((sum, trans) => sum + trans.amount, 0);
    const totalConfirmed = confirmedTransactions.reduce((sum, trans) => sum + trans.amount, 0);
    const totalRejected = rejectedTransactions.reduce((sum, trans) => sum + trans.amount, 0);

    // Tổng số tiền hoa hồng (bao gồm cả đang chờ và đã thanh toán)
    const totalCommission = totalPending + totalPaid + totalConfirmed + totalRejected;

    // Thống kê theo tháng hiện tại (chỉ tính các giao dịch đã được xác nhận)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonthTransactions = confirmedTransactions.filter(trans => {
      const confirmedDate = new Date(trans.confirmed_at);
      return confirmedDate.getMonth() === currentMonth && confirmedDate.getFullYear() === currentYear;
    });
    const thisMonthConfirmed = thisMonthTransactions.reduce((sum, trans) => sum + trans.amount, 0);

    res.json({
      overview: {
        totalCommission,
        totalPending,
        totalsByStatus: {
          paid: totalPaid,
          confirmed: totalConfirmed,
          rejected: totalRejected
        },
        transactionsByStatus: {
          paid: paidTransactions,
          confirmed: confirmedTransactions,
          rejected: rejectedTransactions
        },
        thisMonthConfirmed,
        pendingCount: pendingTransactions.length,
        paidCount: paidTransactions.length,
        confirmedCount: confirmedTransactions.length,
        rejectedCount: rejectedTransactions.length
      }
    });
  } catch (error) {
    console.error("Lỗi lấy tổng quan hoa hồng:", error);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// Tạo mã QR cho giao dịch
exports.createQRPayment = async (req, res) => {
  try {
    console.log('=== CREATE QR PAYMENT ===');
    const { transactionId } = req.params;
    console.log('Transaction ID:', transactionId);

    // Kiểm tra giao dịch
    const transaction = await CompanyTransaction.findById(transactionId);
    console.log('Found transaction:', transaction);
    
    if (!transaction) {
      console.log('Transaction not found');
      return res.status(404).json({ message: "Không tìm thấy giao dịch." });
    }

    if (transaction.status === "completed") {
      console.log('Transaction already completed');
      return res.status(400).json({ message: "Giao dịch đã được thanh toán." });
    }

    // Kiểm tra xem đã có QR code cho giao dịch này chưa
    const existingQR = await QRPayment.findOne({ 
      transactionId: transaction._id,
      status: 'pending'
    });
    
    if (existingQR) {
      console.log('Found existing QR payment:', existingQR);
      // Nếu QR code cũ đã hết hạn, tạo mới
      if (existingQR.expiryTime < new Date()) {
        console.log('Existing QR expired, creating new one');
        existingQR.status = 'expired';
        await existingQR.save();
      } else {
        console.log('Returning existing QR code');
        return res.json({
          qrCode: existingQR.qrCode,
          paymentCode: existingQR.paymentCode,
          amount: existingQR.amount,
          expiryTime: existingQR.expiryTime
        });
      }
    }

    // Tạo dữ liệu thanh toán
    const paymentData = {
      amount: transaction.amount,
      transactionId: transaction._id.toString(),
      timestamp: Date.now()
    };
    console.log('Payment data:', paymentData);

    try {
      // Mã hóa dữ liệu thanh toán thành base64
      const paymentCode = Buffer.from(JSON.stringify(paymentData)).toString('base64');
      console.log('Payment code:', paymentCode);
      
      // Tạo QR code
      console.log('Generating QR code...');
      const qrCodeData = await qrcode.toDataURL(paymentCode);
      console.log('QR code generated');

      // Lưu thông tin QR payment
      console.log('Creating QR payment record...');
      const qrPayment = new QRPayment({
        transactionId: transaction._id,
        qrCode: qrCodeData,
        paymentCode: paymentCode,
        amount: transaction.amount
      });
      await qrPayment.save();
      console.log('QR payment saved:', qrPayment);

      // Cập nhật transaction
      transaction.qr_payment_id = qrPayment._id;
      transaction.status = 'processing';
      await transaction.save();
      console.log('Transaction updated');

      res.json({
        qrCode: qrCodeData,
        paymentCode: paymentCode,
        amount: transaction.amount,
        expiryTime: qrPayment.expiryTime
      });
    } catch (error) {
      console.error('Error in QR code generation:', error);
      throw new Error('Không thể tạo mã QR: ' + error.message);
    }

  } catch (error) {
    console.error("Lỗi tạo mã QR:", error);
    // Log chi tiết hơn về lỗi
    if (error.name) console.error('Error name:', error.name);
    if (error.message) console.error('Error message:', error.message);
    if (error.stack) console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: "Lỗi server khi tạo mã QR.",
      error: error.message 
    });
  }
};

// Xử lý thanh toán QR
exports.simulateQRPayment = async (req, res) => {
  try {
    const { paymentCode } = req.body;
    const paymentData = JSON.parse(Buffer.from(paymentCode, 'base64').toString());

    // Xử lý thanh toán hàng loạt
    if (paymentData.bulkBillId) {
      // Tìm bill tổng
      const bulkBill = await BulkBill.findById(paymentData.bulkBillId)
        .populate('transactions');

      if (!bulkBill) {
        return res.status(404).json({ message: "Không tìm thấy thông tin thanh toán." });
      }

      // Tìm QR payment
      const qrPayment = await QRPayment.findById(bulkBill.qr_payment_id);
      if (!qrPayment || qrPayment.status !== 'pending') {
        return res.status(404).json({ message: "Không tìm thấy thông tin thanh toán hoặc mã QR đã hết hạn." });
      }

      // Kiểm tra thời gian hết hạn
      if (new Date() > qrPayment.expiryTime) {
        qrPayment.status = 'expired';
        await qrPayment.save();
        return res.status(400).json({ message: "Mã QR đã hết hạn." });
      }

      // Cập nhật trạng thái QR payment
      qrPayment.status = 'completed';
      qrPayment.completedAt = new Date();
      await qrPayment.save();

      // Cập nhật trạng thái bill tổng và các transaction
      bulkBill.status = 'paid';
      bulkBill.paid_at = new Date();
      await bulkBill.save();

      // Cập nhật trạng thái các transaction thành 'paid'
      await CompanyTransaction.updateMany(
        { _id: { $in: bulkBill.transactions } },
        { 
          $set: { 
            status: 'paid',
            paid_at: new Date()
          }
        }
      );

      res.json({
        message: "Thanh toán thành công.",
        bulkBillId: bulkBill._id,
        amount: bulkBill.total_amount,
        paidAt: bulkBill.paid_at
      });
    } else {
      // Xử lý thanh toán đơn lẻ (giữ nguyên code cũ)
      const { paymentCode } = req.body;
      console.log('Payment code received:', paymentCode);

      // Giải mã dữ liệu thanh toán từ base64
      let paymentData;
      try {
        const decodedString = Buffer.from(paymentCode, 'base64').toString();
        paymentData = JSON.parse(decodedString);
        console.log('Decoded payment data:', paymentData);
      } catch (error) {
        console.error("Lỗi giải mã payment code:", error);
        return res.status(400).json({ message: "Mã thanh toán không hợp lệ." });
      }

      // Kiểm tra dữ liệu bắt buộc
      if ((!paymentData.transactionId && !paymentData.transactionIds) || !paymentData.amount) {
        return res.status(400).json({ message: "Dữ liệu thanh toán không hợp lệ." });
      }

      // Xử lý thanh toán hàng loạt
      if (paymentData.transactionIds) {
        // Tìm QR payment cho bulk payment
        const qrPayment = await QRPayment.findOne({
          bulkTransactionIds: { $in: paymentData.transactionIds },
          status: 'pending'
        });

        if (!qrPayment) {
          return res.status(404).json({ message: "Không tìm thấy thông tin thanh toán hoặc mã QR đã hết hạn." });
        }

        // Kiểm tra thời gian hết hạn
        if (new Date() > qrPayment.expiryTime) {
          qrPayment.status = 'expired';
          await qrPayment.save();
          return res.status(400).json({ message: "Mã QR đã hết hạn." });
        }

        // Cập nhật trạng thái QR payment
        qrPayment.status = 'completed';
        qrPayment.completedAt = new Date();
        await qrPayment.save();

        // Cập nhật trạng thái giao dịch thành 'paid' (chờ admin xác nhận)
        const transaction = await CompanyTransaction.findById(paymentData.transactionId);
        if (!transaction) {
          return res.status(404).json({ message: "Không tìm thấy giao dịch." });
        }

        transaction.status = 'paid';
      transaction.paid_at = new Date();
      await transaction.save();

        res.json({
          message: "Thanh toán thành công.",
          transaction: {
            id: transaction._id,
            amount: transaction.amount,
            paidAt: transaction.paid_at
          }
        });
      } else {
        // Xử lý thanh toán đơn lẻ
        const qrPayment = await QRPayment.findOne({
          transactionId: paymentData.transactionId,
          status: 'pending'
        });

        if (!qrPayment) {
          return res.status(404).json({ message: "Không tìm thấy thông tin thanh toán hoặc mã QR đã hết hạn." });
        }

        // Kiểm tra thời gian hết hạn
        if (new Date() > qrPayment.expiryTime) {
          qrPayment.status = 'expired';
          await qrPayment.save();
          return res.status(400).json({ message: "Mã QR đã hết hạn." });
        }

        // Cập nhật trạng thái QR payment
        qrPayment.status = 'completed';
        qrPayment.completedAt = new Date();
        await qrPayment.save();

        // Cập nhật trạng thái giao dịch thành 'paid' (chờ admin xác nhận)
        const transaction = await CompanyTransaction.findById(paymentData.transactionId);
        if (!transaction) {
          return res.status(404).json({ message: "Không tìm thấy giao dịch." });
        }

        transaction.status = 'paid';
      transaction.paid_at = new Date();
      await transaction.save();

        res.json({
          message: "Thanh toán thành công.",
          transaction: {
            id: transaction._id,
            amount: transaction.amount,
            paidAt: transaction.paid_at
          }
        });
      }
    }
  } catch (error) {
    console.error("Lỗi thanh toán:", error);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// Kiểm tra trạng thái thanh toán QR
exports.checkQRPaymentStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const qrPayment = await QRPayment.findOne({
      transactionId: transactionId
    }).sort('-createdAt');

    if (!qrPayment) {
      return res.status(404).json({ message: "Không tìm thấy thông tin thanh toán." });
    }

    res.json({
      status: qrPayment.status,
      amount: qrPayment.amount,
      expiryTime: qrPayment.expiryTime,
      createdAt: qrPayment.createdAt
    });

  } catch (error) {
    console.error("Lỗi kiểm tra trạng thái:", error);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// Tạo mã QR cho nhiều giao dịch
exports.createBulkQRPayment = async (req, res) => {
  try {
    console.log('=== CREATE BULK QR PAYMENT ===');
    const { transactionIds } = req.body;
    const driverId = req.user._id;
    console.log('Transaction IDs:', transactionIds);

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return res.status(400).json({ message: "Vui lòng chọn ít nhất một giao dịch." });
    }

    // Kiểm tra và tính tổng số tiền
    const transactions = await CompanyTransaction.find({
      _id: { $in: transactionIds },
      status: 'pending'
    });

    if (transactions.length !== transactionIds.length) {
      return res.status(400).json({ message: "Một số giao dịch không tồn tại hoặc đã được thanh toán." });
    }

    const totalAmount = transactions.reduce((sum, trans) => sum + trans.amount, 0);

    // Tạo bill tổng
    const bulkBill = new BulkBill({
      driverId,
      transactions: transactionIds,
      total_amount: totalAmount,
      status: 'pending'
    });
    await bulkBill.save();

    // Tạo dữ liệu thanh toán
    const paymentData = {
      amount: totalAmount,
      bulkBillId: bulkBill._id,
      timestamp: Date.now()
    };
    console.log('Payment data:', paymentData);

    try {
      // Mã hóa dữ liệu thanh toán thành base64
      const paymentCode = Buffer.from(JSON.stringify(paymentData)).toString('base64');
      console.log('Payment code:', paymentCode);
      
      // Tạo QR code
      console.log('Generating QR code...');
      const qrCodeData = await qrcode.toDataURL(paymentCode);
      console.log('QR code generated');

      // Lưu thông tin QR payment
      console.log('Creating QR payment record...');
      const qrPayment = new QRPayment({
        bulkBillId: bulkBill._id,
        qrCode: qrCodeData,
        paymentCode: paymentCode,
        amount: totalAmount,
        bulkPayment: true,
        bulkTransactionIds: transactionIds
      });
      await qrPayment.save();
      console.log('QR payment saved:', qrPayment);

      // Cập nhật QR payment ID vào bill tổng
      bulkBill.qr_payment_id = qrPayment._id;
      await bulkBill.save();
      
      res.json({
        qrCode: qrCodeData,
        paymentCode: paymentCode,
        amount: totalAmount,
        expiryTime: qrPayment.expiryTime,
        bulkBillId: bulkBill._id
      });

    } catch (error) {
      console.error('Error in QR code generation:', error);
      throw new Error('Không thể tạo mã QR: ' + error.message);
    }

  } catch (error) {
    console.error("Lỗi tạo mã QR hàng loạt:", error);
    if (error.name) console.error('Error name:', error.name);
    if (error.message) console.error('Error message:', error.message);
    if (error.stack) console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: "Lỗi server khi tạo mã QR.",
      error: error.message 
    });
  }
};

// Kiểm tra trạng thái thanh toán hàng loạt
exports.checkBulkQRPaymentStatus = async (req, res) => {
  try {
    const { bulkPaymentId } = req.params;
    
    const qrPayment = await QRPayment.findById(bulkPaymentId);
    if (!qrPayment) {
      return res.status(404).json({ message: "Không tìm thấy giao dịch." });
    }

    // Kiểm tra hết hạn
    if (qrPayment.expiryTime < new Date()) {
      qrPayment.status = 'expired';
      await qrPayment.save();
      
      // Không cần cập nhật lại trạng thái các giao dịch vì chúng vẫn đang ở 'pending'
      
      return res.json({ status: 'expired' });
    }

    res.json({ status: qrPayment.status });
  } catch (error) {
    console.error("Lỗi kiểm tra trạng thái:", error);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// Xác nhận thanh toán hàng loạt (cho admin)
exports.adminConfirmBulkPayment = async (req, res) => {
  try {
    const { bulkBillId } = req.params;
    const { status, remarks } = req.body;
    const adminId = req.user._id;

    // Kiểm tra bill tổng
    const bulkBill = await BulkBill.findById(bulkBillId)
      .populate('transactions');
      
    if (!bulkBill) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin thanh toán'
      });
    }

    // Chỉ cho phép xác nhận các bill đã thanh toán (status = 'paid')
    if (bulkBill.status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Bill không ở trạng thái chờ xác nhận'
      });
    }

    // Chỉ cho phép chuyển sang trạng thái 'confirmed' hoặc 'rejected'
    if (!['confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    // Cập nhật trạng thái bill tổng
    bulkBill.status = status;
    bulkBill.confirmed_at = new Date();
    bulkBill.confirmed_by = adminId;
    bulkBill.remarks = remarks;
    await bulkBill.save();

    // Cập nhật trạng thái các transaction
    await CompanyTransaction.updateMany(
      { _id: { $in: bulkBill.transactions } },
      { 
        $set: { 
          status: status,
          confirmed_at: new Date(),
          confirmed_by: adminId,
          remarks: remarks
        }
      }
    );

    res.status(200).json({
      success: true,
      message: status === 'confirmed' ? 'Đã xác nhận thanh toán' : 'Đã từ chối thanh toán',
      data: bulkBill
    });
  } catch (error) {
    console.error('Error confirming bulk payment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xác nhận thanh toán',
      error: error.message
    });
  }
};

// Get all commission transactions with filters
exports.getAllCommissions = async (req, res) => {
    try {
        const {
            status,
            startDate,
            endDate,
            driverId,
            searchTerm
        } = req.query;

        let query = {};

        // Add filters
        if (status) {
            query.status = status;
        }

        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        if (driverId) {
            query.driverId = mongoose.Types.ObjectId(driverId);
        }

        if (searchTerm) {
            query.$or = [
                { 'driverDetails.name': { $regex: searchTerm, $options: 'i' } },
                { 'driverDetails.email': { $regex: searchTerm, $options: 'i' } }
            ];
        }

        const commissions = await QRPayment.aggregate([
            {
                $lookup: {
                    from: 'drivers',
                    localField: 'driverId',
                    foreignField: '_id',
                    as: 'driverDetails'
                }
            },
            {
                $unwind: '$driverDetails'
            },
            {
                $match: query
            },
            {
                $sort: { createdAt: -1 }
            }
        ]);

        res.status(200).json({
            success: true,
            data: commissions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching commissions',
            error: error.message
        });
    }
};

// Get commission statistics
exports.getCommissionStats = async (req, res) => {
    try {
        const stats = await QRPayment.aggregate([
            {
                $group: {
                    _id: '$status',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const formattedStats = {
            total: 0,
            pending: 0,
            completed: 0,
            failed: 0,
            pendingCount: 0,
            completedCount: 0,
            failedCount: 0
        };

        stats.forEach(stat => {
            if (stat._id === 'pending') {
                formattedStats.pending = stat.totalAmount;
                formattedStats.pendingCount = stat.count;
            } else if (stat._id === 'completed') {
                formattedStats.completed = stat.totalAmount;
                formattedStats.completedCount = stat.count;
            } else if (stat._id === 'failed') {
                formattedStats.failed = stat.totalAmount;
                formattedStats.failedCount = stat.count;
            }
        });

        formattedStats.total = formattedStats.pending + formattedStats.completed + formattedStats.failed;

        res.status(200).json({
            success: true,
            data: formattedStats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching commission statistics',
            error: error.message
        });
    }
};

// Get driver-wise commission statistics
exports.getDriverCommissionStats = async (req, res) => {
    try {
        const stats = await QRPayment.aggregate([
            {
                $lookup: {
                    from: 'drivers',
                    localField: 'driverId',
                    foreignField: '_id',
                    as: 'driverDetails'
                }
            },
            {
                $unwind: '$driverDetails'
            },
            {
                $group: {
                    _id: '$driverId',
                    driverName: { $first: '$driverDetails.name' },
                    driverEmail: { $first: '$driverDetails.email' },
                    totalAmount: { $sum: '$amount' },
                    pendingAmount: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0]
                        }
                    },
                    completedAmount: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0]
                        }
                    },
                    failedAmount: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'failed'] }, '$amount', 0]
                        }
                    },
                    totalTransactions: { $sum: 1 }
                }
            },
            {
                $sort: { totalAmount: -1 }
            }
        ]);

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching driver commission statistics',
            error: error.message
        });
    }
};

// Get driver commissions
exports.getDriverCommissions = async (req, res) => {
    try {
        const driverId = req.user._id;
        const commissions = await QRPayment.find({ driverId })
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            data: commissions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching driver commissions',
            error: error.message
        });
    }
};

// Request commission payment
exports.requestCommissionPayment = async (req, res) => {
    try {
        const { amount } = req.body;
        const driverId = req.user._id;

        const payment = new QRPayment({
            driverId,
            amount,
            status: 'pending'
        });

        await payment.save();

        res.status(201).json({
            success: true,
            message: 'Payment request created successfully',
            data: payment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating payment request',
            error: error.message
        });
    }
};

// Check payment status
exports.checkPaymentStatus = async (req, res) => {
    try {
        const { transactionId } = req.params;
        const payment = await QRPayment.findById(transactionId);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                status: payment.status,
                processedAt: payment.processedAt,
                remarks: payment.remarks
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error checking payment status',
            error: error.message
        });
  }
};

// Admin: Lấy danh sách tất cả giao dịch hoa hồng với bộ lọc
exports.getAdminCommissions = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      driverId,
      status,
      searchQuery
    } = req.query;

    // Xây dựng query filters
    let query = {};

    // Filter theo ngày
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Filter theo tài xế
    if (driverId) {
      query.driverId = driverId;
    }

    // Filter theo trạng thái
    if (status) {
      query.status = status;
    }

    // Tìm kiếm theo mã giao dịch hoặc tên tài xế
    if (searchQuery) {
      query.$or = [
        { _id: { $regex: searchQuery, $options: 'i' } },
        { 'driverDetails.name': { $regex: searchQuery, $options: 'i' } }
      ];
    }

    // Lấy danh sách giao dịch
    const transactions = await CompanyTransaction.find(query)
      .populate({
        path: 'driverId',
        select: 'fullName email phone'
      })
      .sort('-createdAt');

    // Tính toán thống kê theo từng trạng thái
    const stats = await CompanyTransaction.aggregate([
      {
        $group: {
          _id: '$status',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Format thống kê
    const statsFormatted = {
      totalCommission: 0,
      pendingAmount: 0,
      paidAmount: 0,
      confirmedAmount: 0,
      rejectedAmount: 0,
      pendingCount: 0,
      paidCount: 0,
      confirmedCount: 0,
      rejectedCount: 0
    };

    stats.forEach(stat => {
      if (stat._id === 'pending') {
        statsFormatted.pendingAmount = stat.totalAmount;
        statsFormatted.pendingCount = stat.count;
      } else if (stat._id === 'paid') {
        statsFormatted.paidAmount = stat.totalAmount;
        statsFormatted.paidCount = stat.count;
      } else if (stat._id === 'confirmed') {
        statsFormatted.confirmedAmount = stat.totalAmount;
        statsFormatted.confirmedCount = stat.count;
      } else if (stat._id === 'rejected') {
        statsFormatted.rejectedAmount = stat.totalAmount;
        statsFormatted.rejectedCount = stat.count;
      }
    });

    // Calculate total commission
    statsFormatted.totalCommission = statsFormatted.pendingAmount + 
                                   statsFormatted.paidAmount + 
                                   statsFormatted.confirmedAmount + 
                                   statsFormatted.rejectedAmount;

    res.json({
      success: true,
      transactions: transactions.map(trans => ({
        _id: trans._id,
        amount: trans.amount,
        status: trans.status,
        createdAt: trans.createdAt,
        paid_at: trans.paid_at,
        confirmed_at: trans.confirmed_at,
        driverDetails: {
          id: trans.driverId._id,
          name: trans.driverId.fullName,
          email: trans.driverId.email,
          phone: trans.driverId.phone
        }
      })),
      stats: statsFormatted
    });

  } catch (error) {
    console.error('Error getting admin commissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting commission data',
      error: error.message
    });
  }
};

// Admin: Lấy danh sách tài xế cho dropdown filter
exports.getDriversList = async (req, res) => {
  try {
    const drivers = await Driver.find({}, 'fullName email');
    res.json({
      success: true,
      drivers: drivers.map(driver => ({
        _id: driver._id,
        name: driver.fullName,
        email: driver.email
      }))
    });
  } catch (error) {
    console.error('Error getting drivers list:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting drivers list',
      error: error.message
    });
  }
};

// Lấy danh sách bill tổng của tài xế
exports.getDriverBulkBills = async (req, res) => {
  try {
    const driverId = req.user._id;

    const bills = await BulkBill.find({ driverId })
      .populate('transactions')
      .sort('-createdAt');

    res.json({
      success: true,
      bills: bills
    });
  } catch (error) {
    console.error('Error fetching bulk bills:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bill tổng',
      error: error.message
    });
  }
};

// Lấy danh sách bill tổng cho admin
exports.getAdminBulkBills = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      driverName,
      status
    } = req.query;

    // Xây dựng query filters
    let filters = {};
    
    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }
    
    if (status) filters.status = status;

    // Lấy danh sách bulk bills
    let query = BulkBill.find(filters)
      .populate('driverId', 'fullName email phone')
      .populate('qr_payment_id')
      .sort('-createdAt');

    // Nếu có filter theo tên tài xế
    if (driverName) {
      const driverRegex = new RegExp(driverName, 'i');
      query = query.populate({
        path: 'driverId',
        match: { fullName: { $regex: driverRegex } }
      });
    }

    let bills = await query;

    // Lọc lại bills nếu có filter theo tên tài xế
    if (driverName) {
      bills = bills.filter(bill => bill.driverId);
    }

    // Tính toán thống kê
    const stats = {
      totalAmount: bills.reduce((sum, bill) => sum + (bill.total_amount || 0), 0),
      pendingAmount: bills.filter(bill => bill.status === 'pending').reduce((sum, bill) => sum + (bill.total_amount || 0), 0),
      paidAmount: bills.filter(bill => bill.status === 'paid').reduce((sum, bill) => sum + (bill.total_amount || 0), 0),
      confirmedAmount: bills.filter(bill => bill.status === 'confirmed').reduce((sum, bill) => sum + (bill.total_amount || 0), 0),
      rejectedAmount: bills.filter(bill => bill.status === 'rejected').reduce((sum, bill) => sum + (bill.total_amount || 0), 0)
    };

    res.json({
      success: true,
      bills,
      stats
    });
  } catch (error) {
    console.error('Error getting admin bulk bills:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bulk bills',
      error: error.message
    });
  }
};

// Admin - Lấy danh sách bulk bills
exports.getAdminBulkBills = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      driverName,
      status
    } = req.query;

    // Xây dựng query filters
    let filters = {};
    
    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }
    
    if (status) filters.status = status;

    // Lấy danh sách bulk bills
    let query = BulkBill.find(filters)
      .populate('driverId', 'fullName email phone')
      .populate('qr_payment_id')
      .sort('-createdAt');

    // Nếu có filter theo tên tài xế
    if (driverName) {
      const driverRegex = new RegExp(driverName, 'i');
      query = query.populate({
        path: 'driverId',
        match: { fullName: { $regex: driverRegex } }
      });
    }

    let bills = await query;

    // Lọc lại bills nếu có filter theo tên tài xế
    if (driverName) {
      bills = bills.filter(bill => bill.driverId);
    }

    // Tính toán thống kê
    const stats = {
      totalAmount: bills.reduce((sum, bill) => sum + (bill.total_amount || 0), 0),
      pendingAmount: bills.filter(bill => bill.status === 'pending').reduce((sum, bill) => sum + (bill.total_amount || 0), 0),
      paidAmount: bills.filter(bill => bill.status === 'paid').reduce((sum, bill) => sum + (bill.total_amount || 0), 0),
      confirmedAmount: bills.filter(bill => bill.status === 'confirmed').reduce((sum, bill) => sum + (bill.total_amount || 0), 0),
      rejectedAmount: bills.filter(bill => bill.status === 'rejected').reduce((sum, bill) => sum + (bill.total_amount || 0), 0)
    };

    res.json({
      success: true,
      bills,
      stats
    });
  } catch (error) {
    console.error('Error getting admin bulk bills:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bulk bills',
      error: error.message
    });
  }
};

// Admin - Lấy chi tiết bulk bill
exports.getAdminBulkBillDetails = async (req, res) => {
  try {
    const { bulkBillId } = req.params;

    const bill = await BulkBill.findById(bulkBillId)
      .populate('driverId', 'fullName email phone')
      .populate('qr_payment_id')
      .populate({
        path: 'transactions',
        populate: {
          path: 'total_earning_id',
          populate: {
            path: 'driverAssigmentId',
            populate: {
              path: 'orderId'
            }
          }
        }
      });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bulk bill'
      });
    }

    res.json({
      success: true,
      bill
    });
  } catch (error) {
    console.error('Error getting bulk bill details:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết bulk bill',
      error: error.message
    });
  }
};

// Admin - Xác nhận thanh toán bulk bill
exports.adminConfirmBulkPayment = async (req, res) => {
  try {
    const { bulkBillId } = req.params;
    const { status, remarks } = req.body;
    const adminId = req.user._id;

    // Kiểm tra bulk bill
    const bill = await BulkBill.findById(bulkBillId);
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bulk bill'
      });
    }

    // Chỉ cho phép xác nhận các bill đã thanh toán (status = 'paid')
    if (bill.status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Bill không ở trạng thái chờ xác nhận'
      });
    }

    // Chỉ cho phép chuyển sang trạng thái 'confirmed' hoặc 'rejected'
    if (!['confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    // Cập nhật trạng thái bulk bill
    bill.status = status;
    bill.confirmed_at = new Date();
    bill.confirmed_by = adminId;
    bill.remarks = remarks;
    await bill.save();

    // Cập nhật trạng thái các giao dịch con
    await CompanyTransaction.updateMany(
      { _id: { $in: bill.transactions } },
      { 
        $set: { 
          status,
          confirmed_at: new Date(),
          confirmed_by: adminId,
          remarks
        }
      }
    );

    res.status(200).json({
      success: true,
      message: status === 'confirmed' ? 'Đã xác nhận thanh toán' : 'Đã từ chối thanh toán',
      data: bill
    });
  } catch (error) {
    console.error('Error confirming bulk payment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xác nhận thanh toán',
      error: error.message
    });
  }
};

// Cập nhật trạng thái thanh toán QR
exports.updateQRPaymentStatus = async (req, res) => {
    try {
        const { paymentCode } = req.params;
        const qrPayment = await QRPayment.findOne({ paymentCode });
        
        if (!qrPayment) {
            return res.status(404).json({ message: "Không tìm thấy giao dịch." });
        }

        // Cập nhật trạng thái QR payment
        qrPayment.status = 'completed';
        qrPayment.completedAt = new Date();
        await qrPayment.save();

        if (qrPayment.bulkPayment) {
            // Cập nhật trạng thái bill tổng
            const bulkBill = await BulkBill.findById(qrPayment.bulkBillId);
            if (bulkBill) {
                bulkBill.status = 'paid';
                bulkBill.paid_at = new Date();
                await bulkBill.save();

                // Cập nhật trạng thái tất cả các giao dịch trong bill
                await CompanyTransaction.updateMany(
                    { _id: { $in: qrPayment.bulkTransactionIds } },
                    { 
                        $set: { 
                            status: 'paid',
                            paid_at: new Date(),
                            qr_payment_id: qrPayment._id,
                            bulk_bill_id: bulkBill._id
                        }
                    }
                );
            }
        } else {
            // Cập nhật trạng thái giao dịch đơn lẻ
            const transaction = await CompanyTransaction.findById(qrPayment.transactionId);
            if (transaction) {
                transaction.status = 'paid';
                transaction.paid_at = new Date();
                transaction.qr_payment_id = qrPayment._id;
                await transaction.save();
            }
        }

        res.json({ 
            success: true,
            message: "Cập nhật trạng thái thanh toán thành công.",
            status: 'completed'
        });
    } catch (error) {
        console.error("Lỗi cập nhật trạng thái thanh toán:", error);
        res.status(500).json({ message: "Lỗi server." });
    }
};

// Driver - Lấy danh sách bulk bills
exports.getDriverBulkBills = async (req, res) => {
  try {
    const driverId = req.user._id;

    // Lấy danh sách bulk bills của driver
    const bills = await BulkBill.find({ driverId })
      .populate('qr_payment_id')
      .sort('-createdAt');

    res.json({
      success: true,
      bills
    });
  } catch (error) {
    console.error('Error getting driver bulk bills:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bulk bills',
      error: error.message
    });
  }
};

// Driver - Lấy chi tiết bulk bill
exports.getDriverBulkBillDetails = async (req, res) => {
  try {
    const { bulkBillId } = req.params;
    const driverId = req.user._id;

    const bill = await BulkBill.findOne({ _id: bulkBillId, driverId })
      .populate('qr_payment_id')
      .populate({
        path: 'transactions',
        select: '_id amount status createdAt paid_at confirmed_at remarks',
        populate: {
          path: 'total_earning_id',
          select: 'amount',
          populate: {
            path: 'driverAssigmentId',
            select: 'orderId',
            populate: {
              path: 'orderId',
              select: 'orderCode'
            }
          }
        }
      });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bulk bill'
      });
    }

    res.json({
      success: true,
      bill: {
        _id: bill._id,
        total_amount: bill.total_amount,
        status: bill.status,
        createdAt: bill.createdAt,
        paid_at: bill.paid_at,
        confirmed_at: bill.confirmed_at,
        remarks: bill.remarks,
        transactions: bill.transactions.map(trans => ({
          _id: trans._id,
          amount: trans.amount,
          status: trans.status,
          createdAt: trans.createdAt,
          paid_at: trans.paid_at,
          confirmed_at: trans.confirmed_at,
          remarks: trans.remarks,
          order_code: trans.total_earning_id?.driverAssigmentId?.orderId?.orderCode
        }))
      }
    });
  } catch (error) {
    console.error('Error getting bulk bill details:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết bulk bill',
      error: error.message
    });
  }
};
