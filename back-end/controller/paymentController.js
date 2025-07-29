    // back-end/controller/paymentController.js
    const Order = require('../model/orderModel');
    const CompanyTransaction = require('../model/companyTransisModel');
    const crypto = require('crypto');
    const moment = require('moment'); // Cần cài đặt 'moment' hoặc sử dụng Date objects
    const qs = require('qs'); // Cần cài đặt 'qs'

    // Cấu hình VNPAY từ .env
    const vnp_TmnCode = process.env.VNP_TMNCODE;
    const vnp_HashSecret = process.env.VNP_HASHSECRET;
    const vnp_Url = process.env.VNP_URL;
    const vnp_ReturnUrl = process.env.VNP_RETURNURL; // URL callback của bạn

    exports.createVnPayPayment = async (req, res) => {
        try {
            const { orderId, amount, bankCode, orderInfo } = req.body;

            if (!orderId || !amount) {
                return res.status(400).json({ message: 'Thiếu thông tin đơn hàng hoặc số tiền.' });
            }

            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
            }

            if (order.status !== 'pending_payment' && order.paymentStatus !== 'unpaid') {
                return res.status(400).json({ message: 'Đơn hàng không ở trạng thái chờ thanh toán.' });
            }

            // Tạo transaction record cho số tiền đang được giữ
            const companyTransaction = new CompanyTransaction({
                userId: order.userId,
                orderId: order._id,
                amount: amount,
                status: 'held', // Tiền user thanh toán đang được hệ thống giữ
                type: 'user_payment_held',
                payment_method: 'vnpay',
                remarks: `Thanh toán cho đơn hàng ${order._id}`
            });
            await companyTransaction.save();

            // Cập nhật trạng thái đơn hàng
            order.paymentStatus = 'unpaid'; // Vẫn là unpaid cho đến khi VNPAY callback
            // order.vnpayTransactionId = companyTransaction._id; // Lưu ID của giao dịch nội bộ
            await order.save();

            // VNPAY Payment Logic
            const date = new Date();
            const createDate = moment(date).format('YYYYMMDDHHmmss');
            const orderIdVnpay = companyTransaction._id.toString(); // Sử dụng ID transaction nội bộ
            const ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;

            let vnpUrl = vnp_Url;
            const currCode = 'VND';
            let vnp_Params = {};
            vnp_Params['vnp_Version'] = '2.1.0';
            vnp_Params['vnp_Command'] = 'pay';
            vnp_Params['vnp_TmnCode'] = vnp_TmnCode;
            vnp_Params['vnp_Locale'] = 'vn';
            vnp_Params['vnp_CurrCode'] = currCode;
            vnp_Params['vnp_TxnRef'] = orderIdVnpay; // Mã tham chiếu của giao dịch tại hệ thống của bạn
            vnp_Params['vnp_OrderInfo'] = orderInfo || `Thanh toan don hang ${order._id}`;
            vnp_Params['vnp_OrderType'] = 'other';
            vnp_Params['vnp_Amount'] = amount * 100; // Số tiền * 100
            vnp_Params['vnp_ReturnUrl'] = vnp_ReturnUrl;
            vnp_Params['vnp_IpAddr'] = ipAddr;
            vnp_Params['vnp_CreateDate'] = createDate;
            if (bankCode !== null && bankCode !== '') {
                vnp_Params['vnp_BankCode'] = bankCode;
            }

            vnp_Params = sortObject(vnp_Params);
            
            const signData = qs.stringify(vnp_Params, { encode: false });
            const hmac = crypto.createHmac('sha512', vnp_HashSecret);
            const vnp_SecureHash = hmac.update(signData).digest('hex');
            vnp_Params['vnp_SecureHash'] = vnp_SecureHash;
            vnpUrl += '?' + qs.stringify(vnp_Params, { encode: false });

            res.status(200).json({
                message: 'Tạo thanh toán VNPAY thành công',
                vnpUrl: vnpUrl,
                companyTransactionId: companyTransaction._id // Trả về ID của transaction nội bộ
            });

        } catch (error) {
            console.error('Error creating VNPAY payment:', error);
            res.status(500).json({ message: 'Lỗi server khi tạo thanh toán VNPAY', error: error.message });
        }
    };

    exports.vnpayReturn = async (req, res) => {
        try {
            let vnp_Params = req.query;
            let secureHash = vnp_Params['vnp_SecureHash'];

            delete vnp_Params['vnp_SecureHash'];
            delete vnp_Params['vnp_HashType'];

            vnp_Params = sortObject(vnp_Params);

            const signData = qs.stringify(vnp_Params, { encode: false });
            const hmac = crypto.createHmac('sha512', vnp_HashSecret);
            const signed = hmac.update(signData).digest('hex');

            // Lấy thông tin từ VNPAY response
            const rspCode = vnp_Params['vnp_ResponseCode'];
            const txnRef = vnp_Params['vnp_TxnRef']; // Đây là companyTransactionId của bạn
            const amount = vnp_Params['vnp_Amount'] / 100;
            const vnpTransactionNo = vnp_Params['vnp_TransactionNo']; // Mã giao dịch của VNPAY

            const companyTransaction = await CompanyTransaction.findById(txnRef);

            if (!companyTransaction) {
                console.error('VNPAY Callback: Transaction not found for TxnRef', txnRef);
                return res.status(404).json({ RspCode: '01', Message: 'Transaction not found' });
            }

            const order = await Order.findById(companyTransaction.orderId);
            if (!order) {
                console.error('VNPAY Callback: Order not found for orderId', companyTransaction.orderId);
                return res.status(404).json({ RspCode: '01', Message: 'Order not found' });
            }

            if (secureHash === signed) {
                // Kiểm tra trạng thái đơn hàng tránh xử lý trùng lặp
                if (order.paymentStatus === 'paid' && rspCode === '00') {
                    // Thay vì trả JSON, redirect về trang thành công
                    return res.redirect(`${process.env.FRONTEND_URL}/payment/success?orderId=${order._id}`);
                }

                // Cập nhật trạng thái giao dịch và đơn hàng
                if (rspCode === '00') {
                    // Giao dịch thành công - Lưu thông tin
                    companyTransaction.status = 'held'; // Tiền vẫn nằm trong hệ thống
                    companyTransaction.payment_method = 'vnpay';
                    companyTransaction.transactionRefId = vnpTransactionNo; // Lưu ID của VNPAY
                    companyTransaction.processed_at = new Date();
                    companyTransaction.type = 'user_payment_held'; // Khẳng định lại loại giao dịch
                    await companyTransaction.save();

                    order.paymentStatus = 'paid'; // Đã thanh toán
                    order.status = 'payment_successful'; // Tiền đã được giữ, chờ shipper
                    order.vnpayTransactionId = vnpTransactionNo; // Lưu ID giao dịch VNPAY vào order
                    await order.save();

                    console.log('Order status updated after successful payment:', {
                        orderId: order._id,
                        status: order.status,
                        paymentStatus: order.paymentStatus
                    });
                    
                    // Thông báo cho shipper có đơn mới
                    const { io, connectedUsers } = req;
                    if (connectedUsers && connectedUsers.driver) {
                        const driverSockets = Object.values(connectedUsers.driver);
                        driverSockets.forEach(socketId => {
                            io.to(socketId).emit('new_order_available', {
                                title: 'Có đơn hàng mới đã thanh toán!',
                                message: `Đơn hàng #${order._id.slice(-6)} đã được thanh toán, sẵn sàng nhận.`,
                                order: order,
                            });
                        });
                    }
                    
                    // Thay vì trả JSON, redirect về trang thành công
                    return res.redirect(`${process.env.FRONTEND_URL}/payment/success?orderId=${order._id}`);

                } else {
                    // Giao dịch thất bại - Xóa transaction và đơn hàng hoàn toàn
                    console.log('Payment failed, deleting transaction and order completely:', {
                        orderId: order._id,
                        rspCode: rspCode,
                        transactionId: companyTransaction._id
                    });
                    
                    // Xóa transaction thất bại
                    await CompanyTransaction.findByIdAndDelete(companyTransaction._id);
                    
                    // Xóa đơn hàng thất bại hoàn toàn
                    await Order.findByIdAndDelete(order._id);
                    
                    // Thay vì trả JSON, redirect về trang thất bại
                    return res.redirect(`${process.env.FRONTEND_URL}/payment/fail?orderId=${order._id}`);
                }
            } else {
                console.error('VNPAY Callback: Invalid SecureHash');
                // Hash không hợp lệ - Xóa transaction và đơn hàng hoàn toàn
                console.log('Invalid SecureHash, deleting transaction and order completely:', {
                    orderId: order._id,
                    transactionId: companyTransaction._id
                });
                
                // Xóa transaction
                await CompanyTransaction.findByIdAndDelete(companyTransaction._id);
                
                // Xóa đơn hàng hoàn toàn
                await Order.findByIdAndDelete(order._id);
                
                // Thay vì trả JSON, redirect về trang thất bại
                return res.redirect(`${process.env.FRONTEND_URL}/payment/fail?orderId=${order._id}`);
            }
        } catch (error) {
            console.error('Error in VNPAY return handler:', error);
            res.status(500).json({ RspCode: '99', Message: 'Unknown error', error: error.message });
        }
    };

    function sortObject(obj) {
        let sorted = {};
        let str = [];
        let key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                str.push(encodeURIComponent(key));
            }
        }
        str.sort();
        for (key = 0; key < str.length; key++) {
            sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
        }
        return sorted;
    }