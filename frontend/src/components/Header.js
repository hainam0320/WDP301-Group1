import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaBell, FaSignOutAlt } from 'react-icons/fa';
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
  );
};

export default Header; 