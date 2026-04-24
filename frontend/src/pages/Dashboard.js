import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { basketAPI } from '../services/api';

const THEME_META = {
  'Large Cap':      { bg: '#E8F0FE', color: '#1A5FC8', letter: 'LC' },
  'Mid Cap':        { bg: '#F3E8FD', color: '#7B2FBE', letter: 'MC' },
  'Small Cap':      { bg: '#FEF0E8', color: '#C2550A', letter: 'SC' },
  'Technology':     { bg: '#E8F8F5', color: '#0E7A62', letter: 'TE' },
  'Finance':        { bg: '#FDE8EE', color: '#B0184E', letter: 'FI' },
  'Healthcare':     { bg: '#EAF7EC', color: '#1A7A30', letter: 'HC' },
  'Renewable':      { bg: '#EAF7EC', color: '#1A7A30', letter: 'RE' },
  'Consumer':       { bg: '#FEF6E8', color: '#B06B0A', letter: 'CB' },
  'Infrastructure': { bg: '#EEF0FE', color: '#3A3FBE', letter: 'IN' },
};

function IndexTile({ name, data, locale }) {
  if (!data || !data.price) return null;
  const pct  = data.dayChangePercent;
  const abs  = data.dayChange;
  const isUp = pct != null ? pct >= 0 : abs != null ? abs >= 0 : null;
  const clr  = isUp === null ? 'var(--color-text-secondary)'
             : isUp ? 'var(--color-accent)' : 'var(--color-negative)';
  return (
    <div className="idx-tile">
      <div className="idx-tile-name">{name}</div>
      <div className="idx-tile-price">
        {data.price.toLocaleString(locale, { maximumFractionDigits: 2 })}
      </div>
      <div className="idx-tile-change" style={{ color: clr }}>
        {pct != null && <span>{isUp ? '▲' : '▼'} {isUp ? '+' : ''}{pct.toFixed(2)}%</span>}
        {abs != null && (
          <span className="idx-tile-abs"> ({isUp ? '+' : ''}{abs.toFixed(0)})</span>
        )}
      </div>
      <div className="idx-tile-bar">
        <div className="idx-tile-bar-fill" style={{
          width: pct != null ? `${Math.min(Math.abs(pct) * 15, 100)}%` : '0%',
          background: clr,
        }} />
      </div>
    </div>
  );
}

