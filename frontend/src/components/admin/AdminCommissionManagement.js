import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { transactionAPI } from '../../services/api';
import { format } from 'date-fns';
import { Table, Form, Button, Row, Col, Card, Badge, Modal } from 'react-bootstrap';
import { FaCheck, FaTimes, FaFilter, FaEye, FaMoneyBillWave, FaClock, FaCheckCircle, FaTimesCircle, FaHourglassHalf } from 'react-icons/fa';

const AdminCommissionManagement = () => {
    const [bills, setBills] = useState([]);
    const [stats, setStats] = useState({
        totalAmount: 0,
        pendingAmount: 0,
        paidAmount: 0,
        confirmedAmount: 0,
        rejectedAmount: 0
    });
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        driverName: '',
        status: ''
    });
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [remarks, setRemarks] = useState('');
    const [confirmAction, setConfirmAction] = useState('');

    useEffect(() => {
        fetchData();
    }, [filters]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await transactionAPI.getAdminBulkBills(filters);
            if (response.data.success) {
                setBills(response.data.bills || []);
                setStats(response.data.stats || {});
            } else {
                toast.error('Không thể tải danh sách bill');
            }
        } catch (error) {
            console.error('Error fetching bills:', error);
            toast.error('Không thể tải danh sách bill');
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

    const handleViewDetails = async (billId) => {
        try {
            setLoading(true);
            const response = await transactionAPI.getAdminBulkBillDetails(billId);
            if (response.data.success) {
                setSelectedBill(response.data.bill);
                setShowDetailsModal(true);
            } else {
                toast.error('Không thể tải chi tiết bill');
            }
        } catch (error) {
            console.error('Error fetching bill details:', error);
            toast.error('Không thể tải chi tiết bill');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmPayment = async (status) => {
        try {
            if (!selectedBill) {
                toast.error('Không tìm thấy thông tin bill');
                return;
            }

            setLoading(true);
            console.log('Confirming payment:', {
                billId: selectedBill._id,
                status,
                remarks
            });
            
            const response = await transactionAPI.adminConfirmBulkPayment(selectedBill._id, {
                status,
                remarks: remarks.trim()
            });

            if (response.data && response.data.success) {
                toast.success(status === 'confirmed' ? 'Đã xác nhận thanh toán' : 'Đã từ chối thanh toán');
                setShowConfirmModal(false);
                setSelectedBill(null);
                setRemarks('');
                fetchData();
            } else {
                throw new Error(response.data?.message || 'Không thể xác nhận thanh toán');
            }
        } catch (error) {
            console.error('Error confirming payment:', error);
            toast.error(error.response?.data?.message || 'Không thể xác nhận thanh toán');
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
        return new Date(dateString).toLocaleString('vi-VN');
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return <Badge bg="warning" className="px-3 py-2"><FaClock className="me-1" /> Chờ thanh toán</Badge>;
            case 'paid':
                return <Badge bg="info" className="px-3 py-2"><FaHourglassHalf className="me-1" /> Đã thanh toán - Chờ xác nhận</Badge>;
            case 'confirmed':
                return <Badge bg="success" className="px-3 py-2"><FaCheckCircle className="me-1" /> Đã xác nhận</Badge>;
            case 'rejected':
                return <Badge bg="danger" className="px-3 py-2"><FaTimesCircle className="me-1" /> Đã từ chối</Badge>;
            default:
                return <Badge bg="secondary" className="px-3 py-2">{status}</Badge>;
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
                                <h6 className="text-muted mb-1">Tổng hoa hồng</h6>
                                <h4 className="mb-0 fw-bold text-primary">{formatCurrency(stats.totalAmount)}</h4>
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
                                <h6 className="text-muted mb-1">Chờ thanh toán</h6>
                                <h4 className="mb-0 fw-bold text-warning">{formatCurrency(stats.pendingAmount)}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col sm={6} md={4} lg>
                    <Card className="h-100 border-0 shadow-sm hover-shadow">
                        <Card.Body className="d-flex align-items-center p-4">
                            <div className="rounded-circle bg-info bg-opacity-10 p-3 me-3">
                                <FaHourglassHalf className="text-info fs-3" />
                            </div>
                            <div>
                                <h6 className="text-muted mb-1">Chờ xác nhận</h6>
                                <h4 className="mb-0 fw-bold text-info">{formatCurrency(stats.paidAmount)}</h4>
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
                                <h6 className="text-muted mb-1">Đã xác nhận</h6>
                                <h4 className="mb-0 fw-bold text-success">{formatCurrency(stats.confirmedAmount)}</h4>
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
                                <h6 className="text-muted mb-1">Đã từ chối</h6>
                                <h4 className="mb-0 fw-bold text-danger">{formatCurrency(stats.rejectedAmount)}</h4>
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
                            <Col md={2}>
                                <Form.Group>
                                    <Form.Label className="text-muted small mb-2">Trạng thái</Form.Label>
                                    <Form.Select
                                        name="status"
                                        value={filters.status}
                                        onChange={handleFilterChange}
                                        className="border-0 shadow-sm"
                                    >
                                        <option value="">Tất cả</option>
                                        <option value="pending">Chờ thanh toán</option>
                                        <option value="paid">Chờ xác nhận</option>
                                        <option value="confirmed">Đã xác nhận</option>
                                        <option value="rejected">Đã từ chối</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="text-muted small mb-2">Tên tài xế</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="driverName"
                                        value={filters.driverName}
                                        onChange={handleFilterChange}
                                        placeholder="Nhập tên tài xế..."
                                        className="border-0 shadow-sm"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={1} className="d-flex align-items-end">
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

            {/* Bills Table */}
            <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                    <h5 className="mb-4">Danh sách hóa đơn</h5>
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
                                        <th className="text-nowrap py-3">Mã Bill</th>
                                        <th className="text-nowrap py-3">Tài xế</th>
                                        <th className="text-center text-nowrap py-3">Số giao dịch</th>
                                        <th className="text-end text-nowrap py-3">Tổng tiền</th>
                                        <th className="text-center text-nowrap py-3">Trạng thái</th>
                                        <th className="text-nowrap py-3">Ngày tạo</th>
                                        <th className="text-nowrap py-3">Ngày thanh toán</th>
                                        <th className="text-center text-nowrap py-3">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bills.map(bill => (
                                        <tr key={bill._id} className="border-bottom">
                                            <td className="text-primary fw-medium">{bill._id}</td>
                                            <td>
                                                {bill.driverId ? (
                                                    <div>
                                                        <div className="fw-medium">{bill.driverId.fullName}</div>
                                                        <small className="text-muted">{bill.driverId.email}</small>
                                                    </div>
                                                ) : (
                                                    'N/A'
                                                )}
                                            </td>
                                            <td className="text-center fw-medium">{bill.transactions?.length || 0}</td>
                                            <td className="text-end fw-bold">{formatCurrency(bill.total_amount)}</td>
                                            <td className="text-center">{getStatusBadge(bill.status)}</td>
                                            <td className="text-nowrap">
                                                <div className="fw-medium">{new Date(bill.createdAt).toLocaleDateString('vi-VN')}</div>
                                                <small className="text-muted">{new Date(bill.createdAt).toLocaleTimeString('vi-VN')}</small>
                                            </td>
                                            <td className="text-nowrap">
                                                {bill.paid_at ? (
                                                    <>
                                                        <div className="fw-medium">{new Date(bill.paid_at).toLocaleDateString('vi-VN')}</div>
                                                        <small className="text-muted">{new Date(bill.paid_at).toLocaleTimeString('vi-VN')}</small>
                                                    </>
                                                ) : '-'}
                                            </td>
                                            <td>
                                                <div className="d-flex justify-content-center gap-2">
                                                    <Button
                                                        variant="outline-info"
                                                        size="sm"
                                                        className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
                                                        onClick={() => handleViewDetails(bill._id)}
                                                    >
                                                        <FaEye /> Chi tiết
                                                    </Button>
                                                    {bill.status === 'paid' && (
                                                        <>
                                                            <Button
                                                                variant="outline-success"
                                                                size="sm"
                                                                className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
                                                                onClick={() => {
                                                                    setSelectedBill(bill);
                                                                    setConfirmAction('confirm');
                                                                    setShowConfirmModal(true);
                                                                }}
                                                            >
                                                                <FaCheck /> Xác nhận
                                                            </Button>
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
                                                                onClick={() => {
                                                                    setSelectedBill(bill);
                                                                    setConfirmAction('reject');
                                                                    setShowConfirmModal(true);
                                                                }}
                                                            >
                                                                <FaTimes /> Từ chối
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {bills.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="text-center py-5">
                                                <div className="text-muted">
                                                    <FaMoneyBillWave className="fs-1 mb-3 text-muted" />
                                                    <div>Không có dữ liệu</div>
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
                        {confirmAction === 'confirm' ? (
                            <span className="text-success">
                                <FaCheckCircle className="me-2" />
                                Xác nhận thanh toán
                            </span>
                        ) : (
                            <span className="text-danger">
                                <FaTimesCircle className="me-2" />
                                Từ chối thanh toán
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
                                <h6 className="mb-1">Thông tin thanh toán</h6>
                                <div className="text-muted small">Mã bill: {selectedBill?._id}</div>
                            </div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                            <div className="text-muted">Tổng tiền:</div>
                            <div className="fs-5 fw-bold text-primary">{selectedBill ? formatCurrency(selectedBill.total_amount) : ''}</div>
                        </div>
                    </div>

                    <Form.Group className="mb-4">
                        <Form.Label className="text-muted small mb-2">Ghi chú</Form.Label>
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
                        Bạn có chắc chắn muốn {confirmAction === 'confirm' ? 'xác nhận' : 'từ chối'} thanh toán cho bill này?
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
                        variant={confirmAction === 'confirm' ? 'success' : 'danger'}
                        onClick={() => handleConfirmPayment(confirmAction === 'confirm' ? 'confirmed' : 'rejected')}
                        disabled={loading}
                        className="rounded-pill px-4"
                    >
                        {confirmAction === 'confirm' ? (
                            <>
                        <FaCheck className="me-2" />
                        Xác nhận
                            </>
                        ) : (
                            <>
                        <FaTimes className="me-2" />
                        Từ chối
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
                        Chi tiết Bill
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
                                        <div className="text-muted small mb-1">Tài xế</div>
                                        <div className="fw-medium">
                                            {selectedBill.driverId ? (
                                        <>
                                            {selectedBill.driverId.fullName}
                                            <small className="text-muted d-block">{selectedBill.driverId.email}</small>
                                        </>
                                            ) : 'N/A'}
                                        </div>
                                    </Col>
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
                                    {selectedBill.confirmed_at && (
                                        <Col md={6}>
                                            <div className="text-muted small mb-1">Ngày xác nhận</div>
                                            <div className="fw-medium">{formatDate(selectedBill.confirmed_at)}</div>
                                        </Col>
                                    )}
                                </Row>
                                {selectedBill.remarks && (
                                    <div className="mt-3 pt-3 border-top">
                                        <div className="text-muted small mb-1">Ghi chú</div>
                                        <div>{selectedBill.remarks}</div>
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

export default AdminCommissionManagement; 