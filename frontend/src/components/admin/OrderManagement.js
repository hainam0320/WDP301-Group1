import React, { useState, useEffect } from 'react';
import { FaEye, FaEdit } from 'react-icons/fa';
import { adminAPI } from '../../services/api';
import { toast } from 'react-toastify';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

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
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
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
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-outline-primary" title="Xem chi tiết">
                          <FaEye />
                        </button>
                        <button className="btn btn-outline-warning" title="Chỉnh sửa">
                          <FaEdit />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManagement; 