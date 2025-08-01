import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Form, Row, Col, Card, Badge, Modal, Pagination, Nav, Alert } from 'react-bootstrap';
import { FaCheck, FaTimes, FaFilter, FaEye, FaMoneyBillWave, FaClock, FaCheckCircle, FaTimesCircle, FaArrowLeft, FaHistory, FaFileInvoiceDollar } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { transactionAPI, adminAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const AdminPayoutManagement = () => {
    const navigate = useNavigate();

    // States cho các tab
    const [activeTab, setActiveTab] = useState('pendingRequests');

    // States cho dữ liệu
    const [pendingPayoutRequests, setPendingPayoutRequests] = useState([]);
    const [adminPayoutHistory, setAdminPayoutHistory] = useState([]);
    const [drivers, setDrivers] = useState([]);

    // States cho bộ lọc lịch sử chi trả
    const [filters, setFilters] = useState({
        startDate: null,
        endDate: null,
        driverName: '',
        status: ''
    });

    // --- FIX: Thêm state riêng cho ô input tên tài xế để không bị mất focus ---
    const [driverNameSearchTerm, setDriverNameSearchTerm] = useState('');

    // States cho phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 5;

    // States cho Modal xử lý yêu cầu
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [processStatus, setProcessStatus] = useState('');
    const [remarks, setRemarks] = useState('');

    // States cho Modal xem chi tiết
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showHistoryDetailsModal, setShowHistoryDetailsModal] = useState(false);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

    // States khác
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({
        totalRequests: 0,
        pendingCount: 0,
        completedCount: 0,
        cancelledCount: 0,
        totalAmountPending: 0,
        totalAmountCompleted: 0,
        totalAmountCancelled: 0,
    });

    // --- FETCH DATA FUNCTIONS ---
    // Hàm này sẽ fetch dữ liệu cho tab "Yêu cầu chờ xử lý" VÀ CẬP NHẬT STATS
    const fetchPendingRequestsData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const pendingReqsResponse = await transactionAPI.getAdminPendingPayoutRequests();
            const requests = pendingReqsResponse.data.requests || [];
            setPendingPayoutRequests(requests);

            const allPayoutsHistory = await transactionAPI.getAdminPayoutsHistory({});
            const allCompletedPayouts = allPayoutsHistory.data.payouts.filter(p => p.status === 'completed');
            const allCancelledPayouts = allPayoutsHistory.data.payouts.filter(p => p.status === 'cancelled');

            setStats({
                totalRequests: requests.length + allCompletedPayouts.length + allCancelledPayouts.length,
                pendingCount: requests.length,
                completedCount: allCompletedPayouts.length,
                cancelledCount: allCancelledPayouts.length,
                totalAmountPending: requests.reduce((sum, req) => sum + req.amount, 0),
                totalAmountCompleted: allCompletedPayouts.reduce((sum, p) => sum + p.amount, 0),
                totalAmountCancelled: allCancelledPayouts.reduce((sum, p) => sum + p.amount, 0),
            });
        } catch (err) {
            console.error('Error fetching pending payout requests:', err);
            toast.error('Không thể tải yêu cầu chi trả đang chờ xử lý.');
            setError('Không thể tải yêu cầu chi trả đang chờ xử lý.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Hàm này sẽ fetch dữ liệu cho tab "Lịch sử chi trả" VÀ CẬP NHẬT STATS
    const fetchPayoutHistoryData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await transactionAPI.getAdminPayoutsHistory({
                ...filters,
                page: currentPage,
                limit: itemsPerPage
            });
            setAdminPayoutHistory(response.data.payouts || []);
            setTotalPages(Math.ceil(response.data.count / itemsPerPage));

            const pendingReqsResponse = await transactionAPI.getAdminPendingPayoutRequests();
            const requests = pendingReqsResponse.data.requests || [];

            const allCompletedPayouts = response.data.payouts.filter(p => p.status === 'completed');
            const allCancelledPayouts = response.data.payouts.filter(p => p.status === 'cancelled');

            setStats({
                totalRequests: requests.length + allCompletedPayouts.length + allCancelledPayouts.length,
                pendingCount: requests.length,
                completedCount: allCompletedPayouts.length,
                cancelledCount: allCancelledPayouts.length,
                totalAmountPending: requests.reduce((sum, req) => sum + req.amount, 0),
                totalAmountCompleted: allCompletedPayouts.reduce((sum, p) => sum + p.amount, 0),
                totalAmountCancelled: allCancelledPayouts.reduce((sum, p) => sum + p.amount, 0),
            });
        } catch (err) {
            console.error('Error fetching admin payout history:', err);
            toast.error('Không thể tải lịch sử chi trả.');
            setError('Không thể tải lịch sử chi trả.');
        } finally {
            setLoading(false);
        }
    }, [filters, currentPage]);


    const fetchDrivers = useCallback(async () => {
        try {
            const response = await adminAPI.getDrivers();
            setDrivers(response.data.drivers || []);
        } catch (err) {
            console.error('Error fetching drivers:', err);
        }
    }, []);

    // --- EFFECTS ---
    useEffect(() => {
        if (activeTab === 'pendingRequests') {
            fetchPendingRequestsData();
        } else if (activeTab === 'payoutHistory') {
            fetchPayoutHistoryData();
        }
        fetchDrivers();
    }, [activeTab, filters, currentPage, fetchPendingRequestsData, fetchPayoutHistoryData, fetchDrivers]);
    
    // Đồng bộ giá trị input tìm kiếm khi chuyển tab hoặc filter
    useEffect(() => {
        setDriverNameSearchTerm(filters.driverName);
    }, [filters.driverName]);

    // --- HANDLERS ---
    const handleProcessClick = (request, status) => {
        setSelectedRequest(request);
        setProcessStatus(status);
        setRemarks('');
        setShowProcessModal(true);
    };

    const handleConfirmProcess = async () => {
        try {
            if (!selectedRequest) return;
            setLoading(true);
            const statusToUpdate = processStatus === 'completed' ? 'completed' : 'cancelled';
            const response = await transactionAPI.processPayoutRequest(selectedRequest._id, {
                status: statusToUpdate,
                adminNotes: remarks
            });
            if (response.data.success) {
                toast.success(response.data.message);
                setShowProcessModal(false);
                setSelectedRequest(null);
                setRemarks('');
                setProcessStatus('');
                fetchPendingRequestsData();
                fetchPayoutHistoryData();
            } else {
                toast.error(response.data.message || 'Lỗi khi xử lý yêu cầu.');
            }
        } catch (error) {
            console.error('Error processing payout request:', error);
            toast.error(error.response?.data?.message || 'Lỗi server khi xử lý yêu cầu.');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (request) => {
        setSelectedRequest(request);
        setShowDetailsModal(true);
    };

    const handleHistoryDetailsClick = (item) => {
        setSelectedHistoryItem(item);
        setShowHistoryDetailsModal(true);
    };

    // Handler cho các bộ lọc không phải input text
    const handleFilterChange = useCallback((e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    }, []);

    const handleDateChange = useCallback((date, name) => {
        setFilters(prev => ({ ...prev, [name]: date }));
        setCurrentPage(1);
    }, []);

    // --- FIX: Cập nhật hàm handleSearchSubmit để lấy giá trị từ state mới và trigger fetch ---
    const handleSearchSubmit = useCallback((e) => {
        e.preventDefault();
        setFilters(prev => ({ ...prev, driverName: driverNameSearchTerm }));
        setCurrentPage(1);
    }, [driverNameSearchTerm]);


    // --- UTILITIES ---
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount).replace('₫', 'd');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('vi-VN');
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return <Badge bg="warning" className="px-3 py-2"><FaClock className="me-1" /> Chờ xử lý</Badge>;
            case 'completed':
                return <Badge bg="success" className="px-3 py-2"><FaCheckCircle className="me-1" /> Đã hoàn thành</Badge>;
            case 'cancelled':
                return <Badge bg="danger" className="px-3 py-2"><FaTimesCircle className="me-1" /> Đã hủy</Badge>;
            default:
                return <Badge bg="secondary" className="px-3 py-2">{status}</Badge>;
        }
    };

    // --- RENDER CONTENT ---
    const renderContent = () => {
        if (loading) {
            return (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <div className="mt-3 text-muted">Đang tải dữ liệu...</div>
                </div>
            );
        }

        if (error) {
            return <Alert variant="danger" className="m-4">{error}</Alert>;
        }

        if (activeTab === 'pendingRequests') {
            return (
                <div className="p-4">
                    <h5 className="mb-3">Yêu cầu chi trả đang chờ xử lý</h5>
                    <div className="table-responsive">
                        <Table hover className="align-middle mb-0">
                            <thead>
                                <tr className="bg-light">
                                    <th className="py-3">Mã Yêu cầu</th>
                                    <th className="py-3">Tài xế</th>
                                    <th className="text-end py-3">Số tiền</th>
                                    <th className="py-3">Ngày yêu cầu</th>
                                    <th className="text-center py-3">Trạng thái</th>
                                    <th className="py-3">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingPayoutRequests.length > 0 ? (
                                    pendingPayoutRequests.map(request => (
                                        <tr key={request._id} className="border-bottom">
                                            <td className="text-primary fw-medium">{request._id}</td>
                                            <td>
                                                {request.driverId ? (
                                                    <div>
                                                        <div className="fw-medium">{request.driverId.fullName}</div>
                                                        <small className="text-muted">{request.driverId.email}</small>
                                                    </div>
                                                ) : 'N/A'}
                                            </td>
                                            <td className="fw-bold">{formatCurrency(request.amount)}</td>
                                            <td className="text-nowrap">
                                                <div className="fw-medium">{formatDate(request.payoutDate)}</div>
                                                <small className="text-muted">{formatDate(request.payoutDate)}</small>
                                            </td>
                                            <td className="text-center">{getStatusBadge(request.status)}</td>
                                            <td>
                                                <div className="d-flex justify-content-center gap-2">
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        className="me-2 d-flex align-items-center gap-1 px-3 py-2 rounded-pill"
                                                        onClick={() => handleProcessClick(request, 'completed')}
                                                    >
                                                        <FaCheck /> Duyệt
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        className="d-flex align-items-center gap-1 px-3 py-2 rounded-pill"
                                                        onClick={() => handleProcessClick(request, 'cancelled')}
                                                    >
                                                        <FaTimes /> Từ chối
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="text-center py-5">
                                            <div className="text-muted">
                                                <FaMoneyBillWave className="fs-1 mb-3 text-muted" />
                                                <div>Không có yêu cầu chi trả nào đang chờ xử lý.</div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </div>
            );
        } else if (activeTab === 'payoutHistory') {
            return (
                <div className="p-4">
                    <h5 className="mb-3">Lịch sử chi trả</h5>
                    {/* Filter controls */}
                    <Form className="mb-4" onSubmit={handleSearchSubmit}>
                        <Row className="g-3 align-items-end">
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Từ ngày</Form.Label>
                                    <DatePicker
                                        selected={filters.startDate}
                                        onChange={(date) => handleDateChange(date, 'startDate')}
                                        dateFormat="dd/MM/yyyy"
                                        className="form-control"
                                        placeholderText="Chọn ngày bắt đầu"
                                        isClearable
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Đến ngày</Form.Label>
                                    <DatePicker
                                        selected={filters.endDate}
                                        onChange={(date) => handleDateChange(date, 'endDate')}
                                        dateFormat="dd/MM/yyyy"
                                        className="form-control"
                                        placeholderText="Chọn ngày kết thúc"
                                        isClearable
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Tên tài xế</Form.Label>
                                    {/* FIX: Sử dụng state riêng cho input này */}
                                    <Form.Control
                                        type="text"
                                        name="driverName"
                                        placeholder="Tìm theo tên tài xế"
                                        value={driverNameSearchTerm}
                                        onChange={(e) => setDriverNameSearchTerm(e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Trạng thái</Form.Label>
                                    <Form.Select
                                        name="status"
                                        value={filters.status}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="">Tất cả</option>
                                        <option value="completed">Đã hoàn thành</option>
                                        <option value="cancelled">Đã hủy</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col xs={12} className="d-flex justify-content-end mt-3">
                                <Button type="submit" variant="primary" className="d-flex align-items-center justify-content-center gap-2 shadow-sm">
                                    <FaFilter /><span className="d-inline">Lọc</span>
                                </Button>
                            </Col>
                        </Row>
                    </Form>

                    <div className="table-responsive">
                        <Table hover className="align-middle mb-0">
                            <thead>
                                <tr className="bg-light">
                                    <th className="py-3">Mã chi trả</th>
                                    <th className="py-3">Tài xế</th>
                                    <th className="text-end py-3">Số tiền</th>
                                    <th className="py-3">Trạng thái</th>
                                    <th className="py-3">Ngày chi trả</th>
                                    <th className="py-3">Admin xử lý</th>
                                    <th className="py-3">Ghi chú</th>
                                    <th className="py-3">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {adminPayoutHistory.length > 0 ? (
                                    adminPayoutHistory.map(item => (
                                        <tr key={item._id} className="border-bottom">
                                            <td className="text-primary fw-medium">{item._id}</td>
                                            <td>
                                                <div className="fw-medium">{item.driverId?.fullName || 'N/A'}</div>
                                                <small className="text-muted">{item.driverId?.email || 'N/A'}</small>
                                            </td>
                                            <td className="fw-bold">{formatCurrency(item.amount)}</td>
                                            <td>{getStatusBadge(item.status)}</td>
                                            <td>{formatDate(item.payoutDate)}</td>
                                            <td>{item.adminId?.fullName || 'Chưa có Admin nào xử lý'}</td>
                                            <td className="text-muted small">{item.notes || '-'}</td>
                                            <td>
                                                <Button
                                                    variant="info"
                                                    size="sm"
                                                    onClick={() => handleHistoryDetailsClick(item)}
                                                >
                                                    <FaEye />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="text-center py-5">
                                            <div className="text-muted">
                                                <FaFileInvoiceDollar className="fs-1 mb-3" />
                                                <div>Không có lịch sử chi trả nào phù hợp với bộ lọc.</div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Pagination className="justify-content-center mt-4">
                            <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} />
                            {[...Array(totalPages)].map((_, index) => (
                                <Pagination.Item key={index + 1} active={index + 1 === currentPage} onClick={() => setCurrentPage(index + 1)}>
                                    {index + 1}
                                </Pagination.Item>
                            ))}
                            <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} />
                        </Pagination>
                    )}
                </div>
            );
        }
    };

    return (
        <div className="p-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">Quản lý chi trả tài xế</h4>
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
                <Col sm={6} md={4} lg={3}>
                    <Card className="h-100 border-0 shadow-sm hover-shadow">
                        <Card.Body className="d-flex align-items-center p-4">
                            <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                                <FaMoneyBillWave className="text-primary fs-3" />
                            </div>
                            <div>
                                <h6 className="text-muted mb-1">Tổng yêu cầu</h6>
                                <h4 className="mb-0 fw-bold text-primary">{stats.totalRequests}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col sm={6} md={4} lg={3}>
                    <Card className="h-100 border-0 shadow-sm hover-shadow">
                        <Card.Body className="d-flex align-items-center p-4">
                            <div className="rounded-circle bg-warning bg-opacity-10 p-3 me-3">
                                <FaClock className="text-warning fs-3" />
                            </div>
                            <div>
                                <h6 className="text-muted mb-1">Đang chờ xử lý</h6>
                                <h4 className="mb-0 fw-bold text-warning">{stats.pendingCount} ({formatCurrency(stats.totalAmountPending)})</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col sm={6} md={4} lg={3}>
                    <Card className="h-100 border-0 shadow-sm hover-shadow">
                        <Card.Body className="d-flex align-items-center p-4">
                            <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                                <FaCheckCircle className="text-success fs-3" />
                            </div>
                            <div>
                                <h6 className="text-muted mb-1">Đã hoàn thành</h6>
                                <h4 className="mb-0 fw-bold text-success">{stats.completedCount} ({formatCurrency(stats.totalAmountCompleted)})</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col sm={6} md={4} lg={3}>
                    <Card className="h-100 border-0 shadow-sm hover-shadow">
                        <Card.Body className="d-flex align-items-center p-4">
                            <div className="rounded-circle bg-danger bg-opacity-10 p-3 me-3">
                                <FaTimesCircle className="text-danger fs-3" />
                            </div>
                            <div>
                                <h6 className="text-muted mb-1">Đã hủy</h6>
                                <h4 className="mb-0 fw-bold text-danger">{stats.cancelledCount} ({formatCurrency(stats.totalAmountCancelled)})</h4>
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
                                eventKey="pendingRequests"
                                className="px-4 py-3 text-center"
                            >
                                <FaClock className="me-2" />
                                Yêu cầu chờ xử lý
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link
                                eventKey="payoutHistory"
                                className="px-4 py-3 text-center"
                            >
                                <FaHistory className="me-2" />
                                Lịch sử chi trả
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>
                </Card.Body>
            </Card>

            {/* Content Card */}
            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    {renderContent()}
                </Card.Body>
            </Card>

            {/* Process Payout Modal */}
            <Modal show={showProcessModal} onHide={() => setShowProcessModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{processStatus === 'completed' ? 'Duyệt yêu cầu chi trả' : 'Từ chối yêu cầu chi trả'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedRequest && (
                        <>
                            <p>Bạn có chắc chắn muốn **{processStatus === 'completed' ? 'DUYỆT' : 'TỪ CHỐI'}** yêu cầu chi trả này không?</p>
                            <p>Mã yêu cầu: <strong>{selectedRequest._id}</strong></p>
                            <p>Tài xế: <strong>{selectedRequest.driverId?.fullName || 'N/A'}</strong></p>
                            <p>Số tiền: <strong>{formatCurrency(selectedRequest.amount)}</strong></p>
                            <Form.Group className="mb-3">
                                <Form.Label>Ghi chú (tùy chọn)</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder="Nhập ghi chú cho tài xế..."
                                />
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowProcessModal(false)}>
                        Hủy
                    </Button>
                    <Button variant={processStatus === 'completed' ? 'success' : 'danger'} onClick={handleConfirmProcess} disabled={loading}>
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Đang xử lý...
                            </>
                        ) : (
                            processStatus === 'completed' ? 'Duyệt' : 'Từ chối'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* History Details Modal */}
            <Modal show={showHistoryDetailsModal} onHide={() => setShowHistoryDetailsModal(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết lịch sử chi trả</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedHistoryItem && (
                        <Row>
                            <Col md={6}>
                                <h6 className="text-primary">Thông tin yêu cầu</h6>
                                <p><strong>Mã chi trả:</strong> {selectedHistoryItem._id}</p>
                                <p><strong>Số tiền:</strong> {formatCurrency(selectedHistoryItem.amount)}</p>
                                <p><strong>Trạng thái:</strong> {getStatusBadge(selectedHistoryItem.status)}</p>
                                <p><strong>Ngày chi trả:</strong> {formatDate(selectedHistoryItem.payoutDate)}</p>
                            </Col>
                            <Col md={6}>
                                <h6 className="text-primary">Thông tin tài xế</h6>
                                <p><strong>Tên tài xế:</strong> {selectedHistoryItem.driverId?.fullName || 'N/A'}</p>
                                <p><strong>Email:</strong> {selectedHistoryItem.driverId?.email || 'N/A'}</p>
                                <p><strong>Số điện thoại:</strong> {selectedHistoryItem.driverId?.phone || 'N/A'}</p>
                            </Col>
                            <Col xs={12} className="mt-3">
                                <h6 className="text-primary">Thông tin Admin xử lý</h6>
                                <p><strong>Admin:</strong> {selectedHistoryItem.adminId?.fullName || 'Chưa có Admin nào xử lý'}</p>
                                <p><strong>Email Admin:</strong> {selectedHistoryItem.adminId?.email || 'Chưa có Admin nào xử lý'}</p>
                                <p><strong>Ghi chú từ Admin:</strong> {selectedHistoryItem.notes || 'Không có'}</p>
                            </Col>
                        </Row>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowHistoryDetailsModal(false)}>
                        Đóng
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default AdminPayoutManagement;
