import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import ShipperDashboard from './components/shipper/ShipperDashboard';
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
import CompletedOrders from './components/shipper/CompletedOrders';
import CommissionManagement from './components/shipper/CommissionManagement';
import AdminCommissionManagement from './components/admin/AdminCommissionManagement';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Admin components
import UserManagement from './components/admin/UserManagement';
import ShipperManagement from './components/admin/ShipperManagement';
import OrderManagement from './components/admin/OrderManagement';
import RevenueReport from './components/admin/RevenueReport';
import ReportManagement from './components/admin/ReportManagement';
import SystemSettings from './components/admin/SystemSettings';
import AdminDashboardHome from './components/admin/AdminDashboardHome';

function App() {
  return (
    <Router>
      <div>
        <Toaster position="top-right" />
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
            path="/shipper/completed-orders" 
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <CompletedOrders />
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
          <Route 
            path="/shipper/commissions" 
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <CommissionManagement />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin Routes */}
          <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>}>
            <Route index element={<AdminDashboardHome />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="shippers" element={<ShipperManagement />} />
            <Route path="orders" element={<OrderManagement />} />
            <Route path="revenue" element={<RevenueReport />} />
            <Route path="reports" element={<ReportManagement />} />
            <Route path="settings" element={<SystemSettings />} />
            <Route path="commission-management" element={<AdminCommissionManagement />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
