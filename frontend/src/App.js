import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Baskets from './pages/Baskets';
import Portfolio from './pages/Portfolio';
import BasketDetail from './pages/BasketDetail';
import Debug from './pages/Debug';
import Status from './pages/Status';
import { basketAPI } from './services/api';
import './App.css';

function App() {
  const [baskets, setBaskets] = useState([]);
  const [indices, setIndices] = useState(null);

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
              <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} end>Baskets</NavLink>
              <NavLink to="/baskets" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Explore</NavLink>
              <NavLink to="/portfolio" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Portfolio</NavLink>
            </nav>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                </>
              )}
              <span className="live-badge"><span className="live-dot"></span> Live NSE/BSE</span>
            </div>
          </div>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard baskets={baskets} onReload={loadBaskets} />} />
            <Route path="/baskets" element={<Baskets baskets={baskets} onReload={loadBaskets} />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/basket/:id" element={<BasketDetail onReload={loadBaskets} />} />
            <Route path="/debug" element={<Debug />} />
            <Route path="/status" element={<Status />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>&copy; 2026 Indian Stock Basket Management System. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
