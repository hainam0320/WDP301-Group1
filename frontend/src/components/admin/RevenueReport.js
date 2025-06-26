import React, { useState, useEffect } from 'react';
import { FaDollarSign } from 'react-icons/fa';
import { adminAPI } from '../../services/api';
import { toast } from 'react-toastify';

const RevenueReport = () => {
  const [revenues, setRevenues] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRevenue();
  }, []);

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      const revenueData = await adminAPI.getRevenue();
      setRevenues(revenueData.data);
    } catch (error) {
      console.error('Error fetching revenue:', error);
      toast.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

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
            <div className="row mb-4">
              <div className="col-md-4">
                <div className="card bg-success text-white">
                  <div className="card-body text-center">
                    <h5>Doanh thu tháng này</h5>
                    <h3>{revenues[0]?.revenue.toLocaleString()} VNĐ</h3>
                    <small>Tăng trưởng: {revenues[0]?.growth}</small>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card bg-info text-white">
                  <div className="card-body text-center">
                    <h5>Số đơn hàng</h5>
                    <h3>{revenues[0]?.orders}</h3>
                    <small>Đơn hàng trong tháng</small>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card bg-primary text-white">
                  <div className="card-body text-center">
                    <h5>Trung bình/đơn</h5>
                    <h3>{Math.round(revenues[0]?.revenue / revenues[0]?.orders).toLocaleString()} VNĐ</h3>
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
                    <th>Tăng trưởng</th>
                    <th>Trung bình/đơn</th>
                  </tr>
                </thead>
                <tbody>
                  {revenues.map((revenue, index) => (
                    <tr key={index}>
                      <td>{revenue.month}</td>
                      <td className="fw-bold text-success">{revenue.revenue.toLocaleString()} VNĐ</td>
                      <td>{revenue.orders}</td>
                      <td className="text-success">{revenue.growth}</td>
                      <td>{Math.round(revenue.revenue / revenue.orders).toLocaleString()} VNĐ</td>
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