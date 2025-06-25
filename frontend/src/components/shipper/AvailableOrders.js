import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShippingFast, FaMapMarkerAlt, FaCheck, FaClock, FaUser, FaRoute, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import Header from '../Header';

const AvailableOrders = () => {
  const navigate = useNavigate();
  const [availableOrders, setAvailableOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState({ type: '', content: '' });
  const BASE_URL = 'http://localhost:9999';

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

  useEffect(() => {
    fetchAvailableOrders();
  }, []);

  const acceptOrder = async (orderId) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(`${BASE_URL}/api/orders/${orderId}/accept`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setMessages({ type: 'success', content: 'Nhận đơn thành công!' });
      // Refresh the list after accepting
      fetchAvailableOrders();
    } catch (error) {
      console.error('Error accepting order:', error);
      if (error.response?.data?.message === 'Đơn hàng này đã được shipper khác nhận') {
        setMessages({ type: 'error', content: 'Đơn hàng này đã được shipper khác nhận' });
        fetchAvailableOrders();
      } else {
        setMessages({ 
          type: 'error', 
          content: error.response?.data?.message || 'Có lỗi xảy ra khi nhận đơn'
        });
      }
    } finally {
      setIsLoading(false);
    }
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

  return (
    <div className="min-vh-100" style={{backgroundColor: '#f5f7fa'}}>
      <Header />
      <div className="container my-5">
        <button 
          className="btn btn-outline-primary mb-4"
          onClick={() => navigate('/shipper')}
        >
          <FaArrowLeft className="me-2" />
          Quay lại
        </button>

        <div className="card" style={cardStyle}>
          <div className="card-header bg-success text-white">
            <h4 className="mb-0"><FaShippingFast className="me-2" />Đơn hàng khả dụng</h4>
          </div>
          <div className="card-body">
            {messages.content && (
              <div className={`alert alert-${messages.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`} role="alert">
                {messages.content}
                <button type="button" className="btn-close" onClick={() => setMessages({ type: '', content: '' })}></button>
              </div>
            )}
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
      </div>
    </div>
  );
};

export default AvailableOrders; 