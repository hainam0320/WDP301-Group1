const express = require('express');
const router = express.Router();
const payos = require('../utils/payos.config');
const Order = require('../model/orderModel');
const CompanyTransaction = require('../model/companyTransisModel');

router.use(express.raw({ type: 'application/json' }));

router.post('/webhook', async (req, res) => {
  try {
    console.log('=== PAYOS WEBHOOK RECEIVED (webhook.js route) ===');
    const rawBody = req.body;
    const checksumHeader = req.headers['x-checksum-hmac'];

    const isValid = payos.verifyPaymentWebhook(rawBody.toString(), checksumHeader);
    if (!isValid) {
      console.log('Invalid checksum received.');
      return res.status(400).send('Invalid checksum');
    }

    const data = JSON.parse(rawBody.toString());
    const { code, success, data: webhookData } = data; 

    // --- LOGGING BƯỚC 4 (webhook.js): Dữ liệu webhook thô từ PayOS ---
    console.log('Parsed webhook data (webhook.js):', data);

    if (code === '00' && success === true) {
      console.log('Payment is successful, updating transaction and order...');

      // **SỬA ĐỔI QUAN TRỌNG TẠI ĐÂY:**
      // Webhook data.orderCode chính là orderCode mà chúng ta đã gửi đi và được PayOS trả về
      const payosOrderCodeFromWebhook = webhookData.orderCode; 
      if (!payosOrderCodeFromWebhook) {
          console.error("Webhook data missing `orderCode` field.");
          return res.status(400).send("Missing PayOS Order Code (`orderCode`) in webhook data");
      }

      // --- LOGGING BƯỚC 5 (webhook.js): Giá trị orderCode dùng để tìm kiếm ---
      console.log("Searching for transaction (webhook.js) with orderCode:", payosOrderCodeFromWebhook);

      const transaction = await CompanyTransaction.findOne({
        orderCode: payosOrderCodeFromWebhook.toString(), // Tìm bằng `orderCode` (đảm bảo là string)
      });

      // --- LOGGING BƯỚC 6 (webhook.js): Kết quả tìm kiếm transaction ---
      console.log('Found transaction (webhook.js):', transaction);

      if (!transaction) {
        console.log('Transaction not found for orderCode:', payosOrderCodeFromWebhook);
        return res.status(404).send('Transaction not found');
      }

      if (transaction.status === 'paid') {
        console.log('Transaction already paid, ignoring duplicate webhook.');
        return res.status(200).send('OK (Already paid)');
      }

      transaction.status = 'paid';
      transaction.paid_at = new Date();
      await transaction.save();
      console.log('Transaction updated (webhook.js):', transaction);

      const order = await Order.findById(transaction.orderId);
      if (order) {
        order.paymentStatus = 'paid';
        await order.save();
      }
    } else {
      console.log('Payment is not successful:', { code, success });
    }

    res.status(200).send('Ignored'); 
  } catch (error) {
    console.error('Webhook error (webhook.js route):', error);
    res.status(500).send('Webhook failed');
  }
});

module.exports = router;