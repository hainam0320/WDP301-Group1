import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Alert, Badge } from 'react-bootstrap';
import { FaCheck, FaTimes, FaEye } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { transactionAPI } from '../../services/api';

const BulkBillManagement = () => {
    const [bills, setBills] = useState([]);
    const [selectedBill, setSelectedBill] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [confirmStatus, setConfirmStatus] = useState('confirmed');
    const [remarks, setRemarks] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchBills();
    }, []);

    const fetchBills = async () => {
        try {
            setIsLoading(true);
            setError('');
            const response = await transactionAPI.getBulkBills();
            setBills(response.data.bills || []);
        } catch (err) {
            console.error('Error fetching bulk bills:', err);
            setError('Không thể tải danh sách bill. Vui lòng thử lại sau.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = async () => {
        try {
            setIsLoading(true);
            setError('');

            await transactionAPI.adminConfirmBulkPayment(selectedBill._id, {
                status: confirmStatus,
                remarks: remarks
            });

            toast.success(
                confirmStatus === 'confirmed' 
                    ? 'Đã xác nhận thanh toán thành công!' 
                    : 'Đã từ chối thanh toán!'
            );

            setShowConfirmModal(false);
            setSelectedBill(null);
            setRemarks('');
            fetchBills();
        } catch (err) {
            console.error('Error confirming bulk payment:', err);
            setError('Không thể xác nhận thanh toán. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
            .format(amount)
            .replace('₫', 'đ');
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('vi-VN');
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'pending': { variant: 'warning', text: 'Chờ thanh toán' },
            'paid': { variant: 'info', text: 'Đã thanh toán' },
            'confirmed': { variant: 'success', text: 'Đã xác nhận' },
            'rejected': { variant: 'danger', text: 'Đã từ chối' }
        };

        const statusInfo = statusMap[status] || { variant: 'secondary', text: status };
        return <Badge bg={statusInfo.variant}>{statusInfo.text}</Badge>;
    };

    return (
        <div className="container py-4">
            <h2 className="mb-4">Quản lý Bill Tổng</h2>

            {error && <Alert variant="danger">{error}</Alert>}

            <div className="card">
                <div className="card-body p-0">
                    <Table className="mb-0">
                        <thead>
                            <tr>
                                <th>Mã Bill</th>
                                <th>Tài xế</th>
                                <th>Số giao dịch</th>
                                <th>Tổng tiền</th>
                                <th>Trạng thái</th>
                                <th>Ngày tạo</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bills.map(bill => (
                                <tr key={bill._id}>
                                    <td>{bill._id}</td>
                                    <td>{bill.driverId.fullName}</td>
                                    <td>{bill.transactions.length}</td>
                                    <td>{formatCurrency(bill.total_amount)}</td>
                                    <td>{getStatusBadge(bill.status)}</td>
                                    <td>{formatDate(bill.createdAt)}</td>
                                    <td>
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            className="me-2"
                                            onClick={() => {
                                                setSelectedBill(bill);
                                                setShowDetailsModal(true);
                                            }}
                                        >
                                            <FaEye />
                                        </Button>
                                        {bill.status === 'paid' && (
                                            <>
                                                <Button
                                                    variant="outline-success"
                                                    size="sm"
                                                    className="me-2"
                                                    onClick={() => {
                                                        setSelectedBill(bill);
                                                        setConfirmStatus('confirmed');
                                                        setShowConfirmModal(true);
                                                    }}
                                                >
                                                    <FaCheck />
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedBill(bill);
                                                        setConfirmStatus('rejected');
                                                        setShowConfirmModal(true);
                                                    }}
                                                >
                                                    <FaTimes />
                                                </Button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {bills.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-3">
                                        Không có bill nào
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
            </div>

            {/* Chi tiết Bill Modal */}
            <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết Bill</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedBill && (
                        <>
                            <div className="mb-4">
                                <h5>Thông tin chung</h5>
                                <Table>
                                    <tbody>
                                        <tr>
                                            <td><strong>Mã Bill:</strong></td>
                                            <td>{selectedBill._id}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Tài xế:</strong></td>
                                            <td>{selectedBill.driverId.fullName}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Tổng tiền:</strong></td>
                                            <td>{formatCurrency(selectedBill.total_amount)}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Trạng thái:</strong></td>
                                            <td>{getStatusBadge(selectedBill.status)}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Ngày tạo:</strong></td>
                                            <td>{formatDate(selectedBill.createdAt)}</td>
                                        </tr>
                                        {selectedBill.confirmed_at && (
                                            <tr>
                                                <td><strong>Ngày xác nhận:</strong></td>
                                                <td>{formatDate(selectedBill.confirmed_at)}</td>
                                            </tr>
                                        )}
                                        {selectedBill.remarks && (
                                            <tr>
                                                <td><strong>Ghi chú:</strong></td>
                                                <td>{selectedBill.remarks}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>

                            <h5>Danh sách giao dịch</h5>
                            <Table>
                                <thead>
                                    <tr>
                                        <th>Mã giao dịch</th>
                                        <th>Số tiền</th>
                                        <th>Trạng thái</th>
                                        <th>Ngày tạo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedBill.transactions.map(transaction => (
                                        <tr key={transaction._id}>
                                            <td>{transaction._id}</td>
                                            <td>{formatCurrency(transaction.amount)}</td>
                                            <td>{getStatusBadge(transaction.status)}</td>
                                            <td>{formatDate(transaction.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </>
                    )}
                </Modal.Body>
            </Modal>

            {/* Xác nhận Modal */}
            <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {confirmStatus === 'confirmed' ? 'Xác nhận thanh toán' : 'Từ chối thanh toán'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        Bạn có chắc chắn muốn {confirmStatus === 'confirmed' ? 'xác nhận' : 'từ chối'} thanh toán cho bill này?
                    </p>
                    <Form.Group className="mb-3">
                        <Form.Label>Ghi chú</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Nhập ghi chú (không bắt buộc)"
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
                        Hủy
                    </Button>
                    <Button
                        variant={confirmStatus === 'confirmed' ? 'success' : 'danger'}
                        onClick={handleConfirm}
                        disabled={isLoading}
                    >
                        {confirmStatus === 'confirmed' ? 'Xác nhận' : 'Từ chối'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default BulkBillManagement; 