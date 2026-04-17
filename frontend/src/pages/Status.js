import React, { useState, useEffect } from 'react';

function Status() {
  const [config, setConfig] = useState({});

  useEffect(() => {
    setConfig({
      apiBaseUrl: process.env.REACT_APP_API_URL,
      nodeEnv: process.env.NODE_ENV,
      defaultUrl: 'http://localhost:5000/api',
      fullHealthUrl: (process.env.REACT_APP_API_URL || 'http://localhost:5000/api') + '/health',
      fullBasketsUrl: (process.env.REACT_APP_API_URL || 'http://localhost:5000/api') + '/baskets'
    });
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <h1>🔧 System Status & Configuration</h1>
      
      <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Environment Configuration</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '10px', fontWeight: 'bold' }}>REACT_APP_API_URL:</td>
              <td style={{ padding: '10px', color: config.apiBaseUrl ? 'green' : 'red' }}>
                {config.apiBaseUrl || '❌ NOT SET (using default)'}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '10px', fontWeight: 'bold' }}>NODE_ENV:</td>
              <td style={{ padding: '10px' }}>{config.nodeEnv || 'development'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '10px', fontWeight: 'bold' }}>Default API URL:</td>
              <td style={{ padding: '10px' }}>{config.defaultUrl}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ backgroundColor: '#e3f2fd', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Active Endpoints</h2>
        <p><strong>Health Check:</strong> <code>{config.fullHealthUrl}</code></p>
        <p><strong>Get Baskets:</strong> <code>{config.fullBasketsUrl}</code></p>
      </div>

      <div style={{ backgroundColor: '#fff3e0', padding: '20px', borderRadius: '8px' }}>
        <h2>⚠️ Important Note</h2>
        <p>If REACT_APP_API_URL is NOT SET, you need to:</p>
        <ol>
          <li>Go to Vercel dashboard for this project</li>
          <li>Click "Settings" → "Environment Variables"</li>
          <li>Add: <code>REACT_APP_API_URL=https://stock-basket-api.onrender.com/api</code></li>
          <li>Redeploy the project (push to GitHub or click "Deploy" in Vercel)</li>
        </ol>
      </div>
    </div>
  );
}

export default Status;
