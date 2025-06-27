import React, { useState, useEffect } from 'react';
import { Table, Card, Row, Col, Button, Badge, Form, InputGroup } from 'react-bootstrap';
import { FaSearch, FaFileDownload, FaCheckCircle, FaTimesCircle, FaChartBar } from 'react-icons/fa';
import { adminAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

const CommissionManagement = () => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    startDate: '',
    endDate: '',
    driverId: '',
    searchTerm: ''
  });
  const [stats, setStats] = useState({
    totalCommission: 0,
    pendingAmount: 0,
    completedAmount: 0,
    totalTransactions: 0
  });

  useEffect(() => {
    fetchCommissions();
  }, [filters]);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getCommissions(filters);
      setCommissions(response.data.commissions);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching commissions:', error);
      toast.error('Không thể tải dữ liệu hoa hồng');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async (commissionId) => {
    try {
      await adminAPI.confirmCommissionPayment(commissionId);
      toast.success('Xác nhận thanh toán thành công');
      fetchCommissions();
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Không thể xác nhận thanh toán');
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <div className="p-4">
      <h2 className="mb-4">Quản lý hoa hồng</h2>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="bg-primary text-white">
            <Card.Body>
              <h6>Tổng hoa hồng</h6>
              <h4>{formatCurrency(stats.totalCommission)}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-warning text-white">
            <Card.Body>
              <h6>Chờ thanh toán</h6>
              <h4>{formatCurrency(stats.pendingAmount)}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-success text-white">
            <Card.Body>
              <h6>Đã thanh toán</h6>
              <h4>{formatCurrency(stats.completedAmount)}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-info text-white">
            <Card.Body>
              <h6>Tổng giao dịch</h6>
              <h4>{stats.totalTransactions}</h4>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Trạng thái</Form.Label>
                <Form.Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="all">Tất cả</option>
                  <option value="pending">Chờ thanh toán</option>
                  <option value="completed">Đã thanh toán</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Từ ngày</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Đến ngày</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Tìm kiếm</Form.Label>
                <InputGroup>
                  <Form.Control
                    placeholder="Tìm theo mã, tên tài xế..."
                    value={filters.searchTerm}
                    onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  />
                  <Button variant="outline-secondary">
                    <FaSearch />
                  </Button>
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Commission Table */}
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between mb-3">
            <h5>Danh sách hoa hồng</h5>
            <Button variant="success">
              <FaFileDownload className="me-2" />
              Xuất báo cáo
            </Button>
          </div>
          <Table responsive>
            <thead>
              <tr>
                <th>Mã giao dịch</th>
                <th>Tài xế</th>
                <th>Số tiền</th>
                <th>Ngày tạo</th>
                <th>Trạng thái</th>
                <th>Phương thức</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map(commission => (
                <tr key={commission._id}>
                  <td>{commission._id}</td>
                  <td>{commission.driverName}</td>
                  <td>{formatCurrency(commission.amount)}</td>
                  <td>{formatDate(commission.createdAt)}</td>
                  <td>
                    <Badge bg={commission.status === 'completed' ? 'success' : 'warning'}>
                      {commission.status === 'completed' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                    </Badge>
                  </td>
                  <td>
                    {commission.paymentMethod === 'qr' ? (
                      <Badge bg="info">QR Code</Badge>
                    ) : (
                      <Badge bg="secondary">Khác</Badge>
                    )}
                  </td>
                  <td>
                    {commission.status === 'pending' && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleConfirmPayment(commission._id)}
                      >
                        <FaCheckCircle className="me-1" />
                        Xác nhận
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default CommissionManagement; 