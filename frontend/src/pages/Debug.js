import React, { useState, useEffect } from 'react';
import { basketAPI } from '../services/api';

function Debug() {
  const [logs, setLogs] = useState([]);
  const [baskets, setBaskets] = useState(null);

  const addLog = (msg) => {
    console.log(msg);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  useEffect(() => {
    addLog(`=== DEBUG PAGE LOADED ===`);
    addLog(`API_BASE_URL: ${process.env.REACT_APP_API_URL || 'NOT SET - using default (http://localhost:5000/api)'}`);
    addLog(`NODE_ENV: ${process.env.NODE_ENV}`);
    addLog(`Full health URL: ${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/health`);
    addLog(`Full baskets URL: ${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/baskets`);
  }, []);

  const testHealth = async () => {
    addLog('Testing /api/health...');
    try {
      const res = await basketAPI.checkHealth();
      addLog(`✓ Health check passed: ${JSON.stringify(res.data)}`);
    } catch (err) {
      addLog(`✗ Health check failed: ${err.message}`);
    }
  };

  const populateBaskets = async () => {
    addLog('Populating baskets with stocks...');
    try {
      const res = await basketAPI.populateBaskets();
      addLog(`✓ Populate done: ${JSON.stringify(res.data)}`);
    } catch (err) {
      addLog(`✗ Populate failed: ${err.message}`);
    }
  };

  const testBaskets = async () => {
    addLog('Testing /api/baskets...');
    try {
      const res = await basketAPI.getAllBaskets();
      addLog(`✓ Got baskets: ${res.data.length} found`);
      setBaskets(res.data);
      res.data.forEach((b, idx) => {
        addLog(`  ${idx + 1}. ${b.name}`);
      });
    } catch (err) {
      addLog(`✗ Failed to get baskets: ${err.message}`);
      if (err.response?.status) {
        addLog(`  Status: ${err.response.status}`);
        addLog(`  Data: ${JSON.stringify(err.response.data)}`);
      }
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔧 Debug Console</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={testHealth} style={{ marginRight: '10px', padding: '8px 16px' }}>
          Test /api/health
        </button>
        <button onClick={testBaskets} style={{ marginRight: '10px', padding: '8px 16px' }}>
          Test /api/baskets
        </button>
        <button onClick={populateBaskets} style={{ padding: '8px 16px', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Populate Baskets with Stocks
        </button>
      </div>

      <div style={{ 
        backgroundColor: '#1e1e1e', 
        color: '#00ff00', 
        padding: '10px', 
        borderRadius: '5px',
        maxHeight: '400px',
        overflowY: 'auto',
        fontSize: '12px',
        lineHeight: '1.5'
      }}>
        {logs.map((log, idx) => (
          <div key={idx}>{log}</div>
        ))}
      </div>

      {baskets && (
        <div style={{ marginTop: '20px' }}>
          <h2>Baskets Found ({baskets.length}):</h2>
          <pre>{JSON.stringify(baskets, null, 2).substring(0, 500)}...</pre>
        </div>
      )}
    </div>
  );
}

export default Debug;
