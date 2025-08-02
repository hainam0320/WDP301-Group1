import axios from 'axios';

const API_BASE_URL = 'http://localhost:9999/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const handleError = (error) => {
    if (error.response) {
        return {
            success: false,
            message: error.response.data.message || 'Server error',
            error: error.response.data
        };
    } else if (error.request) {
        return {
            success: false,
            message: 'No response from server',
            error: error.request
        };
    } else {
        return {
            success: false,
            message: 'Error setting up request',
            error: error.message
        };
    }
};

export const authAPI = {
  login: (credentials) => api.post('auth/login', credentials),
  registerUser: (formData) =>
    api.post('/auth/register-user', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  registerDriver: (formData) =>
    api.post('/auth/register-driver', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getProfile: () => api.get('/auth/profile'),
};

export const shipperAPI = {
  getAvailableOrdersCount: () => api.get('/shipper/orders/available/count'),
  getOngoingOrdersCount: () => api.get('/shipper/orders/ongoing/count'),
  updateProfile: (data) => api.put('/shipper/profile', data),
  uploadFile: (formData) => 
    api.post('/shipper/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  completeOrder: (orderId) => api.post(`/orders/${orderId}/complete`),
  updateOrderStatus: (orderId, status) => api.put(`/shipper/orders/${orderId}/status`, { status }),
};

export const userAPI = {
  updateProfile: (data) => api.put('/users/profile', data),
  uploadFile: (formData) => 
    api.post('/users/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  createOrder: (orderData) => api.post('/orders', orderData),
  getUserOrders: () => api.get('/orders/user'),
  getOrderRate: (orderId) => api.get(`/rate/${orderId}`),
  createOrderRate: (data) => api.post('/rate', data),
  uploadReportImages: async (formData) => {
    console.log('API: Uploading report images...');
    console.log('API: Token from localStorage:', localStorage.getItem('token'));
    const response = await api.post('/reports/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    console.log('API: Upload response:', response);
    return response;
  },
  createReport: async (data) => {
    const response = await api.post('/reports', data);
    return response;
  },
  updateReport: async (reportId, data) => {
    const response = await api.put(`/reports/${reportId}`, data);
    return response;
  },
  getUserReports: async () => {
    const response = await api.get('/reports/my-reports');
    return response;
  },
  changePassword: ({ currentPassword, newPassword }) =>
    api.post('/users/change-password', { currentPassword, newPassword }),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  updateUserStatus: (userId, status) => api.patch(`/admin/users/${userId}/status`, { status: status === 'active' }),
  getOrders: () => api.get('/admin/orders'),
  getShipperOrders: (shipperId, filters) => api.get(`/admin/shipper/${shipperId}/orders`, { params: filters }),
  getRevenue: () => api.get('/admin/revenue'),
  getAllReports: async () => {
    const response = await api.get('/reports/all');
    return response;
  },
  updateReportStatus: async (reportId, data) => {
    const response = await api.patch(`/reports/${reportId}/status`, data);
    return response;
  },
  getCommissions: (filters) => api.get('/transactions/admin/commissions', { params: filters }),
  getDrivers: () => api.get('/transactions/admin/drivers'),
  confirmCommissionPayment: (transactionId, data) => 
    api.post(`/transactions/admin/commissions/${transactionId}/confirm`, data),
  updateDriverStatus: (driverId, status) => api.patch(`/admin/drivers/${driverId}/status`, { status }),
};

export const transactionAPI = {
  getAdminBulkBills: (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.driverName) queryParams.append('driverName', filters.driverName);
    if (filters.status) queryParams.append('status', filters.status);
    
    const queryString = queryParams.toString();
    return api.get(`/transactions/admin/bulk-bills${queryString ? `?${queryString}` : ''}`);
  },
  getAdminBulkBillDetails: (billId) => api.get(`/transactions/admin/bulk-bills/${billId}`),
  adminConfirmBulkPayment: (bulkBillId, data) => api.post(`/transactions/admin/bulk-bills/${bulkBillId}/confirm`, data),
  
  // NEW FUNCTIONS FOR ADMIN PAYS DRIVER FLOW (đã có ở transactionAPI)
  getDriverPayoutsBalance: () => api.get('/transactions/driver/payouts/balance'),
  getDriverPayoutsHistory: () => api.get('/transactions/driver/payouts/history'),
  requestPayout: (amountData) => api.post('/transactions/driver/payouts/request', amountData),
  getDriverPayoutRequests: () => api.get('/transactions/driver/payouts/requests'), 

  // NEW FUNCTIONS FOR ADMIN MANAGES PAYOUTS (Mới thêm vào)
  getAdminPendingPayoutRequests: () => api.get('/transactions/admin/payouts/requests/pending'), 
  processPayoutRequest: (payoutId, data) => api.post(`/transactions/admin/payouts/${payoutId}/process`, data),
  getAdminPayoutsHistory: (filters = {}) => { // THÊM HÀM NÀY
    const queryParams = new URLSearchParams();
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.driverName) queryParams.append('driverName', filters.driverName);
    if (filters.status) queryParams.append('status', filters.status);
    
    const queryString = queryParams.toString();
    return api.get(`/transactions/admin/payouts/history${queryString ? `?${queryString}` : ''}`);
  },
};

export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (notificationId) => api.patch(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all')
};