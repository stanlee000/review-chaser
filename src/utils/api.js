import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor for authentication
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

// Add a response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Review-related API calls
export const reviewApi = {
  // Generate a review using AI
  generateReview: async (data) => {
    const response = await api.post('/reviews/generate', data);
    return response.data;
  },

  // Get all reviews
  getReviews: async () => {
    const response = await api.get('/reviews');
    return response.data;
  },

  // Send a review request
  sendReviewRequest: async (data) => {
    const response = await api.post('/reviews/request', data);
    return response.data;
  },

  // Update review settings
  updateSettings: async (data) => {
    const response = await api.put('/settings', data);
    return response.data;
  },
};

// Widget-related API calls
export const widgetApi = {
  // Get widget configuration
  getConfig: async () => {
    const response = await api.get('/widget/config');
    return response.data;
  },

  // Update widget configuration
  updateConfig: async (data) => {
    const response = await api.put('/widget/config', data);
    return response.data;
  },

  // Get widget embed code
  getEmbedCode: async (config) => {
    const response = await api.post('/widget/embed', config);
    return response.data;
  },
};

// Integration-related API calls
export const integrationApi = {
  // Get all integrations
  getIntegrations: async () => {
    const response = await api.get('/integrations');
    return response.data;
  },

  // Connect an integration
  connectIntegration: async (integrationId) => {
    const response = await api.post(`/integrations/${integrationId}/connect`);
    return response.data;
  },

  // Disconnect an integration
  disconnectIntegration: async (integrationId) => {
    const response = await api.post(`/integrations/${integrationId}/disconnect`);
    return response.data;
  },
};

export default api; 