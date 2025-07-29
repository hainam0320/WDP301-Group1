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
  // Shipper chỉ cập nhật trạng thái đã hoàn thành, không trigger giải ngân
  updateOrderStatus: (orderId, statusData) => api.put(`/shipper/orders/${orderId}/status`, statusData),
};

export const userAPI = {
  updateProfile: (data) => api.put('/users/profile', data),
  uploadFile: (formData) => 
    api.post('/users/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  // Tạo đơn hàng (user tạo, status ban đầu là pending_payment)
  createOrder: (orderData) => api.post('/orders', orderData),
  // Lấy đơn hàng của user
  getUserOrders: () => api.get('/orders/user'), // Đã đổi route ở orderRoutes.js
  getOrderRate: (orderId) => api.get(`/rate/${orderId}`),
  createOrderRate: (data) => api.post('/rate', data),
  uploadReportImages: async (files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    const response = await api.post('/reports/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
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
  
  // NEW API: User xác nhận hoàn thành đơn hàng
  confirmOrderCompletion: (orderId) => api.post(`/orders/${orderId}/user-confirm-completion`),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  updateUserStatus: (userId, status) => api.patch(`/admin/users/${userId}/status`, { status: status === 'active' }),
  getOrders: () => api.get('/admin/orders'), // Đây có thể là route để admin lấy tất cả đơn hàng, không filter theo user
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
  updateDriverStatus: (driverId, status) => api.patch(`/admin/drivers/${driverId}/status`, { status }),
};

export const transactionAPI = {
  // NEW API: Initiate VNPAY payment
  createVnPayPayment: (paymentData) => api.post('/payment/create-vnpay-payment', paymentData),

  // Cập nhật các API này để phù hợp với luồng mới (CompanyTransaction không còn là hoa hồng tài xế trả)
  // Mà là các giao dịch tiền được giữ, hoa hồng được trích, tiền được giải ngân
  getDriverCommissions: () => api.get('/transactions/driver/commissions'), // Tiền hoa hồng (công ty giữ)
  getDriverPayoutHistory: () => api.get('/transactions/driver/payout-history'), // Lịch sử tiền tài xế đã nhận
  getDriverEarningsOverview: () => api.get('/transactions/driver/overview'), // Tổng quan thu nhập tài xế (bao gồm số dư ví)

  // ADMIN APIs cho các giao dịch mới
  getAdminTransactions: (filters = {}) => {
    const queryParams = new URLSearchParams(filters);
    return api.get(`/transactions/admin/all?${queryParams.toString()}`);
  },
  getAdminTransactionDetails: (transactionId) => api.get(`/transactions/admin/${transactionId}`),
  adminResolveTransaction: (transactionId, data) => api.post(`/transactions/admin/${transactionId}/resolve`, data),

  // Các API BulkBill và QRPayment của luồng cũ có thể được xóa hoặc tái sử dụng cho mục đích rút tiền/quản lý nội bộ khác
  // createBulkBill: (transactionIds) => api.post('/transactions/bulk-bill/create', { transactionIds }),
  // cancelBulkBill: (bulkBillId) => api.post(`/transactions/bulk-bills/${bulkBillId}/cancel`),
  // getDriverBulkBills: () => api.get('/transactions/driver/bulk-bills'),
  // getAdminBulkBills: (filters = {}) => { /* ... */ },
  // adminConfirmBulkPayment: (bulkBillId, data) => api.post(`/transactions/admin/bulk-bills/${bulkBillId}/confirm`, data),
  // updateBulkQRPaymentStatus: (paymentCode, status) => { /* ... */ },
  // getAdminBulkBillDetails: (billId) => api.get(`/transactions/admin/bulk-bills/${billId}`)
};

export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (notificationId) => api.patch(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all')
};