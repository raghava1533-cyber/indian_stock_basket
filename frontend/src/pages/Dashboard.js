import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { basketAPI } from '../services/api';

function Dashboard({ baskets, onReload }) {
  const [loading, setLoading] = useState(true);
  const [subscribedBaskets, setSubscribedBaskets] = useState(
    JSON.parse(localStorage.getItem('subscribedBaskets') || '[]')
  );
  const [email, setEmail] = useState(localStorage.getItem('userEmail') || '');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setLoading(false);
  }, [baskets]);

  const handleSubscribe = async (basketId) => {
    if (!email) {
      alert('Please enter your email first');
      return;
    }

    try {
      await basketAPI.subscribeToBasket(basketId, email);
      const newSubscribed = [...subscribedBaskets, basketId];
      setSubscribedBaskets(newSubscribed);
      localStorage.setItem('subscribedBaskets', JSON.stringify(newSubscribed));
      localStorage.setItem('userEmail', email);
      setMessage('Successfully subscribed to basket notifications!');
      setTimeout(() => setMessage(''), 3000);
      onReload();
    } catch (error) {
      console.error('Error subscribing:', error);
      alert('Error subscribing to basket');
    }
  };

  const handleUnsubscribe = async (basketId) => {
    try {
      await basketAPI.unsubscribeFromBasket(basketId, email);
      const newSubscribed = subscribedBaskets.filter(id => id !== basketId);
      setSubscribedBaskets(newSubscribed);
      localStorage.setItem('subscribedBaskets', JSON.stringify(newSubscribed));
      setMessage('Successfully unsubscribed from basket');
      setTimeout(() => setMessage(''), 3000);
      onReload();
    } catch (error) {
      console.error('Error unsubscribing:', error);
      alert('Error unsubscribing from basket');
    }
  };

  if (loading) {
    return <div className="loading">Loading baskets...</div>;
  }

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">📊 Stock Baskets</h1>

      {message && <div className="success">{message}</div>}

      <div style={{ marginBottom: '30px', padding: '20px', background: '#f5f5f5', borderRadius: '10px' }}>
        <h3 style={{ marginBottom: '15px' }}>Receive Rebalance Notifications</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '5px',
              fontSize: '14px'
            }}
          />
          <button
            onClick={() => {
              if (email) {
                localStorage.setItem('userEmail', email);
                alert('Email saved! You can now subscribe to baskets.');
              }
            }}
            className="btn btn-secondary"
          >
            Save Email
          </button>
        </div>
      </div>

      <div className="baskets-grid">
        {baskets.map((basket) => (
          <div key={basket._id} className="basket-card">
            <div className="basket-header">
              <h2 className="basket-name">{basket.name}</h2>
              <span className="basket-theme">{basket.theme}</span>
            </div>

            <p className="basket-description">{basket.description}</p>

            <div className="basket-stats">
              <div className="stat-item">
                <div className="stat-label">Stocks in Basket</div>
                <div className="stat-value">{basket.stocks?.length || 0}/10</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Subscribers</div>
                <div className="stat-value">{basket.subscribers?.length || 0}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Last Rebalanced</div>
                <div className="stat-value">
                  {basket.lastRebalanceDate
                    ? new Date(basket.lastRebalanceDate).toLocaleDateString()
                    : 'Never'}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Next Rebalance</div>
                <div className="stat-value">
                  {basket.nextRebalanceDate
                    ? new Date(basket.nextRebalanceDate).toLocaleDateString()
                    : 'Not set'}
                </div>
              </div>
            </div>

            <div className="basket-actions">
              <Link to={`/basket/${basket._id}`} className="btn btn-primary">
                View Details
              </Link>
              {subscribedBaskets.includes(basket._id) ? (
                <button
                  onClick={() => handleUnsubscribe(basket._id)}
                  className="btn btn-danger"
                >
                  Unsubscribe
                </button>
              ) : (
                <button
                  onClick={() => handleSubscribe(basket._id)}
                  className="btn btn-secondary"
                >
                  Subscribe
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
