import React, { useState, useEffect } from 'react';
import { FaEye, FaLock, FaLockOpen, FaPlus } from 'react-icons/fa';
import { adminAPI } from '../../services/api';
import { toast } from 'react-toastify';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const ShipperManagement = () => {
  const [shippers, setShippers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchShippers();
  }, []);

  const fetchShippers = async () => {
    try {
      setLoading(true);
      const shippersData = await adminAPI.getUsers();
      setShippers(shippersData.data.filter(user => user.type === 'driver'));
    } catch (error) {
      console.error('Error fetching shippers:', error);
      toast.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
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

  const handleCloseModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/150';
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:9999/${imagePath.replace(/\\/g, '/')}`;
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
    </div>
  );
};

export default ShipperManagement; 