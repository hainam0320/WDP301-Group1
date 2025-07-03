import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaShippingFast, FaDollarSign, FaHistory, FaStar, FaRoute, FaCheckCircle, FaPercentage } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import ShipperHeader from './ShipperHeader';
import { transactionAPI } from '../../services/api';

const ShipperDashboard = () => {
  const navigate = useNavigate();
  const BASE_URL = 'http://localhost:9999';
  
  const [earnings, setEarnings] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    total: 0,
    totalDeliveries: 0
  });
  const [pendingCommissionCount, setPendingCommissionCount] = useState(0);

  useEffect(() => {
    fetchEarnings();
    fetchPendingCommissions();

    // Cập nhật số lượng hoa hồng mỗi 5 phút
    const interval = setInterval(fetchPendingCommissions, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchEarnings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/shipper/earnings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data.success) {
        setEarnings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  };

  const fetchPendingCommissions = async () => {
    try {
      const response = await transactionAPI.getPendingCommissions();
      setPendingCommissionCount(response.data.count || 0);
    } catch (error) {
      console.error('Error fetching pending commissions:', error);
    }
  };

  const cardStyle = {
    borderRadius: '15px',
    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
    border: 'none'
  };

  const sidebarStyle = {
    background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
    borderRadius: '15px',
    minHeight: '500px'
  };

  return (
    <div className="min-vh-100" style={{backgroundColor: '#f5f7fa'}}>
      <ShipperHeader />

      <div className="container my-5">
        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div className="card bg-success text-white" style={cardStyle}>
              <div className="card-body text-center">
                <FaDollarSign size={30} className="mb-2" />
                <h5>Hôm nay</h5>
                <h4>{earnings.today.toLocaleString()} VNĐ</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-info text-white" style={cardStyle}>
              <div className="card-body text-center">
                <FaShippingFast size={30} className="mb-2" />
                <h5>Tuần này</h5>
                <h4>{earnings.thisWeek.toLocaleString()} VNĐ</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-warning text-white" style={cardStyle}>
              <div className="card-body text-center">
                <FaHistory size={30} className="mb-2" />
                <h5>Tháng này</h5>
                <h4>{earnings.thisMonth.toLocaleString()} VNĐ</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-primary text-white" style={cardStyle}>
              <div className="card-body text-center">
                <FaStar size={30} className="mb-2" />
                <h5>Tổng giao</h5>
                <h4>{earnings.totalDeliveries} đơn</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Sidebar */}
          <div className="col-md-3 mb-4">
            <div className="p-4" style={sidebarStyle}>
              <h5 className="fw-bold mb-4">Menu</h5>
              <div className="list-group list-group-flush">
                <button 
                  className="list-group-item list-group-item-action border-0"
                  onClick={() => navigate('/shipper/available-orders')}
                >
                  <FaShippingFast className="me-2" />
                  Đơn hàng khả dụng
                </button>
                <button 
                  className="list-group-item list-group-item-action border-0"
                  onClick={() => navigate('/shipper/my-orders')}
                >
                  <FaRoute className="me-2" />
                  Đơn hàng đang thực hiện
                </button>
                <button 
                  className="list-group-item list-group-item-action border-0"
                  onClick={() => navigate('/shipper/completed-orders')}
                >
                  <FaCheckCircle className="me-2" />
                  Đơn hàng đã hoàn thành
                </button>
                <button 
                  className="list-group-item list-group-item-action border-0"
                  onClick={() => navigate('/shipper/earnings')}
                >
                  <FaDollarSign className="me-2" />
                  Thu nhập
                </button>
                <button 
                  className="list-group-item list-group-item-action border-0 d-flex align-items-center justify-content-between"
                  onClick={() => navigate('/shipper/commissions')}
                >
                  <span>
                    <FaPercentage className="me-2" />
                    Thanh toán hoa hồng
                  </span>
                  {pendingCommissionCount > 0 && (
                    <span className="badge bg-danger">{pendingCommissionCount}</span>
                  )}
                </button>
                <button 
                  className="list-group-item list-group-item-action border-0"
                  onClick={() => navigate('/shipper/profile')}
                >
                  <FaUser className="me-2" />
                  Thông tin cá nhân
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-md-9">
            <div className="card" style={cardStyle}>
              <div className="card-body text-center py-5">
                <h2 className="mb-4">Chào mừng đến với Shipper Dashboard</h2>
                <p className="text-muted mb-4">Vui lòng chọn một chức năng từ menu bên trái để bắt đầu.</p>
                <div className="row justify-content-center">
                  <div className="col-md-4">
                    <button 
                      className="btn btn-success btn-lg w-100 mb-3"
                      onClick={() => navigate('/shipper/available-orders')}
                    >
                      <FaShippingFast className="me-2" />
                      Đơn hàng khả dụng
                    </button>
                  </div>
                  <div className="col-md-4">
                    <button 
                      className="btn btn-primary btn-lg w-100 mb-3"
                      onClick={() => navigate('/shipper/my-orders')}
                    >
                      <FaRoute className="me-2" />
                      Đơn hàng đang thực hiện
                    </button>
                  </div>
                  <div className="col-md-4">
                    <button 
                      className="btn btn-warning btn-lg w-100 mb-3"
                      onClick={() => navigate('/shipper/commissions')}
                    >
                      <FaPercentage className="me-2" />
                      Thanh toán hoa hồng
                      {pendingCommissionCount > 0 && (
                        <span className="badge bg-danger ms-2">{pendingCommissionCount}</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipperDashboard; 