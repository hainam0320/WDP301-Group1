import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaQrcode, FaSpinner } from 'react-icons/fa';
import { Modal, Button } from 'react-bootstrap';
import { transactionAPI } from '../../services/api';
import ShipperHeader from './ShipperHeader';
import { toast } from 'react-hot-toast';

const CommissionManagement = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('pending');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [overview, setOverview] = useState({
        totalCommission: 0,
        pendingAmount: 0,
        confirmedAmount: 0,
        rejectedAmount: 0
    });
    const [pendingCommissions, setPendingCommissions] = useState([]);
    const [commissionHistory, setCommissionHistory] = useState([]);
    const [selectedTransactions, setSelectedTransactions] = useState([]);

    // QR Payment states
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrData, setQRData] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [statusCheckInterval, setStatusCheckInterval] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        return () => {
            if (statusCheckInterval) {
                clearInterval(statusCheckInterval);
            }
        };
    }, [statusCheckInterval]);

    const fetchData = async () => {
        setIsLoading(true);
        setError('');
        try {
            const [overviewRes, pendingRes, historyRes] = await Promise.all([
                transactionAPI.getCommissionOverview(),
                transactionAPI.getPendingCommissions(),
                transactionAPI.getCommissionHistory()
            ]);

            if (overviewRes.data.overview) {
                setOverview({
                    totalCommission: overviewRes.data.overview.totalCommission || 0,
                    pendingAmount: overviewRes.data.overview.totalPending || 0,
                    confirmedAmount: overviewRes.data.overview.totalsByStatus?.confirmed || 0,
                    rejectedAmount: overviewRes.data.overview.totalsByStatus?.rejected || 0
                });
            }
            if (pendingRes.data.transactions) {
                setPendingCommissions(pendingRes.data.transactions);
            }
            if (historyRes.data.transactions) {
                setCommissionHistory(historyRes.data.transactions);
            }
        } catch (err) {
            console.error('Error fetching commission data:', err);
            setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectTransaction = (transactionId) => {
        if (selectedTransactions.includes(transactionId)) {
            setSelectedTransactions(selectedTransactions.filter(id => id !== transactionId));
        } else {
            setSelectedTransactions([...selectedTransactions, transactionId]);
        }
    };

    const handleBulkPayment = async () => {
        try {
            if (selectedTransactions.length === 0) {
                setError('Vui lòng chọn ít nhất một giao dịch để thanh toán');
                return;
            }

            setError('');
            setIsLoading(true);

            const response = await transactionAPI.createBulkQRPayment(selectedTransactions);
            
            if (response.data) {
                setQRData(response.data);
                setShowQRModal(true);
                
                const interval = setInterval(async () => {
                    try {
                        const statusRes = await transactionAPI.checkBulkQRPaymentStatus(response.data.bulkPaymentId);
                        setPaymentStatus(statusRes.data.status);
                        
                        if (statusRes.data.status === 'completed') {
                            clearInterval(interval);
                            await fetchData();
                            toast.success('Thanh toán thành công!');
                            setTimeout(() => {
                                setShowQRModal(false);
                                setSelectedTransactions([]);
                                setQRData(null);
                                setPaymentStatus(null);
                            }, 2000);
                        } else if (statusRes.data.status === 'expired') {
                            clearInterval(interval);
                            setError('Mã QR đã hết hạn. Vui lòng thử lại.');
                        }
                    } catch (err) {
                        console.error('Error checking payment status:', err);
                        clearInterval(interval);
                        setError('Lỗi kiểm tra trạng thái thanh toán');
                    }
                }, 3000);

                setStatusCheckInterval(interval);
            }
        } catch (err) {
            console.error('Error creating bulk QR payment:', err);
            setError(err.response?.data?.message || 'Không thể tạo mã QR thanh toán');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSimulatePayment = async () => {
        try {
            setError('');
            setIsLoading(true);
            
            await transactionAPI.simulateQRPayment(qrData.paymentCode);
            setPaymentStatus('completed');
            
            setTimeout(async () => {
                await fetchData();
                setShowQRModal(false);
                setSelectedTransactions([]);
                setQRData(null);
                setPaymentStatus(null);
            }, 2000);
            
        } catch (err) {
            console.error('Error simulating payment:', err);
            setError('Lỗi khi giả lập thanh toán');
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
            .format(amount)
            .replace('₫', 'đ');
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('vi-VN');
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: <span className="badge bg-warning">Chờ thanh toán</span>,
            paid: <span className="badge bg-info">Chờ xác nhận</span>,
            confirmed: <span className="badge bg-success">Đã xác nhận</span>,
            rejected: <span className="badge bg-danger">Đã từ chối</span>
        };
        return badges[status] || <span className="badge bg-secondary">Không xác định</span>;
    };

    return (
        <div className="min-vh-100 bg-light">
            <ShipperHeader />
            <div className="container py-4">
                <button 
                    className="btn btn-link text-decoration-none mb-4"
                    onClick={() => navigate('/shipper')}
                >
                    <FaArrowLeft className="me-2" />
                    Quay lại
                </button>

                {error && (
                    <div className="alert alert-danger mb-4">
                        {error}
                    </div>
                )}

                {/* Essential Stats Cards */}
                <div className="row g-3 mb-4">
                    <div className="col-md-3">
                        <div className="card bg-primary text-white h-100">
                            <div className="card-body text-center">
                                <h6 className="mb-2">Tổng hoa hồng</h6>
                                <h4 className="mb-0">{formatCurrency(overview.totalCommission)}</h4>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card bg-warning h-100">
                            <div className="card-body text-center">
                                <h6 className="mb-2">Chờ thanh toán</h6>
                                <h4 className="mb-0">{formatCurrency(overview.pendingAmount)}</h4>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card bg-success text-white h-100">
                            <div className="card-body text-center">
                                <h6 className="mb-2">Đã xác nhận</h6>
                                <h4 className="mb-0">{formatCurrency(overview.confirmedAmount)}</h4>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card bg-danger text-white h-100">
                            <div className="card-body text-center">
                                <h6 className="mb-2">Đã từ chối</h6>
                                <h4 className="mb-0">{formatCurrency(overview.rejectedAmount)}</h4>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transaction Tabs */}
                <div className="card">
                    <div className="card-header bg-white">
                        <ul className="nav nav-tabs card-header-tabs">
                            <li className="nav-item">
                                <button
                                    className={`nav-link ${activeTab === 'pending' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('pending')}
                                >
                                    Chờ thanh toán
                                </button>
                            </li>
                            <li className="nav-item">
                                <button
                                    className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('history')}
                                >
                                    Lịch sử thanh toán
                                </button>
                            </li>
                        </ul>
                    </div>
                    <div className="card-body p-0">
                        {activeTab === 'pending' && selectedTransactions.length > 0 && (
                            <div className="p-3 border-bottom">
                                <Button 
                                    variant="primary"
                                    onClick={handleBulkPayment}
                                    disabled={isLoading}
                                >
                                    <FaQrcode className="me-2" />
                                    Thanh toán {selectedTransactions.length} khoản đã chọn
                                </Button>
                            </div>
                        )}
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        {activeTab === 'pending' && (
                                            <th className="text-center" style={{width: '40px'}}>
                                                <input 
                                                    type="checkbox"
                                                    checked={
                                                        pendingCommissions.length > 0 &&
                                                        selectedTransactions.length === pendingCommissions.length
                                                    }
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedTransactions(pendingCommissions.map(t => t._id));
                                                        } else {
                                                            setSelectedTransactions([]);
                                                        }
                                                    }}
                                                />
                                            </th>
                                        )}
                                        <th>Mã giao dịch</th>
                                        <th>Số tiền</th>
                                        <th>Ngày tạo</th>
                                        <th>Trạng thái</th>
                                        {activeTab === 'history' && (
                                            <>
                                                <th>Ngày xác nhận</th>
                                                <th>Ghi chú</th>
                                            </>
                                        )}
                                        {activeTab === 'pending' && <th>Thao tác</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(activeTab === 'pending' ? pendingCommissions : commissionHistory).map(transaction => (
                                        <tr key={transaction._id}>
                                            {activeTab === 'pending' && (
                                                <td className="text-center">
                                                    <input 
                                                        type="checkbox"
                                                        checked={selectedTransactions.includes(transaction._id)}
                                                        onChange={() => handleSelectTransaction(transaction._id)}
                                                    />
                                                </td>
                                            )}
                                            <td className="text-primary small">{transaction._id}</td>
                                            <td>{formatCurrency(transaction.amount)}</td>
                                            <td>{formatDate(transaction.createdAt)}</td>
                                            <td>{getStatusBadge(transaction.status)}</td>
                                            {activeTab === 'history' ? (
                                                <>
                                                    <td>{transaction.confirmed_at ? formatDate(transaction.confirmed_at) : '-'}</td>
                                                    <td className="text-muted small">{transaction.remarks || '-'}</td>
                                                </>
                                            ) : (
                                                <td>
                                                    <Button 
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => handleBulkPayment([transaction._id])}
                                                        disabled={isLoading}
                                                    >
                                                        Thanh toán
                                                    </Button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {(activeTab === 'pending' ? pendingCommissions : commissionHistory).length === 0 && (
                                        <tr>
                                            <td colSpan={activeTab === 'history' ? 6 : 5} className="text-center py-3">
                                                Không có giao dịch nào
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* QR Payment Modal */}
                <Modal show={showQRModal} onHide={() => setShowQRModal(false)} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Quét mã QR để thanh toán</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="text-center">
                        {qrData && (
                            <>
                                <img src={qrData.qrCode} alt="QR Code" className="img-fluid mb-3" />
                                <p className="mb-2">Số tiền: {formatCurrency(qrData.amount)}</p>
                                <p className="text-muted small">
                                    Mã QR sẽ hết hạn sau: {new Date(qrData.expiryTime).toLocaleTimeString('vi-VN')}
                                </p>
                                {paymentStatus === 'completed' && (
                                    <div className="alert alert-success">
                                        Thanh toán thành công!
                                    </div>
                                )}
                            </>
                        )}
                        {isLoading && (
                            <div className="text-center">
                                <FaSpinner className="fa-spin" />
                                <p>Đang xử lý...</p>
                            </div>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button 
                            variant="secondary" 
                            onClick={() => setShowQRModal(false)}
                        >
                            Đóng
                        </Button>
                        <Button 
                            variant="success"
                            onClick={handleSimulatePayment}
                            disabled={isLoading || paymentStatus === 'completed'}
                        >
                            Giả lập thanh toán
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </div>
    );
};

export default CommissionManagement; 