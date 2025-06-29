import React, { useState, useEffect } from 'react';
import { FaEye, FaLock, FaLockOpen } from 'react-icons/fa';
import { adminAPI } from '../../services/api';
import { toast } from 'react-toastify';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersData = await adminAPI.getUsers();
      
      // Log để kiểm tra dữ liệu
      console.log("Dữ liệu người dùng chi tiết:", usersData.data.map(user => ({
        id: user._id,
        name: user.fullName,
        createdAt: user.createdAt,
        type: user.type
      })));
      
      setUsers(usersData.data.filter(user => user.type === 'user'));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Chưa có dữ liệu';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Chưa có dữ liệu';
      return date.toLocaleDateString('vi-VN');
    } catch (error) {
      return 'Chưa có dữ liệu';
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus ? 'inactive' : 'active';
      await adminAPI.updateUserStatus(userId, newStatus);
      toast.success(`Tài khoản đã được ${newStatus === 'active' ? 'mở khóa' : 'khóa'} thành công`);
      fetchUsers();
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
          <Modal.Title>Thông tin chi tiết người dùng</Modal.Title>
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
                      <span className="badge bg-primary">User</span>
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
                    <td>{formatDate(selectedUser.createdAt)}</td>
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
        <h4 className="mb-0">Quản lý người dùng</h4>
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
                {users.map(user => (
                  <tr key={user._id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{user.fullName}</td>
                    <td>{user.email}</td>
                    <td>{user.phone}</td>
                    <td>
                      <span className={`badge ${user.status ? 'bg-success' : 'bg-secondary'}`}>
                        {user.status ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button 
                          className="btn btn-outline-primary" 
                          title="Xem chi tiết"
                          onClick={() => handleViewUser(user)}
                        >
                          <FaEye />
                        </button>
                        <button 
                          className={`btn ${user.status ? 'btn-outline-danger' : 'btn-outline-success'}`}
                          onClick={() => toggleUserStatus(user._id, user.status)}
                          title={user.status ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        >
                          {user.status ? <FaLock /> : <FaLockOpen />}
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

export default UserManagement;