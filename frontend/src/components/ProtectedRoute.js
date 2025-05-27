import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  // If no user is logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If specific roles are required and user doesn't have permission
  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    // Redirect based on user's actual role
    switch (currentUser.role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'shipper':
        return <Navigate to="/shipper" replace />;
      case 'user':
      default:
        return <Navigate to="/home" replace />;
    }
  }

  return children;
};

export default ProtectedRoute; 