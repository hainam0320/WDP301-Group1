import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaShippingFast, FaMapMarkerAlt, FaDollarSign, FaHistory, FaStar, FaBell, FaSignOutAlt, FaCheck, FaTimes, FaRoute, FaClock } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from '../assets/img/favicon.png';

const ShipperDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  
  const [shipperProfile, setShipperProfile] = useState({
    name: 'Nguyễn Văn Shipper',
    phone: '0987654321',
    vehicle: 'Honda Wave',
    licensePlate: '29A1-12345',
    rating: 4.8,
    totalDeliveries: 156
  });

  const [availableOrders, setAvailableOrders] = useState([
    { id: 1, type: 'delivery', from: 'Hà Nội', to: 'Hòa Lạc', distance: '25km', price: 50000, weight: '2kg', status: 'available' },
    { id: 2, type: 'pickup', from: 'Cầu Giấy', to: 'Thăng Long', distance: '15km', price: 35000, weight: '', status: 'available' },
    { id: 3, type: 'delivery', from: 'Đống Đa', to: 'Hòa Lạc', distance: '30km', price: 60000, weight: '5kg', status: 'available' }
  ]);

  const [myOrders, setMyOrders] = useState([
    { id: 4, type: 'delivery', from: 'Hà Nội', to: 'Hòa Lạc', distance: '25km', price: 45000, status: 'in-progress', customerPhone: '0123456789' },
    { id: 5, type: 'pickup', from: 'Hòa Lạc', to: 'Hà Nội', distance: '25km', price: 40000, status: 'completed', customerPhone: '0987123456' }
  ]);

  const [earnings, setEarnings] = useState({
    today: 125000,
    thisWeek: 850000,
    thisMonth: 3200000,
    total: 15600000
  });

  const acceptOrder = (orderId) => {
    const order = availableOrders.find(o => o.id === orderId);
    if (order) {
      setMyOrders([...myOrders, {...order, status: 'accepted', customerPhone: '0123456789'}]);
      setAvailableOrders(availableOrders.filter(o => o.id !== orderId));
    }
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setMyOrders(myOrders.map(order => 
      order.id === orderId ? {...order, status: newStatus} : order
    ));
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #28a745, #20c997)',
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

  return (
    <div className="min-vh-100" style={{backgroundColor: '#f5f7fa'}}>
      {/* Header */}
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
              <FaStar className="me-1" />
              <span>{shipperProfile.rating}</span>
            </div>
            <div className="dropdown">
              <button className="btn btn-outline-light dropdown-toggle" data-bs-toggle="dropdown">
                <FaUser className="me-2" />
                {shipperProfile.name}
              </button>
              <ul className="dropdown-menu">
                <li><button className="dropdown-item" onClick={() => setActiveTab('profile')}><FaUser className="me-2" />Thông tin cá nhân</button></li>
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
          <div className="col-md-3 mb-3">
            <div className="card bg-success text-white" style={cardStyle}>
              <div className="card-body text-center">
                <FaDollarSign size={30} className="mb-2" />
                <h5>Hôm nay</h5>
                <h4>{earnings.today.toLocaleString()} VNĐ</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-info text-white" style={cardStyle}>
              <div className="card-body text-center">
                <FaShippingFast size={30} className="mb-2" />
                <h5>Tuần này</h5>
                <h4>{earnings.thisWeek.toLocaleString()} VNĐ</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-warning text-white" style={cardStyle}>
              <div className="card-body text-center">
                <FaHistory size={30} className="mb-2" />
                <h5>Tháng này</h5>
                <h4>{earnings.thisMonth.toLocaleString()} VNĐ</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-primary text-white" style={cardStyle}>
              <div className="card-body text-center">
                <FaStar size={30} className="mb-2" />
                <h5>Tổng giao</h5>
                <h4>{shipperProfile.totalDeliveries} đơn</h4>
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
                  className={`list-group-item list-group-item-action border-0 ${activeTab === 'orders' ? 'active' : ''}`}
                  onClick={() => setActiveTab('orders')}
                >
                  <FaShippingFast className="me-2" />
                  Đơn hàng khả dụng
                </button>
                <button 
                  className={`list-group-item list-group-item-action border-0 ${activeTab === 'myorders' ? 'active' : ''}`}
                  onClick={() => setActiveTab('myorders')}
                >
                  <FaRoute className="me-2" />
                  Đơn hàng của tôi
                </button>
                <button 
                  className={`list-group-item list-group-item-action border-0 ${activeTab === 'earnings' ? 'active' : ''}`}
                  onClick={() => setActiveTab('earnings')}
                >
                  <FaDollarSign className="me-2" />
                  Thu nhập
                </button>
                <button 
                  className={`list-group-item list-group-item-action border-0 ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <FaUser className="me-2" />
                  Thông tin cá nhân
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-md-9">
            {/* Đơn hàng khả dụng */}
            {activeTab === 'orders' && (
              <div className="card" style={cardStyle}>
                <div className="card-header bg-success text-white">
                  <h4 className="mb-0"><FaShippingFast className="me-2" />Đơn hàng khả dụng</h4>
                </div>
                <div className="card-body">
                  {availableOrders.map(order => (
                    <div key={order.id} className="card mb-3">
                      <div className="card-body">
                        <div className="row align-items-center">
                          <div className="col-md-8">
                            <h6 className="fw-bold">
                              {order.type === 'delivery' ? 'Giao hàng' : 'Đưa đón'} #{order.id}
                            </h6>
                            <p className="mb-1">
                              <FaMapMarkerAlt className="text-success me-2" />
                              <strong>Từ:</strong> {order.from}
                            </p>
                            <p className="mb-1">
                              <FaMapMarkerAlt className="text-danger me-2" />
                              <strong>Đến:</strong> {order.to}
                            </p>
                            <p className="mb-1">
                              <FaRoute className="text-info me-2" />
                              <strong>Khoảng cách:</strong> {order.distance}
                            </p>
                            {order.weight && (
                              <p className="mb-1">
                                <strong>Khối lượng:</strong> {order.weight}
                              </p>
                            )}
                          </div>
                          <div className="col-md-4 text-end">
                            <h5 className="text-success fw-bold">{order.price.toLocaleString()} VNĐ</h5>
                            <button 
                              className="btn btn-success"
                              onClick={() => acceptOrder(order.id)}
                              style={buttonStyle}
                            >
                              <FaCheck className="me-2" />
                              Nhận đơn
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {availableOrders.length === 0 && (
                    <div className="text-center text-muted py-4">
                      <FaClock size={50} className="mb-3" />
                      <p>Hiện tại không có đơn hàng khả dụng</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Đơn hàng của tôi */}
            {activeTab === 'myorders' && (
              <div className="card" style={cardStyle}>
                <div className="card-header bg-primary text-white">
                  <h4 className="mb-0"><FaRoute className="me-2" />Đơn hàng của tôi</h4>
                </div>
                <div className="card-body">
                  {myOrders.map(order => (
                    <div key={order.id} className="card mb-3">
                      <div className="card-body">
                        <div className="row align-items-center">
                          <div className="col-md-6">
                            <h6 className="fw-bold">
                              {order.type === 'delivery' ? 'Giao hàng' : 'Đưa đón'} #{order.id}
                            </h6>
                            <p className="mb-1"><strong>Từ:</strong> {order.from}</p>
                            <p className="mb-1"><strong>Đến:</strong> {order.to}</p>
                            <p className="mb-1"><strong>KH:</strong> {order.customerPhone}</p>
                          </div>
                          <div className="col-md-3">
                            <span className={`badge fs-6 ${
                              order.status === 'completed' ? 'bg-success' : 
                              order.status === 'in-progress' ? 'bg-warning' : 'bg-info'
                            }`}>
                              {order.status === 'completed' ? 'Hoàn thành' : 
                               order.status === 'in-progress' ? 'Đang giao' : 'Đã nhận'}
                            </span>
                            <p className="mt-2 fw-bold text-success">{order.price.toLocaleString()} VNĐ</p>
                          </div>
                          <div className="col-md-3">
                            {order.status === 'accepted' && (
                              <button 
                                className="btn btn-warning btn-sm mb-2 w-100"
                                onClick={() => updateOrderStatus(order.id, 'in-progress')}
                              >
                                Bắt đầu giao
                              </button>
                            )}
                            {order.status === 'in-progress' && (
                              <button 
                                className="btn btn-success btn-sm mb-2 w-100"
                                onClick={() => updateOrderStatus(order.id, 'completed')}
                              >
                                Hoàn thành
                              </button>
                            )}
                            {order.status === 'completed' && (
                              <button className="btn btn-outline-primary btn-sm w-100">
                                Xem chi tiết
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Thu nhập */}
            {activeTab === 'earnings' && (
              <div className="card" style={cardStyle}>
                <div className="card-header bg-warning text-dark">
                  <h4 className="mb-0"><FaDollarSign className="me-2" />Thống kê thu nhập</h4>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-4">
                      <div className="card bg-light">
                        <div className="card-body">
                          <h5 className="card-title">Thu nhập hôm nay</h5>
                          <h3 className="text-success">{earnings.today.toLocaleString()} VNĐ</h3>
                          <small className="text-muted">3 đơn hàng hoàn thành</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 mb-4">
                      <div className="card bg-light">
                        <div className="card-body">
                          <h5 className="card-title">Thu nhập tuần này</h5>
                          <h3 className="text-info">{earnings.thisWeek.toLocaleString()} VNĐ</h3>
                          <small className="text-muted">18 đơn hàng hoàn thành</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 mb-4">
                      <div className="card bg-light">
                        <div className="card-body">
                          <h5 className="card-title">Thu nhập tháng này</h5>
                          <h3 className="text-warning">{earnings.thisMonth.toLocaleString()} VNĐ</h3>
                          <small className="text-muted">72 đơn hàng hoàn thành</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 mb-4">
                      <div className="card bg-light">
                        <div className="card-body">
                          <h5 className="card-title">Tổng thu nhập</h5>
                          <h3 className="text-primary">{earnings.total.toLocaleString()} VNĐ</h3>
                          <small className="text-muted">{shipperProfile.totalDeliveries} đơn hàng</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Thông tin cá nhân */}
            {activeTab === 'profile' && (
              <div className="card" style={cardStyle}>
                <div className="card-header bg-info text-white">
                  <h4 className="mb-0"><FaUser className="me-2" />Thông tin shipper</h4>
                </div>
                <div className="card-body">
                  <form>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Họ và tên</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={shipperProfile.name}
                          onChange={(e) => setShipperProfile({...shipperProfile, name: e.target.value})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Số điện thoại</label>
                        <input 
                          type="tel" 
                          className="form-control" 
                          value={shipperProfile.phone}
                          onChange={(e) => setShipperProfile({...shipperProfile, phone: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Loại xe</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={shipperProfile.vehicle}
                          onChange={(e) => setShipperProfile({...shipperProfile, vehicle: e.target.value})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Biển số xe</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={shipperProfile.licensePlate}
                          onChange={(e) => setShipperProfile({...shipperProfile, licensePlate: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Đánh giá</label>
                        <div className="input-group">
                          <input type="text" className="form-control" value={shipperProfile.rating} readOnly />
                          <span className="input-group-text"><FaStar className="text-warning" /></span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Tổng số đơn đã giao</label>
                        <input type="text" className="form-control" value={shipperProfile.totalDeliveries} readOnly />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={buttonStyle}>
                      Cập nhật thông tin
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipperDashboard; 