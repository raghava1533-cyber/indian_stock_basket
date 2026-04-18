import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Baskets from './pages/Baskets';
import Portfolio from './pages/Portfolio';
import BasketDetail from './pages/BasketDetail';
import Debug from './pages/Debug';
import Status from './pages/Status';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CreateBasket from './pages/CreateBasket';
import Disclaimer from './components/Disclaimer';
import { basketAPI } from './services/api';
import './App.css';

// ── Market & Clock helper (pure, runs on every clock tick) ───────────────────
function getMarketStatus(now) {
  const toZone = (tz) => new Date(now.toLocaleString('en-US', { timeZone: tz }));
  const hm     = (d)  => d.getHours() * 60 + d.getMinutes();

  // NSE — India Standard Time
  const ist    = toZone('Asia/Kolkata');
  const istM   = hm(ist);
  const istDow = ist.getDay(); // 0=Sun 6=Sat
  let nse;
  if (istDow === 0 || istDow === 6) {
    nse = { status: 'CLOSED', cls: 'closed', sub: 'Opens Mon 9:15 AM' };
  } else if (istM < 540) {
    const d = 555 - istM;
    nse = { status: 'CLOSED', cls: 'closed', sub: `Pre-open in ${Math.floor(d/60)}h ${d%60}m` };
  } else if (istM < 555) {
    nse = { status: 'PRE-OPEN', cls: 'preopen', sub: `Opens in ${555 - istM}m` };
  } else if (istM < 930) {
    const d = 930 - istM;
    nse = { status: 'OPEN', cls: 'open', sub: `Closes in ${Math.floor(d/60)}h ${d%60}m` };
  } else {
    nse = { status: 'CLOSED', cls: 'closed', sub: istDow === 5 ? 'Opens Mon 9:15 AM' : 'Opens tomorrow 9:15 AM' };
  }

  // NYSE / NASDAQ — New York Eastern time
  const et    = toZone('America/New_York');
  const etM   = hm(et);
  const etDow = et.getDay();
  let us;
  if (etDow === 0 || etDow === 6) {
    us = { status: 'CLOSED', cls: 'closed', sub: 'Opens Mon 9:30 AM ET' };
  } else if (etM < 570) {
    const d = 570 - etM;
    us = { status: 'PRE-MARKET', cls: 'preopen', sub: `Opens in ${Math.floor(d/60)}h ${d%60}m` };
  } else if (etM < 960) {
    const d = 960 - etM;
    us = { status: 'OPEN', cls: 'open', sub: `Closes in ${Math.floor(d/60)}h ${d%60}m` };
  } else {
    us = { status: 'CLOSED', cls: 'closed', sub: etDow === 5 ? 'Opens Mon 9:30 AM ET' : 'Opens tomorrow 9:30 AM ET' };
  }

  return { nse, us };
}

function App() {
  const [baskets, setBaskets] = useState([]);
  const [indices, setIndices] = useState(null);
  const [clockTime, setClockTime] = useState(new Date());
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('authUser')); } catch { return null; }
  });

  const handleLogin = (userData) => setUser(userData);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('userEmail');
    setUser(null);
  };

  useEffect(() => {
    console.log('App.js mounted - checking API connectivity');
    loadBaskets();
    loadIndices();
    // Refresh indices every 60s
    const timer = setInterval(loadIndices, 60000);
    
    // Also check backend connectivity on startup
    basketAPI.checkHealth()
      .then(() => console.log('Backend is reachable'))
      .catch(err => console.warn('Backend not immediately available, will retry on demand:', err.message));

    return () => clearInterval(timer);
  }, []);

  // Tick every second for live clock
  useEffect(() => {
    const ct = setInterval(() => setClockTime(new Date()), 1000);
    return () => clearInterval(ct);
  }, []);

  const loadIndices = async () => {
    try {
      const res = await basketAPI.getMarketIndices();
      setIndices(res.data);
    } catch (e) {
      // silently fail — indices are decorative
    }
  };

  const loadBaskets = async () => {
    try {
      console.log('Loading baskets from API...');
      const response = await basketAPI.getAllBaskets();
      console.log('Baskets loaded:', response.data);
      setBaskets(response.data);
      return response.data;
    } catch (error) {
      console.error('Error loading baskets:', error);
      throw error;
    }
  };

  // ── Clock display helpers (recomputed every second via clockTime) ─────────
  const _ist  = new Date(clockTime.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const _p2   = n => String(n).padStart(2, '0');
  const _DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const _MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const istDateStr = `${_DAYS[_ist.getDay()]}, ${_p2(_ist.getDate())} ${_MONS[_ist.getMonth()]} ${_ist.getFullYear()}`;
  const istTimeStr = `${_p2(_ist.getHours())}:${_p2(_ist.getMinutes())}:${_p2(_ist.getSeconds())}`;
  const { nse: nseStatus, us: usStatus } = getMarketStatus(clockTime);

  return (
    <Router>
      <div className="app">
        {/* ═══ Top Info Bar: clock + market status ═══ */}
        <div className="top-info-bar">
          <div className="tib-left">
            <span className="clock-display">
              <span className="clock-date">{istDateStr}</span>
              <span className="clock-sep"> · </span>
              <span className="clock-time">{istTimeStr}</span>
              <span className="clock-tz"> IST</span>
            </span>
            <div className="market-status-group">
              <div className={`market-status-badge ${nseStatus.cls}`}>
                <span className="ms-dot" />
                <span className="ms-label">NSE </span>
                <span className="ms-name">{nseStatus.status}</span>
                <span className="ms-sub"> · {nseStatus.sub}</span>
              </div>
              <div className={`market-status-badge ${usStatus.cls}`}>
                <span className="ms-dot" />
                <span className="ms-label">NYSE </span>
                <span className="ms-name">{usStatus.status}</span>
                <span className="ms-sub"> · {usStatus.sub}</span>
              </div>
            </div>
          </div>
          <div className="tib-right">Prices delayed · Not investment advice</div>
        </div>
        <header className="header">
          <div className="header-content">
            <h1 className="logo">
              <span className="logo-dot"></span>
              SmartBasket India
            </h1>
            <nav className="nav">
              <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} end>Dashboard</NavLink>
              <NavLink to="/baskets" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>All Baskets</NavLink>
              <NavLink to="/create-basket" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>+ Create Basket</NavLink>
              <NavLink to="/portfolio" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Portfolio</NavLink>
            </nav>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="live-badge"><span className="live-dot"></span> Live</span>
              {user ? (
                <div className="auth-user-chip">
                  <span className="auth-user-name">{user.name}</span>
                  <button className="auth-logout-btn" onClick={handleLogout}>Logout</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <NavLink to="/login" className="btn btn-sm">Login</NavLink>
                  <NavLink to="/signup" className="btn btn-primary btn-sm">Sign up</NavLink>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard baskets={baskets} indices={indices} onReload={loadBaskets} />} />
            <Route path="/baskets" element={<Baskets baskets={baskets} onReload={loadBaskets} />} />
            <Route path="/create-basket" element={<CreateBasket />} />
            <Route path="/portfolio" element={<Portfolio user={user} />} />
            <Route path="/basket/:id" element={<BasketDetail onReload={loadBaskets} />} />
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />} />
            <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup onLogin={handleLogin} />} />
            <Route path="/debug" element={<Debug />} />
            <Route path="/status" element={<Status />} />
          </Routes>
        </main>

        <Disclaimer />

        <footer className="footer">
          <p>&copy; 2026 Indian Stock Basket Management System. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
