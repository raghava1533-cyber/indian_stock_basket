import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { basketAPI } from '../services/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, AreaChart, Area } from 'recharts';

// ─────────────────────────────────────────────
// 🌙 DARK MODE HOOK
// ─────────────────────────────────────────────
function useDarkMode() {
  const [dark, setDark] = useState(() => localStorage.getItem('darkMode') === 'true');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('darkMode', dark);
  }, [dark]);
  return [dark, setDark];
}

// ─────────────────────────────────────────────
// 🔔 PRICE ALERTS
// ─────────────────────────────────────────────
function usePriceAlerts(stocks) {
  const [alerts, setAlerts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('priceAlerts') || '{}'); } catch { return {}; }
  });

  // Persist alerts
  useEffect(() => { localStorage.setItem('priceAlerts', JSON.stringify(alerts)); }, [alerts]);

  // Check alerts when prices change
  useEffect(() => {
    if (!stocks.length) return;
    stocks.forEach(s => {
      const ticker = s.ticker || s.companyName;
      const alert = alerts[ticker];
      if (!alert || alert.triggered) return;
      const price = s.currentPrice || 0;
      const hit = (alert.type === 'above' && price >= alert.target) ||
                  (alert.type === 'below' && price <= alert.target);
      if (hit) {
        // Browser notification
        if (Notification.permission === 'granted') {
          new Notification(`📈 Price Alert: ${s.companyName || ticker}`, {
            body: `Price ${alert.type === 'above' ? 'reached' : 'dropped to'} ₹${price.toFixed(0)} (target: ₹${alert.target})`,
            icon: '/favicon.ico',
          });
        }
        setAlerts(prev => ({ ...prev, [ticker]: { ...prev[ticker], triggered: true, hitAt: price } }));
      }
    });
  }, [stocks, alerts]);

  const setAlert = (ticker, target, type) => {
    if (Notification.permission === 'default') Notification.requestPermission();
    setAlerts(prev => ({ ...prev, [ticker]: { target: Number(target), type, triggered: false } }));
  };

  const removeAlert = (ticker) => {
    setAlerts(prev => { const n = { ...prev }; delete n[ticker]; return n; });
  };

  return { alerts, setAlert, removeAlert };
}

