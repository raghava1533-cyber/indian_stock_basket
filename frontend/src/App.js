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

function App() {
  const [baskets, setBaskets] = useState([]);
  const [indices, setIndices] = useState(null);
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

  return (
    <Router>
      <div className="app">
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
              {indices && (
                <>
                  <div className="index-chip">
                    <span className="index-name">NIFTY 50</span>
                    <span className="index-price">{indices.nifty50?.price?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    {indices.nifty50?.dayChangePercent != null && (
                      <span className={`index-change ${indices.nifty50.dayChangePercent >= 0 ? 'pos' : 'neg'}`}>
                        {indices.nifty50.dayChangePercent >= 0 ? '+' : ''}{indices.nifty50.dayChangePercent.toFixed(2)}%
                      </span>
                    )}
                  </div>
                  <div className="index-chip">
                    <span className="index-name">BANK NIFTY</span>
                    <span className="index-price">{indices.bankNifty?.price?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    {indices.bankNifty?.dayChangePercent != null && (
                      <span className={`index-change ${indices.bankNifty.dayChangePercent >= 0 ? 'pos' : 'neg'}`}>
                        {indices.bankNifty.dayChangePercent >= 0 ? '+' : ''}{indices.bankNifty.dayChangePercent.toFixed(2)}%
                      </span>
                    )}
                  </div>
                  {indices.sp500?.price > 0 && (
                    <div className="index-chip">
                      <span className="index-name">S&amp;P 500</span>
                      <span className="index-price">{indices.sp500.price?.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                      {indices.sp500?.dayChangePercent != null && (
                        <span className={`index-change ${indices.sp500.dayChangePercent >= 0 ? 'pos' : 'neg'}`}>
                          {indices.sp500.dayChangePercent >= 0 ? '+' : ''}{indices.sp500.dayChangePercent.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  )}
                  {indices.nasdaq?.price > 0 && (
                    <div className="index-chip">
                      <span className="index-name">NASDAQ</span>
                      <span className="index-price">{indices.nasdaq.price?.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                      {indices.nasdaq?.dayChangePercent != null && (
                        <span className={`index-change ${indices.nasdaq.dayChangePercent >= 0 ? 'pos' : 'neg'}`}>
                          {indices.nasdaq.dayChangePercent >= 0 ? '+' : ''}{indices.nasdaq.dayChangePercent.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
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
            <Route path="/" element={<Dashboard baskets={baskets} onReload={loadBaskets} />} />
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
