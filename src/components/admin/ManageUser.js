import React, { useEffect, useState } from 'react';
import HeaderAdmin from '../../pages/HeaderAdmin';
import SidebarAdmin from '../../pages/SidebarAdmin';
import axios from 'axios';

const ManageUser = () => {
  const [users, setUsers] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  useEffect(() => {
    fetch('http://localhost:8000/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error(err));
  }, []);

  const handleStatusChange = (id, newStatus) => {
    const updatedUsers = users.map(user =>
      user.id === id ? { ...user, status: newStatus } : user
    );
    setUsers(updatedUsers);

    fetch(`http://localhost:8000/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  return (
    <>
      <HeaderAdmin />
      <SidebarAdmin />
      <main id="main" className="main">
        <div className="pagetitle">
          <h1>Quản lý người dùng</h1>
          <nav>
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/">Trang chủ</a></li>
              <li className="breadcrumb-item active">Quản lý người dùng</li>
            </ol>
          </nav>
        </div>

        <section className="section">
          <div className="row">
            <div className="col-lg-12">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Datatables</h5>

                  <input
                    type="text"
                    className="form-control mb-3"
                    placeholder="Tìm kiếm theo tên..."
                    value={searchKeyword}
                    onChange={(e) => {
                      setSearchKeyword(e.target.value);
                      setCurrentPage(1);
                    }}
                  />

                  <table className="table datatable">
                    <thead>
                      <tr>
                        <th>Tên</th>
                        <th>Ngày sinh</th>
                        <th>Loại</th>
                        <th>Trạng thái</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentUsers.map(user => (
                        <tr key={user.id}>
                          <td>{user.name}</td>
                          <td>{user.dob}</td>
                          <td>{user.role}</td>
                          <td>
                            <span className={`badge bg-${user.status === 'active' ? 'success' : 'danger'}`}>
                              {user.status}
                            </span>
                          </td>
                          <td>
                            <select
                              className="form-select"
                              value={user.status}
                              onChange={(e) => handleStatusChange(user.id, e.target.value)}
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  <nav>
                    <ul className="pagination justify-content-center">
                      {[...Array(totalPages).keys()].map(number => (
                        <li
                          key={number + 1}
                          className={`page-item ${currentPage === number + 1 ? 'active' : ''}`}
                        >
                          <button className="page-link" onClick={() => setCurrentPage(number + 1)}>
                            {number + 1}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </nav>

                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default ManageUser;