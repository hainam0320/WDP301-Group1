const CompanyTransaction = require("../model/companyTransisModel");
const TotalEarning = require("../model/totalEarning");
const QRPayment = require("../model/qrPaymentModel");
const BulkBill = require("../model/bulkBillModel");
const qrcode = require("qrcode");
const crypto = require("crypto");
const Driver = require("../model/driverModel");
const mongoose = require("mongoose");
const AdminToDriverPayout = require("../model/adminToDriverPayoutModel");

// --- CÁC HÀM LIÊN QUAN ĐẾN LUỒNG MỚI (ADMIN TRẢ TIỀN CHO DRIVER) ---

// Lấy số dư công ty nợ tài xế
exports.getDriverPayoutsBalance = async (req, res) => {
  try {
    const driverId = req.user._id;
    const driver = await Driver.findById(driverId).select(
      "fullName balanceOwedByCompany"
    );

    if (!driver) {
      return res.status(404).json({ message: "Không tìm thấy tài xế." });
    }

    res.json({
      success: true,
      balance: driver.balanceOwedByCompany,
      driverName: driver.fullName,
    });
  } catch (error) {
    console.error("Lỗi khi lấy số dư của tài xế:", error);
    res.status(500).json({ message: "Lỗi server khi lấy số dư." });
  }
};

// Lấy lịch sử chi trả từ Admin cho tài xế
exports.getDriverPayoutsHistory = async (req, res) => {
  try {
    const driverId = req.user._id;
    const payouts = await AdminToDriverPayout.find({ driverId })
      .populate("adminId", "fullName email")
      .sort("-payoutDate");

    res.json({
      success: true,
      payouts: payouts,
      count: payouts.length,
    });
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử chi trả của tài xế:", error);
    res.status(500).json({ message: "Lỗi server khi lấy lịch sử chi trả." });
  }
};

