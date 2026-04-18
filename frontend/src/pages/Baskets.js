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
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [rebalanceResult, setRebalanceResult] = useState(null);
  const [error, setError] = useState(null);
  const [localBaskets, setLocalBaskets] = useState(baskets || []);
  const [liveSummary, setLiveSummary] = useState({});
  const [country, setCountry] = useState('IN');
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

  const handleRebalanceAll = async () => {
    if (!token) {
      alert('Please log in to rebalance your baskets');
      return;
    }
    setIsRebalancing(true);
    setRebalanceResult(null);
    try {
      const res = await basketAPI.rebalanceAll(token);
      setRebalanceResult(res.data);
      // Reload baskets to show updated data
      await loadBasketsDirectly();
      if (onReload) onReload();
    } catch (err) {
      setError(err.response?.data?.message || 'Rebalance failed');
    } finally {
      setIsRebalancing(false);
    }
  };

  const filteredBaskets = localBaskets.filter(b => {
    if ((b.country || 'IN') !== country) return false;
    if (b.isUserCreated && b.createdBy !== email) return false;
    return true;
  });
  const currencySymbol = country === 'US' ? '$' : '₹';
  const investBase = country === 'US' ? 1000 : 100000;
  const locale = country === 'US' ? 'en-US' : 'en-IN';

  return (
    <div className="baskets-page">
      <div className="sc-page-header">
        <div>
          <h1 className="sc-page-title">All Baskets</h1>
          <p className="sc-page-sub">Browse all curated and custom stock baskets</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div className="country-toggle">
            <button className={`country-btn${country === 'IN' ? ' active' : ''}`} onClick={() => setCountry('IN')}>🇮🇳 India</button>
            <button className={`country-btn${country === 'US' ? ' active' : ''}`} onClick={() => setCountry('US')}>🇺🇸 USA</button>
          </div>
          {token && (
            <button onClick={handleRebalanceAll} disabled={isRebalancing} className="btn btn-accent"
              title="Rebalance all your baskets (every 30 days)">
              {isRebalancing ? 'Rebalancing…' : '⟳ Rebalance All'}
            </button>
          )}
          <button onClick={loadBasketsDirectly} disabled={isLoading} className="btn">
            {isLoading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && <div className="error-banner"><strong>Error:</strong> {error}</div>}

      {rebalanceResult && (
        <div className="rebalance-result-banner">
          <div className="rebalance-result-header">
            <strong>{rebalanceResult.message}</strong>
            <button className="rebalance-result-close" onClick={() => setRebalanceResult(null)}>✕</button>
          </div>
          {rebalanceResult.results && rebalanceResult.results.length > 0 && (
            <div className="rebalance-result-list">
              {rebalanceResult.results.map((r, i) => (
                <div key={i} className={`rebalance-result-item ${r.status}`}>
                  <span className="rebalance-result-name">{r.name}</span>
                  <span className={`rebalance-result-status ${r.status}`}>
                    {r.status === 'rebalanced' ? '✓ Rebalanced' :
                     r.status === 'skipped' ? `⏭ ${r.message}` :
                     `✗ ${r.message}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="sc-cards-grid">
        {filteredBaskets && filteredBaskets.length > 0 ? (
          filteredBaskets.map((basket) => {
            const meta = THEME_META[basket.theme] || THEME_META['Large Cap'];
            const stocks = basket.stocks || [];
            const n = stocks.length || 1;
            const totalValue = stocks.reduce((s, st) => {
              const price = st.currentPrice || 1;
              const qty = Math.max(1, Math.floor(((st.weight || (100 / n)) / 100 * investBase) / price));
              return s + price * qty;
            }, 0);
            const rawPct = liveSummary[basket._id];
            const basketDayChangePct = rawPct != null ? rawPct : null;
            const hasChange = basketDayChangePct != null;
            const displayName = basket.name.replace(/ \(\d{13}\)$/, '');
            const createdDate = basket.createdAt
              ? new Date(basket.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
              : null;
            const isOwner = basket.isUserCreated && basket.createdBy === email;
            const byLabel = (basket.country || 'IN') === 'US' ? 'by SmartBasket US' : 'by SmartBasket India';

            // Since-launch return using actual stored buyPrice vs currentPrice
            const returnPct = (() => {
              const active = stocks.filter(s => s.status !== 'removed' && s.buyPrice > 0 && s.currentPrice > 0);
              if (active.length === 0) return null;
              const inv = active.reduce((s, st) => s + st.buyPrice * (st.quantity || 1), 0);
              const cur = active.reduce((s, st) => s + st.currentPrice * (st.quantity || 1), 0);
              return inv > 0 ? ((cur - inv) / inv * 100) : null;
            })();

            return (
              <div key={basket._id} className={`sc-card${basket.isUserCreated ? ' sc-card-user' : ''}`}>
                <Link to={`/basket/${basket._id}`} className="sc-card-body">
                  <div className="sc-card-top">
                    <div className="sc-icon" style={{ background: meta.bg, color: meta.color }}>
                      {meta.letter}
                    </div>
                    <div className="sc-card-title-block">
                      <div className="sc-card-name">{displayName}</div>
                      <div className="sc-card-by">{basket.isUserCreated ? 'by You' : byLabel}</div>
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
                        {currencySymbol}{totalValue > 0 ? totalValue.toLocaleString(locale, { maximumFractionDigits: 0 }) : '—'}
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
                    <div className="sc-stat">
                      <div className="sc-stat-label">Returns</div>
                      <div className={`sc-stat-val${returnPct != null ? (returnPct >= 0 ? ' green' : ' red') : ''}`}>
                        {returnPct != null ? `${returnPct >= 0 ? '+' : ''}${returnPct.toFixed(1)}%` : '—'}
                      </div>
                    </div>
                  </div>
                </Link>
                <div className="sc-card-action">
                  <span className="sc-card-date">{createdDate ? `Since ${createdDate}` : ''}</span>
                  <Link to={`/basket/${basket._id}`} className="sc-explore-link">View →</Link>
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
