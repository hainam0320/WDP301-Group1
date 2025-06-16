import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ConfirmOrder = () => {
  const { state } = useLocation();
  const { orderData, serviceType } = state || {};
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!orderData) {
    return <p>Không có dữ liệu đơn hàng.</p>;
  }

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const payload = {
        userId: orderData.userId,
        driverId: orderData.driverId,
        nameOrder: orderData.nameOrder,
        type: serviceType === 'delivery' ? 'delivery' : 'order',
        phone: orderData.phone,
        pickupaddress: orderData.pickupLocation.address,
        dropupaddress: orderData.deliveryLocation.address,
        timeStart: new Date().toISOString(),
        timeEnd: orderData.estimatedFinishTime,
        price: orderData.estimatedPrice,
        status: 'pending',
        distance_km: orderData.distance,
      };
  console.log(payload);
      
      const res = await axios.post('http://localhost:9999/api/orders', payload);
      navigate('/home', { state: { order: res.data } });
    } catch (err) {
      setError('Lỗi khi lưu đơn hàng. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mt-4">
      <h3>Xác nhận đơn hàng</h3>
      {/* hiển thị tóm tắt đơn hàng */}
      <ul className="list-group mb-4">
        <li className="list-group-item"><strong>Loại dịch vụ:</strong> {serviceType}</li>
        <li className="list-group-item"><strong>Địa chỉ đón:</strong> {orderData.pickupLocation.address}</li>
        <li className="list-group-item"><strong>Địa chỉ giao:</strong> {orderData.deliveryLocation.address}</li>
        <li className="list-group-item"><strong>Khoảng cách:</strong> {orderData.distance.toFixed(1)} km</li>
        <li className="list-group-item"><strong>Giá tạm tính:</strong> {orderData.estimatedPrice.toLocaleString()} VNĐ</li>
      </ul>
      {error && <div className="alert alert-danger">{error}</div>}
      <button className="btn btn-success" onClick={handleConfirm} disabled={submitting}>
        {submitting ? 'Đang gửi...' : 'Xác nhận và lưu'}
      </button>
      <button className="btn btn-secondary ms-2" onClick={() => navigate(-1)} disabled={submitting}>
        Quay lại
      </button>
    </div>
  );
};

export default ConfirmOrder;