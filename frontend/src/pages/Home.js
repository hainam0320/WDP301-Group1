import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaShippingFast, FaCar, FaMapMarkerAlt, FaWeight, FaRuler, FaCalculator, FaHistory, FaStar, FaBell, FaSignOutAlt, FaCamera, FaEdit } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from '../assets/img/favicon.png';

const Home = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('order');
  const [serviceType, setServiceType] = useState('delivery');
  const [orderData, setOrderData] = useState({
    pickupLocation: '',
    deliveryLocation: '',
    itemType: '',
    weight: '',
    dimensions: '',
    estimatedPrice: 0
  });
  
  const [userProfile, setUserProfile] = useState({
    name: 'Nguyễn Văn A',
    phone: '0123456789',
    address: 'Hà Nội',
    avatar: null
  });

  const [orders, setOrders] = useState([
    { id: 1, type: 'delivery', from: 'Hà Nội', to: 'Hòa Lạc', status: 'completed', price: 50000, date: '2025-01-25' },
    { id: 2, type: 'pickup', from: 'Hòa Lạc', to: 'Hà Nội', status: 'in-progress', price: 30000, date: '2025-01-27' },
    { id: 3, type: 'delivery', from: 'Cầu Giấy', to: 'Thăng Long', status: 'pending', price: 45000, date: '2025-01-27' }
  ]);

  const calculatePrice = () => {
    let basePrice = serviceType === 'delivery' ? 25000 : 20000;
    let weightFactor = orderData.weight ? parseInt(orderData.weight) * 2000 : 0;
    let estimated = basePrice + weightFactor;
    setOrderData({...orderData, estimatedPrice: estimated});
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUserProfile({...userProfile, avatar: e.target.result});
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setUserProfile({...userProfile, avatar: null});
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #007bff, #6f42c1)',
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
                    src={userProfile.avatar} 
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
                <li><button className="dropdown-item" onClick={() => setActiveTab('profile')}><FaUser className="me-2" />Thông tin cá nhân</button></li>
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
                  className={`list-group-item list-group-item-action border-0 ${activeTab === 'order' ? 'active' : ''}`}
                  onClick={() => setActiveTab('order')}
                >
                  <FaShippingFast className="me-2" />
                  Đặt đơn mới
                </button>
                <button 
                  className={`list-group-item list-group-item-action border-0 ${activeTab === 'tracking' ? 'active' : ''}`}
                  onClick={() => setActiveTab('tracking')}
                >
                  <FaMapMarkerAlt className="me-2" />
                  Theo dõi đơn hàng
                </button>
                <button 
                  className={`list-group-item list-group-item-action border-0 ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  <FaHistory className="me-2" />
                  Lịch sử đơn hàng
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
            {/* Đặt đơn mới */}
            {activeTab === 'order' && (
              <div className="card" style={cardStyle}>
                <div className="card-header bg-primary text-white">
                  <h4 className="mb-0"><FaShippingFast className="me-2" />Đặt đơn mới</h4>
                </div>
                <div className="card-body">
                  {/* Service Type Selection */}
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <div 
                        className={`card text-center cursor-pointer ${serviceType === 'delivery' ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                        onClick={() => setServiceType('delivery')}
                        style={{cursor: 'pointer'}}
                      >
                        <div className="card-body">
                          <FaShippingFast size={40} className="text-primary mb-2" />
                          <h5>Giao hàng</h5>
                          <p className="text-muted">Giao hàng hóa, tài liệu</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div 
                        className={`card text-center cursor-pointer ${serviceType === 'pickup' ? 'border-success bg-success bg-opacity-10' : ''}`}
                        onClick={() => setServiceType('pickup')}
                        style={{cursor: 'pointer'}}
                      >
                        <div className="card-body">
                          <FaCar size={40} className="text-success mb-2" />
                          <h5>Đưa đón người</h5>
                          <p className="text-muted">Dịch vụ đưa đón</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <form>
                    {/* Location inputs */}
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          <FaMapMarkerAlt className="me-2 text-success" />
                          {serviceType === 'delivery' ? 'Nơi lấy hàng' : 'Điểm đón'}
                        </label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder={serviceType === 'delivery' ? 'Nhập địa chỉ lấy hàng' : 'Nhập điểm đón'}
                          value={orderData.pickupLocation}
                          onChange={(e) => setOrderData({...orderData, pickupLocation: e.target.value})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          <FaMapMarkerAlt className="me-2 text-danger" />
                          {serviceType === 'delivery' ? 'Nơi giao hàng' : 'Điểm đến'}
                        </label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder={serviceType === 'delivery' ? 'Nhập địa chỉ giao hàng' : 'Nhập điểm đến'}
                          value={orderData.deliveryLocation}
                          onChange={(e) => setOrderData({...orderData, deliveryLocation: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Additional fields for delivery */}
                    {serviceType === 'delivery' && (
                      <div className="row mb-3">
                        <div className="col-md-4">
                          <label className="form-label fw-semibold">Loại hàng</label>
                          <select 
                            className="form-select"
                            value={orderData.itemType}
                            onChange={(e) => setOrderData({...orderData, itemType: e.target.value})}
                          >
                            <option value="">Chọn loại hàng</option>
                            <option value="document">Tài liệu</option>
                            <option value="food">Thực phẩm</option>
                            <option value="clothes">Quần áo</option>
                            <option value="electronics">Điện tử</option>
                            <option value="other">Khác</option>
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-semibold">
                            <FaWeight className="me-2" />
                            Cân nặng (kg)
                          </label>
                          <input 
                            type="number" 
                            className="form-control" 
                            placeholder="0"
                            value={orderData.weight}
                            onChange={(e) => setOrderData({...orderData, weight: e.target.value})}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-semibold">
                            <FaRuler className="me-2" />
                            Kích thước
                          </label>
                          <select 
                            className="form-select"
                            value={orderData.dimensions}
                            onChange={(e) => setOrderData({...orderData, dimensions: e.target.value})}
                          >
                            <option value="">Chọn kích thước</option>
                            <option value="small">Nhỏ (&lt; 30cm)</option>
                            <option value="medium">Vừa (30-60cm)</option>
                            <option value="large">Lớn (&gt; 60cm)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Price calculation */}
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <button 
                          type="button" 
                          className="btn btn-outline-primary"
                          onClick={calculatePrice}
                          style={buttonStyle}
                        >
                          <FaCalculator className="me-2" />
                          Tính giá tạm tính
                        </button>
                      </div>
                      <div className="col-md-6">
                        {orderData.estimatedPrice > 0 && (
                          <div className="alert alert-info">
                            <strong>Giá tạm tính: {orderData.estimatedPrice.toLocaleString()} VNĐ</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Submit button */}
                    <button type="submit" className="btn btn-primary btn-lg w-100" style={buttonStyle}>
                      Đặt đơn ngay
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Theo dõi đơn hàng */}
            {activeTab === 'tracking' && (
              <div className="card" style={cardStyle}>
                <div className="card-header bg-warning text-dark">
                  <h4 className="mb-0"><FaMapMarkerAlt className="me-2" />Theo dõi đơn hàng</h4>
                </div>
                <div className="card-body">
                  {orders.filter(order => order.status !== 'completed').map(order => (
                    <div key={order.id} className="card mb-3">
                      <div className="card-body">
                        <div className="row align-items-center">
                          <div className="col-md-8">
                            <h6 className="fw-bold">Đơn hàng #{order.id}</h6>
                            <p className="mb-1"><strong>Từ:</strong> {order.from}</p>
                            <p className="mb-1"><strong>Đến:</strong> {order.to}</p>
                            <p className="mb-1"><strong>Loại:</strong> {order.type === 'delivery' ? 'Giao hàng' : 'Đưa đón'}</p>
                          </div>
                          <div className="col-md-4 text-end">
                            <span className={`badge fs-6 ${order.status === 'pending' ? 'bg-warning' : 'bg-info'}`}>
                              {order.status === 'pending' ? 'Chờ xử lý' : 'Đang giao'}
                            </span>
                            <p className="mt-2 fw-bold text-primary">{order.price.toLocaleString()} VNĐ</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lịch sử đơn hàng */}
            {activeTab === 'history' && (
              <div className="card" style={cardStyle}>
                <div className="card-header bg-success text-white">
                  <h4 className="mb-0"><FaHistory className="me-2" />Lịch sử đơn hàng</h4>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Mã đơn</th>
                          <th>Loại</th>
                          <th>Tuyến đường</th>
                          <th>Ngày</th>
                          <th>Trạng thái</th>
                          <th>Giá</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(order => (
                          <tr key={order.id}>
                            <td>#{order.id}</td>
                            <td>{order.type === 'delivery' ? 'Giao hàng' : 'Đưa đón'}</td>
                            <td>{order.from} → {order.to}</td>
                            <td>{order.date}</td>
                            <td>
                              <span className={`badge ${
                                order.status === 'completed' ? 'bg-success' : 
                                order.status === 'in-progress' ? 'bg-info' : 'bg-warning'
                              }`}>
                                {order.status === 'completed' ? 'Hoàn thành' : 
                                 order.status === 'in-progress' ? 'Đang giao' : 'Chờ xử lý'}
                              </span>
                            </td>
                            <td className="fw-bold">{order.price.toLocaleString()} VNĐ</td>
                            <td>
                              {order.status === 'completed' && (
                                <button className="btn btn-sm btn-outline-warning">
                                  <FaStar className="me-1" />
                                  Đánh giá
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Thông tin cá nhân */}
            {activeTab === 'profile' && (
              <div className="card" style={cardStyle}>
                <div className="card-header bg-info text-white">
                  <h4 className="mb-0"><FaUser className="me-2" />Thông tin cá nhân</h4>
                </div>
                <div className="card-body">
                  <form>
                    {/* Avatar Section */}
                    <div className="text-center mb-4">
                      <div className="position-relative d-inline-block">
                        {userProfile.avatar ? (
                          <img 
                            src={userProfile.avatar} 
                            alt="Avatar" 
                            className="rounded-circle border border-3 border-primary"
                            style={{width: '120px', height: '120px', objectFit: 'cover'}}
                          />
                        ) : (
                          <div 
                            className="rounded-circle border border-3 border-primary d-flex align-items-center justify-content-center bg-light"
                            style={{width: '120px', height: '120px'}}
                          >
                            <FaUser size={40} className="text-muted" />
                          </div>
                        )}
                        
                        {/* Camera icon overlay */}
                        <label 
                          htmlFor="avatar-upload" 
                          className="position-absolute bottom-0 end-0 btn btn-primary btn-sm rounded-circle p-2"
                          style={{cursor: 'pointer'}}
                        >
                          <FaCamera />
                        </label>
                        <input 
                          id="avatar-upload"
                          type="file" 
                          accept="image/*"
                          onChange={handleAvatarChange}
                          style={{display: 'none'}}
                        />
                      </div>
                      
                      <div className="mt-3">
                        <h5 className="mb-1">{userProfile.name}</h5>
                        <p className="text-muted">{userProfile.phone}</p>
                        
                        {userProfile.avatar && (
                          <button 
                            type="button" 
                            className="btn btn-outline-danger btn-sm"
                            onClick={removeAvatar}
                          >
                            Xóa ảnh đại diện
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Họ và tên</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={userProfile.name}
                          onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Số điện thoại</label>
                        <input 
                          type="tel" 
                          className="form-control" 
                          value={userProfile.phone}
                          onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Địa chỉ</label>
                      <textarea 
                        className="form-control" 
                        rows="3"
                        value={userProfile.address}
                        onChange={(e) => setUserProfile({...userProfile, address: e.target.value})}
                      ></textarea>
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

export default Home; 