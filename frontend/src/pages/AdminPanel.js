import React, { useState } from 'react';

const API = process.env.REACT_APP_API_URL || 'https://stock-basket-api.onrender.com/api';

function AdminPanel() {
  const [secret, setSecret] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const fetchPending = async (s) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/auth/admin/pending`, {
        headers: { 'x-admin-secret': s },
      });
      if (res.status === 403) { setError('Invalid admin secret.'); return; }
      const data = await res.json();
      setUsers(data);
      setAuthenticated(true);
    } catch {
      setError('Could not reach server. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!secret.trim()) return;
    fetchPending(secret.trim());
  };

  const doAction = async (userId, action) => {
    setActionMsg('');
    try {
      const res = await fetch(`${API}/auth/admin/${action}/${userId}`, {
        method: 'POST',
        headers: { 'x-admin-secret': secret },
      });
      const data = await res.json();
      setActionMsg(data.message || 'Done.');
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch {
      setActionMsg('Action failed. Try again.');
    }
  };

  if (!authenticated) {
    return (
      <div style={{ maxWidth: '420px', margin: '80px auto', padding: '0 16px' }}>
        <div className="auth-card">
          <div className="auth-logo"><span className="logo-dot"></span> SmartBasket India</div>
          <h2 className="auth-title">Admin Panel</h2>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleLogin} className="auth-form">
            <div className="auth-field">
              <label htmlFor="secret">Admin Secret</label>
              <input
                id="secret"
                type="password"
                required
                value={secret}
                onChange={e => setSecret(e.target.value)}
                placeholder="Enter admin secret"
                autoFocus
              />
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Checking…' : 'Access Panel'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>Pending Signup Approvals</h2>
        <button
          className="btn btn-sm"
          onClick={() => fetchPending(secret)}
          disabled={loading}
          style={{ fontSize: '12px' }}
        >
          {loading ? 'Loading…' : '↻ Refresh'}
        </button>
      </div>

      {actionMsg && (
        <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#2e7d32' }}>
          {actionMsg}
        </div>
      )}

      {users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-secondary)', fontSize: '15px' }}>
          ✅ No pending approval requests.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {users.map(u => (
            <div key={u._id} style={{
              background: 'var(--color-bg-secondary, #f7f8fa)',
              border: '1px solid var(--color-border, #e8e8e5)',
              borderRadius: '10px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}>
              <div>
                <div style={{ fontWeight: '600', fontSize: '15px' }}>{u.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{u.email}</div>
                {u.createdAt && (
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    Requested: {new Date(u.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => doAction(u._id, 'approve')}
                  style={{ background: 'var(--color-accent)', border: 'none', color: '#fff', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                >
                  ✓ Approve
                </button>
                <button
                  className="btn btn-sm"
                  onClick={() => doAction(u._id, 'reject')}
                  style={{ background: '#f44336', border: 'none', color: '#fff', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                >
                  ✗ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
