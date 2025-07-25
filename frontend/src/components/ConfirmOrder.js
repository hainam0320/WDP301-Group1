import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaShippingFast, FaMapMarkerAlt, FaRuler, FaMoneyBillWave, FaClock, FaArrowLeft } from 'react-icons/fa';
import Header from './Header'; // Added missing import for Header

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
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Vui lòng đăng nhập để đặt đơn hàng');
      }

      const payload = {
        userId: user._id,
        type: serviceType === 'delivery' ? 'delivery' : 'order',
        phone: user.phone,
        pickupaddress: orderData.pickupLocation,
        dropupaddress: orderData.deliveryLocation,
        timeStart: new Date().toISOString(),
        timeEnd: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        price: orderData.estimatedPrice,
        status: 'pending',
        distance_km: orderData.distance
      };

      console.log('Sending payload:', payload);
      
      const res = await axios.post('http://localhost:9999/api/orders', payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setSuccess('Đặt đơn hàng thành công!');
      
      // Delay navigation to show success message
      setTimeout(() => {
        navigate('/home', { state: { order: res.data } });
      }, 2000);
      
    } catch (err) {
      console.error('Error saving order:', err);
      if (err.response?.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(err.message || 'Lỗi khi lưu đơn hàng. Vui lòng thử lại.');
      }
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
                        Đang xử lý...
                      </>
                    ) : (
                      'Xác nhận và lưu'
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