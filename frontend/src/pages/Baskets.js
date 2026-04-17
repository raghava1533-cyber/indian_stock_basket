import React, { useState, useEffect } from 'react';
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

function Baskets({ baskets, onReload }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localBaskets, setLocalBaskets] = useState(baskets || []);
  const [liveSummary, setLiveSummary] = useState({});
  const email = localStorage.getItem('userEmail') || '';
  const token = localStorage.getItem('authToken') || '';

  useEffect(() => {
    if (!baskets || baskets.length === 0) {
      loadBasketsDirectly();
    } else {
      setLocalBaskets(baskets);
    }
  }, [baskets]);

  useEffect(() => {
    basketAPI.getLiveSummary()
      .then(res => setLiveSummary(res.data || {}))
      .catch(() => {});
  }, []);

  const loadBasketsDirectly = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await basketAPI.getAllBaskets();
      setLocalBaskets(res.data);
    } catch (err) {
      setError(`Failed to load baskets: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (basketId) => {
    if (!window.confirm('Delete this basket? This cannot be undone.')) return;
    try {
      await basketAPI.deleteBasket(basketId, token);
      await loadBasketsDirectly();
      onReload();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete basket');
    }
  };

  return (
    <div className="baskets-page">
      <div className="sc-page-header">
        <div>
          <h1 className="sc-page-title">All Baskets</h1>
          <p className="sc-page-sub">Browse all curated and custom stock baskets</p>
        </div>
        <button onClick={loadBasketsDirectly} disabled={isLoading} className="btn">
          {isLoading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && <div className="error-banner"><strong>Error:</strong> {error}</div>}

      <div className="sc-cards-grid">
        {localBaskets && localBaskets.length > 0 ? (
          localBaskets.map((basket) => {
            const meta = THEME_META[basket.theme] || THEME_META['Large Cap'];
            const stocks = basket.stocks || [];
            const totalValue = stocks.reduce((s, st) => s + ((st.currentPrice || 0) * (st.quantity || 1)), 0);
            const rawPct = liveSummary[basket._id];
            const basketDayChangePct = rawPct != null ? rawPct : null;
            const hasChange = basketDayChangePct != null;
            const displayName = basket.name.replace(/ \(\d{13}\)$/, '');
            const createdDate = basket.createdAt
              ? new Date(basket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : null;
            const isOwner = basket.isUserCreated && basket.createdBy === email;

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
                    {isOwner && (
                      <button className="sc-delete-btn" title="Delete basket"
                        onClick={e => { e.preventDefault(); handleDelete(basket._id); }}>✕</button>
                    )}
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
                  <span className="sc-explore-link">View →</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <p>No baskets available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Baskets;
