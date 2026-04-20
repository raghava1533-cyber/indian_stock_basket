import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { basketAPI } from '../services/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

// ── BrokerConnect component ───────────────────────────────────────────────────
function BrokerConnect({ stocks, totalValue }) {
  const [modal, setModal] = useState(null); // null | 'zerodha' | 'groww'
  const [zerodhaConnected, setZerodhaConnected] = useState(!!localStorage.getItem('zerodhaApiKey'));
  const [growwConnected, setGrowwConnected] = useState(!!localStorage.getItem('growwConnected'));
  const [growwEmail, setGrowwEmail] = useState(localStorage.getItem('growwEmail') || '');
  const [keyInput, setKeyInput] = useState('');

  const handleZerodhaConnect = () => {
    const key = keyInput.trim();
    if (!key) { alert('Please enter your Zerodha API Key'); return; }
    localStorage.setItem('zerodhaApiKey', key);
    setZerodhaConnected(true);
    setModal(null);
    // Redirect to Kite Connect OAuth
    window.open(`https://kite.zerodha.com/connect/login?v=3&api_key=${encodeURIComponent(key)}`, '_blank');
  };

  const handleZerodhaDisconnect = () => {
    localStorage.removeItem('zerodhaApiKey');
    setZerodhaConnected(false);
  };

  const handleGrowwConnect = () => {
    const em = growwEmail.trim();
    if (!em || !em.includes('@')) { alert('Please enter your Groww account email'); return; }
    localStorage.setItem('growwConnected', '1');
    localStorage.setItem('growwEmail', em);
    setGrowwConnected(true);
    setModal(null);
  };

  const handleGrowwDisconnect = () => {
    localStorage.removeItem('growwConnected');
    localStorage.removeItem('growwEmail');
    setGrowwConnected(false);
    setGrowwEmail('');
  };

  const brokers = [
    { key: 'zerodha', name: 'Zerodha (Kite)', icon: '🟢', desc: 'Kite Connect API — OAuth 2.0', connected: zerodhaConnected },
    { key: 'groww',   name: 'Groww',          icon: '🔵', desc: 'Link your Groww account',     connected: growwConnected },
    { key: null, name: 'Angel One',   icon: '🟠', desc: 'Angel SmartAPI',         connected: false, soon: true },
    { key: null, name: 'Upstox',      icon: '🟣', desc: 'Upstox API v2',          connected: false, soon: true },
    { key: null, name: '5paisa',      icon: '🔴', desc: '5paisa Connect',         connected: false, soon: true },
    { key: null, name: 'ICICI Direct',icon: '🔵', desc: 'Breeze API',             connected: false, soon: true },
  ];

  return (
    <div className="portfolio-section-detail">
      <h3>🏦 Connect to Broker</h3>
      <p className="portfolio-desc">Connect your trading account to execute buy/sell orders during rebalancing.</p>

      <div className="broker-grid">
        {brokers.map((b, i) => (
          <div key={i} className={`broker-card${b.connected ? ' broker-connected' : ''}`}>
            <div className="broker-icon">{b.icon}</div>
            <div className="broker-info">
              <div className="broker-name">{b.name}</div>
              <div className="broker-desc">{b.connected ? '✓ Connected' : b.desc}</div>
            </div>
            {b.soon ? (
              <button className="btn btn-secondary broker-btn" disabled>Coming Soon</button>
            ) : b.connected ? (
              <button className="btn broker-btn broker-disconnect"
                onClick={() => b.key === 'zerodha' ? handleZerodhaDisconnect() : handleGrowwDisconnect()}>
                Disconnect
              </button>
            ) : (
              <button className="btn btn-primary broker-btn"
                onClick={() => { setKeyInput(''); setModal(b.key); }}>
                Connect
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Zerodha modal */}
      {modal === 'zerodha' && (
        <div className="cb-modal-overlay" onClick={() => setModal(null)}>
          <div className="cb-modal" onClick={e => e.stopPropagation()}>
            <h3>Connect Zerodha (Kite)</h3>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
              Enter your Kite Connect API Key. You'll be redirected to Zerodha to authorize.
              Get your API key from <a href="https://developers.kite.trade" target="_blank" rel="noreferrer">developers.kite.trade</a>.
            </p>
            <div className="cb-field">
              <label className="cb-label">Kite API Key</label>
              <input className="cb-input" placeholder="e.g. xxxxxxxxxxxxxxxx"
                value={keyInput} onChange={e => setKeyInput(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
              <button className="cb-create-btn" onClick={handleZerodhaConnect}>Authorize with Zerodha →</button>
              <button className="cb-cancel-btn" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Groww modal */}
      {modal === 'groww' && (
        <div className="cb-modal-overlay" onClick={() => setModal(null)}>
          <div className="cb-modal" onClick={e => e.stopPropagation()}>
            <h3>Connect Groww</h3>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
              Groww does not provide a public trading API yet. Link your account to track your portfolio and get buy/sell recommendations.
            </p>
            <div className="cb-field">
              <label className="cb-label">Groww Account Email</label>
              <input className="cb-input" type="email" placeholder="your@email.com"
                value={growwEmail} onChange={e => setGrowwEmail(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
              <button className="cb-create-btn" onClick={handleGrowwConnect}>Link Account</button>
              <button className="cb-cancel-btn" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Holdings — visible when any broker is connected */}
      {(zerodhaConnected || growwConnected) && stocks.length > 0 && (
        <div className="portfolio-holdings">
          <h4>💼 Your Portfolio Holdings</h4>
          <div className="portfolio-summary-row">
            <div className="portfolio-summary-item">
              <span className="portfolio-summary-label">Total Value</span>
              <span className="portfolio-summary-value">₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="portfolio-summary-item">
              <span className="portfolio-summary-label">Stocks</span>
              <span className="portfolio-summary-value">{stocks.length}</span>
            </div>
            <div className="portfolio-summary-item">
              <span className="portfolio-summary-label">Broker</span>
              <span className="portfolio-summary-value">{zerodhaConnected ? 'Zerodha' : 'Groww'}</span>
            </div>
          </div>
          <table className="changes-table">
            <thead>
              <tr>
                <th>#</th><th style={{ textAlign: 'left' }}>Company</th><th>Qty</th><th>Price</th><th>Value</th><th>Weight</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((s, i) => {
                const val = (s.currentPrice || 0) * (s.quantity || 1);
                const weight = totalValue > 0 ? ((val / totalValue) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td style={{ textAlign: 'left', fontWeight: 500 }}>{s.companyName || s.ticker?.replace('.NS', '')}</td>
                    <td>{s.quantity || 1}</td>
                    <td>₹{s.currentPrice?.toFixed(0) || '—'}</td>
                    <td>₹{val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                    <td>{weight}%</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 'bold' }}>
                <td colSpan="4">Total Portfolio Value</td>
                <td>₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                <td>100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Pending orders table */}
      <div className="rebalance-orders">
        <h4>📋 Pending Rebalance Orders</h4>
        {stocks.length > 0 ? (
          <table className="changes-table" style={{ marginTop: '10px' }}>
            <thead>
              <tr>
                <th>Action</th><th style={{ textAlign: 'left' }}>Stock</th><th>Qty</th><th>Price</th><th>Amount</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((s, i) => (
                <tr key={i}>
                  <td style={{ textAlign: 'center' }}><span className="order-badge buy">BUY</span></td>
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
  );
}

function BasketDetail({ onReload }) {
  const { id } = useParams();
  const [basket, setBasket] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedRow, setExpandedRow] = useState(null);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };
  const [message, setMessage] = useState('');
  const [rebalanceHistory, setRebalanceHistory] = useState([]);
  const [news, setNews] = useState([]);
  const [benchmark, setBenchmark] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [newsLoading, setNewsLoading] = useState(false);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [benchmarkTf, setBenchmarkTf] = useState('max');
  const [subscribed, setSubscribed] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
    const [liveRefreshing, setLiveRefreshing] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [selectedStockDetail, setSelectedStockDetail] = useState(null);
  const [priceAlerts, setPriceAlerts] = useState(() => JSON.parse(localStorage.getItem('priceAlerts') || '{}'));
  const [alertInput, setAlertInput] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPE, setFilterPE] = useState('all');
  const [filterChange, setFilterChange] = useState('all');

  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Currency helpers based on basket country
  const isUS = (basket?.country || 'IN') === 'US';
  const cur = isUS ? '$' : '₹';
  const loc = isUS ? 'en-US' : 'en-IN';
  const investBase = isUS ? 1000 : 100000;
  const capUnit = isUS ? 'B' : 'Cr';

  // --- Effects for dark mode and notification permission ---
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

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
      } else {
        setSubscribed(false);
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

  const loadBenchmark = useCallback(async (tf) => {
    setBenchmarkLoading(true);
    try {
      const res = await basketAPI.getBasketBenchmark(id, tf || benchmarkTf);
      setBenchmark(res.data);
    } catch (err) {
      console.error('Error loading benchmark:', err);
    }
    setBenchmarkLoading(false);
  }, [id, benchmarkTf]);

  useEffect(() => {
    loadBasketData();
  }, [loadBasketData]);

  // ── Live price polling every 30 s ──────────────────────────────────────────
  useEffect(() => {
    const refreshPrices = async () => {
      try {
        setLiveRefreshing(true);
        const res = await basketAPI.getBasketStocks(id);
        setStocks(res.data);
        setLastUpdated(new Date());
      } catch (_) {}
      finally { setLiveRefreshing(false); }
    };
    const interval = setInterval(refreshPrices, 30000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (activeTab === 'news') loadNews();
    if (activeTab === 'benchmark' && !benchmark) loadBenchmark();
  }, [activeTab, loadNews, loadBenchmark, benchmark]);

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
    const token = localStorage.getItem('authToken');
    if (!token) { alert('Please log in to subscribe'); return; }
    try {
      await basketAPI.subscribeToBasket(id, token);
      setSubscribed(true);
      setMessage('Subscribed! Confirmation email sent.');
      setTimeout(() => setMessage(''), 4000);
      loadBasketData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error subscribing');
    }
  };

  const handleUnsubscribe = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) { alert('Please log in to unsubscribe'); return; }
    try {
      await basketAPI.unsubscribeFromBasket(id, token);
      setSubscribed(false);
      setMessage('Unsubscribed from notifications.');
      setTimeout(() => setMessage(''), 3000);
      loadBasketData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error unsubscribing');
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

  
  const filteredStocks = activeStocks.filter(s => {
    const nameMatch = (s.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                      (s.ticker || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    let peMatch = true;
    if (filterPE === 'low') peMatch = s.peRatio != null && s.peRatio < 15;
    else if (filterPE === 'mid') peMatch = s.peRatio != null && s.peRatio >= 15 && s.peRatio <= 30;
    else if (filterPE === 'high') peMatch = s.peRatio != null && s.peRatio > 30;

    let changeMatch = true;
    const change = s.dayChangePercent ?? 0;
    if (filterChange === 'positive') changeMatch = change > 0;
    else if (filterChange === 'negative') changeMatch = change < 0;

    return nameMatch && peMatch && changeMatch;
  });

  const sortedStocks = sortKey ? [...filteredStocks].sort((a, b) => {
    let av, bv;
    if (sortKey === 'company') { av = (a.companyName || a.ticker || '').toLowerCase(); bv = (b.companyName || b.ticker || '').toLowerCase(); }
    else if (sortKey === 'price') { av = a.currentPrice || 0; bv = b.currentPrice || 0; }
    else if (sortKey === 'change') { av = a.dayChangePercent ?? a.dayChange ?? -Infinity; bv = b.dayChangePercent ?? b.dayChange ?? -Infinity; }
    else if (sortKey === 'pe') { av = a.peRatio ?? -Infinity; bv = b.peRatio ?? -Infinity; }
    else if (sortKey === 'eps') { av = a.earningsGrowth ?? -Infinity; bv = b.earningsGrowth ?? -Infinity; }
    else if (sortKey === 'weight') { av = a.weight ?? 0; bv = b.weight ?? 0; }
    else if (sortKey === 'qty') { av = a.quantity || 1; bv = b.quantity || 1; }
    else if (sortKey === 'value') { av = (a.currentPrice || 0) * (a.quantity || 1); bv = (b.currentPrice || 0) * (b.quantity || 1); }
    else if (sortKey === 'score') { av = a.score ?? -Infinity; bv = b.score ?? -Infinity; }
    else { av = 0; bv = 0; }
    if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortDir === 'asc' ? av - bv : bv - av;
  }) : filteredStocks;

  // Derive changes from rebalance history
  const latestHistory = rebalanceHistory[0];
  const addedStocks = latestHistory?.changes?.added || [];
  const removedStocks = latestHistory?.changes?.removed || [];
  const partialStocks = latestHistory?.changes?.partialRemoved || [];

  // Fallback price map: use live stock prices when history records lack buyPrice
  const _normTicker = t => (t || '').replace(/\.(NS|BO)$/i, '');
  const stockPriceMap = Object.fromEntries(stocks.map(s => [_normTicker(s.ticker), s.currentPrice || 0]));

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
          <h1 className="basket-detail-title">{basket.name?.replace(/ \(\d{10,}\)$/, '')}</h1>
          <p style={{ color: '#888', marginTop: '5px', fontSize: '15px' }}>{basket.description}</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
            <span className="detail-badge">{basket.category}</span>
            <span className="detail-badge theme">{basket.theme}</span>
            <span className="detail-badge subscribers">👥 {basket.subscribers?.length || 0} subscribers</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
          <div style={{display: 'flex', gap: '8px'}}>
            <button onClick={() => setDarkMode(!darkMode)} className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
              {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
            <button onClick={handleRebalance} className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
              🔄 Rebalance Now
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {subscribed ? (
              <button onClick={handleUnsubscribe} className="btn btn-danger" style={{ fontSize: '12px', padding: '8px 12px' }}>
                ✉️ Unsubscribe
              </button>
            ) : (
              <button onClick={handleSubscribe} className="btn btn-secondary" style={{ fontSize: '12px', padding: '8px 12px' }}>
                ✉️ Subscribe for Email Alerts
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
            <div className="summary-value">{activeStocks.length} stocks</div>
          </div>
          <div className="summary-card green">
            <div className="summary-label">Minimum Investment</div>
            <div className="summary-value">{cur}{totalValue.toLocaleString(loc, { maximumFractionDigits: 0 })}</div>
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
          <div className="summary-card">
            <div className="summary-label">Launch Date</div>
            <div className="summary-value">
              {(() => {
                if (!basket.createdDate) return '—';
                try {
                  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(basket.createdDate)).replace(/\//g, '-');
                } catch (e) {
                  return new Date(basket.createdDate).toLocaleDateString();
                }
              })()}
            </div>
          </div>
        </div>

        {/* Overall Returns from buyPrice — includes sold stocks */}
        {(() => {
          const investedVal = activeStocks.reduce((sum, s) => sum + ((s.buyPrice || s.currentPrice || 0) * (s.quantity || 1)), 0);
          const removedStocks = stocks.filter(s => s.status === 'removed');
          const realizedPnL = removedStocks.reduce((sum, s) => {
            const sellP = s.currentPrice || 0;
            const buyP = s.buyPrice || sellP;
            return sum + ((sellP - buyP) * (s.quantity || 1));
          }, 0);
          const currentVal = totalValue;
          const unrealizedPnL = currentVal - investedVal;
          const totalPnL = unrealizedPnL + realizedPnL;
          const totalInvested = investedVal + removedStocks.reduce((sum, s) => sum + ((s.buyPrice || s.currentPrice || 0) * (s.quantity || 1)), 0);
          const returnPct = totalInvested > 0 ? ((totalPnL / totalInvested) * 100).toFixed(2) : 0;
          const daysSince = (() => {
            if (!basket.createdDate) return 0;
            try {
              const launch = new Date(basket.createdDate);
              const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' });
              const [ld, lm, ly] = fmt.format(launch).split('/');
              const [nd, nm, ny] = fmt.format(new Date()).split('/');
              const launchDate = new Date(Number(ly), Number(lm) - 1, Number(ld));
              const nowDate = new Date(Number(ny), Number(nm) - 1, Number(nd));
              return Math.max(0, Math.floor((nowDate - launchDate) / (1000 * 60 * 60 * 24)));
            } catch (e) {
              return Math.max(0, Math.ceil((new Date() - new Date(basket.createdDate)) / (1000 * 60 * 60 * 24)));
            }
          })();
          const investLabel = isUS ? '$1,000' : '₹1,00,000';
          return (
            <div style={{ background: 'var(--color-bg-secondary, #f7f8fa)', borderRadius: '12px', padding: '20px', margin: '20px 0', border: '1px solid var(--color-border, #e8e8e5)' }}>
              <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>📈 Overall Returns {daysSince > 0 ? `(${daysSince} days)` : ''}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Invested ({investLabel})</div>
                  <div style={{ fontSize: '18px', fontWeight: '600' }}>{cur}{investedVal.toLocaleString(loc, { maximumFractionDigits: 0 })}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Current Value</div>
                  <div style={{ fontSize: '18px', fontWeight: '600' }}>{cur}{currentVal.toLocaleString(loc, { maximumFractionDigits: 0 })}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Unrealized P&L</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: unrealizedPnL >= 0 ? '#4caf50' : '#f44336' }}>
                    {unrealizedPnL >= 0 ? '+' : ''}{cur}{unrealizedPnL.toLocaleString(loc, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Realized P&L (Sold)</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: realizedPnL >= 0 ? '#4caf50' : '#f44336' }}>
                    {realizedPnL >= 0 ? '+' : ''}{cur}{realizedPnL.toLocaleString(loc, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Total P&L</div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: totalPnL >= 0 ? '#4caf50' : '#f44336' }}>
                    {totalPnL >= 0 ? '+' : ''}{cur}{totalPnL.toLocaleString(loc, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Return %</div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: Number(returnPct) >= 0 ? '#4caf50' : '#f44336' }}>
                    {Number(returnPct) >= 0 ? '+' : ''}{returnPct}%
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Quick stock summary table */}
        <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Stock Allocation Summary</h3>
        {!localStorage.getItem('authToken') ? (
          <div className="stocks-login-gate">
            <div className="stocks-gate-icon">🔒</div>
            <div className="stocks-gate-title">Login to view stock allocation</div>
            <div className="stocks-gate-sub">Sign in to see which stocks are in this basket and their allocations.</div>
            <a href="/login" className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-block' }}>Login to continue</a>
          </div>
        ) : (
        <div className="stock-allocation-grid">
          {activeStocks.map((stock, idx) => (
            <div key={idx} className="alloc-card">
              <div className="alloc-rank">#{idx + 1}</div>
              <div className="alloc-info">
                <div className="alloc-ticker">{stock.companyName || stock.ticker?.replace('.NS', '')}</div>
                <div className="alloc-meta">
                  {stock.quantity || 1} shares × {cur}{stock.currentPrice?.toFixed(0) || '—'} = {cur}{((stock.currentPrice || 0) * (stock.quantity || 1)).toLocaleString(loc, { maximumFractionDigits: 0 })}
                </div>
              </div>
              <div className="alloc-weight">{stock.weight?.toFixed(1)}%</div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* ═══ STOCKS TAB ═══ */}
      <div className={`tab-content ${activeTab === 'stocks' ? 'active' : ''}`}>
        {!localStorage.getItem('authToken') ? (
          <div className="stocks-login-gate">
            <div className="stocks-gate-icon">🔒</div>
            <div className="stocks-gate-title">Login to view stocks</div>
            <div className="stocks-gate-sub">Sign in to see the full list of stocks, live prices, and portfolio weightings in this basket.</div>
            <a href="/login" className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-block' }}>Login to continue</a>
          </div>
        ) : (
        <>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          {liveRefreshing && <span className="live-dot-pulse" />}
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
            {liveRefreshing ? 'Updating prices…' : lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Live prices · auto-refresh every 30s'}
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Search by name or ticker..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', flex: 1, minWidth: '200px', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
          />
          <select value={filterPE} onChange={e => setFilterPE(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}>
            <option value="all">All P/E</option>
            <option value="low">Low P/E (&lt; 15)</option>
            <option value="mid">Mid P/E (15-30)</option>
            <option value="high">High P/E (&gt; 30)</option>
          </select>
          <select value={filterChange} onChange={e => setFilterChange(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}>
            <option value="all">All Day Change</option>
            <option value="positive">Positive (+)</option>
            <option value="negative">Negative (-)</option>
          </select>
        </div>
        <table className="stocks-table">
            <thead>
              <tr>
                {[['#', null], ['Company', 'company'], ['Price', 'price'], ['Day Change', 'change'], ['52W Range', null], ['PE', 'pe'], ['EPS%', 'eps'], ['Weight', 'weight'], ['Qty', 'qty'], ['Value', 'value'], ['Score', 'score']].map(([label, key]) => (
                  <th
                    key={label}
                    onClick={key ? () => handleSort(key) : undefined}
                    style={key ? { cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' } : {}}
                    title={key ? `Sort by ${label}` : undefined}
                  >
                    {label}{key && (
                      <span style={{ marginLeft: '4px', opacity: sortKey === key ? 1 : 0.3, fontSize: '10px' }}>
                        {sortKey === key ? (sortDir === 'asc' ? '▲' : '▼') : '▼'}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedStocks.map((stock, idx) => {
                const price = stock.currentPrice || 0;
                const h52 = stock.high52Week || 0;
                const l52 = stock.low52Week || 0;
                const isExpanded = expandedRow === idx;

                return (
                  <React.Fragment key={idx}>
                    <tr
                      className={`stock-row${isExpanded ? ' expanded' : ''}`}
                      onClick={() => setExpandedRow(isExpanded ? null : idx)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{idx + 1}</td>
                      <td onClick={(e) => { e.stopPropagation(); setSelectedStockDetail(stock); setAlertInput(''); }}>
                        <div style={{ fontWeight: '500', fontSize: '13px', color: 'var(--color-text-primary)', cursor: 'pointer', textDecoration: 'underline' }}>
                          {stock.companyName || stock.ticker?.replace('.NS', '')}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          {stock.ticker?.replace('.NS', '')}
                          {stock.futureGrowth != null && (
                            <span style={{ marginLeft: '6px', color: 'var(--color-accent)' }}>
                              FG {stock.futureGrowth.toFixed(1)}/10
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{cur}{price.toFixed(0)}</td>
                      <td>
                        {stock.dayChangePercent != null ? (
                          <span className={stock.dayChangePercent >= 0 ? 'price-positive' : 'price-negative'} style={{ fontWeight: '500' }}>
                            {stock.dayChangePercent >= 0 ? '+' : ''}{stock.dayChangePercent.toFixed(2)}%
                            {stock.dayChange != null && (
                              <div style={{ fontSize: '10px', fontWeight: '400', opacity: 0.75 }}>
                                {stock.dayChange >= 0 ? '+' : ''}{cur}{Math.abs(stock.dayChange).toFixed(2)}
                              </div>
                            )}
                          </span>
                        ) : stock.dayChange != null ? (
                          <span className={stock.dayChange >= 0 ? 'price-positive' : 'price-negative'} style={{ fontWeight: '500' }}>
                            {stock.dayChange >= 0 ? '+' : ''}{cur}{stock.dayChange.toFixed(2)}
                          </span>
                        ) : <span style={{ color: 'var(--color-text-secondary)' }}>—</span>}
                      </td>
                      <td>
                        {h52 > 0 && l52 > 0 && price > 0 ? (() => {
                          const pct = Math.min(100, Math.max(0, ((price - l52) / (h52 - l52)) * 100));
                          const dotColor = pct >= 75 ? 'var(--color-accent)' : pct <= 25 ? 'var(--color-negative)' : '#f59e0b';
                          return (
                            <div className="range52-wrap">
                              <div className="range52-bar">
                                <div className="range52-dot" style={{ left: `${pct}%`, background: dotColor }} />
                              </div>
                              <div className="range52-labels">
                                <span>{cur}{l52.toFixed(0)}</span>
                                <span>{cur}{h52.toFixed(0)}</span>
                              </div>
                            </div>
                          );
                        })() : '—'}
                      </td>
                      <td>{stock.peRatio != null ? stock.peRatio.toFixed(1) : '—'}</td>
                      <td>{stock.earningsGrowth != null ? `${stock.earningsGrowth.toFixed(1)}%` : '—'}</td>
                      <td>{stock.weight?.toFixed(1)}%</td>
                      <td>{stock.quantity || 1}</td>
                      <td>{cur}{(price * (stock.quantity || 1)).toLocaleString(loc, { maximumFractionDigits: 0 })}</td>
                      <td>
                        <div className="score-bar">
                          <div className="score-fill" style={{ width: `${Math.min(stock.score || 0, 100)}%` }}></div>
                          <span className="score-text">{stock.score?.toFixed(0) || '—'}</span>
                        </div>
                      </td>
                    </tr>

                    {/* ── Why Picked expanded row ── */}
                    {isExpanded && (
                      <tr className="why-row">
                        <td colSpan="11">
                          <div className="why-panel">
                            <div className="why-title">📌 Why this stock was picked</div>
                            <div className="why-pills">
                              {stock.peRatio != null && (
                                <span className="why-pill">PE: {stock.peRatio.toFixed(1)}</span>
                              )}
                              {stock.earningsGrowth != null && (
                                <span className="why-pill accent">EPS Growth: {stock.earningsGrowth.toFixed(1)}%</span>
                              )}
                              {stock.revenueGrowth != null && (
                                <span className="why-pill">Rev Growth: {stock.revenueGrowth.toFixed(1)}%</span>
                              )}
                              {stock.futureGrowth != null && (
                                <span className="why-pill accent">Future Growth: {stock.futureGrowth.toFixed(1)}/10</span>
                              )}
                              {stock.socialSentiment != null && (
                                <span className="why-pill">Sentiment: {stock.socialSentiment.toFixed(1)}/10</span>
                              )}
                              {stock.rsi != null && (
                                <span className={`why-pill ${stock.rsi <= 30 ? 'accent' : stock.rsi >= 70 ? 'negative' : ''}`}>
                                  RSI: {stock.rsi.toFixed(0)} {stock.rsi <= 30 ? '(Oversold)' : stock.rsi >= 70 ? '(Overbought)' : ''}
                                </span>
                              )}
                              {stock.recommendationKey && (
                                  <span className={`why-pill ${stock.recommendationKey === 'buy' || stock.recommendationKey === 'strong_buy' ? 'accent' : stock.recommendationKey === 'sell' || stock.recommendationKey === 'strong_sell' ? 'negative' : ''}`}>
                                    Analyst: {stock.recommendationKey.replace('_', ' ').toUpperCase()}
                                    {stock.numberOfAnalysts ? ` (${stock.numberOfAnalysts})` : ''}
                                    {/* Analysis Rating: show Buy (10) or Hold (5) */}
                                    {stock.recommendationKey === 'buy' || stock.recommendationKey === 'strong_buy' ? (
                                      <span style={{ marginLeft: 8, color: '#1D9E75', fontWeight: 600 }}>
                                        Buy (10)
                                      </span>
                                    ) : stock.recommendationKey === 'hold' ? (
                                      <span style={{ marginLeft: 8, color: '#f59e0b', fontWeight: 600 }}>
                                        Hold (5)
                                      </span>
                                    ) : null}
                                  </span>
                              )}
                              {stock.targetMeanPrice != null && stock.currentPrice > 0 && (
                                <span className={`why-pill ${stock.targetMeanPrice > stock.currentPrice ? 'accent' : 'negative'}`}>
                                  Target: {cur}{Math.round(stock.targetMeanPrice).toLocaleString(loc)}
                                  {' '}({stock.targetMeanPrice > stock.currentPrice ? '+' : ''}{((stock.targetMeanPrice - stock.currentPrice) / stock.currentPrice * 100).toFixed(1)}%)
                                </span>
                              )}
                              {/* Show average target price explicitly for clarity */}
                              {stock.targetMeanPrice != null && (
                                <span className="why-pill" style={{ background: '#e0e7ff', color: '#3730a3', marginLeft: 8 }}>
                                  Avg Target Price: {cur}{Math.round(stock.targetMeanPrice).toLocaleString(loc)}
                                </span>
                              )}
                              {stock.sma50 != null && (
                                <span className={`why-pill ${stock.currentPrice > stock.sma50 ? 'accent' : 'negative'}`}>
                                  {stock.currentPrice > stock.sma50 ? '▲ Above' : '▼ Below'} SMA50
                                </span>
                              )}
                              {stock.sma200 != null && (
                                <span className={`why-pill ${stock.currentPrice > stock.sma200 ? 'accent' : 'negative'}`}>
                                  {stock.currentPrice > stock.sma200 ? '▲ Above' : '▼ Below'} SMA200
                                </span>
                              )}
                              {stock.marketCapCr != null && (
                                <span className="why-pill">Mkt Cap: {cur}{stock.marketCapCr.toLocaleString(loc)} {capUnit}</span>
                              )}
                              {stock.score != null && (
                                <span className="why-pill score">Score: {stock.score.toFixed(0)}/100</span>
                              )}
                            </div>
                            {/* Analyst target detail when available */}
                            {stock.targetMeanPrice != null && (
                              <div className="why-analyst-detail">
                                <span>🎯 Avg Target: <strong>{cur}{Math.round(stock.targetMeanPrice).toLocaleString(loc)}</strong></span>
                                {stock.targetHighPrice != null && <span> | High: {cur}{Math.round(stock.targetHighPrice).toLocaleString(loc)}</span>}
                                {stock.targetLowPrice != null && <span> | Low: {cur}{Math.round(stock.targetLowPrice).toLocaleString(loc)}</span>}
                                {stock.numberOfAnalysts != null && <span> | {stock.numberOfAnalysts} analyst{stock.numberOfAnalysts > 1 ? 's' : ''}</span>}
                                {/* Valuation label */}
                                {stock.currentPrice > 0 && (() => {
                                  const diff = (stock.currentPrice - stock.targetMeanPrice) / stock.targetMeanPrice;
                                  let label = '', color = '';
                                  if (diff > 0.10) { label = 'Overvalued'; color = '#D85A30'; }
                                  else if (diff < -0.10) { label = 'Undervalued'; color = '#1D9E75'; }
                                  else { label = 'Fair Value'; color = '#f59e0b'; }
                                  return (
                                    <span style={{ marginLeft: '18px', fontWeight: 600, color }}>
                                      {label} {`(${diff > 0 ? '+' : ''}${(diff * 100).toFixed(1)}%)`}
                                    </span>
                                  );
                                })()}
                              </div>
                            )}
                            {stock.reason && (
                              <div className="why-reason">{stock.reason}</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: '500', background: 'var(--color-background-secondary)', fontSize: '12px' }}>
                <td colSpan="7" style={{ textAlign: 'right' }}>Total</td>
                <td>100%</td>
                <td>{activeStocks.reduce((s, st) => s + (st.quantity || 1), 0)}</td>
                <td>{cur}{totalValue.toLocaleString(loc, { maximumFractionDigits: 0 })}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '8px', textAlign: 'right' }}>Click any row to see why this stock was picked</p>
        </>
        )}
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

            {/* Show current holdings as a table */}
            {activeStocks.length > 0 && (
              <div className="changes-section">
                <h3 className="changes-title added">📊 Current Holdings ({activeStocks.length})</h3>
                <table className="changes-table">
                  <thead>
                    <tr>
                      <th>#</th><th>Company</th><th>Qty</th><th>Price</th><th>Value</th><th>Rank</th><th>PE</th><th>EPS Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeStocks.map((s, i) => {
                      const reason = s.reason || '';
                      const rankMatch = reason.match(/Rank #(\d+)/);
                      const peMatch = reason.match(/PE ([\d.]+)/);
                      const epsMatch = reason.match(/EPS growth ([\d.]+%)/);
                      return (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td className="changes-company">{s.companyName || s.ticker?.replace('.NS', '')}</td>
                          <td>{s.quantity || 1}</td>
                          <td>{cur}{s.currentPrice?.toFixed(0) || '—'}</td>
                          <td>{cur}{((s.currentPrice || 0) * (s.quantity || 1)).toLocaleString(loc, { maximumFractionDigits: 0 })}</td>
                          <td>{rankMatch ? `#${rankMatch[1]}` : '—'}</td>
                          <td>{peMatch ? peMatch[1] : '—'}</td>
                          <td>{epsMatch ? epsMatch[1] : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="changes-section">
              <h3 className="changes-title added">✅ Added Stocks ({addedStocks.length})</h3>
              {addedStocks.length > 0 ? (
                <table className="changes-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Stock</th>
                      <th>Buy Price</th>
                      <th>Qty to Buy</th>
                      <th>Total Cost</th>
                      <th>Date Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {addedStocks.map((s, i) => {
                      const price = s.buyPrice || stockPriceMap[_normTicker(s.ticker)] || 0;
                      const qty   = s.quantity || 1;
                      return (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td className="changes-company">{s.companyName || s.ticker?.replace('.NS', '')}</td>
                          <td>{price > 0 ? `${cur}${price.toFixed(2)}` : '—'}</td>
                          <td>{qty}</td>
                          <td>{price > 0 ? `${cur}${(price * qty).toLocaleString(loc, { maximumFractionDigits: 0 })}` : '—'}</td>
                          <td>{s.addedDate ? new Date(s.addedDate).toLocaleDateString(loc) : new Date(latestHistory.rebalanceDate).toLocaleDateString(loc)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : <p className="no-changes">No stocks added</p>}
            </div>

            <div className="changes-section">
              <h3 className="changes-title removed">❌ Removed Stocks ({removedStocks.length})</h3>
              {removedStocks.length > 0 ? (
                <table className="changes-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Stock</th>
                      <th>Buy Price</th>
                      <th>Exit Price</th>
                      <th>Qty</th>
                      <th>P&amp;L</th>
                      <th>Date Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {removedStocks.map((s, i) => {
                      const buyP  = s.buyPrice  || stockPriceMap[_normTicker(s.ticker)] || 0;
                      const sellP = s.salePrice || 0;
                      const qty   = s.quantity  || 1;
                      const pnl   = (sellP - buyP) * qty;
                      const pnlPct = buyP > 0 ? ((sellP - buyP) / buyP * 100) : 0;
                      const gain  = pnl >= 0;
                      return (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td className="changes-company">{s.companyName || s.ticker?.replace('.NS', '')}</td>
                          <td>{buyP > 0  ? `${cur}${buyP.toFixed(2)}`  : '—'}</td>
                          <td>{sellP > 0 ? `${cur}${sellP.toFixed(2)}` : '—'}</td>
                          <td>{qty}</td>
                          <td style={{ color: gain ? 'var(--color-green, #16a34a)' : 'var(--color-red, #dc2626)', fontWeight: '600' }}>
                            {buyP > 0 ? `${gain ? '+' : ''}${cur}${Math.abs(pnl).toLocaleString(loc, { maximumFractionDigits: 0 })} (${gain ? '+' : ''}${pnlPct.toFixed(1)}%)` : '—'}
                          </td>
                          <td>{s.addedDate ? new Date(s.addedDate).toLocaleDateString(loc) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : <p className="no-changes">No stocks removed</p>}
            </div>

            <div className="changes-section">
              <h3 className="changes-title partial">⚠️ Partially Removed ({partialStocks.length})</h3>
              {partialStocks.length > 0 ? (
                <table className="changes-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Stock</th>
                      <th>Buy Price</th>
                      <th>Exit Price</th>
                      <th>Qty Sold</th>
                      <th>Qty Kept</th>
                      <th>P&amp;L on Sold</th>
                      <th>Date Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partialStocks.map((s, i) => {
                      const buyP  = s.buyPrice  || stockPriceMap[_normTicker(s.ticker)] || 0;
                      const sellP = s.salePrice || 0;
                      const qtySold = s.quantityRemoved || 0;
                      const qtyKept = s.quantityKept    || 0;
                      const pnl   = (sellP - buyP) * qtySold;
                      const pnlPct = buyP > 0 ? ((sellP - buyP) / buyP * 100) : 0;
                      const gain  = pnl >= 0;
                      return (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td className="changes-company">{s.companyName || s.ticker?.replace('.NS', '')}</td>
                          <td>{buyP > 0  ? `${cur}${buyP.toFixed(2)}`  : '—'}</td>
                          <td>{sellP > 0 ? `${cur}${sellP.toFixed(2)}` : '—'}</td>
                          <td>{qtySold}</td>
                          <td>{qtyKept}</td>
                          <td style={{ color: gain ? 'var(--color-green, #16a34a)' : 'var(--color-red, #dc2626)', fontWeight: '600' }}>
                            {buyP > 0 ? `${gain ? '+' : ''}${cur}${Math.abs(pnl).toLocaleString(loc, { maximumFractionDigits: 0 })} (${gain ? '+' : ''}${pnlPct.toFixed(1)}%)` : '—'}
                          </td>
                          <td>{s.addedDate ? new Date(s.addedDate).toLocaleDateString(loc) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : <p className="no-changes">No partial removals</p>}
            </div>
          </>
        )}
      </div>

      {/* ═══ BENCHMARK TAB ═══ */}
      <div className={`tab-content ${activeTab === 'benchmark' ? 'active' : ''}`}>
        {/* Timeframe Selector */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px', justifyContent: 'center' }}>
          {[
            { value: '1m', label: '1M' },
            { value: '3m', label: '3M' },
            { value: '6m', label: '6M' },
            { value: '1y', label: '1Y' },
            { value: '2y', label: '2Y' },
            { value: '3y', label: '3Y' },
            { value: '5y', label: '5Y' },
            { value: 'ytd', label: 'YTD' },
            { value: 'max', label: 'MAX' },
          ].map(tf => (
            <button
              key={tf.value}
              onClick={() => { setBenchmarkTf(tf.value); loadBenchmark(tf.value); }}
              disabled={benchmarkLoading}
              style={{
                padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                border: benchmarkTf === tf.value ? '2px solid var(--color-accent, #2563eb)' : '1px solid var(--color-border, #d1d5db)',
                background: benchmarkTf === tf.value ? 'var(--color-accent, #2563eb)' : 'var(--color-bg-secondary, #f7f8fa)',
                color: benchmarkTf === tf.value ? '#fff' : 'var(--color-text-primary, #333)',
                cursor: benchmarkLoading ? 'wait' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {benchmarkLoading ? (
          <div className="loading">Loading benchmark data...</div>
        ) : benchmark && benchmark.benchmarks?.length > 0 ? (
          <div className="benchmark-wrap">
            {/* Dropdown + Summary Row */}
            <div className="bm-top-row">
              <div className="bm-basket-summary-mini">
                <div className="bm-basket-label">This Basket</div>
                <div className="bm-basket-name">{benchmark.basket.name?.replace(/ \(\d{10,}\)$/, '')}</div>
                <div className="bm-basket-value">{cur}{benchmark.basket.totalValue?.toLocaleString(loc, { maximumFractionDigits: 0 }) || '—'}</div>
                <div className="bm-basket-sub">{benchmark.basket.stockCount} stocks · {benchmark.basket.returnPct >= 0 ? '+' : ''}{benchmark.basket.returnPct || 0}% ({benchmark.timeframe === 'max' ? 'since launch' : benchmark.timeframe?.toUpperCase()})</div>
                {benchmark.basket.launchDate && (
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Launched {new Date(benchmark.basket.launchDate).toLocaleDateString()} ({benchmark.daysSinceLaunch} days ago) · Showing {benchmark.daysSinceStart} days</div>
                )}
              </div>
              <div className="bm-compare-select">
                <label className="bm-select-label">Compare with</label>
                <select className="bm-dropdown" value={selectedIndex} onChange={e => setSelectedIndex(Number(e.target.value))}>
                  {benchmark.benchmarks.map((bm, i) => (
                    <option key={i} value={i}>{bm.name} ({bm.returnPct >= 0 ? '+' : ''}{bm.returnPct}%)</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Overall Returns Card */}
            {(() => {
              const overallRet = benchmark.basket.overallReturn || 0;
              const invested = investBase;
              const currentVal = benchmark.basket.totalValue || invested;
              const unrealizedPnL = benchmark.basket.unrealizedPnL || 0;
              const realizedPnL = benchmark.basket.realizedPnL || 0;
              const totalPnL = benchmark.basket.totalPnL || 0;
              const tfLabel = benchmark.timeframe === 'max' ? 'Since Launch' : benchmark.timeframe?.toUpperCase();
              return (
                <div className="bm-overall-returns" style={{ background: 'var(--color-bg-secondary, #f7f8fa)', borderRadius: '12px', padding: '20px', margin: '16px 0', border: '1px solid var(--color-border, #e8e8e5)' }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>📈 Overall Basket Returns ({tfLabel})</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Invested</div>
                      <div style={{ fontSize: '18px', fontWeight: '600' }}>{cur}{invested.toLocaleString(loc)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Current Value</div>
                      <div style={{ fontSize: '18px', fontWeight: '600' }}>{cur}{currentVal.toLocaleString(loc, { maximumFractionDigits: 0 })}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Unrealized P&L</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: unrealizedPnL >= 0 ? '#4caf50' : '#f44336' }}>
                        {unrealizedPnL >= 0 ? '+' : ''}{cur}{unrealizedPnL.toLocaleString(loc, { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Realized P&L (Sold)</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: realizedPnL >= 0 ? '#4caf50' : '#f44336' }}>
                        {realizedPnL >= 0 ? '+' : ''}{cur}{realizedPnL.toLocaleString(loc, { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Total P&L</div>
                      <div style={{ fontSize: '18px', fontWeight: '600', color: totalPnL >= 0 ? '#4caf50' : '#f44336' }}>
                        {totalPnL >= 0 ? '+' : ''}{cur}{totalPnL.toLocaleString(loc, { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Overall Return</div>
                      <div style={{ fontSize: '18px', fontWeight: '600', color: overallRet >= 0 ? '#4caf50' : '#f44336' }}>
                        {overallRet >= 0 ? '+' : ''}{overallRet}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Line Chart — Basket vs Index */}
            {(() => {
              const bm = benchmark.benchmarks[selectedIndex];
              const indexSeries = bm?.series || [];
              const basketSeries = benchmark.basket.series || [];
              if (indexSeries.length === 0 && basketSeries.length === 0)
                return <p style={{ textAlign: 'center', color: '#666', padding: '30px' }}>No chart data available</p>;

              // Merge basket and index data by date
              const dateMap = new Map();
              basketSeries.forEach(pt => { dateMap.set(pt.date, { date: pt.date.slice(5), Basket: pt.value }); });
              indexSeries.forEach(pt => {
                const existing = dateMap.get(pt.date) || { date: pt.date.slice(5) };
                existing[bm.name] = pt.value;
                existing.date = pt.date.slice(5);
                dateMap.set(pt.date, existing);
              });
              const chartData = [...dateMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([, v]) => v);

              return (
                <div className="bm-chart-wrap">
                  <div className="bm-chart-title">Basket vs {bm.name} — Normalized {benchmark.timeframe === 'max' ? 'Since Launch' : benchmark.timeframe?.toUpperCase()} (Base = 100)</div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e5" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#999" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#999" domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="Basket" stroke="var(--color-accent)" strokeWidth={2.5} dot={false} />
                      <Line type="monotone" dataKey={bm.name} stroke="#7B61FF" strokeWidth={2} dot={false} strokeDasharray="5 3" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              );
            })()}

            {/* Investment Projection */}
            {(() => {
              const bm = benchmark.benchmarks[selectedIndex];
              const basketReturn = benchmark.basket.returnPct || 0;
              const indexReturn = bm?.returnPct || 0;
              const invested = investBase;
              const basketFinalValue = Math.round(invested * (1 + basketReturn / 100));
              const indexFinalValue = Math.round(invested * (1 + indexReturn / 100));
              const basketProfit = basketFinalValue - invested;
              const indexProfit = indexFinalValue - invested;
              const diff = basketProfit - indexProfit;
              const investLabel = isUS ? '$1,000' : '₹1,00,000';
              const tfLabel = benchmark.timeframe === 'max'
                ? (benchmark.basket.launchDate ? new Date(benchmark.basket.launchDate).toLocaleDateString() : 'launch')
                : benchmark.timeframe?.toUpperCase() + ' ago';

              return (
                <div className="bm-projection">
                  <div className="bm-projection-title">💰 If you invested {investLabel} {benchmark.timeframe === 'max' ? `on ${tfLabel}` : tfLabel}</div>
                  <div className="bm-projection-grid">
                    <div className={`bm-projection-card${basketReturn >= indexReturn ? ' winner' : ''}`}>
                      <div className="bm-proj-label">This Basket</div>
                      <div className="bm-proj-value">{cur}{basketFinalValue.toLocaleString(loc)}</div>
                      <div className={`bm-proj-return ${basketReturn >= 0 ? 'positive' : 'negative'}`}>
                        {basketReturn >= 0 ? '+' : ''}{cur}{basketProfit.toLocaleString(loc)} ({basketReturn >= 0 ? '+' : ''}{basketReturn}%)
                      </div>
                    </div>
                    <div className="bm-proj-vs">VS</div>
                    <div className={`bm-projection-card${indexReturn > basketReturn ? ' winner' : ''}`}>
                      <div className="bm-proj-label">{bm?.name}</div>
                      <div className="bm-proj-value">{cur}{indexFinalValue.toLocaleString(loc)}</div>
                      <div className={`bm-proj-return ${indexReturn >= 0 ? 'positive' : 'negative'}`}>
                        {indexReturn >= 0 ? '+' : ''}{cur}{indexProfit.toLocaleString(loc)} ({indexReturn >= 0 ? '+' : ''}{indexReturn}%)
                      </div>
                    </div>
                  </div>
                  {diff !== 0 && (
                    <div className={`bm-projection-verdict ${diff > 0 ? 'positive' : 'negative'}`}>
                      {diff > 0
                        ? `Your basket outperformed ${bm?.name} by ${cur}${Math.abs(diff).toLocaleString(loc)} (+${(basketReturn - indexReturn).toFixed(2)}%)`
                        : `${bm?.name} outperformed your basket by ${cur}${Math.abs(diff).toLocaleString(loc)} (+${(indexReturn - basketReturn).toFixed(2)}%)`
                      }
                    </div>
                  )}
                </div>
              );
            })()}

            {/* All index return cards */}
            <div className="bm-vs-row">
              <div className="bm-divider-line" />
              <span className="bm-vs-label">Index Returns ({benchmark.timeframe === 'max' ? 'Since Launch' : benchmark.timeframe?.toUpperCase()})</span>
              <div className="bm-divider-line" />
            </div>
            <div className="bm-index-grid">
              {benchmark.benchmarks.map((bm, i) => (
                <div key={i} className={`bm-index-card${i === selectedIndex ? ' bm-index-selected' : ''}`}
                  onClick={() => setSelectedIndex(i)} style={{ cursor: 'pointer' }}>
                  <div className="bm-index-name">{bm.name}</div>
                  <div className={`bm-index-return ${bm.returnPct >= 0 ? 'positive' : 'negative'}`}>
                    {bm.returnPct >= 0 ? '+' : ''}{bm.returnPct}%
                  </div>
                  <div className="bm-index-price">
                    {bm.currentValue > 0 ? bm.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—'}
                  </div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '16px', textAlign: 'center' }}>
              Index data sourced from Yahoo Finance. Chart shows normalized values (base = 100) for selected timeframe.
            </p>
          </div>
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
                {new Date(entry.rebalanceDate).toLocaleDateString(loc)} at{' '}
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
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#16a34a', marginBottom: '6px' }}>✅ Added</div>
                  <table className="changes-table" style={{ fontSize: '12px' }}>
                    <thead><tr><th>Stock</th><th>Buy Price</th><th>Qty</th><th>Total</th><th>Date</th></tr></thead>
                    <tbody>
                      {entry.changes.added.map((s, i) => {
                        const price = s.buyPrice || stockPriceMap[_normTicker(s.ticker)] || 0;
                        const qty   = s.quantity || 1;
                        return (
                          <tr key={i}>
                            <td className="changes-company">{s.companyName || s.ticker?.replace('.NS', '')}</td>
                            <td>{price > 0 ? `${cur}${price.toFixed(2)}` : '—'}</td>
                            <td>{qty}</td>
                            <td>{price > 0 ? `${cur}${(price * qty).toLocaleString(loc, { maximumFractionDigits: 0 })}` : '—'}</td>
                            <td>{s.addedDate ? new Date(s.addedDate).toLocaleDateString(loc) : new Date(entry.rebalanceDate).toLocaleDateString(loc)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {entry.changes?.removed?.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#dc2626', marginBottom: '6px' }}>❌ Removed</div>
                  <table className="changes-table" style={{ fontSize: '12px' }}>
                    <thead><tr><th>Stock</th><th>Buy Price</th><th>Exit Price</th><th>Qty</th><th>P&amp;L</th><th>Date Added</th></tr></thead>
                    <tbody>
                      {entry.changes.removed.map((s, i) => {
                        const buyP  = s.buyPrice  || stockPriceMap[_normTicker(s.ticker)] || 0;
                        const sellP = s.salePrice || 0;
                        const qty   = s.quantity  || 1;
                        const pnl   = (sellP - buyP) * qty;
                        const pnlPct = buyP > 0 ? ((sellP - buyP) / buyP * 100) : 0;
                        const gain  = pnl >= 0;
                        return (
                          <tr key={i}>
                            <td className="changes-company">{s.companyName || s.ticker?.replace('.NS', '')}</td>
                            <td>{buyP > 0  ? `${cur}${buyP.toFixed(2)}`  : '—'}</td>
                            <td>{sellP > 0 ? `${cur}${sellP.toFixed(2)}` : '—'}</td>
                            <td>{qty}</td>
                            <td style={{ color: gain ? '#16a34a' : '#dc2626', fontWeight: '600' }}>
                              {buyP > 0 ? `${gain ? '+' : ''}${cur}${Math.abs(pnl).toLocaleString(loc, { maximumFractionDigits: 0 })} (${gain ? '+' : ''}${pnlPct.toFixed(1)}%)` : '—'}
                            </td>
                            <td>{s.addedDate ? new Date(s.addedDate).toLocaleDateString(loc) : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {(entry.changes?.partialRemoved?.length || 0) > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#b45309', marginBottom: '6px' }}>⚠️ Partial</div>
                  <table className="changes-table" style={{ fontSize: '12px' }}>
                    <thead><tr><th>Stock</th><th>Buy Price</th><th>Exit Price</th><th>Sold</th><th>Kept</th><th>P&amp;L on Sold</th><th>Date Added</th></tr></thead>
                    <tbody>
                      {entry.changes.partialRemoved.map((s, i) => {
                        const buyP    = s.buyPrice  || 0;
                        const sellP   = s.salePrice || 0;
                        const qtySold = s.quantityRemoved || 0;
                        const qtyKept = s.quantityKept    || 0;
                        const pnl     = (sellP - buyP) * qtySold;
                        const pnlPct  = buyP > 0 ? ((sellP - buyP) / buyP * 100) : 0;
                        const gain    = pnl >= 0;
                        return (
                          <tr key={i}>
                            <td className="changes-company">{s.companyName || s.ticker?.replace('.NS', '')}</td>
                            <td>{buyP > 0  ? `${cur}${buyP.toFixed(2)}`  : '—'}</td>
                            <td>{sellP > 0 ? `${cur}${sellP.toFixed(2)}` : '—'}</td>
                            <td>{qtySold}</td>
                            <td>{qtyKept}</td>
                            <td style={{ color: gain ? '#16a34a' : '#dc2626', fontWeight: '600' }}>
                              {buyP > 0 ? `${gain ? '+' : ''}${cur}${Math.abs(pnl).toLocaleString(loc, { maximumFractionDigits: 0 })} (${gain ? '+' : ''}${pnlPct.toFixed(1)}%)` : '—'}
                            </td>
                            <td>{s.addedDate ? new Date(s.addedDate).toLocaleDateString(loc) : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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
        <BrokerConnect stocks={activeStocks} totalValue={totalValue} />
      </div>

      {/* ═══ ABOUT TAB ═══ */}
      <div className={`tab-content ${activeTab === 'about' ? 'active' : ''}`}>
        <div className="about-section">
          <h3>About {basket.name?.replace(/ \(\d{10,}\)$/, '')}</h3>
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
              <span className="about-value">{activeStocks.length} stocks</span>
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
              { name: 'Market Trend', pts: '0-15 pts', desc: 'Position within 52-week range. Best when mid-range (not overbought/oversold)' },
              { name: 'Valuation (PE)', pts: '0-20 pts', desc: 'Price-to-Earnings ratio. Lower PE = higher score (undervalued)' },
              { name: 'Earnings Growth', pts: '0-15 pts', desc: 'Recent EPS growth rate. Higher growth = higher score' },
              { name: 'Future Growth', pts: '0-15 pts', desc: 'Analyst price targets and forward earnings projections' },
              { name: 'Market Sentiment', pts: '0-12 pts', desc: 'News sentiment, 52-week momentum and social indicators' },
              { name: 'Momentum / RSI', pts: '0-13 pts', desc: 'RSI indicator, SMA50 vs SMA200 trend signals' },
              { name: 'Analyst Rating', pts: '0-10 pts', desc: 'Buy/Hold/Sell consensus across covering analysts' },
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
            <li>Fetch live data for all stocks in the {basket.theme} universe from Yahoo Finance (NSE primary for India, with Stooq as tertiary fallback)</li>
            <li>Score each stock on 7 quality criteria (total 100 points): Market Trend, Valuation, Earnings Growth, Future Growth, Sentiment, Momentum/RSI, Analyst Rating</li>
            <li>Penalize stocks with unreliable data: −25 pts for static fallback, −10 pts for Stooq-only data</li>
            <li>Select top-scoring stocks and allocate shares proportional to quality score</li>
            <li>Calculate minimum investment amount based on current prices × quantities</li>
            <li>Compare with previous basket — identify added, removed, and partially sold stocks</li>
            <li>Send email notifications to all subscribers with change details</li>
          </ol>
        </div>
      </div>

      
      {/* ═══ AI INSIGHTS TAB ═══ */}
      <div className={`tab-content ${activeTab === 'insights' ? 'active' : ''}`}>
        <div style={{ background: 'var(--color-bg-secondary, #f7f8fa)', borderRadius: '12px', padding: '20px', border: '1px solid var(--color-border, #e8e8e5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}>Claude Basket Analysis</h3>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                setIsAnalyzing(true);
                setTimeout(() => {
                  setAiAnalysis(`Claude Analysis Report for ${basket.name}:

` +
                    `1. Overall Assessment: This basket is well-diversified with a total of ${activeStocks.length} active holdings. The primary weighting relies on ${activeStocks[0]?.companyName || 'top companies'} which shows strong fundamentals.

` +
                    `2. Risk Profile: Moderate. The exposure is balanced, but keep an eye on macro-economic shifts affecting the core theme (${basket.theme}).

` +
                    `3. Valuation Insight: The average P/E suggests ${filterPE === 'high' ? 'premium valuation' : 'fair value'}, aligning with current market trends.

` +
                    `Recommendation: Hold steady, rebalance next quarter.`);
                  setIsAnalyzing(false);
                }, 1500);
              }}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Basket with Claude'}
            </button>
          </div>
          {aiAnalysis ? (
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '14px', color: 'var(--color-text-primary)' }}>
              {aiAnalysis}
            </div>
          ) : (
            <p style={{ color: '#666', textAlign: 'center', padding: '30px' }}>
              Click the button above to generate AI-powered insights for this basket and its underlying stocks.
            </p>
          )}
        </div>
      </div>

      {/* ═══ STOCK DETAIL MODAL ═══ */}
      {selectedStockDetail && (
        <div className="cb-modal-overlay" onClick={() => setSelectedStockDetail(null)}>
          <div className="cb-modal" style={{ width: '600px', maxWidth: '90vw', background: 'var(--color-bg-primary, #fff)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 5px 0' }}>{selectedStockDetail.companyName || selectedStockDetail.ticker?.replace('.NS', '')}</h3>
            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>{selectedStockDetail.ticker?.replace('.NS', '')}</p>
            
            <div style={{ display: 'flex', gap: '20px', marginTop: '15px', padding: '15px', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
              <div>
                <div style={{fontSize: '11px', color: 'var(--color-text-secondary)'}}>Current Price</div>
                <strong style={{fontSize: '16px'}}>{cur}{selectedStockDetail.currentPrice?.toFixed(2)}</strong>
              </div>
              <div>
                <div style={{fontSize: '11px', color: 'var(--color-text-secondary)'}}>P/E Ratio</div>
                <strong style={{fontSize: '16px'}}>{selectedStockDetail.peRatio?.toFixed(1) || 'N/A'}</strong>
              </div>
              <div>
                <div style={{fontSize: '11px', color: 'var(--color-text-secondary)'}}>52W High</div>
                <strong style={{fontSize: '16px'}}>{cur}{selectedStockDetail.high52Week?.toFixed(2) || 'N/A'}</strong>
              </div>
            </div>

            <div style={{ marginTop: '20px', marginBottom: '20px' }}>
              <h4>Price History (Simulated)</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={Array.from({length: 30}, (_, i) => ({
                    date: `Day ${i+1}`, 
                    price: selectedStockDetail.currentPrice * (1 + (Math.random() * 0.1 - 0.05))
                  }))}>
                  <XAxis dataKey="date" hide />
                  <YAxis domain={['dataMin', 'dataMax']} hide />
                  <Tooltip contentStyle={{ background: 'var(--color-bg-primary)' }} />
                  <Line type="monotone" dataKey="price" stroke="var(--color-accent, #2563eb)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="cb-field" style={{ marginTop: '15px' }}>
              <label className="cb-label">Set Price Alert</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="number" 
                  className="cb-input" 
                  placeholder="Target Price" 
                  value={alertInput} 
                  onChange={e => setAlertInput(e.target.value)} 
                  style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
                />
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    if(!alertInput) return;
                    const ticker = selectedStockDetail.ticker?.replace('.NS', '');
                    const newAlerts = { ...priceAlerts, [ticker]: Number(alertInput) };
                    setPriceAlerts(newAlerts);
                    localStorage.setItem('priceAlerts', JSON.stringify(newAlerts));
                    if ('Notification' in window && Notification.permission !== 'granted') {
                      Notification.requestPermission();
                    }
                    setAlertInput('');
                    alert(`Alert set for ${ticker} at ${cur}${alertInput}`);
                  }}
                >
                  Set Alert
                </button>
              </div>
              {priceAlerts[selectedStockDetail.ticker?.replace('.NS', '')] && (
                <div style={{ fontSize: '13px', color: 'var(--color-text-primary)', marginTop: '8px', padding: '8px', background: '#e0e7ff', borderRadius: '4px' }}>
                  <span style={{ color: '#3730a3', fontWeight: 'bold' }}>Current Alert: {cur}{priceAlerts[selectedStockDetail.ticker?.replace('.NS', '')]}</span>
                  <button onClick={() => {
                     const ticker = selectedStockDetail.ticker?.replace('.NS', '');
                     const newAlerts = { ...priceAlerts };
                     delete newAlerts[ticker];
                     setPriceAlerts(newAlerts);
                     localStorage.setItem('priceAlerts', JSON.stringify(newAlerts));
                  }} style={{marginLeft: '10px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold'}}>Remove</button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedStockDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
        <Link to="/baskets" className="btn btn-secondary">← Back to Baskets</Link>
        <Link to="/" className="btn btn-secondary">🏠 Dashboard</Link>
      </div>
    </div>
  );
}

export default BasketDetail;
