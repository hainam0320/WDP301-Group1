import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaShippingFast, FaCar, FaMapMarkerAlt, FaWeight,FaStar, FaRuler, FaHistory, FaBell, FaSignOutAlt, FaCamera, FaPhone, FaImage, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';
import logo from '../assets/img/favicon.png';
import { userAPI } from '../services/api';
import DeliveryMap from '../components/DeliveryMap';
import RideMap from '../components/RideMap';
import { useMapEvents } from 'react-leaflet';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap';

const Home = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    return {
      name: user?.fullName || '',
      avatar: user?.avatar || ''
    };
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    const BASE_URL = 'http://localhost:9999';
    
    if (path.startsWith('uploads/')) {
      return `${BASE_URL}/${path}`;
    }
    
    const relativePath = path.split('\\uploads\\')[1];
    if (relativePath) {
      return `${BASE_URL}/uploads/${relativePath}`;
    }
    
    return null;
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #007bff, #6f42c1)',
    color: 'white'
  };

  const sidebarStyle = {
    background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
    borderRadius: '15px',
    minHeight: '500px'
  };

  return (
    <div className="min-vh-100" style={{backgroundColor: '#f5f7fa'}}>
      {/* Header */}
      <nav className="navbar navbar-expand-lg" style={headerStyle}>
        <div className="container">
          <div className="d-flex align-items-center">
            <img src={logo} alt="Logo" width="40" height="40" className="me-3" />
            <span className="navbar-brand h3 mb-0">Tốc Hành Hòa Lạc</span>
          </div>
          
          <div className="d-flex align-items-center">
            <div className="me-3">
              <FaBell className="me-2" />
              <span className="badge bg-danger">3</span>
            </div>
            <div className="dropdown">
              <button className="btn btn-outline-light dropdown-toggle d-flex align-items-center" data-bs-toggle="dropdown">
                {userProfile.avatar ? (
                  <img 
                    src={getImageUrl(userProfile.avatar)} 
                    alt="Avatar" 
                    className="rounded-circle me-2" 
                    style={{width: '30px', height: '30px', objectFit: 'cover'}}
                  />
                ) : (
                  <FaUser className="me-2" />
                )}
                {userProfile.name}
              </button>
              <ul className="dropdown-menu">
                <li><button className="dropdown-item" onClick={() => navigate('/profile')}><FaUser className="me-2" />Thông tin cá nhân</button></li>
                <li><hr className="dropdown-divider" /></li>
                <li><button className="dropdown-item" onClick={handleLogout}><FaSignOutAlt className="me-2" />Đăng xuất</button></li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

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
                  onClick={() => navigate('/profile')}
                >
                  <FaUser className="me-2" />
                  Thông tin cá nhân
                </button>
                <button 
                  className="list-group-item list-group-item-action border-0"
                  onClick={() => navigate('/my-reports')}
                >
                  <FaExclamationTriangle className="me-2" />
                  Báo cáo của tôi
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