import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('API_BASE_URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

// Basket API endpoints
export const basketAPI = {
  checkHealth: () => {
    console.log('Calling GET /health');
    return api.get('/health').then(res => {
      console.log('GET /health response:', res.data);
      return res;
    }).catch(err => {
      console.error('GET /health error:', err.message);
      throw err;
    });
  },
  getAllBaskets: () => {
    console.log('Calling GET /baskets');
    return api.get('/baskets').then(res => {
      console.log('GET /baskets response:', res.data);
      return res;
    }).catch(err => {
      console.error('GET /baskets error:', err.message, err.response?.data);
      throw err;
    });
  },
  getBasketById: (id) => api.get(`/baskets/${id}`),
  createBasket: (data) => api.post('/baskets', data),
  updateBasket: (id, data) => api.patch(`/baskets/${id}`, data),
  subscribeToBasket: (id, email) => api.post(`/baskets/${id}/subscribe`, { email }),
  unsubscribeFromBasket: (id, email) => api.post(`/baskets/${id}/unsubscribe`, { email }),
  rebalanceBasket: (id) => api.post(`/baskets/${id}/rebalance`),
  getRebalanceSummary: (id) => api.get(`/baskets/${id}/rebalance-summary`),
  getBasketStocks: (id) => api.get(`/baskets/${id}/stocks`)
};

export default api;
