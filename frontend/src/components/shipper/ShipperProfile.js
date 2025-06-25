import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaCamera, FaEdit, FaImage, FaStar, FaArrowLeft } from 'react-icons/fa';
import { shipperAPI } from '../../services/api';
import axios from 'axios';
import ShipperHeader from './ShipperHeader';

const ShipperProfile = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState({ type: '', content: '' });
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

  const [driverAvgRate, setDriverAvgRate] = useState({ avg: 0, count: 0 });

  useEffect(() => {
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
      setMessages({ type: 'error', content: error.response?.data?.message || 'Lỗi khi tải file lên server' });
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
        setMessages({ type: 'success', content: 'Tải ảnh lên thành công' });
      }
    } catch (error) {
      console.error('Error handling image upload:', error);
      setMessages({ type: 'error', content: 'Lỗi khi xử lý ảnh' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessages({ type: '', content: '' });

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
      setMessages({ type: 'success', content: 'Cập nhật thông tin thành công' });
      
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
        setMessages({ type: 'error', content: error.response.data.errors.join(', ') });
      } else {
        setMessages({ type: 'error', content: errorMessage });
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
      <ShipperHeader />
      <div className="container my-5">
        <button 
          className="btn btn-outline-primary mb-4"
          onClick={() => navigate('/shipper')}
        >
          <FaArrowLeft className="me-2" />
          Quay lại
        </button>

        <div className="card" style={cardStyle}>
          <div className="card-header bg-info text-white">
            <h4 className="mb-0"><FaUser className="me-2" />Thông tin shipper</h4>
          </div>
          <div className="card-body">
            {messages.content && (
              <div className={`alert alert-${messages.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`} role="alert">
                {messages.content}
                <button type="button" className="btn-close" onClick={() => setMessages({ type: '', content: '' })}></button>
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
                    onChange={(e) => handleImageUpload(e, 'avatar')}
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
                      onChange={(e) => handleImageUpload(e, 'cmndFront')}
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
                      onChange={(e) => handleImageUpload(e, 'cmndBack')}
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
                      onChange={(e) => handleImageUpload(e, 'licensePlateImage')}
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
      </div>
    </div>
  );
};

export default ShipperProfile; 