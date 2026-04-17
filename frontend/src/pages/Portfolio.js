import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { basketAPI } from '../services/api';

function Portfolio() {
  const [baskets, setBaskets] = useState([]);
  const [loading, setLoading] = useState(true);
  const email = localStorage.getItem('userEmail') || '';
  const subscribedIds = JSON.parse(localStorage.getItem('subscribedBaskets') || '[]');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await basketAPI.getAllBaskets();
        setBaskets(res.data);
      } catch (err) {
        console.error('Error loading baskets:', err);
      }
      setLoading(false);
    };
    load();
  }, []);

  const subscribedBaskets = baskets.filter(b =>
    subscribedIds.includes(b._id) || b.subscribers?.includes(email)
  );
  const totalStocks = subscribedBaskets.reduce((s, b) => s + (b.stocks?.length || 0), 0);
  const totalShares = subscribedBaskets.reduce((s, b) => s + (b.stocks?.reduce((ss, st) => ss + (st.quantity || 1), 0) || 0), 0);
  const totalValue = subscribedBaskets.reduce((s, b) => s + (b.stocks?.reduce((ss, st) => ss + ((st.currentPrice || 0) * (st.quantity || 1)), 0) || 0), 0);

  if (loading) return <div className="loading">Loading portfolio...</div>;

  return (
    <div className="portfolio-page">
      <h1>My Portfolio</h1>
      <p className="subtitle">Your subscribed baskets, holdings, and broker connections</p>

      <div className="portfolio-container">
        <div className="portfolio-section">
          <h2>📊 Portfolio Overview</h2>
          <div className="overview-grid">
            <div className="overview-card">
              <div className="overview-label">Subscribed Baskets</div>
              <div className="overview-value">{subscribedBaskets.length}</div>
              <div className="overview-description">out of {baskets.length} available</div>
            </div>
            <div className="overview-card" style={{ background: 'linear-gradient(135deg, #4caf50, #2e7d32)' }}>
              <div className="overview-label">Total Stocks</div>
              <div className="overview-value">{totalStocks}</div>
              <div className="overview-description">{totalShares} total shares</div>
            </div>
            <div className="overview-card" style={{ background: 'linear-gradient(135deg, #ff9800, #e65100)' }}>
              <div className="overview-label">Portfolio Value</div>
              <div className="overview-value">₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              <div className="overview-description">across all baskets</div>
            </div>
            <div className="overview-card" style={{ background: 'linear-gradient(135deg, #2196F3, #0d47a1)' }}>
              <div className="overview-label">Notifications</div>
              <div className="overview-value">{email ? '✓ ON' : '✗ OFF'}</div>
              <div className="overview-description">{email || 'Set email on Dashboard'}</div>
            </div>
          </div>
        </div>

        <div className="portfolio-section">
          <h2>💼 Subscribed Baskets</h2>
          {subscribedBaskets.length > 0 ? (
            <div className="subscribed-grid">
              {subscribedBaskets.map(b => {
                const bValue = b.stocks?.reduce((s, st) => s + ((st.currentPrice || 0) * (st.quantity || 1)), 0) || 0;
                return (
                  <Link to={`/basket/${b._id}`} key={b._id} style={{ textDecoration: 'none' }}>
                    <div className="subscribed-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ color: '#333' }}>{b.name}</h4>
                        <span style={{ background: '#667eea', color: 'white', padding: '3px 10px', borderRadius: '12px', fontSize: '11px' }}>{b.theme}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '12px' }}>
                        <div><div style={{ fontSize: '11px', color: '#999' }}>Stocks</div><div style={{ fontWeight: '600' }}>{b.stocks?.length || 0}</div></div>
                        <div><div style={{ fontSize: '11px', color: '#999' }}>Shares</div><div style={{ fontWeight: '600' }}>{b.stocks?.reduce((s, st) => s + (st.quantity || 1), 0) || 0}</div></div>
                        <div><div style={{ fontSize: '11px', color: '#999' }}>Value</div><div style={{ fontWeight: '600' }}>₹{bValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div></div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#667eea', marginTop: '10px' }}>
                        Next rebalance: {b.nextRebalanceDate ? new Date(b.nextRebalanceDate).toLocaleDateString() : 'TBD'}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="empty-message">
              <p>You haven't subscribed to any baskets yet.</p>
              <p>Go to <Link to="/baskets"><strong>Baskets</strong></Link> to subscribe and start receiving rebalance notifications!</p>
            </div>
          )}
        </div>

        <div className="portfolio-section">
          <h2>🏦 Broker Connection</h2>
          <p style={{ color: '#666', marginBottom: '15px' }}>Connect to your broker to auto-execute rebalance orders.</p>
          <div className="broker-list">
            {['Zerodha (Kite)', 'Groww', 'Angel One', 'Upstox', '5paisa'].map((name, i) => (
              <div key={i} className="broker-row">
                <span style={{ fontWeight: '600' }}>{name}</span>
                <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 14px' }} disabled={i > 0}>
                  {i === 0 ? 'Connect' : 'Coming Soon'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="portfolio-section">
          <h2>📈 All Holdings</h2>
          {subscribedBaskets.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="stocks-table">
                <thead>
                  <tr>
                    <th>Basket</th>
                    <th>Stock</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Value</th>
                    <th>52W Range</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribedBaskets.flatMap(b =>
                    (b.stocks || []).filter(s => s.status !== 'removed').map((s, i) => (
                      <tr key={`${b._id}-${i}`}>
                        <td style={{ fontSize: '12px', color: '#667eea' }}>{b.name}</td>
                        <td className="stock-ticker">{s.companyName || s.ticker?.replace('.NS', '')}</td>
                        <td style={{ fontWeight: 'bold' }}>{s.quantity || 1}</td>
                        <td>₹{s.currentPrice?.toFixed(2) || '—'}</td>
                        <td>₹{((s.currentPrice || 0) * (s.quantity || 1)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                        <td style={{ fontSize: '12px' }}>
                          <span style={{ color: '#f44336' }}>₹{s.low52Week?.toFixed(0) || '—'}</span>
                          {' - '}
                          <span style={{ color: '#4caf50' }}>₹{s.high52Week?.toFixed(0) || '—'}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-message">
              <p>Subscribe to baskets to see your holdings here.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .portfolio-page { padding: 20px; }
        .portfolio-page h1 { font-size: 2rem; margin-bottom: 5px; color: #333; }
        .subtitle { color: #666; font-size: 1.05rem; margin-bottom: 30px; }
        .portfolio-container { max-width: 1200px; }
        .portfolio-section { background: white; border-radius: 12px; padding: 25px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .portfolio-section h2 { font-size: 1.4rem; margin-bottom: 20px; color: #333; }
        .overview-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; }
        .overview-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; }
        .overview-label { font-size: 0.8rem; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; }
        .overview-value { font-size: 2.2rem; font-weight: bold; margin: 8px 0; }
        .overview-description { font-size: 0.85rem; opacity: 0.85; }
        .subscribed-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; }
        .subscribed-card { background: #f9f9ff; border: 1px solid #e0e0f0; padding: 18px; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
        .subscribed-card:hover { border-color: #667eea; box-shadow: 0 4px 12px rgba(102,126,234,0.15); }
        .broker-list { display: flex; flex-direction: column; gap: 10px; }
        .broker-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #f5f5f5; border-radius: 8px; }
        .empty-message { text-align: center; padding: 30px; background: #f9f9f9; border-radius: 8px; color: #666; }
        .empty-message p { margin: 10px 0; }
      `}</style>
    </div>
  );
}

export default Portfolio;
