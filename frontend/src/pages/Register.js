import React, { useState } from 'react';
import logo from '../assets/img/favicon.png';
import { FaUser, FaPhoneAlt, FaLock, FaEye, FaEyeSlash, FaMapMarkerAlt, FaEnvelope, FaCheck } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
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

    // Validate terms agreement
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'Vui lòng đồng ý với điều khoản sử dụng';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Form submitted:', formData);
      // Handle registration logic here
      alert('Đăng ký thành công!');
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

                {/* Email and Phone Row */}
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold text-dark">Email *</label>
                    <div 
                      style={inputGroupStyle} 
                      className="input-group p-3"
                    >
                      <span className="input-group-text bg-transparent border-0 text-muted">
                        <FaEnvelope />
                      </span>
                      <input
                        type="email"
                        name="email"
                        className={`form-control bg-transparent border-0 text-dark ${errors.email ? 'is-invalid' : ''}`}
                        placeholder="example@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        style={{outline: 'none', boxShadow: 'none'}}
                      />
                    </div>
                    {errors.email && <div className="text-danger small mt-1">{errors.email}</div>}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold text-dark">Số điện thoại *</label>
                    <div 
                      style={inputGroupStyle} 
                      className="input-group p-3"
                    >
                      <span className="input-group-text bg-transparent border-0 text-muted">
                        <FaPhoneAlt />
                      </span>
                      <input
                        type="tel"
                        name="phone"
                        className={`form-control bg-transparent border-0 text-dark ${errors.phone ? 'is-invalid' : ''}`}
                        placeholder="0123456789"
                        value={formData.phone}
                        onChange={handleChange}
                        style={{outline: 'none', boxShadow: 'none'}}
                      />
                    </div>
                    {errors.phone && <div className="text-danger small mt-1">{errors.phone}</div>}
                  </div>
                </div>

                {/* Address Input */}
                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark">Địa chỉ *</label>
                  <div 
                    style={inputGroupStyle} 
                    className="input-group p-3"
                  >
                    <span className="input-group-text bg-transparent border-0 text-muted">
                      <FaMapMarkerAlt />
                    </span>
                    <input
                      type="text"
                      name="address"
                      className={`form-control bg-transparent border-0 text-dark ${errors.address ? 'is-invalid' : ''}`}
                      placeholder="Nhập địa chỉ đầy đủ"
                      value={formData.address}
                      onChange={handleChange}
                      style={{outline: 'none', boxShadow: 'none'}}
                    />
                  </div>
                  {errors.address && <div className="text-danger small mt-1">{errors.address}</div>}
                </div>

                {/* Password and Confirm Password Row */}
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold text-dark">Mật khẩu *</label>
                    <div 
                      style={inputGroupStyle} 
                      className="input-group p-3"
                    >
                      <span className="input-group-text bg-transparent border-0 text-muted">
                        <FaLock />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        className={`form-control bg-transparent border-0 text-dark ${errors.password ? 'is-invalid' : ''}`}
                        placeholder="Ít nhất 6 ký tự"
                        value={formData.password}
                        onChange={handleChange}
                        style={{outline: 'none', boxShadow: 'none'}}
                      />
                      <button
                        type="button"
                        className="btn bg-transparent border-0 text-muted"
                        onClick={togglePasswordVisibility}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {errors.password && <div className="text-danger small mt-1">{errors.password}</div>}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold text-dark">Xác nhận mật khẩu *</label>
                    <div 
                      style={inputGroupStyle} 
                      className="input-group p-3"
                    >
                      <span className="input-group-text bg-transparent border-0 text-muted">
                        <FaLock />
                      </span>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        className={`form-control bg-transparent border-0 text-dark ${errors.confirmPassword ? 'is-invalid' : ''}`}
                        placeholder="Nhập lại mật khẩu"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        style={{outline: 'none', boxShadow: 'none'}}
                      />
                      <button
                        type="button"
                        className="btn bg-transparent border-0 text-muted"
                        onClick={toggleConfirmPasswordVisibility}
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {errors.confirmPassword && <div className="text-danger small mt-1">{errors.confirmPassword}</div>}
                  </div>
                </div>

                {/* Terms Agreement */}
                <div className="mb-4">
                  <div className="form-check">
                    <input 
                      className={`form-check-input ${errors.agreeTerms ? 'is-invalid' : ''}`} 
                      type="checkbox" 
                      name="agreeTerms"
                      id="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                    />
                    <label className="form-check-label text-muted" htmlFor="agreeTerms">
                      Tôi đồng ý với{' '}
                      <a href="#" className="text-decoration-none fw-bold">
                        Điều khoản sử dụng
                      </a>
                      {' '}và{' '}
                      <a href="#" className="text-decoration-none fw-bold">
                        Chính sách bảo mật
                      </a>
                    </label>
                  </div>
                  {errors.agreeTerms && <div className="text-danger small mt-1">{errors.agreeTerms}</div>}
                </div>

                {/* Register Button */}
                <button
                  type="submit"
                  style={buttonStyle}
                  className="btn btn-primary w-100 mb-4"
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 12px 25px rgba(0, 123, 255, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 8px 20px rgba(0, 123, 255, 0.3)';
                  }}
                >
                  <span className="d-flex align-items-center justify-content-center">
                    <FaCheck className="me-2" />
                    Tạo tài khoản
                  </span>
                </button>

                {/* Divider */}
                <div className="position-relative my-4">
                  <hr className="text-muted" />
                  <span className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted">
                    hoặc
                  </span>
                </div>

                {/* Social Register Buttons */}
                <div className="row g-3 mb-4">
                  <div className="col-6">
                    <button
                      type="button"
                      className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center"
                      style={{borderRadius: '15px', padding: '12px'}}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877f2" className="me-2">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <span className="fw-medium">Facebook</span>
                    </button>
                  </div>
                  <div className="col-6">
                    <button
                      type="button"
                      className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center"
                      style={{borderRadius: '15px', padding: '12px'}}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#dc3545" className="me-2">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span className="fw-medium">Google</span>
                    </button>
                  </div>
                </div>

                {/* Login Link */}
                <p className="text-center text-muted mb-0">
                  Đã có tài khoản?{' '}
                  <a href="/login" className="text-decoration-none fw-bold">
                    Đăng nhập ngay
                  </a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 