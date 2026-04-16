import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { basketAPI } from '../services/api';

function BasketDetail({ onReload }) {
  const { id } = useParams();
  const [basket, setBasket] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [message, setMessage] = useState('');
  const [rebalanceHistory, setRebalanceHistory] = useState([]);

  useEffect(() => {
    loadBasketData();
  }, [id]);

  const loadBasketData = async () => {
    try {
      setLoading(true);
      const basketRes = await basketAPI.getBasketById(id);
      setBasket(basketRes.data);

      const stocksRes = await basketAPI.getBasketStocks(id);
      setStocks(stocksRes.data);

      const summaryRes = await basketAPI.getRebalanceSummary(id);
      setRebalanceHistory(summaryRes.data.recentChanges);

      setLoading(false);
    } catch (error) {
      console.error('Error loading basket:', error);
      setLoading(false);
    }
  };

  const handleRebalance = async () => {
    if (!window.confirm('Are you sure you want to trigger a manual rebalance?')) return;

    try {
      const result = await basketAPI.rebalanceBasket(id);
      setMessage(`Basket rebalanced successfully! ${result.data.emailsSent} emails sent.`);
      setTimeout(() => setMessage(''), 3000);
      loadBasketData();
      onReload();
    } catch (error) {
      console.error('Error rebalancing:', error);
      alert('Error rebalancing basket');
    }
  };

  if (loading) {
    return <div className="loading">Loading basket details...</div>;
  }

  if (!basket) {
    return (
      <div className="error">
        Basket not found. <Link to="/">Back to Dashboard</Link>
      </div>
    );
  }

  const addedStocks = stocks.filter(s => s.status === 'active' && new Date(s.addedDate) > new Date(basket.lastRebalanceDate || 0));
  const removedStocks = stocks.filter(s => s.status === 'removed');
  const partialStocks = stocks.filter(s => s.status === 'partial');

  return (
    <div className="basket-detail">
      {message && <div className="success">{message}</div>}

      <div className="basket-detail-header">
        <div>
          <h1 className="basket-detail-title">{basket.name}</h1>
          <p style={{ color: '#666', marginTop: '5px' }}>{basket.description}</p>
        </div>
        <button onClick={handleRebalance} className="btn btn-primary" style={{ height: 'fit-content' }}>
          🔄 Rebalance Now
        </button>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'stocks' ? 'active' : ''}`}
          onClick={() => setActiveTab('stocks')}
        >
          Stocks ({stocks.length})
        </button>
        <button
          className={`tab ${activeTab === 'changes' ? 'active' : ''}`}
          onClick={() => setActiveTab('changes')}
        >
          Changes
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
        <button
          className={`tab ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          About
        </button>
      </div>

      {/* Overview Tab */}
      <div className={`tab-content ${activeTab === 'overview' ? 'active' : ''}`}>
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-label">Total Stocks</div>
            <div className="summary-value">{stocks.length}/10</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Total Value</div>
            <div className="summary-value">₹{basket.totalValue?.toLocaleString() || '0'}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Minimum Investment</div>
            <div className="summary-value">₹{basket.minimumInvestment?.toLocaleString() || '0'}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Last Rebalanced</div>
            <div className="summary-value">
              {basket.lastRebalanceDate
                ? new Date(basket.lastRebalanceDate).toLocaleDateString()
                : 'Never'}
            </div>
          </div>
        </div>

        {/* Benchmark Comparison */}
        <h3 style={{ marginTop: '30px', marginBottom: '20px' }}>Benchmark Comparison</h3>
        <div className="benchmark-comparison">
          <div className="benchmark-item">
            <div className="benchmark-name">{basket.name}</div>
            <div className="benchmark-value" style={{ color: '#4caf50' }}>
              +5.23%
            </div>
          </div>
          <div style={{ fontSize: '24px', color: '#ccc' }}>vs</div>
          <div className="benchmark-item">
            <div className="benchmark-name">{basket.benchmark?.name || 'Nifty 50'}</div>
            <div className="benchmark-value" style={{ color: '#f44336' }}>
              {basket.benchmark?.performance || '+2.15%'}
            </div>
          </div>
        </div>
      </div>

      {/* Stocks Tab */}
      <div className={`tab-content ${activeTab === 'stocks' ? 'active' : ''}`}>
        <table className="stocks-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Current Price</th>
              <th>52W High</th>
              <th>52W Low</th>
              <th>Quantity</th>
              <th>Weight</th>
              <th>Why Picked?</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock, idx) => (
              <tr key={idx}>
                <td className="stock-ticker">{stock.ticker}</td>
                <td>₹{stock.currentPrice?.toFixed(2) || 'N/A'}</td>
                <td>₹{stock.high52Week?.toFixed(2) || 'N/A'}</td>
                <td>₹{stock.low52Week?.toFixed(2) || 'N/A'}</td>
                <td>{stock.quantity || 10}</td>
                <td>{stock.weight}%</td>
                <td style={{ fontSize: '12px', color: '#666' }}>{stock.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Changes Tab */}
      <div className={`tab-content ${activeTab === 'changes' ? 'active' : ''}`}>
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '15px', color: '#4caf50' }}>✓ Added Stocks ({addedStocks.length})</h3>
          {addedStocks.length > 0 ? (
            <div>
              {addedStocks.map((stock, idx) => (
                <div key={idx} className="history-item">
                  <div className="stock-ticker">{stock.ticker}</div>
                  <div className="history-changes">
                    Quantity: {stock.quantity} | Price: ₹{stock.currentPrice?.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>{stock.reason}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#666' }}>No stocks added in recent rebalance</p>
          )}
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '15px', color: '#f44336' }}>✗ Removed Stocks ({removedStocks.length})</h3>
          {removedStocks.length > 0 ? (
            <div>
              {removedStocks.map((stock, idx) => (
                <div key={idx} className="history-item" style={{ borderLeftColor: '#f44336' }}>
                  <div className="stock-ticker">{stock.ticker}</div>
                  <div className="history-changes">
                    Quantity: {stock.quantity} | Removed on: {new Date(stock.removedDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#666' }}>No stocks removed recently</p>
          )}
        </div>

        <div>
          <h3 style={{ marginBottom: '15px', color: '#ff9800' }}>⚠ Partially Removed ({partialStocks.length})</h3>
          {partialStocks.length > 0 ? (
            <div>
              {partialStocks.map((stock, idx) => (
                <div key={idx} className="history-item" style={{ borderLeftColor: '#ff9800' }}>
                  <div className="stock-ticker">{stock.ticker}</div>
                  <div className="history-changes">
                    Original: {stock.quantity} | Remaining: {stock.quantity - (stock.partialQuantity || 0)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#666' }}>No partial removals</p>
          )}
        </div>
      </div>

      {/* History Tab */}
      <div className={`tab-content ${activeTab === 'history' ? 'active' : ''}`}>
        <div className="rebalance-history">
          <h3 style={{ marginBottom: '20px' }}>Recent Rebalances</h3>
          {rebalanceHistory.length > 0 ? (
            rebalanceHistory.map((entry, idx) => (
              <div key={idx} className="history-item">
                <div className="history-date">
                  {new Date(entry.rebalanceDate).toLocaleDateString()} at{' '}
                  {new Date(entry.rebalanceDate).toLocaleTimeString()}
                </div>
                <div className="history-changes">
                  {entry.reason}
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                  Added: {entry.changes?.added?.length || 0} stocks | Removed:{' '}
                  {entry.changes?.removed?.length || 0} stocks | Emails sent: {entry.emailsSent || 0}
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: '#666' }}>No rebalance history yet</p>
          )}
        </div>
      </div>

      {/* About Tab */}
      <div className={`tab-content ${activeTab === 'about' ? 'active' : ''}`}>
        <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '10px' }}>
          <h3 style={{ marginBottom: '15px' }}>About {basket.name}</h3>
          <p style={{ marginBottom: '15px', lineHeight: '1.6', color: '#666' }}>
            {basket.description}
          </p>

          <h4 style={{ marginTop: '25px', marginBottom: '10px' }}>Category</h4>
          <p style={{ color: '#666' }}>{basket.category}</p>

          <h4 style={{ marginTop: '25px', marginBottom: '10px' }}>Theme</h4>
          <p style={{ color: '#666' }}>{basket.theme}</p>

          <h4 style={{ marginTop: '25px', marginBottom: '10px' }}>Portfolio Features</h4>
          <ul style={{ color: '#666', marginLeft: '20px' }}>
            <li>Automatic rebalancing every 30 days</li>
            <li>Quality stock selection based on market conditions</li>
            <li>Email notifications for all changes</li>
            <li>Real-time price updates</li>
            <li>52-week high/low tracking</li>
            <li>Benchmark comparison</li>
            <li>Equal weight distribution (10% per stock)</li>
          </ul>

          <h4 style={{ marginTop: '25px', marginBottom: '10px' }}>Next Rebalance Date</h4>
          <p style={{ color: '#667eea', fontWeight: 'bold' }}>
            {new Date(basket.nextRebalanceDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <Link to="/" className="btn btn-secondary">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default BasketDetail;
