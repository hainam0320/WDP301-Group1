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
