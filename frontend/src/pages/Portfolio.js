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

function Portfolio({ user }) {
  const [baskets, setBaskets] = useState([]);
  const [loading, setLoading] = useState(true);
  const email = localStorage.getItem('userEmail') || '';
  const token = localStorage.getItem('authToken') || '';
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

  if (loading) return <div className="loading">Loading portfolio...</div>;

  // Show login prompt if not authenticated
  if (!token && !email) {
    return (
      <div className="sc-portfolio">
        <div className="sc-pf-header">
          <div>
            <div className="sc-pf-meta">Portfolio</div>
            <div className="sc-pf-count">Track your subscribed baskets</div>
          </div>
        </div>
        <div className="sc-pf-empty" style={{ marginTop: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <h3 style={{ marginBottom: '8px', color: 'var(--color-text-primary)' }}>Log in to view your portfolio</h3>
          <p style={{ marginBottom: '20px' }}>Subscribe to baskets and track your investments in one place.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to="/login" className="btn btn-primary">Log In</Link>
            <Link to="/signup" className="btn btn-secondary">Sign Up</Link>
          </div>
        </div>
      </div>
    );
  }

  const subscribedBaskets = baskets.filter(b =>
    subscribedIds.includes(b._id) || b.subscribers?.includes(email)
  );
  const totalValue = subscribedBaskets.reduce(
    (s, b) => s + (b.stocks?.reduce((ss, st) => ss + ((st.currentPrice || 0) * (st.quantity || 1)), 0) || 0), 0
  );

  return (
    <div className="sc-portfolio">
      {/* ── Header row ── */}
      <div className="sc-pf-header">
        <div>
          <div className="sc-pf-meta">Your investments</div>
          <div className="sc-pf-count">{subscribedBaskets.length} basket{subscribedBaskets.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="sc-pf-totals">
          <div className="sc-pf-total-block">
            <div className="sc-pf-total-label">Current Value</div>
            <div className="sc-pf-total-val">₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          </div>
          <div className="sc-pf-total-block">
            <div className="sc-pf-total-label">Baskets</div>
            <div className="sc-pf-total-val green">{subscribedBaskets.length} / {baskets.length}</div>
          </div>
        </div>
      </div>

      {/* ── Investments list ── */}
      {subscribedBaskets.length === 0 ? (
        <div className="sc-pf-empty">
          <p>No subscribed baskets yet.</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '12px', display: 'inline-block' }}>Discover Baskets</Link>
        </div>
      ) : (
        <div className="sc-pf-list">
          {subscribedBaskets.map(b => {
            const meta = THEME_META[b.theme] || THEME_META['Large Cap'];
            const bValue = b.stocks?.reduce((s, st) => s + ((st.currentPrice || 0) * (st.quantity || 1)), 0) || 0;
            const lastRebal = b.lastRebalanceDate ? new Date(b.lastRebalanceDate) : null;
            const daysSince = lastRebal ? Math.floor((Date.now() - lastRebal) / 86400000) : null;
            const nextRebal = b.nextRebalanceDate ? new Date(b.nextRebalanceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : null;

            return (
              <Link to={`/basket/${b._id}`} key={b._id} className="sc-pf-row-link">
                <div className="sc-pf-row">
                  <div className="sc-pf-row-main">
                    <div className="sc-pf-icon" style={{ background: meta.bg, color: meta.color }}>
                      {meta.letter}
                    </div>
                    <div className="sc-pf-info">
                      <div className="sc-pf-name">{b.name}</div>
                      <span className="sc-subscribed-badge">✦ Subscribed</span>
                    </div>
                    <div className="sc-pf-right">
                      <div className="sc-pf-value">₹{bValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                      <div className="sc-pf-stocks green">{b.stocks?.length || 0} stocks</div>
                    </div>
                  </div>
                  <div className="sc-pf-row-sub">
                    <span className="sc-pf-sub-text">
                      {daysSince != null
                        ? `${daysSince} days since last rebalance`
                        : 'Not yet rebalanced'}
                    </span>
                    <span className="sc-pf-sub-action">
                      {nextRebal ? `Next rebalance: ${nextRebal}` : 'View details →'}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── All Holdings ── */}
      {subscribedBaskets.length > 0 && (
        <div className="sc-pf-holdings">
          <div className="sc-pf-holdings-title">All Holdings</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="stocks-table">
              <thead>
                <tr>
                  <th>Basket</th>
                  <th>Company</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Day Change</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {subscribedBaskets.flatMap(b =>
                  (b.stocks || []).filter(s => s.status !== 'removed').map((s, i) => (
                    <tr key={`${b._id}-${i}`}>
                      <td style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{b.name}</td>
                      <td>
                        <div style={{ fontWeight: '500', fontSize: '13px' }}>{s.companyName || s.ticker?.replace('.NS', '')}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{s.ticker?.replace('.NS', '')}</div>
                      </td>
                      <td style={{ fontWeight: '500' }}>{s.quantity || 1}</td>
                      <td>₹{s.currentPrice?.toFixed(0) || '—'}</td>
                      <td>
                        {s.dayChangePercent != null ? (
                          <span className={s.dayChangePercent >= 0 ? 'price-positive' : 'price-negative'} style={{ fontWeight: '500' }}>
                            {s.dayChangePercent >= 0 ? '+' : ''}{s.dayChangePercent.toFixed(2)}%
                          </span>
                        ) : <span style={{ color: 'var(--color-text-secondary)' }}>—</span>}
                      </td>
                      <td style={{ fontWeight: '500' }}>
                        ₹{((s.currentPrice || 0) * (s.quantity || 1)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Portfolio;
