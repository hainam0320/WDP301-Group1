// utils/payment.js
import axios from 'axios';

export const createPayOSLink = async (orderId) => {
  const token = localStorage.getItem('token'); // 👈 lấy token từ localStorage

  const res = await axios.post(
    'http://localhost:9999/api/payos/create-payment',
    { orderId },
    {
      headers: {
        Authorization: `Bearer ${token}` // 👈 sử dụng token thật
      }
    }
  );
  return res.data.paymentUrl;
};
