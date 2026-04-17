import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { basketAPI } from '../services/api';

const SECTORS_IN = [
  { value: 'all',            label: 'Select a sector…' },
  { value: 'tech',           label: 'Technology' },
  { value: 'finance',        label: 'Finance & Banking' },
  { value: 'healthcare',     label: 'Healthcare & Pharma' },
  { value: 'renewable',      label: 'Renewable Energy' },
  { value: 'consumer',       label: 'Consumer Brands' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'auto',           label: 'Automobile' },
  { value: 'metals',         label: 'Metals & Mining' },
  { value: 'telecom',        label: 'Telecom' },
  { value: 'psu',            label: 'PSU (Public Sector)' },
  { value: 'realty',         label: 'Real Estate' },
  { value: 'chemicals',      label: 'Chemicals' },
  { value: 'cement',         label: 'Cement & Building Materials' },
  { value: 'oilgas',         label: 'Oil & Gas' },
  { value: 'fertilizer',     label: 'Fertilizers & Agrochemicals' },
  { value: 'defence',        label: 'Defence & Aerospace' },
  { value: 'media',          label: 'Media & Entertainment' },
  { value: 'textile',        label: 'Textiles & Apparel' },
  { value: 'undervalued',    label: 'Undervalued Stocks' },
];

const SECTORS_US = [
  { value: 'all',            label: 'Select a sector…' },
  { value: 'tech',           label: 'Technology' },
  { value: 'finance',        label: 'Finance & Banking' },
  { value: 'healthcare',     label: 'Healthcare & Pharma' },
  { value: 'renewable',      label: 'Renewable Energy' },
  { value: 'consumer',       label: 'Consumer Brands' },
  { value: 'infrastructure', label: 'Infrastructure & Industrials' },
  { value: 'auto',           label: 'Automobile & EV' },
  { value: 'metals',         label: 'Metals & Mining' },
  { value: 'telecom',        label: 'Telecom & Communication' },
  { value: 'psu',            label: 'Utilities' },
  { value: 'realty',         label: 'Real Estate (REITs)' },
  { value: 'chemicals',      label: 'Chemicals & Materials' },
  { value: 'cement',         label: 'Construction & Building' },
  { value: 'oilgas',         label: 'Oil & Gas' },
  { value: 'fertilizer',     label: 'Agriculture & Fertilizers' },
  { value: 'defence',        label: 'Defence & Aerospace' },
  { value: 'media',          label: 'Media & Entertainment' },
  { value: 'textile',        label: 'Fashion & Retail' },
  { value: 'undervalued',    label: 'Undervalued Stocks' },
];

const MARKET_CAPS_IN = [
  { value: 'all',      label: 'Select market cap…' },
  { value: 'largeCap', label: 'Large Cap  (₹20,000 Cr+)' },
  { value: 'midCap',   label: 'Mid Cap  (₹5,000–20,000 Cr)' },
  { value: 'smallCap', label: 'Small Cap  (₹500–5,000 Cr)' },
  { value: 'microCap', label: 'Micro Cap  (below ₹500 Cr)' },
];

const MARKET_CAPS_US = [
  { value: 'all',      label: 'Select market cap…' },
  { value: 'largeCap', label: 'Large Cap  ($10B+)' },
  { value: 'midCap',   label: 'Mid Cap  ($2B–$10B)' },
  { value: 'smallCap', label: 'Small Cap  ($500M–$2B)' },
  { value: 'microCap', label: 'Micro Cap  (below $500M)' },
];

const FEATURES = [
  { icon: '📊', title: 'Quality Scoring', desc: 'Stocks ranked by PE, EPS growth, future growth & sentiment' },
  { icon: '🎯', title: 'Top 15 Selected', desc: 'Best 15 stocks picked from a 20-stock universe' },
  { icon: '⚖️', title: 'Quality Weighted', desc: 'Higher-scoring stocks get proportionally more allocation' },
  { icon: '🔄', title: 'Monthly Rebalance', desc: 'Auto-rebalanced every 30 days with email notifications' },
];

