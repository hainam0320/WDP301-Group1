import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaShippingFast, FaCar, FaMapMarkerAlt, FaWeight,FaStar, FaRuler, FaHistory, FaBell, FaSignOutAlt, FaCamera, FaPhone } from 'react-icons/fa';
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
  const [activeTab, setActiveTab] = useState('order');
  const [serviceType, setServiceType] = useState('delivery');
  const BASE_URL = 'http://localhost:9999';
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  
  const [orderData, setOrderData] = useState({
    pickupLocation: '',
    pickupCoordinates: null,
    deliveryLocation: '',
    deliveryCoordinates: null,
    itemType: '',
    weight: '',
    dimensions: '',
    estimatedPrice: 0,
    distance: 0
  });
  
  const [userProfile, setUserProfile] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
    avatar: ''
  });

  const [isSelectingPoint, setIsSelectingPoint] = useState(null); // 'pickup', 'delivery', or null

  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  const [orderRates, setOrderRates] = useState({}); // { [orderId]: rateObj }
  const [showRateModal, setShowRateModal] = useState(false);
  const [rateTargetOrder, setRateTargetOrder] = useState(null);
  const [rateValue, setRateValue] = useState(5);
  const [rateComment, setRateComment] = useState('');
  const [rateLoading, setRateLoading] = useState(false);

  const getImageUrl = (path) => {
    if (!path) return null;
    
    // Nếu path đã là đường dẫn tương đối (bắt đầu bằng 'uploads/')
    if (path.startsWith('uploads/')) {
      return `${BASE_URL}/${path}`;
    }
    
    // Nếu path là đường dẫn đầy đủ (có chứa '\uploads\')
    const relativePath = path.split('\\uploads\\')[1];
    if (relativePath) {
      return `${BASE_URL}/uploads/${relativePath}`;
    }
    
    return null;
  };

  useEffect(() => {
    // Lấy thông tin user từ localStorage khi component mount
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserProfile({
        name: user.fullName,
        phone: user.phone,
        address: user.address || '',
        email: user.email || '',
        avatar: user.avatar || ''
      });
    }
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setOrders(response.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Không thể tải danh sách đơn hàng');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'tracking') {
      fetchOrders();
      const interval = setInterval(fetchOrders, 30000); // Refresh mỗi 30 giây
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const handleLocationUpdate = (type, location, coordinates) => {
    if (type === 'route') {
      setOrderData(prev => ({
        ...prev,
        distance: coordinates.distance,
        estimatedPrice: calculatePrice(coordinates.distance)
      }));
    } else if (type === 'pickup') {
      setOrderData(prev => ({
        ...prev,
        pickupLocation: location !== undefined ? location : prev.pickupLocation,
        pickupCoordinates: coordinates !== undefined ? coordinates : prev.pickupCoordinates
      }));
    } else if (type === 'delivery' || type === 'dropoff') {
      setOrderData(prev => ({
        ...prev,
        deliveryLocation: location !== undefined ? location : prev.deliveryLocation,
        deliveryCoordinates: coordinates !== undefined ? coordinates : prev.deliveryCoordinates
      }));
    }
  };
  

  const calculatePrice = (distance) => {
    if (!distance) return 0;
    
    let basePrice = serviceType === 'delivery' ? 25000 : 20000;
    let distancePrice = distance * 10000; // 10,000 VND per km
    let weightFactor = orderData.weight ? parseInt(orderData.weight) * 2000 : 0;
    let estimated = basePrice + distancePrice + weightFactor;
    
    return Math.round(estimated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!orderData.pickupCoordinates || !orderData.deliveryCoordinates) {
      setMessage({ type: 'error', content: 'Vui lòng chọn địa điểm trên bản đồ' });
      return;
    }

    if (serviceType === 'delivery' && (!orderData.itemType || !orderData.weight || !orderData.dimensions)) {
      setMessage({ type: 'error', content: 'Vui lòng điền đầy đủ thông tin hàng hóa' });
      return;
    }
    navigate('/confirmOrder', { state: { orderData, serviceType } });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleFileUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await userAPI.uploadFile(formData);
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
      return response.data.filePath;
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage({ 
        type: 'error', 
        content: error.response?.data?.message || 'Lỗi khi tải file lên server' 
      });
      return null;
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const filePath = await handleFileUpload(file);
      if (filePath) {
        setUserProfile(prev => ({
          ...prev,
          avatar: filePath
        }));
        setMessage({ type: 'success', content: 'Tải ảnh lên thành công' });
      }
    } catch (error) {
      console.error('Error handling avatar upload:', error);
      setMessage({ 
        type: 'error', 
        content: 'Lỗi khi xử lý ảnh' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeAvatar = () => {
    setUserProfile(prev => ({ ...prev, avatar: '' }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', content: '' });

    try {
      const response = await userAPI.updateProfile({
        fullName: userProfile.name,
        phone: userProfile.phone,
        address: userProfile.address,
        avatar: userProfile.avatar
      });

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      const data = response.data.data;
      setMessage({ type: 'success', content: 'Cập nhật thông tin thành công' });
      
      // Update localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      localStorage.setItem('user', JSON.stringify({
        ...user,
        ...data
      }));

    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.message || 'Lỗi khi cập nhật thông tin';
      if (error.response?.data?.errors) {
        setMessage({ type: 'error', content: error.response.data.errors.join(', ') });
      } else {
        setMessage({ type: 'error', content: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
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

  const MapClickHandler = ({ onMapClick }) => {
    useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng;
        // Reverse geocoding để lấy địa chỉ từ tọa độ
        // ...
      }
    });
    return null;
  };

  // Lấy đánh giá cho các đơn hàng hoàn thành
  const fetchRatesForCompletedOrders = async (completedOrders) => {
    const token = localStorage.getItem('token');
    const newRates = {};
    await Promise.all(completedOrders.map(async (order) => {
      try {
        const res = await userAPI.getOrderRate(order._id);
        if (Array.isArray(res.data) && res.data.length > 0) {
          // Giả sử chỉ cho phép 1 đánh giá/user/order
          newRates[order._id] = res.data[0];
        }
      } catch (err) {
        // Không có đánh giá thì thôi
      }
    }));
    setOrderRates(newRates);
  };

  // Khi vào tab history hoặc orders thay đổi, lấy đánh giá cho các đơn hàng hoàn thành
  useEffect(() => {
    if (activeTab === 'history' && orders.length > 0) {
      const completedOrders = orders.filter(o => o.status === 'completed');
      fetchRatesForCompletedOrders(completedOrders);
    } else if (activeTab !== 'history') {
      setOrderRates({}); // clear rates khi rời tab
    }
    // eslint-disable-next-line
  }, [activeTab, orders]);

  // Xử lý mở modal đánh giá
  const handleOpenRateModal = (order) => {
    setRateTargetOrder(order);
    setRateValue(5);
    setRateComment('');
    setShowRateModal(true);
  };
  const handleCloseRateModal = () => {
    setShowRateModal(false);
    setRateTargetOrder(null);
  };

  // Gửi đánh giá
  const handleSubmitRate = async () => {
    if (!rateTargetOrder) return;
    setRateLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const payload = {
        userId: user._id,
        driverId: rateTargetOrder.driverId._id, // Access the driver's _id from the populated object
        orderId: rateTargetOrder._id,
        rate: rateValue,
        comment: rateComment
      };
      const res = await userAPI.createOrderRate(payload);
      setOrderRates(prev => ({ ...prev, [rateTargetOrder._id]: res.data }));
      setShowRateModal(false);
    } catch (err) {
      alert('Lỗi khi gửi đánh giá!');
    } finally {
      setRateLoading(false);
    }
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
                  {message.content && (
                    <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} mb-4`}>
                      {message.content}
                    </div>
                  )}

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

                  {/* Map Component */}
                  <div className="mb-4">
                    {serviceType === 'delivery' ? (
                      <DeliveryMap 
                        onLocationUpdate={handleLocationUpdate}
                        pickupLocation={orderData.pickupLocation}
                        deliveryLocation={orderData.deliveryLocation}
                        isSelectingPoint={isSelectingPoint}
                        onSelectingPointChange={setIsSelectingPoint}
                      />
                    ) : (
                      <RideMap 
                        onLocationUpdate={handleLocationUpdate}
                        pickupLocation={orderData.pickupLocation}
                        dropoffLocation={orderData.deliveryLocation}
                        isSelectingPoint={isSelectingPoint}
                        onSelectingPointChange={setIsSelectingPoint}
                      />
                    )}
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
                          onChange={(e) => {
                            setOrderData({...orderData, weight: e.target.value});
                            if (orderData.pickupCoordinates && orderData.deliveryCoordinates) {
                              handleLocationUpdate('route', null, { distance: orderData.distance });
                            }
                          }}
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

                  {/* Price display */}
                  {orderData.estimatedPrice > 0 && (
                    <div className="alert alert-info mb-4">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>Khoảng cách:</strong> {orderData.distance ? `${orderData.distance.toFixed(1)} km` : '0 km'}
                        </div>
                        <div>
                          <strong>Giá tạm tính:</strong> {orderData.estimatedPrice.toLocaleString()} VNĐ
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit button */}
                  <button
          type="button"
          className="btn btn-primary btn-lg w-100"
          disabled={!orderData.pickupCoordinates || !orderData.deliveryCoordinates}
          onClick={handleSubmit}
        >
                    Đặt đơn ngay
                  </button>
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
                  {isLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="alert alert-danger">{error}</div>
                  ) : orders.length === 0 ? (
                    <div className="alert alert-info">Không có đơn hàng nào</div>
                  ) : (
                    orders.filter(order => order.status !== 'completed').map(order => (
                      <div key={order._id} className="card mb-3">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="fw-bold mb-2">Đơn hàng #{order._id.slice(-6)}</h6>
                              <p className="mb-1"><strong>Từ:</strong> {order.pickupaddress}</p>
                              <p className="mb-1"><strong>Đến:</strong> {order.dropupaddress}</p>
                              <p className="mb-1"><strong>Loại:</strong> {order.type === 'delivery' ? 'Giao hàng' : 'Đưa đón'}</p>
                              {order.status !== 'pending' && order.driverId && (
                                <div className="mb-2 p-2 bg-light rounded">
                                  <p className="mb-1">
                                    <FaUser className="text-primary me-2" />
                                    <strong>Shipper:</strong> {order.driverId.fullName}
                                  </p>
                                  <p className="mb-0">
                                    <FaPhone className="text-success me-2" />
                                    <strong>Liên hệ:</strong> {order.driverId.phone || 'Chưa có thông tin'}
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="text-end">
                              <span className={`badge ${
                                order.status === 'pending' ? 'bg-warning' : 
                                order.status === 'accepted' ? 'bg-info' :
                                order.status === 'in-progress' ? 'bg-primary' : 
                                order.status === 'completed' ? 'bg-success' : 'bg-secondary'
                              } mb-2`}>
                                {order.status === 'pending' ? 'Chờ xử lý' : 
                                 order.status === 'accepted' ? 'Đã nhận đơn' :
                                 order.status === 'in-progress' ? 'Đang giao' : 
                                 order.status === 'completed' ? 'Đã giao hàng' : 'Không xác định'}
                              </span>
                              <div className="fw-bold text-primary">{order.price.toLocaleString()} VNĐ</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
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
                  {isLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="alert alert-danger">{error}</div>
                  ) : orders.length === 0 ? (
                    <div className="alert alert-info">Không có lịch sử đơn hàng</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Mã đơn</th>
                            <th>Từ</th>
                            <th>Đến</th>
                            <th>Loại</th>
                            <th>Thời gian hoàn thành</th>
                            <th>Giá</th>
                            <th>Đánh giá</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.filter(order => order.status === 'completed').map(order => (
                            <tr key={order._id}>
                              <td>#{order._id.slice(-6)}</td>
                              <td>{order.pickupaddress}</td>
                              <td>{order.dropupaddress}</td>
                              <td>{order.type === 'delivery' ? 'Giao hàng' : 'Đưa đón'}</td>
                              <td>{new Date(order.updatedAt).toLocaleString('vi-VN')}</td>
                              <td className="fw-bold">{order.price.toLocaleString()} VNĐ</td>
                              <td>
                                {order.status === 'completed' && (
                                  orderRates[order._id] ? (
                                    <div>
                                      <span className="text-warning">
                                        {[...Array(orderRates[order._id].rate)].map((_, i) => <FaStar key={i} />)}
                                      </span>
                                      <div className="small text-muted">{orderRates[order._id].comment}</div>
                                    </div>
                                  ) : (
                                    <Button size="sm" variant="outline-primary" onClick={() => handleOpenRateModal(order)}>
                                      Đánh giá
                                    </Button>
                                  )
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
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
                  {message.content && (
                    <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} mb-4`}>
                      {message.content}
                    </div>
                  )}

                  <form onSubmit={handleProfileUpdate}>
                    {/* Avatar Section */}
                    <div className="text-center mb-4">
                      <div className="position-relative d-inline-block">
                        {userProfile.avatar && getImageUrl(userProfile.avatar) ? (
                          <img 
                            src={getImageUrl(userProfile.avatar)} 
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
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Email</label>
                        <input 
                          type="email" 
                          className="form-control" 
                          value={userProfile.email}
                          onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                          required
                          readOnly
                        />
                      </div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Số điện thoại</label>
                        <input 
                          type="tel" 
                          className="form-control" 
                          value={userProfile.phone}
                          onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Địa chỉ</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={userProfile.address}
                          onChange={(e) => setUserProfile({...userProfile, address: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      style={buttonStyle}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Đang cập nhật...
                        </>
                      ) : (
                        'Cập nhật thông tin'
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal đánh giá */}
      <Modal show={showRateModal} onHide={handleCloseRateModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Đánh giá đơn hàng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Số sao</Form.Label>
              <div>
                {[1,2,3,4,5].map(star => (
                  <FaStar
                    key={star}
                    className={star <= rateValue ? 'text-warning' : 'text-secondary'}
                    style={{cursor: 'pointer', fontSize: 24}}
                    onClick={() => setRateValue(star)}
                  />
                ))}
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Bình luận</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={rateComment}
                onChange={e => setRateComment(e.target.value)}
                placeholder="Nhập nhận xét của bạn..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseRateModal} disabled={rateLoading}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSubmitRate} disabled={rateLoading}>
            {rateLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Home; 