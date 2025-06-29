import React, { useState, useEffect } from 'react';
import { FaEye, FaLock, FaLockOpen, FaPlus, FaChartLine } from 'react-icons/fa';
import { adminAPI } from '../../services/api';
import { toast } from 'react-toastify';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

const ShipperManagement = () => {
  const [shippers, setShippers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showActivitiesModal, setShowActivitiesModal] = useState(false);
  const [shipperOrders, setShipperOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [filterDates, setFilterDates] = useState({
    startDate: '',
    endDate: '',
    status: ''
  });
  const [error, setError] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    fetchShippers();
  }, []);

  const fetchShippers = async () => {
    try {
      setLoading(true);
      const shippersData = await adminAPI.getUsers();
      // Log để kiểm tra dữ liệu
      console.log("Dữ liệu shipper chi tiết:", shippersData.data.map(user => ({
        id: user._id,
        name: user.fullName,
        createdAt: user.createdAt,
        type: user.type
      })));
      setShippers(shippersData.data.filter(user => user.type === 'driver'));
    } catch (error) {
      console.error('Error fetching shippers:', error);
      toast.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const fetchShipperOrders = async (shipperId) => {
    try {
      setLoadingOrders(true);
      setError(null); // Reset error state before new fetch
      console.log('Fetching orders for shipper:', shipperId);
      console.log('Using filters:', filterDates);

      // Prepare filter parameters
      const params = {
        ...filterDates,
        // Convert dates to ISO string format if they exist
        startDate: filterDates.startDate ? new Date(filterDates.startDate).toISOString() : undefined,
        endDate: filterDates.endDate ? new Date(filterDates.endDate).toISOString() : undefined,
        // Only include status if it's not empty
        status: filterDates.status || undefined
      };

      // Remove undefined values
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      console.log('Final params:', params);

      const response = await adminAPI.getShipperOrders(shipperId, params);
      console.log('Received orders:', response.data);
      
      if (!response.data) {
        throw new Error('No data received from server');
      }

      setShipperOrders(response.data);
    } catch (error) {
      console.error('Error fetching shipper orders:', error);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu đơn hàng';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoadingOrders(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus ? 'inactive' : 'active';
      await adminAPI.updateUserStatus(userId, newStatus);
      toast.success(`Tài khoản đã được ${newStatus === 'active' ? 'mở khóa' : 'khóa'} thành công`);
      fetchShippers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái tài khoản');
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleViewActivities = async (user) => {
    setSelectedUser(user);
    setShowActivitiesModal(true);
    await fetchShipperOrders(user._id);
  };

  const handleCloseModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  const handleCloseActivitiesModal = () => {
    setShowActivitiesModal(false);
    setSelectedUser(null);
    setShipperOrders([]);
    setError(null);
    setFilterDates({
      startDate: '',
      endDate: '',
      status: ''
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterDates(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilter = () => {
    if (selectedUser) {
      fetchShipperOrders(selectedUser._id);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath || typeof imagePath !== 'string') return 'https://via.placeholder.com/150';
    return `http://localhost:9999/${imagePath}`;
  };

  const handleImageClick = (imagePath) => {
    setSelectedImage(`http://localhost:9999/${imagePath}`);
    setShowImageModal(true);
  };

  const renderImages = (imagePaths) => {
    if (!imagePaths) return null;
    
    // Convert to array if it's a string, or use existing array
    const images = Array.isArray(imagePaths) 
      ? imagePaths 
      : typeof imagePaths === 'string' 
        ? imagePaths.split(',').filter(img => img.trim())
        : [];

    if (images.length === 0) return null;

    return (
      <div className="d-flex flex-wrap gap-2">
        {images.map((img, index) => (
          <img
            key={index}
            src={`http://localhost:9999/${img}`}
            alt={`Evidence ${index + 1}`}
            className="img-thumbnail"
            style={{height: '100px', objectFit: 'cover', cursor: 'pointer'}}
            onClick={() => handleImageClick(img)}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/150';
            }}
          />
        ))}
      </div>
    );
  };

  const UserDetailsModal = () => {
    if (!selectedUser) return null;

    return (
      <Modal show={showUserModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Thông tin chi tiết shipper</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            <div className="col-md-4 text-center mb-3">
              <img 
                src={getImageUrl(selectedUser.avatar)}
                alt="Avatar" 
                className="rounded-circle img-thumbnail"
                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/150';
                }}
              />
              <div className="mt-3">
                {selectedUser.licensePlateImage && (
                  <div className="mb-3">
                    <p className="mb-2">Ảnh biển số xe:</p>
                    <img 
                      src={getImageUrl(selectedUser.licensePlateImage)}
                      alt="Biển số xe" 
                      className="img-thumbnail"
                      style={{ maxWidth: '200px' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/150';
                      }}
                    />
                  </div>
                )}
                {selectedUser.cmndFront && (
                  <div className="mb-3">
                    <p className="mb-2">CMND mặt trước:</p>
                    <img 
                      src={getImageUrl(selectedUser.cmndFront)}
                      alt="CMND mặt trước" 
                      className="img-thumbnail"
                      style={{ maxWidth: '200px' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/150';
                      }}
                    />
                  </div>
                )}
                {selectedUser.cmndBack && (
                  <div className="mb-3">
                    <p className="mb-2">CMND mặt sau:</p>
                    <img 
                      src={getImageUrl(selectedUser.cmndBack)}
                      alt="CMND mặt sau" 
                      className="img-thumbnail"
                      style={{ maxWidth: '200px' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/150';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="col-md-8">
              <table className="table">
                <tbody>
                  <tr>
                    <th style={{ width: '35%' }}>Họ tên:</th>
                    <td>{selectedUser.fullName}</td>
                  </tr>
                  <tr>
                    <th>Email:</th>
                    <td>{selectedUser.email}</td>
                  </tr>
                  <tr>
                    <th>Số điện thoại:</th>
                    <td>{selectedUser.phone}</td>
                  </tr>
                  <tr>
                    <th>Vai trò:</th>
                    <td>
                      <span className="badge bg-success">Shipper</span>
                    </td>
                  </tr>
                  <tr>
                    <th>Trạng thái:</th>
                    <td>
                      <span className={`badge ${selectedUser.status ? 'bg-success' : 'bg-secondary'}`}>
                        {selectedUser.status ? 'Đang hoạt động' : 'Đã bị khóa'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <th>Ngày tham gia:</th>
                    <td>{new Date(selectedUser.createdAt).toLocaleDateString('vi-VN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Đóng
          </Button>
          <Button
            variant={selectedUser.status ? 'danger' : 'success'}
            onClick={() => {
              toggleUserStatus(selectedUser._id, selectedUser.status);
              handleCloseModal();
            }}
          >
            {selectedUser.status ? <><FaLock className="me-2" />Khóa tài khoản</> : <><FaLockOpen className="me-2" />Mở khóa tài khoản</>}
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  const ActivitiesModal = () => {
    if (!selectedUser) return null;

    return (
      <Modal 
        show={showActivitiesModal} 
        onHide={handleCloseActivitiesModal} 
        size="xl" 
        dialogClassName="modal-90w"
      >
        <Modal.Header closeButton>
          <Modal.Title>Quản lý hoạt động - {selectedUser.fullName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            <div className="row g-3">
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Từ ngày</Form.Label>
                  <Form.Control
                    type="date"
                    name="startDate"
                    value={filterDates.startDate}
                    onChange={handleFilterChange}
                  />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Đến ngày</Form.Label>
                  <Form.Control
                    type="date"
                    name="endDate"
                    value={filterDates.endDate}
                    onChange={handleFilterChange}
                  />
                </Form.Group>
              </div>
              <div className="col-md-3">
                <Form.Group>
                  <Form.Label>Trạng thái</Form.Label>
                  <Form.Select
                    name="status"
                    value={filterDates.status}
                    onChange={handleFilterChange}
                  >
                    <option value="">Tất cả</option>
                    <option value="pending">Chờ xử lý</option>
                    <option value="accepted">Đã nhận</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="cancelled">Đã hủy</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-1 d-flex align-items-end">
                <Button variant="primary" onClick={handleFilter}>
                  Lọc
                </Button>
              </div>
            </div>
          </div>

          {loadingOrders ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-danger">
              {error}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Mã đơn</th>
                    <th style={{ width: '100px' }}>Loại</th>
                    <th style={{ width: '15%' }}>Điểm đón</th>
                    <th style={{ width: '15%' }}>Điểm đến</th>
                    <th style={{ width: '15%' }}>Khách hàng</th>
                    <th style={{ width: '100px' }}>Giá (VNĐ)</th>
                    <th style={{ width: '100px' }}>Trạng thái</th>
                    <th style={{ width: '20%' }}>Ghi chú của shipper</th>
                    <th style={{ width: '15%' }}>Báo cáo</th>
                    <th style={{ width: '100px' }}>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {shipperOrders.map(order => (
                    <tr key={order._id}>
                      <td>#{order._id.slice(-6)}</td>
                      <td>{order.type === 'delivery' ? 'Giao hàng' : 'Đưa đón'}</td>
                      <td style={{ whiteSpace: 'pre-wrap' }}>{order.pickupaddress}</td>
                      <td style={{ whiteSpace: 'pre-wrap' }}>{order.dropupaddress}</td>
                      <td>
                        {order.customer ? (
                          <>
                            <div>{order.customer.fullName}</div>
                            <small className="text-muted">{order.customer.phone}</small>
                          </>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                      <td>{order.price.toLocaleString()}</td>
                      <td>
                        <span className={`badge ${
                          order.status === 'completed' ? 'bg-success' :
                          order.status === 'accepted' ? 'bg-primary' :
                          order.status === 'cancelled' ? 'bg-danger' : 'bg-warning'
                        }`}>
                          {order.status === 'completed' ? 'Hoàn thành' :
                           order.status === 'accepted' ? 'Đã nhận' :
                           order.status === 'cancelled' ? 'Đã hủy' : 'Chờ xử lý'}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'pre-wrap' }}>
                        {order.statusDescription || <span className="text-muted">-</span>}
                      </td>
                      <td>
                        {order.report && order.report.status === 'resolved' ? (
                          <Button 
                            variant="outline-info" 
                            size="sm"
                            onClick={() => handleViewReport(order.report)}
                          >
                            Xem chi tiết
                          </Button>
                        ) : (
                          <span className="text-muted">Không có báo cáo</span>
                        )}
                      </td>
                      <td>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                    </tr>
                  ))}
                  {shipperOrders.length === 0 && !loadingOrders && (
                    <tr>
                      <td colSpan="10" className="text-center">
                        {filterDates.startDate || filterDates.endDate || filterDates.status ? 
                          'Không tìm thấy đơn hàng nào phù hợp với bộ lọc' : 
                          'Shipper này chưa có đơn hàng nào'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseActivitiesModal}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setSelectedReport(null);
  };

  const ReportModal = () => {
    if (!selectedReport) return null;

    return (
      <Modal show={showReportModal} onHide={handleCloseReportModal}>
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết báo cáo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <table className="table">
            <tbody>
              <tr>
                <th>Loại báo cáo:</th>
                <td>
                  {selectedReport.type === 'late' ? 'Trễ giờ' :
                   selectedReport.type === 'damage' ? 'Hư hỏng hàng hóa' :
                   selectedReport.type === 'lost' ? 'Mất hàng' :
                   selectedReport.type === 'inappropriate' ? 'Hành vi không phù hợp' :
                   selectedReport.type === 'fraud' ? 'Gian lận' : 'Khác'}
                </td>
              </tr>
              <tr>
                <th>Mô tả:</th>
                <td>{selectedReport.description}</td>
              </tr>
              {selectedReport.image && (
                <tr>
                  <th>Hình ảnh:</th>
                  <td>
                    {renderImages(selectedReport.image)}
                  </td>
                </tr>
              )}
              <tr>
                <th>Ghi chú của admin:</th>
                <td>{selectedReport.admin_note || <span className="text-muted">-</span>}</td>
              </tr>
              <tr>
                <th>Thời gian báo cáo:</th>
                <td>{new Date(selectedReport.createdAt).toLocaleString('vi-VN')}</td>
              </tr>
            </tbody>
          </table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseReportModal}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  // Add custom CSS for the modal width
  const styles = `
    .modal-90w {
      min-width: 90%;
    }
  `;

  // Add the styles to the document head
  if (typeof window !== 'undefined' && !document.getElementById('modal-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'modal-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  return (
    <div className="card">
      <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
        <h4 className="mb-0">Quản lý shipper</h4>
      </div>
      <div className="card-body">
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Email</th>
                  <th>Số điện thoại</th>
                  <th>Trạng thái</th>
                  <th>Ngày tham gia</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {shippers.map(shipper => (
                  <tr key={shipper._id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{shipper.fullName}</td>
                    <td>{shipper.email}</td>
                    <td>{shipper.phone}</td>
                    <td>
                      <span className={`badge ${shipper.status ? 'bg-success' : 'bg-secondary'}`}>
                        {shipper.status ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td>{new Date(shipper.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button 
                          className="btn btn-outline-primary" 
                          title="Xem chi tiết"
                          onClick={() => handleViewUser(shipper)}
                        >
                          <FaEye />
                        </button>
                        <button 
                          className="btn btn-outline-info" 
                          title="Quản lý hoạt động"
                          onClick={() => handleViewActivities(shipper)}
                        >
                          <FaChartLine />
                        </button>
                        <button 
                          className={`btn ${shipper.status ? 'btn-outline-danger' : 'btn-outline-success'}`}
                          onClick={() => toggleUserStatus(shipper._id, shipper.status)}
                          title={shipper.status ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        >
                          {shipper.status ? <FaLock /> : <FaLockOpen />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <UserDetailsModal />
      <ActivitiesModal />
      <ReportModal />

      {/* Image Modal */}
      <Modal show={showImageModal} onHide={() => setShowImageModal(false)} centered size="xl">
        <Modal.Header closeButton />
        <Modal.Body className="text-center p-0">
          <img 
            src={selectedImage}
            alt="Enlarged evidence" 
            className="img-fluid"
            style={{maxWidth: '100%', maxHeight: '80vh'}}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Found';
            }}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ShipperManagement;