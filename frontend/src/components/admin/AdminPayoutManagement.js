import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Row, Col, Card, Badge, Modal } from 'react-bootstrap';
import { FaCheck, FaTimes, FaFilter, FaEye, FaMoneyBillWave, FaClock, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaInfoCircle, FaCoins } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { transactionAPI } from '../../services/api'; // Sử dụng transactionAPI để gọi các hàm mới

const AdminPayoutManagement = () => {
    // States cho luồng mới: Quản lý chi trả từ Admin cho Driver
    const [pendingPayoutRequests, setPendingPayoutRequests] = useState([]); // Yêu cầu rút tiền đang chờ xử lý
    const [payoutHistory, setPayoutHistory] = useState([]); // Lịch sử chi trả (đã duyệt/hủy)
    const [loading, setLoading] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null); // Yêu cầu đang được Admin xem/xử lý
    const [remarks, setRemarks] = useState(''); // Ghi chú của Admin khi xử lý
    const [confirmAction, setConfirmAction] = useState(''); // 'approve' hoặc 'reject'
    const [showConfirmModal, setShowConfirmModal] = useState(false); // Modal xác nhận xử lý
    const [showDetailsModal, setShowDetailsModal] = useState(false); // Modal chi tiết yêu cầu

    // Thống kê cho luồng mới
    const [stats, setStats] = useState({
        totalRequests: 0,
        pendingCount: 0,
        completedCount: 0,
        cancelledCount: 0,
        totalAmountPending: 0,
        totalAmountCompleted: 0,
        totalAmountCancelled: 0,
    });

    // Filters (nếu muốn thêm filter cho lịch sử chi trả)
    const [filters, setFilters] = useState({
        startDate: null,
        endDate: null,
        driverName: '',
        status: ''
    });

    useEffect(() => {
        fetchPayoutData();
    }, [filters]);

    const fetchPayoutData = async () => {
        try {
            setLoading(true);
            // Lấy yêu cầu đang chờ xử lý (Admin có quyền xem)
            const pendingReqsResponse = await transactionAPI.getAdminPendingPayoutRequests();
            setPendingPayoutRequests(pendingReqsResponse.data.requests || []);

            // THAY THẾ API CŨ CỦA DRIVER BẰNG API MỚI CHO ADMIN
            const adminPayoutsHistoryResponse = await transactionAPI.getAdminPayoutsHistory(filters); // Gọi API mới cho Admin
            const allPayouts = adminPayoutsHistoryResponse.data.payouts || [];


            // Filter và tính stats từ allPayouts để có cái nhìn tổng quan của Admin
            const completedPayouts = allPayouts.filter(p => p.status === 'completed');
            const cancelledPayouts = allPayouts.filter(p => p.status === 'cancelled');

            setStats({
                totalRequests: pendingReqsResponse.data.requests.length + completedPayouts.length + cancelledPayouts.length,
                pendingCount: pendingReqsResponse.data.requests.length,
                completedCount: completedPayouts.length,
                cancelledCount: cancelledPayouts.length,
                totalAmountPending: pendingReqsResponse.data.requests.reduce((sum, req) => sum + req.amount, 0),
                totalAmountCompleted: completedPayouts.reduce((sum, p) => sum + p.amount, 0),
                totalAmountCancelled: cancelledPayouts.reduce((sum, p) => sum + p.amount, 0),
            });


        } catch (error) {
            console.error('Error fetching admin payout data:', error); // Giữ log này để debug
            toast.error('Không thể tải dữ liệu chi trả.');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmProcess = async () => {
        try {
            if (!selectedRequest) return;
            setLoading(true);
            const statusToUpdate = confirmAction === 'approve' ? 'completed' : 'cancelled';
            const response = await transactionAPI.processPayoutRequest(selectedRequest._id, {
                status: statusToUpdate,
                adminNotes: remarks
            });

            if (response.data.success) {
                toast.success(response.data.message);
                setShowConfirmModal(false);
                setSelectedRequest(null);
                setRemarks('');
                setConfirmAction('');
                fetchPayoutData(); // Refresh data
            } else {
                toast.error(response.data.message || 'Không thể xử lý yêu cầu.');
            }
        } catch (error) {
            console.error('Error processing payout request:', error);
            toast.error(error.response?.data?.message || 'Không thể xử lý yêu cầu.');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (request) => {
        setSelectedRequest(request);
        setShowDetailsModal(true);
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
            case 'pending':
                return <Badge bg="warning" className="px-3 py-2"><FaClock className="me-1" /> Chờ xử lý</Badge>;
            case 'completed':
                return <Badge bg="success" className="px-3 py-2"><FaCheckCircle className="me-1" /> Đã duyệt</Badge>;
            case 'cancelled':
                return <Badge bg="danger" className="px-3 py-2"><FaTimesCircle className="me-1" /> Đã từ chối</Badge>;
            default:
                return <Badge bg="secondary" className="px-3 py-2">{status}</Badge>;
        }
    };

    return (
        <div className="p-4">
            <h2 className="mb-4">Quản lý Chi trả Tài xế</h2>

            {/* Stats Cards for Payout Management */}
            <Row className="mb-4 g-3">
                <Col sm={6} md={4} lg>
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
                <Col sm={6} md={4} lg>
                    <Card className="h-100 border-0 shadow-sm hover-shadow">
                        <Card.Body className="d-flex align-items-center p-4">
                            <div className="rounded-circle bg-warning bg-opacity-10 p-3 me-3">
                                <FaClock className="text-warning fs-3" />
                            </div>
                            <div>
                                <h6 className="text-muted mb-1">Yêu cầu chờ duyệt</h6>
                                <h4 className="mb-0 fw-bold text-warning">{stats.pendingCount}</h4>
                                <small className="text-muted">{formatCurrency(stats.totalAmountPending)}</small>
                            </div>
                    </Card.Body>
                    </Card>
                </Col>
                <Col sm={6} md={4} lg>
                    <Card className="h-100 border-0 shadow-sm hover-shadow">
                        <Card.Body className="d-flex align-items-center p-4">
                            <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                                <FaCheckCircle className="text-success fs-3" />
                            </div>
                            <div>
                                <h6 className="text-muted mb-1">Yêu cầu đã duyệt</h6>
                                <h4 className="mb-0 fw-bold text-success">{stats.completedCount}</h4>
                                <small className="text-muted">{formatCurrency(stats.totalAmountCompleted)}</small>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col sm={6} md={4} lg>
                    <Card className="h-100 border-0 shadow-sm hover-shadow">
                        <Card.Body className="d-flex align-items-center p-4">
                            <div className="rounded-circle bg-danger bg-opacity-10 p-3 me-3">
                                <FaTimesCircle className="text-danger fs-3" />
                            </div>
                            <div>
                                <h6 className="text-muted mb-1">Yêu cầu đã hủy</h6>
                                <h4 className="mb-0 fw-bold text-danger">{stats.cancelledCount}</h4>
                                <small className="text-muted">{formatCurrency(stats.totalAmountCancelled)}</small>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Filters (Optional, for payout history) */}
            {/* <Card className="mb-4 border-0 shadow-sm">
                <Card.Body className="p-4">
                    <h5 className="mb-4">Bộ lọc tìm kiếm lịch sử chi trả</h5>
                    <Form onSubmit={handleSearch}>
                        <Row className="g-3">
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="text-muted small mb-2">Từ ngày</Form.Label>
                                    <Form.Control type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="border-0 shadow-sm" />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="text-muted small mb-2">Đến ngày</Form.Label>
                                    <Form.Control type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="border-0 shadow-sm" />
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group>
                                    <Form.Label className="text-muted small mb-2">Trạng thái</Form.Label>
                                    <Form.Select name="status" value={filters.status} onChange={handleFilterChange} className="border-0 shadow-sm">
                                        <option value="">Tất cả</option>
                                        <option value="pending">Chờ duyệt</option>
                                        <option value="completed">Đã duyệt</option>
                                        <option value="cancelled">Đã hủy</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="text-muted small mb-2">Tên tài xế</Form.Label>
                                    <Form.Control type="text" name="driverName" value={filters.driverName} onChange={handleFilterChange} placeholder="Nhập tên tài xế..." className="border-0 shadow-sm" />
                                </Form.Group>
                            </Col>
                            <Col md={1} className="d-flex align-items-end">
                                <Button type="submit" variant="primary" className="w-100 d-flex align-items-center justify-content-center gap-2 shadow-sm">
                                    <FaFilter /><span className="d-none d-lg-inline">Lọc</span>
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card> */}

            {/* Pending Payout Requests Table */}
            <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                    <h5 className="mb-4">Yêu cầu rút tiền đang chờ duyệt</h5>
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <div className="mt-3 text-muted">Đang tải dữ liệu...</div>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover className="align-middle">
                                <thead>
                                    <tr className="bg-light">
                                        <th className="text-nowrap py-3">Mã Yêu cầu</th>
                                        <th className="text-nowrap py-3">Tài xế</th>
                                        <th className="text-end text-nowrap py-3">Số tiền</th>
                                        <th className="text-nowrap py-3">Ngày yêu cầu</th>
                                        <th className="text-center text-nowrap py-3">Trạng thái</th>
                                        <th className="text-center text-nowrap py-3">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingPayoutRequests.map(request => (
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
                                            <td className="text-end fw-bold">{formatCurrency(request.amount)}</td>
                                            <td className="text-nowrap">
                                                <div className="fw-medium">{new Date(request.payoutDate).toLocaleDateString('vi-VN')}</div>
                                                <small className="text-muted">{new Date(request.payoutDate).toLocaleTimeString('vi-VN')}</small>
                                            </td>
                                            <td className="text-center">{getStatusBadge(request.status)}</td>
                                            <td>
                                                <div className="d-flex justify-content-center gap-2">
                                                    <Button
                                                        variant="outline-info"
                                                        size="sm"
                                                        className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
                                                        onClick={() => handleViewDetails(request)}
                                                    >
                                                        <FaEye /> Chi tiết
                                                    </Button>
                                                    <Button
                                                        variant="outline-success"
                                                        size="sm"
                                                        className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
                                                        onClick={() => {
                                                            setSelectedRequest(request);
                                                            setConfirmAction('approve');
                                                            setShowConfirmModal(true);
                                                        }}
                                                    >
                                                        <FaCheck /> Duyệt
                                                    </Button>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
                                                        onClick={() => {
                                                            setSelectedRequest(request);
                                                            setConfirmAction('reject');
                                                            setShowConfirmModal(true);
                                                        }}
                                                    >
                                                        <FaTimes /> Từ chối
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {pendingPayoutRequests.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center py-5">
                                                <div className="text-muted">
                                                    <FaMoneyBillWave className="fs-1 mb-3 text-muted" />
                                                    <div>Không có yêu cầu rút tiền nào đang chờ duyệt</div>
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

            {/* Confirm Modal */}
            <Modal 
                show={showConfirmModal} 
                onHide={() => {
                    setShowConfirmModal(false);
                    setConfirmAction('');
                    setRemarks('');
                }}
                centered
            >
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fs-5">
                        {confirmAction === 'approve' ? (
                            <span className="text-success">
                                <FaCheckCircle className="me-2" />
                                Xác nhận Duyệt yêu cầu
                            </span>
                        ) : (
                            <span className="text-danger">
                                <FaTimesCircle className="me-2" />
                                Xác nhận Từ chối yêu cầu
                            </span>
                        )}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4">
                    <div className="alert alert-light border-0 rounded-3 mb-4">
                        <div className="d-flex align-items-center mb-3">
                            <div className="me-3">
                                <FaMoneyBillWave className="fs-3 text-primary" />
                            </div>
                            <div>
                                <h6 className="mb-1">Thông tin yêu cầu</h6>
                                <div className="text-muted small">Mã yêu cầu: {selectedRequest?._id}</div>
                            </div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                            <div className="text-muted">Số tiền:</div>
                            <div className="fs-5 fw-bold text-primary">{selectedRequest ? formatCurrency(selectedRequest.amount) : ''}</div>
                        </div>
                    </div>

                    <Form.Group className="mb-4">
                        <Form.Label className="text-muted small mb-2">Ghi chú của Admin</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Nhập ghi chú (nếu có)"
                            className="border-0 shadow-sm"
                        />
                    </Form.Group>

                    <div className="alert alert-warning border-0 rounded-3">
                        <FaHourglassHalf className="me-2" />
                        Bạn có chắc chắn muốn {confirmAction === 'approve' ? 'duyệt' : 'từ chối'} yêu cầu này?
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button 
                        variant="light" 
                        onClick={() => {
                            setShowConfirmModal(false);
                            setConfirmAction('');
                            setRemarks('');
                        }}
                        className="rounded-pill px-4"
                    >
                        Hủy
                    </Button>
                    <Button
                        variant={confirmAction === 'approve' ? 'success' : 'danger'}
                        onClick={handleConfirmProcess}
                        disabled={loading}
                        className="rounded-pill px-4"
                    >
                        {confirmAction === 'approve' ? (
                            <>
                                <FaCheck className="me-2" /> Duyệt
                            </>
                        ) : (
                            <>
                                <FaTimes className="me-2" /> Từ chối
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Details Modal (for payout requests) */}
            <Modal 
                show={showDetailsModal} 
                onHide={() => setShowDetailsModal(false)} 
                size="lg"
                centered
            >
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fs-5">
                        <FaEye className="me-2" />
                        Chi tiết Yêu cầu rút tiền
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <div className="mt-3 text-muted">Đang tải dữ liệu...</div>
                        </div>
                    ) : selectedRequest ? (
                        <>
                            <div className="alert alert-light border-0 rounded-3 mb-4">
                                <div className="d-flex align-items-center mb-3">
                                    <div className="me-3">
                                        <FaMoneyBillWave className="fs-3 text-primary" />
                                    </div>
                                    <div>
                                        <h6 className="mb-1">Thông tin yêu cầu</h6>
                                        <div className="text-muted small">Mã yêu cầu: {selectedRequest._id}</div>
                                    </div>
                                </div>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <div className="text-muted small mb-1">Tài xế</div>
                                        <div className="fw-medium">
                                            {selectedRequest.driverId ? (
                                                <>
                                                    {selectedRequest.driverId.fullName}
                                                    <small className="text-muted d-block">{selectedRequest.driverId.email}</small>
                                                </>
                                            ) : 'N/A'}
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="text-muted small mb-1">Số tiền yêu cầu</div>
                                        <div className="fw-bold text-primary">{formatCurrency(selectedRequest.amount)}</div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="text-muted small mb-1">Trạng thái</div>
                                        <div>{getStatusBadge(selectedRequest.status)}</div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="text-muted small mb-1">Ngày yêu cầu</div>
                                        <div className="fw-medium">{formatDate(selectedRequest.payoutDate)}</div>
                                    </Col>
                                    {selectedRequest.status !== 'pending' && selectedRequest.adminId && (
                                        <Col md={6}>
                                            <div className="text-muted small mb-1">Xử lý bởi Admin</div>
                                            <div className="fw-medium">
                                                {selectedRequest.adminId.fullName}
                                                <small className="text-muted d-block">{selectedRequest.adminId.email}</small>
                                            </div>
                                        </Col>
                                    )}
                                    {selectedRequest.status !== 'pending' && selectedRequest.updatedAt && (
                                        <Col md={6}>
                                            <div className="text-muted small mb-1">Ngày xử lý</div>
                                            <div className="fw-medium">{formatDate(selectedRequest.updatedAt)}</div>
                                        </Col>
                                    )}
                                </Row>
                                {selectedRequest.notes && (
                                    <div className="mt-3 pt-3 border-top">
                                        <div className="text-muted small mb-1">Ghi chú của Admin</div>
                                        <div>{selectedRequest.notes}</div>
                                    </div>
                                )}
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

export default AdminPayoutManagement;