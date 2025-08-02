import React from 'react';
import { Link } from 'react-router-dom';

const PaymentSuccess = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#d1fae5'
    }}>
      <h1 style={{ fontSize: '2rem', color: '#047857', marginBottom: '1rem' }}>
        Thanh toán thành công!
      </h1>
      <p style={{ color: '#374151', marginBottom: '1.5rem' }}>
        Cảm ơn bạn đã sử dụng dịch vụ.
      </p>
      <Link to="/home" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
        Quay về trang chủ
      </Link>
    </div>
  );
};

export default PaymentSuccess;
