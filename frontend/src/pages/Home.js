import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShippingFast, FaMapMarkerAlt, FaHistory, FaExclamationTriangle, FaUser } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import Header from '../components/Header';

const Home = () => {
  const navigate = useNavigate();

  const sidebarStyle = {
    background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
    borderRadius: '15px',
    minHeight: '500px'
  };

  return (
    <div className="min-vh-100" style={{backgroundColor: '#f5f7fa'}}>
      <Header />

      <div className="container my-5">
        <div className="row">
          {/* Sidebar */}
          <div className="col-md-3 mb-4">
            <div className="p-4" style={sidebarStyle}>
              <h5 className="fw-bold mb-4">Menu</h5>
              <div className="list-group list-group-flush">
                <button 
                  className="list-group-item list-group-item-action border-0"
                  onClick={() => navigate('/new-order')}
                >
                  <FaShippingFast className="me-2" />
                  Đặt đơn mới
                </button>
                <button 
                  className="list-group-item list-group-item-action border-0"
                  onClick={() => navigate('/order-tracking')}
                >
                  <FaMapMarkerAlt className="me-2" />
                  Theo dõi đơn hàng
                </button>
                <button 
                  className="list-group-item list-group-item-action border-0"
                  onClick={() => navigate('/order-history')}
                >
                  <FaHistory className="me-2" />
                  Lịch sử đơn hàng
                </button>
                <button 
                  className="list-group-item list-group-item-action border-0"
                  onClick={() => navigate('/my-reports')}
                >
                  <FaExclamationTriangle className="me-2" />
                  Báo cáo của tôi
                </button>
                <button 
                  className="list-group-item list-group-item-action border-0"
                  onClick={() => navigate('/profile')}
                >
                  <FaUser className="me-2" />
                  Thông tin cá nhân
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-md-9">
            <div className="card">
              <div className="card-body text-center py-5">
                <h2 className="mb-4">Chào mừng đến với Tốc Hành Hòa Lạc</h2>
                <p className="text-muted mb-4">Vui lòng chọn một chức năng từ menu bên trái để bắt đầu.</p>
                <div className="row justify-content-center">
                  <div className="col-md-4">
                    <button 
                      className="btn btn-primary btn-lg w-100 mb-3"
                      onClick={() => navigate('/new-order')}
                    >
                      <FaShippingFast className="me-2" />
                      Đặt đơn mới
                    </button>
                  </div>
                  <div className="col-md-4">
                    <button 
                      className="btn btn-warning btn-lg w-100 mb-3"
                      onClick={() => navigate('/order-tracking')}
                    >
                      <FaMapMarkerAlt className="me-2" />
                      Theo dõi đơn hàng
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

export default Home; 