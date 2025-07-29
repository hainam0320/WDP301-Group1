const express = require('express');
const router = express.Router();
const payos = require('../utils/payos.config');
const Order = require('../model/orderModel');
const CompanyTransaction = require('../model/companyTransisModel');

// Để lấy raw body
router.use(express.raw({ type: 'application/json' }));

router.post('/webhook', async (req, res) => {
  try {
    const rawBody = req.body;
    const checksumHeader = req.headers['x-checksum-hmac'];

    const isValid = payos.verifyPaymentWebhook(rawBody, checksumHeader);
    if (!isValid) return res.status(400).send('Invalid checksum');

    const data = JSON.parse(rawBody);
    const { orderCode, status } = data;

    if (status === 'PAID') {
      const transaction = await CompanyTransaction.findOne({ payos_payment_id: orderCode });
      if (!transaction) return res.status(404).send('Transaction not found');

      // Cập nhật transaction
      transaction.status = 'paid';
      transaction.paid_at = new Date();
      await transaction.save();

      // Cập nhật order
      const order = await Order.findById(transaction.orderId);
      order.status = 'paid';
      await order.save();

      return res.status(200).send('OK');
    }

    res.status(200).send('Ignored');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Webhook failed');
  }
});

module.exports = router;
