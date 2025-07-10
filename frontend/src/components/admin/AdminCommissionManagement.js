import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { transactionAPI } from '../../services/api';
import { format } from 'date-fns';
import { Table, Form, Button, Row, Col, Card, Badge, Modal } from 'react-bootstrap';
import { FaCheck, FaTimes, FaFilter, FaEye } from 'react-icons/fa';

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
            setLoading(true);
            const response = await transactionAPI.adminConfirmBulkPayment(selectedBill._id, {
                status,
                remarks
            });
            if (response.data.success) {
                toast.success(status === 'confirmed' ? 'Đã xác nhận thanh toán' : 'Đã từ chối thanh toán');
                setShowConfirmModal(false);
                setSelectedBill(null);
                setRemarks('');
                fetchData();
            } else {
                toast.error('Không thể xác nhận thanh toán');
            }
        } catch (error) {
            console.error('Error confirming payment:', error);
            toast.error('Không thể xác nhận thanh toán');
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
                return <Badge bg="warning">Chờ thanh toán</Badge>;
            case 'paid':
                return <Badge bg="info">Đã thanh toán - Chờ xác nhận</Badge>;
            case 'confirmed':
                return <Badge bg="success">Đã xác nhận</Badge>;
            case 'rejected':
                return <Badge bg="danger">Đã từ chối</Badge>;
            default:
                return <Badge bg="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="p-4">
            {/* Stats Cards */}
            <Row className="mb-4 g-3">
                <Col sm={6} md={4} lg>
                    <Card className="h-100 bg-primary bg-gradient text-white">
                        <Card.Body className="text-center p-3">
                            <h6 className="mb-2">Tổng hoa hồng</h6>
                            <h4 className="mb-0">{formatCurrency(stats.totalAmount)}</h4>
                        </Card.Body>
                    </Card>
                </Col>
                <Col sm={6} md={4} lg>
                    <Card className="h-100 bg-warning bg-gradient text-white">
                        <Card.Body className="text-center p-3">
                            <h6 className="mb-2">Chờ thanh toán</h6>
                            <h4 className="mb-0">{formatCurrency(stats.pendingAmount)}</h4>
                        </Card.Body>
                    </Card>
                </Col>
                <Col sm={6} md={4} lg>
                    <Card className="h-100 bg-info bg-gradient text-white">
                        <Card.Body className="text-center p-3">
                            <h6 className="mb-2">Chờ xác nhận</h6>
                            <h4 className="mb-0">{formatCurrency(stats.paidAmount)}</h4>
                        </Card.Body>
                    </Card>
                </Col>
                <Col sm={6} md={4} lg>
                    <Card className="h-100 bg-success bg-gradient text-white">
                        <Card.Body className="text-center p-3">
                            <h6 className="mb-2">Đã xác nhận</h6>
                            <h4 className="mb-0">{formatCurrency(stats.confirmedAmount)}</h4>
                        </Card.Body>
                    </Card>
                </Col>
                <Col sm={6} md={4} lg>
                    <Card className="h-100 bg-danger bg-gradient text-white">
                        <Card.Body className="text-center p-3">
                            <h6 className="mb-2">Đã từ chối</h6>
                            <h4 className="mb-0">{formatCurrency(stats.rejectedAmount)}</h4>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Filters */}
            <Card className="mb-4 shadow-sm">
                <Card.Body>
                    <Form onSubmit={handleSearch}>
                        <Row className="g-3">
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="fw-bold">Từ ngày</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="startDate"
                                        value={filters.startDate}
                                        onChange={handleFilterChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="fw-bold">Đến ngày</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="endDate"
                                        value={filters.endDate}
                                        onChange={handleFilterChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group>
                                    <Form.Label className="fw-bold">Trạng thái</Form.Label>
                                    <Form.Select
                                        name="status"
                                        value={filters.status}
                                        onChange={handleFilterChange}
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
                                    <Form.Label className="fw-bold">Tên tài xế</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="driverName"
                                        value={filters.driverName}
                                        onChange={handleFilterChange}
                                        placeholder="Nhập tên tài xế..."
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={1} className="d-flex align-items-end">
                                <Button type="submit" variant="primary" className="w-100">
                                    <FaFilter />
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {/* Bills Table */}
            <Card className="shadow-sm">
                <Card.Body>
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover className="align-middle">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="text-nowrap">Mã Bill</th>
                                        <th className="text-nowrap">Tài xế</th>
                                        <th className="text-center text-nowrap">Số giao dịch</th>
                                        <th className="text-end text-nowrap">Tổng tiền</th>
                                        <th className="text-center text-nowrap">Trạng thái</th>
                                        <th className="text-nowrap">Ngày tạo</th>
                                        <th className="text-nowrap">Ngày thanh toán</th>
                                        <th className="text-center text-nowrap">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bills.map(bill => (
                                        <tr key={bill._id}>
                                            <td className="text-primary small">{bill._id}</td>
                                            <td>
                                                {bill.driverId ? (
                                                    <div>
                                                        <div>{bill.driverId.fullName}</div>
                                                        <small className="text-muted">{bill.driverId.email}</small>
                                                    </div>
                                                ) : (
                                                    'N/A'
                                                )}
                                            </td>
                                            <td className="text-center">{bill.transactions?.length || 0}</td>
                                            <td className="text-end fw-bold">{formatCurrency(bill.total_amount)}</td>
                                            <td className="text-center">{getStatusBadge(bill.status)}</td>
                                            <td className="text-nowrap">
                                                <div>{new Date(bill.createdAt).toLocaleDateString('vi-VN')}</div>
                                                <small className="text-muted">{new Date(bill.createdAt).toLocaleTimeString('vi-VN')}</small>
                                            </td>
                                            <td className="text-nowrap">
                                                {bill.paid_at ? (
                                                    <>
                                                        <div>{new Date(bill.paid_at).toLocaleDateString('vi-VN')}</div>
                                                        <small className="text-muted">{new Date(bill.paid_at).toLocaleTimeString('vi-VN')}</small>
                                                    </>
                                                ) : '-'}
                                            </td>
                                            <td>
                                                <div className="d-flex justify-content-center gap-2">
                                                    <Button
                                                        variant="info"
                                                        size="sm"
                                                        onClick={() => handleViewDetails(bill._id)}
                                                        title="Xem chi tiết"
                                                    >
                                                        <FaEye />
                                                    </Button>
                                                    {bill.status === 'paid' && (
                                                        <>
                                                            <Button
                                                                variant="success"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedBill(bill);
                                                                    setShowConfirmModal(true);
                                                                }}
                                                                title="Xác nhận thanh toán"
                                                            >
                                                                <FaCheck />
                                                            </Button>
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedBill(bill);
                                                                    setShowConfirmModal(true);
                                                                }}
                                                                title="Từ chối thanh toán"
                                                            >
                                                                <FaTimes />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {bills.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="text-center py-4">
                                                <div className="text-muted">Không có dữ liệu</div>
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
            <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Xác nhận thanh toán</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Bạn có chắc chắn muốn xác nhận thanh toán cho bill này?</p>
                    <Form.Group>
                        <Form.Label>Ghi chú</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Nhập ghi chú (nếu có)"
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
                        Hủy
                    </Button>
                    <Button
                        variant="success"
                        onClick={() => handleConfirmPayment('confirmed')}
                        disabled={loading}
                    >
                        <FaCheck className="me-2" />
                        Xác nhận
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => handleConfirmPayment('rejected')}
                        disabled={loading}
                    >
                        <FaTimes className="me-2" />
                        Từ chối
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Details Modal */}
            <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết Bill</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loading ? (
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
                                    <strong>Tài xế:</strong> {selectedBill.driverId ? (
                                        <>
                                            {selectedBill.driverId.fullName}
                                            <small className="text-muted d-block">{selectedBill.driverId.email}</small>
                                        </>
                                    ) : 'N/A'}<br />
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

export default AdminCommissionManagement; 