// Tài xế gửi yêu cầu rút tiền
exports.requestPayout = async (req, res) => {
  try {
    const driverId = req.user._id;
    const { amount } = req.body;

    console.log("--- requestPayout: Received request ---"); // Log mới
    console.log("driverId:", driverId); // Log mới
    console.log("Requested amount:", amount); // Log mới

    if (amount <= 0) {
      console.log("requestPayout: Amount <= 0"); // Log mới
      return res.status(400).json({ message: "Số tiền yêu cầu phải lớn hơn 0." });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      console.log("requestPayout: Driver not found for ID", driverId); // Log mới
      return res.status(404).json({ message: "Không tìm thấy tài xế." });
    }

    // Kiểm tra số dư có đủ không
    console.log("requestPayout: Driver balance:", driver.balanceOwedByCompany); // Log mới
    if (driver.balanceOwedByCompany < amount) {
      console.log("requestPayout: Insufficient balance"); // Log mới
      return res.status(400).json({ message: `Số dư hiện tại (${driver.balanceOwedByCompany.toLocaleString()} VND) không đủ để rút ${amount.toLocaleString()} VND.` });
    }

    // Tạo bản ghi yêu cầu chi trả mới
    const payoutRequest = new AdminToDriverPayout({
      driverId,
      amount,
      status: 'pending', // Trạng thái pending chờ admin xử lý
      payoutDate: new Date(), // Ghi nhận thời gian yêu cầu
      adminId: null, // Chưa có admin xử lý
      notes: 'Yêu cầu rút tiền từ tài xế.'
    });
    await payoutRequest.save();
    console.log("requestPayout: Payout request saved:", payoutRequest); // Log mới

    // Trừ số tiền này khỏi balanceOwedByCompany ngay lập tức để tránh rút trùng lặp
    driver.balanceOwedByCompany -= amount;
    await driver.save();
    console.log("requestPayout: Driver balance updated:", driver.balanceOwedByCompany); // Log mới

    res.status(201).json({
      success: true,
      message: "Yêu cầu rút tiền đã được gửi thành công. Vui lòng chờ Admin xử lý.",
      payoutRequest: payoutRequest,
      newBalance: driver.balanceOwedByCompany
    });
  } catch (error) {
    console.error("Lỗi khi tài xế gửi yêu cầu rút tiền (chi tiết):", error); // Log lỗi chi tiết hơn
    res.status(500).json({ message: "Lỗi server khi gửi yêu cầu rút tiền." });
  }
};
// Lấy danh sách yêu cầu rút tiền của tài xế (các yêu cầu đang chờ xử lý)
exports.getDriverPayoutRequests = async (req, res) => {
  try {
    const driverId = req.user._id;

    const pendingRequests = await AdminToDriverPayout.find({
      driverId,
      status: "pending",
    }).sort("-payoutDate");

    res.json({
      success: true,
      requests: pendingRequests,
      count: pendingRequests.length,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách yêu cầu rút tiền của tài xế:", error);
    res.status(500).json({ message: "Lỗi server khi lấy yêu cầu rút tiền." });
  }
};

// Lấy danh sách yêu cầu rút tiền đang chờ xử lý cho Admin
exports.getAdminPendingPayoutRequests = async (req, res) => {
  try {
    const pendingRequests = await AdminToDriverPayout.find({
      status: "pending",
    })
      .populate("driverId", "fullName email phone balanceOwedByCompany")
      .sort("-payoutDate");

    res.json({
      success: true,
      requests: pendingRequests,
      count: pendingRequests.length,
    });
  } catch (error) {
    console.error("Lỗi khi Admin lấy danh sách yêu cầu rút tiền:", error);
    res
      .status(500)
      .json({ message: "Lỗi server khi lấy yêu cầu rút tiền của Admin." });
  }
};

// Admin xử lý yêu cầu rút tiền (duyệt hoặc từ chối)
exports.processPayoutRequest = async (req, res) => {
  try {
    const { payoutId } = req.params;
    const { status, adminNotes } = req.body;
    const adminId = req.user._id;

    if (!["completed", "cancelled"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Trạng thái xử lý không hợp lệ." });
    }

    const payoutRequest = await AdminToDriverPayout.findById(payoutId);

    if (!payoutRequest) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy yêu cầu rút tiền." });
    }

    if (payoutRequest.status !== "pending") {
      return res
        .status(400)
        .json({
          message: "Yêu cầu này đã được xử lý hoặc không ở trạng thái chờ.",
        });
    }

    payoutRequest.status = status;
    payoutRequest.adminId = adminId;
    payoutRequest.notes = adminNotes || payoutRequest.notes;
    payoutRequest.payoutDate = new Date();

    if (status === "cancelled") {
      const driver = await Driver.findById(payoutRequest.driverId);
      if (driver) {
        driver.balanceOwedByCompany += payoutRequest.amount;
        await driver.save();
        console.log(
          `Đã hoàn lại ${payoutRequest.amount} vào số dư của tài xế ${driver.fullName}`
        );
      } else {
        console.warn(
          `Không tìm thấy tài xế ${payoutRequest.driverId} để hoàn lại số dư.`
        );
      }
    }

    await payoutRequest.save();

    res.json({
      success: true,
      message: `Yêu cầu rút tiền đã được ${
        status === "completed" ? "duyệt" : "từ chối"
      } thành công.`,
      payoutRequest: payoutRequest,
    });
  } catch (error) {
    console.error("Lỗi khi Admin xử lý yêu cầu rút tiền:", error);
    res.status(500).json({ message: "Lỗi server khi xử lý yêu cầu rút tiền." });
  }
};

// --- CÁC HÀM LIÊN QUAN ĐẾN ADMIN QUẢN LÝ BULK BILL (VẪN GIỮ LẠI) ---

// Lấy danh sách hóa đơn tổng cho admin
exports.getAdminBulkBills = async (req, res) => {
  try {
    const { startDate, endDate, driverName, status } = req.query;

    const query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (status) {
      query.status = status;
    } else {
      query.status = { $ne: "pending" };
    }

    if (driverName) {
      const drivers = await Driver.find({
        fullName: { $regex: driverName, $options: "i" },
      });
      query.driverId = { $in: drivers.map((d) => d._id) };
    }

    const bills = await BulkBill.find(query)
      .populate("driverId", "fullName email phone")
      .populate("transactions")
      .sort("-createdAt");

    const stats = {
      totalAmount: 0,
      pendingAmount: 0,
      paidAmount: 0,
      confirmedAmount: 0,
      rejectedAmount: 0,
    };

    bills.forEach((bill) => {
      stats.totalAmount += bill.total_amount;
      switch (bill.status) {
        case "pending":
          stats.pendingAmount += bill.total_amount;
          break;
        case "paid":
          stats.paidAmount += bill.total_amount;
          break;
        case "confirmed":
          stats.confirmedAmount += bill.total_amount;
          break;
        case "rejected":
          stats.rejectedAmount += bill.total_amount;
          break;
      }
    });

    res.json({
      success: true,
      bills,
      stats,
    });
  } catch (error) {
    console.error("Error getting admin bulk bills:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách bills",
    });
  }
};

// Lấy chi tiết bulk bill cho admin
exports.getAdminBulkBillDetails = async (req, res) => {
  try {
    const { billId } = req.params;

    const bill = await BulkBill.findById(billId)
      .populate("driverId", "fullName email phone")
      .populate({
        path: "transactions",
        populate: {
          path: "total_earning_id",
          populate: {
            path: "driverAssigmentId",
            populate: {
              path: "orderId",
            },
          },
        },
      });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bill",
      });
    }

    res.json({
      success: true,
      bill,
    });
  } catch (error) {
    console.error("Error getting bulk bill details:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy chi tiết bill",
    });
  }
};

