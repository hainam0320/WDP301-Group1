import React from 'react';
import { useLocation, Link } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const PaymentFail = () => {
  const query = useQuery();
  const orderId = query.get('orderId');
  return (
    <div className="container text-center mt-5">
      <h1 className="text-danger">Thanh toán thất bại!</h1>
      <p>Mã đơn hàng: <b>{orderId}</b></p>
      <p>Đơn hàng đã được hủy do thanh toán thất bại.</p>
      <p>Vui lòng đặt đơn hàng mới nếu bạn muốn tiếp tục sử dụng dịch vụ.</p>
      <div className="mt-4">
        <Link to="/new-order" className="btn btn-primary me-3">Đặt đơn mới</Link>
        <Link to="/home" className="btn btn-secondary">Về trang chủ</Link>
      </div>
    </div>
  );
};

export default PaymentFail; 