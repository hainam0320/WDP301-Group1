const payos = require('../utils/payos.config');
const Order = require('../model/orderModel');
const CompanyTransaction = require('../model/companyTransisModel');

exports.createPayOSPaymentLink = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Chỉ cho phép thanh toán khi đơn đã hoàn thành
    if (order.status !== 'completed') {
      return res.status(400).json({ message: 'Chỉ thanh toán khi đơn đã hoàn thành' });
    }

    const amount = order.price;
    const userId = req.user._id;

    // Tạo transaction cho admin
    const transaction = await CompanyTransaction.create({
      userId,
      orderId,
      amount,
      status: 'pending'
    });

    const returnUrl = `${process.env.DOMAIN_FE}/payment-success`;
    const cancelUrl = `${process.env.DOMAIN_FE}/payment-fail`;
    const notifyUrl = `${process.env.DOMAIN_BE}/api/payos/webhook`;

    const shortOrderId = order._id.toString().slice(-6); // Rút gọn cho phù hợp giới hạn mô tả
    const description = `Don hang #${shortOrderId}`; // Tối đa 25 ký tự

    const paymentLinkRes = await payos.createPaymentLink({
      orderCode: Date.now(),
      amount,
      description,
      returnUrl,
      cancelUrl,
      notifyUrl,
      buyerName: req.user.fullName || 'Khách hàng',
      buyerEmail: req.user.email || 'test@example.com',
      buyerPhone: order.phone || '0900000000',
      items: [
        {
          name: `Đơn hàng #${shortOrderId}`,
          quantity: 1,
          price: amount
        }
      ]
    });

    transaction.payos_payment_id = paymentLinkRes.paymentId;
    await transaction.save();

    res.json({
      paymentUrl: paymentLinkRes.checkoutUrl
    });
  } catch (err) {
    console.error('Error creating PayOS link:', err);
    res.status(500).json({ message: 'Failed to create payment link' });
  }
};

exports.payosWebhook = async (req, res) => {
  try {
    const { paymentId, status } = req.body;

    const transaction = await CompanyTransaction.findOne({ payos_payment_id: paymentId });
    if (!transaction) return res.status(404).send('Not found');

    if (status === 'PAID') {
      transaction.status = 'paid';
      transaction.paid_at = new Date();
      await transaction.save();

      // Cập nhật đơn hàng nếu cần
      const order = await Order.findById(transaction.orderId);
      if (order) {
        order.status = 'paid';
        await order.save();
      }
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).send('Server error');
  }
};
