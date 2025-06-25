import React, { useState, useEffect } from 'react';
import { FaHistory, FaStar, FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap';
import { userAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import Header from './Header';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderRates, setOrderRates] = useState({});
  const [showRateModal, setShowRateModal] = useState(false);
  const [rateTargetOrder, setRateTargetOrder] = useState(null);
  const [rateValue, setRateValue] = useState(5);
  const [rateComment, setRateComment] = useState('');
  const [rateLoading, setRateLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTargetOrder, setReportTargetOrder] = useState(null);
  const [reportType, setReportType] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportImage, setReportImage] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
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
  }, []);

  const fetchRatesForCompletedOrders = async (completedOrders) => {
    const token = localStorage.getItem('token');
    const newRates = {};
    await Promise.all(completedOrders.map(async (order) => {
      try {
        const res = await userAPI.getOrderRate(order._id);
        if (Array.isArray(res.data) && res.data.length > 0) {
          newRates[order._id] = res.data[0];
        }
      } catch (err) {
        // Không có đánh giá thì thôi
      }
    }));
    setOrderRates(newRates);
  };

  useEffect(() => {
    if (orders.length > 0) {
      const completedOrders = orders.filter(o => o.status === 'completed');
      fetchRatesForCompletedOrders(completedOrders);
    }
  }, [orders]);

  const handleOpenRateModal = (order) => {
    setRateTargetOrder(order);
    setRateValue(5);
    setRateComment('');
    setShowRateModal(true);
  };

  const handleCloseRateModal = () => {
    setShowRateModal(false);
    setRateTargetOrder(null);
  };

  const handleSubmitRate = async () => {
    if (!rateTargetOrder) return;
    setRateLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const payload = {
        userId: user._id,
        driverId: rateTargetOrder.driverId._id,
        orderId: rateTargetOrder._id,
        rate: rateValue,
        comment: rateComment
      };
      const res = await userAPI.createOrderRate(payload);
      setOrderRates(prev => ({ ...prev, [rateTargetOrder._id]: res.data }));
      setShowRateModal(false);
    } catch (err) {
      alert('Lỗi khi gửi đánh giá!');
    } finally {
      setRateLoading(false);
    }
  };

  const handleOpenReportModal = (order) => {
    if (!order.driverId) {
      setMessage({ type: 'error', content: 'Không thể báo cáo đơn hàng không có tài xế' });
      return;
    }
    setReportTargetOrder(order);
    setReportType('');
    setReportDescription('');
    setReportImage(null);
    setShowReportModal(true);
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setReportTargetOrder(null);
    setReportType('');
    setReportDescription('');
    setReportImage(null);
    setMessage({ type: '', content: '' });
  };

  const handleReportImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setReportLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${BASE_URL}/api/reports/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.filePath) {
        setReportImage(response.data.filePath);
        setMessage({ type: 'success', content: 'Tải ảnh lên thành công' });
      }
    } catch (error) {
      console.error('Error handling report image upload:', error);
      setMessage({ 
        type: 'error', 
        content: error.response?.data?.message || 'Lỗi khi tải ảnh lên' 
      });
    } finally {
      setReportLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportTargetOrder || !reportType || !reportDescription) {
      setMessage({ type: 'error', content: 'Vui lòng điền đầy đủ thông tin báo cáo' });
      return;
    }

    setReportLoading(true);
    try {
      const response = await userAPI.createReport({
        order_id: reportTargetOrder._id,
        type: reportType,
        description: reportDescription
      });

      if (response.data.message) {
        setMessage({ type: 'success', content: response.data.message });
        handleCloseReportModal();
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      const errorMessage = error.response?.data?.message || 'Lỗi khi gửi báo cáo';
      setMessage({ 
        type: 'error', 
        content: errorMessage
      });
    } finally {
      setReportLoading(false);
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
            <h4 className="mb-0"><FaHistory className="me-2" />Lịch sử đơn hàng</h4>
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
              <div className="alert alert-info">Không có lịch sử đơn hàng</div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Từ</th>
                      <th>Đến</th>
                      <th>Loại</th>
                      <th>Thời gian hoàn thành</th>
                      <th>Giá</th>
                      <th>Đánh giá</th>
                      <th>Báo cáo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.filter(order => order.status === 'completed').map(order => (
                      <tr key={order._id}>
                        <td>#{order._id.slice(-6)}</td>
                        <td>{order.pickupaddress}</td>
                        <td>{order.dropupaddress}</td>
                        <td>{order.type === 'delivery' ? 'Giao hàng' : 'Đưa đón'}</td>
                        <td>{new Date(order.updatedAt).toLocaleString('vi-VN')}</td>
                        <td className="fw-bold">{order.price.toLocaleString()} VNĐ</td>
                        <td>
                          {orderRates[order._id] ? (
                            <div>
                              <span className="text-warning">
                                {[...Array(orderRates[order._id].rate)].map((_, i) => <FaStar key={i} />)}
                              </span>
                              <div className="small text-muted">{orderRates[order._id].comment}</div>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline-primary" onClick={() => handleOpenRateModal(order)}>
                              Đánh giá
                            </Button>
                          )}
                        </td>
                        <td>
                          <Button 
                            size="sm" 
                            variant="outline-danger"
                            onClick={() => handleOpenReportModal(order)}
                          >
                            <FaExclamationTriangle className="me-1" />
                            Báo cáo
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal đánh giá */}
          <Modal show={showRateModal} onHide={handleCloseRateModal} centered>
            <Modal.Header closeButton>
              <Modal.Title>Đánh giá đơn hàng</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Số sao</Form.Label>
                  <div>
                    {[1,2,3,4,5].map(star => (
                      <FaStar
                        key={star}
                        className={star <= rateValue ? 'text-warning' : 'text-secondary'}
                        style={{cursor: 'pointer', fontSize: 24}}
                        onClick={() => setRateValue(star)}
                      />
                    ))}
                  </div>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Bình luận</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={rateComment}
                    onChange={e => setRateComment(e.target.value)}
                    placeholder="Nhập nhận xét của bạn..."
                  />
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseRateModal} disabled={rateLoading}>
                Hủy
              </Button>
              <Button variant="primary" onClick={handleSubmitRate} disabled={rateLoading}>
                {rateLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Modal báo cáo */}
          <Modal show={showReportModal} onHide={handleCloseReportModal} centered>
            <Modal.Header closeButton>
              <Modal.Title>
                Báo cáo đơn hàng {reportTargetOrder ? `#${reportTargetOrder._id.slice(-6)}` : ''}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {message.content && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} mb-3`}>
                  {message.content}
                </div>
              )}
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Loại báo cáo <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    isInvalid={!reportType}
                  >
                    <option value="">Chọn loại báo cáo</option>
                    <option value="damage">Hàng hóa bị hư hỏng</option>
                    <option value="lost">Hàng hóa bị mất</option>
                    <option value="inappropriate">Thái độ không phù hợp</option>
                    <option value="other">Khác</option>
                  </Form.Select>
                  {!reportType && <Form.Text className="text-danger">Vui lòng chọn loại báo cáo</Form.Text>}
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Nội dung báo cáo <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Vui lòng mô tả chi tiết vấn đề bạn gặp phải..."
                    isInvalid={!reportDescription}
                  />
                  {!reportDescription && <Form.Text className="text-danger">Vui lòng nhập nội dung báo cáo</Form.Text>}
                </Form.Group>

                {/* Thêm phần upload ảnh */}
                <Form.Group className="mb-3">
                  <Form.Label>Hình ảnh đính kèm</Form.Label>
                  <div className="d-flex align-items-center gap-2">
                    <div className="position-relative" style={{width: '120px', height: '120px'}}>
                      {reportImage ? (
                        <>
                          <img
                            src={getImageUrl(reportImage)}
                            alt="Report evidence"
                            className="img-thumbnail"
                            style={{width: '100%', height: '100%', objectFit: 'cover'}}
                          />
                          <button
                            type="button"
                            className="btn btn-sm btn-danger position-absolute top-0 end-0"
                            onClick={() => setReportImage(null)}
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <div 
                          className="border rounded d-flex align-items-center justify-content-center"
                          style={{width: '100%', height: '100%', cursor: 'pointer'}}
                          onClick={() => document.getElementById('report-image-upload').click()}
                        >
                          <FaExclamationTriangle size={24} className="text-muted" />
                        </div>
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        id="report-image-upload"
                        accept="image/*"
                        onChange={handleReportImageChange}
                        style={{display: 'none'}}
                      />
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => document.getElementById('report-image-upload').click()}
                      >
                        Chọn ảnh
                      </Button>
                    </div>
                  </div>
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseReportModal} disabled={reportLoading}>
                Hủy
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSubmitReport} 
                disabled={reportLoading || !reportType || !reportDescription}
              >
                {reportLoading ? 'Đang gửi...' : 'Gửi báo cáo'}
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default OrderHistory; 