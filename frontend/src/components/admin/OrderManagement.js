import React, { useState, useEffect } from 'react';
import { FaEye, FaEdit } from 'react-icons/fa';
import { adminAPI } from '../../services/api';
import { toast } from 'react-toastify';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 3;

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const ordersData = await adminAPI.getOrders();
      setOrders(ordersData.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header bg-info text-white">
        <h4 className="mb-0">Quản lý đơn hàng</h4>
      </div>
      <div className="card-body">
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Shipper</th>
                  <th>Tuyến đường</th>
                  <th>Giá</th>
                  <th>Trạng thái</th>
                  <th>Ngày</th>
                 
                </tr>
              </thead>
              <tbody>
                {orders
                  .slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage)
                  .map(order => (
                    <tr key={order._id}>
                      <td>#{order._id}</td>
                      <td>{order.customer}</td>
                      <td>{order.shipper}</td>
                      <td>{order.from} → {order.to}</td>
                      <td className="fw-bold">{order.price.toLocaleString()} VNĐ</td>
                      <td>
                        <span className={`badge ${
                          order.status === 'completed' ? 'bg-success' : 
                          order.status === 'in-progress' ? 'bg-warning' : 'bg-secondary'
                        }`}>
                          {order.status === 'completed' ? 'Hoàn thành' : 
                           order.status === 'in-progress' ? 'Đang giao' : 'Chờ xử lý'}
                        </span>
                      </td>
                      <td>{new Date(order.date).toLocaleDateString('vi-VN')}</td>
                     
                    </tr>
                  ))}
              </tbody>
            </table>
            {/* Pagination */}
            {orders.length > ordersPerPage && (
              <nav>
                <ul className="pagination justify-content-center">
                  <li className={`page-item${currentPage === 1 ? ' disabled' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
                      Trước
                    </button>
                  </li>
                  {[...Array(Math.ceil(orders.length / ordersPerPage))].map((_, idx) => (
                    <li key={idx} className={`page-item${currentPage === idx + 1 ? ' active' : ''}`}>
                      <button className="page-link" onClick={() => setCurrentPage(idx + 1)}>
                        {idx + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item${currentPage === Math.ceil(orders.length / ordersPerPage) ? ' disabled' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === Math.ceil(orders.length / ordersPerPage)}>
                      Sau
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManagement; 