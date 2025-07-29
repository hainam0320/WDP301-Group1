import React from 'react';
import { useLocation, Link } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const PaymentSuccess = () => {
  const query = useQuery();
  const orderId = query.get('orderId');
  return (
    <div className="container text-center mt-5">
      <h1 className="text-success">Thanh toán thành công!</h1>
      <p>Mã đơn hàng: <b>{orderId}</b></p>
      <p>Đơn hàng của bạn đã được thanh toán và đang chờ shipper nhận.</p>
      <p>Cảm ơn bạn đã sử dụng dịch vụ.</p>
      <div className="mt-4">
        <Link to="/home" className="btn btn-primary me-3">Về trang chủ</Link>
        <Link to="/order-tracking" className="btn btn-info">Theo dõi đơn hàng</Link>
      </div>
    </div>
  );
};

export default PaymentSuccess; 