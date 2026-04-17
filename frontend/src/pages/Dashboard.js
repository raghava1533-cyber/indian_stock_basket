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

const SECTORS = [
  { value: 'all',            label: 'All Sectors' },
  { value: 'tech',           label: 'Technology' },
  { value: 'finance',        label: 'Finance' },
  { value: 'healthcare',     label: 'Healthcare' },
  { value: 'renewable',      label: 'Renewable Energy' },
  { value: 'consumer',       label: 'Consumer Brands' },
  { value: 'infrastructure', label: 'Infrastructure' },
];
const MARKET_CAPS = [
  { value: 'all',      label: 'All Market Caps' },
  { value: 'largeCap', label: 'Large Cap' },
  { value: 'midCap',   label: 'Mid Cap' },
  { value: 'smallCap', label: 'Small Cap' },
];

function CreateBasketModal({ onClose, onCreated }) {
  const [sector, setSector] = useState('all');
  const [marketCap, setMarketCap] = useState('all');
  const [basketName, setBasketName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (sector === 'all' && marketCap === 'all') {
      setError('Please select at least a sector or market cap');
      return;
    }
    const token = localStorage.getItem('authToken');
    if (!token) { setError('Please log in to create a basket'); return; }
    setCreating(true);
    setError('');
    try {
      const res = await basketAPI.createCustomBasket({ sector, marketCap, name: basketName.trim() || undefined }, token);
      onCreated(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create basket. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="cb-modal-overlay" onClick={onClose}>
      <div className="cb-modal" onClick={e => e.stopPropagation()}>
        <div className="cb-modal-header">
          <h2 className="cb-modal-title">Create Custom Basket</h2>
          <button className="cb-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="cb-modal-body">
          <p className="cb-modal-sub">Pick a sector and market cap to generate a 15-stock basket scored by quality metrics.</p>
          <div className="cb-field">
            <label className="cb-label">Sector</label>
            <select className="cb-select" value={sector} onChange={e => setSector(e.target.value)}>
              {SECTORS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="cb-field">
            <label className="cb-label">Market Cap</label>
            <select className="cb-select" value={marketCap} onChange={e => setMarketCap(e.target.value)}>
              {MARKET_CAPS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="cb-field">
            <label className="cb-label">Basket Name <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}>(optional)</span></label>
            <input
              className="cb-input"
              type="text"
              placeholder="e.g. My Tech Portfolio"
              value={basketName}
              onChange={e => setBasketName(e.target.value)}
              maxLength={60}
            />
          </div>
          {error && <div className="cb-error">{error}</div>}
        </div>
        <div className="cb-modal-footer">
          <button className="cb-cancel-btn" onClick={onClose} disabled={creating}>Cancel</button>
          <button className="cb-create-btn" onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating basket…' : 'Create Basket →'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ baskets, onReload }) {
  const [loading, setLoading] = useState(true);
  const [liveSummary, setLiveSummary] = useState({});
  const [subscribedBaskets, setSubscribedBaskets] = useState(
    JSON.parse(localStorage.getItem('subscribedBaskets') || '[]')
  );
  const [message, setMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const email = localStorage.getItem('userEmail') || '';
  const token = localStorage.getItem('authToken') || '';

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

  const handleBasketCreated = (newBasket) => {
    setMessage(`"${newBasket.name.replace(/ \(\d+\)$/, '')}" basket created! Rebalancing takes a moment.`);
    setTimeout(() => setMessage(''), 5000);
    onReload();
  };

  if (loading) {
    return <div className="loading">Loading baskets...</div>;
  }

  return (
    <div className="dashboard">
      {showCreateModal && (
        <CreateBasketModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleBasketCreated}
        />
      )}
      <div className="sc-page-header">
        <div>
          <h1 className="sc-page-title">Discover Baskets</h1>
          <p className="sc-page-sub">Curated stock baskets, rebalanced monthly</p>
        </div>
        {token && (
          <button className="cb-open-btn" onClick={() => setShowCreateModal(true)}>
            + Create Basket
          </button>
        )}
      </div>

      {message && <div className="success">{message}</div>}

      <div className="sc-cards-grid">
        {baskets.map((basket) => {
          const meta = THEME_META[basket.theme] || THEME_META['Large Cap'];
          const stocks = basket.stocks || [];
          const totalValue = stocks.reduce((s, st) => s + ((st.currentPrice || 0) * (st.quantity || 1)), 0);

          const rawPct = liveSummary[basket._id];
          const basketDayChangePct = rawPct != null ? rawPct : null;
          const hasChange = basketDayChangePct != null;

          const isSubscribed = subscribedBaskets.includes(basket._id);
          const createdDate = basket.createdAt
            ? new Date(basket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : null;
          // Strip auto-appended timestamp from display name
          const displayName = basket.name.replace(/ \(\d{13}\)$/, '');

          return (
            <div key={basket._id} className={`sc-card${basket.isUserCreated ? ' sc-card-user' : ''}`}>
              <Link to={`/basket/${basket._id}`} className="sc-card-body">
                <div className="sc-card-top">
                  <div className="sc-icon" style={{ background: meta.bg, color: meta.color }}>
                    {meta.letter}
                  </div>
                  <div className="sc-card-title-block">
                    <div className="sc-card-name">{displayName}</div>
                    <div className="sc-card-by">{basket.isUserCreated ? 'by You' : 'by SmartBasket India'}</div>
                  </div>
                  {basket.isUserCreated && email && basket.createdBy === email && (
                    <button
                      className="sc-delete-btn"
                      title="Delete basket"
                      onClick={e => { e.preventDefault(); handleDelete(basket._id); }}
                    >✕</button>
                  )}
                </div>

                <div className="sc-card-stats">
                  <div className="sc-stat">
                    <div className="sc-stat-label">Min Investment</div>
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
                      {hasChange
                        ? `${basketDayChangePct >= 0 ? '+' : ''}${basketDayChangePct.toFixed(2)}%`
                        : '—'}
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
    </div>
  );
}

export default Dashboard;


function Dashboard({ baskets, onReload }) {
  const [loading, setLoading] = useState(true);
  const [liveSummary, setLiveSummary] = useState({});
  const [subscribedBaskets, setSubscribedBaskets] = useState(
    JSON.parse(localStorage.getItem('subscribedBaskets') || '[]')
  );
  const [message, setMessage] = useState('');
  const email = localStorage.getItem('userEmail') || '';

  useEffect(() => {
    setLoading(false);
  }, [baskets]);

  useEffect(() => {
    basketAPI.getLiveSummary()
      .then(res => setLiveSummary(res.data || {}))
      .catch(() => {});
  }, []);

  const handleSubscribe = async (basketId) => {
    if (!email) {
      alert('Please log in to subscribe to baskets');
      return;
    }

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
      </div>

      {message && <div className="success">{message}</div>}

      <div className="sc-cards-grid">
        {baskets.map((basket) => {
          const meta = THEME_META[basket.theme] || THEME_META['Large Cap'];
          const stocks = basket.stocks || [];
          const totalValue = stocks.reduce((s, st) => s + ((st.currentPrice || 0) * (st.quantity || 1)), 0);

          // Use live summary for accurate day change; fallback to stored data
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
                {/* Top: icon + name */}
                <div className="sc-card-top">
                  <div className="sc-icon" style={{ background: meta.bg, color: meta.color }}>
                    {meta.letter}
                  </div>
                  <div className="sc-card-title-block">
                    <div className="sc-card-name">{basket.name}</div>
                    <div className="sc-card-by">by SmartBasket India</div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="sc-card-stats">
                  <div className="sc-stat">
                    <div className="sc-stat-label">Min Investment</div>
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
                      {hasChange
                        ? `${basketDayChangePct >= 0 ? '+' : ''}${basketDayChangePct.toFixed(2)}%`
                        : '—'}
                    </div>
                  </div>
                </div>
              </Link>

              {/* Action row — outside the Link so button doesn't navigate */}
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
    </div>
  );
}

export default Dashboard;
