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
    const orderCode = Date.now();

    // Tạo transaction cho admin
    const transaction = await CompanyTransaction.create({
      userId,
      orderId,
      amount,
      status: 'pending',
      orderCode: orderCode // Lưu orderCode để webhook có thể tìm
    });

    const returnUrl = `${process.env.DOMAIN_FE}/payment-success`;
    const cancelUrl = `${process.env.DOMAIN_FE}/payment-fail`;
    const notifyUrl = `${process.env.DOMAIN_BE}/api/payos/webhook`;

    const shortOrderId = order._id.toString().slice(-6); // Rút gọn cho phù hợp giới hạn mô tả
    const description = `Don hang #${shortOrderId}`; // Tối đa 25 ký tự

    const paymentPayload = {
      orderCode: orderCode,
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
    };
    console.log('PayOS payment payload:', paymentPayload);
    const paymentLinkRes = await payos.createPaymentLink(paymentPayload);

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
    console.log('=== PAYOS WEBHOOK RECEIVED ===');
    console.log('Webhook body:', req.body);
    
    const { code, success, data } = req.body;

    console.log('Code:', code);
    console.log('Success:', success);
    console.log('Data:', data);

    // Kiểm tra thanh toán thành công
    if (code === '00' && success === true) {
      console.log('Payment is successful, updating transaction and order...');
      
      // Tìm transaction bằng orderCode (ổn định hơn paymentLinkId)
      const transaction = await CompanyTransaction.findOne({ 
        orderCode: data.orderCode 
      });
      
      console.log('Found transaction:', transaction);

      if (!transaction) {
        console.log('Transaction not found for orderCode:', data.orderCode);
        return res.status(404).send('Transaction not found');
      }

      // Cập nhật transaction
      transaction.status = 'paid';
      transaction.paid_at = new Date();
      await transaction.save();
      console.log('Transaction updated:', transaction);

      // Cập nhật đơn hàng
      const order = await Order.findById(transaction.orderId);
      if (order) {
        console.log('Order before update:', order);
        order.paymentStatus = 'paid';
        await order.save();
        console.log('Order after update:', order);
      } else {
        console.log('Order not found for transaction.orderId:', transaction.orderId);
      }
    } else {
      console.log('Payment is not successful:', { code, success });
    }

    console.log('=== WEBHOOK PROCESSING COMPLETE ===');
    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).send('Server error');
  }
};
