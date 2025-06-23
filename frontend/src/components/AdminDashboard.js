import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaShippingFast, FaUsers, FaDollarSign, FaChartBar, FaCog, FaBell, FaSignOutAlt, FaEdit, FaTrash, FaEye, FaPlus, FaLock, FaLockOpen } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from '../assets/img/favicon.png';
import { adminAPI } from '../services/api';
import { toast } from 'react-toastify';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  
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

  const [users, setUsers] = useState([]);
  const [shippers, setShippers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [revenues, setRevenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      switch(activeTab) {
        case 'dashboard':
          const statsData = await adminAPI.getStats();
          setSystemStats(statsData.data);
          break;
          
        case 'users':
          const usersData = await adminAPI.getUsers();
          // Lọc chỉ lấy user thường
          setUsers(usersData.data.filter(user => user.type === 'user'));
          break;

        case 'shippers':
          const shippersData = await adminAPI.getUsers();
          // Lọc chỉ lấy shipper
          setShippers(shippersData.data.filter(user => user.type === 'driver'));
          break;
          
        case 'orders':
          const ordersData = await adminAPI.getOrders();
          setOrders(ordersData.data);
          break;
          
        case 'revenue':
          const revenueData = await adminAPI.getRevenue();
          setRevenues(revenueData.data);
          break;
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      try {
        await adminAPI.deleteUser(userId);
        toast.success('Xóa người dùng thành công');
        fetchDashboardData(); // Refresh users list
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Có lỗi xảy ra khi xóa người dùng');
      }
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleCloseModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus ? 'inactive' : 'active';
      await adminAPI.updateUserStatus(userId, newStatus);
      toast.success(`Tài khoản đã được ${newStatus === 'active' ? 'mở khóa' : 'khóa'} thành công`);
      fetchDashboardData(); // Refresh users list
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái tài khoản');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #dc3545, #fd7e14)',
    color: 'white'
  };

  const cardStyle = {
    borderRadius: '15px',
    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
    border: 'none'
  };

  const buttonStyle = {
    borderRadius: '10px',
    padding: '12px 24px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease'
  };

  const sidebarStyle = {
    background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
    borderRadius: '15px',
    minHeight: '500px'
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/150';
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:9999/${imagePath.replace(/\\/g, '/')}`;
  };

  const UserDetailsModal = () => {
    if (!selectedUser) return null;

    return (
      <Modal show={showUserModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Thông tin chi tiết người dùng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            <div className="col-md-4 text-center mb-3">
              <img 
                src={getImageUrl(selectedUser.avatar)}
                alt="Avatar" 
                className="rounded-circle img-thumbnail"
                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/150';
                }}
              />
              {selectedUser.type === 'driver' && (
                <div className="mt-3">
                  {selectedUser.licensePlateImage && (
                    <div className="mb-3">
                      <p className="mb-2">Ảnh biển số xe:</p>
                      <img 
                        src={getImageUrl(selectedUser.licensePlateImage)}
                        alt="Biển số xe" 
                        className="img-thumbnail"
                        style={{ maxWidth: '200px' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/150';
                        }}
                      />
                    </div>
                  )}
                  {selectedUser.cmndFront && (
                    <div className="mb-3">
                      <p className="mb-2">CMND mặt trước:</p>
                      <img 
                        src={getImageUrl(selectedUser.cmndFront)}
                        alt="CMND mặt trước" 
                        className="img-thumbnail"
                        style={{ maxWidth: '200px' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/150';
                        }}
                      />
                    </div>
                  )}
                  {selectedUser.cmndBack && (
                    <div className="mb-3">
                      <p className="mb-2">CMND mặt sau:</p>
                      <img 
                        src={getImageUrl(selectedUser.cmndBack)}
                        alt="CMND mặt sau" 
                        className="img-thumbnail"
                        style={{ maxWidth: '200px' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/150';
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="col-md-8">
              <table className="table">
                <tbody>
                  <tr>
                    <th style={{ width: '35%' }}>Họ tên:</th>
                    <td>{selectedUser.fullName}</td>
                  </tr>
                  <tr>
                    <th>Email:</th>
                    <td>{selectedUser.email}</td>
                  </tr>
                  <tr>
                    <th>Số điện thoại:</th>
                    <td>{selectedUser.phone}</td>
                  </tr>
                  <tr>
                    <th>Vai trò:</th>
                    <td>
                      <span className={`badge ${selectedUser.type === 'admin' ? 'bg-danger' : selectedUser.type === 'driver' ? 'bg-success' : 'bg-primary'}`}>
                        {selectedUser.type === 'admin' ? 'Admin' : selectedUser.type === 'driver' ? 'Shipper' : 'User'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <th>Trạng thái:</th>
                    <td>
                      <span className={`badge ${selectedUser.status ? 'bg-success' : 'bg-secondary'}`}>
                        {selectedUser.status ? 'Đang hoạt động' : 'Đã bị khóa'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <th>Ngày tham gia:</th>
                    <td>{new Date(selectedUser.createdAt).toLocaleDateString('vi-VN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Đóng
          </Button>
          <Button
            variant={selectedUser.status ? 'danger' : 'success'}
            onClick={() => {
              toggleUserStatus(selectedUser._id, selectedUser.status);
              handleCloseModal();
            }}
          >
            {selectedUser.status ? <><FaLock className="me-2" />Khóa tài khoản</> : <><FaLockOpen className="me-2" />Mở khóa tài khoản</>}
          </Button>
        </Modal.Footer>
      </Modal>
    );
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
                <li><button className="dropdown-item" onClick={() => setActiveTab('settings')}><FaCog className="me-2" />Cài đặt hệ thống</button></li>
                <li><hr className="dropdown-divider" /></li>
                <li><button className="dropdown-item" onClick={handleLogout}><FaSignOutAlt className="me-2" />Đăng xuất</button></li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      <div className="container my-5">
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
          <div className="col-md-2 mb-3">
            <div className="card bg-dark text-white" style={cardStyle}>
              <div className="card-body text-center">
                <FaUsers size={30} className="mb-2" />
                <h6>Online</h6>
                <h4>{systemStats.activeShippers}</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Sidebar */}
          <div className="col-md-3 mb-4">
            <div className="p-4" style={sidebarStyle}>
              <h5 className="fw-bold mb-4">Menu</h5>
              <div className="list-group list-group-flush">
                <button 
                  className={`list-group-item list-group-item-action border-0 ${activeTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setActiveTab('dashboard')}
                >
                  <FaChartBar className="me-2" />
                  Tổng quan
                </button>
                <button 
                  className={`list-group-item list-group-item-action border-0 ${activeTab === 'users' ? 'active' : ''}`}
                  onClick={() => setActiveTab('users')}
                >
                  <FaUsers className="me-2" />
                  Quản lý người dùng
                </button>
                <button 
                  className={`list-group-item list-group-item-action border-0 ${activeTab === 'shippers' ? 'active' : ''}`}
                  onClick={() => setActiveTab('shippers')}
                >
                  <FaShippingFast className="me-2" />
                  Quản lý shipper
                </button>
                <button 
                  className={`list-group-item list-group-item-action border-0 ${activeTab === 'orders' ? 'active' : ''}`}
                  onClick={() => setActiveTab('orders')}
                >
                  <FaShippingFast className="me-2" />
                  Quản lý đơn hàng
                </button>
                <button 
                  className={`list-group-item list-group-item-action border-0 ${activeTab === 'revenue' ? 'active' : ''}`}
                  onClick={() => setActiveTab('revenue')}
                >
                  <FaDollarSign className="me-2" />
                  Báo cáo doanh thu
                </button>
                <button 
                  className={`list-group-item list-group-item-action border-0 ${activeTab === 'settings' ? 'active' : ''}`}
                  onClick={() => setActiveTab('settings')}
                >
                  <FaCog className="me-2" />
                  Cài đặt hệ thống
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-md-9">
            {/* Dashboard Overview */}
            {activeTab === 'dashboard' && (
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
                            <li>• {systemStats.activeShippers} shipper đang hoạt động</li>
                            <li>• 15 người dùng mới đăng ký</li>
                            <li>• 8 đơn hàng hoàn thành</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 mb-4">
                      <div className="card bg-light">
                        <div className="card-body">
                          <h5 className="card-title">Thống kê nhanh</h5>
                          <ul className="list-unstyled">
                            <li>• Tỷ lệ hoàn thành: 94.5%</li>
                            <li>• Đánh giá trung bình: 4.7/5</li>
                            <li>• Thời gian giao trung bình: 35 phút</li>
                            <li>• Tăng trưởng tháng: +12%</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* User Management */}
            {activeTab === 'users' && (
              <div className="card" style={cardStyle}>
                <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
                  <h4 className="mb-0"><FaUsers className="me-2" />Quản lý người dùng</h4>
                  <button className="btn btn-light btn-sm">
                    <FaPlus className="me-2" />
                    Thêm người dùng
                  </button>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Tên</th>
                          <th>Email</th>
                          <th>Số điện thoại</th>
                          <th>Trạng thái</th>
                          <th>Ngày tham gia</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(user => (
                          <tr key={user._id}>
                            <td style={{ whiteSpace: 'nowrap' }}>{user.fullName}</td>
                            <td>{user.email}</td>
                            <td>{user.phone}</td>
                            <td>
                              <span className={`badge ${user.status ? 'bg-success' : 'bg-secondary'}`}>
                                {user.status ? 'Hoạt động' : 'Đã khóa'}
                              </span>
                            </td>
                            <td>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button 
                                  className="btn btn-outline-primary" 
                                  title="Xem chi tiết"
                                  onClick={() => handleViewUser(user)}
                                >
                                  <FaEye />
                                </button>
                                <button 
                                  className={`btn ${user.status ? 'btn-outline-danger' : 'btn-outline-success'}`}
                                  onClick={() => toggleUserStatus(user._id, user.status)}
                                  title={user.status ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                                >
                                  {user.status ? <FaLock /> : <FaLockOpen />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Shipper Management */}
            {activeTab === 'shippers' && (
              <div className="card" style={cardStyle}>
                <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
                  <h4 className="mb-0"><FaShippingFast className="me-2" />Quản lý shipper</h4>
                  <button className="btn btn-light btn-sm">
                    <FaPlus className="me-2" />
                    Thêm shipper
                  </button>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Tên</th>
                          <th>Email</th>
                          <th>Số điện thoại</th>
                          <th>Trạng thái</th>
                          <th>Ngày tham gia</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shippers.map(shipper => (
                          <tr key={shipper._id}>
                            <td style={{ whiteSpace: 'nowrap' }}>{shipper.fullName}</td>
                            <td>{shipper.email}</td>
                            <td>{shipper.phone}</td>
                            <td>
                              <span className={`badge ${shipper.status ? 'bg-success' : 'bg-secondary'}`}>
                                {shipper.status ? 'Hoạt động' : 'Đã khóa'}
                              </span>
                            </td>
                            <td>{new Date(shipper.createdAt).toLocaleDateString('vi-VN')}</td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button 
                                  className="btn btn-outline-primary" 
                                  title="Xem chi tiết"
                                  onClick={() => handleViewUser(shipper)}
                                >
                                  <FaEye />
                                </button>
                                <button 
                                  className={`btn ${shipper.status ? 'btn-outline-danger' : 'btn-outline-success'}`}
                                  onClick={() => toggleUserStatus(shipper._id, shipper.status)}
                                  title={shipper.status ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                                >
                                  {shipper.status ? <FaLock /> : <FaLockOpen />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Order Management */}
            {activeTab === 'orders' && (
              <div className="card" style={cardStyle}>
                <div className="card-header bg-info text-white">
                  <h4 className="mb-0"><FaShippingFast className="me-2" />Quản lý đơn hàng</h4>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Mã đơn</th>
                          <th>Khách hàng</th>
                          <th>Shipper</th>
                          <th>Tuyến đường</th>
                          <th>Giá</th>
                          <th>Trạng thái</th>
                          <th>Ngày</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(order => (
                          <tr key={order._id}>
                            <td>#{order._id}</td>
                            <td>{order.customer}</td>
                            <td>{order.shipper}</td>
                            <td>{order.from} → {order.to}</td>
                            <td className="fw-bold">{order.price.toLocaleString()} VNĐ</td>
                            <td>
                              <span className={`badge ${
                                order.status === 'completed' ? 'bg-success' : 
                                order.status === 'in-progress' ? 'bg-warning' : 'bg-secondary'
                              }`}>
                                {order.status === 'completed' ? 'Hoàn thành' : 
                                 order.status === 'in-progress' ? 'Đang giao' : 'Chờ xử lý'}
                              </span>
                            </td>
                            <td>{new Date(order.date).toLocaleDateString('vi-VN')}</td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button className="btn btn-outline-primary" title="Xem chi tiết">
                                  <FaEye />
                                </button>
                                <button className="btn btn-outline-warning" title="Chỉnh sửa">
                                  <FaEdit />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Revenue Report */}
            {activeTab === 'revenue' && (
              <div className="card" style={cardStyle}>
                <div className="card-header bg-warning text-dark">
                  <h4 className="mb-0"><FaDollarSign className="me-2" />Báo cáo doanh thu</h4>
                </div>
                <div className="card-body">
                  <div className="row mb-4">
                    <div className="col-md-4">
                      <div className="card bg-success text-white">
                        <div className="card-body text-center">
                          <h5>Doanh thu tháng này</h5>
                          <h3>{revenues[0]?.revenue.toLocaleString()} VNĐ</h3>
                          <small>Tăng trưởng: {revenues[0]?.growth}</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="card bg-info text-white">
                        <div className="card-body text-center">
                          <h5>Số đơn hàng</h5>
                          <h3>{revenues[0]?.orders}</h3>
                          <small>Đơn hàng trong tháng</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="card bg-primary text-white">
                        <div className="card-body text-center">
                          <h5>Trung bình/đơn</h5>
                          <h3>{Math.round(revenues[0]?.revenue / revenues[0]?.orders).toLocaleString()} VNĐ</h3>
                          <small>Giá trị trung bình</small>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Thời gian</th>
                          <th>Doanh thu</th>
                          <th>Số đơn hàng</th>
                          <th>Tăng trưởng</th>
                          <th>Trung bình/đơn</th>
                        </tr>
                      </thead>
                      <tbody>
                        {revenues.map((revenue, index) => (
                          <tr key={index}>
                            <td>{revenue.month}</td>
                            <td className="fw-bold text-success">{revenue.revenue.toLocaleString()} VNĐ</td>
                            <td>{revenue.orders}</td>
                            <td className="text-success">{revenue.growth}</td>
                            <td>{Math.round(revenue.revenue / revenue.orders).toLocaleString()} VNĐ</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* System Settings */}
            {activeTab === 'settings' && (
              <div className="card" style={cardStyle}>
                <div className="card-header bg-dark text-white">
                  <h4 className="mb-0"><FaCog className="me-2" />Cài đặt hệ thống</h4>
                </div>
                <div className="card-body">
                  <form>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Tên hệ thống</label>
                        <input type="text" className="form-control" defaultValue="Tốc Hành Hòa Lạc" />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Email hỗ trợ</label>
                        <input type="email" className="form-control" defaultValue="support@tochanh.com" />
                      </div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Phí hệ thống (%)</label>
                        <input type="number" className="form-control" defaultValue="10" />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Giá cơ bản (VNĐ/km)</label>
                        <input type="number" className="form-control" defaultValue="5000" />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Thông báo bảo trì</label>
                      <textarea className="form-control" rows="3" placeholder="Nhập thông báo bảo trì hệ thống..."></textarea>
                    </div>
                    <button type="submit" className="btn btn-primary" style={buttonStyle}>
                      Lưu cài đặt
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <UserDetailsModal />
    </div>
  );
};

export default AdminDashboard; 