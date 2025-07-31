import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Row, Col, Badge, Card, Nav, Alert } from 'react-bootstrap'; // Bỏ Modal vì không dùng ở đây nữa
import { FaMoneyBillWave, FaClock, FaCheckCircle, FaTimesCircle, FaCoins, FaArrowLeft, FaFileInvoiceDollar, FaHourglassHalf } from 'react-icons/fa'; // Bỏ các icon không dùng
import { toast } from 'react-toastify';
import { transactionAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const CommissionManagement = () => {
    const navigate = useNavigate();
    // Các state liên quan đến luồng cũ đã bị loại bỏ hoàn toàn khỏi frontend
    // const [pendingCommissions, setPendingCommissions] = useState([]); 
    // const [bulkBills, setBulkBills] = useState([]); 
    // const [selectedTransactions, setSelectedTransactions] = useState([]); 
    // const [showQRModal, setShowQRModal] = useState(false);
    // const [showDetailsModal, setShowDetailsModal] = useState(false);
    // const [selectedBill, setSelectedBill] = useState(null);
    // const [qrData, setQRData] = useState(null);
    
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('payoutRequestTab'); 

    // Stats cho old flow (driver owes company) - sẽ hiển thị 0 hoặc bị loại bỏ UI
    const [stats, setStats] = useState({
        totalAmount: 0,
        pendingAmount: 0,
        paidAmount: 0
    });

    // New states for new flow (company owes driver)
    const [driverBalance, setDriverBalance] = useState(0);
    const [payoutHistory, setPayoutHistory] = useState([]);
    const [payoutRequests, setPayoutRequests] = useState([]);

    // Form states for new payout request
    const [requestAmount, setRequestAmount] = useState('');
    const [requestError, setRequestError] = useState('');

    // Pagination states
    const [adminPayoutHistoryPage, setAdminPayoutHistoryPage] = useState(1);
    const [payoutRequestPage, setPayoutRequestPage] = useState(1);

    const itemsPerPage = 5;

    const [paginatedAdminPayoutHistory, setPaginatedAdminPayoutHistory] = useState([]);
    const [paginatedPayoutRequests, setPaginatedPayoutRequests] = useState([]);

    const [totalAdminPayoutHistoryPages, setTotalAdminPayoutHistoryPages] = useState(0);
    const [totalPayoutRequestPages, setTotalPayoutRequestPages] = useState(0);


    useEffect(() => {
        fetchData();
    }, [activeTab]);

    // Pagination effects for remaining tabs
    useEffect(() => {
        const startHistory = (adminPayoutHistoryPage - 1) * itemsPerPage;
        const endHistory = startHistory + itemsPerPage;
        setPaginatedAdminPayoutHistory(payoutHistory.slice(startHistory, endHistory));
        setTotalAdminPayoutHistoryPages(Math.ceil(payoutHistory.length / itemsPerPage));
    }, [payoutHistory, adminPayoutHistoryPage, itemsPerPage]);

    useEffect(() => {
        const startRequests = (payoutRequestPage - 1) * itemsPerPage;
        const endRequests = startRequests + itemsPerPage;
        setPaginatedPayoutRequests(payoutRequests.slice(startRequests, endRequests));
        setTotalPayoutRequestPages(Math.ceil(payoutRequests.length / itemsPerPage));
    }, [payoutRequests, payoutRequestPage, itemsPerPage]);


    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError('');

            // THAY THẾ LỆNH GỌI API CŨ BẰNG LỆNH GỌI MỚI VÀ TÍNH TOÁN STATS MỚI
            const [balanceResponse, payoutsResponse, payoutRequestsResponse] = await Promise.all([
                transactionAPI.getDriverPayoutsBalance(),
                transactionAPI.getDriverPayoutsHistory(),
                transactionAPI.getDriverPayoutRequests()
            ]);

            setDriverBalance(balanceResponse.data.balance || 0);
            setPayoutHistory(payoutsResponse.data.payouts || []);
            setPayoutRequests(payoutRequestsResponse.data.requests || []);

            // Cập nhật stats cũ về 0 hoặc tính toán lại nếu có nguồn dữ liệu mới
            setStats({ // Có thể hiển thị 0 nếu không có dữ liệu cũ nữa
                totalAmount: 0, 
                pendingAmount: 0, 
                paidAmount: 0 
            });


        } catch (err) {
            console.error('Error fetching data:', err);
            toast.error('Không thể tải dữ liệu. Vui lòng thử lại sau.');
            setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        } finally {
            setIsLoading(false);
        }
    };

    // CÁC HÀM LIÊN QUAN ĐẾN LUỒNG CŨ ĐÃ BỊ XÓA HOÀN TOÀN TỪ ĐÂY
    // handleBulkPayment, handleSelectTransaction, handleCloseQRModal, handleSimulatePayment, handleViewDetails, isOverdue

    const handlePayoutRequestSubmit = async () => {
        if (!requestAmount || isNaN(requestAmount) || parseFloat(requestAmount) <= 0) {
            setRequestError('Vui lòng nhập số tiền hợp lệ lớn hơn 0.');
            return;
        }
        if (parseFloat(requestAmount) > driverBalance) {
            setRequestError('Số tiền yêu cầu lớn hơn số dư hiện có.');
            return;
        }

        setIsLoading(true);
        setRequestError('');
        try {
            const response = await transactionAPI.requestPayout({ amount: parseFloat(requestAmount) });
            if (response.data.success) {
                toast.success(response.data.message);
                setRequestAmount('');
                fetchData(); // Re-fetch data to update balance and requests list
            } else {
                toast.error(response.data.message || 'Lỗi gửi yêu cầu.');
            }
        } catch (err) {
            console.error('Error submitting payout request:', err);
            toast.error(err.response?.data?.message || 'Lỗi gửi yêu cầu rút tiền.');
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
            case 'completed': // For AdminToDriverPayout (new flow)
                return <Badge bg="success" className="px-3 py-2"><FaCheckCircle className="me-1" /> Đã hoàn thành</Badge>;
            case 'confirmed': // For BulkBill (driver paid company)
                return <Badge bg="primary" className="px-3 py-2"><FaCheckCircle className="me-1" /> Đã xác nhận</Badge>;
            case 'rejected': // For BulkBill
                return <Badge bg="danger" className="px-3 py-2"><FaTimesCircle className="me-1" /> Đã từ chối</Badge>;
            case 'paid': // For BulkBill (status after QR scan)
                return <Badge bg="info" className="px-3 py-2"><FaHourglassHalf className="me-1" /> Đã thanh toán - Chờ xác nhận</Badge>;
            case 'pending': // For CompanyTransaction (driver owes company) & AdminToDriverPayout (if pending payout request)
                return <Badge bg="warning" className="px-3 py-2"><FaClock className="me-1" /> Chờ xử lý</Badge>;
            case 'cancelled': // For AdminToDriverPayout
                return <Badge bg="secondary" className="px-3 py-2"><FaTimesCircle className="me-1" /> Đã hủy</Badge>;
            default:
                return <Badge bg="secondary" className="px-3 py-2">{status}</Badge>;
        }
    };

    const renderContent = () => {
        if (activeTab === 'payoutRequestTab') {
            return (
                <div className="p-4">
                    <div className="mb-4">
                        <h5 className="mb-3">Số dư hiện có</h5>
                        <Card className="bg-info bg-opacity-10 border-info border-2">
                            <Card.Body className="d-flex justify-content-between align-items-center">
                                <span className="fs-4 fw-bold text-info">
                                    <FaCoins className="me-2" />
                                    {formatCurrency(driverBalance)}
                                </span>
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        setRequestAmount(driverBalance > 0 ? driverBalance.toString() : '');
                                        setRequestError('');
                                    }}
                                    disabled={driverBalance <= 0 || isLoading}
                                >
                                    Yêu cầu rút toàn bộ
                                </Button>
                            </Card.Body>
                        </Card>
                    </div>

                    <div className="mb-4">
                        <h5 className="mb-3">Gửi yêu cầu rút tiền</h5>
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Số tiền muốn rút (VNĐ)</Form.Label>
                                <Form.Control
                                    type="number"
                                    placeholder="Nhập số tiền"
                                    value={requestAmount}
                                    onChange={(e) => {
                                        setRequestAmount(e.target.value);
                                        setRequestError('');
                                    }}
                                    isInvalid={!!requestError}
                                    disabled={isLoading}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {requestError}
                                </Form.Control.Feedback>
                            </Form.Group>
                            <Button
                                variant="success"
                                onClick={handlePayoutRequestSubmit}
                                disabled={isLoading || driverBalance <= 0 || !requestAmount || parseFloat(requestAmount) <= 0}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Đang gửi...
                                    </>
                                ) : (
                                    'Gửi yêu cầu rút tiền'
                                )}
                            </Button>
                        </Form>
                    </div>

                    <div className="mb-4">
                        <h5 className="mb-3">Yêu cầu rút tiền đang chờ xử lý</h5>
                        <Table hover className="align-middle mb-0">
                            <thead>
                                <tr className="bg-light">
                                    <th className="py-3">Mã yêu cầu</th>
                                    <th className="py-3">Số tiền</th>
                                    <th className="py-3">Trạng thái</th>
                                    <th className="py-3">Ngày yêu cầu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedPayoutRequests.map(request => (
                                    <tr key={request._id} className="border-bottom">
                                        <td className="text-primary fw-medium">{request._id}</td>
                                        <td className="fw-bold">{formatCurrency(request.amount)}</td>
                                        <td>{getStatusBadge(request.status)}</td>
                                        <td>
                                            <div className="fw-medium">{new Date(request.payoutDate).toLocaleDateString('vi-VN')}</div>
                                            <small className="text-muted">{new Date(request.payoutDate).toLocaleTimeString('vi-VN')}</small>
                                        </td>
                                    </tr>
                                ))}
                                {paginatedPayoutRequests.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-center py-5">
                                            <div className="text-muted">
                                                <FaMoneyBillWave className="fs-1 mb-3" />
                                                <div>Không có yêu cầu rút tiền nào đang chờ xử lý</div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </div>
            );
        } else { // activeTab === 'adminPayoutHistory' (Lịch sử nhận tiền từ Admin)
            return (
                <div className="p-4">
                    <h5 className="mb-3">Lịch sử các khoản tiền nhận được từ Admin</h5>
                    <div className="table-responsive">
                        <Table hover className="align-middle mb-0">
                            <thead>
                                <tr className="bg-light">
                                    <th className="py-3">Mã chi trả</th>
                                    <th className="py-3">Số tiền</th>
                                    <th className="py-3">Trạng thái</th>
                                    <th className="py-3">Ngày chi trả</th>
                                    <th className="py-3">Ghi chú từ Admin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedAdminPayoutHistory.map(payout => (
                                    <tr key={payout._id} className="border-bottom">
                                        <td className="text-primary fw-medium">{payout._id}</td>
                                        <td className="fw-bold">{formatCurrency(payout.amount)}</td>
                                        <td>{getStatusBadge(payout.status)}</td>
                                        <td>
                                            <div className="fw-medium">{new Date(payout.payoutDate).toLocaleDateString('vi-VN')}</div>
                                            <small className="text-muted">{new Date(payout.payoutDate).toLocaleTimeString('vi-VN')}</small>
                                        </td>
                                        <td className="text-muted small">{payout.notes || '-'}</td>
                                    </tr>
                                ))}
                                {paginatedAdminPayoutHistory.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-5">
                                            <div className="text-muted">
                                                <FaMoneyBillWave className="fs-1 mb-3" />
                                                <div>Không có lịch sử nhận tiền nào từ Admin</div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
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
                {/* New Card: Số tiền Công ty nợ bạn */}
                <Col sm={6} md={4} lg={4}>
                    <Card className="h-100 border-0 shadow-sm hover-shadow">
                        <Card.Body className="d-flex align-items-center p-4">
                            <div className="rounded-circle bg-info bg-opacity-10 p-3 me-3">
                                <FaCoins className="text-info fs-3" />
                            </div>
                            <div>
                                <h6 className="text-muted mb-1">Số tiền Công ty nợ bạn</h6>
                                <h4 className="mb-0 fw-bold text-info">{formatCurrency(driverBalance)}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                {/* Existing cards (Old flow: driver owes company) */}
                
                <Col sm={6} md={4} lg={4}>
                    <Card className="h-100 border-0 shadow-sm hover-shadow">
                        <Card.Body className="d-flex align-items-center p-4">
                            <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                                <FaCheckCircle className="text-success fs-3" />
                            </div>
                            <div>
                                <h6 className="text-muted mb-1">Hoa hồng đã thanh toán</h6>
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
                                eventKey="payoutRequestTab"
                                className="px-4 py-3 text-center"
                            >
                                <FaMoneyBillWave className="me-2" />
                                Yêu cầu rút tiền
                            </Nav.Link>
                        </Nav.Item>
                        {/* Tab "Hoa hồng cần thanh toán" đã bị xóa */}
                        <Nav.Item>
                            <Nav.Link
                                eventKey="adminPayoutHistory"
                                className="px-4 py-3 text-center"
                            >
                                <FaFileInvoiceDollar className="me-2" />
                                Lịch sử nhận tiền từ Admin
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
                    {isLoading ? ( // Show loading spinner for content area
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <div className="mt-3 text-muted">Đang tải dữ liệu...</div>
                        </div>
                    ) : (
                        renderContent()
                    )}
                </Card.Body>
            </Card>

            {/* Pagination controls - show based on active tab */}
            {activeTab === 'payoutRequestTab' && totalPayoutRequestPages > 1 && (
                <nav className="d-flex justify-content-center my-3">
                    <ul className="pagination">
                        <li className={`page-item${payoutRequestPage === 1 ? ' disabled' : ''}`}>
                            <button className="page-link" onClick={() => setPayoutRequestPage(payoutRequestPage - 1)}>&laquo;</button>
                        </li>
                        {Array.from({ length: totalPayoutRequestPages }, (_, i) => (
                            <li key={i} className={`page-item${payoutRequestPage === i + 1 ? ' active' : ''}`}>
                                <button className="page-link" onClick={() => setPayoutRequestPage(i + 1)}>{i + 1}</button>
                            </li>
                        ))}
                        <li className={`page-item${payoutRequestPage === totalPayoutRequestPages ? ' disabled' : ''}`}>
                            <button className="page-link" onClick={() => setPayoutRequestPage(payoutRequestPage + 1)}>&raquo;</button>
                        </li>
                    </ul>
                </nav>
            )}

            {/* Pagination for the removed tab "Hoa hồng cần thanh toán" - đã xóa */}
            {/* Code này không còn tồn tại trong file sau khi bỏ tab */}

            {activeTab === 'adminPayoutHistory' && totalAdminPayoutHistoryPages > 1 && (
                <nav className="d-flex justify-content-center my-3">
                    <ul className="pagination">
                        <li className={`page-item${adminPayoutHistoryPage === 1 ? ' disabled' : ''}`}>
                            <button className="page-link" onClick={() => setAdminPayoutHistoryPage(adminPayoutHistoryPage - 1)}>&laquo;</button>
                        </li>
                        {Array.from({ length: totalAdminPayoutHistoryPages }, (_, i) => (
                            <li key={i} className={`page-item${adminPayoutHistoryPage === i + 1 ? ' active' : ''}`}>
                                <button className="page-link" onClick={() => setAdminPayoutHistoryPage(i + 1)}>{i + 1}</button>
                            </li>
                        ))}
                        <li className={`page-item${adminPayoutHistoryPage === totalAdminPayoutHistoryPages ? ' disabled' : ''}`}>
                            <button className="page-link" onClick={() => setAdminPayoutHistoryPage(adminPayoutHistoryPage + 1)}>&raquo;</button>
                        </li>
                    </ul>
                </nav>
            )}

           
        </div>
    );
};

export default CommissionManagement;