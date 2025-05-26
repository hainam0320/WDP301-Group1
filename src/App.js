
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ManageUser from './components/admin/ManageUser';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/manage-users" element={<ManageUser />} />
        {/* Bạn có thể thêm các route khác ở đây */}
        <Route path="/" element={<h1>Trang chủ</h1>} />
      </Routes>
    </Router>
  );
}

export default App;
