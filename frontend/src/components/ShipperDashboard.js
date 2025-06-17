import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaShippingFast, FaMapMarkerAlt, FaDollarSign, FaHistory, FaStar, FaBell, FaSignOutAlt, FaCheck, FaRoute, FaClock, FaCamera, FaEdit, FaImage, FaEye } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from '../assets/img/favicon.png';
import { shipperAPI } from '../services/api';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';

const ShipperDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const BASE_URL = 'http://localhost:9999';
  
  const [shipperProfile, setShipperProfile] = useState({
    name: '',
    phone: '',
    licensePlateImage: '',
    cmndFront: '',
    cmndBack: '',
    rating: 0,
    totalDeliveries: 0,
    avatar: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [availableOrders, setAvailableOrders] = useState([]);
  const [error, setError] = useState('');

  const [myOrders, setMyOrders] = useState([]);

  const [earnings, setEarnings] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    total: 0,
    totalDeliveries: 0
  });

  // Modal states
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderRate, setOrderRate] = useState(null);

  const [driverAvgRate, setDriverAvgRate] = useState({ avg: 0, count: 0 });

  // Fetch available orders
  const fetchAvailableOrders = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/shipper/available`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setAvailableOrders(response.data);
    } catch (err) {
      console.error('Error fetching available orders:', err);
      setError('Không thể tải danh sách đơn hàng khả dụng');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch my orders
  const fetchMyOrders = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/shipper/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setMyOrders(response.data);
    } catch (err) {
      console.error('Error fetching my orders:', err);
      setError('Không thể tải danh sách đơn hàng của bạn');
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm lấy thống kê thu nhập
  const fetchEarnings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/shipper/earnings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data.success) {
        setEarnings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
      setMessage({ 
        type: 'error', 
        content: 'Không thể tải dữ liệu thống kê thu nhập' 
      });
    }
  };

  // Lấy đánh giá cho đơn hàng
  const fetchOrderRate = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/rate/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data && response.data.length > 0) {
        setOrderRate(response.data[0]);
      } else {
        setOrderRate(null);
      }
    } catch (error) {
      console.error('Error fetching order rate:', error);
      setOrderRate(null);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchAvailableOrders();
    } else if (activeTab === 'myorders') {
      fetchMyOrders();
    } else if (activeTab === 'earnings') {
      fetchEarnings();
    }
  }, [activeTab]);

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
      setShipperProfile(prev => ({
        ...prev,
        name: user.fullName,
        phone: user.phone,
        licensePlateImage: user.licensePlateImage || '',
        cmndFront: user.cmndFront || '',
        cmndBack: user.cmndBack || '',
        rating: user.rating || 0,
        totalDeliveries: user.totalDeliveries || 0,
        avatar: user.avatar || ''
      }));
    }
    // Gọi API earnings khi component mount
    fetchEarnings();
  }, []);

  const acceptOrder = async (orderId) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${BASE_URL}/api/shipper/${orderId}/accept`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Add to my orders
        const acceptedOrder = availableOrders.find(o => o._id === orderId);
        if (acceptedOrder) {
          setMyOrders([...myOrders, {...acceptedOrder, status: 'accepted'}]);
          // Remove from available orders
          setAvailableOrders(availableOrders.filter(o => o._id !== orderId));
        }
        setMessage({ type: 'success', content: 'Nhận đơn thành công!' });
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      setMessage({ 
        type: 'error', 
        content: error.response?.data?.message || 'Có lỗi xảy ra khi nhận đơn' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${BASE_URL}/api/shipper/orders/${orderId}/status`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Cập nhật state local
        setMyOrders(myOrders.map(order => 
          order._id === orderId ? {...order, status: newStatus} : order
        ));
        setMessage({ type: 'success', content: 'Cập nhật trạng thái đơn hàng thành công!' });
        
        // Nếu đơn hàng hoàn thành, cập nhật earnings
        if (newStatus === 'completed') {
          const completedOrder = myOrders.find(order => order._id === orderId);
          if (completedOrder) {
            setEarnings(prev => ({
              ...prev,
              today: prev.today + completedOrder.price,
              thisWeek: prev.thisWeek + completedOrder.price,
              thisMonth: prev.thisMonth + completedOrder.price,
              total: prev.total + completedOrder.price
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      setMessage({ 
        type: 'error', 
        content: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleFileUpload = async (file, type) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await shipperAPI.uploadFile(formData);
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
      return response.data.filePath;
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage({ type: 'error', content: error.response?.data?.message || 'Lỗi khi tải file lên server' });
      return null;
    }
  };

  const handleImageUpload = async (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const filePath = await handleFileUpload(file, type);
      if (filePath) {
        setShipperProfile(prev => ({
          ...prev,
          [type]: filePath
        }));
        setMessage({ type: 'success', content: 'Tải ảnh lên thành công' });
      }
    } catch (error) {
      console.error('Error handling image upload:', error);
      setMessage({ type: 'error', content: 'Lỗi khi xử lý ảnh' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (event) => {
    handleImageUpload(event, 'avatar');
  };

  const handleCMNDFrontUpload = (event) => {
    handleImageUpload(event, 'cmndFront');
  };

  const handleCMNDBackUpload = (event) => {
    handleImageUpload(event, 'cmndBack');
  };

  const handleLicensePlateUpload = (event) => {
    handleImageUpload(event, 'licensePlateImage');
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', content: '' });

    try {
      const response = await shipperAPI.updateProfile({
        fullName: shipperProfile.name,
        phone: shipperProfile.phone,
        avatar: shipperProfile.avatar,
        cmndFront: shipperProfile.cmndFront,
        cmndBack: shipperProfile.cmndBack,
        licensePlateImage: shipperProfile.licensePlateImage
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

  // Xử lý mở modal chi tiết đơn hàng
  const handleShowOrderDetail = async (order) => {
    setSelectedOrder(order);
    setShowOrderDetailModal(true);
    await fetchOrderRate(order._id);
  };

  const handleCloseOrderDetailModal = () => {
    setShowOrderDetailModal(false);
    setSelectedOrder(null);
    setOrderRate(null);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
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

  // Lấy số sao trung bình của shipper
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
                <h4>{earnings.totalDeliveries} đơn</h4>
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
                  {isLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-success" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="alert alert-danger">{error}</div>
                  ) : availableOrders.length === 0 ? (
                    <div className="text-center text-muted py-4">
                      <FaClock size={50} className="mb-3" />
                      <p>Hiện tại không có đơn hàng khả dụng</p>
                    </div>
                  ) : (
                    availableOrders.map(order => (
                      <div key={order._id} className="card mb-3">
                        <div className="card-body">
                          <div className="row align-items-center">
                            <div className="col-md-8">
                              <h6 className="fw-bold">
                                {order.type === 'delivery' ? 'Giao hàng' : 'Đưa đón'} #{order._id.slice(-6)}
                              </h6>
                              <p className="mb-1">
                                <FaMapMarkerAlt className="text-success me-2" />
                                <strong>Từ:</strong> {order.pickupaddress}
                              </p>
                              <p className="mb-1">
                                <FaMapMarkerAlt className="text-danger me-2" />
                                <strong>Đến:</strong> {order.dropupaddress}
                              </p>
                              <p className="mb-1">
                                <FaRoute className="text-info me-2" />
                                <strong>Khoảng cách:</strong> {order.distance_km ? `${order.distance_km.toFixed(1)} km` : 'N/A'}
                              </p>
                              {order.type === 'delivery' && order.weight && (
                                <p className="mb-1">
                                  <strong>Khối lượng:</strong> {order.weight} kg
                                </p>
                              )}
                              <p className="mb-1">
                              <FaUser className="text-primary me-2" />
                              <strong>KH:</strong> {order.userId?.phone || order.phone}
                            </p>
                            </div>
                            <div className="col-md-4 text-end">
                              <h5 className="text-success fw-bold">{order.price.toLocaleString()} VNĐ</h5>
                              <button 
                                className="btn btn-success"
                                onClick={() => acceptOrder(order._id)}
                                style={buttonStyle}
                              >
                                <FaCheck className="me-2" />
                                Nhận đơn
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
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
                    <div key={order._id} className="card mb-3">
                      <div className="card-body">
                        <div className="row align-items-center">
                          <div className="col-md-6">
                            <h6 className="fw-bold">
                              {order.type === 'delivery' ? 'Giao hàng' : 'Đưa đón'} #{order._id.slice(-6)}
                            </h6>
                            <p className="mb-1">
                              <FaMapMarkerAlt className="text-success me-2" />
                              <strong>Từ:</strong> {order.pickupaddress}
                            </p>
                            <p className="mb-1">
                              <FaMapMarkerAlt className="text-danger me-2" />
                              <strong>Đến:</strong> {order.dropupaddress}
                            </p>
                            <p className="mb-1">
                              <FaUser className="text-primary me-2" />
                              <strong>KH:</strong> {order.userId?.phone || order.phone}
                            </p>
                            {order.type === 'delivery' && order.weight && (
                              <p className="mb-1">
                                <strong>Khối lượng:</strong> {order.weight} kg
                              </p>
                            )}
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
                                onClick={() => updateOrderStatus(order._id, 'in-progress')}
                              >
                                Bắt đầu giao
                              </button>
                            )}
                            {order.status === 'in-progress' && (
                              <button 
                                className="btn btn-success btn-sm mb-2 w-100"
                                onClick={() => updateOrderStatus(order._id, 'completed')}
                              >
                                Hoàn thành
                              </button>
                            )}
                            {order.status === 'completed' && (
                              <button 
                                className="btn btn-outline-primary btn-sm w-100"
                                onClick={() => handleShowOrderDetail(order)}
                              >
                                <FaEye className="me-1" />
                                Xem chi tiết
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {myOrders.length === 0 && (
                    <div className="text-center text-muted py-4">
                      <FaClock size={50} className="mb-3" />
                      <p>Bạn chưa có đơn hàng nào</p>
                    </div>
                  )}
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
                          <small className="text-muted">
                            {earnings.totalDeliveries > 0 ? `${earnings.totalDeliveries} đơn hàng hoàn thành` : 'Chưa có đơn hàng nào'}
                          </small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 mb-4">
                      <div className="card bg-light">
                        <div className="card-body">
                          <h5 className="card-title">Thu nhập tuần này</h5>
                          <h3 className="text-info">{earnings.thisWeek.toLocaleString()} VNĐ</h3>
                          <small className="text-muted">
                            {earnings.totalDeliveries > 0 ? `${earnings.totalDeliveries} đơn hàng hoàn thành` : 'Chưa có đơn hàng nào'}
                          </small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 mb-4">
                      <div className="card bg-light">
                        <div className="card-body">
                          <h5 className="card-title">Thu nhập tháng này</h5>
                          <h3 className="text-warning">{earnings.thisMonth.toLocaleString()} VNĐ</h3>
                          <small className="text-muted">
                            {earnings.totalDeliveries > 0 ? `${earnings.totalDeliveries} đơn hàng hoàn thành` : 'Chưa có đơn hàng nào'}
                          </small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 mb-4">
                      <div className="card bg-light">
                        <div className="card-body">
                          <h5 className="card-title">Tổng thu nhập</h5>
                          <h3 className="text-primary">{earnings.total.toLocaleString()} VNĐ</h3>
                          <small className="text-muted">
                            {earnings.totalDeliveries > 0 ? `${earnings.totalDeliveries} đơn hàng` : 'Chưa có đơn hàng nào'}
                          </small>
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
                  {message.content && (
                    <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`} role="alert">
                      {message.content}
                      <button type="button" className="btn-close" onClick={() => setMessage({ type: '', content: '' })}></button>
                    </div>
                  )}
                  <form onSubmit={handleProfileUpdate}>
                    {/* Avatar Section */}
                    <div className="text-center mb-4">
                      <div className="position-relative d-inline-block">
                        {shipperProfile.avatar && getImageUrl(shipperProfile.avatar) ? (
                          <img 
                            src={getImageUrl(shipperProfile.avatar)} 
                            alt="Avatar" 
                            className="rounded-circle border border-3 border-success"
                            style={{width: '120px', height: '120px', objectFit: 'cover'}}
                          />
                        ) : (
                          <div 
                            className="rounded-circle border border-3 border-success d-flex align-items-center justify-content-center bg-light"
                            style={{width: '120px', height: '120px'}}
                          >
                            <FaUser size={40} className="text-muted" />
                          </div>
                        )}
                        
                        {/* Camera icon overlay */}
                        <label 
                          htmlFor="shipper-avatar-upload" 
                          className="position-absolute bottom-0 end-0 btn btn-success btn-sm rounded-circle p-2"
                          style={{cursor: 'pointer'}}
                        >
                          <FaCamera />
                        </label>
                        <input 
                          id="shipper-avatar-upload"
                          type="file" 
                          accept="image/*"
                          onChange={handleAvatarChange}
                          style={{display: 'none'}}
                        />
                      </div>
                      
                      <div className="mt-3">
                        <h5 className="mb-1">{shipperProfile.name}</h5>
                        <p className="text-muted">{shipperProfile.phone}</p>
                        <div className="d-flex justify-content-center align-items-center mb-2">
                          <FaStar className="text-warning me-1" />  
                          <span className="fw-bold">{driverAvgRate.avg.toFixed(1)}</span>
                          <span className="text-muted ms-2">({driverAvgRate.count} lượt đánh giá)</span>
                        </div>
                        
                        {shipperProfile.avatar && (
                          <button 
                            type="button" 
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => setShipperProfile({...shipperProfile, avatar: ''})}
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
                          value={shipperProfile.name}
                          onChange={(e) => setShipperProfile({...shipperProfile, name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Số điện thoại</label>
                        <input 
                          type="tel" 
                          className="form-control" 
                          value={shipperProfile.phone}
                          onChange={(e) => setShipperProfile({...shipperProfile, phone: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Ảnh CMND mặt trước</label>
                        <div className="border rounded p-2">
                          {shipperProfile.cmndFront && getImageUrl(shipperProfile.cmndFront) ? (
                            <div className="position-relative">
                              <img 
                                src={getImageUrl(shipperProfile.cmndFront)}
                                alt="CMND mặt trước"
                                className="img-fluid rounded"
                                style={{maxHeight: '150px', objectFit: 'contain'}}
                              />
                              <label 
                                htmlFor="cmnd-front-upload" 
                                className="position-absolute bottom-0 end-0 btn btn-primary btn-sm m-2"
                              >
                                <FaEdit className="me-1" />
                                Thay đổi
                              </label>
                            </div>
                          ) : (
                            <label 
                              htmlFor="cmnd-front-upload" 
                              className="text-center text-muted py-3 d-block" 
                              style={{cursor: 'pointer'}}
                            >
                              <FaImage size={40} />
                              <p className="mt-2 mb-0">Click để tải ảnh CMND mặt trước</p>
                            </label>
                          )}
                          <input 
                            id="cmnd-front-upload"
                            type="file" 
                            accept="image/*"
                            onChange={handleCMNDFrontUpload}
                            style={{display: 'none'}}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Ảnh CMND mặt sau</label>
                        <div className="border rounded p-2">
                          {shipperProfile.cmndBack && getImageUrl(shipperProfile.cmndBack) ? (
                            <div className="position-relative">
                              <img 
                                src={getImageUrl(shipperProfile.cmndBack)}
                                alt="CMND mặt sau"
                                className="img-fluid rounded"
                                style={{maxHeight: '150px', objectFit: 'contain'}}
                              />
                              <label 
                                htmlFor="cmnd-back-upload" 
                                className="position-absolute bottom-0 end-0 btn btn-primary btn-sm m-2"
                              >
                                <FaEdit className="me-1" />
                                Thay đổi
                              </label>
                            </div>
                          ) : (
                            <label 
                              htmlFor="cmnd-back-upload" 
                              className="text-center text-muted py-3 d-block" 
                              style={{cursor: 'pointer'}}
                            >
                              <FaImage size={40} />
                              <p className="mt-2 mb-0">Click để tải ảnh CMND mặt sau</p>
                            </label>
                          )}
                          <input 
                            id="cmnd-back-upload"
                            type="file" 
                            accept="image/*"
                            onChange={handleCMNDBackUpload}
                            style={{display: 'none'}}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Ảnh biển số xe</label>
                        <div className="border rounded p-2">
                          {shipperProfile.licensePlateImage && getImageUrl(shipperProfile.licensePlateImage) ? (
                            <div className="position-relative">
                              <img 
                                src={getImageUrl(shipperProfile.licensePlateImage)}
                                alt="Biển số xe"
                                className="img-fluid rounded"
                                style={{maxHeight: '150px', objectFit: 'contain'}}
                              />
                              <label 
                                htmlFor="license-plate-upload" 
                                className="position-absolute bottom-0 end-0 btn btn-primary btn-sm m-2"
                              >
                                <FaEdit className="me-1" />
                                Thay đổi
                              </label>
                            </div>
                          ) : (
                            <label 
                              htmlFor="license-plate-upload" 
                              className="text-center text-muted py-3 d-block" 
                              style={{cursor: 'pointer'}}
                            >
                              <FaImage size={40} />
                              <p className="mt-2 mb-0">Click để tải ảnh biển số xe</p>
                            </label>
                          )}
                          <input 
                            id="license-plate-upload"
                            type="file" 
                            accept="image/*"
                            onChange={handleLicensePlateUpload}
                            style={{display: 'none'}}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Đánh giá</label>
                        <div className="input-group">                         
                          <span className="input-group-text">{driverAvgRate.avg.toFixed(1)}<FaStar className="text-warning" /></span>
                        </div>
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Tổng số đơn đã giao</label>
                        <input type="text" className="form-control" value={shipperProfile.totalDeliveries} readOnly />
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

      {/* Modal chi tiết đơn hàng */}
      <Modal show={showOrderDetailModal} onHide={handleCloseOrderDetailModal} size="lg" centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <FaShippingFast className="me-2" />
            Chi tiết đơn hàng #{selectedOrder?._id?.slice(-6)}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <div className="row">
              <div className="col-md-6">
                <h6 className="fw-bold text-primary mb-3">
                  <FaMapMarkerAlt className="me-2" />
                  Thông tin địa điểm
                </h6>
                <div className="mb-3">
                  <p className="mb-1">
                    <strong className="text-success">Điểm đón:</strong>
                  </p>
                  <p className="text-muted">{selectedOrder.pickupaddress}</p>
                </div>
                <div className="mb-3">
                  <p className="mb-1">
                    <strong className="text-danger">Điểm đến:</strong>
                  </p>
                  <p className="text-muted">{selectedOrder.dropupaddress}</p>
                </div>
                <div className="mb-3">
                  <p className="mb-1">
                    <strong>Khoảng cách:</strong>
                  </p>
                  <p className="text-muted">
                    {selectedOrder.distance_km ? `${selectedOrder.distance_km.toFixed(1)} km` : 'N/A'}
                  </p>
                </div>
                {selectedOrder.type === 'delivery' && selectedOrder.weight && (
                  <div className="mb-3">
                    <p className="mb-1">
                      <strong>Khối lượng:</strong>
                    </p>
                    <p className="text-muted">{selectedOrder.weight} kg</p>
                  </div>
                )}
              </div>
              
              <div className="col-md-6">
                <h6 className="fw-bold text-primary mb-3">
                  <FaClock className="me-2" />
                  Thông tin thời gian
                </h6>
                <div className="mb-3">
                  <p className="mb-1">
                    <strong>Thời gian nhận đơn:</strong>
                  </p>
                  <p className="text-muted">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                {selectedOrder.status === 'completed' && (
                  <div className="mb-3">
                    <p className="mb-1">
                      <strong>Thời gian hoàn thành:</strong>
                    </p>
                    <p className="text-muted">{formatDate(selectedOrder.updatedAt)}</p>
                  </div>
                )}
                
                <h6 className="fw-bold text-primary mb-3">
                  <FaDollarSign className="me-2" />
                  Thông tin thanh toán
                </h6>
                <div className="mb-3">
                  <p className="mb-1">
                    <strong>Giá tiền:</strong>
                  </p>
                  <p className="text-success fw-bold fs-5">
                    {selectedOrder.price.toLocaleString()} VNĐ
                  </p>
                </div>
                
                <h6 className="fw-bold text-primary mb-3">
                  <FaStar className="me-2" />
                  Đánh giá từ khách hàng
                </h6>
                <div className="mb-3">
                  {orderRate ? (
                    <div>
                      <div className="mb-2">
                        <span className="text-warning">
                          {[...Array(orderRate.rate)].map((_, i) => (
                            <FaStar key={i} size={20} />
                          ))}
                        </span>
                        <span className="ms-2 fw-bold">{orderRate.rate}/5</span>
                      </div>
                      {orderRate.comment && (
                        <div>
                          <p className="mb-1"><strong>Nhận xét:</strong></p>
                          <p className="text-muted fst-italic">"{orderRate.comment}"</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted">Chưa có đánh giá</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseOrderDetailModal}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ShipperDashboard; 