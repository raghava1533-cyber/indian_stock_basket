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

  // Auto-load baskets when component mounts or if baskets prop is empty
  useEffect(() => {
    if (!baskets || baskets.length === 0) {
      console.log('Baskets page mounted - baskets empty, triggering load');
      loadBasketsDirectly();
    } else {
      setLocalBaskets(baskets);
    }
  }, [baskets]);

  const loadBasketsDirectly = async () => {
    setIsLoading(true);
    setError(null);
    console.log('Loading baskets directly from API');
    try {
      const res = await basketAPI.getAllBaskets();
      console.log('Baskets loaded directly:', res.data);
      setLocalBaskets(res.data);
    } catch (err) {
      console.error('Direct load failed:', err);
      setError(`Failed to load baskets: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    console.log('=== REFRESH CLICKED ===');
    try {
      // First check if API is reachable
      console.log('Checking API health...');
      await basketAPI.checkHealth();
      console.log('API health check passed');

      // Then load baskets
      console.log('Loading baskets...');
      await onReload();
      console.log('Baskets loaded successfully');
      await loadBasketsDirectly(); // Also load locally to be sure
    } catch (err) {
      console.error('Error during refresh:', err);
      let errorMsg = 'Failed to load baskets';
      
      if (err.response?.status === 404) {
        errorMsg = `API route not found (404). Backend may be restarting. Retrying...`;
        console.log('Got 404, will retry automatically');
      } else if (err.response?.data?.message) {
        errorMsg = `API Error: ${err.response.data.message}`;
      } else if (err.message) {
        errorMsg = `Connection Error: ${err.message}`;
      }
      
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="baskets-page">
      <div className="sc-page-header">
        <div>
          <h1 className="sc-page-title">Explore Baskets</h1>
          <p className="sc-page-sub">Choose from our curated collection of stock baskets</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className={`btn${isLoading ? ' btn-disabled' : ''}`}
        >
          {isLoading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="sc-cards-grid">
        {localBaskets && localBaskets.length > 0 ? (
          localBaskets.map((basket) => {
            const meta = THEME_META[basket.theme] || THEME_META['Large Cap'];
            const stocks = basket.stocks || [];
            const totalValue = stocks.reduce((s, st) => s + ((st.currentPrice || 0) * (st.quantity || 1)), 0);
            const basketDayChangePct = totalValue > 0
              ? stocks.reduce((sum, st) => {
                  const w = ((st.currentPrice || 0) * (st.quantity || 1)) / totalValue;
                  return sum + (st.dayChangePercent != null ? st.dayChangePercent * w : 0);
                }, 0)
              : null;
            const hasChange = stocks.some(st => st.dayChangePercent != null);
            const createdDate = basket.createdAt
              ? new Date(basket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : null;

            return (
              <Link to={`/basket/${basket._id}`} key={basket._id} className="sc-card-link">
                <div className="sc-card">
                  <div className="sc-card-body">
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
                  </div>
                  <div className="sc-card-action">
                    <span className="sc-card-date">{createdDate ? `Since ${createdDate}` : ''}</span>
                    <span className="sc-explore-link">View →</span>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="empty-state">
            <p>No baskets available yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Baskets;
