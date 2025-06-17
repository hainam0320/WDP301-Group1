import axios from 'axios';

const API_BASE_URL = 'http://localhost:9999/api'; // Cập nhật theo port backend nếu khác

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

  // ---- Get Revenue Data ----
  getRevenue: () => api.get('/admin/revenue'),
};
