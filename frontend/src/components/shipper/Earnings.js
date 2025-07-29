import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaDollarSign, FaArrowLeft, FaWallet } from 'react-icons/fa'; // Thêm FaWallet
import axios from 'axios';
import ShipperHeader from './ShipperHeader';
import { transactionAPI } from '../../services/api'; // Import transactionAPI

const Earnings = () => {
  const navigate = useNavigate();
  const [earnings, setEarnings] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    total: 0,
    deliveries: {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      total: 0
    },
    currentBalance: 0 // Thêm trường số dư ví hiện tại
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // const BASE_URL = 'http://localhost:9999'; // Base URL đã có trong api.js, không cần thiết ở đây

  const fetchEarnings = async () => {
    setIsLoading(true);
    try {
      // Thay đổi cách lấy dữ liệu để phù hợp với transactionAPI mới
      const response = await transactionAPI.getDriverEarningsOverview(); // API mới
      
      if (response.data.success) {
        setEarnings(response.data.overview); // Cập nhật state với overview từ API
      } else {
        setError('Không thể tải dữ liệu: ' + (response.data.message || 'Lỗi không xác định'));
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
      if (error.response) {
        console.error('Server error:', error.response.data);
        setError(`Lỗi server: ${error.response.data.message || 'Không xác định'}`);
      } else if (error.request) {
        console.error('No response:', error.request);
        setError('Không thể kết nối đến server');
      } else {
        console.error('Error:', error.message);
        setError(`Lỗi: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const cardStyle = {
    borderRadius: '15px',
    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
    border: 'none'
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
          <div className="card-header bg-warning text-dark">
            <h4 className="mb-0"><FaDollarSign className="me-2" />Thống kê thu nhập</h4>
          </div>
          <div className="card-body">
            {error && <div className="alert alert-danger">{error}</div>}
            {isLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-warning" role="status">
                  <span className="visually-hidden">Đang tải...</span>
                </div>
              </div>
            ) : (
              <div className="row">
                 {/* Thẻ hiển thị số dư ví hiện tại */}
                <div className="col-12 mb-4">
                  <div className="card bg-primary text-white">
                    <div className="card-body d-flex align-items-center justify-content-between">
                      <div>
                        <h5 className="card-title mb-1">Số dư ví hiện tại</h5>
                        <h3 className="mb-0 fw-bold">{earnings.currentBalance.toLocaleString()} VNĐ</h3>
                      </div>
                      <FaWallet size={40} />
                    </div>
                  </div>
                </div>

                {/* Các thẻ thu nhập khác */}
                <div className="col-md-6 mb-4">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h5 className="card-title">Tổng hoa hồng đã trích</h5>
                      <h3 className="text-success">{earnings.totalCommissionCollected.toLocaleString()} VNĐ</h3>
                      <small className="text-muted">
                        {/* Đây là tổng tiền hoa hồng công ty đã trích từ đơn hàng */}
                        Tổng số tiền hoa hồng đã trích từ các đơn hàng
                      </small>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mb-4">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h5 className="card-title">Tổng tiền đã nhận (giải ngân)</h5>
                      <h3 className="text-info">{earnings.totalPayoutDisbursed.toLocaleString()} VNĐ</h3>
                      <small className="text-muted">
                        {/* Đây là tổng tiền công ty đã giải ngân cho tài xế */}
                        Tổng số tiền đã giải ngân vào ví của bạn
                      </small>
                    </div>
                  </div>
                </div>
                {/* Các thẻ "today", "thisWeek", "thisMonth", "total" của luồng cũ có thể cần được tái cấu trúc hoặc bỏ đi */}
                {/* Ví dụ, bạn có thể thêm API để lấy chi tiết thu nhập theo ngày/tuần/tháng từ các giao dịch payout_to_driver */}
                {/* Tạm thời tôi sẽ giữ lại khung, nhưng lưu ý rằng dữ liệu này cần được tính toán lại từ CompanyTransaction type: 'payout_to_driver' */}
                {/* Để đơn giản trong bản sửa này, tôi chỉ tập trung vào currentBalance và tổng hoa hồng/giải ngân */}
                {/* Nếu muốn hiển thị chi tiết theo ngày/tuần/tháng, cần chỉnh sửa lại API /api/shipper/earnings ở backend để trả về dữ liệu đó từ các bản ghi CompanyTransaction type: 'payout_to_driver' */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Earnings;