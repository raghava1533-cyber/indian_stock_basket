import React, { useEffect, useState, useCallback } from 'react';
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
  const [news, setNews] = useState([]);
  const [benchmark, setBenchmark] = useState(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [email, setEmail] = useState(localStorage.getItem('userEmail') || '');
  const [subscribed, setSubscribed] = useState(false);

  const loadBasketData = useCallback(async () => {
    try {
      setLoading(true);
      const basketRes = await basketAPI.getBasketById(id);
      setBasket(basketRes.data);

      const stocksRes = await basketAPI.getBasketStocks(id);
      setStocks(stocksRes.data);

      const summaryRes = await basketAPI.getRebalanceSummary(id);
      setRebalanceHistory(summaryRes.data.recentChanges || []);

      // Check if subscribed
      const userEmail = localStorage.getItem('userEmail');
      if (userEmail && basketRes.data.subscribers?.includes(userEmail)) {
        setSubscribed(true);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading basket:', error);
      setLoading(false);
    }
  }, [id]);

  const loadNews = useCallback(async () => {
    if (news.length > 0) return;
    setNewsLoading(true);
    try {
      const res = await basketAPI.getBasketNews(id);
      setNews(res.data);
    } catch (err) {
      console.error('Error loading news:', err);
    }
    setNewsLoading(false);
  }, [id, news.length]);

  const loadBenchmark = useCallback(async () => {
    if (benchmark) return;
    setBenchmarkLoading(true);
    try {
      const res = await basketAPI.getBasketBenchmark(id);
      setBenchmark(res.data);
    } catch (err) {
      console.error('Error loading benchmark:', err);
    }
    setBenchmarkLoading(false);
  }, [id, benchmark]);

  useEffect(() => {
    loadBasketData();
  }, [loadBasketData]);

  useEffect(() => {
    if (activeTab === 'news') loadNews();
    if (activeTab === 'benchmark') loadBenchmark();
  }, [activeTab, loadNews, loadBenchmark]);

  const handleRebalance = async () => {
    if (!window.confirm('Trigger manual rebalance? This will re-evaluate all stocks.')) return;
    try {
      setMessage('Rebalancing... this may take a moment.');
      const result = await basketAPI.rebalanceBasket(id);
      setMessage(`Rebalanced! ${result.data.changes?.added?.length || 0} added, ${result.data.changes?.removed?.length || 0} removed. ${result.data.emailsSent || 0} emails sent.`);
      setTimeout(() => setMessage(''), 5000);
      loadBasketData();
      onReload();
    } catch (error) {
      console.error('Error rebalancing:', error);
      setMessage('Error rebalancing basket. Try again.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSubscribe = async () => {
    if (!email) { alert('Enter your email first'); return; }
    try {
      await basketAPI.subscribeToBasket(id, email);
      localStorage.setItem('userEmail', email);
      setSubscribed(true);
      setMessage('Subscribed! You will receive rebalance notifications.');
      setTimeout(() => setMessage(''), 3000);
      loadBasketData();
    } catch (err) {
      alert('Error subscribing');
    }
  };

  const handleUnsubscribe = async () => {
    try {
      await basketAPI.unsubscribeFromBasket(id, email);
      setSubscribed(false);
      setMessage('Unsubscribed from notifications.');
      setTimeout(() => setMessage(''), 3000);
      loadBasketData();
    } catch (err) {
      alert('Error unsubscribing');
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div> Loading basket details...</div>;
  }

  if (!basket) {
    return (
      <div className="error">
        Basket not found. <Link to="/baskets">Back to Baskets</Link>
      </div>
    );
  }

  const activeStocks = stocks.filter(s => s.status === 'active' || !s.status);
  const totalValue = activeStocks.reduce((sum, s) => sum + ((s.currentPrice || 0) * (s.quantity || 1)), 0);

  // Derive changes from rebalance history
  const latestHistory = rebalanceHistory[0];
  const addedStocks = latestHistory?.changes?.added || [];
  const removedStocks = latestHistory?.changes?.removed || [];
  const partialStocks = latestHistory?.changes?.partialRemoved || [];

  const tabs = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'stocks', label: `Stocks (${activeStocks.length})`, icon: '📈' },
    { key: 'news', label: 'News', icon: '📰' },
    { key: 'changes', label: 'Changes', icon: '🔄' },
    { key: 'benchmark', label: 'Benchmark', icon: '📉' },
    { key: 'history', label: 'History', icon: '📋' },
    { key: 'portfolio', label: 'Portfolio', icon: '💼' },
    { key: 'about', label: 'About', icon: 'ℹ️' },
  ];

  return (
    <div className="basket-detail">
      {message && <div className={message.includes('Error') ? 'error' : 'success'}>{message}</div>}

      <div className="basket-detail-header">
        <div>
          <h1 className="basket-detail-title">{basket.name}</h1>
          <p style={{ color: '#888', marginTop: '5px', fontSize: '15px' }}>{basket.description}</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
            <span className="detail-badge">{basket.category}</span>
            <span className="detail-badge theme">{basket.theme}</span>
            <span className="detail-badge subscribers">👥 {basket.subscribers?.length || 0} subscribers</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
          <button onClick={handleRebalance} className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
            🔄 Rebalance Now
          </button>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', width: '180px' }}
            />
            {subscribed ? (
              <button onClick={handleUnsubscribe} className="btn btn-danger" style={{ fontSize: '12px', padding: '8px 12px' }}>
                Unsubscribe
              </button>
            ) : (
              <button onClick={handleSubscribe} className="btn btn-secondary" style={{ fontSize: '12px', padding: '8px 12px' }}>
                Subscribe
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="tab-icon">{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW TAB ═══ */}
      <div className={`tab-content ${activeTab === 'overview' ? 'active' : ''}`}>
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-label">Total Stocks</div>
            <div className="summary-value">{activeStocks.length}/10</div>
          </div>
          <div className="summary-card green">
            <div className="summary-label">Total Value</div>
            <div className="summary-value">₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          </div>
          <div className="summary-card orange">
            <div className="summary-label">Min. Investment</div>
            <div className="summary-value">₹{basket.minimumInvestment?.toLocaleString('en-IN') || totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Last Rebalanced</div>
            <div className="summary-value">
              {basket.lastRebalanceDate ? new Date(basket.lastRebalanceDate).toLocaleDateString() : 'Never'}
            </div>
          </div>
          <div className="summary-card blue">
            <div className="summary-label">Next Rebalance</div>
            <div className="summary-value">
              {basket.nextRebalanceDate ? new Date(basket.nextRebalanceDate).toLocaleDateString() : 'TBD'}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Subscribers</div>
            <div className="summary-value">{basket.subscribers?.length || 0}</div>
          </div>
        </div>

        {/* Quick stock summary table */}
        <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Stock Allocation Summary</h3>
        <div className="stock-allocation-grid">
          {activeStocks.slice(0, 10).map((stock, idx) => (
            <div key={idx} className="alloc-card">
              <div className="alloc-rank">#{idx + 1}</div>
              <div className="alloc-info">
                <div className="alloc-ticker">{stock.companyName || stock.ticker?.replace('.NS', '')}</div>
                <div className="alloc-meta">
                  {stock.quantity || 1} shares × ₹{stock.currentPrice?.toFixed(0) || '—'} = ₹{((stock.currentPrice || 0) * (stock.quantity || 1)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
              </div>
              <div className="alloc-weight">{stock.weight?.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ STOCKS TAB ═══ */}
      <div className={`tab-content ${activeTab === 'stocks' ? 'active' : ''}`}>
        <div style={{ overflowX: 'auto' }}>
          <table className="stocks-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Company</th>
                <th>Ticker</th>
                <th>Price</th>
                <th>52W High</th>
                <th>52W Low</th>
                <th>PE Ratio</th>
                <th>Qty</th>
                <th>Weight</th>
                <th>Value</th>
                <th>Score</th>
                <th>Why Picked</th>
              </tr>
            </thead>
            <tbody>
              {activeStocks.map((stock, idx) => {
                const price = stock.currentPrice || 0;
                const h52 = stock.high52Week || 0;
                const l52 = stock.low52Week || 0;

                return (
                  <tr key={idx}>
                    <td style={{ fontWeight: 'bold', color: '#667eea' }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{stock.companyName || stock.ticker?.replace('.NS', '')}</div>
                    </td>
                    <td className="stock-ticker">{stock.ticker?.replace('.NS', '')}</td>
                    <td>₹{price.toFixed(2)}</td>
                    <td style={{ color: '#4caf50' }}>₹{h52.toFixed(0)}</td>
                    <td style={{ color: '#f44336' }}>₹{l52.toFixed(0)}</td>
                    <td>{stock.peRatio?.toFixed(1) || 'N/A'}</td>
                    <td style={{ fontWeight: 'bold', fontSize: '16px' }}>{stock.quantity || 1}</td>
                    <td>{stock.weight?.toFixed(1)}%</td>
                    <td style={{ fontWeight: '600' }}>₹{(price * (stock.quantity || 1)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                    <td>
                      <div className="score-bar">
                        <div className="score-fill" style={{ width: `${Math.min(stock.score || 0, 100)}%` }}></div>
                        <span className="score-text">{stock.score?.toFixed(0) || '—'}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '12px', color: '#666', maxWidth: '250px' }}>{stock.reason}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 'bold', background: '#f0f0f0' }}>
                <td colSpan="7">Total</td>
                <td>{activeStocks.reduce((s, st) => s + (st.quantity || 1), 0)}</td>
                <td>100%</td>
                <td>₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                <td colSpan="2">Min Investment: ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ═══ NEWS TAB ═══ */}
      <div className={`tab-content ${activeTab === 'news' ? 'active' : ''}`}>
        {newsLoading ? (
          <div className="loading">Loading latest news...</div>
        ) : news.length > 0 ? (
          <div className="news-grid">
            {news.map((item, idx) => (
              <div key={idx} className={`news-card ${item.sentiment}`}>
                <div className="news-header">
                  <span className={`news-sentiment ${item.sentiment}`}>
                    {item.sentiment === 'positive' ? '🟢' : item.sentiment === 'negative' ? '🔴' : '🔵'} {item.sentiment}
                  </span>
                  <span className="news-source">{item.source}</span>
                </div>
                <h4 className="news-title">{item.title}</h4>
                <p className="news-summary">{item.summary}</p>
                <div className="news-footer">
                  <span className="news-ticker">{item.companyName}</span>
                  <span className="news-date">{new Date(item.date).toLocaleDateString()}</span>
                  {item.changePercent != null && item.ticker !== 'BASKET' && (
                    <span className={`news-change ${item.changePercent >= 0 ? 'positive' : 'negative'}`}>
                      {item.changePercent >= 0 ? '+' : ''}{item.changePercent}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>No news available. Click refresh or wait for market hours.</p>
        )}
      </div>

      {/* ═══ CHANGES TAB ═══ */}
      <div className={`tab-content ${activeTab === 'changes' ? 'active' : ''}`}>
        {!latestHistory ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>No rebalance changes yet. Click "Rebalance Now" to generate changes.</p>
        ) : (
          <>
            <div className="changes-header">
              <span>Last Rebalance: {new Date(latestHistory.rebalanceDate).toLocaleDateString()}</span>
              <span>{latestHistory.reason || 'Auto rebalance'}</span>
            </div>

            <div className="changes-section">
              <h3 className="changes-title added">✅ Added Stocks ({addedStocks.length})</h3>
              {addedStocks.length > 0 ? (
                <div className="changes-list">
                  {addedStocks.map((s, i) => (
                    <div key={i} className="change-item added">
                      <div className="change-ticker">{s.companyName || s.ticker?.replace('.NS', '')}</div>
                      <div className="change-detail">Qty: {s.quantity || 1} shares</div>
                      <div className="change-reason">{s.reason || 'Quality score qualified'}</div>
                    </div>
                  ))}
                </div>
              ) : <p className="no-changes">No stocks added</p>}
            </div>

            <div className="changes-section">
              <h3 className="changes-title removed">❌ Removed Stocks ({removedStocks.length})</h3>
              {removedStocks.length > 0 ? (
                <div className="changes-list">
                  {removedStocks.map((s, i) => (
                    <div key={i} className="change-item removed">
                      <div className="change-ticker">{s.companyName || s.ticker?.replace('.NS', '')}</div>
                      <div className="change-detail">
                        Sold {s.quantity || 'all'} shares{s.salePrice ? ` at ₹${s.salePrice.toFixed(2)}` : ''}
                      </div>
                      <div className="change-reason">{s.reason || 'Quality score dropped'}</div>
                    </div>
                  ))}
                </div>
              ) : <p className="no-changes">No stocks removed</p>}
            </div>

            <div className="changes-section">
              <h3 className="changes-title partial">⚠️ Partially Removed ({partialStocks.length})</h3>
              {partialStocks.length > 0 ? (
                <div className="changes-list">
                  {partialStocks.map((s, i) => (
                    <div key={i} className="change-item partial">
                      <div className="change-ticker">{s.companyName || s.ticker?.replace('.NS', '')}</div>
                      <div className="change-detail">Reduced by {s.quantityRemoved} shares</div>
                      <div className="change-reason">{s.reason || 'Weight rebalanced'}</div>
                    </div>
                  ))}
                </div>
              ) : <p className="no-changes">No partial removals</p>}
            </div>
          </>
        )}
      </div>

      {/* ═══ BENCHMARK TAB ═══ */}
      <div className={`tab-content ${activeTab === 'benchmark' ? 'active' : ''}`}>
        {benchmarkLoading ? (
          <div className="loading">Loading benchmark data...</div>
        ) : benchmark ? (
          <>
            <div className="benchmark-hero">
              <div className="benchmark-basket-card">
                <h3>{benchmark.basket.name}</h3>
                <div className="benchmark-big-value">₹{benchmark.basket.totalValue?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '—'}</div>
                <div className="benchmark-meta">{benchmark.basket.stockCount} stocks | Min: ₹{benchmark.basket.minimumInvestment?.toLocaleString('en-IN') || '—'}</div>
              </div>
              <div className="benchmark-vs">VS</div>
              <div className="benchmark-indices">
                {benchmark.benchmarks.map((bm, i) => (
                  <div key={i} className="benchmark-index-card">
                    <div className="benchmark-index-name">{bm.name}</div>
                    <div className={`benchmark-index-return ${bm.monthReturn >= 0 ? 'positive' : 'negative'}`}>
                      {bm.monthReturn >= 0 ? '+' : ''}{bm.monthReturn}%
                    </div>
                    <div className="benchmark-index-value">{bm.currentValue?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                    <div className="benchmark-period">1 Month Return</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>Benchmark data not available</p>
        )}
      </div>

      {/* ═══ HISTORY TAB ═══ */}
      <div className={`tab-content ${activeTab === 'history' ? 'active' : ''}`}>
        <h3 style={{ marginBottom: '20px' }}>Rebalance History</h3>
        {rebalanceHistory.length > 0 ? (
          rebalanceHistory.map((entry, idx) => (
            <div key={idx} className="history-item">
              <div className="history-date">
                {new Date(entry.rebalanceDate).toLocaleDateString()} at{' '}
                {new Date(entry.rebalanceDate).toLocaleTimeString()}
              </div>
              <div className="history-changes">{entry.reason}</div>
              <div className="history-stats">
                <span className="history-stat added">+{entry.changes?.added?.length || 0} added</span>
                <span className="history-stat removed">-{entry.changes?.removed?.length || 0} removed</span>
                {(entry.changes?.partialRemoved?.length || 0) > 0 && (
                  <span className="history-stat partial">~{entry.changes.partialRemoved.length} partial</span>
                )}
                <span className="history-stat emails">📧 {entry.emailsSent || 0} emails</span>
              </div>
              {entry.changes?.added?.length > 0 && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#4caf50' }}>
                  Added: {entry.changes.added.map(s => s.companyName || s.ticker).join(', ')}
                </div>
              )}
              {entry.changes?.removed?.length > 0 && (
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#f44336' }}>
                  Removed: {entry.changes.removed.map(s => s.companyName || s.ticker).join(', ')}
                </div>
              )}
            </div>
          ))
        ) : (
          <p style={{ color: '#666' }}>No rebalance history yet. Trigger a rebalance to see changes.</p>
        )}
      </div>

      {/* ═══ PORTFOLIO / BROKER TAB ═══ */}
      <div className={`tab-content ${activeTab === 'portfolio' ? 'active' : ''}`}>
        <div className="portfolio-section-detail">
          <h3>🏦 Connect to Broker</h3>
          <p className="portfolio-desc">Connect your trading account to automatically execute buy/sell orders during rebalancing.</p>
          
          <div className="broker-grid">
            {[
              { name: 'Zerodha (Kite)', icon: '🟢', status: 'Popular', desc: 'Connect via Kite Connect API' },
              { name: 'Groww', icon: '🔵', status: 'Coming Soon', desc: 'Groww API integration' },
              { name: 'Angel One', icon: '🟠', status: 'Coming Soon', desc: 'Angel Broking SmartAPI' },
              { name: 'Upstox', icon: '🟣', status: 'Coming Soon', desc: 'Upstox API v2' },
              { name: '5paisa', icon: '🔴', status: 'Coming Soon', desc: '5paisa Connect API' },
              { name: 'ICICI Direct', icon: '🔵', status: 'Coming Soon', desc: 'ICICI Direct Breeze API' },
            ].map((broker, i) => (
              <div key={i} className="broker-card">
                <div className="broker-icon">{broker.icon}</div>
                <div className="broker-info">
                  <div className="broker-name">{broker.name}</div>
                  <div className="broker-desc">{broker.desc}</div>
                </div>
                <button className="btn btn-secondary broker-btn" disabled={broker.status === 'Coming Soon'}>
                  {broker.status === 'Coming Soon' ? 'Coming Soon' : 'Connect'}
                </button>
              </div>
            ))}
          </div>

          <div className="rebalance-orders">
            <h4>📋 Pending Rebalance Orders</h4>
            {activeStocks.length > 0 ? (
              <table className="stocks-table" style={{ marginTop: '15px' }}>
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Stock</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeStocks.map((s, i) => (
                    <tr key={i}>
                      <td><span className="order-badge buy">BUY</span></td>
                      <td className="stock-ticker">{s.companyName || s.ticker?.replace('.NS', '')}</td>
                      <td>{s.quantity || 1}</td>
                      <td>₹{s.currentPrice?.toFixed(2) || '—'}</td>
                      <td>₹{((s.currentPrice || 0) * (s.quantity || 1)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                      <td><span className="order-status pending">Pending Broker</span></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 'bold' }}>
                    <td colSpan="4">Total Investment Required</td>
                    <td>₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <p style={{ color: '#666', marginTop: '15px' }}>No orders pending. Rebalance the basket first.</p>
            )}
          </div>
        </div>
      </div>

      {/* ═══ ABOUT TAB ═══ */}
      <div className={`tab-content ${activeTab === 'about' ? 'active' : ''}`}>
        <div className="about-section">
          <h3>About {basket.name}</h3>
          <p className="about-desc">{basket.description}</p>

          <div className="about-grid">
            <div className="about-item">
              <span className="about-label">Category</span>
              <span className="about-value">{basket.category}</span>
            </div>
            <div className="about-item">
              <span className="about-label">Theme</span>
              <span className="about-value">{basket.theme}</span>
            </div>
            <div className="about-item">
              <span className="about-label">Stocks</span>
              <span className="about-value">{activeStocks.length} / 10</span>
            </div>
            <div className="about-item">
              <span className="about-label">Rebalance Frequency</span>
              <span className="about-value">Every 30 days (auto)</span>
            </div>
            <div className="about-item">
              <span className="about-label">Next Rebalance</span>
              <span className="about-value">{basket.nextRebalanceDate ? new Date(basket.nextRebalanceDate).toLocaleDateString() : 'TBD'}</span>
            </div>
            <div className="about-item">
              <span className="about-label">Selection Method</span>
              <span className="about-value">Quality Scoring (100 pts)</span>
            </div>
          </div>

          <h4 style={{ marginTop: '30px', marginBottom: '15px' }}>📊 Quality Scoring Criteria</h4>
          <div className="scoring-grid">
            {[
              { name: 'Market Trend', pts: '0-20 pts', desc: 'Position within 52-week range. Best when mid-range (not overbought/oversold)' },
              { name: 'Valuation (PE)', pts: '0-25 pts', desc: 'Price-to-Earnings ratio. Lower PE = higher score (undervalued)' },
              { name: 'Earnings Growth', pts: '0-20 pts', desc: 'Recent EPS growth rate. Higher growth = higher score' },
              { name: 'Future Growth', pts: '0-20 pts', desc: 'Analyst price targets and growth projections' },
              { name: 'Market Sentiment', pts: '0-15 pts', desc: '52-week momentum and social/market sentiment indicators' },
            ].map((c, i) => (
              <div key={i} className="scoring-card">
                <div className="scoring-name">{c.name}</div>
                <div className="scoring-pts">{c.pts}</div>
                <div className="scoring-desc">{c.desc}</div>
              </div>
            ))}
          </div>

          <h4 style={{ marginTop: '30px', marginBottom: '15px' }}>🔧 How Rebalancing Works</h4>
          <ol className="rebalance-steps">
            <li>Fetch live data for all stocks in the {basket.theme} universe from Yahoo Finance</li>
            <li>Score each stock on 5 quality criteria (total 100 points)</li>
            <li>Select top 10 stocks by quality score</li>
            <li>Allocate shares proportional to quality (higher score = more shares)</li>
            <li>Calculate minimum investment amount based on current prices × quantities</li>
            <li>Compare with previous basket — identify added, removed, and partially sold stocks</li>
            <li>Send email notifications to all subscribers with change details</li>
          </ol>
        </div>
      </div>

      <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
        <Link to="/baskets" className="btn btn-secondary">← Back to Baskets</Link>
        <Link to="/" className="btn btn-secondary">🏠 Dashboard</Link>
      </div>
    </div>
  );
}

export default BasketDetail;
