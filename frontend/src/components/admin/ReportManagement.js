import React, { useState, useEffect } from 'react';
import { FaEye, FaCheck, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { adminAPI } from '../../services/api';
import { toast } from 'react-toastify';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const ReportManagement = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

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
    setAdminNote('');
    setShowReportModal(true);
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setSelectedReport(null);
    setAdminNote('');
  };

  const handleUpdateReportStatus = async (reportId, status) => {
    try {
      await adminAPI.updateReportStatus(reportId, {
        status,
        admin_note: adminNote
      });
      toast.success('Cập nhật trạng thái báo cáo thành công');
      handleCloseReportModal();
      fetchReports();
    } catch (error) {
      console.error('Error updating report status:', error);
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái báo cáo');
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
    
    // Convert to array if it's a string, or use existing array
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
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseReportModal}>
            Đóng
          </Button>
          {selectedReport && selectedReport.status === 'pending' && (
            <>
              <Button 
                variant="info" 
                onClick={() => handleUpdateReportStatus(selectedReport._id, 'reviewed')}
                disabled={adminNote.length > 256}
              >
                <FaEye className="me-1" />
                Đang xem xét
              </Button>
              <Button 
                variant="success" 
                onClick={() => handleUpdateReportStatus(selectedReport._id, 'resolved')}
                disabled={adminNote.length > 256}
              >
                <FaCheck className="me-1" />
                Giải quyết
              </Button>
              <Button 
                variant="danger" 
                onClick={() => handleUpdateReportStatus(selectedReport._id, 'rejected')}
                disabled={adminNote.length > 256}
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
                disabled={adminNote.length > 256}
              >
                <FaCheck className="me-1" />
                Giải quyết
              </Button>
              <Button 
                variant="danger" 
                onClick={() => handleUpdateReportStatus(selectedReport._id, 'rejected')}
                disabled={adminNote.length > 256}
              >
                <FaTimes className="me-1" />
                Từ chối
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