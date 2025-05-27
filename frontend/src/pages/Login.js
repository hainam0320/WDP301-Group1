import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/img/favicon.png';
import { FaPhoneAlt, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is already logged in
  React.useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (currentUser) {
      switch (currentUser.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'shipper':
          navigate('/shipper');
          break;
        case 'user':
        default:
          navigate('/home');
          break;
      }
    }
  }, [navigate]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Mock user database for demo
  const mockUsers = [
    { phone: '0123456789', password: '123456', role: 'user', name: 'Nguyễn Văn A' },
    { phone: '0987654321', password: '123456', role: 'shipper', name: 'Lê Văn Shipper' },
    { phone: '0111222333', password: 'admin123', role: 'admin', name: 'Administrator' }
  ];

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const user = mockUsers.find(u => u.phone === phoneNumber && u.password === password);
      
      if (user) {
        // Store user info in localStorage (in real app, use proper auth)
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Navigate based on role
        switch (user.role) {
          case 'admin':
            navigate('/admin');
            break;
          case 'shipper':
            navigate('/shipper');
            break;
          case 'user':
          default:
            navigate('/home');
            break;
        }
      } else {
        alert('Số điện thoại hoặc mật khẩu không đúng!');
      }
      setIsLoading(false);
    }, 1000);
  };

  const loginPageStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    minHeight: '100vh',
    position: 'relative',
    overflow: 'hidden'
  };

  const decorativeStyle1 = {
    position: 'absolute',
    top: '10%',
    left: '10%',
    width: '120px',
    height: '120px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '50%',
    filter: 'blur(50px)'
  };

  const decorativeStyle2 = {
    position: 'absolute',
    top: '30%',
    right: '15%',
    width: '80px',
    height: '80px',
    background: 'rgba(255, 193, 7, 0.3)',
    borderRadius: '50%',
    filter: 'blur(40px)'
  };

  const decorativeStyle3 = {
    position: 'absolute',
    bottom: '20%',
    left: '15%',
    width: '150px',
    height: '150px',
    background: 'rgba(220, 53, 69, 0.2)',
    borderRadius: '50%',
    filter: 'blur(60px)'
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

  const socialButtonStyle = {
    border: '2px solid #e9ecef',
    borderRadius: '15px',
    padding: '12px',
    background: 'white',
    transition: 'all 0.3s ease'
  };

  return (
    <div style={loginPageStyle} className="d-flex align-items-center justify-content-center">
      {/* Background decorative elements */}
      <div style={decorativeStyle1}></div>
      <div style={decorativeStyle2}></div>
      <div style={decorativeStyle3}></div>

      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-6 col-lg-5">
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
                <h1 className="h2 fw-bold text-dark mb-2">Tốc Hành Hòa Lạc</h1>
                <p className="text-muted fs-5">Dịch vụ giao hàng & đưa đón</p>
                <div style={{width: '60px', height: '4px', background: 'linear-gradient(135deg, #007bff, #6f42c1)', borderRadius: '2px'}} className="mx-auto"></div>
              </div>

              <form onSubmit={handleLogin}>
                {/* Demo Accounts Info */}
                <div className="alert alert-info mb-4">
                  <h6 className="fw-bold mb-2">Tài khoản demo:</h6>
                  <small>
                    <strong>User:</strong> 0123456789 / 123456<br/>
                    <strong>Shipper:</strong> 0987654321 / 123456<br/>
                    <strong>Admin:</strong> 0111222333 / admin123
                  </small>
                </div>

                {/* Phone Number Input */}
                <div className="mb-4">
                  <label className="form-label fw-semibold text-dark">Số điện thoại</label>
                  <div 
                    style={inputGroupStyle} 
                    className="input-group p-3"
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#007bff';
                      e.currentTarget.style.background = 'white';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e9ecef';
                      e.currentTarget.style.background = '#f8f9fa';
                    }}
                  >
                    <span className="input-group-text bg-transparent border-0 text-muted">
                      <FaPhoneAlt />
                    </span>
                    <input
                      type="tel"
                      className="form-control bg-transparent border-0 text-dark"
                      placeholder="Nhập số điện thoại"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      style={{outline: 'none', boxShadow: 'none'}}
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="mb-4">
                  <label className="form-label fw-semibold text-dark">Mật khẩu</label>
                  <div 
                    style={inputGroupStyle} 
                    className="input-group p-3"
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#007bff';
                      e.currentTarget.style.background = 'white';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e9ecef';
                      e.currentTarget.style.background = '#f8f9fa';
                    }}
                  >
                    <span className="input-group-text bg-transparent border-0 text-muted">
                      <FaLock />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control bg-transparent border-0 text-dark"
                      placeholder="Nhập mật khẩu"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{outline: 'none', boxShadow: 'none'}}
                      required
                    />
                    <button
                      type="button"
                      className="btn bg-transparent border-0 text-muted"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="rememberMe" />
                    <label className="form-check-label text-muted" htmlFor="rememberMe">
                      Ghi nhớ đăng nhập
                    </label>
                  </div>
                  <a href="#" className="text-decoration-none fw-semibold">
                    Quên mật khẩu?
                  </a>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  style={buttonStyle}
                  className="btn btn-primary w-100 mb-4"
                  disabled={isLoading}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 12px 25px rgba(0, 123, 255, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 8px 20px rgba(0, 123, 255, 0.3)';
                    }
                  }}
                >
                  <span className="d-flex align-items-center justify-content-center">
                    {isLoading ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                        Đang đăng nhập...
                      </>
                    ) : (
                      <>
                        Đăng nhập
                        <i className="bi bi-arrow-right ms-2"></i>
                      </>
                    )}
                  </span>
                </button>

                {/* Divider */}
                <div className="position-relative my-4">
                  <hr className="text-muted" />
                  <span className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted">
                    hoặc
                  </span>
                </div>

                {/* Social Login Buttons */}
                <div className="row g-3 mb-4">
                  <div className="col-6">
                    <button
                      type="button"
                      style={socialButtonStyle}
                      className="btn w-100 d-flex align-items-center justify-content-center"
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = '#007bff';
                        e.target.style.background = '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = '#e9ecef';
                        e.target.style.background = 'white';
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877f2">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <span className="ms-2 fw-medium">Facebook</span>
                    </button>
                  </div>
                  <div className="col-6">
                    <button
                      type="button"
                      style={socialButtonStyle}
                      className="btn w-100 d-flex align-items-center justify-content-center"
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = '#dc3545';
                        e.target.style.background = '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = '#e9ecef';
                        e.target.style.background = 'white';
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#dc3545">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span className="ms-2 fw-medium">Google</span>
                    </button>
                  </div>
                </div>

                                  {/* Sign Up Link */}
                  <p className="text-center text-muted mb-0">
                    Chưa có tài khoản?{' '}
                    <a href="/register" className="text-decoration-none fw-bold">
                      Đăng ký ngay
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

export default Login;
