import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaStar, FaSignOutAlt } from 'react-icons/fa';
import axios from 'axios';
import logo from '../../assets/img/favicon.png';
import NotificationBell from '../NotificationBell';
import { transactionAPI } from '../../services/api';

const ShipperHeader = () => {
  const navigate = useNavigate();
  const BASE_URL = 'http://localhost:9999';
  
  const [shipperProfile, setShipperProfile] = useState({
    name: '',
    avatar: ''
  });

  const [driverAvgRate, setDriverAvgRate] = useState({ avg: 0, count: 0 });
  const [showCommissionWarning, setShowCommissionWarning] = useState(false);

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

  useEffect(() => {
    const fetchOldPendingCommissions = async () => {
      try {
        const response = await transactionAPI.getPendingCommissions();
        const transactions = response.data.transactions || [];
        const now = new Date();
        const hasOld = transactions.some(tran => {
          if (!tran.createdAt) return false;
          const created = new Date(tran.createdAt);
          const diffDays = (now - created) / (1000 * 60 * 60 * 24);
          return diffDays >= 3;
        });
        setShowCommissionWarning(hasOld);
      } catch (err) {
        setShowCommissionWarning(false);
      }
    };
    fetchOldPendingCommissions();
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
        {showCommissionWarning && (
          <div className="alert alert-warning mb-0 ms-4 py-2 px-3" style={{fontWeight:600, fontSize:'1rem'}}>
            Bạn có đơn hoa hồng đã quá hạn 3 ngày, vui lòng thanh toán!
          </div>
        )}
        <nav className="header-nav ms-auto">
          <ul className="d-flex align-items-center">
            
            <li className="nav-item me-3 text-white">
              {driverAvgRate.avg.toFixed(1)}<FaStar className="ms-1" /> ({driverAvgRate.count} đánh giá)
            </li>

            <NotificationBell />

            <li className="nav-item dropdown pe-3">
              <button className="nav-link nav-profile d-flex align-items-center pe-0 btn btn-link" data-bs-toggle="dropdown">
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
              </button>

              <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow profile">
                <li className="dropdown-header">
                  <h6>{shipperProfile.name}</h6>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item d-flex align-items-center" onClick={() => navigate('/shipper/profile')}>
                    <FaUser className="me-2" />
                    <span>Thông tin cá nhân</span>
                  </button>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item d-flex align-items-center" onClick={handleLogout}>
                    <FaSignOutAlt className="me-2" />
                    <span>Đăng xuất</span>
                  </button>
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