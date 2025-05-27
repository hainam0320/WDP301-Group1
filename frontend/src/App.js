
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import ShipperDashboard from './components/ShipperDashboard';
import AdminDashboard from './components/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* User Routes */}
        <Route 
          path="/home" 
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <Home />
            </ProtectedRoute>
          } 
        />
        
        {/* Shipper Routes */}
        <Route 
          path="/shipper" 
          element={
            <ProtectedRoute allowedRoles={['shipper']}>
              <ShipperDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/manage-users" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
