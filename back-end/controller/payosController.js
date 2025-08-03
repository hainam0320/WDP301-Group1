const payos = require("../utils/payos.config");
const Order = require("../model/orderModel");
const CompanyTransaction = require("../model/companyTransisModel");

exports.createPayOSPaymentLink = async (req, res) => {
  let transaction; 
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status !== "completed") {
      return res
        .status(400)
        .json({ message: "Chỉ thanh toán khi đơn đã hoàn thành" });
    }

    const amount = order.price;
    const userId = req.user._id;

    transaction = new CompanyTransaction({
      userId,
      orderId,
      amount,
      status: "pending",
      payment_method: "payos",
    });
    await transaction.save();

    console.log("--- createPayOSPaymentLink: Transaction saved temporarily ---");
    console.log("transaction._id (MongoDB ObjectId):", transaction._id);
    console.log("transaction.orderCode (initially null/undefined):", transaction.orderCode);
    console.log("transaction.payos_payment_id (initially null/undefined):", transaction.payos_payment_id);
    console.log("---------------------------------------------------------");
    
    const orderCodeForPayOS = transaction._id.toString(); 

    const returnUrl = `${process.env.DOMAIN_FE}/payment-success`;
    const cancelUrl = `${process.env.DOMAIN_FE}/payment-fail`;
    const notifyUrl = `${process.env.DOMAIN_BE}/api/payos/webhook`;

    const shortOrderId = order._id.toString().slice(-6);
    const description = `Don hang #${shortOrderId}`;

    const paymentPayload = {
      orderCode: parseInt(orderCodeForPayOS.slice(-8), 16),
      amount,
      description,
      returnUrl,
      cancelUrl,
      notifyUrl,
      buyerName: req.user.fullName || "Khách hàng",
      buyerEmail: req.user.email || "test@example.com",
      buyerPhone: order.phone || "0900000000",
      items: [
        {
          name: `Đơn hàng #${shortOrderId}`,
          quantity: 1,
          price: amount,
        },
      ],
    };
    console.log("PayOS payment payload:", paymentPayload);
    const paymentLinkRes = await payos.createPaymentLink(paymentPayload);

    console.log("--- createPayOSPaymentLink: PayOS Response after creating link ---");
    console.log("paymentLinkRes.orderCode (sent to PayOS):", paymentLinkRes.orderCode); // Sẽ dùng cái này
    console.log("paymentLinkRes.paymentId (from PayOS):", paymentLinkRes.paymentId); // Đã là undefined
    console.log("paymentLinkRes.checkoutUrl:", paymentLinkRes.checkoutUrl);
    console.log("-----------------------------------------------------------------");

    // Cập nhật lại bản ghi CompanyTransaction với orderCode từ PayOS response
    transaction.orderCode = paymentLinkRes.orderCode.toString(); // LƯU orderCode này vào DB
    transaction.payos_payment_id = paymentLinkRes.paymentId; // Giữ nguyên để debug nếu sau này PayOS thay đổi
    await transaction.save();

    console.log("--- createPayOSPaymentLink: Transaction updated in DB with PayOS IDs ---");
    console.log("transaction._id:", transaction._id);
    console.log("transaction.orderCode (from PayOS):", transaction.orderCode); // <-- SẼ DÙNG CÁI NÀY ĐỂ TÌM
    console.log("transaction.payos_payment_id (from PayOS):", transaction.payos_payment_id);
    console.log("Transaction status:", transaction.status);
    console.log("--------------------------------------------------------------------");

    res.json({
      paymentUrl: paymentLinkRes.checkoutUrl,
    });
  } catch (err) {
    console.error("Error creating PayOS link:", err);
    if (transaction && transaction._id) {
      await CompanyTransaction.findByIdAndDelete(transaction._id);
      console.log(`Deleted temporary transaction ${transaction._id} due to error.`);
    }
    res
      .status(500)
      .json({ message: "Failed to create payment link", error: err.message });
  }
};

exports.payosWebhook = async (req, res) => {
  try {
    console.log("=== PAYOS WEBHOOK RECEIVED (payosController) ===");
    const { code, success, data } = req.body; 
    if (code === "00" && success === true) {
      console.log("Payment is successful, updating transaction and order...");

      // **SỬA ĐỔI QUAN TRỌNG TẠI ĐÂY:**
      // Webhook data.orderCode chính là orderCode mà chúng ta đã gửi đi và được PayOS trả về
      const payosOrderCodeFromWebhook = data.orderCode; 
      if (!payosOrderCodeFromWebhook) {
          console.error("Webhook data missing `orderCode` field.");
          return res.status(400).send("Missing PayOS Order Code (`orderCode`) in webhook data");
      }

      // --- LOGGING BƯỚC 5: Giá trị orderCode dùng để tìm kiếm ---
      console.log("Searching for transaction with orderCode:", payosOrderCodeFromWebhook);

      const transaction = await CompanyTransaction.findOne({
        orderCode: payosOrderCodeFromWebhook.toString(), // Tìm bằng `orderCode` (lưu ý: đảm bảo là string)
      });
      if (!transaction) {
        console.log(
          "Transaction not found for orderCode:",
          payosOrderCodeFromWebhook
        );
        return res.status(404).send("Transaction not found");
      }

      if (transaction.status === "paid") {
        console.log("Transaction already paid, ignoring duplicate webhook.");
        return res.status(200).send("OK (Already paid)");
      }

      transaction.status = "paid";
      transaction.paid_at = new Date();
      await transaction.save();
      console.log("Transaction updated:", transaction);

      const order = await Order.findById(transaction.orderId);
      if (order) {
        order.paymentStatus = "paid";
        await order.save();
        
        // Cập nhật balance của driver khi payment hoàn tất
        if (order.status === 'completed' && order.driverId) {
          try {
            console.log('Payment completed - updating driver balance...');
            
            const Driver = require('../model/driverModel');
            const TotalEarning = require('../model/totalEarning');
            
            // Tính toán hoa hồng thực nhận của tài xế (90% giá trị đơn hàng)
            const driverEarningPercentage = 0.9;
            const driverActualEarning = order.price * driverEarningPercentage;

            // Cập nhật balanceOwedByCompany cho tài xế
            const driver = await Driver.findById(order.driverId);
            if (driver) {
              driver.balanceOwedByCompany += driverActualEarning;
              await driver.save();
              console.log(`Driver ${driver._id} balance updated. New balance owed by company: ${driver.balanceOwedByCompany}`);
            } else {
              console.error(`Driver with ID ${order.driverId} not found when updating balance.`);
            }

            // Tạo bản ghi TotalEarning (cho tổng thu nhập của tài xế)
            const totalEarning = new TotalEarning({
              driverId: order.driverId,
              amount: driverActualEarning,
              date: new Date().toISOString().split("T")[0]
            });
            await totalEarning.save();
            console.log('Total earning created:', totalEarning);

            console.log(`Driver balance increased by ${driverActualEarning.toLocaleString()} VND for completed payment`);
          } catch (error) {
            console.error('Error updating driver balance after payment completion:', error);
          }
        }
      }
    } else {
      console.log("Payment is not successful:", { code, success });
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook error (payosController):", err);
    res.status(500).json({ message: "Server error" });
  }
};