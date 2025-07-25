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

  return (
    <div className="min-vh-100 myreports-bg">
      <Header />
      <style>{`
        .myreports-bg {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
        }
        .myreports-card {
          border-radius: 18px;
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.12);
          border: none;
          background: rgba(255,255,255,0.97);
        }
        .myreports-card .card-header {
          border-radius: 18px 18px 0 0;
          background: linear-gradient(90deg, #6a82fb 0%, #fc5c7d 100%);
          color: #fff;
        }
        .myreports-card .card-body {
          padding: 2.5rem 1.5rem;
        }
        .myreports-btn-lg {
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 12px;
          padding: 0.9rem 1.5rem;
          box-shadow: 0 2px 8px rgba(31,38,135,0.08);
          transition: background 0.2s, color 0.2s, transform 0.2s;
        }
        .myreports-btn-lg:active, .myreports-btn-lg:focus {
          outline: none;
          box-shadow: 0 0 0 2px #6a82fb33;
        }
        .myreports-btn-lg.btn-outline-primary {
          border: 2px solid #6a82fb;
          color: #6a82fb;
          background: #fff;
        }
        .myreports-btn-lg.btn-outline-primary:hover {
          background: linear-gradient(90deg, #6a82fb 0%, #fc5c7d 100%);
          color: #fff;
          border: none;
          transform: scale(1.04);
        }
        .myreports-card .card {
          border-radius: 14px;
          box-shadow: 0 2px 8px rgba(31,38,135,0.07);
        }
        .myreports-card .card:hover {
          box-shadow: 0 4px 16px rgba(31,38,135,0.13);
          transform: translateY(-2px) scale(1.01);
        }
        @media (max-width: 768px) {
          .myreports-card .card-body {
            padding: 1.2rem 0.5rem;
          }
        }
      `}</style>
      <div className="container my-5">
        <button 
          className="btn btn-outline-primary mb-4 myreports-btn-lg"
          onClick={() => navigate('/home')}
        >
          <FaArrowLeft className="me-2" />
          Quay lại
        </button>
        <div className="card myreports-card">
          <div className="card-header">
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