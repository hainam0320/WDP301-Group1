import React, { useState, useEffect } from 'react';
import { FaDollarSign } from 'react-icons/fa';
import { adminAPI } from '../../services/api';
import { toast } from 'react-toastify';

const RevenueReport = () => {
  const [revenues, setRevenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    fetchRevenue();
  }, []);

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      const revenueData = await adminAPI.getRevenue();
      setRevenues(revenueData.data);
      if (revenueData.data.length > 0) {
        setSelectedMonth(revenueData.data[0].month); // Mặc định chọn tháng đầu tiên
      }
    } catch (error) {
      console.error('Error fetching revenue:', error);
      toast.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const selectedRevenue = revenues.find(r => r.month === selectedMonth) || {};

  return (
    <div className="card">
      <div className="card-header bg-warning text-dark">
        <h4 className="mb-0"><FaDollarSign className="me-2" />Báo cáo doanh thu</h4>
      </div>
      <div className="card-body">
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-3">
              <label>Chọn tháng:</label>
              <select
                className="form-select w-auto d-inline-block ms-2"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
              >
                {revenues.map((r, idx) => (
                  <option key={idx} value={r.month}>{r.month}</option>
                ))}
              </select>
            </div>
            <div className="row mb-4">
              <div className="col-md-4">
                <div className="card bg-success text-white">
                  <div className="card-body text-center">
                    <h5>Doanh thu tháng này</h5>
                    <h3>{selectedRevenue.revenue?.toLocaleString() || 0} VNĐ</h3>
                    <small>Doanh thu tháng này</small>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card bg-info text-white">
                  <div className="card-body text-center">
                    <h5>Số đơn hàng</h5>
                    <h3>{selectedRevenue.orders || 0}</h3>
                    <small>Đơn hàng trong tháng</small>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card bg-primary text-white">
                  <div className="card-body text-center">
                    <h5>Trung bình/đơn</h5>
                    <h3>{selectedRevenue.orders ? Math.round(selectedRevenue.revenue / selectedRevenue.orders).toLocaleString() : 0} VNĐ</h3>
                    <small>Giá trị trung bình</small>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Doanh thu</th>
                    <th>Số đơn hàng</th>
                    
                    <th>Trung bình/đơn</th>
                  </tr>
                </thead>
                <tbody>
                  {revenues.map((revenue, index) => (
                    <tr key={index}>
                      <td>{revenue.month}</td>
                      <td className="fw-bold text-success">{revenue.revenue.toLocaleString()} VNĐ</td>
                      <td>{revenue.orders}</td>
                      
                      <td>{revenue.orders ? Math.round(revenue.revenue / revenue.orders).toLocaleString() : 0} VNĐ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RevenueReport; 