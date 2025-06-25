import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaStar, FaBell, FaSignOutAlt } from 'react-icons/fa';
import axios from 'axios';
import logo from '../../assets/img/favicon.png';

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
        
        <div className="d-flex align-items-center">
          <div className="me-3">
            <FaBell className="me-2" />
            <span className="badge bg-danger">2</span>
          </div>
          <div className="me-3 text-white">
            {driverAvgRate.avg.toFixed(1)}<FaStar className="me-1" />             
          </div>
          <div className="dropdown">
            <button className="btn btn-outline-light dropdown-toggle d-flex align-items-center" data-bs-toggle="dropdown">
              {shipperProfile.avatar && getImageUrl(shipperProfile.avatar) ? (
                <img 
                  src={getImageUrl(shipperProfile.avatar)} 
                  alt="Avatar" 
                  className="rounded-circle me-2" 
                  style={{width: '30px', height: '30px', objectFit: 'cover'}}
                />
              ) : (
                <FaUser className="me-2" />
              )}
              {shipperProfile.name}
            </button>
            <ul className="dropdown-menu">
              <li><button className="dropdown-item" onClick={() => navigate('/shipper/profile')}><FaUser className="me-2" />Thông tin cá nhân</button></li>
              <li><hr className="dropdown-divider" /></li>
              <li><button className="dropdown-item" onClick={handleLogout}><FaSignOutAlt className="me-2" />Đăng xuất</button></li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default ShipperHeader; 