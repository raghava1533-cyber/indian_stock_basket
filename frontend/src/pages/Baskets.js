import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/BasketGrid.css';

function Baskets({ baskets, onReload }) {
  const handleRefresh = () => {
    onReload();
  };

  return (
    <div className="baskets-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>All Stock Baskets</h1>
          <p className="subtitle">Choose from our curated collection of stock baskets</p>
        </div>
        <button onClick={handleRefresh} style={{
          padding: '10px 20px',
          backgroundColor: '#1e88e5',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '14px'
        }}>
          🔄 Refresh
        </button>
      </div>

      <div className="basket-grid">
        {baskets && baskets.length > 0 ? (
          baskets.map((basket) => (
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
