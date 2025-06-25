import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';
import { userAPI } from '../services/api';
import Header from './Header';

const MyReports = () => {
  const [myReports, setMyReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const navigate = useNavigate();

  const fetchMyReports = async () => {
    try {
      setLoadingReports(true);
      const response = await userAPI.getUserReports();
      setMyReports(response.data.reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setMessage({ 
        type: 'error', 
        content: 'Lỗi khi tải danh sách báo cáo' 
      });
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchMyReports();
  }, []);

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
        <div className="card" style={cardStyle}>
          <div className="card-header bg-primary text-white">
            <h4 className="mb-0"><FaExclamationTriangle className="me-2" />Báo cáo của tôi</h4>
          </div>
          <div className="card-body">
            {loadingReports ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Đang tải...</span>
                </div>
              </div>
            ) : myReports.length === 0 ? (
              <div className="alert alert-info">
                Bạn chưa có báo cáo nào
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Tài xế</th>
                      <th>Loại</th>
                      <th>Trạng thái</th>
                      <th>Ngày tạo</th>
                      <th>Phản hồi từ Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myReports.map(report => (
                      <tr key={report._id}>
                        <td>#{report.order_id?._id?.slice(-6) || 'N/A'}</td>
                        <td>{report.reported_user_id?.fullName || 'N/A'}</td>
                        <td>{getReportTypeBadge(report.type)}</td>
                        <td>{getReportStatusBadge(report.status)}</td>
                        <td>{new Date(report.createdAt).toLocaleDateString('vi-VN')}</td>
                        <td>
                          <div style={{maxWidth: '200px'}}>
                            {report.admin_note ? (
                              <div className="text-wrap small">
                                {report.admin_note}
                                <div className="text-muted mt-1">
                                  {new Date(report.updatedAt).toLocaleString('vi-VN')}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted">Chưa có phản hồi</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyReports; 