function MoverRow({ rank, ticker, name, price, pct, cur, locale }) {
  const isUp = pct >= 0;
  return (
    <div className="mover-row">
      <span className="mover-rank">{rank}</span>
      <div className="mover-info">
        <span className="mover-ticker">{ticker}</span>
        <span className="mover-name">{name}</span>
      </div>
      <div className="mover-right">
        <span className="mover-price">{cur}{price?.toLocaleString(locale, { maximumFractionDigits: 0 })}</span>
        <span className={`mover-pct ${isUp ? 'up' : 'dn'}`}>
          {isUp ? '+' : ''}{pct.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

function Dashboard({ baskets, indices }) {

  const [liveSummary, setLiveSummary] = useState({});
  const [country, setCountry] = useState('IN');
  const [indicesLive, setIndicesLive] = useState(indices || null);

  // Fetch live summary once
  useEffect(() => {
    basketAPI.getLiveSummary()
      .then(res => setLiveSummary(res.data || {}))
      .catch(() => {});
  }, []);

  const fetchIndicesManual = () => {
    basketAPI.getMarketIndices()
      .then(res => setIndicesLive(res.data))
      .catch(() => {});
  };

  // Poll indices every 10 seconds
  useEffect(() => {
    let mounted = true;
    const fetchIndices = () => {
      basketAPI.getMarketIndices(true)
        .then(res => { if (mounted) setIndicesLive(res.data); })
        .catch(err => { console.warn('Failed to fetch indices', err?.message || err); });
    };
    fetchIndices();
    const interval = setInterval(fetchIndices, 10000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const currencySymbol    = country === 'US' ? '$' : '₹';
  const locale            = country === 'US' ? 'en-US' : 'en-IN';
  const allDefaultBaskets = baskets.filter(b => !b.isUserCreated);
  const countryBaskets    = allDefaultBaskets.filter(b => (b.country || 'IN') === country);

  const seen = new Set();
  const uniqStocks = countryBaskets
    .flatMap(b =>
      (b.stocks || [])
        .filter(s => s.status !== 'removed' && s.dayChangePercent != null)
        .map(s => ({ ticker: s.ticker, name: s.companyName || s.ticker, price: s.currentPrice || 0, pct: s.dayChangePercent }))
    )
    .filter(s => { if (seen.has(s.ticker)) return false; seen.add(s.ticker); return true; });

  const sorted  = [...uniqStocks].sort((a, b) => b.pct - a.pct);
  const gainers = sorted.slice(0, 5);
  const losers  = sorted.slice(-5).reverse();

  const sectorMap = {};
  countryBaskets.forEach(b => {
    const theme  = b.theme || 'Other';
    const stocks = (b.stocks || []).filter(s => s.status !== 'removed' && s.dayChangePercent != null);
    if (stocks.length > 0) {
      const avg = stocks.reduce((s, st) => s + st.dayChangePercent, 0) / stocks.length;
      if (!sectorMap[theme]) sectorMap[theme] = [];
      sectorMap[theme].push(avg);
    }
  });
  const sectors = Object.entries(sectorMap)
    .map(([theme, vals]) => ({
      theme, meta: THEME_META[theme] || THEME_META['Large Cap'],
      avg: vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null,
    }))
    .sort((a, b) => (b.avg ?? -999) - (a.avg ?? -999));

  const totalStocks = new Set(allDefaultBaskets.flatMap(b => (b.stocks || []).map(s => s.ticker))).size;
  const retArr = countryBaskets.map(b => {
    const active = (b.stocks || []).filter(s => s.status !== 'removed' && s.buyPrice > 0 && s.currentPrice > 0);
    if (!active.length) return null;
    const inv = active.reduce((s, st) => s + st.buyPrice * (st.quantity || 1), 0);
    const cur = active.reduce((s, st) => s + st.currentPrice * (st.quantity || 1), 0);
    return inv > 0 ? ((cur - inv) / inv * 100) : null;
  }).filter(v => v != null);
  const avgReturn = retArr.length ? retArr.reduce((s, v) => s + v, 0) / retArr.length : null;

  const topToday = countryBaskets
    .map(b => ({ name: b.name?.replace(/ \(\d{10,}\)$/, ''), id: b._id, pct: liveSummary[b._id] }))
    .filter(b => b.pct != null)
    .sort((a, b) => b.pct - a.pct)[0];

  const shownIndices = country === 'IN'
    ? [
        { name: 'NIFTY 50', data: indicesLive?.nifty50, locale: 'en-IN' },
        { name: 'BANK NIFTY', data: indicesLive?.bankNifty, locale: 'en-IN' }
      ]
    : [
        { name: 'S&P 500', data: indicesLive?.sp500, locale: 'en-US' },
        { name: 'NASDAQ',  data: indicesLive?.nasdaq, locale: 'en-US' },
        { name: 'DOW',     data: indicesLive?.dow,    locale: 'en-US' }
      ];

  // Handle UTC ISO string and show 'now' if in the future
  const _indicesUpdated = indicesLive?.updatedAt || indices?.updatedAt;
  let indicesUpdatedStr = null;
  if (_indicesUpdated) {
    try {
      const updatedDate = new Date(_indicesUpdated);
      const now = new Date();
      if (updatedDate > now) {
        indicesUpdatedStr = 'now';
      } else {
        indicesUpdatedStr = updatedDate.toLocaleString();
      }
    } catch {
      indicesUpdatedStr = String(_indicesUpdated);
    }
  }

  return (
    <div className="dash-wrap">
      <div className="sc-page-header">
        <div>
          <h1 className="sc-page-title">Market Overview</h1>
          <p className="sc-page-sub">Live market pulse &middot; Sector heat &middot; Top movers</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className="country-toggle">
            <button className={`country-btn${country === 'IN' ? ' active' : ''}`} onClick={() => setCountry('IN')}>🇮🇳 India</button>
            <button className={`country-btn${country === 'US' ? ' active' : ''}`} onClick={() => setCountry('US')}>🇺🇸 USA</button>
          </div>
        </div>
      </div>

      <section className="dash-section">
        <div className="dash-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            {country === 'IN' ? '\uD83D\uDCCA Indian Indices' : '\uD83D\uDCCA US Indices'}
            {indicesUpdatedStr && (
              <small style={{ marginLeft: 10, color: '#666', fontSize: 12 }}>Last: {indicesUpdatedStr}</small>
            )}
          </span>
          <button onClick={fetchIndicesManual} style={{ padding: '4px 10px', fontSize: '13px', cursor: 'pointer', background: 'transparent', border: '1px solid var(--border-color, #ccc)', borderRadius: '4px', color: 'inherit' }} title="Refresh Indices">
            🔄 Refresh
          </button>
        </div>
        <div className="idx-tiles-row">
          {shownIndices.map(({ name, data, locale: loc }) => (
            <IndexTile key={name} name={name} data={data} locale={loc} />
          ))}
          {(!indicesLive || shownIndices.every(i => !i.data?.price)) && (
            <div className="dash-placeholder">Fetching live index data…</div>
          )}
        </div>
      </section>

      <section className="dash-section">
        <div className="dash-section-title">📈 SmartBasket at a Glance</div>
        <div className="pstats-row">
          <div className="pstat-card">
            <div className="pstat-val">{countryBaskets.length}</div>
            <div className="pstat-label">Curated Baskets</div>
          </div>
          <div className="pstat-card">
            <div className="pstat-val">{totalStocks}</div>
            <div className="pstat-label">Stocks Tracked</div>
          </div>
          <div className="pstat-card">
            <div className={`pstat-val ${avgReturn != null ? (avgReturn >= 0 ? 'up' : 'dn') : ''}`}>
              {avgReturn != null ? `${avgReturn >= 0 ? '+' : ''}${avgReturn.toFixed(1)}%` : '\u2014'}
            </div>
            <div className="pstat-label">Avg Basket Return</div>
          </div>
          {topToday && (
            <div className="pstat-card pstat-highlight">
              <div className={`pstat-val ${topToday.pct >= 0 ? 'up' : 'dn'}`}>
                {topToday.pct >= 0 ? '+' : ''}{topToday.pct.toFixed(2)}%
              </div>
              <div className="pstat-label">
                Best Today: <Link to={`/basket/${topToday.id}`} className="pstat-link">{topToday.name}</Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {uniqStocks.length > 0 && (
        <section className="dash-section">
          <div className="dash-section-title">⚡ Top Movers Today</div>
          <div className="movers-grid">
            <div className="movers-panel">
              <div className="movers-panel-head gainers-head">▲ Top Gainers</div>
              {gainers.map((s, i) => (
                <MoverRow key={s.ticker} rank={i + 1} ticker={s.ticker}
                  name={s.name} price={s.price} pct={s.pct}
                  cur={currencySymbol} locale={locale} />
              ))}
            </div>
            <div className="movers-panel">
              <div className="movers-panel-head losers-head">▼ Top Losers</div>
              {losers.map((s, i) => (
                <MoverRow key={s.ticker} rank={i + 1} ticker={s.ticker}
                  name={s.name} price={s.price} pct={s.pct}
                  cur={currencySymbol} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      )}

      {sectors.length > 0 && (
        <section className="dash-section">
          <div className="dash-section-title">🔥 Sector Performance Today</div>
          <div className="sector-heat-row">
            {sectors.map(({ theme, avg, meta }) => {
              const isUp = avg != null ? avg >= 0 : null;
              const bg   = avg != null
                ? `hsla(${isUp ? 145 : 5}, 60%, 47%, ${Math.min(Math.abs(avg) * 12, 55) + 8}%)`
                : 'var(--color-background-secondary)';
              return (
                <div key={theme} className="sector-tile" style={{ background: bg }}>
                  <div className="sector-tile-icon" style={{ background: meta.bg, color: meta.color }}>{meta.letter}</div>
                  <div className="sector-tile-name">{theme}</div>
                  <div className={`sector-tile-pct ${isUp === null ? '' : isUp ? 'up' : 'dn'}`}>
                    {avg != null ? `${isUp ? '+' : ''}${avg.toFixed(2)}%` : '\u2014'}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="dash-section">
        <div className="dash-section-title">🗂 Quick Links</div>
        <div className="quick-links-row">
          <Link to="/baskets" className="quick-link-card">
            <span className="ql-icon">📦</span>
            <span className="ql-label">All Baskets</span>
            <span className="ql-sub">Browse &amp; invest in curated baskets</span>
          </Link>
          <Link to="/portfolio" className="quick-link-card">
            <span className="ql-icon">💼</span>
            <span className="ql-label">My Portfolio</span>
            <span className="ql-sub">Track your holdings &amp; returns</span>
          </Link>
          <Link to="/create-basket" className="quick-link-card">
            <span className="ql-icon">✏️</span>
            <span className="ql-label">Create Basket</span>
            <span className="ql-sub">Build your own stock basket</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
