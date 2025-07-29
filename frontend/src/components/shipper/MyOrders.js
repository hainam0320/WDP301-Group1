import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRoute, FaMapMarkerAlt, FaUser, FaStar, FaArrowLeft, FaInfoCircle } from 'react-icons/fa';
import axios from 'axios';
import { Modal, Button, Form, OverlayTrigger, Tooltip, Badge } from 'react-bootstrap'; // Thêm OverlayTrigger, Tooltip, Badge
import ShipperHeader from './ShipperHeader';
import { toast } from 'react-hot-toast';

const MyOrders = () => {
  const navigate = useNavigate();
  const [myOrders, setMyOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState({ type: '', content: '' });
  const BASE_URL = 'http://localhost:9999';

  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderRate, setOrderRate] = useState(null);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [failureReason, setFailureReason] = useState('');
  const [failureReasonError, setFailureReasonError] = useState('');
  const [orderToFail, setOrderToFail] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;

  const fetchMyOrders = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      // Lấy các đơn hàng của shipper, loại trừ các trạng thái đã hoàn tất hoặc bị hủy/hoàn tiền
      const response = await axios.get(`${BASE_URL}/api/shipper/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      // Filter các đơn hàng ĐANG thực hiện (accepted, in_progress)
      const activeOrders = response.data
        .filter(order => 
          order.status === 'accepted' || 
          order.status === 'in_progress'
        )
        .map(order => ({
          ...order,
          selectedStatus: 'Giao thành công' // Default cho trạng thái hoàn thành
        }));
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

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const order = myOrders.find(o => o._id === orderId);
      
      const requestData = {
        status: newStatus // Shipper chỉ cập nhật trạng thái đơn hàng (accepted -> in_progress -> shipper_completed)
      };

      if (newStatus === 'shipper_completed' || newStatus === 'failed') { // Đổi 'completed' thành 'shipper_completed'
        requestData.statusDescription = order.selectedStatus;
      }

      await axios.put(`${BASE_URL}/api/shipper/orders/${orderId}/status`, 
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      fetchMyOrders();
      toast.success('Cập nhật trạng thái thành công!');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Lỗi khi cập nhật trạng thái đơn hàng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusDescriptionChange = (orderId, newStatusDescription) => {
    setMyOrders(prevOrders => 
      prevOrders.map(order => 
        order._id === orderId 
          ? { ...order, selectedStatus: newStatusDescription }
          : order
      )
    );
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
    // Chỉ fetch rate nếu đơn hàng đã được user xác nhận hoàn thành
    if (order.status === 'user_confirmed_completion') {
        await fetchOrderRate(order._id);
    } else {
        setOrderRate(null);
    }
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

  const handleShowFailureModal = (order) => {
    setOrderToFail(order);
    setFailureReason(''); // Reset lý do khi mở modal
    setFailureReasonError(''); // Reset lỗi
    setShowFailureModal(true);
  };

  const handleCloseFailureModal = () => {
    setShowFailureModal(false);
    setFailureReason('');
    setFailureReasonError('');
    setOrderToFail(null);
  };

  const handleFailureSubmit = async () => {
    if (!failureReason.trim()) {
      setFailureReasonError('Vui lòng nhập lý do thất bại');
      return;
    }
    if (failureReason.length > 256) {
      setFailureReasonError('Lý do không được vượt quá 256 ký tự');
      return;
    } else {
      setFailureReasonError('');
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.put(`${BASE_URL}/api/shipper/orders/${orderToFail._id}/status`, 
        {
          status: 'failed', // Trạng thái 'failed' cho cả đơn hàng và paymentStatus
          statusDescription: failureReason
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      handleCloseFailureModal();
      fetchMyOrders();
      toast.success('Đã cập nhật trạng thái đơn hàng');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Lỗi khi cập nhật trạng thái đơn hàng');
    } finally {
      setIsLoading(false);
    }
  };

  const getOrderStatusBadge = (status) => {
    switch (status) {
        case 'accepted': return <Badge bg="primary">Đã nhận</Badge>;
        case 'in_progress': return <Badge bg="warning">Đang giao</Badge>;
        case 'shipper_completed': return <Badge bg="info">Shipper Hoàn thành</Badge>; // Mới
        case 'user_confirmed_completion': return <Badge bg="success">Đã Hoàn tất</Badge>; // Mới
        case 'disputed': return <Badge bg="danger">Tranh chấp</Badge>; // Mới
        case 'failed': return <Badge bg="danger">Thất bại</Badge>;
        case 'pending_payment': return <Badge bg="secondary">Chờ TT</Badge>;
        case 'payment_successful': return <Badge bg="info">Đã TT</Badge>;
        case 'refunded': return <Badge bg="secondary">Đã hoàn tiền</Badge>;
        default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const totalPages = Math.ceil(myOrders.length / ordersPerPage);
  const paginatedOrders = myOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );

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
              paginatedOrders.map(order => (
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
                        {order.type === 'delivery' && order.weight_kg && ( // Sử dụng weight_kg
                          <p className="mb-1">
                            <strong>Khối lượng:</strong> {order.weight_kg} kg
                          </p>
                        )}
                      </div>
                      <div className="col-md-3">
                        {getOrderStatusBadge(order.status)} {/* Sử dụng hàm mới */}
                        <p className="mt-2 fw-bold text-success">{order.price.toLocaleString()} VNĐ</p>
                      </div>
                      <div className="col-md-3">
                        {order.status === 'accepted' && (
                          <button 
                            className="btn btn-warning btn-sm mb-2 w-100"
                            onClick={() => handleStatusChange(order._id, 'in_progress')} // Đổi 'in-progress' -> 'in_progress'
                          >
                            Bắt đầu giao
                          </button>
                        )}
                        {order.status === 'in_progress' && ( // Đổi 'in-progress' -> 'in_progress'
                          <>
                            <button 
                              className="btn btn-success btn-sm mb-2 w-100"
                              onClick={() => handleStatusChange(order._id, 'shipper_completed')} // Đổi 'completed' -> 'shipper_completed'
                            >
                              Giao thành công
                            </button>
                            <button 
                              className="btn btn-danger btn-sm mb-2 w-100"
                              onClick={() => handleShowFailureModal(order)}
                            >
                              {order.type === 'delivery' ? 'Giao hàng thất bại' : 'Đưa đón thất bại'}
                            </button>
                          </>
                        )}
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
                {(selectedOrder.status === 'shipper_completed' || selectedOrder.status === 'user_confirmed_completion') && (
                  <>
                    <div className="mb-3">
                      <p className="mb-1">
                        <strong>Thời gian hoàn thành:</strong>
                      </p>
                      <p className="text-muted">{formatDate(selectedOrder.updatedAt)}</p>
                    </div>
                    <div className="mb-3">
                      <p className="mb-1">
                        <strong>Trạng thái hoàn thành:</strong>
                      </p>
                      <p className="text-muted">{selectedOrder.statusDescription || 'Giao thành công'}</p>
                    </div>
                  </>
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

      {/* Modal nhập lý do thất bại */}
      <Modal show={showFailureModal} onHide={handleCloseFailureModal} centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>
            {orderToFail?.type === 'delivery' ? 'Lý do giao hàng thất bại' : 'Lý do đưa đón thất bại'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>
                {orderToFail?.type === 'delivery' ? 'Vui lòng nhập lý do giao hàng thất bại:' : 'Vui lòng nhập lý do đưa đón thất bại:'}
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={failureReason}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 256) {
                    setFailureReason(value);
                    setFailureReasonError('');
                  } else {
                    setFailureReasonError('Lý do không được vượt quá 256 ký tự');
                  }
                }}
                placeholder="Nhập lý do thất bại..."
                isInvalid={!!failureReasonError}
              />
              <div className="d-flex justify-content-between align-items-center mt-1">
                <small className={failureReason.length > 256 ? 'text-danger' : 'text-muted'}>
                  {failureReason.length}/256 ký tự
                </small>
                {failureReasonError && (
                  <small className="text-danger">{failureReasonError}</small>
                )}
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseFailureModal}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleFailureSubmit}>
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MyOrders;  