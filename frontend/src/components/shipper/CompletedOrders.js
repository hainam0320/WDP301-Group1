import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaMapMarkerAlt, FaUser, FaEye, FaStar, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
import ShipperHeader from './ShipperHeader';

const CompletedOrders = () => {
  const navigate = useNavigate();
  const [completedOrders, setCompletedOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const BASE_URL = 'http://localhost:9999';

  // Modal states
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderRate, setOrderRate] = useState(null);

  const fetchCompletedOrders = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/shipper/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      // Lấy những đơn hàng đã hoàn thành hoặc thất bại
      const finishedOrders = response.data.filter(order => 
        order.status === 'completed' || order.status === 'failed'
      );
      setCompletedOrders(finishedOrders);
    } catch (err) {
      console.error('Error fetching completed orders:', err);
      setError('Không thể tải danh sách đơn hàng đã hoàn thành');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedOrders();
  }, []);

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
          <div className="card-header bg-success text-white">
            <h4 className="mb-0"><FaCheckCircle className="me-2" />Đơn hàng đã hoàn thành</h4>
          </div>
          <div className="card-body">
            {isLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Đang tải...</span>
                </div>
              </div>
            ) : error ? (
              <div className="alert alert-danger">{error}</div>
            ) : completedOrders.length === 0 ? (
              <div className="text-center text-muted py-4">
                <p>Bạn chưa có đơn hàng nào đã hoàn thành</p>
              </div>
            ) : (
              completedOrders.map(order => (
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
                          order.status === 'failed' ? 'bg-danger' : 'bg-success'
                        }`}>
                          {order.status === 'failed' ? 'Thất bại' : 'Hoàn thành'}
                        </span>
                        <p className="mt-2 fw-bold text-success">{order.price.toLocaleString()} VNĐ</p>
                        <p className="mb-1 text-muted">
                          <strong>Ghi chú:</strong> {order.statusDescription || 'Giao thành công'}
                        </p>
                        <p className="text-muted mb-0">
                          <small>
                            {order.status === 'failed' ? 'Thất bại' : 'Hoàn thành'}: {formatDate(order.updatedAt)}
                          </small>
                        </p>
                      </div>
                      <div className="col-md-3">
                        <button 
                          className="btn btn-outline-primary btn-sm w-100"
                          onClick={() => handleShowOrderDetail(order)}
                        >
                          <FaEye className="me-1" />
                          Xem chi tiết
                        </button>
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
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>
            <FaCheckCircle className="me-2" />
            Chi tiết đơn hàng #{selectedOrder?._id?.slice(-6)}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <div className="row">
              <div className="col-md-6">
                <h6 className="fw-bold text-success mb-3">Thông tin địa điểm</h6>
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
                {selectedOrder.type === 'delivery' && selectedOrder.weight && (
                  <div className="mb-3">
                    <p className="mb-1">
                      <strong>Khối lượng:</strong>
                    </p>
                    <p className="text-muted">{selectedOrder.weight} kg</p>
                  </div>
                )}
                <div className="mb-3">
                  <p className="mb-1">
                    <strong>Trạng thái hoàn thành:</strong>
                  </p>
                  <p className="text-muted">{selectedOrder.statusDescription || 'Giao thành công'}</p>
                </div>
              </div>
              
              <div className="col-md-6">
                <h6 className="fw-bold text-success mb-3">Thông tin thời gian</h6>
                <div className="mb-3">
                  <p className="mb-1">
                    <strong>Thời gian nhận đơn:</strong>
                  </p>
                  <p className="text-muted">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div className="mb-3">
                  <p className="mb-1">
                    <strong>Thời gian hoàn thành:</strong>
                  </p>
                  <p className="text-muted">{formatDate(selectedOrder.updatedAt)}</p>
                </div>
                
                <h6 className="fw-bold text-success mb-3">Thông tin thanh toán</h6>
                <div className="mb-3">
                  <p className="mb-1">
                    <strong>Giá tiền:</strong>
                  </p>
                  <p className="text-success fw-bold fs-5">
                    {selectedOrder.price.toLocaleString()} VNĐ
                  </p>
                </div>
                
                <h6 className="fw-bold text-success mb-3">Đánh giá từ khách hàng</h6>
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

export default CompletedOrders; 