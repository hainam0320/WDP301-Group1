import React, { useState } from 'react';
import axios from 'axios';

function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: nhập email, 2: nhập mã + mật khẩu mới
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const handleSendCode = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');
    try {
      await axios.post('http://localhost:9999/api/users/forgot-password/send', { email });
      setStep(2);
      setMsg('Đã gửi mã xác thực về email. Vui lòng kiểm tra hộp thư đến hoặc spam.');
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi gửi mã xác thực');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp!');
      return;
    }
    try {
      await axios.post('http://localhost:9999/api/users/forgot-password/reset', {
        email,
        code,
        newPassword
      });
      setMsg('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập lại.');
      setStep(1);
      setEmail('');
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi đặt lại mật khẩu');
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <div className="card p-4" style={{ maxWidth: 400, width: '100%' }}>
        <h3 className="mb-3 text-center">Quên mật khẩu</h3>
        {step === 1 ? (
          <form onSubmit={handleSendCode}>
            <div className="mb-3">
              <label className="form-label">Nhập email đã đăng ký</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary w-100" type="submit">Gửi mã xác thực</button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="mb-3">
              <label className="form-label">Mã xác thực</label>
              <input
                type="text"
                className="form-control"
                value={code}
                onChange={e => setCode(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Mật khẩu mới</label>
              <input
                type="password"
                className="form-control"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Nhập lại mật khẩu mới</label>
              <input
                type="password"
                className="form-control"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-success w-100" type="submit">Đặt lại mật khẩu</button>
          </form>
        )}
        {msg && <div className="alert alert-info mt-3">{msg}</div>}
        {error && <div className="alert alert-danger mt-3">{error}</div>}
        <div className="text-center mt-3">
          <a href="/login">Quay lại đăng nhập</a>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword; 