// ─────────────────────────────────────────────
// 📊 STOCK DETAIL MODAL
// ─────────────────────────────────────────────
function StockDetailModal({ stock, onClose, cur, loc, alerts, setAlert, removeAlert }) {
  const [alertTarget, setAlertTarget] = useState('');
  const [alertType, setAlertType] = useState('above');
  const ticker = stock.ticker || stock.companyName;
  const existingAlert = alerts[ticker];

  // Simulated sparkline from 52w low to high through current
  const sparkData = (() => {
    const lo = stock.low52Week || stock.currentPrice * 0.8;
    const hi = stock.high52Week || stock.currentPrice * 1.2;
    const cur = stock.currentPrice || (lo + hi) / 2;
    const pts = 20;
    return Array.from({ length: pts }, (_, i) => {
      const t = i / (pts - 1);
      const base = lo + (hi - lo) * Math.sin(t * Math.PI * 0.8 + 0.2);
      const jitter = (Math.random() - 0.5) * (hi - lo) * 0.08;
      return { i, value: Math.round(i === pts - 1 ? cur : base + jitter) };
    });
  })();

  const pct52 = stock.high52Week && stock.low52Week
    ? (((stock.currentPrice - stock.low52Week) / (stock.high52Week - stock.low52Week)) * 100).toFixed(0)
    : null;

  return (
    <div className="sdm-overlay" onClick={onClose}>
      <div className="sdm-modal" onClick={e => e.stopPropagation()}>
        <button className="sdm-close" onClick={onClose}>✕</button>

        {/* Header */}
        <div className="sdm-header">
          <div>
            <div className="sdm-company">{stock.companyName || ticker}</div>
            <div className="sdm-ticker">{ticker?.replace('.NS', '')} · NSE</div>
          </div>
          <div className="sdm-price-block">
            <div className="sdm-price">{cur}{stock.currentPrice?.toFixed(0)}</div>
            {stock.dayChangePercent != null && (
              <div className={`sdm-change ${stock.dayChangePercent >= 0 ? 'pos' : 'neg'}`}>
                {stock.dayChangePercent >= 0 ? '▲' : '▼'} {Math.abs(stock.dayChangePercent).toFixed(2)}%
              </div>
            )}
          </div>
        </div>

        {/* Sparkline chart */}
        <div className="sdm-chart">
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={sparkData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="i" hide />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip formatter={v => [`${cur}${v}`, 'Price']} contentStyle={{ fontSize: 11, borderRadius: 6 }} />
              <Area type="monotone" dataKey="value" stroke="var(--color-accent)" strokeWidth={2} fill="url(#sparkGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Key metrics */}
        <div className="sdm-metrics">
          {[
            ['Score', stock.score != null ? `${stock.score.toFixed(0)}/100` : '—'],
            ['PE Ratio', stock.peRatio != null ? stock.peRatio.toFixed(1) : '—'],
            ['EPS Growth', stock.earningsGrowth != null ? `${stock.earningsGrowth.toFixed(1)}%` : '—'],
            ['52W Low', stock.low52Week ? `${cur}${stock.low52Week.toFixed(0)}` : '—'],
            ['52W High', stock.high52Week ? `${cur}${stock.high52Week.toFixed(0)}` : '—'],
            ['52W Position', pct52 != null ? `${pct52}%` : '—'],
            ['RSI', stock.rsi != null ? stock.rsi.toFixed(0) : '—'],
            ['Mkt Cap', stock.marketCapCr ? `${cur}${stock.marketCapCr.toLocaleString(loc)} Cr` : '—'],
            ['Analyst Target', stock.targetMeanPrice ? `${cur}${Math.round(stock.targetMeanPrice)}` : '—'],
            ['Analyst Rating', stock.recommendationKey ? stock.recommendationKey.replace('_', ' ').toUpperCase() : '—'],
            ['Weight', stock.weight != null ? `${stock.weight.toFixed(1)}%` : '—'],
            ['Quantity', stock.quantity || 1],
          ].map(([label, val]) => (
            <div className="sdm-metric" key={label}>
              <div className="sdm-metric-label">{label}</div>
              <div className="sdm-metric-val">{val}</div>
            </div>
          ))}
        </div>

        {/* Reason */}
        {stock.reason && <div className="sdm-reason">💡 {stock.reason}</div>}

        {/* Price Alert */}
        <div className="sdm-alert-section">
          <div className="sdm-alert-title">🔔 Price Alert</div>
          {existingAlert ? (
            <div className="sdm-alert-existing">
              <span>
                Alert set: {existingAlert.type === 'above' ? '↑ Above' : '↓ Below'} {cur}{existingAlert.target}
                {existingAlert.triggered && <span className="sdm-alert-hit"> ✅ Hit at {cur}{existingAlert.hitAt}</span>}
              </span>
              <button className="sdm-alert-remove" onClick={() => removeAlert(ticker)}>Remove</button>
            </div>
          ) : (
            <div className="sdm-alert-form">
              <select className="sdm-alert-type" value={alertType} onChange={e => setAlertType(e.target.value)}>
                <option value="above">↑ Price goes above</option>
                <option value="below">↓ Price drops below</option>
              </select>
              <input
                className="sdm-alert-input"
                type="number"
                placeholder={`e.g. ${cur}${Math.round((stock.currentPrice || 0) * 1.05)}`}
                value={alertTarget}
                onChange={e => setAlertTarget(e.target.value)}
              />
              <button
                className="sdm-alert-btn"
                onClick={() => { if (alertTarget) { setAlert(ticker, alertTarget, alertType); setAlertTarget(''); } }}
              >
                Set Alert
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 🤖 AI INSIGHTS PANEL
// ─────────────────────────────────────────────
function AIInsightsPanel({ basket, stocks, cur, loc }) {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('basket'); // 'basket' | 'risks' | 'picks'
  const abortRef = useRef(null);

  const fetchInsight = useCallback(async (selectedMode) => {
    setLoading(true);
    setInsight('');
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const topStocks = stocks.slice(0, 10).map(s =>
      `${s.companyName || s.ticker} — Price: ${cur}${s.currentPrice?.toFixed(0)}, PE: ${s.peRatio?.toFixed(1) ?? 'N/A'}, EPS Growth: ${s.earningsGrowth?.toFixed(1) ?? 'N/A'}%, Score: ${s.score?.toFixed(0) ?? 'N/A'}/100, Weight: ${s.weight?.toFixed(1)}%`
    ).join('\n');

    const prompts = {
      basket: `You are a sharp financial analyst. Analyze this stock basket:\n\nBasket: ${basket.name}\nTheme: ${basket.theme}\nCategory: ${basket.category}\nTotal stocks: ${stocks.length}\n\nTop holdings:\n${topStocks}\n\nProvide a concise 4-5 sentence analysis covering: overall portfolio quality, sector concentration risk, valuation assessment, and one key strength and one key weakness. Be specific and data-driven.`,
      risks: `You are a risk analyst. Identify the top 3 risks for this basket:\n\nBasket: ${basket.name} (${basket.theme})\nHoldings:\n${topStocks}\n\nList 3 specific, concrete risks with brief explanations. Format as numbered list. Be direct and actionable.`,
      picks: `You are a stock picker. From these holdings, identify the 3 most attractive and 2 most concerning stocks:\n\nHoldings:\n${topStocks}\n\nGive brief reasoning for each pick based on the data. Format clearly with 🟢 for attractive and 🔴 for concerning.`,
    };

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          stream: true,
          messages: [{ role: 'user', content: prompts[selectedMode] }],
        }),
        signal: ctrl.signal,
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const json = JSON.parse(data);
            const text = json.delta?.text || '';
            if (text) setInsight(prev => prev + text);
          } catch {}
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') setInsight('Unable to load AI insights. Please try again.');
    }
    setLoading(false);
  }, [basket, stocks, cur]);

  const handleMode = (m) => {
    setMode(m);
    fetchInsight(m);
  };

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <div className="ai-panel-title">🤖 AI Insights <span className="ai-badge">Powered by Claude</span></div>
        <div className="ai-mode-tabs">
          {[['basket', '📊 Overview'], ['risks', '⚠️ Risks'], ['picks', '🎯 Stock Picks']].map(([m, label]) => (
            <button key={m} className={`ai-mode-btn${mode === m ? ' active' : ''}`} onClick={() => handleMode(m)}>{label}</button>
          ))}
        </div>
      </div>

      {!insight && !loading && (
        <div className="ai-empty">
          <div className="ai-empty-icon">✨</div>
          <p>Get AI-powered analysis of your basket</p>
          <button className="ai-generate-btn" onClick={() => fetchInsight(mode)}>Generate Insights</button>
        </div>
      )}

      {loading && (
        <div className="ai-loading">
          <span className="ai-dot" /><span className="ai-dot" /><span className="ai-dot" />
          <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>Analyzing basket...</span>
        </div>
      )}

      {insight && (
        <div className="ai-content">
          <div className="ai-text">{insight}</div>
          <button className="ai-refresh-btn" onClick={() => fetchInsight(mode)} disabled={loading}>↻ Refresh</button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 🔍 SEARCH & FILTER BAR
// ─────────────────────────────────────────────
function SearchFilterBar({ onFilterChange }) {
  const [query, setQuery] = useState('');
  const [change, setChange] = useState('all'); // 'all' | 'gainers' | 'losers'
  const [peMax, setPeMax] = useState('');
  const [scoreMin, setScoreMin] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    onFilterChange({ query, change, peMax: peMax ? Number(peMax) : null, scoreMin: scoreMin ? Number(scoreMin) : null });
  }, [query, change, peMax, scoreMin]);

  return (
    <div className="sf-bar">
      <div className="sf-search-row">
        <div className="sf-search-wrap">
          <span className="sf-search-icon">🔍</span>
          <input
            className="sf-input"
            placeholder="Search by name or ticker…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && <button className="sf-clear" onClick={() => setQuery('')}>✕</button>}
        </div>
        <button className="sf-filter-toggle" onClick={() => setShowFilters(f => !f)}>
          ⚙️ Filters {(peMax || scoreMin || change !== 'all') ? '●' : ''}
        </button>
      </div>

      {showFilters && (
        <div className="sf-filters">
          <div className="sf-filter-group">
            <label className="sf-label">Day Change</label>
            <div className="sf-btn-group">
              {[['all', 'All'], ['gainers', '↑ Gainers'], ['losers', '↓ Losers']].map(([v, l]) => (
                <button key={v} className={`sf-btn${change === v ? ' active' : ''}`} onClick={() => setChange(v)}>{l}</button>
              ))}
            </div>
          </div>
          <div className="sf-filter-group">
            <label className="sf-label">Max PE</label>
            <input className="sf-filter-input" type="number" placeholder="e.g. 30" value={peMax} onChange={e => setPeMax(e.target.value)} />
          </div>
          <div className="sf-filter-group">
            <label className="sf-label">Min Score</label>
            <input className="sf-filter-input" type="number" placeholder="e.g. 60" value={scoreMin} onChange={e => setScoreMin(e.target.value)} />
          </div>
          <button className="sf-reset" onClick={() => { setQuery(''); setChange('all'); setPeMax(''); setScoreMin(''); }}>Reset All</button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 🏦 BROKER CONNECT (unchanged, kept as-is)
// ─────────────────────────────────────────────
function BrokerConnect({ stocks, totalValue }) {
  const [modal, setModal] = useState(null);
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
    window.open(`https://kite.zerodha.com/connect/login?v=3&api_key=${encodeURIComponent(key)}`, '_blank');
  };
  const handleZerodhaDisconnect = () => { localStorage.removeItem('zerodhaApiKey'); setZerodhaConnected(false); };
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
    { key: null, name: 'Angel One',    icon: '🟠', desc: 'Angel SmartAPI',  connected: false, soon: true },
    { key: null, name: 'Upstox',       icon: '🟣', desc: 'Upstox API v2',   connected: false, soon: true },
    { key: null, name: '5paisa',       icon: '🔴', desc: '5paisa Connect',  connected: false, soon: true },
    { key: null, name: 'ICICI Direct', icon: '🔵', desc: 'Breeze API',      connected: false, soon: true },
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
              <button className="btn btn-primary broker-btn" onClick={() => { setKeyInput(''); setModal(b.key); }}>Connect</button>
            )}
          </div>
        ))}
      </div>
      {modal === 'zerodha' && (
        <div className="cb-modal-overlay" onClick={() => setModal(null)}>
          <div className="cb-modal" onClick={e => e.stopPropagation()}>
            <h3>Connect Zerodha (Kite)</h3>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
              Enter your Kite Connect API Key. Get it from <a href="https://developers.kite.trade" target="_blank" rel="noreferrer">developers.kite.trade</a>.
            </p>
            <div className="cb-field">
              <label className="cb-label">Kite API Key</label>
              <input className="cb-input" placeholder="e.g. xxxxxxxxxxxxxxxx" value={keyInput} onChange={e => setKeyInput(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
              <button className="cb-create-btn" onClick={handleZerodhaConnect}>Authorize with Zerodha →</button>
              <button className="cb-cancel-btn" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {modal === 'groww' && (
        <div className="cb-modal-overlay" onClick={() => setModal(null)}>
          <div className="cb-modal" onClick={e => e.stopPropagation()}>
            <h3>Connect Groww</h3>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
              Groww does not provide a public trading API yet. Link your account to track and get recommendations.
            </p>
            <div className="cb-field">
              <label className="cb-label">Groww Account Email</label>
              <input className="cb-input" type="email" placeholder="your@email.com" value={growwEmail} onChange={e => setGrowwEmail(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
              <button className="cb-create-btn" onClick={handleGrowwConnect}>Link Account</button>
              <button className="cb-cancel-btn" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {(zerodhaConnected || growwConnected) && stocks.length > 0 && (
        <div className="portfolio-holdings">
          <h4>💼 Your Portfolio Holdings</h4>
          <table className="changes-table">
            <thead><tr><th>#</th><th style={{ textAlign: 'left' }}>Company</th><th>Qty</th><th>Price</th><th>Value</th><th>Weight</th></tr></thead>
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
          </table>
        </div>
      )}
      <div className="rebalance-orders">
        <h4>📋 Pending Rebalance Orders</h4>
        {stocks.length > 0 ? (
          <table className="changes-table" style={{ marginTop: '10px' }}>
            <thead><tr><th>Action</th><th style={{ textAlign: 'left' }}>Stock</th><th>Qty</th><th>Price</th><th>Amount</th><th>Status</th></tr></thead>
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
          </table>
        ) : (
          <p style={{ color: '#666', marginTop: '15px' }}>No orders pending. Rebalance the basket first.</p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 🎯 MAIN COMPONENT
// ─────────────────────────────────────────────
function BasketDetail({ onReload }) {
  const { id } = useParams();
  const [basket, setBasket] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedRow, setExpandedRow] = useState(null);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('desc');
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

  // ── NEW STATE ──
  const [dark, setDark] = useDarkMode();
  const [selectedStock, setSelectedStock] = useState(null); // for modal
  const [filter, setFilter] = useState({ query: '', change: 'all', peMax: null, scoreMin: null });
  const { alerts, setAlert, removeAlert } = usePriceAlerts(stocks);

  const isUS = (basket?.country || 'IN') === 'US';
  const cur = isUS ? '$' : '₹';
  const loc = isUS ? 'en-US' : 'en-IN';
  const investBase = isUS ? 1000 : 100000;
  const capUnit = isUS ? 'B' : 'Cr';

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const loadBasketData = useCallback(async () => {
    try {
      setLoading(true);
      const basketRes = await basketAPI.getBasketById(id);
      setBasket(basketRes.data);
      const stocksRes = await basketAPI.getBasketStocks(id);
      setStocks(stocksRes.data);
      const summaryRes = await basketAPI.getRebalanceSummary(id);
      setRebalanceHistory(summaryRes.data.recentChanges || []);
      const userEmail = localStorage.getItem('userEmail');
      setSubscribed(!!(userEmail && basketRes.data.subscribers?.includes(userEmail)));
      setLoading(false);
    } catch (error) {
      console.error('Error loading basket:', error);
      setLoading(false);
    }
  }, [id]);

  const loadNews = useCallback(async () => {
    if (news.length > 0) return;
    setNewsLoading(true);
    try { const res = await basketAPI.getBasketNews(id); setNews(res.data); } catch {}
    setNewsLoading(false);
  }, [id, news.length]);

  const loadBenchmark = useCallback(async (tf) => {
    setBenchmarkLoading(true);
    try { const res = await basketAPI.getBasketBenchmark(id, tf || benchmarkTf); setBenchmark(res.data); } catch {}
    setBenchmarkLoading(false);
  }, [id, benchmarkTf]);

  useEffect(() => { loadBasketData(); }, [loadBasketData]);

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
    if (!window.confirm('Trigger manual rebalance?')) return;
    try {
      setMessage('Rebalancing...');
      const result = await basketAPI.rebalanceBasket(id);
      setMessage(`Rebalanced! ${result.data.changes?.added?.length || 0} added, ${result.data.changes?.removed?.length || 0} removed.`);
      setTimeout(() => setMessage(''), 5000);
      loadBasketData();
      onReload();
    } catch { setMessage('Error rebalancing.'); setTimeout(() => setMessage(''), 3000); }
  };

  const handleSubscribe = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) { alert('Please log in to subscribe'); return; }
    try {
      await basketAPI.subscribeToBasket(id, token);
      setSubscribed(true);
      setMessage('Subscribed!');
      setTimeout(() => setMessage(''), 4000);
      loadBasketData();
    } catch (err) { alert(err.response?.data?.message || 'Error subscribing'); }
  };

  const handleUnsubscribe = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) { alert('Please log in'); return; }
    try {
      await basketAPI.unsubscribeFromBasket(id, token);
      setSubscribed(false);
      setMessage('Unsubscribed.');
      setTimeout(() => setMessage(''), 3000);
      loadBasketData();
    } catch (err) { alert(err.response?.data?.message || 'Error unsubscribing'); }
  };

  if (loading) return <div className="loading"><div className="spinner"></div> Loading basket details...</div>;
  if (!basket) return <div className="error">Basket not found. <Link to="/baskets">Back to Baskets</Link></div>;

  const activeStocks = stocks.filter(s => s.status === 'active' || !s.status);
  const totalValue = activeStocks.reduce((sum, s) => sum + ((s.currentPrice || 0) * (s.quantity || 1)), 0);

  // ── Apply search + filter ──
  const filteredStocks = activeStocks.filter(s => {
    const name = (s.companyName || s.ticker || '').toLowerCase();
    const ticker = (s.ticker || '').toLowerCase();
    if (filter.query && !name.includes(filter.query.toLowerCase()) && !ticker.includes(filter.query.toLowerCase())) return false;
    if (filter.change === 'gainers' && (s.dayChangePercent ?? 0) <= 0) return false;
    if (filter.change === 'losers' && (s.dayChangePercent ?? 0) >= 0) return false;
    if (filter.peMax != null && s.peRatio != null && s.peRatio > filter.peMax) return false;
    if (filter.scoreMin != null && (s.score ?? 0) < filter.scoreMin) return false;
    return true;
  });

  const sortedStocks = sortKey ? [...filteredStocks].sort((a, b) => {
    let av, bv;
    if (sortKey === 'company') { av = (a.companyName || a.ticker || '').toLowerCase(); bv = (b.companyName || b.ticker || '').toLowerCase(); }
    else if (sortKey === 'price') { av = a.currentPrice || 0; bv = b.currentPrice || 0; }
    else if (sortKey === 'change') { av = a.dayChangePercent ?? -Infinity; bv = b.dayChangePercent ?? -Infinity; }
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

  const latestHistory = rebalanceHistory[0];
  const addedStocks = latestHistory?.changes?.added || [];
  const removedStocksHistory = latestHistory?.changes?.removed || [];
  const partialStocks = latestHistory?.changes?.partialRemoved || [];
  const _normTicker = t => (t || '').replace(/\.(NS|BO)$/i, '');
  const stockPriceMap = Object.fromEntries(stocks.map(s => [_normTicker(s.ticker), s.currentPrice || 0]));

  const tabs = [
    { key: 'overview',   label: 'Overview',              icon: '📊' },
    { key: 'stocks',     label: `Stocks (${activeStocks.length})`, icon: '📈' },
    { key: 'ai',         label: 'AI Insights',           icon: '🤖' },
    { key: 'news',       label: 'News',                  icon: '📰' },
    { key: 'changes',    label: 'Changes',               icon: '🔄' },
    { key: 'benchmark',  label: 'Benchmark',             icon: '📉' },
    { key: 'history',    label: 'History',               icon: '📋' },
    { key: 'portfolio',  label: 'Portfolio',             icon: '💼' },
    { key: 'about',      label: 'About',                 icon: 'ℹ️' },
  ];

  return (
    <div className="basket-detail">
      {/* Stock detail modal */}
      {selectedStock && (
        <StockDetailModal
          stock={selectedStock}
          onClose={() => setSelectedStock(null)}
          cur={cur}
          loc={loc}
          alerts={alerts}
          setAlert={setAlert}
          removeAlert={removeAlert}
        />
      )}

      {message && <div className={message.includes('Error') ? 'error' : 'success'}>{message}</div>}

      {/* Header */}
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
          {/* 🌙 Dark mode toggle */}
          <button
            onClick={() => setDark(d => !d)}
            className="btn btn-secondary"
            title="Toggle dark mode"
            style={{ fontSize: '16px', padding: '8px 12px' }}
          >
            {dark ? '☀️' : '🌙'}
          </button>
          <button onClick={handleRebalance} className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
            🔄 Rebalance Now
          </button>
          {subscribed ? (
            <button onClick={handleUnsubscribe} className="btn btn-danger" style={{ fontSize: '12px', padding: '8px 12px' }}>✉️ Unsubscribe</button>
          ) : (
            <button onClick={handleSubscribe} className="btn btn-secondary" style={{ fontSize: '12px', padding: '8px 12px' }}>✉️ Subscribe</button>
          )}
        </div>
      </div>

      {/* Alert banner for triggered alerts */}
      {Object.entries(alerts).filter(([, a]) => a.triggered).map(([ticker, a]) => (
        <div key={ticker} className="alert-banner">
          🔔 Price alert triggered for <strong>{ticker}</strong>: hit {cur}{a.hitAt} (target {a.type === 'above' ? '≥' : '≤'} {cur}{a.target})
          <button onClick={() => removeAlert(ticker)} style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
        </div>
      ))}

      <div className="tabs">
        {tabs.map(tab => (
          <button key={tab.key} className={`tab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
            <span className="tab-icon">{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW TAB ═══ */}
      <div className={`tab-content ${activeTab === 'overview' ? 'active' : ''}`}>
        <div className="summary-grid">
          <div className="summary-card"><div className="summary-label">Total Stocks</div><div className="summary-value">{activeStocks.length} stocks</div></div>
          <div className="summary-card green"><div className="summary-label">Minimum Investment</div><div className="summary-value">{cur}{totalValue.toLocaleString(loc, { maximumFractionDigits: 0 })}</div></div>
          <div className="summary-card"><div className="summary-label">Last Rebalanced</div><div className="summary-value">{basket.lastRebalanceDate ? new Date(basket.lastRebalanceDate).toLocaleDateString() : 'Never'}</div></div>
          <div className="summary-card blue"><div className="summary-label">Next Rebalance</div><div className="summary-value">{basket.nextRebalanceDate ? new Date(basket.nextRebalanceDate).toLocaleDateString() : 'TBD'}</div></div>
          <div className="summary-card"><div className="summary-label">Subscribers</div><div className="summary-value">{basket.subscribers?.length || 0}</div></div>
          <div className="summary-card"><div className="summary-label">Launch Date</div><div className="summary-value">{basket.createdDate ? new Date(basket.createdDate).toLocaleDateString() : '—'}</div></div>
        </div>

        {/* Returns */}
        {(() => {
          const investedVal = activeStocks.reduce((sum, s) => sum + ((s.buyPrice || s.currentPrice || 0) * (s.quantity || 1)), 0);
          const removedSt = stocks.filter(s => s.status === 'removed');
          const realizedPnL = removedSt.reduce((sum, s) => sum + (((s.currentPrice || 0) - (s.buyPrice || s.currentPrice || 0)) * (s.quantity || 1)), 0);
          const unrealizedPnL = totalValue - investedVal;
          const totalPnL = unrealizedPnL + realizedPnL;
          const totalInvested = investedVal + removedSt.reduce((sum, s) => sum + ((s.buyPrice || 0) * (s.quantity || 1)), 0);
          const returnPct = totalInvested > 0 ? ((totalPnL / totalInvested) * 100).toFixed(2) : 0;
          return (
            <div style={{ background: 'var(--color-bg-secondary, #f7f8fa)', borderRadius: '12px', padding: '20px', margin: '20px 0', border: '1px solid var(--color-border, #e8e8e5)' }}>
              <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>📈 Overall Returns</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
                {[
                  ['Invested', `${cur}${investedVal.toLocaleString(loc, { maximumFractionDigits: 0 })}`],
                  ['Current Value', `${cur}${totalValue.toLocaleString(loc, { maximumFractionDigits: 0 })}`],
                  ['Unrealized P&L', `${unrealizedPnL >= 0 ? '+' : ''}${cur}${unrealizedPnL.toLocaleString(loc, { maximumFractionDigits: 0 })}`, unrealizedPnL >= 0 ? '#4caf50' : '#f44336'],
                  ['Realized P&L', `${realizedPnL >= 0 ? '+' : ''}${cur}${realizedPnL.toLocaleString(loc, { maximumFractionDigits: 0 })}`, realizedPnL >= 0 ? '#4caf50' : '#f44336'],
                  ['Total P&L', `${totalPnL >= 0 ? '+' : ''}${cur}${totalPnL.toLocaleString(loc, { maximumFractionDigits: 0 })}`, totalPnL >= 0 ? '#4caf50' : '#f44336'],
                  ['Return %', `${Number(returnPct) >= 0 ? '+' : ''}${returnPct}%`, Number(returnPct) >= 0 ? '#4caf50' : '#f44336'],
                ].map(([label, val, color]) => (
                  <div key={label}>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{label}</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: color || 'inherit' }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Stock Allocation Summary</h3>
        {!localStorage.getItem('authToken') ? (
          <div className="stocks-login-gate">
            <div className="stocks-gate-icon">🔒</div>
            <div className="stocks-gate-title">Login to view stock allocation</div>
            <a href="/login" className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-block' }}>Login to continue</a>
          </div>
        ) : (
          <div className="stock-allocation-grid">
            {activeStocks.map((stock, idx) => (
              <div key={idx} className="alloc-card" onClick={() => setSelectedStock(stock)} style={{ cursor: 'pointer' }}>
                <div className="alloc-rank">#{idx + 1}</div>
                <div className="alloc-info">
                  <div className="alloc-ticker">{stock.companyName || stock.ticker?.replace('.NS', '')}</div>
                  <div className="alloc-meta">{stock.quantity || 1} shares × {cur}{stock.currentPrice?.toFixed(0) || '—'} = {cur}{((stock.currentPrice || 0) * (stock.quantity || 1)).toLocaleString(loc, { maximumFractionDigits: 0 })}</div>
                </div>
                <div className="alloc-weight">{stock.weight?.toFixed(1)}%</div>
                {alerts[stock.ticker] && <div className="alloc-alert-dot" title="Price alert set">🔔</div>}
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
            <a href="/login" className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-block' }}>Login to continue</a>
          </div>
        ) : (
          <>
            {/* Search + Filter bar */}
            <SearchFilterBar onFilterChange={setFilter} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {filteredStocks.length} of {activeStocks.length} stocks
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {liveRefreshing && <span className="live-dot-pulse" />}
                {liveRefreshing ? 'Updating…' : lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Live · auto-refresh 30s'}
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="stocks-table">
                <thead>
                  <tr>
                    {[['#', null], ['Company', 'company'], ['Price', 'price'], ['Day Change', 'change'], ['52W Range', null], ['PE', 'pe'], ['EPS%', 'eps'], ['Weight', 'weight'], ['Qty', 'qty'], ['Value', 'value'], ['Score', 'score'], ['Alert', null]].map(([label, key]) => (
                      <th key={label} onClick={key ? () => handleSort(key) : undefined}
                        style={key ? { cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' } : {}}>
                        {label}{key && <span style={{ marginLeft: '4px', opacity: sortKey === key ? 1 : 0.3, fontSize: '10px' }}>{sortKey === key ? (sortDir === 'asc' ? '▲' : '▼') : '▼'}</span>}
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
                    const ticker = stock.ticker || stock.companyName;
                    const hasAlert = !!alerts[ticker];

                    return (
                      <React.Fragment key={idx}>
                        <tr className={`stock-row${isExpanded ? ' expanded' : ''}`}
                          style={{ cursor: 'pointer' }}>
                          <td onClick={() => setExpandedRow(isExpanded ? null : idx)}>{idx + 1}</td>
                          <td onClick={() => setSelectedStock(stock)}>
                            <div style={{ fontWeight: '500', fontSize: '13px', color: 'var(--color-text-primary)' }}>
                              {stock.companyName || stock.ticker?.replace('.NS', '')}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                              {stock.ticker?.replace('.NS', '')}
                              {stock.futureGrowth != null && <span style={{ marginLeft: '6px', color: 'var(--color-accent)' }}>FG {stock.futureGrowth.toFixed(1)}/10</span>}
                            </div>
                          </td>
                          <td onClick={() => setSelectedStock(stock)}>{cur}{price.toFixed(0)}</td>
                          <td onClick={() => setExpandedRow(isExpanded ? null : idx)}>
                            {stock.dayChangePercent != null ? (
                              <span className={stock.dayChangePercent >= 0 ? 'price-positive' : 'price-negative'} style={{ fontWeight: '500' }}>
                                {stock.dayChangePercent >= 0 ? '+' : ''}{stock.dayChangePercent.toFixed(2)}%
                                {stock.dayChange != null && <div style={{ fontSize: '10px', fontWeight: '400', opacity: 0.75 }}>{stock.dayChange >= 0 ? '+' : ''}{cur}{Math.abs(stock.dayChange).toFixed(2)}</div>}
                              </span>
                            ) : <span style={{ color: 'var(--color-text-secondary)' }}>—</span>}
                          </td>
                          <td onClick={() => setExpandedRow(isExpanded ? null : idx)}>
                            {h52 > 0 && l52 > 0 && price > 0 ? (() => {
                              const pct = Math.min(100, Math.max(0, ((price - l52) / (h52 - l52)) * 100));
                              const dotColor = pct >= 75 ? 'var(--color-accent)' : pct <= 25 ? 'var(--color-negative)' : '#f59e0b';
                              return (
                                <div className="range52-wrap">
                                  <div className="range52-bar"><div className="range52-dot" style={{ left: `${pct}%`, background: dotColor }} /></div>
                                  <div className="range52-labels"><span>{cur}{l52.toFixed(0)}</span><span>{cur}{h52.toFixed(0)}</span></div>
                                </div>
                              );
                            })() : '—'}
                          </td>
                          <td onClick={() => setExpandedRow(isExpanded ? null : idx)}>{stock.peRatio != null ? stock.peRatio.toFixed(1) : '—'}</td>
                          <td onClick={() => setExpandedRow(isExpanded ? null : idx)}>{stock.earningsGrowth != null ? `${stock.earningsGrowth.toFixed(1)}%` : '—'}</td>
                          <td onClick={() => setExpandedRow(isExpanded ? null : idx)}>{stock.weight?.toFixed(1)}%</td>
                          <td onClick={() => setExpandedRow(isExpanded ? null : idx)}>{stock.quantity || 1}</td>
                          <td onClick={() => setExpandedRow(isExpanded ? null : idx)}>{cur}{(price * (stock.quantity || 1)).toLocaleString(loc, { maximumFractionDigits: 0 })}</td>
                          <td onClick={() => setExpandedRow(isExpanded ? null : idx)}>
                            <div className="score-bar">
                              <div className="score-fill" style={{ width: `${Math.min(stock.score || 0, 100)}%` }}></div>
                              <span className="score-text">{stock.score?.toFixed(0) || '—'}</span>
                            </div>
                          </td>
                          {/* Alert bell */}
                          <td>
                            <button
                              className={`alert-bell${hasAlert ? ' set' : ''}`}
                              title={hasAlert ? 'Alert set — click to view' : 'Set price alert'}
                              onClick={() => setSelectedStock(stock)}
                            >
                              {hasAlert ? '🔔' : '🔕'}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="why-row">
                            <td colSpan="12">
                              <div className="why-panel">
                                <div className="why-title">📌 Why this stock was picked</div>
                                <div className="why-pills">
                                  {stock.peRatio != null && <span className="why-pill">PE: {stock.peRatio.toFixed(1)}</span>}
                                  {stock.earningsGrowth != null && <span className="why-pill accent">EPS Growth: {stock.earningsGrowth.toFixed(1)}%</span>}
                                  {stock.revenueGrowth != null && <span className="why-pill">Rev Growth: {stock.revenueGrowth.toFixed(1)}%</span>}
                                  {stock.futureGrowth != null && <span className="why-pill accent">Future Growth: {stock.futureGrowth.toFixed(1)}/10</span>}
                                  {stock.socialSentiment != null && <span className="why-pill">Sentiment: {stock.socialSentiment.toFixed(1)}/10</span>}
                                  {stock.rsi != null && <span className={`why-pill ${stock.rsi <= 30 ? 'accent' : stock.rsi >= 70 ? 'negative' : ''}`}>RSI: {stock.rsi.toFixed(0)}</span>}
                                  {stock.recommendationKey && (
                                    <span className={`why-pill ${stock.recommendationKey === 'buy' || stock.recommendationKey === 'strong_buy' ? 'accent' : ''}`}>
                                      Analyst: {stock.recommendationKey.replace('_', ' ').toUpperCase()}
                                    </span>
                                  )}
                                  {stock.targetMeanPrice != null && stock.currentPrice > 0 && (
                                    <span className={`why-pill ${stock.targetMeanPrice > stock.currentPrice ? 'accent' : 'negative'}`}>
                                      Target: {cur}{Math.round(stock.targetMeanPrice)} ({stock.targetMeanPrice > stock.currentPrice ? '+' : ''}{((stock.targetMeanPrice - stock.currentPrice) / stock.currentPrice * 100).toFixed(1)}%)
                                    </span>
                                  )}
                                  {stock.score != null && <span className="why-pill score">Score: {stock.score.toFixed(0)}/100</span>}
                                </div>
                                {stock.reason && <div className="why-reason">{stock.reason}</div>}
                                <button className="btn btn-secondary" style={{ marginTop: 10, fontSize: 12 }} onClick={() => setSelectedStock(stock)}>
                                  📊 Open Detail View →
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {sortedStocks.length === 0 && (
                    <tr><td colSpan="12" style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-secondary)' }}>No stocks match your filters.</td></tr>
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: '500', background: 'var(--color-background-secondary)', fontSize: '12px' }}>
                    <td colSpan="7" style={{ textAlign: 'right' }}>Total</td>
                    <td>100%</td>
                    <td>{activeStocks.reduce((s, st) => s + (st.quantity || 1), 0)}</td>
                    <td>{cur}{totalValue.toLocaleString(loc, { maximumFractionDigits: 0 })}</td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '8px', textAlign: 'right' }}>Click company name to open detail · Click 🔕 to set a price alert</p>
          </>
        )}
      </div>

      {/* ═══ AI INSIGHTS TAB ═══ */}
      <div className={`tab-content ${activeTab === 'ai' ? 'active' : ''}`}>
        {basket && stocks.length > 0 ? (
          <AIInsightsPanel basket={basket} stocks={activeStocks} cur={cur} loc={loc} />
        ) : (
          <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>Load basket data first.</p>
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
                  <span className={`news-sentiment ${item.sentiment}`}>{item.sentiment === 'positive' ? '🟢' : item.sentiment === 'negative' ? '🔴' : '🔵'} {item.sentiment}</span>
                  <span className="news-source">{item.source}</span>
                </div>
                <h4 className="news-title">{item.title}</h4>
                <p className="news-summary">{item.summary}</p>
                <div className="news-footer">
                  <span className="news-ticker">{item.companyName}</span>
                  <span className="news-date">{new Date(item.date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>No news available.</p>
        )}
      </div>

      {/* ═══ CHANGES TAB ═══ */}
      <div className={`tab-content ${activeTab === 'changes' ? 'active' : ''}`}>
        {!latestHistory ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>No rebalance changes yet.</p>
        ) : (
          <>
            <div className="changes-header">
              <span>Last Rebalance: {new Date(latestHistory.rebalanceDate).toLocaleDateString()}</span>
              <span>{latestHistory.reason || 'Auto rebalance'}</span>
            </div>
            {activeStocks.length > 0 && (
              <div className="changes-section">
                <h3 className="changes-title added">📊 Current Holdings ({activeStocks.length})</h3>
                <table className="changes-table">
                  <thead><tr><th>#</th><th>Company</th><th>Qty</th><th>Price</th><th>Value</th><th>Rank</th><th>PE</th><th>EPS Growth</th></tr></thead>
                  <tbody>
                    {activeStocks.map((s, i) => {
                      const reason = s.reason || '';
                      const rankMatch = reason.match(/Rank #(\d+)/);
                      return (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td className="changes-company">{s.companyName || s.ticker?.replace('.NS', '')}</td>
                          <td>{s.quantity || 1}</td>
                          <td>{cur}{s.currentPrice?.toFixed(0) || '—'}</td>
                          <td>{cur}{((s.currentPrice || 0) * (s.quantity || 1)).toLocaleString(loc, { maximumFractionDigits: 0 })}</td>
                          <td>{rankMatch ? `#${rankMatch[1]}` : '—'}</td>
                          <td>{s.peRatio?.toFixed(1) || '—'}</td>
                          <td>{s.earningsGrowth != null ? `${s.earningsGrowth.toFixed(1)}%` : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="changes-section">
              <h3 className="changes-title added">✅ Added ({addedStocks.length})</h3>
              {addedStocks.length > 0 ? (
                <table className="changes-table">
                  <thead><tr><th>#</th><th>Stock</th><th>Buy Price</th><th>Qty</th><th>Total</th><th>Date</th></tr></thead>
                  <tbody>
                    {addedStocks.map((s, i) => {
                      const price = s.buyPrice || stockPriceMap[_normTicker(s.ticker)] || 0;
                      const qty = s.quantity || 1;
                      return <tr key={i}><td>{i+1}</td><td className="changes-company">{s.companyName || s.ticker?.replace('.NS', '')}</td><td>{price > 0 ? `${cur}${price.toFixed(2)}` : '—'}</td><td>{qty}</td><td>{price > 0 ? `${cur}${(price*qty).toLocaleString(loc, {maximumFractionDigits:0})}` : '—'}</td><td>{s.addedDate ? new Date(s.addedDate).toLocaleDateString(loc) : '—'}</td></tr>;
                    })}
                  </tbody>
                </table>
              ) : <p className="no-changes">No stocks added</p>}
            </div>
            <div className="changes-section">
              <h3 className="changes-title removed">❌ Removed ({removedStocksHistory.length})</h3>
              {removedStocksHistory.length > 0 ? (
                <table className="changes-table">
                  <thead><tr><th>#</th><th>Stock</th><th>Buy</th><th>Exit</th><th>Qty</th><th>P&L</th><th>Date</th></tr></thead>
                  <tbody>
                    {removedStocksHistory.map((s, i) => {
                      const buyP = s.buyPrice || 0; const sellP = s.salePrice || 0; const qty = s.quantity || 1;
                      const pnl = (sellP - buyP) * qty; const pnlPct = buyP > 0 ? ((sellP - buyP) / buyP * 100) : 0; const gain = pnl >= 0;
                      return <tr key={i}><td>{i+1}</td><td className="changes-company">{s.companyName || s.ticker?.replace('.NS', '')}</td><td>{buyP > 0 ? `${cur}${buyP.toFixed(2)}` : '—'}</td><td>{sellP > 0 ? `${cur}${sellP.toFixed(2)}` : '—'}</td><td>{qty}</td><td style={{color: gain ? '#16a34a' : '#dc2626', fontWeight: '600'}}>{buyP > 0 ? `${gain?'+':''}${cur}${Math.abs(pnl).toLocaleString(loc,{maximumFractionDigits:0})} (${gain?'+':''}${pnlPct.toFixed(1)}%)` : '—'}</td><td>{s.addedDate ? new Date(s.addedDate).toLocaleDateString(loc) : '—'}</td></tr>;
                    })}
                  </tbody>
                </table>
              ) : <p className="no-changes">No stocks removed</p>}
            </div>
          </>
        )}
      </div>

      {/* ═══ BENCHMARK TAB ═══ */}
      <div className={`tab-content ${activeTab === 'benchmark' ? 'active' : ''}`}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px', justifyContent: 'center' }}>
          {['1m','3m','6m','1y','2y','3y','5y','ytd','max'].map(tf => (
            <button key={tf} onClick={() => { setBenchmarkTf(tf); loadBenchmark(tf); }} disabled={benchmarkLoading}
              style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                border: benchmarkTf === tf ? '2px solid var(--color-accent)' : '1px solid var(--color-border, #d1d5db)',
                background: benchmarkTf === tf ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                color: benchmarkTf === tf ? '#fff' : 'var(--color-text-primary)', cursor: benchmarkLoading ? 'wait' : 'pointer' }}>
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
        {benchmarkLoading ? <div className="loading">Loading benchmark data...</div>
          : benchmark && benchmark.benchmarks?.length > 0 ? (
          <div className="benchmark-wrap">
            <div className="bm-top-row">
              <div className="bm-basket-summary-mini">
                <div className="bm-basket-label">This Basket</div>
                <div className="bm-basket-name">{benchmark.basket.name?.replace(/ \(\d{10,}\)$/, '')}</div>
                <div className="bm-basket-value">{cur}{benchmark.basket.totalValue?.toLocaleString(loc, { maximumFractionDigits: 0 }) || '—'}</div>
                <div className="bm-basket-sub">{benchmark.basket.stockCount} stocks · {benchmark.basket.returnPct >= 0 ? '+' : ''}{benchmark.basket.returnPct || 0}%</div>
              </div>
              <div className="bm-compare-select">
                <label className="bm-select-label">Compare with</label>
                <select className="bm-dropdown" value={selectedIndex} onChange={e => setSelectedIndex(Number(e.target.value))}>
                  {benchmark.benchmarks.map((bm, i) => <option key={i} value={i}>{bm.name} ({bm.returnPct >= 0 ? '+' : ''}{bm.returnPct}%)</option>)}
                </select>
              </div>
            </div>
            {(() => {
              const bm = benchmark.benchmarks[selectedIndex];
              const basketSeries = benchmark.basket.series || [];
              const indexSeries = bm?.series || [];
              const dateMap = new Map();
              basketSeries.forEach(pt => dateMap.set(pt.date, { date: pt.date.slice(5), Basket: pt.value }));
              indexSeries.forEach(pt => { const e = dateMap.get(pt.date) || { date: pt.date.slice(5) }; e[bm.name] = pt.value; e.date = pt.date.slice(5); dateMap.set(pt.date, e); });
              const chartData = [...dateMap.entries()].sort((a,b) => a[0].localeCompare(b[0])).map(([,v]) => v);
              if (!chartData.length) return null;
              return (
                <div className="bm-chart-wrap">
                  <div className="bm-chart-title">Basket vs {bm.name} — Normalized (Base = 100)</div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e5" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#999" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#999" domain={['auto','auto']} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="Basket" stroke="var(--color-accent)" strokeWidth={2.5} dot={false} />
                      <Line type="monotone" dataKey={bm.name} stroke="#7B61FF" strokeWidth={2} dot={false} strokeDasharray="5 3" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              );
            })()}
            <div className="bm-index-grid">
              {benchmark.benchmarks.map((bm, i) => (
                <div key={i} className={`bm-index-card${i === selectedIndex ? ' bm-index-selected' : ''}`} onClick={() => setSelectedIndex(i)} style={{ cursor: 'pointer' }}>
                  <div className="bm-index-name">{bm.name}</div>
                  <div className={`bm-index-return ${bm.returnPct >= 0 ? 'positive' : 'negative'}`}>{bm.returnPct >= 0 ? '+' : ''}{bm.returnPct}%</div>
                </div>
              ))}
            </div>
          </div>
        ) : <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>Benchmark data not available</p>}
      </div>

      {/* ═══ HISTORY TAB ═══ */}
      <div className={`tab-content ${activeTab === 'history' ? 'active' : ''}`}>
        <h3 style={{ marginBottom: '20px' }}>Rebalance History</h3>
        {rebalanceHistory.length > 0 ? rebalanceHistory.map((entry, idx) => (
          <div key={idx} className="history-item">
            <div className="history-date">{new Date(entry.rebalanceDate).toLocaleDateString(loc)} at {new Date(entry.rebalanceDate).toLocaleTimeString()}</div>
            <div className="history-changes">{entry.reason}</div>
            <div className="history-stats">
              <span className="history-stat added">+{entry.changes?.added?.length || 0} added</span>
              <span className="history-stat removed">-{entry.changes?.removed?.length || 0} removed</span>
              <span className="history-stat emails">📧 {entry.emailsSent || 0} emails</span>
            </div>
          </div>
        )) : <p style={{ color: '#666' }}>No rebalance history yet.</p>}
      </div>

      {/* ═══ PORTFOLIO TAB ═══ */}
      <div className={`tab-content ${activeTab === 'portfolio' ? 'active' : ''}`}>
        <BrokerConnect stocks={activeStocks} totalValue={totalValue} />
      </div>

      {/* ═══ ABOUT TAB ═══ */}
      <div className={`tab-content ${activeTab === 'about' ? 'active' : ''}`}>
        <div className="about-section">
          <h3>About {basket.name?.replace(/ \(\d{10,}\)$/, '')}</h3>
          <p className="about-desc">{basket.description}</p>
          <div className="about-grid">
            {[
              ['Category', basket.category], ['Theme', basket.theme],
              ['Stocks', `${activeStocks.length} stocks`], ['Rebalance', 'Every 30 days'],
              ['Next Rebalance', basket.nextRebalanceDate ? new Date(basket.nextRebalanceDate).toLocaleDateString() : 'TBD'],
              ['Selection Method', 'Quality Scoring (100 pts)'],
            ].map(([label, val]) => (
              <div key={label} className="about-item">
                <span className="about-label">{label}</span>
                <span className="about-value">{val}</span>
              </div>
            ))}
          </div>
          <h4 style={{ marginTop: '30px', marginBottom: '15px' }}>📊 Quality Scoring Criteria</h4>
          <div className="scoring-grid">
            {[
              ['Market Trend', '0-15 pts', 'Position within 52-week range'],
              ['Valuation (PE)', '0-20 pts', 'Lower PE = higher score'],
              ['Earnings Growth', '0-15 pts', 'Higher EPS growth = higher score'],
              ['Future Growth', '0-15 pts', 'Analyst targets + forward earnings'],
              ['Market Sentiment', '0-12 pts', 'News + social indicators'],
              ['Momentum / RSI', '0-13 pts', 'RSI + SMA trend signals'],
              ['Analyst Rating', '0-10 pts', 'Buy/Hold/Sell consensus'],
            ].map((c, i) => (
              <div key={i} className="scoring-card">
                <div className="scoring-name">{c[0]}</div>
                <div className="scoring-pts">{c[1]}</div>
                <div className="scoring-desc">{c[2]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
        <Link to="/baskets" className="btn btn-secondary">← Back to Baskets</Link>
        <Link to="/" className="btn btn-secondary">🏠 Dashboard</Link>
      </div>

      {/* ─── Styles for new features ─── */}
      <style>{`
        /* ── Dark mode ── */
        [data-theme="dark"] {
          --color-bg: #0f1117;
          --color-bg-secondary: #1a1d27;
          --color-border: #2a2d3a;
          --color-text-primary: #e8eaf0;
          --color-text-secondary: #8b8fa8;
          --color-accent: #4f8ef7;
        }
        [data-theme="dark"] .basket-detail,
        [data-theme="dark"] .sdm-modal,
        [data-theme="dark"] .ai-panel,
        [data-theme="dark"] .sf-bar { background: var(--color-bg); color: var(--color-text-primary); }

        /* ── Alert banner ── */
        .alert-banner {
          background: #fffbeb; border: 1px solid #fcd34d; color: #92400e;
          padding: 10px 16px; border-radius: 8px; margin-bottom: 12px;
          font-size: 13px; display: flex; align-items: center;
        }
        [data-theme="dark"] .alert-banner { background: #2d2400; border-color: #a16207; color: #fde68a; }

        /* ── Stock detail modal ── */
        .sdm-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.55);
          backdrop-filter: blur(3px); z-index: 9999;
          display: flex; align-items: center; justify-content: center; padding: 16px;
        }
        .sdm-modal {
          background: var(--color-bg, #fff); border-radius: 16px;
          width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto;
          padding: 24px; position: relative; box-shadow: 0 24px 60px rgba(0,0,0,0.25);
        }
        .sdm-close {
          position: absolute; top: 14px; right: 14px;
          background: var(--color-bg-secondary, #f5f5f5); border: none;
          border-radius: 50%; width: 28px; height: 28px; cursor: pointer;
          font-size: 13px; color: var(--color-text-secondary);
        }
        .sdm-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
        .sdm-company { font-size: 18px; font-weight: 700; color: var(--color-text-primary); }
        .sdm-ticker { font-size: 12px; color: var(--color-text-secondary); margin-top: 2px; }
        .sdm-price-block { text-align: right; }
        .sdm-price { font-size: 22px; font-weight: 700; }
        .sdm-change { font-size: 13px; font-weight: 600; margin-top: 2px; }
        .sdm-change.pos { color: #16a34a; }
        .sdm-change.neg { color: #dc2626; }
        .sdm-chart { margin: 0 -4px 12px; }
        .sdm-metrics {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
          margin-bottom: 16px;
        }
        .sdm-metric { background: var(--color-bg-secondary, #f7f8fa); border-radius: 8px; padding: 10px 12px; }
        .sdm-metric-label { font-size: 10px; color: var(--color-text-secondary); margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.04em; }
        .sdm-metric-val { font-size: 14px; font-weight: 600; }
        .sdm-reason { font-size: 12px; color: var(--color-text-secondary); background: var(--color-bg-secondary, #f7f8fa); border-radius: 8px; padding: 10px 12px; margin-bottom: 16px; line-height: 1.5; }
        .sdm-alert-section { border-top: 1px solid var(--color-border, #eee); padding-top: 14px; margin-top: 4px; }
        .sdm-alert-title { font-size: 13px; font-weight: 600; margin-bottom: 10px; }
        .sdm-alert-form { display: flex; gap: 8px; flex-wrap: wrap; }
        .sdm-alert-type, .sdm-alert-input {
          padding: 7px 10px; border-radius: 8px; border: 1px solid var(--color-border, #ddd);
          font-size: 13px; background: var(--color-bg-secondary, #f7f8fa); color: var(--color-text-primary);
        }
        .sdm-alert-input { width: 120px; }
        .sdm-alert-btn {
          padding: 7px 14px; background: var(--color-accent, #2563eb); color: #fff;
          border: none; border-radius: 8px; font-size: 13px; cursor: pointer; font-weight: 600;
        }
        .sdm-alert-existing {
          display: flex; align-items: center; justify-content: space-between;
          background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;
          padding: 8px 12px; font-size: 13px;
        }
        [data-theme="dark"] .sdm-alert-existing { background: #052e16; border-color: #166534; color: #bbf7d0; }
        .sdm-alert-hit { color: #16a34a; font-weight: 600; margin-left: 8px; }
        .sdm-alert-remove { background: none; border: none; color: #dc2626; cursor: pointer; font-size: 12px; text-decoration: underline; }

        /* ── AI Insights ── */
        .ai-panel { background: var(--color-bg-secondary, #f7f8fa); border-radius: 14px; padding: 22px; border: 1px solid var(--color-border, #e8e8e5); }
        .ai-panel-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 18px; }
        .ai-panel-title { font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .ai-badge { font-size: 10px; background: #dbeafe; color: #1d4ed8; padding: 2px 7px; border-radius: 99px; font-weight: 600; }
        [data-theme="dark"] .ai-badge { background: #1e3a5f; color: #93c5fd; }
        .ai-mode-tabs { display: flex; gap: 6px; }
        .ai-mode-btn {
          padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;
          border: 1px solid var(--color-border, #ddd); background: var(--color-bg, #fff);
          color: var(--color-text-primary); transition: all 0.15s;
        }
        .ai-mode-btn.active { background: var(--color-accent, #2563eb); color: #fff; border-color: transparent; }
        .ai-empty { text-align: center; padding: 30px 0; color: var(--color-text-secondary); }
        .ai-empty-icon { font-size: 36px; margin-bottom: 10px; }
        .ai-empty p { margin-bottom: 16px; font-size: 14px; }
        .ai-generate-btn {
          padding: 10px 22px; background: var(--color-accent, #2563eb); color: #fff;
          border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer;
        }
        .ai-loading { display: flex; align-items: center; padding: 20px 0; }
        .ai-dot {
          width: 8px; height: 8px; background: var(--color-accent, #2563eb);
          border-radius: 50%; margin-right: 5px;
          animation: aiBounce 1s ease-in-out infinite;
        }
        .ai-dot:nth-child(2) { animation-delay: 0.15s; }
        .ai-dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes aiBounce { 0%,80%,100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }
        .ai-content { position: relative; }
        .ai-text { font-size: 14px; line-height: 1.75; color: var(--color-text-primary); white-space: pre-wrap; }
        .ai-refresh-btn {
          margin-top: 14px; padding: 6px 14px; background: none;
          border: 1px solid var(--color-border, #ddd); border-radius: 8px;
          font-size: 12px; cursor: pointer; color: var(--color-text-secondary);
        }
        .ai-refresh-btn:disabled { opacity: 0.5; cursor: wait; }

        /* ── Search & Filter ── */
        .sf-bar { margin-bottom: 14px; }
        .sf-search-row { display: flex; gap: 10px; align-items: center; }
        .sf-search-wrap {
          flex: 1; display: flex; align-items: center; gap: 8px;
          background: var(--color-bg-secondary, #f7f8fa); border: 1px solid var(--color-border, #ddd);
          border-radius: 10px; padding: 0 12px;
        }
        .sf-search-icon { font-size: 13px; color: var(--color-text-secondary); }
        .sf-input {
          flex: 1; border: none; background: transparent; padding: 9px 0;
          font-size: 13px; outline: none; color: var(--color-text-primary);
        }
        .sf-clear { background: none; border: none; cursor: pointer; color: var(--color-text-secondary); font-size: 12px; }
        .sf-filter-toggle {
          padding: 9px 14px; border-radius: 10px; border: 1px solid var(--color-border, #ddd);
          background: var(--color-bg-secondary, #f7f8fa); font-size: 13px; cursor: pointer;
          color: var(--color-text-primary); white-space: nowrap; font-weight: 500;
        }
        .sf-filters {
          display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-end;
          margin-top: 12px; padding: 14px; background: var(--color-bg-secondary, #f7f8fa);
          border-radius: 10px; border: 1px solid var(--color-border, #eee);
        }
        .sf-filter-group { display: flex; flex-direction: column; gap: 5px; }
        .sf-label { font-size: 11px; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
        .sf-btn-group { display: flex; gap: 4px; }
        .sf-btn {
          padding: 5px 10px; border-radius: 6px; border: 1px solid var(--color-border, #ddd);
          font-size: 12px; cursor: pointer; background: var(--color-bg, #fff); color: var(--color-text-primary);
        }
        .sf-btn.active { background: var(--color-accent, #2563eb); color: #fff; border-color: transparent; }
        .sf-filter-input {
          padding: 6px 10px; border-radius: 8px; border: 1px solid var(--color-border, #ddd);
          font-size: 13px; background: var(--color-bg, #fff); color: var(--color-text-primary); width: 90px;
        }
        .sf-reset {
          padding: 6px 12px; border-radius: 8px; background: none; border: 1px solid #fca5a5;
          color: #dc2626; font-size: 12px; cursor: pointer; font-weight: 600; align-self: flex-end;
        }

        /* ── Alert bell in table ── */
        .alert-bell {
          background: none; border: none; cursor: pointer; font-size: 14px;
          opacity: 0.4; transition: opacity 0.15s;
        }
        .alert-bell:hover, .alert-bell.set { opacity: 1; }

        /* ── alloc card alert dot ── */
        .alloc-alert-dot { font-size: 12px; margin-left: 4px; }
      `}</style>
    </div>
  );
}

export default BasketDetail;