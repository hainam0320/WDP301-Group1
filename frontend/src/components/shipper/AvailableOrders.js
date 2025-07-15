import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShippingFast, FaMapMarkerAlt, FaCheck, FaClock, FaUser, FaRoute, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import ShipperHeader from './ShipperHeader';
import { Modal, Button } from 'react-bootstrap';

const AvailableOrders = () => {
  const navigate = useNavigate();
  const [availableOrders, setAvailableOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState({ type: '', content: '' });
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [commissionMessage, setCommissionMessage] = useState('');
  const BASE_URL = 'http://localhost:9999';
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;

  const fetchAvailableOrders = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/shipper/available`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setAvailableOrders(response.data);
    } catch (err) {
      console.error('Error fetching available orders:', err);
      // Nếu bị chặn do hoa hồng quá hạn
      if (err.response && err.response.status === 403 && err.response.data?.message?.includes('hoa hồng')) {
        setCommissionMessage(err.response.data.message);
        setShowCommissionModal(true);
        return;
      }
      setError('Không thể tải danh sách đơn hàng khả dụng');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableOrders();

    const handleNewOrder = (event) => {
        console.log('Received new order event, refreshing list...');
        fetchAvailableOrders();
        // Optional: Add a more prominent sound or visual cue
        new Audio('/notification-sound.mp3').play().catch(e => console.log("Audio play failed:", e));
    };

    window.addEventListener('new_order_for_driver', handleNewOrder);

    return () => {
        window.removeEventListener('new_order_for_driver', handleNewOrder);
    };
  }, []); // The dependency array is empty, so fetchAvailableOrders is not recreated

  const acceptOrder = async (orderId) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(`${BASE_URL}/api/orders/${orderId}/accept`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setMessages({ type: 'success', content: 'Nhận đơn thành công!' });
      // Refresh the list after accepting
      fetchAvailableOrders();
    } catch (error) {
      console.error('Error accepting order:', error);
      if (error.response?.data?.message === 'Đơn hàng này đã được shipper khác nhận') {
        setMessages({ type: 'error', content: 'Đơn hàng này đã được shipper khác nhận' });
        fetchAvailableOrders();
      } else {
        setMessages({ 
          type: 'error', 
          content: error.response?.data?.message || 'Có lỗi xảy ra khi nhận đơn'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const cardStyle = {
    borderRadius: '15px',
    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
    border: 'none'
  };

  const buttonStyle = {
    borderRadius: '10px',
    padding: '12px 24px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease'
  };

  const totalPages = Math.ceil(availableOrders.length / ordersPerPage);
  const paginatedOrders = availableOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );

  return (
    <div className="min-vh-100" style={{backgroundColor: '#f5f7fa'}}>
      <ShipperHeader />
      {/* Modal cảnh báo hoa hồng quá hạn */}
      <Modal show={showCommissionModal} onHide={() => { setShowCommissionModal(false); navigate('/shipper/commissions'); }} centered>
        <Modal.Header closeButton className="bg-warning text-dark">
          <Modal.Title>Thanh toán hoa hồng quá hạn</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex align-items-center">
            <span className="me-3" style={{fontSize:'2rem'}}>&#9888;</span>
            <span>{commissionMessage || 'Bạn có đơn hoa hồng chưa thanh toán quá 3 ngày. Vui lòng thanh toán trước khi nhận đơn mới.'}</span>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="warning" onClick={() => { setShowCommissionModal(false); navigate('/shipper/commissions'); }}>
            Đi đến trang thanh toán hoa hồng
          </Button>
        </Modal.Footer>
      </Modal>
      <div className="container my-5">
        <button 
          className="btn btn-outline-primary mb-4"
          onClick={() => navigate('/shipper')}
        >
          <FaArrowLeft className="me-2" />
          Quay lại
        </button>

        <div className="card" style={cardStyle}>
          <div className="card-header bg-success text-white">
            <h4 className="mb-0"><FaShippingFast className="me-2" />Đơn hàng khả dụng</h4>
          </div>
          <div className="card-body">
            {messages.content && (
              <div className={`alert alert-${messages.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`} role="alert">
                {messages.content}
                <button type="button" className="btn-close" onClick={() => setMessages({ type: '', content: '' })}></button>
              </div>
            )}
            {isLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Đang tải...</span>
                </div>
              </div>
            ) : error ? (
              <div className="alert alert-danger">{error}</div>
            ) : availableOrders.length === 0 ? (
              <div className="text-center text-muted py-4">
                <FaClock size={50} className="mb-3" />
                <p>Hiện tại không có đơn hàng khả dụng</p>
              </div>
            ) : (
              paginatedOrders.map(order => (
                <div key={order._id} className="card mb-3">
                  <div className="card-body">
                    <div className="row align-items-center">
                      <div className="col-md-8">
                        <h6 className="fw-bold">
                          {order.type === 'delivery' ? 'Giao hàng' : 'Đưa đón'} #{order._id.slice(-6)}
                        </h6>
                        <p className="mb-1">
                          <FaMapMarkerAlt className="text-success me-2" />
                          <strong>Từ:</strong> {order.pickupaddress}
                        </p>
                        <p className="mb-1">
                          <FaMapMarkerAlt className="text-danger me-2" />
                          <strong>Đến:</strong> {order.dropupaddress}
                        </p>
                        <p className="mb-1">
                          <FaRoute className="text-info me-2" />
                          <strong>Khoảng cách:</strong> {order.distance_km ? `${order.distance_km.toFixed(1)} km` : 'N/A'}
                        </p>
                        {order.type === 'delivery' && order.weight && (
                          <p className="mb-1">
                            <strong>Khối lượng:</strong> {order.weight} kg
                          </p>
                        )}
                        <p className="mb-1">
                          <FaUser className="text-primary me-2" />
                          <strong>KH:</strong> {order.userId?.phone || order.phone}
                        </p>
                      </div>
                      <div className="col-md-4 text-end">
                        <h5 className="text-success fw-bold">{order.price.toLocaleString()} VNĐ</h5>
                        <button 
                          className="btn btn-success"
                          onClick={() => acceptOrder(order._id)}
                          style={buttonStyle}
                        >
                          <FaCheck className="me-2" />
                          Nhận đơn
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            {/* Pagination controls */}
            {totalPages > 1 && (
              <nav>
                <ul className="pagination justify-content-center mt-4">
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
      </div>
    </div>
  );
};

export default AvailableOrders; 