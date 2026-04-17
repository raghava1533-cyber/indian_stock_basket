import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Baskets from './pages/Baskets';
import Portfolio from './pages/Portfolio';
import BasketDetail from './pages/BasketDetail';
import { basketAPI } from './services/api';
import './App.css';

function App() {
  const [baskets, setBaskets] = useState([]);

  useEffect(() => {
    loadBaskets();
  }, []);

  const loadBaskets = async () => {
    try {
      const response = await basketAPI.getAllBaskets();
      setBaskets(response.data);
    } catch (error) {
      console.error('Error loading baskets:', error);
    }
  };

  return (
    <Router>
      <div className="app">
        <header className="header">
          <div className="header-content">
            <h1 className="logo">📈 Indian Stock Basket</h1>
            <nav className="nav">
              <Link to="/" className="nav-link">Dashboard</Link>
              <Link to="/baskets" className="nav-link">Baskets</Link>
              <Link to="/portfolio" className="nav-link">Portfolio</Link>
            </nav>
          </div>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard baskets={baskets} onReload={loadBaskets} />} />
            <Route path="/baskets" element={<Baskets baskets={baskets} onReload={loadBaskets} />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/basket/:id" element={<BasketDetail onReload={loadBaskets} />} />
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
