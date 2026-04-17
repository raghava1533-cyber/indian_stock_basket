import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { basketAPI } from '../services/api';
import '../styles/BasketGrid.css';

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>All Stock Baskets</h1>
          <p className="subtitle">Choose from our curated collection of stock baskets</p>
        </div>
        <button 
          onClick={handleRefresh} 
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            backgroundColor: isLoading ? '#ff9800' : '#1e88e5',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: isLoading ? 'bold' : 'normal',
            opacity: isLoading ? 1 : 0.9,
            transform: isLoading ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 0.2s ease'
          }}
        >
          {isLoading ? '⏳ Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px',
          border: '1px solid #ef5350'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="basket-grid">
        {localBaskets && localBaskets.length > 0 ? (
          localBaskets.map((basket) => (
            <Link to={`/basket/${basket._id}`} key={basket._id} className="basket-card-link">
              <div className="basket-card">
                <div className="basket-card-header">
                  <h3>{basket.name}</h3>
                  <span className={`badge badge-${basket.theme.toLowerCase().replace(/\s+/g, '-')}`}>
                    {basket.theme}
                  </span>
                </div>
                <p className="basket-description">{basket.description}</p>
                <div className="basket-stats">
                  <div className="stat">
                    <span className="stat-label">Stocks</span>
                    <span className="stat-value">{basket.stocks?.length || 0}/10</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Subscribers</span>
                    <span className="stat-value">{basket.subscribers?.length || 0}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Category</span>
                    <span className="stat-value">{basket.category}</span>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={(e) => e.preventDefault()}>
                  View Details →
                </button>
              </div>
            </Link>
          ))
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
