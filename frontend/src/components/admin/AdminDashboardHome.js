import React, { useState, useEffect } from 'react';
import { FaUsers, FaShippingFast, FaChartBar, FaDollarSign } from 'react-icons/fa';
import { adminAPI } from '../../services/api';
import { toast } from 'react-toastify';

const AdminDashboardHome = () => {
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalShippers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    todayOrders: 0,
    activeShippers: 0,
    completionRate: 0,
    averageRating: 0,
    averageDeliveryTime: 0,
    monthlyGrowth: 0
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const statsData = await adminAPI.getStats();
      setSystemStats(statsData.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = {
    borderRadius: '15px',
    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
    border: 'none'
  };

  return (
    <div>
      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-2 mb-3">
          <div className="card bg-primary text-white" style={cardStyle}>
            <div className="card-body text-center">
              <FaUsers size={30} className="mb-2" />
              <h6>Người dùng</h6>
              <h4>{systemStats.totalUsers}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-2 mb-3">
          <div className="card bg-success text-white" style={cardStyle}>
            <div className="card-body text-center">
              <FaShippingFast size={30} className="mb-2" />
              <h6>Shipper</h6>
              <h4>{systemStats.totalShippers}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-2 mb-3">
          <div className="card bg-info text-white" style={cardStyle}>
            <div className="card-body text-center">
              <FaChartBar size={30} className="mb-2" />
              <h6>Tổng đơn</h6>
              <h4>{systemStats.totalOrders}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-2 mb-3">
          <div className="card bg-warning text-white" style={cardStyle}>
            <div className="card-body text-center">
              <FaDollarSign size={30} className="mb-2" />
              <h6>Doanh thu</h6>
              <h6>{(systemStats.totalRevenue / 1000000).toFixed(0)}M</h6>
            </div>
          </div>
        </div>
        <div className="col-md-2 mb-3">
          <div className="card bg-danger text-white" style={cardStyle}>
            <div className="card-body text-center">
              <FaShippingFast size={30} className="mb-2" />
              <h6>Hôm nay</h6>
              <h4>{systemStats.todayOrders}</h4>
            </div>
          </div>
        </div>
        
      </div>

      {/* Dashboard Overview */}
      <div className="card" style={cardStyle}>
        <div className="card-header bg-primary text-white">
          <h4 className="mb-0"><FaChartBar className="me-2" />Tổng quan hệ thống</h4>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-4">
              <div className="card bg-light">
                <div className="card-body">
                  <h5 className="card-title">Hoạt động hôm nay</h5>
                  <ul className="list-unstyled">
                    <li>• {systemStats.todayOrders} đơn hàng mới</li>
                   
                    <li>• {systemStats.newUsers} người dùng mới đăng ký</li>
                    <li>• {systemStats.completedOrders} đơn hàng hoàn thành</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-md-6 mb-4">
              <div className="card bg-light">
                <div className="card-body">
                  <h5 className="card-title">Thống kê nhanh</h5>
                  <ul className="list-unstyled">
                    <li>• Tỷ lệ hoàn thành: {systemStats.completionRate.toFixed(1)}%</li>
                    <li>• Đánh giá trung bình: {systemStats.averageRating.toFixed(1)}/5</li>
                    
                    <li>• Tăng trưởng tháng: +{systemStats.monthlyGrowth}%</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardHome; 