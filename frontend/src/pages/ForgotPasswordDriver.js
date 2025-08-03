import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaArrowLeft, FaEye, FaEyeSlash } from 'react-icons/fa';
import { shipperAPI } from '../services/api';

const ForgotPasswordDriver = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: nhập email, 2: nhập mã, 3: đặt mật khẩu mới
  const [formData, setFormData] = useState({
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState({ type: '', content: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      setMessages({ type: 'error', content: 'Vui lòng nhập email' });
      return;
    }

    setIsLoading(true);
    setMessages({ type: '', content: '' });

    try {
      const response = await shipperAPI.sendForgotPasswordCode(formData.email);
      setMessages({ type: 'success', content: response.data.message });
      setStep(2);
    } catch (error) {
      console.error('Error sending code:', error);
      setMessages({ type: 'error', content: error.response?.data?.message || 'Lỗi khi gửi mã xác thực' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!formData.code) {
      setMessages({ type: 'error', content: 'Vui lòng nhập mã xác thực' });
      return;
    }

    setIsLoading(true);
    setMessages({ type: '', content: '' });

    try {
      // Chỉ kiểm tra mã, chưa đặt lại mật khẩu
      setStep(3);
    } catch (error) {
      console.error('Error verifying code:', error);
      setMessages({ type: 'error', content: error.response?.data?.message || 'Lỗi khi xác thực mã' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!formData.newPassword || !formData.confirmPassword) {
      setMessages({ type: 'error', content: 'Vui lòng nhập đầy đủ thông tin' });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessages({ type: 'error', content: 'Mật khẩu xác nhận không khớp' });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessages({ type: 'error', content: 'Mật khẩu phải có ít nhất 6 ký tự' });
      return;
    }

    setIsLoading(true);
    setMessages({ type: '', content: '' });

    try {
      const response = await shipperAPI.resetPassword({
        email: formData.email,
        code: formData.code,
        newPassword: formData.newPassword
      });
      setMessages({ type: 'success', content: response.data.message });
      
      // Chuyển về trang đăng nhập sau 2 giây
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Error resetting password:', error);
      setMessages({ type: 'error', content: error.response?.data?.message || 'Lỗi khi đặt lại mật khẩu' });
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
    <div className="min-vh-100 d-flex align-items-center" style={{backgroundColor: '#f5f7fa'}}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <button 
              className="btn btn-outline-primary mb-4"
              onClick={() => navigate('/login')}
            >
              <FaArrowLeft className="me-2" />
              Quay lại đăng nhập
            </button>

            <div className="card" style={cardStyle}>
              <div className="card-header bg-warning text-dark text-center">
                <h4 className="mb-0">
                  <FaLock className="me-2" />
                  Quên mật khẩu - Tài xế
                </h4>
              </div>
              <div className="card-body p-4">
                {messages.content && (
                  <div className={`alert alert-${messages.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`} role="alert">
                    {messages.content}
                    <button type="button" className="btn-close" onClick={() => setMessages({ type: '', content: '' })}></button>
                  </div>
                )}

                {step === 1 && (
                  <form onSubmit={handleSendCode}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        <FaEnvelope className="me-2" />
                        Email
                      </label>
                      <input 
                        type="email" 
                        className="form-control" 
                        placeholder="Nhập email của bạn"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="btn btn-warning w-100" 
                      style={buttonStyle}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Đang gửi...
                        </>
                      ) : (
                        'Gửi mã xác thực'
                      )}
                    </button>
                  </form>
                )}

                {step === 2 && (
                  <form onSubmit={handleVerifyCode}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        <FaEnvelope className="me-2" />
                        Mã xác thực
                      </label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Nhập mã 6 số đã gửi về email"
                        value={formData.code}
                        onChange={(e) => setFormData({...formData, code: e.target.value})}
                        maxLength={6}
                        required
                      />
                      <small className="text-muted">
                        Mã xác thực đã được gửi đến {formData.email}
                      </small>
                    </div>
                    <div className="d-flex gap-2">
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary flex-fill"
                        onClick={() => setStep(1)}
                      >
                        Quay lại
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-warning flex-fill" 
                        style={buttonStyle}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Đang xác thực...
                          </>
                        ) : (
                          'Xác thực mã'
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {step === 3 && (
                  <form onSubmit={handleResetPassword}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        <FaLock className="me-2" />
                        Mật khẩu mới
                      </label>
                      <div className="input-group">
                        <input 
                          type={showPassword ? "text" : "password"}
                          className="form-control" 
                          placeholder="Nhập mật khẩu mới"
                          value={formData.newPassword}
                          onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                          required
                        />
                        <button 
                          type="button" 
                          className="btn btn-outline-secondary"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        <FaLock className="me-2" />
                        Xác nhận mật khẩu
                      </label>
                      <div className="input-group">
                        <input 
                          type={showConfirmPassword ? "text" : "password"}
                          className="form-control" 
                          placeholder="Nhập lại mật khẩu mới"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                          required
                        />
                        <button 
                          type="button" 
                          className="btn btn-outline-secondary"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary flex-fill"
                        onClick={() => setStep(2)}
                      >
                        Quay lại
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-success flex-fill" 
                        style={buttonStyle}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Đang đặt lại...
                          </>
                        ) : (
                          'Đặt lại mật khẩu'
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordDriver; 