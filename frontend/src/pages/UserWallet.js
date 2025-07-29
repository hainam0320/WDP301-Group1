import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { walletAPI } from '../services/api'; // Assuming this path is correct in your project
import { FaWallet, FaArrowUp, FaArrowDown, FaHistory, FaHome, FaUser } from 'react-icons/fa';
import { Card, Table, Badge, Button } from 'react-bootstrap'; // Re-importing react-bootstrap components
import Header from '../components/Header'; // Re-importing your custom Header component

const UserWallet = () => {
  const navigate = useNavigate();
  const [walletData, setWalletData] = useState({
    balance: 0,
    transactions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const response = await walletAPI.getUserWallet();
      if (response.data.success) {
        setWalletData(response.data.data);
      } else {
        toast.error('Không thể tải thông tin ví');
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast.error('Không thể tải thông tin ví');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getTransactionType = (status) => {
    switch (status) {
      case 'refunded_to_user':
        return { type: 'credit', label: 'Hoàn tiền', color: 'success' };
      // Removed the 'disputed' case from here as per the request
      // case 'disputed':
      //   return { type: 'pending', label: 'Tranh chấp', color: 'warning' };
      case 'completed': // Assuming 'completed' is a common successful transaction type
        return { type: 'debit', label: 'Thanh toán', color: 'primary' };
      case 'pending':
        return { type: 'pending', label: 'Đang chờ', color: 'warning' };
      default:
        return { type: 'other', label: 'Khác', color: 'secondary' };
    }
  };

  // Filter out disputed transactions before rendering
  const filteredTransactions = walletData.transactions.filter(
    (trans) => trans.status !== 'disputed'
  );

  if (loading) {
    return (
      <div className="min-vh-100" style={{backgroundColor: '#f5f7fa'}}>
        <Header />
        <div className="container my-5">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <div className="mt-3 text-muted">Đang tải thông tin ví...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{backgroundColor: '#f5f7fa'}}>
      <Header />

      <div className="container my-5">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">
              <FaWallet className="me-2 text-primary" />
              Ví tiền
            </h2>
            <p className="text-muted mb-0">Quản lý số dư và lịch sử giao dịch</p>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-primary" onClick={() => navigate('/home')}>
              <FaHome className="me-1" />
              Trang chủ
            </Button>
            <Button variant="outline-secondary" onClick={() => navigate('/profile')}>
              <FaUser className="me-1" />
              Hồ sơ
            </Button>
          </div>
        </div>

        {/* Balance Card */}
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Body className="p-4">
            <div className="row align-items-center">
              <div className="col-md-8">
                <h5 className="text-muted mb-2">Số dư hiện tại</h5>
                <h2 className="text-primary mb-0 fw-bold">
                  {formatCurrency(walletData.balance)}
                </h2>
              </div>
              <div className="col-md-4 text-end">
                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-3">
                  <FaWallet className="text-primary fs-1" />
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Transaction History */}
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="mb-0">
                <FaHistory className="me-2 text-primary" />
                Lịch sử giao dịch
              </h5>
              <Button variant="outline-primary" size="sm" onClick={fetchWalletData}>
                Làm mới
              </Button>
            </div>

            {filteredTransactions.length > 0 ? (
              <div className="table-responsive">
                <Table hover className="align-middle">
                  <thead>
                    <tr className="bg-light">
                      <th className="py-3">Loại giao dịch</th>
                      <th className="py-3">Mã đơn hàng</th>
                      <th className="text-end py-3">Số tiền</th>
                      <th className="text-center py-3">Trạng thái</th>
                      <th className="py-3">Ngày xử lý</th>
                      <th className="py-3">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map(trans => {
                      const transInfo = getTransactionType(trans.status);
                      return (
                        <tr key={trans._id} className="border-bottom">
                          <td>
                            <div className="d-flex align-items-center">
                              {transInfo.type === 'credit' ? (
                                <FaArrowUp className="text-success me-2" />
                              ) : (
                                <FaArrowDown className="text-warning me-2" />
                              )}
                              <span className="fw-medium">{transInfo.label}</span>
                            </div>
                          </td>
                          <td>
                            <span className="text-primary fw-medium">
                              {trans.orderId?._id ? trans.orderId._id.slice(-6) : 'N/A'}
                            </span>
                          </td>
                          <td className="text-end">
                            <span className={`fw-bold ${transInfo.type === 'credit' ? 'text-success' : 'text-warning'}`}>
                              {transInfo.type === 'credit' ? '+' : ''}{formatCurrency(trans.amount)}
                            </span>
                          </td>
                          <td className="text-center">
                            <Badge bg={transInfo.color} className="px-3 py-2">
                              {transInfo.label}
                            </Badge>
                          </td>
                          <td>
                            {trans.processed_at ? (
                              <div>
                                <div className="fw-medium">{new Date(trans.processed_at).toLocaleDateString('vi-VN')}</div>
                                <small className="text-muted">{new Date(trans.processed_at).toLocaleTimeString('vi-VN')}</small>
                              </div>
                            ) : '-'}
                          </td>
                          <td>
                            <small className="text-muted">
                              {trans.remarks || 'Không có ghi chú'}
                            </small>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-5">
                <FaHistory className="fs-1 mb-3 text-muted" />
                <div className="text-muted">Chưa có giao dịch nào</div>
                <small className="text-muted">Lịch sử giao dịch sẽ hiển thị ở đây</small>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default UserWallet;
