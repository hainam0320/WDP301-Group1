import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaUser, FaPhone, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import { Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Header from './Header';

const OrderTracking = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showShipperModal, setShowShipperModal] = useState(false);
  const [shipperDetail, setShipperDetail] = useState(null);
  const [shipperAvgRate, setShipperAvgRate] = useState({ avg: 0, count: 0 });
  const BASE_URL = 'http://localhost:9999';
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 3;

  const fetchOrders = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/orders/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setOrders(response.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Không thể tải danh sách đơn hàng');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // Refresh mỗi 30 giây
    return () => clearInterval(interval);
  }, []);

  const handleShowShipperDetail = async (driver) => {
    setShipperDetail({
      fullName: driver.fullName || '',
      phone: driver.phone || '',
      avatar: driver.avatar || '',
      licensePlateImage: driver.licensePlateImage || ''
    });
    setShowShipperModal(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/rate/driver/${driver._id}/average`);
      setShipperAvgRate(res.data);
    } catch {
      setShipperAvgRate({ avg: 0, count: 0 });
    }
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    
    if (path.startsWith('uploads/')) {
      return `${BASE_URL}/${path}`;
    }
    
    const relativePath = path.split('\\uploads\\')[1];
    if (relativePath) {
      return `${BASE_URL}/uploads/${relativePath}`;
    }
    
    return null;
  };

  const cardStyle = {
    borderRadius: '15px',
    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
    border: 'none'
  };

  const trackingOrders = orders
  .filter(order => 
    order.status !== 'user_confirmed_completion' && 
    order.status !== 'failed' && 
    order.status !== 'refunded'
  )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const totalPages = Math.ceil(trackingOrders.length / ordersPerPage);
  const paginatedOrders = trackingOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );

  return (
    <div className="min-vh-100 ordertracking-bg">
      <Header />
      <style>{`
        .ordertracking-bg {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
        }
        .ordertracking-card {
          border-radius: 18px;
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.12);
          border: none;
          background: rgba(255,255,255,0.97);
        }
        .ordertracking-card .card-header {
          border-radius: 18px 18px 0 0;
          background: linear-gradient(90deg, #6a82fb 0%, #fc5c7d 100%);
          color: #fff;
        }
        .ordertracking-card .card-body {
          padding: 2.5rem 1.5rem;
        }
        .ordertracking-btn-lg {
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 12px;
          padding: 0.9rem 1.5rem;
          box-shadow: 0 2px 8px rgba(31,38,135,0.08);
          transition: background 0.2s, color 0.2s, transform 0.2s;
        }
        .ordertracking-btn-lg:active, .ordertracking-btn-lg:focus {
          outline: none;
          box-shadow: 0 0 0 2px #6a82fb33;
        }
        .ordertracking-btn-lg.btn-outline-primary {
          border: 2px solid #6a82fb;
          color: #6a82fb;
          background: #fff;
        }
        .ordertracking-btn-lg.btn-outline-primary:hover {
          background: linear-gradient(90deg, #6a82fb 0%, #fc5c7d 100%);
          color: #fff;
          border: none;
          transform: scale(1.04);
        }
        .ordertracking-card .card {
          border-radius: 14px;
          box-shadow: 0 2px 8px rgba(31,38,135,0.07);
        }
        .ordertracking-card .card:hover {
          box-shadow: 0 4px 16px rgba(31,38,135,0.13);
          transform: translateY(-2px) scale(1.01);
        }
        @media (max-width: 768px) {
          .ordertracking-card .card-body {
            padding: 1.2rem 0.5rem;
          }
        }
      `}</style>
      <div className="container my-5">
        <button 
          className="btn btn-outline-primary mb-4 ordertracking-btn-lg"
          onClick={() => navigate('/home')}
        >
          <FaArrowLeft className="me-2" />
          Quay lại
        </button>
        <div className="card ordertracking-card">
          <div className="card-header">
            <h4 className="mb-0"><FaMapMarkerAlt className="me-2" />Theo dõi đơn hàng</h4>
          </div>
          <div className="card-body">
            {isLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Đang tải...</span>
                </div>
              </div>
            ) : error ? (
              <div className="alert alert-danger">{error}</div>
            ) : trackingOrders.length === 0 ? (
              <div className="alert alert-info">Không có đơn hàng nào</div>
            ) : (
              paginatedOrders.map(order => (
                <div key={order._id} className="card mb-3">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="fw-bold mb-2">Đơn hàng #{order._id.slice(-6)}</h6>
                        <p className="mb-1"><strong>Từ:</strong> {order.pickupaddress}</p>
                        <p className="mb-1"><strong>Đến:</strong> {order.dropupaddress}</p>
                        <p className="mb-1"><strong>Loại:</strong> {order.type === 'delivery' ? 'Giao hàng' : 'Đưa đón'}</p>
                        {order.driverId && (
                          <div className="mb-2 p-2 bg-light rounded">
                            <p className="mb-1">
                              <FaUser className="text-primary me-2" />
                              <strong>Shipper:</strong>{' '}
                              <span
                                style={{ cursor: 'pointer', color: '#007bff', textDecoration: 'underline' }}
                                onClick={() => handleShowShipperDetail(order.driverId)}
                              >
                                {order.driverId.fullName}
                              </span>
                            </p>
                            <p className="mb-0">
                              <FaPhone className="text-success me-2" />
                              <strong>Liên hệ:</strong> {order.driverId.phone || 'Chưa có thông tin'}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="text-end">
                        <span className={`badge ${
                          order.status === 'pending_payment' ? 'bg-warning' :
                          order.status === 'payment_successful' ? 'bg-info' :
                          order.status === 'accepted' ? 'bg-primary' :
                          order.status === 'in_progress' ? 'bg-warning' : 
                          order.status === 'shipper_completed' ? 'bg-info' :
                          order.status === 'user_confirmed_completion' ? 'bg-success' :
                          order.status === 'disputed' ? 'bg-warning' :
                          order.status === 'refunded' ? 'bg-secondary' :
                          order.status === 'failed' ? 'bg-danger' : 'bg-secondary'
                        } mb-2`}>
                          {order.status === 'pending_payment' ? 'Chờ thanh toán' : 
                           order.status === 'payment_successful' ? 'Chờ xử lý' :
                           order.status === 'accepted' ? 'Đã nhận đơn' :
                           order.status === 'in_progress' ? 'Đang giao' : 
                           order.status === 'shipper_completed' ? 'Shipper hoàn thành' :
                           order.status === 'user_confirmed_completion' ? 'Đã hoàn tất' :
                           order.status === 'disputed' ? 'Tranh chấp' :
                           order.status === 'refunded' ? 'Đã hoàn tiền' :
                           order.status === 'failed' ? 'Thất bại' : order.status}
                        </span>
                        <div className="fw-bold text-primary">{order.price.toLocaleString()} VNĐ</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            {totalPages > 1 && (
              <nav>
                <ul className="pagination justify-content-center mt-3">
                  <li className={`page-item${currentPage === 1 ? ' disabled' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
                      Trước
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, idx) => (
                    <li key={idx} className={`page-item${currentPage === idx + 1 ? ' active' : ''}`}>
                      <button className="page-link" onClick={() => setCurrentPage(idx + 1)}>
                        {idx + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item${currentPage === totalPages ? ' disabled' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
                      Sau
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        </div>

        {/* Modal thông tin Shipper */}
        <Modal show={showShipperModal} onHide={() => setShowShipperModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Thông tin Shipper</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {shipperDetail && (
              <div className="text-center">
               
                <h5>{shipperDetail.fullName}</h5>
                <div className="d-flex justify-content-center align-items-center mb-2">
                  <span className="fw-bold">{shipperAvgRate.avg.toFixed(1)}</span>
                  <span className="text-muted ms-2">({shipperAvgRate.count} lượt đánh giá)</span>
                </div>
                <p><FaPhone className="me-2" />{shipperDetail.phone}</p>
                {shipperDetail.licensePlateImage && (
                  <div>
                    <strong>Ảnh biển số xe:</strong>
                    <img
                      src={getImageUrl(shipperDetail.licensePlateImage)}
                      alt="Biển số xe"
                      className="img-thumbnail mt-2"
                      style={{ maxHeight: 120, maxWidth: 200, objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/200x120?text=No+Image';
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </Modal.Body>
        </Modal>
      </div>
    </div>
  );
};

export default OrderTracking; 