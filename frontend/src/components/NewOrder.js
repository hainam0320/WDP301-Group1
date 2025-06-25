import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShippingFast, FaCar, FaWeight, FaRuler, FaArrowLeft } from 'react-icons/fa';
import DeliveryMap from './DeliveryMap';
import RideMap from './RideMap';
import Header from './Header';

const NewOrder = () => {
  const navigate = useNavigate();
  const [serviceType, setServiceType] = useState('delivery');
  const [message, setMessage] = useState({ type: '', content: '' });
  const [isSelectingPoint, setIsSelectingPoint] = useState(null);

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

  const cardStyle = {
    borderRadius: '15px',
    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
    border: 'none'
  };

  return (
    <div className="min-vh-100" style={{backgroundColor: '#f5f7fa'}}>
      <Header />
      <div className="container my-5">
        <button 
          className="btn btn-outline-primary mb-4"
          onClick={() => navigate('/home')}
        >
          <FaArrowLeft className="me-2" />
          Quay lại
        </button>
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
      </div>
    </div>
  );
};

export default NewOrder; 