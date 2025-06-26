import React from 'react';
import { FaCog } from 'react-icons/fa';

const SystemSettings = () => {
  const buttonStyle = {
    borderRadius: '10px',
    padding: '12px 24px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease'
  };

  return (
    <div className="card">
      <div className="card-header bg-dark text-white">
        <h4 className="mb-0"><FaCog className="me-2" />Cài đặt hệ thống</h4>
      </div>
      <div className="card-body">
        <form>
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Tên hệ thống</label>
              <input type="text" className="form-control" defaultValue="Tốc Hành Hòa Lạc" />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Email hỗ trợ</label>
              <input type="email" className="form-control" defaultValue="support@tochanh.com" />
            </div>
          </div>
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Phí hệ thống (%)</label>
              <input type="number" className="form-control" defaultValue="10" />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Giá cơ bản (VNĐ/km)</label>
              <input type="number" className="form-control" defaultValue="5000" />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Thông báo bảo trì</label>
            <textarea className="form-control" rows="3" placeholder="Nhập thông báo bảo trì hệ thống..."></textarea>
          </div>
          <button type="submit" className="btn btn-primary" style={buttonStyle}>
            Lưu cài đặt
          </button>
        </form>
      </div>
    </div>
  );
};

export default SystemSettings; 