// Xác nhận thanh toán hóa đơn tổng (cho admin)
exports.adminConfirmBulkPayment = async (req, res) => {
  try {
    const { bulkBillId } = req.params;
    const { status, remarks } = req.body;
    const adminId = req.user._id;

    console.log("Processing admin confirmation:", {
      bulkBillId,
      status,
      remarks,
      adminId,
    });

    if (!bulkBillId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu mã bill",
      });
    }

    if (!["confirmed", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ",
      });
    }

    const bulkBill = await BulkBill.findById(bulkBillId);
    if (!bulkBill) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hóa đơn tổng",
      });
    }

    if (bulkBill.status !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Hóa đơn tổng không ở trạng thái chờ xác nhận",
      });
    }

    try {
      bulkBill.status = status;
      bulkBill.confirmed_at = new Date();
      bulkBill.confirmed_by = adminId;
      bulkBill.remarks = remarks || "";
      await bulkBill.save();

      const updateResult = await CompanyTransaction.updateMany(
        {
          _id: { $in: bulkBill.transactions },
          status: "paid",
        },
        {
          $set: {
            status: status,
            confirmed_at: new Date(),
            confirmed_by: adminId,
            remarks: remarks || "",
          },
        }
      );

      console.log("Updated transactions:", updateResult);

      res.status(200).json({
        success: true,
        message:
          status === "confirmed"
            ? "Đã xác nhận thanh toán"
            : "Đã từ chối thanh toán",
        data: bulkBill,
      });
    } catch (error) {
      try {
        bulkBill.status = "paid";
        bulkBill.confirmed_at = null;
        bulkBill.confirmed_by = null;
        bulkBill.remarks = "";
        await bulkBill.save();
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError);
      }
      throw error;
    }
  } catch (error) {
    console.error("Error confirming bulk payment:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xác nhận thanh toán: " + error.message,
    });
  }
};

exports.getAdminPayoutsHistory = async (req, res) => {
  try {
    const { startDate, endDate, driverName, status } = req.query;

    const query = {};

    if (startDate) query.payoutDate = { $gte: new Date(startDate) };
    if (endDate) {
      if (!query.payoutDate) query.payoutDate = {};
      query.payoutDate.$lte = new Date(endDate);
    }
    if (status) query.status = status;

    if (driverName) {
      const drivers = await Driver.find({
        fullName: { $regex: driverName, $options: 'i' }
      });
      if (drivers.length > 0) {
        query.driverId = { $in: drivers.map(d => d._id) };
      } else {
        query.driverId = null; // No matching drivers, return empty result
      }
    }

    const payouts = await AdminToDriverPayout.find(query)
      .populate('driverId', 'fullName email phone') // Populate thông tin tài xế
      .populate('adminId', 'fullName email') // Populate thông tin Admin xử lý
      .sort('-payoutDate');

    res.json({
      success: true,
      payouts: payouts,
      count: payouts.length
    });
  } catch (error) {
    console.error("Lỗi khi Admin lấy lịch sử chi trả:", error);
    res.status(500).json({ message: "Lỗi server khi Admin lấy lịch sử chi trả." });
  }
};
