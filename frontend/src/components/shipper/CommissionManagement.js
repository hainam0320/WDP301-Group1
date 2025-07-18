import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Modal, Alert, Badge, Card, Row, Col, Nav } from 'react-bootstrap';
import { FaQrcode, FaCheck, FaTimes, FaFileInvoiceDollar, FaEye, FaArrowLeft, FaMoneyBillWave, FaClock, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';
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
    const [stats, setStats] = useState({
        totalAmount: 0,
        pendingAmount: 0,
        paidAmount: 0
    });
    const [pendingPage, setPendingPage] = useState(1);
    const [historyPage, setHistoryPage] = useState(1);
    const itemsPerPage = 5;

    // Add pagination state
    const [paginatedPending, setPaginatedPending] = useState([]);
    const [paginatedHistory, setPaginatedHistory] = useState([]);
    const [totalPendingPages, setTotalPendingPages] = useState(0);
    const [totalHistoryPages, setTotalHistoryPages] = useState(0);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    // Add pagination effect
    useEffect(() => {
        // Calculate paginated data for pending commissions
        const startPending = (pendingPage - 1) * itemsPerPage;
        const endPending = startPending + itemsPerPage;
        setPaginatedPending(pendingCommissions.slice(startPending, endPending));
        setTotalPendingPages(Math.ceil(pendingCommissions.length / itemsPerPage));
    }, [pendingCommissions, pendingPage, itemsPerPage]);

    // Add pagination effect for history
    useEffect(() => {
        // Calculate paginated data for history
        const startHistory = (historyPage - 1) * itemsPerPage;
        const endHistory = startHistory + itemsPerPage;
        setPaginatedHistory(bulkBills.slice(startHistory, endHistory));
        setTotalHistoryPages(Math.ceil(bulkBills.length / itemsPerPage));
    }, [bulkBills, historyPage, itemsPerPage]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError('');
            
            // Luôn lấy cả pending transactions và bulk bills để tính toán stats chính xác
            const [pendingResponse, bulkResponse] = await Promise.all([
                transactionAPI.getPendingCommissions(),
                transactionAPI.getDriverBulkBills()
            ]);

            const pendingTransactions = pendingResponse.data.transactions || [];
            const bills = bulkResponse.data.data || [];

            // Cập nhật state tùy theo tab
            if (activeTab === 'pending') {
                setPendingCommissions(pendingTransactions);
                setBulkBills(bills);
            } else {
                setBulkBills(bills);
            }

            // Tính toán stats
            // 1. Tính tổng tiền chờ thanh toán từ các giao dịch pending
            const pendingAmount = pendingTransactions
                .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);

            // 2. Tính tổng tiền đã thanh toán từ các bill đã confirmed hoặc completed
            const paidAmount = bills
                .filter(bill => bill.status === 'completed' || bill.status === 'confirmed')
                .reduce((sum, bill) => sum + (bill.total_amount || 0), 0);

            // 3. Tổng hoa hồng = Chờ thanh toán + Đã thanh toán
            const totalAmount = pendingAmount + paidAmount;

            setStats({
                totalAmount,
                pendingAmount,
                paidAmount
            });

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
            
            const response = await transactionAPI.createBulkBill(transactionIds);
            
            if (response.data && response.data.data) {
                const { qrPayment } = response.data.data;
                console.log('QR Payment data:', qrPayment);

                // Ensure we have a valid payment code
                if (!qrPayment.paymentCode) {
                    setError('Không nhận được mã thanh toán hợp lệ');
                    return;
                }

                setQRData({
                    qrCode: qrPayment.qrCode,
                    amount: qrPayment.amount,
                    paymentCode: qrPayment.paymentCode.trim() // Ensure no whitespace
                });
                
                setShowQRModal(true);
                setSelectedTransactions([]);
                // Refresh data after creating bulk bill
                fetchData();
            }
        } catch (err) {
            console.error('Error creating bulk payment:', err);
            setError('Không thể tạo thanh toán: ' + (err.response?.data?.message || err.message));
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

    const handleCloseQRModal = async () => {
        try {
            if (qrData) {
                // Tìm bulk bill tương ứng với QR payment
                const response = await transactionAPI.getDriverBulkBills();
                const bills = response.data.data || [];
                const pendingBill = bills.find(bill => 
                    bill.status === 'pending' && 
                    bill.qr_payment_id?.paymentCode === qrData.paymentCode
                );

                if (pendingBill) {
                    await transactionAPI.cancelBulkBill(pendingBill._id);
                }
            }
        } catch (error) {
            console.error('Error canceling bulk bill:', error);
            toast.error('Có lỗi xảy ra khi hủy hóa đơn');
        } finally {
            setShowQRModal(false);
            setQRData(null);
            fetchData();
        }
    };

    const handleSimulatePayment = async () => {
        try {
            if (!qrData || !qrData.paymentCode) {
                setError('Không tìm thấy mã thanh toán');
                return;
            }

            setError('');
            setIsLoading(true);
            
            console.log('Payment data:', qrData);
            console.log('Simulating payment with code:', qrData.paymentCode);
            
            const response = await transactionAPI.updateBulkQRPaymentStatus(
                qrData.paymentCode.trim(), // Ensure no whitespace
                'completed'
            );
            
            if (response.data && response.data.success) {
                toast.success('Thanh toán thành công!');
                await fetchData();
                setShowQRModal(false);
                setQRData(null);
            } else {
                setError('Lỗi khi xử lý thanh toán: ' + (response.data?.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('Error processing payment:', err);
            setError('Lỗi khi xử lý thanh toán: ' + (err.response?.data?.message || err.message));
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
                return <Badge bg="success" className="px-3 py-2"><FaCheckCircle className="me-1" /> Đã hoàn thành</Badge>;
            case 'confirmed':
                return <Badge bg="primary" className="px-3 py-2"><FaCheckCircle className="me-1" /> Đã xác nhận</Badge>;
            case 'rejected':
                return <Badge bg="danger" className="px-3 py-2"><FaTimesCircle className="me-1" /> Đã từ chối</Badge>;
            case 'paid':
                return <Badge bg="info" className="px-3 py-2"><FaHourglassHalf className="me-1" /> Đã thanh toán - Chờ xác nhận</Badge>;
            case 'pending':
                return <Badge bg="warning" className="px-3 py-2"><FaClock className="me-1" /> Chờ thanh toán</Badge>;
            default:
                return <Badge bg="secondary" className="px-3 py-2">{status}</Badge>;
        }
    };

    const handleViewDetails = async (billId) => {
        try {
            setIsLoading(true);
            setError('');
            const response = await transactionAPI.getDriverBulkBills();
            const bill = response.data.data.find(b => b._id === billId);
            if (bill) {
                setSelectedBill(bill);
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

    // Helper: check if commission is overdue (>= 3 days)
    const isOverdue = (createdAt) => {
        if (!createdAt) return false;
        const now = new Date();
        const created = new Date(createdAt);
        const diffDays = (now - created) / (1000 * 60 * 60 * 24);
        return diffDays >= 3;
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
                                {paginatedPending.map(transaction => (
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
                                {paginatedPending.length === 0 && (
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
                            {paginatedHistory.map(bill => (
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
                            {paginatedHistory.length === 0 && (
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
        <div className="p-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">Quản lý hoa hồng</h4>
                <Button 
                    variant="outline-secondary" 
                    onClick={() => navigate(-1)}
                    className="d-flex align-items-center gap-2"
                >
                    <FaArrowLeft /> Quay lại
                </Button>
            </div>

            {/* Stats Cards */}
            <Row className="mb-4 g-3">
                <Col sm={6} md={4}>
                    <Card className="h-100 border-0 shadow-sm hover-shadow">
                        <Card.Body className="d-flex align-items-center p-4">
                            <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                                <FaMoneyBillWave className="text-primary fs-3" />
                            </div>
                            <div>
                                <h6 className="text-muted mb-1">Tổng hoa hồng</h6>
                                <h4 className="mb-0 fw-bold text-primary">{formatCurrency(stats.totalAmount)}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col sm={6} md={4}>
                    <Card className="h-100 border-0 shadow-sm hover-shadow">
                        <Card.Body className="d-flex align-items-center p-4">
                            <div className="rounded-circle bg-warning bg-opacity-10 p-3 me-3">
                                <FaClock className="text-warning fs-3" />
                            </div>
                            <div>
                                <h6 className="text-muted mb-1">Chờ thanh toán</h6>
                                <h4 className="mb-0 fw-bold text-warning">{formatCurrency(stats.pendingAmount)}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col sm={6} md={4}>
                    <Card className="h-100 border-0 shadow-sm hover-shadow">
                        <Card.Body className="d-flex align-items-center p-4">
                            <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                                <FaCheckCircle className="text-success fs-3" />
                            </div>
                            <div>
                                <h6 className="text-muted mb-1">Đã thanh toán</h6>
                                <h4 className="mb-0 fw-bold text-success">{formatCurrency(stats.paidAmount)}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Navigation Tabs */}
            <Card className="border-0 shadow-sm mb-4">
                <Card.Body className="p-0">
                    <Nav variant="tabs" className="nav-tabs-custom" activeKey={activeTab} onSelect={setActiveTab}>
                        <Nav.Item>
                            <Nav.Link 
                                eventKey="pending" 
                                className="px-4 py-3 text-center"
                            >
                                <FaClock className="me-2" />
                                Chờ thanh toán
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link 
                                eventKey="history" 
                                className="px-4 py-3 text-center"
                            >
                                <FaFileInvoiceDollar className="me-2" />
                                Lịch sử thanh toán
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>
                </Card.Body>
            </Card>

            {/* Error Alert */}
            {error && (
                <Alert variant="danger" className="mb-4">
                    {error}
                </Alert>
            )}

            {/* Content Card */}
            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    {activeTab === 'pending' ? (
                        <>
                            {selectedTransactions.length > 0 && (
                                <div className="p-4 border-bottom">
                                    <Button 
                                        variant="primary"
                                        onClick={() => handleBulkPayment()}
                                        disabled={isLoading}
                                        className="d-flex align-items-center gap-2 px-4 py-2"
                                    >
                                        <FaQrcode />
                                        Thanh toán {selectedTransactions.length} khoản đã chọn
                                    </Button>
                                </div>
                            )}
                            <div className="table-responsive">
                                <Table hover className="align-middle mb-0">
                                    <thead>
                                        <tr className="bg-light">
                                            <th className="py-3">
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
                                            <th className="py-3">Mã giao dịch</th>
                                            <th className="py-3">Số tiền</th>
                                            <th className="py-3">Trạng thái</th>
                                            <th className="py-3">Ngày tạo</th>
                                            <th className="py-3">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedPending.map(transaction => {
                                            const overdue = isOverdue(transaction.createdAt);
                                            return (
                                                <tr key={transaction._id} className={`border-bottom${overdue ? ' bg-danger bg-opacity-25' : ''}`}> 
                                                <td>
                                                    <Form.Check
                                                        type="checkbox"
                                                        onChange={() => handleSelectTransaction(transaction._id)}
                                                        checked={selectedTransactions.includes(transaction._id)}
                                                    />
                                                </td>
                                                    <td className="text-primary fw-medium">
                                                        {transaction._id}
                                                        {overdue && <FaExclamationTriangle className="ms-2 text-danger" title="Quá hạn 3 ngày" />}
                                                    </td>
                                                <td className="fw-bold">{formatCurrency(transaction.amount)}</td>
                                                <td>{getStatusBadge(transaction.status)}</td>
                                                <td>
                                                    <div className="fw-medium">{new Date(transaction.createdAt).toLocaleDateString('vi-VN')}</div>
                                                    <small className="text-muted">{new Date(transaction.createdAt).toLocaleTimeString('vi-VN')}</small>
                                                </td>
                                                <td>
                                                    <Button 
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => handleBulkPayment([transaction._id])}
                                                        disabled={isLoading}
                                                        className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
                                                    >
                                                        <FaQrcode />
                                                        Thanh toán
                                                    </Button>
                                                </td>
                                            </tr>
                                            );
                                        })}
                                        {paginatedPending.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="text-center py-5">
                                                    <div className="text-muted">
                                                        <FaMoneyBillWave className="fs-1 mb-3" />
                                                        <div>Không có giao dịch nào chờ thanh toán</div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </>
                    ) : (
                        <div className="table-responsive">
                            <Table hover className="align-middle mb-0">
                                <thead>
                                    <tr className="bg-light">
                                        <th className="py-3">Mã Bill</th>
                                        <th className="py-3">Số giao dịch</th>
                                        <th className="py-3">Tổng tiền</th>
                                        <th className="py-3">Trạng thái</th>
                                        <th className="py-3">Ngày tạo</th>
                                        <th className="py-3">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedHistory.map(bill => (
                                        <tr key={bill._id} className="border-bottom">
                                            <td className="text-primary fw-medium">{bill._id}</td>
                                            <td className="fw-medium">{bill.transactions?.length || 0}</td>
                                            <td className="fw-bold">{formatCurrency(bill.total_amount)}</td>
                                            <td>{getStatusBadge(bill.status)}</td>
                                            <td>
                                                <div className="fw-medium">{new Date(bill.createdAt).toLocaleDateString('vi-VN')}</div>
                                                <small className="text-muted">{new Date(bill.createdAt).toLocaleTimeString('vi-VN')}</small>
                                            </td>
                                            <td>
                                                <Button
                                                    variant="outline-info"
                                                    size="sm"
                                                    onClick={() => handleViewDetails(bill._id)}
                                                    className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
                                                >
                                                    <FaEye />
                                                    Chi tiết
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {paginatedHistory.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center py-5">
                                                <div className="text-muted">
                                                    <FaMoneyBillWave className="fs-1 mb-3" />
                                                    <div>Không có lịch sử thanh toán</div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Pagination controls - show based on active tab */}
            {activeTab === 'pending' && totalPendingPages > 1 && (
              <nav className="d-flex justify-content-center my-3">
                <ul className="pagination">
                  <li className={`page-item${pendingPage === 1 ? ' disabled' : ''}`}>
                    <button className="page-link" onClick={() => setPendingPage(pendingPage - 1)}>&laquo;</button>
                  </li>
                  {Array.from({ length: totalPendingPages }, (_, i) => (
                    <li key={i} className={`page-item${pendingPage === i + 1 ? ' active' : ''}`}>
                      <button className="page-link" onClick={() => setPendingPage(i + 1)}>{i + 1}</button>
                    </li>
                  ))}
                  <li className={`page-item${pendingPage === totalPendingPages ? ' disabled' : ''}`}>
                    <button className="page-link" onClick={() => setPendingPage(pendingPage + 1)}>&raquo;</button>
                  </li>
                </ul>
              </nav>
            )}

            {activeTab === 'history' && totalHistoryPages > 1 && (
              <nav className="d-flex justify-content-center my-3">
                <ul className="pagination">
                  <li className={`page-item${historyPage === 1 ? ' disabled' : ''}`}>
                    <button className="page-link" onClick={() => setHistoryPage(historyPage - 1)}>&laquo;</button>
                  </li>
                  {Array.from({ length: totalHistoryPages }, (_, i) => (
                    <li key={i} className={`page-item${historyPage === i + 1 ? ' active' : ''}`}>
                      <button className="page-link" onClick={() => setHistoryPage(i + 1)}>{i + 1}</button>
                    </li>
                  ))}
                  <li className={`page-item${historyPage === totalHistoryPages ? ' disabled' : ''}`}>
                    <button className="page-link" onClick={() => setHistoryPage(historyPage + 1)}>&raquo;</button>
                  </li>
                </ul>
              </nav>
            )}

            {/* QR Modal */}
            <Modal 
                show={showQRModal} 
                onHide={handleCloseQRModal}
                centered
            >
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fs-5">
                        <FaQrcode className="me-2" />
                        Quét mã QR để thanh toán
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4">
                    {qrData && (
                        <div className="text-center">
                            <div className="alert alert-light border-0 rounded-3 mb-4">
                                <div className="d-flex align-items-center mb-3">
                                    <div className="me-3">
                                        <FaMoneyBillWave className="fs-3 text-primary" />
                                    </div>
                                    <div className="text-start">
                                        <h6 className="mb-1">Thông tin thanh toán</h6>
                                        <div className="text-muted small">Mã thanh toán: {qrData.paymentCode}</div>
                                    </div>
                                </div>
                                <div className="d-flex justify-content-between align-items-center">
                                    <div className="text-muted">Số tiền cần thanh toán:</div>
                                    <div className="fs-5 fw-bold text-primary">{formatCurrency(qrData.amount)}</div>
                                </div>
                            </div>

                            <div className="mb-4 p-3 border rounded-3">
                                <img 
                                    src={qrData.qrCode} 
                                    alt="QR Code" 
                                    style={{ maxWidth: '100%', height: 'auto' }}
                                />
                            </div>

                            {/* For development/testing only */}
                            <Button
                                variant="success"
                                onClick={handleSimulatePayment}
                                disabled={isLoading}
                                className="w-100 mb-3 d-flex align-items-center justify-content-center gap-2"
                            >
                                <FaCheck />
                                Giả lập thanh toán thành công
                            </Button>
                        </div>
                    )}
                    {error && (
                        <Alert variant="danger" className="mb-0">
                            {error}
                        </Alert>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button 
                        variant="light" 
                        onClick={handleCloseQRModal}
                        className="rounded-pill px-4"
                    >
                        Đóng
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Details Modal */}
            <Modal 
                show={showDetailsModal} 
                onHide={() => setShowDetailsModal(false)}
                size="lg"
                centered
            >
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fs-5">
                        <FaEye className="me-2" />
                        Chi tiết Bill
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4">
                    {isLoading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <div className="mt-3 text-muted">Đang tải dữ liệu...</div>
                        </div>
                    ) : selectedBill ? (
                        <>
                            <div className="alert alert-light border-0 rounded-3 mb-4">
                                <div className="d-flex align-items-center mb-3">
                                    <div className="me-3">
                                        <FaMoneyBillWave className="fs-3 text-primary" />
                                    </div>
                                    <div>
                                        <h6 className="mb-1">Thông tin chung</h6>
                                        <div className="text-muted small">Mã bill: {selectedBill._id}</div>
                                    </div>
                                </div>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <div className="text-muted small mb-1">Tổng tiền</div>
                                        <div className="fw-bold text-primary">{formatCurrency(selectedBill.total_amount)}</div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="text-muted small mb-1">Trạng thái</div>
                                        <div>{getStatusBadge(selectedBill.status)}</div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="text-muted small mb-1">Ngày tạo</div>
                                        <div className="fw-medium">{formatDate(selectedBill.createdAt)}</div>
                                    </Col>
                                    {selectedBill.paid_at && (
                                        <Col md={6}>
                                            <div className="text-muted small mb-1">Ngày thanh toán</div>
                                            <div className="fw-medium">{formatDate(selectedBill.paid_at)}</div>
                                        </Col>
                                    )}
                                </Row>
                                {selectedBill.remarks && (
                                    <div className="mt-3 pt-3 border-top">
                                        <div className="text-muted small mb-1">Ghi chú từ Admin</div>
                                        <div className="alert alert-light border-0 rounded-3 mb-0">
                                            <div className="d-flex">
                                                <div className="me-3">
                                                    <FaInfoCircle className="text-primary fs-5" />
                                                </div>
                                                <div>{selectedBill.remarks}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mb-3">
                                <h6 className="mb-4">Danh sách giao dịch</h6>
                                <div className="table-responsive">
                                    <Table hover className="align-middle">
                                        <thead>
                                            <tr className="bg-light">
                                                <th className="py-3">Mã giao dịch</th>
                                                <th className="text-end py-3">Số tiền</th>
                                                <th className="text-center py-3">Trạng thái</th>
                                                <th className="py-3">Ngày tạo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedBill.transactions?.map(transaction => (
                                                <tr key={transaction._id} className="border-bottom">
                                                    <td className="text-primary fw-medium">{transaction._id}</td>
                                                    <td className="text-end fw-bold">{formatCurrency(transaction.amount)}</td>
                                                    <td className="text-center">{getStatusBadge(transaction.status)}</td>
                                                    <td className="text-nowrap">
                                                        <div className="fw-medium">{new Date(transaction.createdAt).toLocaleDateString('vi-VN')}</div>
                                                        <small className="text-muted">{new Date(transaction.createdAt).toLocaleTimeString('vi-VN')}</small>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!selectedBill.transactions || selectedBill.transactions.length === 0) && (
                                                <tr>
                                                    <td colSpan={4} className="text-center py-5">
                                                        <div className="text-muted">
                                                            <FaMoneyBillWave className="fs-1 mb-3" />
                                                            <div>Không có giao dịch nào</div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            </div>
                        </>
                    ) : null}
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button 
                        variant="light" 
                        onClick={() => setShowDetailsModal(false)}
                        className="rounded-pill px-4"
                    >
                        Đóng
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default CommissionManagement; 