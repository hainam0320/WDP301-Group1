import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Modal, Alert, Badge } from 'react-bootstrap';
import { FaQrcode, FaCheck, FaTimes, FaFileInvoiceDollar, FaEye, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { transactionAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const CommissionManagement = () => {
    const navigate = useNavigate();
    const [pendingCommissions, setPendingCommissions] = useState([]);
    const [bulkBills, setBulkBills] = useState([]);
    const [selectedTransactions, setSelectedTransactions] = useState([]);
    const [showQRModal, setShowQRModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [qrData, setQRData] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('pending');

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError('');
            
            if (activeTab === 'pending') {
                const [pendingResponse, bulkResponse] = await Promise.all([
                    transactionAPI.getPendingCommissions(),
                    transactionAPI.getDriverBulkBills()
                ]);
                setPendingCommissions(pendingResponse.data.transactions || []);
                setBulkBills(bulkResponse.data.bills || []);
            } else {
                const response = await transactionAPI.getDriverBulkBills();
                setBulkBills(response.data.bills || []);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBulkPayment = async (transactionIds = selectedTransactions) => {
        try {
            if (!transactionIds || transactionIds.length === 0) {
                toast.error('Vui lòng chọn ít nhất một giao dịch để thanh toán');
                return;
            }

            setIsLoading(true);
            setError('');
            
            const response = await transactionAPI.createBulkQRPayment(transactionIds);
            
            if (response.data) {
                setQRData(response.data);
                setShowQRModal(true);
                setSelectedTransactions([]);
            }
        } catch (err) {
            console.error('Error creating bulk payment:', err);
            toast.error('Không thể tạo thanh toán. Vui lòng thử lại sau.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectTransaction = (transactionId) => {
        setSelectedTransactions(prev => {
            if (prev.includes(transactionId)) {
                return prev.filter(id => id !== transactionId);
            } else {
                return [...prev, transactionId];
            }
        });
    };

    const handleCloseQRModal = () => {
        setShowQRModal(false);
        setQRData(null);
        fetchData();
    };

    const handleSimulatePayment = async () => {
        try {
            setError('');
            setIsLoading(true);
            
            await transactionAPI.simulateQRPayment(qrData.paymentCode);
            toast.success('Giả lập thanh toán thành công!');
            await fetchData();
            setShowQRModal(false);
            setQRData(null);
        } catch (err) {
            console.error('Error simulating payment:', err);
            setError('Lỗi khi giả lập thanh toán');
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount).replace('₫', 'd');
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('vi-VN');
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
            case 'paid':
                return <Badge bg="success">Đã thanh toán</Badge>;
            case 'pending':
                return <Badge bg="warning">Chờ thanh toán</Badge>;
            default:
                return <Badge bg="secondary">{status}</Badge>;
        }
    };

    const handleViewDetails = async (billId) => {
        try {
            setIsLoading(true);
            setError('');
            const response = await transactionAPI.getDriverBulkBillDetails(billId);
            if (response.data.success) {
                setSelectedBill(response.data.bill);
                setShowDetailsModal(true);
            } else {
                toast.error('Không thể tải chi tiết bill');
            }
        } catch (err) {
            console.error('Error fetching bill details:', err);
            toast.error('Không thể tải chi tiết bill');
        } finally {
            setIsLoading(false);
        }
    };

    const renderContent = () => {
        if (activeTab === 'pending') {
            return (
                <>
                    {selectedTransactions.length > 0 && (
                        <div className="p-3 border-bottom">
                            <Button 
                                variant="primary"
                                onClick={() => handleBulkPayment()}
                                disabled={isLoading}
                            >
                                <FaQrcode className="me-2" />
                                Thanh toán {selectedTransactions.length} khoản đã chọn
                            </Button>
                        </div>
                    )}
                    <div className="table-responsive">
                        <Table className="mb-0">
                            <thead>
                                <tr>
                                    <th>
                                        <Form.Check
                                            type="checkbox"
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedTransactions(pendingCommissions.map(t => t._id));
                                                } else {
                                                    setSelectedTransactions([]);
                                                }
                                            }}
                                            checked={
                                                pendingCommissions.length > 0 &&
                                                selectedTransactions.length === pendingCommissions.length
                                            }
                                        />
                                    </th>
                                    <th>Mã giao dịch</th>
                                    <th>Số tiền</th>
                                    <th>Trạng thái</th>
                                    <th>Ngày tạo</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingCommissions.map(transaction => (
                                    <tr key={transaction._id}>
                                        <td>
                                            <Form.Check
                                                type="checkbox"
                                                onChange={() => handleSelectTransaction(transaction._id)}
                                                checked={selectedTransactions.includes(transaction._id)}
                                            />
                                        </td>
                                        <td>{transaction._id}</td>
                                        <td>{formatCurrency(transaction.amount)}</td>
                                        <td>{getStatusBadge(transaction.status)}</td>
                                        <td>{formatDate(transaction.createdAt)}</td>
                                        <td>
                                            <Button 
                                                variant="primary"
                                                size="sm"
                                                onClick={() => handleBulkPayment([transaction._id])}
                                                disabled={isLoading}
                                            >
                                                <FaQrcode className="me-1" />
                                                Thanh toán
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {pendingCommissions.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-3">
                                            Không có giao dịch nào chờ thanh toán
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </>
            );
        } else {
            return (
                <div className="table-responsive">
                    <Table className="mb-0">
                        <thead>
                            <tr>
                                <th>Mã Bill</th>
                                <th>Số giao dịch</th>
                                <th>Tổng tiền</th>
                                <th>Trạng thái</th>
                                <th>Ngày tạo</th>
                                <th>Ngày xác nhận</th>
                                <th>Ghi chú</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bulkBills.filter(bill => bill.status !== 'pending').map(bill => (
                                <tr key={bill._id}>
                                    <td>{bill._id}</td>
                                    <td>{bill.transactions.length}</td>
                                    <td>{formatCurrency(bill.total_amount)}</td>
                                    <td>{getStatusBadge(bill.status)}</td>
                                    <td>{formatDate(bill.createdAt)}</td>
                                    <td>{bill.confirmed_at ? formatDate(bill.confirmed_at) : '-'}</td>
                                    <td className="text-muted small">{bill.remarks || '-'}</td>
                                    <td>
                                        <Button
                                            variant="info"
                                            size="sm"
                                            onClick={() => handleViewDetails(bill._id)}
                                        >
                                            <FaEye />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {bulkBills.filter(bill => bill.status !== 'pending').length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center py-3">
                                        Không có lịch sử thanh toán
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
            );
        }
    };

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center">
                    <Button 
                        variant="outline-secondary" 
                        className="me-3"
                        onClick={() => navigate('/shipper')}
                    >
                        <FaArrowLeft className="me-2" />
                        Quay lại
                    </Button>
                    <h2 className="mb-0">Quản lý hoa hồng</h2>
                </div>
            </div>
            
            {error && <Alert variant="danger">{error}</Alert>}

            <div className="mb-3">
                <Button 
                    variant={activeTab === 'pending' ? 'primary' : 'outline-primary'} 
                    onClick={() => setActiveTab('pending')}
                    className="me-2"
                >
                    Chờ thanh toán
                </Button>
                <Button 
                    variant={activeTab === 'history' ? 'primary' : 'outline-primary'} 
                    onClick={() => setActiveTab('history')}
                >
                    Lịch sử thanh toán
                </Button>
            </div>

            <div className="card">
                <div className="card-body p-0">
                    {renderContent()}
                </div>
            </div>

            {/* QR Payment Modal */}
            <Modal show={showQRModal} onHide={handleCloseQRModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Quét mã QR để thanh toán</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center">
                    {qrData && (
                        <>
                            <img 
                                src={qrData.qrCode} 
                                alt="QR Code" 
                                style={{ maxWidth: '100%', height: 'auto' }}
                            />
                            <p className="mt-3">
                                <strong>Số tiền:</strong> {formatCurrency(qrData.amount)}
                            </p>
                            <p className="text-muted small">
                                Mã QR sẽ hết hạn sau 5 phút
                            </p>
                            <Button
                                variant="success"
                                onClick={handleSimulatePayment}
                                disabled={isLoading}
                                className="mt-3"
                            >
                                <FaCheck className="me-2" />
                                Giả lập thanh toán thành công
                            </Button>
                        </>
                    )}
                    {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
                </Modal.Body>
            </Modal>

            {/* Modal chi tiết */}
            <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết Bill</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {isLoading ? (
                        <div className="text-center py-3">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : selectedBill ? (
                        <>
                            <div className="mb-3">
                                <h5>Thông tin chung</h5>
                                <p>
                                    <strong>Mã Bill:</strong> {selectedBill._id}<br />
                                    <strong>Tổng tiền:</strong> {formatCurrency(selectedBill.total_amount)}<br />
                                    <strong>Trạng thái:</strong> {getStatusBadge(selectedBill.status)}<br />
                                    <strong>Ngày tạo:</strong> {formatDate(selectedBill.createdAt)}<br />
                                    {selectedBill.paid_at && <><strong>Ngày thanh toán:</strong> {formatDate(selectedBill.paid_at)}<br /></>}
                                    {selectedBill.confirmed_at && <><strong>Ngày xác nhận:</strong> {formatDate(selectedBill.confirmed_at)}<br /></>}
                                    {selectedBill.remarks && <><strong>Ghi chú:</strong> {selectedBill.remarks}<br /></>}
                                </p>
                            </div>

                            <div className="mb-3">
                                <h5>Danh sách giao dịch</h5>
                                <Table responsive>
                                    <thead>
                                        <tr>
                                            <th>Mã giao dịch</th>
                                            
                                            <th>Số tiền</th>
                                            <th>Trạng thái</th>
                                            <th>Ngày tạo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedBill.transactions?.map(transaction => (
                                            <tr key={transaction._id}>
                                                <td>{transaction._id}</td>
                                                <td>{formatCurrency(transaction.amount)}</td>
                                                <td>{getStatusBadge(transaction.status)}</td>
                                                <td>{formatDate(transaction.createdAt)}</td>
                                            </tr>
                                        ))}
                                        {(!selectedBill.transactions || selectedBill.transactions.length === 0) && (
                                            <tr>
                                                <td colSpan={5} className="text-center py-3">
                                                    Không có giao dịch nào
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </>
                    ) : error ? (
                        <Alert variant="danger">{error}</Alert>
                    ) : null}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
                        Đóng
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default CommissionManagement; 