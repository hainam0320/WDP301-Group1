const CompanyTransaction = require("../model/companyTransisModel");
const TotalEarning = require("../model/totalEarning");
const QRPayment = require("../model/qrPaymentModel");
const BulkBill = require("../model/bulkBillModel");
const qrcode = require('qrcode');
const crypto = require('crypto');
const Driver = require('../model/driverModel');
const mongoose = require('mongoose');

// ===== DRIVER COMMISSION MANAGEMENT =====

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
      status: { $in: ['paid', 'confirmed', 'rejected'] }
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

    const transactionsByStatus = {
      paid: transactions.filter(t => t.status === 'paid'),
      confirmed: transactions.filter(t => t.status === 'confirmed'),
      rejected: transactions.filter(t => t.status === 'rejected')
    };

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

// Lấy tổng quan về hoa hồng của tài xế
exports.getDriverCommissionOverview = async (req, res) => {
  try {
    const driverId = req.user._id;

    const [pendingTransactions, paidTransactions, confirmedTransactions, rejectedTransactions] = await Promise.all([
      CompanyTransaction.find({ driverId, status: "pending" }),
      CompanyTransaction.find({ driverId, status: "paid" }),
      CompanyTransaction.find({ driverId, status: "confirmed" }),
      CompanyTransaction.find({ driverId, status: "rejected" })
    ]);

    const totalPending = pendingTransactions.reduce((sum, trans) => sum + trans.amount, 0);
    const totalPaid = paidTransactions.reduce((sum, trans) => sum + trans.amount, 0);
    const totalConfirmed = confirmedTransactions.reduce((sum, trans) => sum + trans.amount, 0);
    const totalRejected = rejectedTransactions.reduce((sum, trans) => sum + trans.amount, 0);

    const totalCommission = totalPending + totalPaid + totalConfirmed + totalRejected;

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

// ===== BULK BILL MANAGEMENT =====

// Tạo hóa đơn tổng cho nhiều giao dịch
exports.createBulkBill = async (req, res) => {
  try {
    const { transactionIds } = req.body;
    const driverId = req.user._id;

    // Kiểm tra xem các giao dịch có tồn tại và thuộc về tài xế không
    const transactions = await CompanyTransaction.find({
      _id: { $in: transactionIds },
      driverId: driverId,
      status: "pending"
    });

    if (transactions.length !== transactionIds.length) {
      return res.status(400).json({
        success: false,
        message: "Một số giao dịch không tồn tại hoặc không thuộc về tài xế"
      });
    }

    // Tính tổng số tiền
    const totalAmount = transactions.reduce((sum, trans) => sum + trans.amount, 0);

    // Tạo hóa đơn tổng
    const bulkBill = await BulkBill.create({
      driverId,
      transactions: transactionIds,
      total_amount: totalAmount,
      status: "pending"
    });

    // Tạo mã QR cho hóa đơn tổng
    const paymentData = {
      amount: totalAmount,
      bulkBillId: bulkBill._id.toString(),
      timestamp: Date.now()
    };

    console.log('Creating payment code with data:', paymentData); // Add debug log

    const paymentCode = crypto.createHash('sha256')
      .update(JSON.stringify(paymentData))
      .digest('hex');

    console.log('Generated payment code:', paymentCode); // Add debug log

    const qrCodeData = JSON.stringify({
      paymentCode,
        amount: totalAmount,
      timestamp: Date.now()
    });

    console.log('QR code data:', qrCodeData); // Add debug log

    const qrCode = await qrcode.toDataURL(qrCodeData);

    // Tạo QR Payment
    const qrPayment = await QRPayment.create({
      bulkBillId: bulkBill._id,
      qrCode,
      paymentCode,
      amount: totalAmount,
      status: "pending",
      bulkPayment: true,
      bulkTransactionIds: transactionIds,
      expiryTime: new Date(Date.now() + 15 * 60 * 1000) // 15 phút
    });

    // Cập nhật hóa đơn tổng với mã QR
    bulkBill.qr_payment_id = qrPayment._id;
    await bulkBill.save();

        res.status(201).json({
            success: true,
            data: {
        bulkBill,
        qrPayment
            }
        });
    } catch (error) {
    console.error("Lỗi tạo hóa đơn tổng:", error);
        res.status(500).json({
            success: false,
      message: "Lỗi khi tạo hóa đơn tổng",
            error: error.message
        });
  }
};

// Lấy danh sách hóa đơn tổng của tài xế
exports.getDriverBulkBills = async (req, res) => {
  try {
    const driverId = req.user._id;
    const bills = await BulkBill.find({ driverId })
      .populate('transactions')
      .populate('qr_payment_id')
      .sort('-createdAt');

    res.json({
      success: true,
      data: bills
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách hóa đơn tổng:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách hóa đơn tổng",
      error: error.message
    });
  }
};

// Lấy danh sách hóa đơn tổng cho admin
exports.getAdminBulkBills = async (req, res) => {
  try {
    const { startDate, endDate, driverName, status } = req.query;
    
    // Xây dựng query
    const query = {};
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (status) {
      query.status = status;
    }

    // Nếu có tên tài xế, tìm driver ID trước
    if (driverName) {
      const drivers = await Driver.find({
        fullName: { $regex: driverName, $options: 'i' }
      });
      query.driverId = { $in: drivers.map(d => d._id) };
    }

    // Lấy danh sách bills
    const bills = await BulkBill.find(query)
      .populate('driverId', 'fullName email phone')
      .populate('transactions')
      .sort('-createdAt');

    // Tính toán thống kê
    const stats = {
      totalAmount: 0,
      pendingAmount: 0,
      paidAmount: 0,
      confirmedAmount: 0,
      rejectedAmount: 0
    };

    bills.forEach(bill => {
      stats.totalAmount += bill.total_amount;
      switch (bill.status) {
        case 'pending':
          stats.pendingAmount += bill.total_amount;
          break;
        case 'paid':
          stats.paidAmount += bill.total_amount;
          break;
        case 'confirmed':
          stats.confirmedAmount += bill.total_amount;
          break;
        case 'rejected':
          stats.rejectedAmount += bill.total_amount;
          break;
      }
    });

    res.json({
      success: true,
      bills,
      stats
    });
  } catch (error) {
    console.error('Error getting admin bulk bills:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bills'
    });
  }
};

// Lấy chi tiết bulk bill cho admin
exports.getAdminBulkBillDetails = async (req, res) => {
  try {
    const { billId } = req.params;

    const bill = await BulkBill.findById(billId)
      .populate('driverId', 'fullName email phone')
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
        message: 'Không tìm thấy bill'
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
      message: 'Lỗi khi lấy chi tiết bill'
    });
  }
};

