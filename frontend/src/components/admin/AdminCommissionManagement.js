import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import { format } from 'date-fns';
import { Table, Form, Button, Row, Col, Card, Badge, Modal } from 'react-bootstrap';
import { FaCheck, FaTimes, FaFilter } from 'react-icons/fa';

const AdminCommissionManagement = () => {
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState({
        totalCommission: 0,
        pendingAmount: 0,
        paidAmount: 0,
        confirmedAmount: 0,
        rejectedAmount: 0,
        pendingCount: 0,
        paidCount: 0,
        confirmedCount: 0,
        rejectedCount: 0
    });
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        driverId: '',
        status: '',
        searchQuery: ''
    });
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    useEffect(() => {
        fetchData();
        fetchDrivers();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getCommissions(filters);
            if (response.data) {
                setTransactions(response.data.transactions || []);
                setStats({
                    totalCommission: response.data.stats.totalCommission || 0,
                    pendingAmount: response.data.stats.pendingAmount || 0,
                    paidAmount: response.data.stats.paidAmount || 0,
                    confirmedAmount: response.data.stats.confirmedAmount || 0,
                    rejectedAmount: response.data.stats.rejectedAmount || 0,
                    pendingCount: response.data.stats.pendingCount || 0,
                    paidCount: response.data.stats.paidCount || 0,
                    confirmedCount: response.data.stats.confirmedCount || 0,
                    rejectedCount: response.data.stats.rejectedCount || 0
                });
            }
        } catch (error) {
            console.error('Error fetching commission data:', error);
            toast.error('Không thể tải dữ liệu hoa hồng');
        } finally {
            setLoading(false);
        }
    };

    const fetchDrivers = async () => {
        try {
            const response = await adminAPI.getDrivers();
            if (response.data) {
                setDrivers(response.data.drivers || []);
            }
        } catch (error) {
            console.error('Error fetching drivers:', error);
            toast.error('Không thể tải danh sách tài xế');
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

    const handleConfirmPayment = async (status) => {
        try {
            setLoading(true);
            await adminAPI.confirmCommissionPayment(selectedTransaction._id, {
                status,
                remarks: status === 'confirmed' ? 'Đã xác nhận thanh toán' : 'Đã từ chối thanh toán'
            });
            setShowConfirmModal(false);
            toast.success(status === 'confirmed' ? 'Đã xác nhận thanh toán' : 'Đã từ chối thanh toán');
            fetchData(); // Refresh data after confirmation
        } catch (error) {
            console.error('Error confirming payment:', error);
            toast.error('Lỗi khi xác nhận thanh toán: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '-';
            return format(date, 'HH:mm:ss dd/MM/yyyy');
        } catch (error) {
            console.error('Error formatting date:', error);
            return '-';
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: <Badge bg="warning">Chờ thanh toán</Badge>,
            paid: <Badge bg="info">Đã thanh toán - Chờ xác nhận</Badge>,
            confirmed: <Badge bg="success">Đã xác nhận</Badge>,
            rejected: <Badge bg="danger">Đã từ chối</Badge>
        };
        return badges[status] || <Badge bg="secondary">{status}</Badge>;
    };

    if (loading) {
        return <div className="text-center p-5">Đang tải dữ liệu...</div>;
    }

    return (
        <div className="p-4">
            {/* Stats Cards */}
            <Row className="mb-3">
                <Col>
                    <Card className="bg-primary text-white">
                        <Card.Body className="text-center p-2">
                            <div>Tổng hoa hồng</div>
                            <h5 className="mb-0">{formatCurrency(stats.totalCommission)}</h5>
                        </Card.Body>
                    </Card>
                </Col>
                <Col>
                    <Card className="bg-warning text-white">
                        <Card.Body className="text-center p-2">
                            <div>Chờ thanh toán</div>
                            <h5 className="mb-0">{formatCurrency(stats.pendingAmount)}</h5>
                        </Card.Body>
                    </Card>
                </Col>
                <Col>
                    <Card className="bg-info text-white">
                        <Card.Body className="text-center p-2">
                            <div>Chờ xác nhận</div>
                            <h5 className="mb-0">{formatCurrency(stats.paidAmount)}</h5>
                        </Card.Body>
                    </Card>
                </Col>
                <Col>
                    <Card className="bg-success text-white">
                        <Card.Body className="text-center p-2">
                            <div>Đã xác nhận</div>
                            <h5 className="mb-0">{formatCurrency(stats.confirmedAmount)}</h5>
                        </Card.Body>
                    </Card>
                </Col>
                <Col>
                    <Card className="bg-danger text-white">
                        <Card.Body className="text-center p-2">
                            <div>Đã từ chối</div>
                            <h5 className="mb-0">{formatCurrency(stats.rejectedAmount)}</h5>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Filters */}
            <Card className="mb-3">
                <Card.Body className="p-2">
                    <Form onSubmit={handleSearch}>
                        <Row className="g-2">
                            <Col md={2}>
                                <Form.Group>
                                    <Form.Label className="small mb-1">Từ ngày</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="startDate"
                                        size="sm"
                                        value={filters.startDate}
                                        onChange={handleFilterChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group>
                                    <Form.Label className="small mb-1">Đến ngày</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="endDate"
                                        size="sm"
                                        value={filters.endDate}
                                        onChange={handleFilterChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="small mb-1">Tài xế</Form.Label>
                                    <Form.Select
                                        name="driverId"
                                        size="sm"
                                        value={filters.driverId}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="">Tất cả</option>
                                        {drivers.map(driver => (
                                            <option key={driver._id} value={driver._id}>
                                                {driver.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="small mb-1">Trạng thái</Form.Label>
                                    <Form.Select
                                        name="status"
                                        size="sm"
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
                            <Col md={2} className="d-flex align-items-end">
                                <Button type="submit" variant="primary" size="sm" className="w-100">
                                    <FaFilter className="me-1" /> Lọc
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {/* Transactions Table */}
            <Card>
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover className="table-sm align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="px-3">Mã giao dịch</th>
                                    <th>Tài xế</th>
                                    <th>Số tiền</th>
                                    <th>Ngày tạo</th>
                                    <th>Ngày thanh toán</th>
                                    <th>Trạng thái</th>
                                    <th className="text-end pe-3">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions && transactions.length > 0 ? (
                                    transactions.map(transaction => (
                                        <tr key={transaction._id}>
                                            <td className="px-3 text-primary small">
                                                {transaction._id}
                                            </td>
                                            <td>
                                                <div>{transaction.driverDetails.name}</div>
                                                <small className="text-muted">{transaction.driverDetails.email}</small>
                                            </td>
                                            <td>{formatCurrency(transaction.amount)}</td>
                                            <td>
                                                <div>{formatDate(transaction.createdAt).split(' ')[1]}</div>
                                                <small className="text-muted">{formatDate(transaction.createdAt).split(' ')[0]}</small>
                                            </td>
                                            <td>
                                                {transaction.paid_at ? (
                                                    <>
                                                        <div>{formatDate(transaction.paid_at).split(' ')[1]}</div>
                                                        <small className="text-muted">{formatDate(transaction.paid_at).split(' ')[0]}</small>
                                                    </>
                                                ) : '-'}
                                            </td>
                                            <td>{getStatusBadge(transaction.status)}</td>
                                            <td className="text-end pe-3">
                                                {transaction.status === 'paid' && (
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedTransaction(transaction);
                                                            setShowConfirmModal(true);
                                                        }}
                                                    >
                                                        Xác nhận
                                                    </Button>
                                                )}
                                                {(transaction.status === 'confirmed' || transaction.status === 'rejected') && (
                                                    <>
                                                        <div>{formatDate(transaction.confirmed_at).split(' ')[1]}</div>
                                                        <small className="text-muted">{formatDate(transaction.confirmed_at).split(' ')[0]}</small>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center py-3">
                                            Không có giao dịch nào
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Confirm Modal */}
            <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Xác nhận thanh toán</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Xác nhận thanh toán cho giao dịch: {selectedTransaction?._id}</p>
                    <p>Số tiền: {selectedTransaction && formatCurrency(selectedTransaction.amount)}</p>
                    <p>Tài xế: {selectedTransaction?.driverDetails.name}</p>
                    <p>Ngày thanh toán: {selectedTransaction?.paid_at && formatDate(selectedTransaction.paid_at)}</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
                        Đóng
                    </Button>
                    <Button variant="success" onClick={() => handleConfirmPayment('confirmed')}>
                        <FaCheck className="me-2" />
                        Xác nhận đã thanh toán
                    </Button>
                    <Button variant="danger" onClick={() => handleConfirmPayment('rejected')}>
                        <FaTimes className="me-2" />
                        Từ chối thanh toán
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default AdminCommissionManagement; 