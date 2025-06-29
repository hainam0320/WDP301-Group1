import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaSignOutAlt } from 'react-icons/fa';
import NotificationBell from './NotificationBell';
import logo from '../assets/img/favicon.png';

const Header = () => {
  const navigate = useNavigate();
  const [userProfile] = useState(() => {
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

  return (
    <nav className="navbar navbar-expand-lg" style={headerStyle}>
      <div className="container">
        <div className="d-flex align-items-center">
          <img src={logo} alt="Logo" width="40" height="40" className="me-3" />
          <span className="navbar-brand h3 mb-0">Tốc Hành Hòa Lạc</span>
        </div>
        
        <nav className="header-nav ms-auto">
          <ul className="d-flex align-items-center">
            <NotificationBell />

            <li className="nav-item dropdown pe-3">
              <a className="nav-link nav-profile d-flex align-items-center pe-0" href="#" data-bs-toggle="dropdown">
                {userProfile.avatar ? (
                  <img 
                    src={getImageUrl(userProfile.avatar)} 
                    alt="Avatar" 
                    className="rounded-circle" 
                    style={{width: '30px', height: '30px', objectFit: 'cover'}}
                  />
                ) : (
                  <FaUser />
                )}
                <span className="d-none d-md-block dropdown-toggle ps-2">{userProfile.name}</span>
              </a>

              <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow profile">
                <li className="dropdown-header">
                  <h6>{userProfile.name}</h6>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <a className="dropdown-item d-flex align-items-center" href="#" onClick={() => navigate('/profile')}>
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

export default Header; 