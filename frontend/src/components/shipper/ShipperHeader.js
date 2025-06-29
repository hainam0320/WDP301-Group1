import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaStar, FaSignOutAlt } from 'react-icons/fa';
import axios from 'axios';
import logo from '../../assets/img/favicon.png';
import NotificationBell from '../NotificationBell';

const ShipperHeader = () => {
  const navigate = useNavigate();
  const BASE_URL = 'http://localhost:9999';
  
  const [shipperProfile, setShipperProfile] = useState({
    name: '',
    avatar: ''
  });

  const [driverAvgRate, setDriverAvgRate] = useState({ avg: 0, count: 0 });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setShipperProfile(prev => ({
        ...prev,
        name: user.fullName,
        avatar: user.avatar || ''
      }));
    }
  }, []);

  useEffect(() => {
    const fetchDriverAvgRate = async () => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user._id) return;
      try {
        const res = await axios.get(`${BASE_URL}/api/rate/driver/${user._id}/average`);
        setDriverAvgRate(res.data);
      } catch (err) {
        setDriverAvgRate({ avg: 0, count: 0 });
      }
    };
    fetchDriverAvgRate();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
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

  const headerStyle = {
    background: 'linear-gradient(135deg, #28a745, #20c997)',
    color: 'white'
  };

  return (
    <nav className="navbar navbar-expand-lg" style={headerStyle}>
      <div className="container">
        <div className="d-flex align-items-center">
          <img src={logo} alt="Logo" width="40" height="40" className="me-3" />
          <span className="navbar-brand h3 mb-0">Shipper Dashboard</span>
        </div>
        
        <nav className="header-nav ms-auto">
          <ul className="d-flex align-items-center">
            
            <li className="nav-item me-3 text-white">
              {driverAvgRate.avg.toFixed(1)}<FaStar className="ms-1" /> ({driverAvgRate.count} đánh giá)
            </li>

            <NotificationBell />

            <li className="nav-item dropdown pe-3">
              <a className="nav-link nav-profile d-flex align-items-center pe-0" href="#" data-bs-toggle="dropdown">
                {shipperProfile.avatar && getImageUrl(shipperProfile.avatar) ? (
                  <img 
                    src={getImageUrl(shipperProfile.avatar)} 
                    alt="Avatar" 
                    className="rounded-circle" 
                    style={{width: '30px', height: '30px', objectFit: 'cover'}}
                  />
                ) : (
                  <FaUser />
                )}
                <span className="d-none d-md-block dropdown-toggle ps-2">{shipperProfile.name}</span>
              </a>

              <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow profile">
                <li className="dropdown-header">
                  <h6>{shipperProfile.name}</h6>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <a className="dropdown-item d-flex align-items-center" href="#" onClick={() => navigate('/shipper/profile')}>
                    <FaUser className="me-2" />
                    <span>Thông tin cá nhân</span>
                  </a>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <a className="dropdown-item d-flex align-items-center" href="#" onClick={handleLogout}>
                    <FaSignOutAlt className="me-2" />
                    <span>Đăng xuất</span>
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </nav>
  );
};

export default ShipperHeader; 