import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaShippingFast, FaMapMarkerAlt, FaRuler, FaMoneyBillWave, FaClock, FaArrowLeft } from 'react-icons/fa';
import Header from './Header';
import { userAPI, transactionAPI } from '../services/api'; // Import transactionAPI

const ConfirmOrder = () => {
  const { state } = useLocation();
  const { orderData, serviceType } = state || {};
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!orderData) {
    return <p>Không có dữ liệu đơn hàng.</p>;
  }

  const handleConfirm = async () => {
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!user || !localStorage.getItem('token')) {
        throw new Error('Vui lòng đăng nhập để đặt đơn hàng.');
      }

      const payload = {
        userId: user._id,
        type: serviceType === 'delivery' ? 'delivery' : 'order',
        phone: user.phone, // Lấy từ user profile
        pickupaddress: orderData.pickupLocation,
        dropupaddress: orderData.deliveryLocation,
        timeStart: new Date().toISOString(),
        timeEnd: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // Thời gian ước tính
        price: orderData.estimatedPrice,
        distance_km: orderData.distance,
        // Thêm thông tin hàng hóa nếu là đơn giao hàng
        ...(serviceType === 'delivery' && {
            itemType: orderData.itemType,
            weight_kg: orderData.weight,
            dimensions: orderData.dimensions
        })
      };

      console.log('Creating order with payload:', payload);
      
      // Bước 1: Tạo đơn hàng với trạng thái 'pending_payment'
      const orderResponse = await userAPI.createOrder(payload);
      const createdOrder = orderResponse.data;

      if (!createdOrder || !createdOrder._id) {
          throw new Error('Không thể tạo đơn hàng. Vui lòng thử lại.');
      }
      
      setSuccess('Đơn hàng đã được tạo. Chuyển đến trang thanh toán...');

      // Bước 2: Gọi API VNPAY để tạo thanh toán
      const paymentPayload = {
          orderId: createdOrder._id,
          amount: createdOrder.price,
          orderInfo: `Thanh toan don hang ${createdOrder._id}`,
          bankCode: 'NCB' // Có thể cho phép người dùng chọn bankCode hoặc để trống
      };

      console.log('Initiating VNPAY payment with payload:', paymentPayload);
      const vnpayResponse = await transactionAPI.createVnPayPayment(paymentPayload);
      
      if (vnpayResponse.data && vnpayResponse.data.vnpUrl) {
          // Chuyển hướng người dùng đến cổng thanh toán VNPAY
          window.location.href = vnpayResponse.data.vnpUrl;
      } else {
          throw new Error('Không nhận được URL thanh toán từ VNPAY.');
      }
      
    } catch (err) {
      console.error('Lỗi khi xử lý đặt đơn hàng hoặc thanh toán:', err);
      let errorMessage = 'Lỗi khi đặt đơn hàng hoặc thanh toán. Vui lòng thử lại.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);

      // Nếu có lỗi, có thể muốn hủy đơn hàng đã tạo ở backend
      // (cần thêm API để hủy đơn hàng nếu thanh toán thất bại)

      // Delay để người dùng đọc thông báo lỗi
      setTimeout(() => {
        setError(''); // Xóa lỗi sau một khoảng thời gian
      }, 5000);
      
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-vh-100 confirmorder-bg">
      <Header />
      <style>{`
        .confirmorder-bg {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
        }
        .confirmorder-card {
          border-radius: 18px;
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.12);
          border: none;
          background: rgba(255,255,255,0.97);
        }
        .confirmorder-card .card-header {
          border-radius: 18px 18px 0 0;
          background: linear-gradient(90deg, #6a82fb 0%, #fc5c7d 100%);
          color: #fff;
        }
        .confirmorder-card .card-body {
          padding: 2.5rem 1.5rem;
        }
        .confirmorder-btn-lg {
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 12px;
          padding: 0.9rem 1.5rem;
          box-shadow: 0 2px 8px rgba(31,38,135,0.08);
          transition: background 0.2s, color 0.2s, transform 0.2s;
        }
        .confirmorder-btn-lg:active, .confirmorder-btn-lg:focus {
          outline: none;
          box-shadow: 0 0 0 2px #6a82fb33;
        }
        .confirmorder-btn-lg.btn-primary {
          background: linear-gradient(90deg, #6a82fb 0%, #fc5c7d 100%);
          border: none;
        }
        .confirmorder-btn-lg.btn-primary:hover {
          background: linear-gradient(90deg, #fc5c7d 0%, #6a82fb 100%);
          color: #fff;
          transform: scale(1.04);
        }
        .confirmorder-btn-lg.btn-outline-danger {
          border: 2px solid #dc3545;
          color: #dc3545;
          background: #fff;
        }
        .confirmorder-btn-lg.btn-outline-danger:hover {
          background: #dc3545;
          color: #fff;
          border: none;
          transform: scale(1.04);
        }
        .confirmorder-card .rounded-circle {
          box-shadow: 0 2px 8px rgba(31,38,135,0.10);
        }
        @media (max-width: 768px) {
          .confirmorder-card .card-body {
            padding: 1.2rem 0.5rem;
          }
        }
      `}</style>
      <div className="container my-5">
        <button 
          className="btn btn-outline-primary mb-4 confirmorder-btn-lg"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft className="me-2" />
          Quay lại
        </button>
        <div className="card confirmorder-card">
          <div className="card-header">
            <h4 className="mb-0"><FaShippingFast className="me-2" />Xác nhận đơn hàng</h4>
          </div>
          <div className="card-body">
              <div className="order-summary">
                <div className="service-type mb-4 p-3 bg-light rounded">
                  <h5 className="text-primary mb-3">
                    <FaShippingFast className="me-2" />
                    Loại dịch vụ
                  </h5>
                  <p className="mb-0 fs-5">
                    {serviceType === 'delivery' ? 'Giao hàng' : 'Đặt xe'}
                  </p>
                </div>

                <div className="locations mb-4">
                  <div className="pickup p-3 bg-light rounded mb-3">
                    <h5 className="text-primary mb-3">
                      <FaMapMarkerAlt className="me-2" />
                      Địa chỉ đón
                    </h5>
                    <p className="mb-0">{orderData.pickupLocation}</p>
                  </div>
                  <div className="delivery p-3 bg-light rounded">
                    <h5 className="text-primary mb-3">
                      <FaMapMarkerAlt className="me-2" />
                      Địa chỉ giao
                    </h5>
                    <p className="mb-0">{orderData.deliveryLocation}</p>
                  </div>
                </div>

                {serviceType === 'delivery' && (
                    <div className="item-details mb-4">
                        <div className="p-3 bg-light rounded">
                            <h5 className="text-primary mb-3">Thông tin hàng hóa</h5>
                            <p className="mb-1"><strong>Loại hàng:</strong> {orderData.itemType}</p>
                            <p className="mb-1"><strong>Cân nặng:</strong> {orderData.weight} kg</p>
                            <p className="mb-0"><strong>Kích thước:</strong> {orderData.dimensions}</p>
                        </div>
                    </div>
                )}

                <div className="details row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded h-100">
                      <h5 className="text-primary mb-3">
                        <FaRuler className="me-2" />
                        Khoảng cách
                      </h5>
                      <p className="mb-0 fs-5">{orderData.distance.toFixed(1)} km</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded h-100">
                      <h5 className="text-primary mb-3">
                        <FaMoneyBillWave className="me-2" />
                        Giá tạm tính
                      </h5>
                      <p className="mb-0 fs-5">{orderData.estimatedPrice.toLocaleString()} VNĐ</p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="alert alert-success" role="alert">
                    {success}
                  </div>
                )}

                <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
                  <button 
                    className="btn btn-secondary px-4 confirmorder-btn-lg"
                    onClick={() => navigate(-1)}
                    disabled={submitting}
                  >
                    Quay lại
                  </button>
                  <button 
                    className="btn btn-primary px-4 confirmorder-btn-lg"
                    onClick={handleConfirm}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Đang chuyển hướng thanh toán...
                      </>
                    ) : (
                      'Xác nhận và Thanh toán'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default ConfirmOrder;