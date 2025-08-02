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
  const [ongoingOrders, setOngoingOrders] = useState({ delivery: 0, ride: 0 });
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitMessage, setLimitMessage] = useState('');
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

  const fetchOngoingOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/shipper/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Lọc đơn hàng đang thực hiện (chưa hoàn thành và chưa thất bại)
      const activeOrders = response.data.filter(order => 
        order.status !== 'completed' && order.status !== 'failed'
      );
      
      // Đếm theo loại đơn hàng
      const deliveryCount = activeOrders.filter(order => order.type === 'delivery').length;
      const rideCount = activeOrders.filter(order => order.type === 'order').length;
      
      setOngoingOrders({ delivery: deliveryCount, ride: rideCount });
    } catch (error) {
      console.error('Error fetching ongoing orders:', error);
    }
  };

  useEffect(() => {
    fetchAvailableOrders();
    fetchOngoingOrders();

    const handleNewOrder = (event) => {
        console.log('Received new order event, refreshing list...');
        fetchAvailableOrders();
        fetchOngoingOrders();
        // Optional: Add a more prominent sound or visual cue
        new Audio('/notification-sound.mp3').play().catch(e => console.log("Audio play failed:", e));
    };

    window.addEventListener('new_order_for_driver', handleNewOrder);

    return () => {
        window.removeEventListener('new_order_for_driver', handleNewOrder);
    };
  }, []); // The dependency array is empty, so fetchAvailableOrders is not recreated

  const acceptOrder = async (orderId, orderType) => {
    // Kiểm tra giới hạn số lượng đơn hàng
    const maxDelivery = 3;
    const maxRide = 1;
    
    if (orderType === 'delivery' && ongoingOrders.delivery >= maxDelivery) {
      setLimitMessage(`Bạn đã nhận tối đa ${maxDelivery} đơn giao hàng. Vui lòng hoàn thành một số đơn trước khi nhận thêm.`);
      setShowLimitModal(true);
      return;
    }
    
    if (orderType === 'order' && ongoingOrders.ride >= maxRide) {
      setLimitMessage(`Bạn đã nhận tối đa ${maxRide} đơn đưa đón. Vui lòng hoàn thành đơn hiện tại trước khi nhận thêm.`);
      setShowLimitModal(true);
      return;
    }

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
      fetchOngoingOrders();
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

      {/* Modal cảnh báo giới hạn đơn hàng */}
      <Modal show={showLimitModal} onHide={() => setShowLimitModal(false)} centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>Giới hạn đơn hàng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex align-items-center">
            <span className="me-3" style={{fontSize:'2rem'}}>&#9888;</span>
            <span>{limitMessage}</span>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLimitModal(false)}>
            Đóng
          </Button>
          <Button variant="primary" onClick={() => { setShowLimitModal(false); navigate('/shipper/my-orders'); }}>
            Xem đơn hàng của tôi
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

        {/* Hiển thị thông tin đơn hàng đang thực hiện */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card bg-info text-white">
              <div className="card-body text-center">
                <h6 className="card-title">Đơn giao hàng đang thực hiện</h6>
                <h3 className="mb-0">{ongoingOrders.delivery}/3</h3>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card bg-warning text-dark">
              <div className="card-body text-center">
                <h6 className="card-title">Đơn đưa đón đang thực hiện</h6>
                <h3 className="mb-0">{ongoingOrders.ride}/1</h3>
              </div>
            </div>
          </div>
        </div>

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
                           onClick={() => acceptOrder(order._id, order.type)}
                           style={buttonStyle}
                           disabled={
                             (order.type === 'delivery' && ongoingOrders.delivery >= 3) ||
                             (order.type === 'order' && ongoingOrders.ride >= 1)
                           }
                         >
                           <FaCheck className="me-2" />
                           {((order.type === 'delivery' && ongoingOrders.delivery >= 3) ||
                             (order.type === 'order' && ongoingOrders.ride >= 1)) 
                             ? 'Đã đạt giới hạn' : 'Nhận đơn'}
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