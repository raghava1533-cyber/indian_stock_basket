import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { basketAPI } from '../services/api';

const THEME_META = {
  'Large Cap':      { bg: '#E8F0FE', color: '#1A5FC8', letter: 'LC' },
  'Mid Cap':        { bg: '#F3E8FD', color: '#7B2FBE', letter: 'MC' },
  'Small Cap':      { bg: '#FEF0E8', color: '#C2550A', letter: 'SC' },
  'Technology':     { bg: '#E8F8F5', color: '#0E7A62', letter: 'TE' },
  'Finance':        { bg: '#FDE8EE', color: '#B0184E', letter: 'FI' },
  'Healthcare':     { bg: '#EAF7EC', color: '#1A7A30', letter: 'HC' },
  'Renewable':      { bg: '#EAF7EC', color: '#1A7A30', letter: 'RE' },
  'Consumer':       { bg: '#FEF6E8', color: '#B06B0A', letter: 'CB' },
  'Infrastructure': { bg: '#EEF0FE', color: '#3A3FBE', letter: 'IN' },
};

function Dashboard({ baskets, onReload }) {
  const [loading, setLoading] = useState(true);
  const [liveSummary, setLiveSummary] = useState({});
  const [subscribedBaskets, setSubscribedBaskets] = useState(
    JSON.parse(localStorage.getItem('subscribedBaskets') || '[]')
  );
  const [message, setMessage] = useState('');
  const email = localStorage.getItem('userEmail') || '';

  useEffect(() => { setLoading(false); }, [baskets]);

  useEffect(() => {
    basketAPI.getLiveSummary()
      .then(res => setLiveSummary(res.data || {}))
      .catch(() => {});
  }, []);

  const handleSubscribe = async (basketId) => {
    if (!email) { alert('Please log in to subscribe to baskets'); return; }
    try {
      await basketAPI.subscribeToBasket(basketId, email);
      const newSubscribed = [...subscribedBaskets, basketId];
      setSubscribedBaskets(newSubscribed);
      localStorage.setItem('subscribedBaskets', JSON.stringify(newSubscribed));
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

  const handleDelete = async (basketId) => {
    const token = localStorage.getItem('authToken') || '';
    if (!window.confirm('Delete this basket? This cannot be undone.')) return;
    try {
      await basketAPI.deleteBasket(basketId, token);
      setMessage('Basket deleted');
      setTimeout(() => setMessage(''), 2000);
      onReload();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete basket');
    }
  };

  if (loading) {
    return <div className="loading">Loading baskets...</div>;
  }

  // Show only default (non-user-created) baskets on Dashboard
  const defaultBaskets = baskets.filter(b => !b.isUserCreated);
  // Show user-created baskets separately
  const userBaskets = baskets.filter(b => b.isUserCreated && b.createdBy === email);

  return (
    <div className="dashboard">
      <div className="sc-page-header">
        <div>
          <h1 className="sc-page-title">Dashboard</h1>
          <p className="sc-page-sub">Curated stock baskets, rebalanced monthly</p>
        </div>
      </div>

      {message && <div className="success">{message}</div>}

      <div className="sc-cards-grid">
        {defaultBaskets.map((basket) => {
          const meta = THEME_META[basket.theme] || THEME_META['Large Cap'];
          const stocks = basket.stocks || [];
          const n = stocks.length || 1;
          const totalValue = stocks.reduce((s, st) => {
            const price = st.currentPrice || 1;
            const qty = Math.max(1, Math.floor(((st.weight || (100 / n)) / 100 * 100000) / price));
            return s + price * qty;
          }, 0);
          const rawPct = liveSummary[basket._id];
          const basketDayChangePct = rawPct != null ? rawPct : null;
          const hasChange = basketDayChangePct != null;
          const isSubscribed = subscribedBaskets.includes(basket._id);
          const createdDate = basket.createdAt
            ? new Date(basket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : null;

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
                    <div className="sc-stat-label">Min. Investment</div>
                    <div className="sc-stat-val accent">
                      ₹{totalValue > 0 ? totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—'}
                    </div>
                  </div>
                  <div className="sc-stat">
                    <div className="sc-stat-label">Stocks</div>
                    <div className="sc-stat-val">{stocks.length}</div>
                  </div>
                  <div className="sc-stat">
                    <div className="sc-stat-label">Today</div>
                    <div className={`sc-stat-val${hasChange ? (basketDayChangePct >= 0 ? ' green' : ' red') : ''}`}>
                      {hasChange ? `${basketDayChangePct >= 0 ? '+' : ''}${basketDayChangePct.toFixed(2)}%` : '—'}
                    </div>
                  </div>
                </div>
              </Link>
              <div className="sc-card-action">
                <span className="sc-card-date">{createdDate ? `Since ${createdDate}` : ''}</span>
                <button
                  className={`sc-subscribe-btn${isSubscribed ? ' subscribed' : ''}`}
                  onClick={() => { isSubscribed ? handleUnsubscribe(basket._id) : handleSubscribe(basket._id); }}
                >
                  {isSubscribed ? '✓ Subscribed' : '+ Subscribe'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── User-created baskets section ── */}
      {userBaskets.length > 0 && (
        <>
          <div className="sc-page-header" style={{ marginTop: '40px' }}>
            <div>
              <h2 className="sc-page-title" style={{ fontSize: '20px' }}>My Custom Baskets</h2>
              <p className="sc-page-sub">Baskets you've created</p>
            </div>
          </div>
          <div className="sc-cards-grid">
            {userBaskets.map((basket) => {
              const meta = THEME_META[basket.theme] || THEME_META['Large Cap'];
              const stocks = basket.stocks || [];
              const n = stocks.length || 1;
              const totalValue = stocks.reduce((s, st) => {
                const price = st.currentPrice || 1;
                const qty = Math.max(1, Math.floor(((st.weight || (100 / n)) / 100 * 100000) / price));
                return s + price * qty;
              }, 0);
              const displayName = basket.name.replace(/ \(\d{13}\)$/, '');
              const rawPct = liveSummary[basket._id];
              const basketDayChangePct = rawPct != null ? rawPct : null;
              const hasChange = basketDayChangePct != null;
              return (
                <div key={basket._id} className="sc-card sc-card-user">
                  <Link to={`/basket/${basket._id}`} className="sc-card-body">
                    <div className="sc-card-top">
                      <div className="sc-icon" style={{ background: meta.bg, color: meta.color }}>{meta.letter}</div>
                      <div className="sc-card-title-block">
                        <div className="sc-card-name">{displayName}</div>
                        <div className="sc-card-by">by You</div>
                      </div>
                      <button className="sc-delete-btn" title="Delete basket"
                        onClick={e => { e.preventDefault(); handleDelete(basket._id); }}>✕</button>
                    </div>
                    <div className="sc-card-stats">
                      <div className="sc-stat">
                        <div className="sc-stat-label">Min. Investment</div>
                        <div className="sc-stat-val accent">₹{totalValue > 0 ? totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—'}</div>
                      </div>
                      <div className="sc-stat">
                        <div className="sc-stat-label">Stocks</div>
                        <div className="sc-stat-val">{stocks.length}</div>
                      </div>
                      <div className="sc-stat">
                        <div className="sc-stat-label">Today</div>
                        <div className={`sc-stat-val${hasChange ? (basketDayChangePct >= 0 ? ' green' : ' red') : ''}`}>
                          {hasChange ? `${basketDayChangePct >= 0 ? '+' : ''}${basketDayChangePct.toFixed(2)}%` : '—'}
                        </div>
                      </div>
                    </div>
                  </Link>
                  <div className="sc-card-action">
                    <span className="sc-card-date"></span>
                    <Link to={`/basket/${basket._id}`} className="sc-explore-link">View →</Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;

