import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Row, Col, Badge, Modal } from 'react-bootstrap';
import { FaCheck, FaTimes, FaEye } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { transactionAPI } from '../../services/api';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const CommissionManagement = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        startDate: null,
        endDate: null,
        driverId: '',
        status: ''
    });
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [remarks, setRemarks] = useState('');

    // Thống kê
    const [stats, setStats] = useState({
        totalAmount: 0,
        pendingAmount: 0,
        paidAmount: 0,
        confirmedAmount: 0,
        rejectedAmount: 0
    });

    useEffect(() => {
        fetchBills();
    }, [filters]);

    const fetchBills = async () => {
        try {
            setLoading(true);
            const response = await transactionAPI.getAdminBulkBills(filters);
            if (response.data.success) {
                setBills(response.data.bills || []);
                setStats(response.data.stats);
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

    const handleViewDetails = async (bill) => {
        try {
            setLoading(true);
            const response = await transactionAPI.getAdminBulkBillDetails(bill._id);
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

    const handleConfirmPayment = async (billId, status) => {
        try {
            setLoading(true);
            const response = await transactionAPI.adminConfirmBulkPayment(billId, {
                status,
                remarks: remarks
            });
            
            if (response.data.success) {
                toast.success(status === 'confirmed' ? 'Đã xác nhận thanh toán' : 'Đã từ chối thanh toán');
                setShowDetailsModal(false);
                setRemarks('');
                fetchBills();
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
        <div className="container-fluid py-4">
            <h2 className="mb-4">Quản lý hoa hồng</h2>

            {/* Thống kê */}
            <div className="row mb-4">
                <div className="col">
                    <div className="card bg-primary text-white">
                        <div className="card-body">
                            <h6>Tổng tiền</h6>
                            <h4>{formatCurrency(stats.totalAmount)}</h4>
                        </div>
                    </div>
                </div>
                <div className="col">
                    <div className="card bg-warning text-white">
                        <div className="card-body">
                            <h6>Chờ thanh toán</h6>
                            <h4>{formatCurrency(stats.pendingAmount)}</h4>
                        </div>
                    </div>
                </div>
                <div className="col">
                    <div className="card bg-info text-white">
                        <div className="card-body">
                            <h6>Đã thanh toán</h6>
                            <h4>{formatCurrency(stats.paidAmount)}</h4>
                        </div>
                    </div>
                </div>
                <div className="col">
                    <div className="card bg-success text-white">
                        <div className="card-body">
                            <h6>Đã xác nhận</h6>
                            <h4>{formatCurrency(stats.confirmedAmount)}</h4>
                        </div>
                    </div>
                </div>
                <div className="col">
                    <div className="card bg-danger text-white">
                        <div className="card-body">
                            <h6>Đã từ chối</h6>
                            <h4>{formatCurrency(stats.rejectedAmount)}</h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bộ lọc */}
            <div className="card mb-4">
                <div className="card-body">
                    <Row className="align-items-end">
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Từ ngày</Form.Label>
                                <DatePicker
                                    selected={filters.startDate}
                                    onChange={date => setFilters(prev => ({ ...prev, startDate: date }))}
                                    className="form-control"
                                    dateFormat="dd/MM/yyyy"
                                    placeholderText="dd/mm/yyyy"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Đến ngày</Form.Label>
                                <DatePicker
                                    selected={filters.endDate}
                                    onChange={date => setFilters(prev => ({ ...prev, endDate: date }))}
                                    className="form-control"
                                    dateFormat="dd/MM/yyyy"
                                    placeholderText="dd/mm/yyyy"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Tài xế</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Email tài xế"
                                    value={filters.driverId}
                                    onChange={e => setFilters(prev => ({ ...prev, driverId: e.target.value }))}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>Trạng thái</Form.Label>
                                <Form.Select
                                    value={filters.status}
                                    onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                >
                                    <option value="">Tất cả</option>
                                    <option value="pending">Chờ thanh toán</option>
                                    <option value="paid">Đã thanh toán - Chờ xác nhận</option>
                                    <option value="confirmed">Đã xác nhận</option>
                                    <option value="rejected">Đã từ chối</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={1}>
                            <Button variant="primary" onClick={() => fetchBills()}>
                                Lọc
                            </Button>
                        </Col>
                    </Row>
                </div>
            </div>

            {/* Danh sách bills */}
            <div className="card">
                <div className="card-body">
                    <Table responsive>
                        <thead>
                            <tr>
                                <th>Mã bill</th>
                                <th>Tài xế</th>
                                <th>Số tiền</th>
                                <th>Ngày tạo</th>
                                <th>Ngày thanh toán</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bills.map(bill => (
                                <tr key={bill._id}>
                                    <td>{bill._id}</td>
                                    <td>
                                        {bill.driverId?.email}<br />
                                        <small>{bill.driverId?.name}</small>
                                    </td>
                                    <td>{formatCurrency(bill.total_amount)}</td>
                                    <td>{formatDate(bill.createdAt)}</td>
                                    <td>{bill.paid_at ? formatDate(bill.paid_at) : '-'}</td>
                                    <td>{getStatusBadge(bill.status)}</td>
                                    <td>
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => handleViewDetails(bill)}
                                            className="me-2"
                                        >
                                            <FaEye /> Chi tiết
                                        </Button>
                                        {bill.status === 'paid' && (
                                            <>
                                                <Button
                                                    variant="outline-success"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedBill(bill);
                                                        setShowDetailsModal(true);
                                                    }}
                                                    className="me-2"
                                                >
                                                    <FaCheck /> Xác nhận
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedBill(bill);
                                                        setShowDetailsModal(true);
                                                    }}
                                                >
                                                    <FaTimes /> Từ chối
                                                </Button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            </div>

            {/* Modal chi tiết */}
            <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết bill</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedBill && (
                        <>
                            <div className="mb-3">
                                <h5>Thông tin chung</h5>
                                <p>
                                    <strong>Mã bill:</strong> {selectedBill._id}<br />
                                    <strong>Tài xế:</strong> {selectedBill.driverId?.email} ({selectedBill.driverId?.name})<br />
                                    <strong>Tổng tiền:</strong> {formatCurrency(selectedBill.total_amount)}<br />
                                    <strong>Trạng thái:</strong> {getStatusBadge(selectedBill.status)}<br />
                                    <strong>Ngày tạo:</strong> {formatDate(selectedBill.createdAt)}<br />
                                    {selectedBill.paid_at && <><strong>Ngày thanh toán:</strong> {formatDate(selectedBill.paid_at)}<br /></>}
                                    {selectedBill.confirmed_at && <><strong>Ngày xác nhận:</strong> {formatDate(selectedBill.confirmed_at)}<br /></>}
                                    {selectedBill.remarks && <><strong>Ghi chú:</strong> {selectedBill.remarks}<br /></>}
                                </p>
                            </div>

                            {selectedBill.status === 'paid' && (
                                <div className="mb-3">
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
                                </div>
                            )}

                            <div className="mb-3">
                                <h5>Danh sách giao dịch</h5>
                                <Table responsive>
                                    <thead>
                                        <tr>
                                            <th>Mã giao dịch</th>
                                            <th>Số tiền</th>
                                            <th>Ngày tạo</th>
                                            <th>Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedBill.transactions?.map(transaction => (
                                            <tr key={transaction._id}>
                                                <td>{transaction._id}</td>
                                                <td>{formatCurrency(transaction.amount)}</td>
                                                <td>{formatDate(transaction.createdAt)}</td>
                                                <td>{getStatusBadge(transaction.status)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    {selectedBill?.status === 'paid' && (
                        <>
                            <Button
                                variant="success"
                                onClick={() => handleConfirmPayment(selectedBill._id, 'confirmed')}
                            >
                                <FaCheck /> Xác nhận thanh toán
                            </Button>
                            <Button
                                variant="danger"
                                onClick={() => handleConfirmPayment(selectedBill._id, 'rejected')}
                            >
                                <FaTimes /> Từ chối thanh toán
                            </Button>
                        </>
                    )}
                    <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
                        Đóng
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default CommissionManagement; 