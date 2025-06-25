import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import ShipperDashboard from './components/ShipperDashboard';
import AdminDashboard from './components/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import NewOrder from './components/NewOrder';
import OrderTracking from './components/OrderTracking';
import OrderHistory from './components/OrderHistory';
import UserProfile from './components/UserProfile';
import MyReports from './components/MyReports';
import ConfirmOrder from './components/ConfirmOrder';
import AvailableOrders from './components/shipper/AvailableOrders';
import MyOrders from './components/shipper/MyOrders';
import Earnings from './components/shipper/Earnings';
import ShipperProfile from './components/shipper/ShipperProfile';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

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
        <Route 
          path="/new-order" 
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <NewOrder />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/order-tracking" 
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <OrderTracking />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/order-history" 
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <OrderHistory />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <UserProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-reports" 
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <MyReports />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/confirmOrder" 
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <ConfirmOrder />
            </ProtectedRoute>
          } 
        />
        {/* Shipper Routes */}
        <Route 
          path="/shipper" 
          element={
            <ProtectedRoute allowedRoles={['driver']}>
              <ShipperDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/shipper/available-orders" 
          element={
            <ProtectedRoute allowedRoles={['driver']}>
              <AvailableOrders />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/shipper/my-orders" 
          element={
            <ProtectedRoute allowedRoles={['driver']}>
              <MyOrders />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/shipper/earnings" 
          element={
            <ProtectedRoute allowedRoles={['driver']}>
              <Earnings />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/shipper/profile" 
          element={
            <ProtectedRoute allowedRoles={['driver']}>
              <ShipperProfile />
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
