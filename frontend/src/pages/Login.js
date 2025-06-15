// src/pages/Login.js
import React, { useState } from 'react';
import { authAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from '../assets/img/favicon.png';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      console.log('Sending login request:', { email, password });
      const res = await authAPI.login({ email, password });
      console.log('Login response:', res.data);

      // Lưu token và user
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      const role = res.data.user.role;
      if (role === 'driver') {
        navigate('/shipper');
      } else if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/home');
      }
    } catch (err) {
      console.error('Login error:', err.response?.data || err);
      if (err.response?.status === 403) {
        setError('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.');
      } else {
        setError(err.response?.data?.message || 'Đăng nhập thất bại!');
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Styling
  const loginPageStyle = {
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
    bottom: '15%',
    right: '10%',
    width: '120px',
    height: '120px',
    background: 'rgba(255, 193, 7, 0.2)',
    borderRadius: '50%',
    filter: 'blur(50px)'
  };

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '25px',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
    maxWidth: '450px',
    width: '100%',
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
    <div style={loginPageStyle} className="d-flex align-items-center justify-content-center py-5">
      {/* Background decorative elements */}
      <div style={decorativeStyle1}></div>
      <div style={decorativeStyle2}></div>

      <div style={cardStyle} className="p-4 p-md-5 mx-3">
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
          <h1 className="h2 fw-bold text-dark mb-2">Đăng nhập</h1>
          <p className="text-muted fs-5">Chào mừng đến với Tốc Hành Hòa Lạc</p>
          <div style={{width: '60px', height: '4px', background: 'linear-gradient(135deg, #007bff, #6f42c1)', borderRadius: '2px'}} className="mx-auto"></div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleLogin}>
          {/* Email Input */}
          <div className="mb-4">
            <label className="form-label fw-semibold text-dark">Email</label>
            <div style={inputGroupStyle} className="input-group p-2">
              <span className="input-group-text bg-transparent border-0 text-muted">
                <FaUser />
              </span>
              <input
                type="email"
                className="form-control bg-transparent border-0"
                placeholder="Nhập địa chỉ email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{outline: 'none', boxShadow: 'none'}}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <label className="form-label fw-semibold text-dark">Mật khẩu</label>
            <div style={inputGroupStyle} className="input-group p-2">
              <span className="input-group-text bg-transparent border-0 text-muted">
                <FaLock />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                className="form-control bg-transparent border-0"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-100 mb-3"
            style={buttonStyle}
          >
            Đăng nhập
          </button>

          <div className="text-center">
            <p className="mb-0">
              Chưa có tài khoản? <a href="/register" className="text-primary fw-bold">Đăng ký ngay</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
