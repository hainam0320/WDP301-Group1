import React, { useState, useEffect } from 'react';
import { FaUser, FaCamera, FaArrowLeft } from 'react-icons/fa';
import { userAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import axios from 'axios';

const UserProfile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const BASE_URL = 'http://localhost:9999';
  
  const [userProfile, setUserProfile] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
    avatar: ''
  });

  const [emailVerified, setEmailVerified] = useState('');
  const [showVerifyForm, setShowVerifyForm] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyMsg, setVerifyMsg] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserProfile({
        name: user.fullName,
        phone: user.phone,
        address: user.address || '',
        email: user.email || '',
        avatar: user.avatar || '',
        emailVerified: user.emailVerified || false
      });
      setEmailVerified(!!user.emailVerified);
    }
  }, []);

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

  // Gửi mã xác thực email
  const handleSendVerifyCode = async () => {
    setVerifyMsg('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:9999/api/users/verify-email/send',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowVerifyForm(true);
      setVerifyMsg('Đã gửi mã xác thực về email.');
    } catch (err) {
      setVerifyMsg(err.response?.data?.message || 'Lỗi gửi mã xác thực');
    }
  };

  // Xác nhận mã xác thực
  const handleConfirmVerifyCode = async (e) => {
    setVerifyMsg('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:9999/api/users/verify-email/confirm',
        { code: verifyCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const res = await axios.get('http://localhost:9999/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const user = res.data.data || res.data;

      // Cập nhật localStorage với trạng thái emailVerified mới nhất
      const oldUser = JSON.parse(localStorage.getItem('user')) || {};
      const updatedUser = { ...oldUser, ...user, emailVerified: user.emailVerified };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Cập nhật state userProfile và emailVerified
      setUserProfile({
        name: user.fullName || '',
        phone: user.phone || '',
        address: user.address || '',
        email: user.email || '',
        avatar: user.avatar || '',
        emailVerified: user.emailVerified || false
      });
      setEmailVerified(user.emailVerified);
      setShowVerifyForm(false);
      setVerifyMsg('Xác thực email thành công!');
    } catch (err) {
      setVerifyMsg(err.response?.data?.message || 'Lỗi xác thực mã');
    }
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

  return (
    <div className="min-vh-100 userprofile-bg">
      <Header />
      <style>{`
        .userprofile-bg {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
        }
        .userprofile-card {
          border-radius: 18px;
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.12);
          border: none;
          background: rgba(255,255,255,0.97);
        }
        .userprofile-card .card-header {
          border-radius: 18px 18px 0 0;
          background: linear-gradient(90deg, #6a82fb 0%, #fc5c7d 100%);
          color: #fff;
        }
        .userprofile-card .card-body {
          padding: 2.5rem 1.5rem;
        }
        .userprofile-btn-lg {
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 12px;
          padding: 0.9rem 1.5rem;
          box-shadow: 0 2px 8px rgba(31,38,135,0.08);
          transition: background 0.2s, color 0.2s, transform 0.2s;
        }
        .userprofile-btn-lg:active, .userprofile-btn-lg:focus {
          outline: none;
          box-shadow: 0 0 0 2px #6a82fb33;
        }
        .userprofile-btn-lg.btn-primary {
          background: linear-gradient(90deg, #6a82fb 0%, #fc5c7d 100%);
          border: none;
        }
        .userprofile-btn-lg.btn-primary:hover {
          background: linear-gradient(90deg, #fc5c7d 0%, #6a82fb 100%);
          color: #fff;
          transform: scale(1.04);
        }
        .userprofile-btn-lg.btn-outline-danger {
          border: 2px solid #dc3545;
          color: #dc3545;
          background: #fff;
        }
        .userprofile-btn-lg.btn-outline-danger:hover {
          background: #dc3545;
          color: #fff;
          border: none;
          transform: scale(1.04);
        }
        .userprofile-card .rounded-circle {
          box-shadow: 0 2px 8px rgba(31,38,135,0.10);
        }
        @media (max-width: 768px) {
          .userprofile-card .card-body {
            padding: 1.2rem 0.5rem;
          }
        }
      `}</style>
      <div className="container my-5">
        <button 
          className="btn btn-outline-primary mb-4 userprofile-btn-lg"
          onClick={() => navigate('/home')}
        >
          <FaArrowLeft className="me-2" />
          Quay lại
        </button>
        <div className="card userprofile-card">
          <div className="card-header">
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
                  <div className="mt-2">
                    {emailVerified ? (
                      <span className="badge bg-success">Đã xác thực</span>
                    ) : (
                      <>
                        <span className="badge bg-warning text-dark">Chưa xác thực</span>
                        <button type="button" className="btn btn-sm btn-outline-primary ms-2" onClick={handleSendVerifyCode} disabled={showVerifyForm}>
                          Gửi mã xác thực
                        </button>
                      </>
                    )}
                  </div>
                  {showVerifyForm && !emailVerified && (
                    <div className="mt-2 d-flex align-items-center">
                      <input
                        type="text"
                        className="form-control form-control-sm me-2"
                        placeholder="Nhập mã xác thực"
                        value={verifyCode}
                        onChange={e => setVerifyCode(e.target.value)}
                        required
                        style={{maxWidth: '120px'}}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-success"
                        onClick={handleConfirmVerifyCode}
                      >
                        Xác nhận
                      </button>
                    </div>
                  )}
                  {verifyMsg && <div className="small mt-1 text-info">{verifyMsg}</div>}
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
                className="btn btn-primary userprofile-btn-lg" 
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

export default UserProfile; 