import React from 'react';

function Disclaimer() {
  return (
    <div style={{
      backgroundColor: '#FFF3E0',
      borderTop: '2px solid #FF9800',
      padding: '12px 20px',
      textAlign: 'center',
      fontSize: '12px',
      color: '#555',
      fontStyle: 'italic',
      lineHeight: 1.4,
    }}>
      ⚠️ <strong>Stock Recommendation, Not Investment Advice</strong> — SmartBasket India's stock recommendations are based on quantitative scoring criteria for educational purposes only. These are not investment recommendations. Please conduct your own research and consult a financial advisor before making any investment decisions. Past performance does not guarantee future results.
    </div>
  );
}

export default Disclaimer;
