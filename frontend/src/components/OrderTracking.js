import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaUser, FaPhone, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
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

  const fetchOrders = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/orders`, {
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

  return (
    <div className="min-vh-100" style={{backgroundColor: '#f5f7fa'}}>
      <Header />
      <div className="container my-5">
        <button 
          className="btn btn-outline-primary mb-4"
          onClick={() => navigate('/home')}
        >
          <FaArrowLeft className="me-2" />
          Quay lại
        </button>
        <div className="card">
          <div className="card-header bg-primary text-white">
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
            ) : orders.length === 0 ? (
              <div className="alert alert-info">Không có đơn hàng nào</div>
            ) : (
              orders.filter(order => order.status !== 'completed').map(order => (
                <div key={order._id} className="card mb-3">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="fw-bold mb-2">Đơn hàng #{order._id.slice(-6)}</h6>
                        <p className="mb-1"><strong>Từ:</strong> {order.pickupaddress}</p>
                        <p className="mb-1"><strong>Đến:</strong> {order.dropupaddress}</p>
                        <p className="mb-1"><strong>Loại:</strong> {order.type === 'delivery' ? 'Giao hàng' : 'Đưa đón'}</p>
                        {order.status !== 'pending' && order.driverId && (
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
                          order.status === 'pending' ? 'bg-warning' : 
                          order.status === 'accepted' ? 'bg-info' :
                          order.status === 'in-progress' ? 'bg-primary' : 
                          order.status === 'completed' ? 'bg-success' : 'bg-secondary'
                        } mb-2`}>
                          {order.status === 'pending' ? 'Chờ xử lý' : 
                           order.status === 'accepted' ? 'Đã nhận đơn' :
                           order.status === 'in-progress' ? 'Đang giao' : 
                           order.status === 'completed' ? 'Đã giao hàng' : 'Không xác định'}
                        </span>
                        <div className="fw-bold text-primary">{order.price.toLocaleString()} VNĐ</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
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
                <img 
                  src={getImageUrl(shipperDetail.avatar)}
                  alt="Avatar" 
                  className="rounded-circle img-thumbnail"
                  style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/100';
                  }}
                />
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