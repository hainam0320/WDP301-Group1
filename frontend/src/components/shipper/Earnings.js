import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaDollarSign, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import ShipperHeader from './ShipperHeader';

const Earnings = () => {
  const navigate = useNavigate();
  const [earnings, setEarnings] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    total: 0,
    deliveries: {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      total: 0
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const BASE_URL = 'http://localhost:9999';

  const fetchEarnings = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vui lòng đăng nhập lại');
        return;
      }

      console.log('Fetching earnings with token:', token);
      const response = await axios.get(`${BASE_URL}/api/shipper/earnings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Earnings response:', response.data);
      
      if (response.data.success) {
        setEarnings(response.data.data);
      } else {
        setError('Không thể tải dữ liệu: ' + (response.data.message || 'Lỗi không xác định'));
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
      if (error.response) {
        // Lỗi từ server
        console.error('Server error:', error.response.data);
        setError(`Lỗi server: ${error.response.data.message || 'Không xác định'}`);
      } else if (error.request) {
        // Không nhận được response
        console.error('No response:', error.request);
        setError('Không thể kết nối đến server');
      } else {
        // Lỗi khác
        console.error('Error:', error.message);
        setError(`Lỗi: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

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
          <div className="card-header bg-warning text-dark">
            <h4 className="mb-0"><FaDollarSign className="me-2" />Thống kê thu nhập</h4>
          </div>
          <div className="card-body">
            {error && <div className="alert alert-danger">{error}</div>}
            {isLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-warning" role="status">
                  <span className="visually-hidden">Đang tải...</span>
                </div>
              </div>
            ) : (
              <div className="row">
                <div className="col-md-6 mb-4">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h5 className="card-title">Thu nhập hôm nay</h5>
                      <h3 className="text-success">{earnings.today.toLocaleString()} VNĐ</h3>
                      <small className="text-muted">
                        {earnings.deliveries.today > 0 ? `${earnings.deliveries.today} đơn hàng hoàn thành` : 'Chưa có đơn hàng nào'}
                      </small>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mb-4">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h5 className="card-title">Thu nhập tuần này</h5>
                      <h3 className="text-info">{earnings.thisWeek.toLocaleString()} VNĐ</h3>
                      <small className="text-muted">
                        {earnings.deliveries.thisWeek > 0 ? `${earnings.deliveries.thisWeek} đơn hàng hoàn thành` : 'Chưa có đơn hàng nào'}
                      </small>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mb-4">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h5 className="card-title">Thu nhập tháng này</h5>
                      <h3 className="text-warning">{earnings.thisMonth.toLocaleString()} VNĐ</h3>
                      <small className="text-muted">
                        {earnings.deliveries.thisMonth > 0 ? `${earnings.deliveries.thisMonth} đơn hàng hoàn thành` : 'Chưa có đơn hàng nào'}
                      </small>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mb-4">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h5 className="card-title">Tổng thu nhập</h5>
                      <h3 className="text-primary">{earnings.total.toLocaleString()} VNĐ</h3>
                      <small className="text-muted">
                        {earnings.deliveries.total > 0 ? `${earnings.deliveries.total} đơn hàng` : 'Chưa có đơn hàng nào'}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Earnings; 