function CreateBasket() {
  const navigate = useNavigate();
  const [country, setCountry] = useState('IN');
  const [sector, setSector] = useState('all');
  const [marketCap, setMarketCap] = useState('all');
  const [basketName, setBasketName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem('authToken') || '';

  const SECTORS = country === 'US' ? SECTORS_US : SECTORS_IN;
  const MARKET_CAPS = country === 'US' ? MARKET_CAPS_US : MARKET_CAPS_IN;

  const handleCountryChange = (c) => {
    setCountry(c);
    setSector('all');
    setMarketCap('all');
  };

  const handleCreate = async () => {
    if (sector === 'all' && marketCap === 'all') {
      setError('Please select at least a sector or a market cap');
      return;
    }
    if (!token) {
      setError('Please log in to create a basket');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const res = await basketAPI.createCustomBasket(
        { sector, marketCap, name: basketName.trim() || undefined, country },
        token
      );
      navigate(`/basket/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create basket. Please try again.');
      setCreating(false);
    }
  };

  return (
    <div className="create-basket-page">
      <div className="sc-page-header">
        <div>
          <h1 className="sc-page-title">Create Custom Basket</h1>
          <p className="sc-page-sub">Pick a sector and market cap — we'll score 20 stocks and build your personalised 15-stock basket</p>
        </div>
      </div>

      <div className="cb-page-layout">
        {/* ── Left: form ── */}
        <div className="cb-page-form-card">
          <h3 className="cb-page-form-title">Configure Your Basket</h3>

          <div className="cb-field">
            <label className="cb-label">Country</label>
            <div className="country-toggle" style={{ marginBottom: '4px' }}>
              <button className={`country-btn${country === 'IN' ? ' active' : ''}`} onClick={() => handleCountryChange('IN')}>🇮🇳 India</button>
              <button className={`country-btn${country === 'US' ? ' active' : ''}`} onClick={() => handleCountryChange('US')}>🇺🇸 USA</button>
            </div>
          </div>

          <div className="cb-field">
            <label className="cb-label">Sector</label>
            <select className="cb-select" value={sector} onChange={e => setSector(e.target.value)}>
              {SECTORS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div className="cb-field">
            <label className="cb-label">Market Cap</label>
            <select className="cb-select" value={marketCap} onChange={e => setMarketCap(e.target.value)}>
              {MARKET_CAPS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          <div className="cb-field">
            <label className="cb-label">
              Basket Name&nbsp;
              <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              className="cb-input"
              type="text"
              placeholder="e.g. My Tech Portfolio"
              value={basketName}
              onChange={e => setBasketName(e.target.value)}
              maxLength={60}
            />
          </div>

          {error && <div className="cb-error">{error}</div>}

          {!token && (
            <div className="cb-login-prompt">
              You need to <a href="/login">log in</a> before creating a basket.
            </div>
          )}

          <div className="cb-page-actions">
            <button className="cb-cancel-btn" onClick={() => navigate('/')} disabled={creating}>
              Cancel
            </button>
            <button
              className="cb-create-btn"
              onClick={handleCreate}
              disabled={creating || !token}
              style={{ opacity: !token ? 0.5 : 1 }}
            >
              {creating ? '⏳ Building basket…' : 'Create Basket →'}
            </button>
          </div>
        </div>

        {/* ── Right: feature cards ── */}
        <div className="cb-page-features">
          <h3 className="cb-page-form-title">How It Works</h3>
          {FEATURES.map((f, i) => (
            <div key={i} className="cb-feature-item">
              <div className="cb-feature-icon">{f.icon}</div>
              <div>
                <div className="cb-feature-title">{f.title}</div>
                <div className="cb-feature-desc">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CreateBasket;
