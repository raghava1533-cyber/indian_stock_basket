import React from 'react';

function Portfolio() {
  return (
    <div className="portfolio-page">
      <h1>My Portfolio</h1>
      <p className="subtitle">Your subscribed baskets and portfolio summary</p>

      <div className="portfolio-container">
        <div className="portfolio-section">
          <h2>📊 Portfolio Overview</h2>
          <div className="overview-grid">
            <div className="overview-card">
              <div className="overview-label">Total Baskets</div>
              <div className="overview-value">0</div>
              <div className="overview-description">Subscribed to</div>
            </div>
            <div className="overview-card">
              <div className="overview-label">Total Stocks</div>
              <div className="overview-value">0</div>
              <div className="overview-description">Across baskets</div>
            </div>
            <div className="overview-card">
              <div className="overview-label">Email Notifications</div>
              <div className="overview-value">Enabled</div>
              <div className="overview-description">For rebalances</div>
            </div>
          </div>
        </div>

        <div className="portfolio-section">
          <h2>💼 Your Subscriptions</h2>
          <div className="empty-message">
            <p>You haven't subscribed to any baskets yet.</p>
            <p>Go to <strong>Baskets</strong> to subscribe and start receiving rebalance notifications!</p>
          </div>
        </div>

        <div className="portfolio-section">
          <h2>📈 Recent Rebalances</h2>
          <div className="empty-message">
            <p>No recent rebalancing history.</p>
            <p>Baskets are automatically rebalanced every 30 days.</p>
          </div>
        </div>
      </div>

      <style>{`
        .portfolio-page {
          padding: 20px;
        }

        .portfolio-page h1 {
          font-size: 2rem;
          margin-bottom: 5px;
          color: #333;
        }

        .subtitle {
          color: #666;
          font-size: 1.05rem;
          margin-bottom: 30px;
        }

        .portfolio-container {
          max-width: 1200px;
        }

        .portfolio-section {
          background: white;
          border-radius: 12px;
          padding: 25px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .portfolio-section h2 {
          font-size: 1.5rem;
          margin-bottom: 20px;
          color: #333;
        }

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
        }

        .overview-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
        }

        .overview-label {
          font-size: 0.85rem;
          opacity: 0.9;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .overview-value {
          font-size: 2.5rem;
          font-weight: bold;
          margin: 10px 0;
        }

        .overview-description {
          font-size: 0.9rem;
          opacity: 0.85;
        }

        .empty-message {
          text-align: center;
          padding: 30px;
          background: #f9f9f9;
          border-radius: 8px;
          color: #666;
        }

        .empty-message p {
          margin: 10px 0;
          font-size: 1rem;
        }

        .empty-message strong {
          color: #333;
        }
      `}</style>
    </div>
  );
}

export default Portfolio;
