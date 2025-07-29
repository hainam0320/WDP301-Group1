import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { transactionAPI } from '../../services/api'; // Sử dụng transactionAPI mới
import { format } from 'date-fns';
import { Table, Form, Button, Row, Col, Card, Badge, Modal } from 'react-bootstrap';
import { FaCheck, FaExclamationTriangle, FaTimes, FaFilter, FaEye, FaMoneyBillWave, FaClock, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaRegMoneyBillAlt } from 'react-icons/fa'; // Thêm icons

const AdminCommissionManagement = () => {
    const [transactions, setTransactions] = useState([]); // Đổi từ bills sang transactions
    const [stats, setStats] = useState({
        totalAmount: 0,
        heldAmount: 0,
        commissionCollectedAmount: 0,
        payoutDisbursedAmount: 0,
        refundedAmount: 0,
        disputedAmount: 0
    });
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        driverId: '', // Thêm filter theo driverId
        userId: '', // Thêm filter theo userId
        status: '', // Trạng thái giao dịch mới
        type: '' // Loại giao dịch mới
    });
    const [loading, setLoading] = useState(false);
    const [showResolveModal, setShowResolveModal] = useState(false); // Đổi tên từ ConfirmModal
    const [selectedTransaction, setSelectedTransaction] = useState(null); // Đổi từ selectedBill
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [remarks, setRemarks] = useState('');
    const [resolveAction, setResolveAction] = useState(''); // confirmAction -> resolveAction (refund/disburse)

    useEffect(() => {
        fetchData();
    }, [filters]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await transactionAPI.getAdminTransactions(filters); // Gọi API mới
            if (response.data.success) {
                setTransactions(response.data.transactions || []);
                setStats(response.data.stats || {});
            } else {
                toast.error('Không thể tải danh sách giao dịch');
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
            toast.error('Không thể tải danh sách giao dịch');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchData();
    };

    const handleViewDetails = async (transactionId) => {
        try {
            setLoading(true);
            const response = await transactionAPI.getAdminTransactionDetails(transactionId); // Gọi API mới
            if (response.data.success) {
                setSelectedTransaction(response.data.transaction);
                setShowDetailsModal(true);
            } else {
                toast.error('Không thể tải chi tiết giao dịch');
            }
        } catch (error) {
            console.error('Error fetching transaction details:', error);
            toast.error('Không thể tải chi tiết giao dịch');
        } finally {
            setLoading(false);
        }
    };

    // Hàm xử lý khi admin giải quyết tranh chấp (hoàn tiền hoặc giải ngân)
    const handleResolveTransaction = async () => {
        try {
            if (!selectedTransaction) {
                toast.error('Không tìm thấy thông tin giao dịch');
                return;
            }

            setLoading(true);
            
            const response = await transactionAPI.adminResolveTransaction(selectedTransaction._id, {
                newStatus: resolveAction, // 'refunded_to_user' hoặc 'disbursed_to_driver'
                remarks: remarks.trim()
            });

            if (response.data && response.data.message) {
                toast.success(response.data.message);
                setShowResolveModal(false);
                setSelectedTransaction(null);
                setRemarks('');
                setResolveAction('');
                fetchData(); // Tải lại dữ liệu sau khi xử lý
            } else {
                throw new Error(response.data?.message || 'Không thể xử lý giao dịch');
            }
        } catch (error) {
            console.error('Error resolving transaction:', error);
            toast.error(error.response?.data?.message || 'Không thể xử lý giao dịch');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount).replace('₫', 'd');
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('vi-VN');
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'held': return <Badge bg="primary" className="px-3 py-2"><FaClock className="me-1" /> Đang giữ</Badge>;
            case 'commission_collected': return <Badge bg="success" className="px-3 py-2"><FaCheckCircle className="me-1" /> Đã trích hoa hồng</Badge>;
            case 'disbursed_to_driver': return <Badge bg="info" className="px-3 py-2"><FaRegMoneyBillAlt className="me-1" /> Đã giải ngân</Badge>;
            case 'refunded_to_user': return <Badge bg="secondary" className="px-3 py-2"><FaTimesCircle className="me-1" /> Đã hoàn tiền</Badge>;
            case 'disputed': return <Badge bg="danger" className="px-3 py-2"><FaExclamationTriangle className="me-1" /> Tranh chấp</Badge>;
            default: return <Badge bg="secondary" className="px-3 py-2">{status}</Badge>;
        }
    };

    const getTypeBadge = (type) => {
        switch (type) {
            case 'user_payment_held': return <Badge bg="primary">Tiền người dùng</Badge>;
            case 'commission': return <Badge bg="success">Hoa hồng</Badge>;
            case 'payout_to_driver': return <Badge bg="info">Giải ngân</Badge>;
            case 'refund': return <Badge bg="secondary">Hoàn tiền</Badge>;
            default: return <Badge bg="dark">{type}</Badge>;
        }
    };

    return (
        <div className="p-4">
            {/* Stats Cards */}
            <Row className="mb-4 g-3">
                <Col sm={6} md={4} lg>
                    <Card className="h-100 border-0 shadow-sm hover-shadow">
                        <Card.Body className="d-flex align-items-center p-4">
                            <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                                <FaMoneyBillWave className="text-primary fs-3" />
                            </div>
                            <div>
                                <h6 className="text-muted mb-1">Tổng giao dịch</h6>
                                <h4 className="mb-0 fw-bold text-primary">{formatCurrency(stats.totalAmount)}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col sm={6} md={4} lg>
                    <Card className="h-100 border-0 shadow-sm hover-shadow">
                        <Card.Body className="d-flex align-items-center p-4">
                            <div className="rounded-circle bg-info bg-opacity-10 p-3 me-3">
                                <FaClock className="text-info fs-3" />
                            </div>
                            <div>
                                <h6 className="text-muted mb-1">Đang giữ</h6>
                                <h4 className="mb-0 fw-bold text-info">{formatCurrency(stats.heldAmount)}</h4>
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
                                <h6 className="text-muted mb-1">Đã trích hoa hồng</h6>
                                <h4 className="mb-0 fw-bold text-success">{formatCurrency(stats.commissionCollectedAmount)}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col sm={6} md={4} lg>
                    <Card className="h-100 border-0 shadow-sm hover-shadow">
                        <Card.Body className="d-flex align-items-center p-4">
                            <div className="rounded-circle bg-secondary bg-opacity-10 p-3 me-3">
                                <FaRegMoneyBillAlt className="text-secondary fs-3" />
                            </div>
                            <div>
                                <h6 className="text-muted mb-1">Đã giải ngân</h6>
                                <h4 className="mb-0 fw-bold text-secondary">{formatCurrency(stats.payoutDisbursedAmount)}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col sm={6} md={4} lg>
                    <Card className="h-100 border-0 shadow-sm hover-shadow">
                        <Card.Body className="d-flex align-items-center p-4">
                            <div className="rounded-circle bg-danger bg-opacity-10 p-3 me-3">
                                <FaExclamationTriangle className="text-danger fs-3" />
                            </div>
                            <div>
                                <h6 className="text-muted mb-1">Đang tranh chấp</h6>
                                <h4 className="mb-0 fw-bold text-danger">{formatCurrency(stats.disputedAmount)}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col sm={6} md={4} lg>
                    <Card className="h-100 border-0 shadow-sm hover-shadow">
                        <Card.Body className="d-flex align-items-center p-4">
                            <div className="rounded-circle bg-dark bg-opacity-10 p-3 me-3">
                                <FaTimesCircle className="text-dark fs-3" />
                            </div>
                            <div>
                                <h6 className="text-muted mb-1">Đã hoàn tiền</h6>
                                <h4 className="mb-0 fw-bold text-dark">{formatCurrency(stats.refundedAmount)}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Filters */}
            <Card className="mb-4 border-0 shadow-sm">
                <Card.Body className="p-4">
                    <h5 className="mb-4">Bộ lọc tìm kiếm</h5>
                    <Form onSubmit={handleSearch}>
                        <Row className="g-3">
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="text-muted small mb-2">Từ ngày</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="startDate"
                                        value={filters.startDate}
                                        onChange={handleFilterChange}
                                        className="border-0 shadow-sm"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="text-muted small mb-2">Đến ngày</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="endDate"
                                        value={filters.endDate}
                                        onChange={handleFilterChange}
                                        className="border-0 shadow-sm"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="text-muted small mb-2">Trạng thái</Form.Label>
                                    <Form.Select
                                        name="status"
                                        value={filters.status}
                                        onChange={handleFilterChange}
                                        className="border-0 shadow-sm"
                                    >
                                        <option value="">Tất cả</option>
                                        <option value="held">Đang giữ</option>
                                        <option value="commission_collected">Đã trích hoa hồng</option>
                                        <option value="disbursed_to_driver">Đã giải ngân</option>
                                        <option value="refunded_to_user">Đã hoàn tiền</option>
                                        <option value="disputed">Tranh chấp</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="text-muted small mb-2">Loại giao dịch</Form.Label>
                                    <Form.Select
                                        name="type"
                                        value={filters.type}
                                        onChange={handleFilterChange}
                                        className="border-0 shadow-sm"
                                    >
                                        <option value="">Tất cả</option>
                                        <option value="user_payment_held">Tiền người dùng giữ</option>
                                        <option value="commission">Hoa hồng</option>
                                        <option value="payout_to_driver">Giải ngân tài xế</option>
                                        <option value="refund">Hoàn tiền</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="text-muted small mb-2">ID Tài xế</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="driverId"
                                        value={filters.driverId}
                                        onChange={handleFilterChange}
                                        placeholder="Nhập Driver ID..."
                                        className="border-0 shadow-sm"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="text-muted small mb-2">ID Người dùng</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="userId"
                                        value={filters.userId}
                                        onChange={handleFilterChange}
                                        placeholder="Nhập User ID..."
                                        className="border-0 shadow-sm"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={2} className="d-flex align-items-end">
                                <Button 
                                    type="submit" 
                                    variant="primary" 
                                    className="w-100 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                                >
                                    <FaFilter />
                                    <span className="d-none d-lg-inline">Lọc</span>
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {/* Transactions Table */}
            <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                    <h5 className="mb-4">Danh sách giao dịch</h5>
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
                                        <th className="text-nowrap py-3">Mã GD</th>
                                        <th className="text-nowrap py-3">Loại</th>
                                        <th className="text-nowrap py-3">Tài xế</th>
                                        <th className="text-nowrap py-3">Người dùng</th>
                                        <th className="text-end text-nowrap py-3">Số tiền</th>
                                        <th className="text-center text-nowrap py-3">Trạng thái</th>
                                        <th className="text-nowrap py-3">Ngày xử lý</th>
                                        <th className="text-center text-nowrap py-3">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map(trans => (
                                        <tr key={trans._id} className="border-bottom">
                                            <td className="text-primary fw-medium">{trans._id.slice(-6)}</td>
                                            <td>{getTypeBadge(trans.type)}</td>
                                            <td>
                                                {trans.driverId ? (
                                                    <div>
                                                        <div className="fw-medium">{trans.driverId.fullName}</div>
                                                        <small className="text-muted">{trans.driverId.email}</small>
                                                    </div>
                                                ) : (
                                                    'N/A'
                                                )}
                                            </td>
                                            <td>
                                                {trans.userId ? (
                                                    <div>
                                                        <div className="fw-medium">{trans.userId.fullName}</div>
                                                        <small className="text-muted">{trans.userId.email}</small>
                                                    </div>
                                                ) : (
                                                    'N/A'
                                                )}
                                            </td>
                                            <td className="text-end fw-bold">{formatCurrency(trans.amount)}</td>
                                            <td className="text-center">{getStatusBadge(trans.status)}</td>
                                            <td className="text-nowrap">
                                                {trans.processed_at ? (
                                                    <>
                                                        <div className="fw-medium">{new Date(trans.processed_at).toLocaleDateString('vi-VN')}</div>
                                                        <small className="text-muted">{new Date(trans.processed_at).toLocaleTimeString('vi-VN')}</small>
                                                    </>
                                                ) : '-'}
                                            </td>
                                            <td>
                                                <div className="d-flex justify-content-center gap-2">
                                                    <Button
                                                        variant="outline-info"
                                                        size="sm"
                                                        className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
                                                        onClick={() => handleViewDetails(trans._id)}
                                                    >
                                                        <FaEye /> Chi tiết
                                                    </Button>
                                                    {trans.status === 'disputed' && ( // Chỉ cho phép xử lý khi trạng thái là disputed
                                                        <>
                                                            <Button
                                                                variant="outline-success"
                                                                size="sm"
                                                                className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
                                                                onClick={() => {
                                                                    setSelectedTransaction(trans);
                                                                    setResolveAction('disbursed_to_driver'); // Hành động giải ngân cho tài xế
                                                                    setShowResolveModal(true);
                                                                }}
                                                            >
                                                                <FaCheck /> Giải ngân cho TX
                                                            </Button>
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
                                                                onClick={() => {
                                                                    setSelectedTransaction(trans);
                                                                    setResolveAction('refunded_to_user'); // Hành động hoàn tiền cho user
                                                                    setShowResolveModal(true);
                                                                }}
                                                            >
                                                                <FaTimes /> Hoàn tiền cho KH
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {transactions.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="text-center py-5">
                                                <div className="text-muted">
                                                    <FaMoneyBillWave className="fs-1 mb-3 text-muted" />
                                                    <div>Không có dữ liệu giao dịch</div>
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

            {/* Resolve Transaction Modal */}
            <Modal 
                show={showResolveModal} 
                onHide={() => {
                    setShowResolveModal(false);
                    setResolveAction('');
                    setRemarks('');
                }}
                centered
            >
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fs-5">
                        {resolveAction === 'disbursed_to_driver' ? (
                            <span className="text-success">
                                <FaCheckCircle className="me-2" />
                                Giải ngân cho tài xế
                            </span>
                        ) : (
                            <span className="text-danger">
                                <FaTimesCircle className="me-2" />
                                Hoàn tiền cho khách hàng
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
                                <h6 className="mb-1">Thông tin giao dịch</h6>
                                <div className="text-muted small">Mã GD: {selectedTransaction?._id.slice(-6)}</div>
                                <div className="text-muted small">Đơn hàng: {selectedTransaction?.orderId?._id ? selectedTransaction.orderId._id.slice(-6) : 'N/A'}</div>
                            </div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                            <div className="text-muted">Số tiền:</div>
                            <div className="fs-5 fw-bold text-primary">{selectedTransaction ? formatCurrency(selectedTransaction.amount) : ''}</div>
                        </div>
                    </div>

                    <Form.Group className="mb-4">
                        <Form.Label className="text-muted small mb-2">Ghi chú xử lý</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Nhập ghi chú xử lý (nếu có)"
                            className="border-0 shadow-sm"
                        />
                    </Form.Group>

                    <div className="alert alert-warning border-0 rounded-3">
                        <FaHourglassHalf className="me-2" />
                        Bạn có chắc chắn muốn {resolveAction === 'disbursed_to_driver' ? 'giải ngân' : 'hoàn tiền'} cho giao dịch này?
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button 
                        variant="light" 
                        onClick={() => {
                            setShowResolveModal(false);
                            setResolveAction('');
                            setRemarks('');
                        }}
                        className="rounded-pill px-4"
                    >
                        Hủy
                    </Button>
                    <Button
                        variant={resolveAction === 'disbursed_to_driver' ? 'success' : 'danger'}
                        onClick={handleResolveTransaction}
                        disabled={loading}
                        className="rounded-pill px-4"
                    >
                        {resolveAction === 'disbursed_to_driver' ? (
                            <>
                        <FaCheck className="me-2" />
                        Xác nhận giải ngân
                            </>
                        ) : (
                            <>
                        <FaTimes className="me-2" />
                        Xác nhận hoàn tiền
                            </>
                        )}
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
                        Chi tiết Giao dịch
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
                    ) : selectedTransaction ? (
                        <>
                            <div className="alert alert-light border-0 rounded-3 mb-4">
                                <div className="d-flex align-items-center mb-3">
                                    <div className="me-3">
                                        <FaMoneyBillWave className="fs-3 text-primary" />
                                    </div>
                                    <div>
                                        <h6 className="mb-1">Thông tin chung</h6>
                                        <div className="text-muted small">Mã GD: {selectedTransaction._id}</div>
                                    </div>
                                </div>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <div className="text-muted small mb-1">Loại giao dịch</div>
                                        <div>{getTypeBadge(selectedTransaction.type)}</div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="text-muted small mb-1">Số tiền</div>
                                        <div className="fw-bold text-primary">{formatCurrency(selectedTransaction.amount)}</div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="text-muted small mb-1">Trạng thái</div>
                                        <div>{getStatusBadge(selectedTransaction.status)}</div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="text-muted small mb-1">Ngày tạo</div>
                                        <div className="fw-medium">{formatDate(selectedTransaction.createdAt)}</div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="text-muted small mb-1">Tài xế</div>
                                        <div className="fw-medium">
                                            {selectedTransaction.driverId ? (
                                                <>
                                                    {selectedTransaction.driverId.fullName}
                                                    <small className="text-muted d-block">{selectedTransaction.driverId.email}</small>
                                                </>
                                            ) : 'N/A'}
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="text-muted small mb-1">Người dùng</div>
                                        <div className="fw-medium">
                                            {selectedTransaction.userId ? (
                                                <>
                                                    {selectedTransaction.userId.fullName}
                                                    <small className="text-muted d-block">{selectedTransaction.userId.email}</small>
                                                </>
                                            ) : 'N/A'}
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="text-muted small mb-1">Đơn hàng ID</div>
                                        <div className="fw-medium">{selectedTransaction.orderId?._id || 'N/A'}</div>
                                    </Col>
                                    {selectedTransaction.processed_at && (
                                        <Col md={6}>
                                            <div className="text-muted small mb-1">Ngày xử lý</div>
                                            <div className="fw-medium">{formatDate(selectedTransaction.processed_at)}</div>
                                        </Col>
                                    )}
                                </Row>
                                {selectedTransaction.remarks && (
                                    <div className="mt-3 pt-3 border-top">
                                        <div className="text-muted small mb-1">Ghi chú</div>
                                        <div>{selectedTransaction.remarks}</div>
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

export default AdminCommissionManagement;