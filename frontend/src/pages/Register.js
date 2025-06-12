import React, { useState } from 'react';
import logo from '../assets/img/favicon.png';
import { FaUser, FaPhoneAlt, FaLock, FaEye, FaEyeSlash, FaMapMarkerAlt, FaEnvelope, FaCheck, FaIdCard, FaCar, FaImage } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import { authAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState('user'); // 'user' or 'driver'
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    // Driver specific fields
    Bsx: '',
    cmnd: '',
  });

  const [files, setFiles] = useState({
    avatar: null,
    licensePlateImage: null,
    cmndFront: null,
    cmndBack: null
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleFileChange = (e) => {
    const { name, files: uploadedFiles } = e.target;
    if (uploadedFiles.length > 0) {
      setFiles(prev => ({
        ...prev,
        [name]: uploadedFiles[0]
      }));

      // Clear error when file is selected
      if (errors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: ''
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate full name
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Họ và tên phải có ít nhất 2 ký tự';
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    // Validate phone
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại phải có 10-11 chữ số';
    }

    // Validate address
    if (!formData.address.trim()) {
      newErrors.address = 'Vui lòng nhập địa chỉ';
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    // Validate avatar for all users
    if (!files.avatar) {
      newErrors.avatar = 'Vui lòng chọn ảnh đại diện';
    }

    // Driver specific validations
    if (accountType === 'driver') {
      if (!files.licensePlateImage) {
        newErrors.licensePlateImage = 'Vui lòng chọn ảnh biển số xe';
      }
      if (!files.cmndFront) {
        newErrors.cmndFront = 'Vui lòng chọn ảnh CMND/CCCD mặt trước';
      }
      if (!files.cmndBack) {
        newErrors.cmndBack = 'Vui lòng chọn ảnh CMND/CCCD mặt sau';
      }
    }

    // Validate terms agreement
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'Vui lòng đồng ý với điều khoản sử dụng';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      try {
        const formDataToSend = new FormData();
        
        // Add text fields
        Object.keys(formData).forEach(key => {
          if (key !== 'confirmPassword' && key !== 'agreeTerms') {
            formDataToSend.append(key, formData[key]);
          }
        });

        // Add files
        formDataToSend.append('avatar', files.avatar);
        if (accountType === 'driver') {
          formDataToSend.append('licensePlateImage', files.licensePlateImage);
          formDataToSend.append('cmndFront', files.cmndFront);
          formDataToSend.append('cmndBack', files.cmndBack);
        }

        let response;
        if (accountType === 'user') {
          response = await authAPI.registerUser(formDataToSend);
        } else {
          response = await authAPI.registerDriver(formDataToSend);
        }

        if (response.data) {
          alert('Đăng ký thành công!');
          navigate('/login');
        }
      } catch (error) {
        alert(error.response?.data?.message || 'Đã có lỗi xảy ra khi đăng ký');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const registerPageStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    minHeight: '100vh',
    position: 'relative',
    overflow: 'hidden'
  };

  const decorativeStyle1 = {
    position: 'absolute',
    top: '5%',
    left: '5%',
    width: '100px',
    height: '100px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '50%',
    filter: 'blur(40px)'
  };

  const decorativeStyle2 = {
    position: 'absolute',
    top: '20%',
    right: '10%',
    width: '80px',
    height: '80px',
    background: 'rgba(255, 193, 7, 0.3)',
    borderRadius: '50%',
    filter: 'blur(30px)'
  };

  const decorativeStyle3 = {
    position: 'absolute',
    bottom: '15%',
    left: '10%',
    width: '120px',
    height: '120px',
    background: 'rgba(220, 53, 69, 0.2)',
    borderRadius: '50%',
    filter: 'blur(50px)'
  };

  const decorativeStyle4 = {
    position: 'absolute',
    bottom: '30%',
    right: '5%',
    width: '90px',
    height: '90px',
    background: 'rgba(40, 167, 69, 0.2)',
    borderRadius: '50%',
    filter: 'blur(35px)'
  };

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '25px',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
    zIndex: 10,
    position: 'relative'
  };

  const logoContainerStyle = {
    background: 'linear-gradient(135deg, #007bff, #6f42c1)',
    padding: '20px',
    borderRadius: '20px',
    display: 'inline-block',
    boxShadow: '0 10px 25px rgba(0, 123, 255, 0.3)',
    transition: 'transform 0.3s ease'
  };

  const inputGroupStyle = {
    background: '#f8f9fa',
    border: '2px solid #e9ecef',
    borderRadius: '15px',
    transition: 'all 0.3s ease'
  };

  const buttonStyle = {
    background: 'linear-gradient(135deg, #007bff, #6f42c1)',
    border: 'none',
    borderRadius: '15px',
    padding: '15px',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 20px rgba(0, 123, 255, 0.3)'
  };

  const fileInputStyle = {
    ...inputGroupStyle,
    cursor: 'pointer'
  };

  return (
    <div style={registerPageStyle} className="d-flex align-items-center justify-content-center py-5">
      {/* Background decorative elements */}
      <div style={decorativeStyle1}></div>
      <div style={decorativeStyle2}></div>
      <div style={decorativeStyle3}></div>
      <div style={decorativeStyle4}></div>

      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div style={cardStyle} className="p-4 p-md-5">
              
              {/* Logo Section */}
              <div className="text-center mb-4">
                <div 
                  style={logoContainerStyle} 
                  className="logo-container"
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  <img src={logo} alt="Logo" width="48" height="48" style={{filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'}} />
                </div>
              </div>

              {/* Title Section */}
              <div className="text-center mb-4">
                <h1 className="h2 fw-bold text-dark mb-2">Đăng ký tài khoản</h1>
                <p className="text-muted fs-5">Tham gia dịch vụ Tốc Hành Hòa Lạc</p>
                <div style={{width: '60px', height: '4px', background: 'linear-gradient(135deg, #007bff, #6f42c1)', borderRadius: '2px'}} className="mx-auto"></div>
              </div>

              {/* Account Type Selection */}
              <div className="mb-4">
                <label className="form-label fw-semibold text-dark">Loại tài khoản *</label>
                <div className="d-flex gap-3">
                  <div className="form-check">
                    <input
                      type="radio"
                      className="form-check-input"
                      name="accountType"
                      id="userType"
                      checked={accountType === 'user'}
                      onChange={() => setAccountType('user')}
                    />
                    <label className="form-check-label" htmlFor="userType">
                      Người dùng
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      type="radio"
                      className="form-check-input"
                      name="accountType"
                      id="driverType"
                      checked={accountType === 'driver'}
                      onChange={() => setAccountType('driver')}
                    />
                    <label className="form-check-label" htmlFor="driverType">
                      Tài xế
                    </label>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Full Name Input */}
                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark">Họ và tên *</label>
                  <div 
                    style={inputGroupStyle} 
                    className="input-group p-3"
                  >
                    <span className="input-group-text bg-transparent border-0 text-muted">
                      <FaUser />
                    </span>
                    <input
                      type="text"
                      name="fullName"
                      className={`form-control bg-transparent border-0 text-dark ${errors.fullName ? 'is-invalid' : ''}`}
                      placeholder="Nhập họ và tên đầy đủ"
                      value={formData.fullName}
                      onChange={handleChange}
                      style={{outline: 'none', boxShadow: 'none'}}
                    />
                  </div>
                  {errors.fullName && <div className="text-danger small mt-1">{errors.fullName}</div>}
                </div>

                {/* Email Input */}
                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark">Email *</label>
                  <div style={inputGroupStyle} className="input-group p-3">
                    <span className="input-group-text bg-transparent border-0 text-muted">
                      <FaEnvelope />
                    </span>
                    <input
                      type="email"
                      name="email"
                      className={`form-control bg-transparent border-0 ${errors.email ? 'is-invalid' : ''}`}
                      placeholder="Nhập địa chỉ email"
                      value={formData.email}
                      onChange={handleChange}
                      style={{outline: 'none', boxShadow: 'none'}}
                    />
                  </div>
                  {errors.email && <div className="text-danger small mt-1">{errors.email}</div>}
                </div>

                {/* Phone Input */}
                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark">Số điện thoại *</label>
                  <div style={inputGroupStyle} className="input-group p-3">
                    <span className="input-group-text bg-transparent border-0 text-muted">
                      <FaPhoneAlt />
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      className={`form-control bg-transparent border-0 ${errors.phone ? 'is-invalid' : ''}`}
                      placeholder="Nhập số điện thoại"
                      value={formData.phone}
                      onChange={handleChange}
                      style={{outline: 'none', boxShadow: 'none'}}
                    />
                  </div>
                  {errors.phone && <div className="text-danger small mt-1">{errors.phone}</div>}
                </div>

                {/* Address Input */}
                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark">Địa chỉ *</label>
                  <div style={inputGroupStyle} className="input-group p-3">
                    <span className="input-group-text bg-transparent border-0 text-muted">
                      <FaMapMarkerAlt />
                    </span>
                    <input
                      type="text"
                      name="address"
                      className={`form-control bg-transparent border-0 ${errors.address ? 'is-invalid' : ''}`}
                      placeholder="Nhập địa chỉ"
                      value={formData.address}
                      onChange={handleChange}
                      style={{outline: 'none', boxShadow: 'none'}}
                    />
                  </div>
                  {errors.address && <div className="text-danger small mt-1">{errors.address}</div>}
                </div>

                {/* Avatar Upload */}
                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark">Ảnh đại diện *</label>
                  <div style={fileInputStyle} className="input-group p-3">
                    <span className="input-group-text bg-transparent border-0 text-muted">
                      <FaUser />
                    </span>
                    <input
                      type="file"
                      name="avatar"
                      accept="image/*"
                      className={`form-control bg-transparent border-0 ${errors.avatar ? 'is-invalid' : ''}`}
                      onChange={handleFileChange}
                      style={{outline: 'none', boxShadow: 'none'}}
                    />
                  </div>
                  {errors.avatar && <div className="text-danger small mt-1">{errors.avatar}</div>}
                </div>

                {/* Driver specific fields */}
                {accountType === 'driver' && (
                  <>
                    {/* License Plate Image Upload */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold text-dark">Ảnh biển số xe *</label>
                      <div style={fileInputStyle} className="input-group p-3">
                        <span className="input-group-text bg-transparent border-0 text-muted">
                          <FaCar />
                        </span>
                        <input
                          type="file"
                          name="licensePlateImage"
                          accept="image/*"
                          className={`form-control bg-transparent border-0 ${errors.licensePlateImage ? 'is-invalid' : ''}`}
                          onChange={handleFileChange}
                          style={{outline: 'none', boxShadow: 'none'}}
                        />
                      </div>
                      {errors.licensePlateImage && <div className="text-danger small mt-1">{errors.licensePlateImage}</div>}
                    </div>

                    {/* CMND Front Image Upload */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold text-dark">Ảnh CMND/CCCD mặt trước *</label>
                      <div style={fileInputStyle} className="input-group p-3">
                        <span className="input-group-text bg-transparent border-0 text-muted">
                          <FaIdCard />
                        </span>
                        <input
                          type="file"
                          name="cmndFront"
                          accept="image/*"
                          className={`form-control bg-transparent border-0 ${errors.cmndFront ? 'is-invalid' : ''}`}
                          onChange={handleFileChange}
                          style={{outline: 'none', boxShadow: 'none'}}
                        />
                      </div>
                      {errors.cmndFront && <div className="text-danger small mt-1">{errors.cmndFront}</div>}
                    </div>

                    {/* CMND Back Image Upload */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold text-dark">Ảnh CMND/CCCD mặt sau *</label>
                      <div style={fileInputStyle} className="input-group p-3">
                        <span className="input-group-text bg-transparent border-0 text-muted">
                          <FaIdCard />
                        </span>
                        <input
                          type="file"
                          name="cmndBack"
                          accept="image/*"
                          className={`form-control bg-transparent border-0 ${errors.cmndBack ? 'is-invalid' : ''}`}
                          onChange={handleFileChange}
                          style={{outline: 'none', boxShadow: 'none'}}
                        />
                      </div>
                      {errors.cmndBack && <div className="text-danger small mt-1">{errors.cmndBack}</div>}
                    </div>
                  </>
                )}

                {/* Password Input */}
                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark">Mật khẩu *</label>
                  <div style={inputGroupStyle} className="input-group p-3">
                    <span className="input-group-text bg-transparent border-0 text-muted">
                      <FaLock />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className={`form-control bg-transparent border-0 ${errors.password ? 'is-invalid' : ''}`}
                      placeholder="Nhập mật khẩu"
                      value={formData.password}
                      onChange={handleChange}
                      style={{outline: 'none', boxShadow: 'none'}}
                    />
                    <button
                      type="button"
                      className="btn btn-link text-muted"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.password && <div className="text-danger small mt-1">{errors.password}</div>}
                </div>

                {/* Confirm Password Input */}
                <div className="mb-4">
                  <label className="form-label fw-semibold text-dark">Xác nhận mật khẩu *</label>
                  <div style={inputGroupStyle} className="input-group p-3">
                    <span className="input-group-text bg-transparent border-0 text-muted">
                      <FaLock />
                    </span>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      className={`form-control bg-transparent border-0 ${errors.confirmPassword ? 'is-invalid' : ''}`}
                      placeholder="Xác nhận mật khẩu"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      style={{outline: 'none', boxShadow: 'none'}}
                    />
                    <button
                      type="button"
                      className="btn btn-link text-muted"
                      onClick={toggleConfirmPasswordVisibility}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.confirmPassword && <div className="text-danger small mt-1">{errors.confirmPassword}</div>}
                </div>

                {/* Terms Agreement */}
                <div className="mb-4">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      className={`form-check-input ${errors.agreeTerms ? 'is-invalid' : ''}`}
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                      id="agreeTerms"
                    />
                    <label className="form-check-label" htmlFor="agreeTerms">
                      Tôi đồng ý với <a href="#" className="text-primary">điều khoản sử dụng</a>
                    </label>
                    {errors.agreeTerms && <div className="text-danger small mt-1">{errors.agreeTerms}</div>}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  style={buttonStyle}
                  className="btn btn-primary w-100 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  ) : null}
                  {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
                </button>

                {/* Login Link */}
                <div className="text-center mt-4">
                  <p className="mb-0">
                    Đã có tài khoản? <a href="/login" className="text-primary">Đăng nhập</a>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 