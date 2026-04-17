import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { basketAPI } from '../services/api';

const THEME_META = {
  'Large Cap':     { bg: '#E8F0FE', color: '#1A5FC8', letter: 'LC' },
  'Mid Cap':       { bg: '#F3E8FD', color: '#7B2FBE', letter: 'MC' },
  'Small Cap':     { bg: '#FEF0E8', color: '#C2550A', letter: 'SC' },
  'Technology':    { bg: '#E8F8F5', color: '#0E7A62', letter: 'TE' },
  'Finance':       { bg: '#FDE8EE', color: '#B0184E', letter: 'FI' },
  'Healthcare':    { bg: '#EAF7EC', color: '#1A7A30', letter: 'HC' },
  'Renewable':     { bg: '#EAF7EC', color: '#1A7A30', letter: 'RE' },
  'Consumer':      { bg: '#FEF6E8', color: '#B06B0A', letter: 'CB' },
  'Infrastructure':{ bg: '#EEF0FE', color: '#3A3FBE', letter: 'IN' },
};

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
      <div className="sc-page-header">
        <div>
          <h1 className="sc-page-title">Discover Baskets</h1>
          <p className="sc-page-sub">Curated stock baskets, rebalanced monthly</p>
        </div>
        <div className="sc-email-row">
          <input
            type="email"
            className="sc-email-input"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { if (email) { localStorage.setItem('userEmail', email); setMessage('Email saved!'); setTimeout(() => setMessage(''), 2000); } }}
          >Save</button>
        </div>
      </div>

      {message && <div className="success">{message}</div>}

      <div className="sc-cards-grid">
        {baskets.map((basket) => {
          const meta = THEME_META[basket.theme] || THEME_META['Large Cap'];
          const totalValue = basket.stocks?.reduce((s, st) => s + ((st.currentPrice || 0) * (st.quantity || 1)), 0) || 0;
          const isSubscribed = subscribedBaskets.includes(basket._id);
          const createdDate = basket.createdAt ? new Date(basket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

          return (
            <div key={basket._id} className="sc-card">
              <Link to={`/basket/${basket._id}`} className="sc-card-body">
                <div className="sc-card-top">
                  <div className="sc-icon" style={{ background: meta.bg, color: meta.color }}>
                    {meta.letter}
                  </div>
                  <div className="sc-card-title-block">
                    <div className="sc-card-name">{basket.name}</div>
                    <div className="sc-card-by">by SmartBasket India</div>
                  </div>
                </div>

                <div className="sc-card-stats">
                  <div className="sc-stat">
                    <div className="sc-stat-label">Min Investment</div>
                    <div className="sc-stat-val green">₹{totalValue > 0 ? totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—'}</div>
                  </div>
                  <div className="sc-stat">
                    <div className="sc-stat-label">Stocks</div>
                    <div className="sc-stat-val">{basket.stocks?.length || 0}</div>
                  </div>
                  <div className="sc-stat">
                    <div className="sc-stat-label">Subscribers</div>
                    <div className="sc-stat-val">{basket.subscribers?.length || 0}</div>
                  </div>
                  <button
                    className={`sc-subscribe-btn${isSubscribed ? ' subscribed' : ''}`}
                    onClick={(e) => { e.preventDefault(); isSubscribed ? handleUnsubscribe(basket._id) : handleSubscribe(basket._id); }}
                  >
                    {isSubscribed ? '✓ Subscribed' : 'Subscribe'}
                  </button>
                </div>
              </Link>
              <div className="sc-card-footer">
                {createdDate ? `Created ${createdDate}` : `Theme: ${basket.theme}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Dashboard;
