import React from 'react';
import { useNavigate, Routes, Route, Link } from 'react-router-dom';
import { FaUser, FaShippingFast, FaUsers, FaDollarSign, FaChartBar, FaCog, FaBell, FaSignOutAlt, FaExclamationTriangle, FaMoneyBillWave } from 'react-icons/fa'; // Import FaMoneyBillWave cho icon mới
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from '../assets/img/favicon.png';

// Import components
import AdminDashboardHome from './admin/AdminDashboardHome';
import UserManagement from './admin/UserManagement';
import ShipperManagement from './admin/ShipperManagement';
import OrderManagement from './admin/OrderManagement';
import RevenueReport from './admin/RevenueReport';
import ReportManagement from './admin/ReportManagement';

// THAY THẾ IMPORT CŨ BẰNG IMPORT MỚI
import AdminPayoutManagement from './admin/AdminPayoutManagement'; 
import PaymentSuccess from '../pages/PaymentSuccess';
import PaymentFail from '../pages/PaymentFail';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const headerStyle = {
    background: 'linear-gradient(135deg, #dc3545, #fd7e14)',
    color: 'white'
  };

  const sidebarStyle = {
    background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
    borderRadius: '15px',
    minHeight: '500px'
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  return (
    <div className="min-vh-100" style={{backgroundColor: '#f5f7fa'}}>
      {/* Header */}
      <nav className="navbar navbar-expand-lg" style={headerStyle}>
        <div className="container">
          <div className="d-flex align-items-center">
            <img src={logo} alt="Logo" width="40" height="40" className="me-3" />
            <span className="navbar-brand h3 mb-0">Admin Dashboard</span>
          </div>
          
          <div className="d-flex align-items-center">
            <div className="me-3">
              <FaBell className="me-2" />
              <span className="badge bg-danger">5</span>
            </div>
            <div className="dropdown">
              <button className="btn btn-outline-light dropdown-toggle" data-bs-toggle="dropdown">
                <FaUser className="me-2" />
                Administrator
              </button>
              <ul className="dropdown-menu">
               
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
                <Link 
                  to="/admin"
                  className="list-group-item list-group-item-action border-0"
                >
                  <FaChartBar className="me-2" />
                  Tổng quan
                </Link>
                <Link 
                  to="/admin/users"
                  className="list-group-item list-group-item-action border-0"
                >
                  <FaUsers className="me-2" />
                  Quản lý người dùng
                </Link>
                <Link 
                  to="/admin/shippers"
                  className="list-group-item list-group-item-action border-0"
                >
                  <FaShippingFast className="me-2" />
                  Quản lý shipper
                </Link>
                <Link 
                  to="/admin/orders"
                  className="list-group-item list-group-item-action border-0"
                >
                  <FaShippingFast className="me-2" />
                  Quản lý đơn hàng
                </Link>
                <Link 
                  to="/admin/revenue"
                  className="list-group-item list-group-item-action border-0"
                >
                  <FaDollarSign className="me-2" />
                  Báo cáo doanh thu
                </Link>
                {/* CẬP NHẬT LINK TRỎ ĐẾN COMPONENT MỚI */}
                <Link 
                  to="/admin/payout-management" // Đổi path
                  className="list-group-item list-group-item-action border-0"
                >
                  <FaMoneyBillWave className="me-2" /> {/* Icon mới */}
                  Quản lý chi trả
                </Link>
                <Link 
                  to="/admin/reports"
                  className="list-group-item list-group-item-action border-0"
                >
                  <FaExclamationTriangle className="me-2" />
                  Quản lý báo cáo
                </Link>
              
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-md-9">
            <Routes>
              <Route index element={<AdminDashboardHome />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="shippers" element={<ShipperManagement />} />
              <Route path="orders" element={<OrderManagement />} />
              <Route path="revenue" element={<RevenueReport />} />
              <Route path="reports" element={<ReportManagement />} />
              <Route path="payout-management" element={<AdminPayoutManagement />} /> {/* Đổi path và component */}
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;