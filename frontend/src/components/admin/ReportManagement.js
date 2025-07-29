import React, { useState, useEffect } from 'react';
import { FaEye, FaCheck, FaTimes, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { adminAPI, transactionAPI } from '../../services/api'; // Import transactionAPI
import { toast } from 'react-toastify'; // Dùng react-toastify
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form'; // Import Form

const ReportManagement = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [resolveLoading, setResolveLoading] = useState(false); // Thêm state cho loading khi xử lý tranh chấp

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const reportsData = await adminAPI.getAllReports();
      setReports(reportsData.data.reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setAdminNote(report.admin_note || ''); // Set ghi chú cũ nếu có
    setShowReportModal(true);
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setSelectedReport(null);
    setAdminNote('');
  };

  const handleUpdateReportStatus = async (reportId, status) => {
    try {
      setResolveLoading(true); // Bắt đầu loading
      await adminAPI.updateReportStatus(reportId, {
        status,
        admin_note: adminNote
      });
      toast.success('Cập nhật trạng thái báo cáo thành công');
      // Nếu trạng thái là resolved hoặc rejected, và có orderId, kiểm tra và cập nhật trạng thái đơn hàng
      if ((status === 'resolved' || status === 'rejected') && selectedReport?.order_id?._id) {
          // Xử lý đơn hàng bị tranh chấp:
          // Nếu báo cáo được giải quyết/từ chối, và đơn hàng đang ở trạng thái disputed,
          // admin có thể giải quyết giao dịch tương ứng.
          // Đây là điểm tích hợp với luồng thanh toán mới.
          // Tùy theo kết quả xử lý báo cáo, admin có thể hoàn tiền cho user hoặc giải ngân cho tài xế.
          // Logic này phức tạp và sẽ được kích hoạt bởi admin trong ReportManagement hoặc AdminCommissionManagement
          // For now, if the report is resolved/rejected, the order status might return to its previous state or a new 'resolved_dispute' state.
          // Hoặc bạn có thể thêm một modal/form để admin xác nhận hành động cụ thể (hoàn tiền/giải ngân)
          // ở đây hoặc trong AdminCommissionManagement.

          // Để đơn giản hóa, ta sẽ giả định report 'resolved' sẽ kết thúc tranh chấp.
          // Quyết định hoàn tiền/giải ngân sẽ do admin thực hiện thủ công trong CommissionManagement
          // hoặc một module riêng biệt.
      }
      handleCloseReportModal();
      fetchReports();
    } catch (error) {
      console.error('Error updating report status:', error);
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái báo cáo');
    } finally {
        setResolveLoading(false); // Kết thúc loading
    }
  };

  // Hàm xử lý khi admin quyết định hoàn tiền hoặc giải ngân trong trường hợp tranh chấp
  const handleResolveOrderDispute = async (orderId, newTransactionStatus) => {
      // Tìm giao dịch 'disputed' liên quan đến orderId này
      try {
          setResolveLoading(true);
          // Để thực hiện hành động này, chúng ta cần tìm transaction ID có trạng thái 'disputed'
          // và thuộc về orderId này. Giả định rằng sẽ có 1 transaction 'held' ban đầu
          // và khi phát sinh tranh chấp thì CompanyTransaction chuyển sang 'disputed'.
          // Tuy nhiên, việc báo cáo có thể không tạo ra một CompanyTransaction ngay lập tức.
          // Cách tiếp cận tốt hơn là ReportModel có thể có một trường `relatedTransactionId`
          // hoặc AdminCommissionManagement sẽ là nơi xử lý các transaction disputed.
          // Ở đây, ta sẽ gọi API adminResolveTransaction và truyền orderId để backend tự tìm.
          // Backend sẽ tìm giao dịch 'disputed' liên quan đến orderId này và xử lý.

          // Nếu report.order_id có một giao dịch đang ở trạng thái disputed, thì gọi API này
          // Giả sử có một API để lấy transactionId từ orderId nếu nó đang disputed
          // Hoặc đơn giản hơn, admin có thể xem giao dịch disputed trong AdminCommissionManagement
          // và xử lý ở đó.
          // Để demo tích hợp, ta giả định selectedReport.order_id có một disputed transaction liên quan.
          if (selectedReport?.order_id?._id) {
              const transactionRes = await transactionAPI.getAdminTransactions({ 
                  orderId: selectedReport.order_id._id, 
                  status: 'disputed' 
              });
              if (transactionRes.data.transactions.length > 0) {
                  const disputedTransaction = transactionRes.data.transactions[0];
                  await transactionAPI.adminResolveTransaction(disputedTransaction._id, { 
                      newStatus: newTransactionStatus, 
                      remarks: adminNote || 'Giải quyết từ quản lý báo cáo' 
                  });
                  toast.success('Đã giải quyết tranh chấp đơn hàng thành công!');
                  // Cập nhật trạng thái báo cáo thành resolved
                  await adminAPI.updateReportStatus(selectedReport._id, { status: 'resolved', admin_note: adminNote || 'Đã giải quyết tranh chấp đơn hàng và xử lý tài chính.' });
                  handleCloseReportModal();
                  fetchReports();
              } else {
                  toast.error('Không tìm thấy giao dịch tranh chấp cho đơn hàng này.');
              }
          } else {
              toast.error('Không tìm thấy ID đơn hàng liên quan.');
          }

      } catch (error) {
          console.error('Error resolving order dispute:', error);
          toast.error(error.response?.data?.message || 'Lỗi khi giải quyết tranh chấp đơn hàng.');
      } finally {
          setResolveLoading(false);
      }
  };

  const getReportStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="badge bg-warning">Chờ xử lý</span>;
      case 'reviewed':
        return <span className="badge bg-info">Đang xem xét</span>;
      case 'resolved':
        return <span className="badge bg-success">Đã giải quyết</span>;
      case 'rejected':
        return <span className="badge bg-danger">Đã từ chối</span>;
      default:
        return <span className="badge bg-secondary">Không xác định</span>;
    }
  };

  const getReportTypeBadge = (type) => {
    switch (type) {
      case 'late':
        return <span className="badge bg-warning">Trễ hẹn</span>;
      case 'damage':
        return <span className="badge bg-danger">Hư hỏng</span>;
      case 'lost':
        return <span className="badge bg-dark">Thất lạc</span>;
      case 'inappropriate':
        return <span className="badge bg-info">Không phù hợp</span>;
      case 'fraud':
        return <span className="badge bg-danger">Gian lận</span>;
      case 'other':
        return <span className="badge bg-secondary">Khác</span>;
      default:
        return <span className="badge bg-secondary">Không xác định</span>;
    }
  };

  const handleImageClick = (imagePath) => {
    setSelectedImage(`http://localhost:9999/${imagePath}`);
    setShowImageModal(true);
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
            src={`http://localhost:9999/${img}`}
            alt={`Report evidence ${index + 1}`}
            className="img-thumbnail"
            style={{height: '100px', objectFit: 'cover', cursor: 'pointer'}}
            onClick={() => handleImageClick(img)}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/200x200?text=Image+Not+Found';
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header bg-danger text-white">
        <h4 className="mb-0"><FaExclamationTriangle className="me-2" />Quản lý báo cáo</h4>
      </div>
      <div className="card-body">
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
          </div>
        ) : reports.length === 0 ? (
          <div className="alert alert-info">Không có báo cáo nào</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Người báo cáo</th>
                  <th>Tài xế</th>
                  <th>Loại</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(report => (
                  <tr key={report._id}>
                    <td>#{report.order_id?._id ? report.order_id._id.slice(-6) : 'N/A'}</td>
                    <td>{report.reporterID?.fullName || 'N/A'}</td>
                    <td>{report.reported_user_id?.fullName || 'N/A'}</td>
                    <td>{getReportTypeBadge(report.type)}</td>
                    <td>{getReportStatusBadge(report.status)}</td>
                    <td>{new Date(report.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <button 
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => handleViewReport(report)}
                      >
                        <FaEye className="me-1" />
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Report Details Modal */}
      <Modal show={showReportModal} onHide={handleCloseReportModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết báo cáo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedReport && (
            <div>
              <div className="row mb-4">
                <div className="col-md-6">
                  <h6>Thông tin báo cáo</h6>
                  <table className="table table-borderless">
                    <tbody>
                      <tr>
                        <th>Mã đơn hàng:</th>
                        <td>#{selectedReport.order_id?._id ? selectedReport.order_id._id.slice(-6) : 'N/A'}</td>
                      </tr>
                      <tr>
                        <th>Loại báo cáo:</th>
                        <td>{getReportTypeBadge(selectedReport.type)}</td>
                      </tr>
                      <tr>
                        <th>Trạng thái:</th>
                        <td>{getReportStatusBadge(selectedReport.status)}</td>
                      </tr>
                      <tr>
                        <th>Ngày tạo:</th>
                        <td>{new Date(selectedReport.createdAt).toLocaleString('vi-VN')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="col-md-6">
                  <h6>Thông tin người liên quan</h6>
                  <table className="table table-borderless">
                    <tbody>
                      <tr>
                        <th>Người báo cáo:</th>
                        <td>{selectedReport.reporterID?.fullName || 'N/A'}</td>
                      </tr>
                      <tr>
                        <th>Email:</th>
                        <td>{selectedReport.reporterID?.email || 'N/A'}</td>
                      </tr>
                      <tr>
                        <th>Tài xế:</th>
                        <td>{selectedReport.reported_user_id?.fullName || 'N/A'}</td>
                      </tr>
                      <tr>
                        <th>Email tài xế:</th>
                        <td>{selectedReport.reported_user_id?.email || 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mb-4">
                <h6>Nội dung báo cáo</h6>
                <p className="border rounded p-3 bg-light">{selectedReport.description}</p>
              </div>

              {selectedReport && selectedReport.image && (
                <div className="mb-4">
                  <h6>Hình ảnh đính kèm</h6>
                  {renderImages(selectedReport.image)}
                </div>
              )}

              {selectedReport.status !== 'resolved' && selectedReport.status !== 'rejected' && (
                <div className="mb-4">
                  <h6>Ghi chú của admin</h6>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={adminNote}
                    onChange={(e) => {
                      if (e.target.value.length <= 256) setAdminNote(e.target.value);
                    }}
                    placeholder="Nhập ghi chú xử lý..."
                    maxLength={256}
                  />
                  <div className="text-end mt-1">
                    <small
                      className={adminNote.length === 256 ? 'text-danger' : 'text-muted'}
                    >
                      {adminNote.length}/256 ký tự
                    </small>
                  </div>
                </div>
              )}

              {selectedReport.admin_note && (
                <div className="mb-4">
                  <h6>Ghi chú trước đó</h6>
                  <p className="border rounded p-3 bg-light">{selectedReport.admin_note}</p>
                </div>
              )}

              {/* Action buttons for resolving dispute related to order payment */}
              {selectedReport.order_id?.status === 'disputed' && (
                <div className="alert alert-warning">
                    <FaInfoCircle className="me-2" />
                    Đơn hàng này đang ở trạng thái tranh chấp. Admin có thể quyết định hoàn tiền cho khách hàng hoặc giải ngân cho tài xế.
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseReportModal} disabled={resolveLoading}>
            Đóng
          </Button>
          {selectedReport && selectedReport.status === 'pending' && (
            <>
              <Button 
                variant="info" 
                onClick={() => handleUpdateReportStatus(selectedReport._id, 'reviewed')}
                disabled={adminNote.length > 256 || resolveLoading}
              >
                <FaEye className="me-1" />
                Đang xem xét
              </Button>
              <Button 
                variant="success" 
                onClick={() => handleUpdateReportStatus(selectedReport._id, 'resolved')}
                disabled={adminNote.length > 256 || resolveLoading}
              >
                <FaCheck className="me-1" />
                Giải quyết
              </Button>
              <Button 
                variant="danger" 
                onClick={() => handleUpdateReportStatus(selectedReport._id, 'rejected')}
                disabled={adminNote.length > 256 || resolveLoading}
              >
                <FaTimes className="me-1" />
                Từ chối
              </Button>
            </>
          )}
          {selectedReport && selectedReport.status === 'reviewed' && (
            <>
              <Button 
                variant="success" 
                onClick={() => handleUpdateReportStatus(selectedReport._id, 'resolved')}
                disabled={adminNote.length > 256 || resolveLoading}
              >
                <FaCheck className="me-1" />
                Giải quyết
              </Button>
              <Button 
                variant="danger" 
                onClick={() => handleUpdateReportStatus(selectedReport._id, 'rejected')}
                disabled={adminNote.length > 256 || resolveLoading}
              >
                <FaTimes className="me-1" />
                Từ chối
              </Button>
            </>
          )}
          {selectedReport && selectedReport.order_id?.status === 'disputed' && (selectedReport.status !== 'resolved' && selectedReport.status !== 'rejected') && (
            // Các nút này sẽ gọi API để giải quyết tranh chấp tài chính của đơn hàng
            // Lưu ý: Logic này có thể phức tạp hơn tùy thuộc vào tích hợp VNPAY (hoàn tiền)
            // Và có thể nên được xử lý tập trung ở AdminCommissionManagement
            <>
              <Button
                variant="outline-success"
                onClick={() => handleResolveOrderDispute(selectedReport.order_id._id, 'disbursed_to_driver')}
                disabled={resolveLoading}
              >
                <FaCheck className="me-1" />
                Giải ngân cho TX
              </Button>
              <Button
                variant="outline-danger"
                onClick={() => handleResolveOrderDispute(selectedReport.order_id._id, 'refunded_to_user')}
                disabled={resolveLoading}
              >
                <FaTimes className="me-1" />
                Hoàn tiền cho KH
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>

      {/* Image Modal */}
      <Modal show={showImageModal} onHide={() => setShowImageModal(false)} centered size="xl">
        <Modal.Header closeButton />
        <Modal.Body className="text-center p-0">
          <img 
            src={selectedImage}
            alt="Enlarged report evidence" 
            className="img-fluid"
            style={{maxWidth: '100%', maxHeight: '80vh'}}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Found';
            }}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ReportManagement;