import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  verifyToken: () => api.post('/auth/verify-token'),
  logout: () => api.post('/auth/logout'),
};

// User/Resident APIs
export const userAPI = {
  // Admin APIs
  createResident: (data) => api.post('/users/residents', data),
  getResidents: () => api.get('/users/residents'),
  getResident: (id) => api.get(`/users/residents/${id}`),
  updateResident: (id, data) => api.put(`/users/residents/${id}`, data),
  deleteResident: (id) => api.delete(`/users/residents/${id}`),
  getDashboardStats: () => api.get('/users/dashboard-stats'),
  
  // Common APIs
  getProfile: () => api.get('/users/profile'),
};

// Notification APIs
export const notificationAPI = {
  // Admin APIs
  sendNotification: (data) => api.post('/notifications/send', data),
  getSentNotifications: (page = 1) => api.get(`/notifications/sent?page=${page}`),
  
  // Resident APIs
  getMyNotifications: (page = 1) => api.get(`/notifications/my-notifications?page=${page}`),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  respondToNotification: (id, response, responseMessage = null) => 
    api.put(`/notifications/${id}/respond`, { response, responseMessage }),
};

export default api;
