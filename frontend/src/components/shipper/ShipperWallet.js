import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { walletAPI } from '../../services/api';
import { FaWallet, FaArrowUp, FaArrowDown, FaHistory, FaHome, FaUser, FaMoneyBillWave } from 'react-icons/fa';
import { Card, Table, Badge, Button, Modal, Form } from 'react-bootstrap';
import ShipperHeader from './ShipperHeader';

const ShipperWallet = () => {
  const navigate = useNavigate();
  const [walletData, setWalletData] = useState({
    balance: 0,
    transactions: [],
    revenueHistory: [],
    totalRevenue: 0,
    totalOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawRemarks, setWithdrawRemarks] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const response = await walletAPI.getDriverWallet();
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

  const getTransactionType = (status, type, isRevenueTransaction) => {
    if (isRevenueTransaction) {
      return { type: 'credit', label: 'Doanh thu', color: 'success' };
    }
    
    if (type === 'withdrawal') {
      return { type: 'debit', label: 'Rút tiền', color: 'danger' };
    }
    
    switch (status) {
      case 'disbursed_to_driver':
        return { type: 'credit', label: 'Giải ngân', color: 'success' };
      case 'disputed':
        return { type: 'pending', label: 'Tranh chấp', color: 'warning' };
      default:
        return { type: 'other', label: 'Khác', color: 'secondary' };
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || withdrawAmount <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    if (withdrawAmount > walletData.balance) {
      toast.error('Số dư không đủ để rút tiền');
      return;
    }

    try {
      setWithdrawLoading(true);
      const response = await walletAPI.withdrawMoney({
        amount: Number(withdrawAmount),
        remarks: withdrawRemarks
      });

      if (response.data.success) {
        toast.success('Rút tiền thành công!');
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setWithdrawRemarks('');
        fetchWalletData(); // Refresh wallet data
      } else {
        toast.error(response.data.message || 'Rút tiền thất bại');
      }
    } catch (error) {
      console.error('Error withdrawing money:', error);
      toast.error(error.response?.data?.message || 'Rút tiền thất bại');
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100" style={{backgroundColor: '#f5f7fa'}}>
        <ShipperHeader />
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
      <ShipperHeader />
      
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
            <Button variant="outline-primary" onClick={() => navigate('/shipper')}>
              <FaHome className="me-1" />
              Trang chủ
            </Button>
            <Button variant="outline-secondary" onClick={() => navigate('/shipper/profile')}>
              <FaUser className="me-1" />
              Hồ sơ
            </Button>
          </div>
        </div>

        {/* Balance Card */}
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Body className="p-4">
            <div className="row align-items-center">
              <div className="col-md-6">
                <h5 className="text-muted mb-2">Số dư hiện tại</h5>
                <h2 className="text-primary mb-0 fw-bold">
                  {formatCurrency(walletData.balance)}
                </h2>
              </div>
              <div className="col-md-3 text-end">
                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-3">
                  <FaWallet className="text-primary fs-1" />
                </div>
              </div>
              <div className="col-md-3 text-end">
                <Button 
                  variant="success" 
                  size="lg"
                  onClick={() => setShowWithdrawModal(true)}
                  disabled={walletData.balance <= 0}
                >
                  <FaMoneyBillWave className="me-2" />
                  Rút tiền
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Revenue Summary Card */}
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Body className="p-4">
            <div className="row text-center">
              <div className="col-md-6">
                <h5 className="text-muted mb-2">Tổng doanh thu</h5>
                <h3 className="text-success mb-0 fw-bold">
                  {formatCurrency(walletData.totalRevenue)}
                </h3>
              </div>
              <div className="col-md-6">
                <h5 className="text-muted mb-2">Tổng đơn hàng</h5>
                <h3 className="text-info mb-0 fw-bold">
                  {walletData.totalOrders} đơn
                </h3>
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

            {walletData.transactions.length > 0 ? (
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
                    {walletData.transactions.map(trans => {
                      const transInfo = getTransactionType(trans.status, trans.type, trans.isRevenueTransaction);
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
                              {trans.orderId?._id ? trans.orderId._id.toString().slice(-6) : 'N/A'}
                            </span>
                          </td>
                          <td className="text-end">
                            <span className={`fw-bold ${transInfo.type === 'credit' ? 'text-success' : 'text-warning'}`}>
                              {transInfo.type === 'credit' ? '+' : trans.type === 'withdrawal' ? '-' : ''}{formatCurrency(trans.amount)}
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

        {/* Withdraw Modal */}
        <Modal show={showWithdrawModal} onHide={() => setShowWithdrawModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>
              <FaMoneyBillWave className="me-2 text-success" />
              Rút tiền từ ví
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-3">
              <h6>Số dư hiện tại: <span className="text-primary fw-bold">{formatCurrency(walletData.balance)}</span></h6>
            </div>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Số tiền muốn rút (VNĐ)</Form.Label>
                <Form.Control
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Nhập số tiền..."
                  min="1"
                  max={walletData.balance}
                />
                <Form.Text className="text-muted">
                  Số tiền tối đa có thể rút: {formatCurrency(walletData.balance)}
                </Form.Text>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Ghi chú (tùy chọn)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows="3"
                  value={withdrawRemarks}
                  onChange={(e) => setWithdrawRemarks(e.target.value)}
                  placeholder="Nhập ghi chú..."
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowWithdrawModal(false)}>
              Hủy
            </Button>
            <Button 
              variant="success" 
              onClick={handleWithdraw}
              disabled={withdrawLoading || !withdrawAmount || withdrawAmount <= 0 || withdrawAmount > walletData.balance}
            >
              {withdrawLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <FaMoneyBillWave className="me-2" />
                  Xác nhận rút tiền
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default ShipperWallet; 