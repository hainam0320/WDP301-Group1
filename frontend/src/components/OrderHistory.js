import React, { useState, useEffect, useRef } from 'react';
import { FaHistory, FaStar, FaExclamationTriangle, FaArrowLeft, FaInfoCircle, FaTrash, FaImage, FaCheckCircle, FaMoneyBillWave } from 'react-icons/fa';
import axios from 'axios';
import { Modal, Button, Form, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap'; // Thêm Tooltip
import { userAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { toast } from 'react-hot-toast'; // Import toast

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
  const [reportImages, setReportImages] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [existingReport, setExistingReport] = useState(null);
  const BASE_URL = 'http://localhost:9999';
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;
  const [reportDescriptionError, setReportDescriptionError] = useState('');
  const [rateCommentError, setRateCommentError] = useState('');

  const fetchOrders = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await userAPI.getUserOrders(); // Sử dụng userAPI
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
      // Chỉ lấy các đơn đã hoàn thành bởi shipper HOẶC đã xác nhận bởi user để fetch rate
      const completedOrders = orders.filter(o => 
        o.status === 'shipper_completed' || 
        o.status === 'user_confirmed_completion' || 
        o.status === 'completed' // Backward compatibility if 'completed' still exists
      );
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
    if (rateComment.length > 256) {
      setRateCommentError('Bình luận không được vượt quá 256 ký tự');
      return;
    } else {
      setRateCommentError('');
    }
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
      toast.success('Gửi đánh giá thành công!');
    } catch (err) {
      console.error('Lỗi khi gửi đánh giá:', err);
      toast.error('Lỗi khi gửi đánh giá!');
    } finally {
      setRateLoading(false);
    }
  };

  const handleOpenReportModal = async (order) => {
    if (!order.driverId) {
      setMessage({ type: 'error', content: 'Không thể báo cáo đơn hàng không có tài xế' });
      return;
    }

    setReportType('');
    setReportDescription('');
    setReportImages([]);
    setExistingReport(null);
    setMessage({ type: '', content: '' });

    try {
      const response = await userAPI.getUserReports();
      
      if (response.data && response.data.reports) {
        const existingReport = response.data.reports.find(report => 
          report.order_id && report.order_id._id === order._id
        );
        
        if (existingReport) {
          setExistingReport(existingReport);
          setReportType(existingReport.type || '');
          
          if (existingReport.image) {
            const images = Array.isArray(existingReport.image)
              ? existingReport.image
              : typeof existingReport.image === 'string'
                ? existingReport.image.split(',').filter(img => img.trim())
                : [];
            setReportImages(images);
          }

          if (existingReport.status === 'resolved' || existingReport.status === 'rejected') {
            setMessage({
              type: 'warning',
              content: 'Báo cáo này đã được xử lý, bạn không thể cập nhật thêm'
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking existing report:', error);
      setMessage({ 
        type: 'error', 
        content: 'Lỗi khi kiểm tra báo cáo hiện có'
      });
    }

    setReportTargetOrder(order);
    setShowReportModal(true);
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setReportTargetOrder(null);
    setReportType('');
    setReportDescription('');
    setReportImages([]);
    setExistingReport(null);
    setMessage({ type: '', content: '' });
  };

  const handleSubmitReport = async () => {
    if (!reportTargetOrder || !reportType || !reportDescription) {
      setMessage({ type: 'error', content: 'Vui lòng điền đầy đủ thông tin báo cáo' });
      return;
    }
    if (reportDescription.length > 256) {
      setMessage({ type: 'error', content: 'Nội dung báo cáo không được vượt quá 256 ký tự' });
      return;
    }

    if (existingReport && (existingReport.status === 'resolved' || existingReport.status === 'rejected')) {
      setMessage({
        type: 'error',
        content: 'Không thể cập nhật báo cáo đã được xử lý'
      });
      return;
    }

    setReportLoading(true);
    try {
      const reportData = {
        order_id: reportTargetOrder._id,
        type: reportType,
        description: reportDescription,
        image: reportImages,
        removedImages: []
      };

      let response;
      if (existingReport) {
        response = await userAPI.updateReport(existingReport._id, reportData);
      } else {
        response = await userAPI.createReport(reportData);
      }

      if (response.data) {
        setMessage({ 
          type: 'success', 
          content: response.data.message || 'Báo cáo đã được cập nhật thành công'
        });
        
        const updatedReports = await userAPI.getUserReports();
        const updatedReport = updatedReports.data.reports.find(r => 
          r.order_id._id === reportTargetOrder._id
        );
        setExistingReport(updatedReport);

        setTimeout(() => {
          handleCloseReportModal();
        }, 1500);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      let errorMessage = 'Lỗi khi gửi báo cáo';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setMessage({ 
        type: 'error', 
        content: errorMessage
      });
    } finally {
      setReportLoading(false);
    }
  };

  const handleReportImageChange = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    try {
      setReportLoading(true);
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await userAPI.uploadReportImages(formData);

      if (response.data?.filePaths) {
        setReportImages(prev => [...prev, ...response.data.filePaths]);
        setMessage({ type: 'success', content: 'Tải ảnh lên thành công' });
      } else {
        throw new Error('Không nhận được đường dẫn file từ server');
      }
    } catch (error) {
      console.error('Error handling report image upload:', error);
      setMessage({ 
        type: 'error', 
        content: error.response?.data?.message || error.message || 'Lỗi khi tải ảnh lên' 
      });
    } finally {
      setReportLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setReportImages(prev => prev.filter((_, index) => index !== indexToRemove));
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

  const renderImages = (imagePaths) => {
    if (!imagePaths) return null;
    
    const images = Array.isArray(imagePaths) 
      ? imagePaths 
      : typeof imagePaths === 'string' 
        ? imagePaths.split(',').filter(img => img.trim())
        : [];

    if (images.length === 0) return null;

    return (
      <div className="d-flex flex-wrap gap-2">
        {images.map((img, index) => (
          <img
            key={index}
            src={getImageUrl(img)}
            alt={`Report evidence ${index + 1}`}
            className="img-thumbnail"
            style={{height: '100px', objectFit: 'cover'}}
            onClick={() => {
              const fullUrl = getImageUrl(img);
              if (fullUrl) {
                window.open(fullUrl, '_blank');
              }
            }}
          />
        ))}
      </div>
    );
  };

  const getOrderStatusBadge = (status) => {
    switch (status) {
        case 'shipper_completed': return <Badge bg="info">Shipper Hoàn thành</Badge>;
        case 'user_confirmed_completion': return <Badge bg="success">Đã Hoàn tất</Badge>;
        case 'driver_paid': return <Badge bg="success">Hoàn tiền cho shipper</Badge>;
        case 'disputed': return <Badge bg="danger">Tranh chấp</Badge>;
        case 'failed': return <Badge bg="danger">Thất bại</Badge>;
        case 'pending_payment': return <Badge bg="secondary">Chờ TT</Badge>;
        case 'payment_successful': return <Badge bg="info">Đã TT</Badge>;
        case 'refunded': return <Badge bg="secondary">Đã hoàn tiền</Badge>;
        default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const handleConfirmCompletion = async (orderId) => {
    if (window.confirm('Bạn có chắc chắn muốn xác nhận hoàn tất đơn hàng này không? Việc này sẽ giải ngân tiền cho tài xế.')) {
        try {
            await userAPI.confirmOrderCompletion(orderId);
            toast.success('Đơn hàng đã được xác nhận hoàn tất. Tiền đã giải ngân cho tài xế!');
            fetchOrders(); // Refresh orders to update status
        } catch (error) {
            console.error('Error confirming completion:', error);
            const errorMessage = error.response?.data?.message || 'Lỗi khi xác nhận hoàn tất đơn hàng.';
            toast.error(errorMessage);
        }
    }
  };

  const paginatedOrders = orders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );
  const totalPages = Math.ceil(orders.length / ordersPerPage);


  return (
    <div className="min-vh-100 orderhistory-bg">
      <Header />
      <style>{`
        .orderhistory-bg {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
        }
        .orderhistory-card {
          border-radius: 18px;
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.12);
          border: none;
          background: rgba(255,255,255,0.97);
        }
        .orderhistory-card .card-header {
          border-radius: 18px 18px 0 0;
          background: linear-gradient(90deg, #6a82fb 0%, #fc5c7d 100%);
          color: #fff;
        }
        .orderhistory-card .card-body {
          padding: 2.5rem 1.5rem;
        }
        .orderhistory-btn-lg {
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 12px;
          padding: 0.9rem 1.5rem;
          box-shadow: 0 2px 8px rgba(31,38,135,0.08);
          transition: background 0.2s, color 0.2s, transform 0.2s;
        }
        .orderhistory-btn-lg:active, .orderhistory-btn-lg:focus {
          outline: none;
          box-shadow: 0 0 0 2px #6a82fb33;
        }
        .orderhistory-btn-lg.btn-outline-primary {
          border: 2px solid #6a82fb;
          color: #6a82fb;
          background: #fff;
        }
        .orderhistory-btn-lg.btn-outline-primary:hover {
          background: linear-gradient(90deg, #6a82fb 0%, #fc5c7d 100%);
          color: #fff;
          border: none;
          transform: scale(1.04);
        }
        .orderhistory-card .card {
          border-radius: 14px;
          box-shadow: 0 2px 8px rgba(31,38,135,0.07);
        }
        .orderhistory-card .card:hover {
          box-shadow: 0 4px 16px rgba(31,38,135,0.13);
          transform: translateY(-2px) scale(1.01);
        }
        @media (max-width: 768px) {
          .orderhistory-card .card-body {
            padding: 1.2rem 0.5rem;
          }
        }
      `}</style>
      <div className="container my-5">
        <button 
          className="btn btn-outline-primary mb-4 orderhistory-btn-lg"
          onClick={() => navigate('/home')}
        >
          <FaArrowLeft className="me-2" />
          Quay lại
        </button>
        <div className="card orderhistory-card">
          <div className="card-header">
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
            ) : orders.length === 0 ? ( // Display if no orders at all
              <div className="alert alert-info">Bạn chưa có đơn hàng nào</div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Từ</th>
                      <th>Đến</th>
                      <th>Loại</th>
                      <th>Giá</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                      <th>Đánh giá</th>
                      <th>Báo cáo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders.map(order => (
                      <tr key={order._id}>
                        <td>#{order._id.slice(-6)}</td>
                        <td>{order.pickupaddress}</td>
                        <td>{order.dropupaddress}</td>
                        <td>{order.type === 'delivery' ? 'Giao hàng' : 'Đưa đón'}</td>
                        <td className="fw-bold">{order.price.toLocaleString()} VNĐ</td>
                        <td>
                          {getOrderStatusBadge(order.status)}
                          {(order.status === 'failed' || order.status === 'disputed' || order.paymentStatus === 'disputed_payment') && order.statusDescription && (
                            <OverlayTrigger
                                placement="top"
                                overlay={<Tooltip id={`tooltip-desc-${order._id}`}>{order.statusDescription}</Tooltip>}
                            >
                                <FaInfoCircle className="ms-1 text-muted" style={{cursor: 'help'}} />
                            </OverlayTrigger>
                          )}
                        </td>
                        <td>
                            {order.status === 'shipper_completed' && (
                                <Button 
                                    size="sm" 
                                    variant="success" 
                                    onClick={() => handleConfirmCompletion(order._id)}
                                    className="me-2"
                                >
                                    <FaCheckCircle className="me-1" />
                                    Xác nhận hoàn tất
                                </Button>
                            )}
                            {(order.status === 'pending_payment') && (
                                <Button size="sm" variant="info" onClick={() => navigate(`/new-order?orderId=${order._id}`)}> {/* Có thể chuyển hướng lại trang đặt đơn để thanh toán lại */}
                                    <FaMoneyBillWave className="me-1" /> Thanh toán lại
                                </Button>
                            )}
                        </td>
                        <td>
                          {(order.status === 'user_confirmed_completion' || order.status === 'completed') ? ( // Chỉ cho đánh giá khi user đã xác nhận
                            orderRates[order._id] ? (
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
                            )
                          ) : (
                            <span className="text-muted small">Chưa hoàn tất</span>
                          )}
                        </td>
                        <td>
                            {(order.status !== 'pending_payment' && order.status !== 'refunded') && ( // Không cho báo cáo khi chưa thanh toán/đã hoàn tiền
                                <Button 
                                    size="sm" 
                                    variant="outline-danger"
                                    onClick={() => handleOpenReportModal(order)}
                                    disabled={order.status === 'disputed'} // Nếu đang tranh chấp thì không báo cáo nữa
                                >
                                    <FaExclamationTriangle className="me-1" />
                                    Báo cáo
                                </Button>
                            )}
                            {order.status === 'disputed' && (
                                <OverlayTrigger
                                    placement="top"
                                    overlay={<Tooltip id={`tooltip-dispute-${order._id}`}>Đơn hàng đang có tranh chấp.</Tooltip>}
                                >
                                    <Button size="sm" variant="outline-secondary" disabled>
                                        Đang tranh chấp
                                    </Button>
                                </OverlayTrigger>
                            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {totalPages > 1 && (
                  <nav>
                    <ul className="pagination justify-content-center">
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
                    onChange={e => {
                      const value = e.target.value;
                      if (value.length <= 256) {
                        setRateComment(value);
                        setRateCommentError('');
                      } else {
                        setRateCommentError('Bình luận không được vượt quá 256 ký tự');
                      }
                    }}
                    placeholder="Nhập nhận xét của bạn..."
                    isInvalid={!!rateCommentError}
                  />
                  <div className="d-flex justify-content-between align-items-center mt-1">
                    <small className={rateComment.length > 256 ? 'text-danger' : 'text-muted'}>
                      {rateComment.length}/256 ký tự
                    </small>
                    {rateCommentError && (
                      <small className="text-danger">{rateCommentError}</small>
                    )}
                  </div>
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
                {existingReport ? 'Cập nhật báo cáo' : 'Tạo báo cáo mới'}
                {existingReport && (
                  <Badge bg={
                    existingReport.status === 'pending' ? 'warning' :
                    existingReport.status === 'reviewed' ? 'info' :
                    existingReport.status === 'resolved' ? 'success' : 'danger'
                  } className="ms-2">
                    <FaInfoCircle className="me-1" />
                    {existingReport.status === 'pending' ? 'Chờ xử lý' :
                     existingReport.status === 'reviewed' ? 'Đang xem xét' :
                     existingReport.status === 'resolved' ? 'Đã giải quyết' : 'Đã từ chối'}
                  </Badge>
                )}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {message.content && (
                <div className={`alert ${
                  message.type === 'success' ? 'alert-success' : 
                  message.type === 'warning' ? 'alert-warning' : 
                  'alert-danger'
                } mb-3`}>
                  {message.content}
                </div>
              )}

              {existingReport && (
                <div className="mb-3">
                  <h6>Thông tin báo cáo hiện tại:</h6>
                  <div className="border rounded p-3 bg-light mb-3">
                    <p><strong>Loại báo cáo:</strong> {' '}
                      <Badge bg="secondary">
                        {existingReport.type === 'late' ? 'Trễ hẹn' :
                         existingReport.type === 'damage' ? 'Hàng hóa bị hư hỏng' :
                         existingReport.type === 'lost' ? 'Hàng hóa bị mất' :
                         existingReport.type === 'inappropriate' ? 'Thái độ không phù hợp' :
                         existingReport.type === 'fraud' ? 'Gian lận' : 'Khác'}
                      </Badge>
                    </p>
                    <p><strong>Nội dung:</strong> {existingReport.description}</p>
                    {existingReport.image && (
                      <div>
                        <p><strong>Hình ảnh đính kèm:</strong></p>
                        {renderImages(existingReport.image)}
                      </div>
                    )}
                    <p className="mb-0 mt-2">
                      <strong>Trạng thái:</strong>{' '}
                      <Badge bg={
                        existingReport.status === 'pending' ? 'warning' :
                        existingReport.status === 'reviewed' ? 'info' :
                        existingReport.status === 'resolved' ? 'success' : 'danger'
                      }>
                        {existingReport.status === 'pending' ? 'Chờ xử lý' :
                         existingReport.status === 'reviewed' ? 'Đang xem xét' :
                         existingReport.status === 'resolved' ? 'Đã giải quyết' : 'Đã từ chối'}
                      </Badge>
                    </p>
                    {existingReport.admin_note && (
                      <p className="mb-0 mt-2">
                        <strong>Ghi chú của admin:</strong> {existingReport.admin_note}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Loại báo cáo <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    isInvalid={!reportType}
                    disabled={existingReport && (existingReport.status === 'resolved' || existingReport.status === 'rejected')}
                  >
                    <option value="">Chọn loại báo cáo</option>
                    <option value="late">Trễ hẹn</option>
                    <option value="damage">Hàng hóa bị hư hỏng</option>
                    <option value="lost">Hàng hóa bị mất</option>
                    <option value="inappropriate">Thái độ không phù hợp</option>
                    <option value="fraud">Gian lận</option>
                    <option value="other">Khác</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Nội dung báo cáo
                    <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={reportDescription}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 256) {
                        setReportDescription(value);
                        setReportDescriptionError('');
                      } else {
                        setReportDescriptionError('Nội dung báo cáo không được vượt quá 256 ký tự');
                      }
                    }}
                    placeholder={existingReport ? 
                      "Nhập nội dung cập nhật cho báo cáo..." :
                      "Vui lòng mô tả chi tiết vấn đề bạn gặp phải..."}
                    isInvalid={!reportDescription || !!reportDescriptionError}
                    disabled={existingReport && (existingReport.status === 'resolved' || existingReport.status === 'rejected')}
                  />
                  <div className="d-flex justify-content-between align-items-center mt-1">
                    <small className={reportDescription.length > 256 ? 'text-danger' : 'text-muted'}>
                      {reportDescription.length}/256 ký tự
                    </small>
                    {reportDescriptionError && (
                      <small className="text-danger">{reportDescriptionError}</small>
                    )}
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Hình ảnh đính kèm</Form.Label>
                  <div className="mb-3">
                    <div className="d-flex flex-wrap gap-2 mb-2">
                      {reportImages.map((img, index) => (
                        <div key={index} className="position-relative">
                          <img
                            src={getImageUrl(img)}
                            alt={`Report evidence ${index + 1}`}
                            className="img-thumbnail"
                            style={{height: '100px', width: '100px', objectFit: 'cover'}}
                          />
                          {!(existingReport && (existingReport.status === 'resolved' || existingReport.status === 'rejected')) && (
                            <Button
                              variant="danger"
                              size="sm"
                              className="position-absolute top-0 end-0"
                              onClick={() => handleRemoveImage(index)}
                              style={{padding: '2px 6px'}}
                            >
                              <FaTrash size={12} />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    {!(existingReport && (existingReport.status === 'resolved' || existingReport.status === 'rejected')) && (
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={reportLoading}
                        >
                          <FaImage className="me-1" />
                          Chọn thêm ảnh
                        </Button>
                        {reportImages.length > 0 && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => setReportImages([])}
                            disabled={reportLoading}
                          >
                            <FaTrash className="me-1" />
                            Xóa tất cả
                          </Button>
                        )}
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      multiple
                      accept="image/*"
                      onChange={handleReportImageChange}
                      style={{display: 'none'}}
                      disabled={existingReport && (existingReport.status === 'resolved' || existingReport.status === 'rejected')}
                    />
                  </div>
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseReportModal} disabled={reportLoading}>
                Đóng
              </Button>
              {!(existingReport && (existingReport.status === 'resolved' || existingReport.status === 'rejected')) && (
                <Button 
                  variant="primary" 
                  onClick={handleSubmitReport} 
                  disabled={reportLoading || !reportType || !reportDescription}
                >
                  {reportLoading ? 'Đang gửi...' : existingReport ? 'Cập nhật báo cáo' : 'Gửi báo cáo'}
                </Button>
              )}
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;