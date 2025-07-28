import React, { useState, useEffect } from 'react';
import { FaUser, FaCamera, FaArrowLeft } from 'react-icons/fa';
import { userAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap';

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
  const [errors, setErrors] = useState({});

  const [showChangePwModal, setShowChangePwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState('');

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

  const validateForm = () => {
    const newErrors = {};
    // Validate name
    if (!userProfile.name.trim()) {
      newErrors.name = 'Vui lòng nhập họ và tên';
    } else if (userProfile.name.trim().length < 2) {
      newErrors.name = 'Họ và tên phải có ít nhất 2 ký tự';
    }
    // Validate phone
    const phoneRegex = /^0\d{9}$/;
    if (!userProfile.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!phoneRegex.test(userProfile.phone)) {
      newErrors.phone = 'Số điện thoại phải bắt đầu bằng số 0 và có đúng 10 chữ số';
    }
    // Validate address
    if (!userProfile.address.trim()) {
      newErrors.address = 'Vui lòng nhập địa chỉ';
    }
    // Validate avatar
    if (!userProfile.avatar) {
      newErrors.avatar = 'Vui lòng chọn ảnh đại diện';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setMessage({ type: '', content: '' });
    if (!validateForm()) return;
    setIsLoading(true);

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

  const validatePwForm = () => {
    const errs = {};
    if (!pwForm.current) errs.current = 'Vui lòng nhập mật khẩu hiện tại';
    const pwRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!pwForm.new) errs.new = 'Vui lòng nhập mật khẩu mới';
    else if (!pwRegex.test(pwForm.new)) errs.new = 'Mật khẩu mới phải có ít nhất 6 ký tự, chứa chữ hoa và số';
    if (!pwForm.confirm) errs.confirm = 'Vui lòng xác nhận mật khẩu mới';
    else if (pwForm.new !== pwForm.confirm) errs.confirm = 'Mật khẩu xác nhận không khớp';
    setPwErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg('');
    if (!validatePwForm()) return;
    setPwLoading(true);
    try {
      const res = await userAPI.changePassword({
        currentPassword: pwForm.current,
        newPassword: pwForm.new
      });
      if (res.data.success) {
        setPwMsg('Đổi mật khẩu thành công!');
        setTimeout(() => {
          setShowChangePwModal(false);
          setPwForm({ current: '', new: '', confirm: '' });
          setPwErrors({});
          setPwMsg('');
        }, 1500);
      } else {
        setPwMsg(res.data.message || 'Đổi mật khẩu thất bại');
      }
    } catch (err) {
      setPwMsg(err.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setPwLoading(false);
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
                    className={`form-control${errors.name ? ' is-invalid' : ''}`} 
                    value={userProfile.name}
                    onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                    required
                  />
                  {errors.name && <div className="text-danger small mt-1">{errors.name}</div>}
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
                    className={`form-control${errors.phone ? ' is-invalid' : ''}`} 
                    value={userProfile.phone}
                    onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
                    required
                  />
                  {errors.phone && <div className="text-danger small mt-1">{errors.phone}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Địa chỉ</label>
                  <input 
                    type="text" 
                    className={`form-control${errors.address ? ' is-invalid' : ''}`} 
                    value={userProfile.address}
                    onChange={(e) => setUserProfile({...userProfile, address: e.target.value})}
                    required
                  />
                  {errors.address && <div className="text-danger small mt-1">{errors.address}</div>}
                </div>
              </div>
              {/* Avatar error display */}
              {errors.avatar && <div className="text-danger small mt-1">{errors.avatar}</div>}
              {/* Buttons row */}
              <div className="d-flex gap-2 mt-3">
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
                <Button 
                  variant="outline-secondary" 
                  className="userprofile-btn-lg" 
                  onClick={() => setShowChangePwModal(true)}
                  disabled={isLoading}
                >
                  Đổi mật khẩu
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* Change Password Modal */}
      <Modal show={showChangePwModal} onHide={() => setShowChangePwModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Đổi mật khẩu</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {pwMsg && <div className={`alert ${pwMsg.includes('thành công') ? 'alert-success' : 'alert-danger'} mb-3`}>{pwMsg}</div>}
          <Form onSubmit={handleChangePassword}>
            <Form.Group className="mb-3">
              <Form.Label>Mật khẩu hiện tại</Form.Label>
              <Form.Control
                type="password"
                value={pwForm.current}
                onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                isInvalid={!!pwErrors.current}
              />
              <Form.Control.Feedback type="invalid">{pwErrors.current}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mật khẩu mới</Form.Label>
              <Form.Control
                type="password"
                value={pwForm.new}
                onChange={e => setPwForm(f => ({ ...f, new: e.target.value }))}
                isInvalid={!!pwErrors.new}
              />
              <Form.Control.Feedback type="invalid">{pwErrors.new}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Xác nhận mật khẩu mới</Form.Label>
              <Form.Control
                type="password"
                value={pwForm.confirm}
                onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                isInvalid={!!pwErrors.confirm}
              />
              <Form.Control.Feedback type="invalid">{pwErrors.confirm}</Form.Control.Feedback>
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowChangePwModal(false)} disabled={pwLoading}>Hủy</Button>
              <Button type="submit" variant="primary" disabled={pwLoading}>{pwLoading ? 'Đang đổi...' : 'Đổi mật khẩu'}</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default UserProfile; 