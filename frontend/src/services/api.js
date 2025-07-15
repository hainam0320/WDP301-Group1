import axios from 'axios';

const API_BASE_URL = 'http://localhost:9999/api'; // Cập nhật port thành 9999

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
        // Server trả về response với status code nằm ngoài range 2xx
        return {
            success: false,
            message: error.response.data.message || 'Server error',
            error: error.response.data
        };
    } else if (error.request) {
        // Request được gửi nhưng không nhận được response
        return {
            success: false,
            message: 'No response from server',
            error: error.request
        };
    } else {
        // Có lỗi khi setting up request
        return {
            success: false,
            message: 'Error setting up request',
            error: error.message
        };
    }
};

export const authAPI = {
  // ---- LOGIN ----
  login: (credentials) => api.post('auth/login', credentials),

  // ---- REGISTER USER ----
  registerUser: (formData) =>
    api.post('/auth/register-user', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // ---- REGISTER DRIVER ----
  registerDriver: (formData) =>
    api.post('/auth/register-driver', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // ---- Get Profile (Optional)
  getProfile: () => api.get('/auth/profile'),
};

export const shipperAPI = {
  // ---- Update Profile ----
  updateProfile: (data) => api.put('/shipper/profile', data),

  // ---- Upload File ----
  uploadFile: (formData) => 
    api.post('/shipper/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // ---- Complete Order ----
  completeOrder: (orderId) => api.post(`/orders/${orderId}/complete`),

  // ---- Update Order Status ----
  updateOrderStatus: (orderId, status) => api.put(`/shipper/orders/${orderId}/status`, { status }),
};

export const userAPI = {
  // ---- Update Profile ----
  updateProfile: (data) => api.put('/users/profile', data),

  // ---- Upload File ----
  uploadFile: (formData) => 
    api.post('/users/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // ---- Create Order ----
  createOrder: (orderData) => api.post('/orders', orderData),

  // ---- Get User Orders ----
  getUserOrders: () => api.get('/orders/user'),

  // ---- Get Rate for Order ----
  getOrderRate: (orderId) => api.get(`/rate/${orderId}`),

  // ---- Create Rate for Order ----
  createOrderRate: (data) => api.post('/rate', data),

  // ---- Upload Report Images ----
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

  // ---- Create Report ----
  createReport: async (data) => {
    const response = await api.post('/reports', data);
    return response;
  },
  
  // ---- Update Report ----
  updateReport: async (reportId, data) => {
    const response = await api.put(`/reports/${reportId}`, data);
    return response;
  },
  
  // ---- Get User Reports ----
  getUserReports: async () => {
    const response = await api.get('/reports/my-reports');
    return response;
  },
};

export const adminAPI = {
  // ---- Get Dashboard Stats ----
  getStats: () => api.get('/admin/stats'),

  // ---- Get Users List ----
  getUsers: () => api.get('/admin/users'),

  // ---- Delete User ----
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),

  // ---- Update User Status ----
  updateUserStatus: (userId, status) => api.patch(`/admin/users/${userId}/status`, { status: status === 'active' }),

  // ---- Get Orders List ----
  getOrders: () => api.get('/admin/orders'),

  // ---- Get Shipper Orders ----
  getShipperOrders: (shipperId, filters) => api.get(`/admin/shipper/${shipperId}/orders`, { params: filters }),

  // ---- Get Revenue Data ----
  getRevenue: () => api.get('/admin/revenue'),

  // Get all reports
  getAllReports: async () => {
    const response = await api.get('/reports/all');
    return response;
  },

  // Update report status
  updateReportStatus: async (reportId, data) => {
    const response = await api.patch(`/reports/${reportId}/status`, data);
    return response;
  },

  // Commission Management APIs
  getCommissions: (filters) => api.get('/transactions/admin/commissions', { params: filters }),
  
  getDrivers: () => api.get('/transactions/admin/drivers'),
  
  confirmCommissionPayment: (transactionId, data) => 
    api.post(`/transactions/admin/commissions/${transactionId}/confirm`, data),

  // ---- Update Driver Status ----
  updateDriverStatus: (driverId, status) => api.patch(`/admin/drivers/${driverId}/status`, { status }),
};

export const transactionAPI = {
  // Lấy danh sách hoa hồng chưa thanh toán
  getPendingCommissions: () => api.get('/transactions/driver/pending'),

  // Lấy lịch sử thanh toán hoa hồng
  getCommissionHistory: () => api.get('/transactions/driver/history'),

  // Lấy tổng quan về hoa hồng
  getCommissionOverview: () => api.get('/transactions/driver/overview'),

  // Tạo hóa đơn tổng cho nhiều giao dịch
  createBulkBill: (transactionIds) => api.post('/transactions/bulk-bill/create', { transactionIds }),

  // Lấy danh sách bulk bills của tài xế
  getDriverBulkBills: () => api.get('/transactions/driver/bulk-bills'),

  // Lấy danh sách bulk bills cho admin
  getAdminBulkBills: (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.driverName) queryParams.append('driverName', filters.driverName);
    if (filters.status) queryParams.append('status', filters.status);
    
    const queryString = queryParams.toString();
    return api.get(`/transactions/admin/bulk-bills${queryString ? `?${queryString}` : ''}`);
  },

  // Admin - Xác nhận thanh toán bulk bill
  adminConfirmBulkPayment: (bulkBillId, data) => api.post(`/transactions/admin/bulk-bills/${bulkBillId}/confirm`, data),

  // Cập nhật trạng thái thanh toán QR
  updateBulkQRPaymentStatus: (paymentCode, status) => {
    console.log('Sending payment status update:', { paymentCode, status });
    return api.post(`/transactions/qr/payment/${encodeURIComponent(paymentCode)}/status`, { status });
  },

  // Lấy chi tiết bulk bill cho admin
  getAdminBulkBillDetails: (billId) => api.get(`/transactions/admin/bulk-bills/${billId}`)
};

export const notificationAPI = {
  // Lấy tất cả thông báo của người dùng
  getNotifications: () => api.get('/notifications'),

  // Đánh dấu một thông báo là đã đọc
  markAsRead: (notificationId) => api.patch(`/notifications/${notificationId}/read`),

  // Đánh dấu tất cả là đã đọc
  markAllAsRead: () => api.patch('/notifications/read-all')
};

// Admin Commission Management APIs
export const getAdminCommissions = async (filters) => {
    try {
        const queryString = new URLSearchParams(filters).toString();
        const response = await axios.get(`${API_BASE_URL}/transactions/admin/commissions?${queryString}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    } catch (error) {
        throw handleError(error);
    }
};

export const getAdminCommissionStats = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/transactions/admin/commission-stats`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    } catch (error) {
        throw handleError(error);
    }
};

export const getDriverCommissionStats = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/transactions/admin/driver-commission-stats`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    } catch (error) {
        throw handleError(error);
    }
};


