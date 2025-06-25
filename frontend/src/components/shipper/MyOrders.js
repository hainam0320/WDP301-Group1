import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRoute, FaMapMarkerAlt, FaUser, FaEye, FaStar, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
import ShipperHeader from './ShipperHeader';

const MyOrders = () => {
  const navigate = useNavigate();
  const [myOrders, setMyOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState({ type: '', content: '' });
  const BASE_URL = 'http://localhost:9999';

  // Modal states
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderRate, setOrderRate] = useState(null);

  const fetchMyOrders = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/shipper/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      // Chỉ lấy những đơn hàng chưa hoàn thành
      const activeOrders = response.data.filter(order => order.status !== 'completed');
      setMyOrders(activeOrders);
    } catch (err) {
      console.error('Error fetching my orders:', err);
      setError('Không thể tải danh sách đơn hàng của bạn');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${BASE_URL}/api/shipper/orders/${orderId}/status`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        if (newStatus === 'completed') {
          // Nếu đơn hàng được hoàn thành, loại bỏ khỏi danh sách
          setMyOrders(myOrders.filter(order => order._id !== orderId));
        } else {
          // Nếu chỉ cập nhật trạng thái, cập nhật trong danh sách
          setMyOrders(myOrders.map(order => 
            order._id === orderId ? {...order, status: newStatus} : order
          ));
        }
        setMessages({ type: 'success', content: 'Cập nhật trạng thái đơn hàng thành công!' });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      setMessages({ 
        type: 'error', 
        content: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrderRate = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/rate/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data && response.data.length > 0) {
        setOrderRate(response.data[0]);
      } else {
        setOrderRate(null);
      }
    } catch (error) {
      console.error('Error fetching order rate:', error);
      setOrderRate(null);
    }
  };

  const handleShowOrderDetail = async (order) => {
    setSelectedOrder(order);
    setShowOrderDetailModal(true);
    await fetchOrderRate(order._id);
  };

  const handleCloseOrderDetailModal = () => {
    setShowOrderDetailModal(false);
    setSelectedOrder(null);
    setOrderRate(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  const cardStyle = {
    borderRadius: '15px',
    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
    border: 'none'
  };

  return (
    <div className="min-vh-100" style={{backgroundColor: '#f5f7fa'}}>
      <ShipperHeader />
      <div className="container my-5">
        <button 
          className="btn btn-outline-primary mb-4"
          onClick={() => navigate('/shipper')}
        >
          <FaArrowLeft className="me-2" />
          Quay lại
        </button>

        <div className="card" style={cardStyle}>
          <div className="card-header bg-primary text-white">
            <h4 className="mb-0"><FaRoute className="me-2" />Đơn hàng đang thực hiện</h4>
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
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Đang tải...</span>
                </div>
              </div>
            ) : error ? (
              <div className="alert alert-danger">{error}</div>
            ) : myOrders.length === 0 ? (
              <div className="text-center text-muted py-4">
                <p>Bạn chưa có đơn hàng nào đang thực hiện</p>
              </div>
            ) : (
              myOrders.map(order => (
                <div key={order._id} className="card mb-3">
                  <div className="card-body">
                    <div className="row align-items-center">
                      <div className="col-md-6">
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
                          <FaUser className="text-primary me-2" />
                          <strong>KH:</strong> {order.userId?.phone || order.phone}
                        </p>
                        {order.type === 'delivery' && order.weight && (
                          <p className="mb-1">
                            <strong>Khối lượng:</strong> {order.weight} kg
                          </p>
                        )}
                      </div>
                      <div className="col-md-3">
                        <span className={`badge fs-6 ${
                          order.status === 'in-progress' ? 'bg-warning' : 'bg-info'
                        }`}>
                          {order.status === 'in-progress' ? 'Đang giao' : 'Đã nhận'}
                        </span>
                        <p className="mt-2 fw-bold text-success">{order.price.toLocaleString()} VNĐ</p>
                      </div>
                      <div className="col-md-3">
                        {order.status === 'accepted' && (
                          <button 
                            className="btn btn-warning btn-sm mb-2 w-100"
                            onClick={() => updateOrderStatus(order._id, 'in-progress')}
                          >
                            Bắt đầu giao
                          </button>
                        )}
                        {order.status === 'in-progress' && (
                          <button 
                            className="btn btn-success btn-sm mb-2 w-100"
                            onClick={() => updateOrderStatus(order._id, 'completed')}
                          >
                            Hoàn thành
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal chi tiết đơn hàng */}
      <Modal show={showOrderDetailModal} onHide={handleCloseOrderDetailModal} size="lg" centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <FaRoute className="me-2" />
            Chi tiết đơn hàng #{selectedOrder?._id?.slice(-6)}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <div className="row">
              <div className="col-md-6">
                <h6 className="fw-bold text-primary mb-3">Thông tin địa điểm</h6>
                <div className="mb-3">
                  <p className="mb-1">
                    <strong className="text-success">Điểm đón:</strong>
                  </p>
                  <p className="text-muted">{selectedOrder.pickupaddress}</p>
                </div>
                <div className="mb-3">
                  <p className="mb-1">
                    <strong className="text-danger">Điểm đến:</strong>
                  </p>
                  <p className="text-muted">{selectedOrder.dropupaddress}</p>
                </div>
                <div className="mb-3">
                  <p className="mb-1">
                    <strong>Khoảng cách:</strong>
                  </p>
                  <p className="text-muted">
                    {selectedOrder.distance_km ? `${selectedOrder.distance_km.toFixed(1)} km` : 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="col-md-6">
                <h6 className="fw-bold text-primary mb-3">Thông tin thời gian</h6>
                <div className="mb-3">
                  <p className="mb-1">
                    <strong>Thời gian nhận đơn:</strong>
                  </p>
                  <p className="text-muted">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                {selectedOrder.status === 'completed' && (
                  <div className="mb-3">
                    <p className="mb-1">
                      <strong>Thời gian hoàn thành:</strong>
                    </p>
                    <p className="text-muted">{formatDate(selectedOrder.updatedAt)}</p>
                  </div>
                )}
                
                <h6 className="fw-bold text-primary mb-3">Thông tin thanh toán</h6>
                <div className="mb-3">
                  <p className="mb-1">
                    <strong>Giá tiền:</strong>
                  </p>
                  <p className="text-success fw-bold fs-5">
                    {selectedOrder.price.toLocaleString()} VNĐ
                  </p>
                </div>
                
                <h6 className="fw-bold text-primary mb-3">Đánh giá từ khách hàng</h6>
                <div className="mb-3">
                  {orderRate ? (
                    <div>
                      <div className="mb-2">
                        <span className="text-warning">
                          {[...Array(orderRate.rate)].map((_, i) => (
                            <FaStar key={i} size={20} />
                          ))}
                        </span>
                        <span className="ms-2 fw-bold">{orderRate.rate}/5</span>
                      </div>
                      {orderRate.comment && (
                        <div>
                          <p className="mb-1"><strong>Nhận xét:</strong></p>
                          <p className="text-muted fst-italic">"{orderRate.comment}"</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted">Chưa có đánh giá</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseOrderDetailModal}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MyOrders; 