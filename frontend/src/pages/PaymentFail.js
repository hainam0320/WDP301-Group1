import React from 'react';
import { Link } from 'react-router-dom';

const PaymentFail = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#fee2e2'
    }}>
      <h1 style={{ fontSize: '2rem', color: '#b91c1c', marginBottom: '1rem' }}>
        Thanh toán thất bại!
      </h1>
      <p style={{ color: '#374151', marginBottom: '1.5rem' }}>
        Vui lòng thử lại hoặc kiểm tra lại đơn hàng.
      </p>
      <Link to="/home" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
        Quay về trang chủ
      </Link>
    </div>
  );
};

export default PaymentFail;