// ===== PAYMENT CONFIRMATION =====

// Xác nhận thanh toán hóa đơn tổng (cho admin)
exports.adminConfirmBulkPayment = async (req, res) => {
  try {
    const { bulkBillId } = req.params;
    const { status, remarks } = req.body;
    const adminId = req.user._id;

    console.log('Processing admin confirmation:', {
      bulkBillId,
      status,
      remarks,
      adminId
    });

    // Validate input
    if (!bulkBillId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu mã bill'
      });
    }

    if (!['confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    // Find the bulk bill
    const bulkBill = await BulkBill.findById(bulkBillId);
    if (!bulkBill) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hóa đơn tổng'
      });
    }

    // Check if bill is in correct state
    if (bulkBill.status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Hóa đơn tổng không ở trạng thái chờ xác nhận'
      });
    }

    try {
      // Update bulk bill status
      bulkBill.status = status;
      bulkBill.confirmed_at = new Date();
      bulkBill.confirmed_by = adminId;
      bulkBill.remarks = remarks || '';
      await bulkBill.save();

      // Update associated transactions
      const updateResult = await CompanyTransaction.updateMany(
        { 
          _id: { $in: bulkBill.transactions },
          status: 'paid' // Only update transactions in 'paid' status
        },
      { 
        $set: { 
            status: status,
          confirmed_at: new Date(),
          confirmed_by: adminId,
            remarks: remarks || ''
        }
      }
    );

      console.log('Updated transactions:', updateResult);

    res.status(200).json({
      success: true,
      message: status === 'confirmed' ? 'Đã xác nhận thanh toán' : 'Đã từ chối thanh toán',
        data: bulkBill
      });
    } catch (error) {
      // If error occurs, try to rollback bulk bill status
      try {
        bulkBill.status = 'paid';
        bulkBill.confirmed_at = null;
        bulkBill.confirmed_by = null;
        bulkBill.remarks = '';
        await bulkBill.save();
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError);
      }
      throw error;
    }
  } catch (error) {
    console.error('Error confirming bulk payment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xác nhận thanh toán: ' + error.message
    });
  }
};

// Cập nhật trạng thái thanh toán QR
exports.updateBulkQRPaymentStatus = async (req, res) => {
    try {
        const { paymentCode } = req.params;
    const { status } = req.body;

    if (!paymentCode) {
      return res.status(400).json({
        success: false,
        message: 'Mã thanh toán không được để trống'
      });
    }

    // Clean the payment code
    const cleanPaymentCode = decodeURIComponent(paymentCode.trim());
    console.log('Processing payment with code:', cleanPaymentCode);

    const qrPayment = await QRPayment.findOne({ 
      paymentCode: cleanPaymentCode,
      status: 'pending'
    });
    
    console.log('Found QR payment:', qrPayment);
        
        if (!qrPayment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã thanh toán hoặc mã đã được sử dụng'
      });
    }

    if (qrPayment.expiryTime < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Mã thanh toán đã hết hạn'
      });
    }

    try {
      // Cập nhật trạng thái QR Payment
      qrPayment.status = status;
        qrPayment.completedAt = new Date();
        await qrPayment.save();

      if (status === 'completed') {
        // Cập nhật trạng thái hóa đơn tổng
            const bulkBill = await BulkBill.findById(qrPayment.bulkBillId);
        if (!bulkBill) {
          throw new Error('Không tìm thấy hóa đơn tổng');
        }

                bulkBill.status = 'paid';
                bulkBill.paid_at = new Date();
                await bulkBill.save();

        // Cập nhật trạng thái các giao dịch con
        if (qrPayment.bulkTransactionIds && qrPayment.bulkTransactionIds.length > 0) {
          const updateResult = await CompanyTransaction.updateMany(
            { 
              _id: { $in: qrPayment.bulkTransactionIds },
              status: 'pending' // Only update pending transactions
            },
                    { 
                        $set: { 
                            status: 'paid',
                paid_at: new Date()
              }
            }
          );
          console.log('Updated transactions:', updateResult);
        }
      }

      res.status(200).json({
            success: true,
        message: 'Đã cập nhật trạng thái thanh toán',
        data: qrPayment
        });
    } catch (error) {
      // If any error occurs, try to rollback QR payment status
      try {
        qrPayment.status = 'pending';
        qrPayment.completedAt = null;
        await qrPayment.save();
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError);
      }
      throw error;
    }
  } catch (error) {
    console.error('Error updating QR payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái thanh toán: ' + error.message
    });
  }
};
