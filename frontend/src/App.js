import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import BasketDetail from './pages/BasketDetail';
import './App.css';

function App() {
  const [baskets, setBaskets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBaskets();
  }, []);

  const loadBaskets = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/baskets');
      const data = await response.json();
      setBaskets(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading baskets:', error);
      setLoading(false);
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
              <Link to="/" className="nav-link">Baskets</Link>
              <Link to="/" className="nav-link">Portfolio</Link>
            </nav>
          </div>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard baskets={baskets} onReload={loadBaskets} />} />
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
