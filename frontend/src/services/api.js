import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('API_BASE_URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

// Retry logic for transient failures
const retryRequest = async (requestFn, maxRetries = 3, delayMs = 1000) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempt ${i + 1}/${maxRetries} to fetch data`);
      return await requestFn();
    } catch (err) {
      lastError = err;
      if (i < maxRetries - 1) {
        console.log(`Request failed, retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
};

// Basket API endpoints
export const basketAPI = {
  checkHealth: () => {
    console.log('Calling GET /health');
    return retryRequest(() => api.get('/health')).then(res => {
      console.log('GET /health response:', res.data);
      return res;
    }).catch(err => {
      console.error('GET /health error:', err.message);
      throw err;
    });
  },
  getAllBaskets: () => {
    console.log('Calling GET /baskets');
    return retryRequest(() => api.get('/baskets')).then(res => {
      console.log('GET /baskets response:', res.data);
      return res;
    }).catch(err => {
      console.error('GET /baskets error:', err.message, err.response?.data);
      throw err;
    });
  },
  populateBaskets: () => {
    console.log('Calling POST /populate to populate baskets with stocks');
    return api.post('/populate').then(res => {
      console.log('Populate response:', res.data);
      return res;
    }).catch(err => {
      console.error('Populate error:', err.message);
      throw err;
    });
  },
  getBasketById: (id) => api.get(`/baskets/${id}`),
  createBasket: (data) => api.post('/baskets', data),
  updateBasket: (id, data) => api.patch(`/baskets/${id}`, data),
  subscribeToBasket: (id, token) => api.post(`/baskets/${id}/subscribe`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  }),
  unsubscribeFromBasket: (id, token) => api.post(`/baskets/${id}/unsubscribe`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  }),
  rebalanceBasket: (id) => api.post(`/baskets/${id}/rebalance`),
  rebalanceAll: (token) => api.post('/baskets/rebalance-all', {}, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 120000, // 2 min — rebalancing all baskets takes time
  }),
  getRebalanceSummary: (id) => api.get(`/baskets/${id}/rebalance-summary`),
  getBasketStocks: (id) => api.get(`/baskets/${id}/stocks`),
  getLiveSummary: () => api.get('/baskets/live-summary'),
  getBasketNews: (id) => api.get(`/baskets/${id}/news`),
  getBasketBenchmark: (id, tf) => api.get(`/baskets/${id}/benchmark${tf ? `?tf=${tf}` : ''}`),
  getMarketIndices: () => api.get('/market/indices'),
  createCustomBasket: (data, token) => api.post('/baskets/create-custom', data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  deleteBasket: (id, token) => api.delete(`/baskets/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
};

export const authAPI = {
  signup: (name, email, password) => api.post('/auth/signup', { name, email, password }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: (token) => api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
};

export default api;
