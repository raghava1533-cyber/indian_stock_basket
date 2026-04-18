import React, { useState } from 'react';

function Disclaimer() {
  const [open, setOpen] = useState(true);

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '14px',
        maxWidth: '520px',
        width: '100%',
        boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
        padding: '32px 28px 24px',
        position: 'relative',
      }}>
        <div style={{ fontSize: '32px', textAlign: 'center', marginBottom: '12px' }}>⚠️</div>
        <h2 style={{ textAlign: 'center', margin: '0 0 16px', fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }}>
          Important Disclaimer
        </h2>
        <p style={{ fontSize: '13px', color: '#444', lineHeight: '1.7', margin: '0 0 12px' }}>
          <strong>SmartBasket India</strong> provides stock basket information for <strong>educational and informational purposes only</strong>.
        </p>
        <p style={{ fontSize: '13px', color: '#444', lineHeight: '1.7', margin: '0 0 12px' }}>
          The content on this platform — including stock picks, allocations, and performance data — <strong>does not constitute financial, investment, or trading advice</strong>. We are not a SEBI-registered investment advisor.
        </p>
        <p style={{ fontSize: '13px', color: '#444', lineHeight: '1.7', margin: '0 0 20px' }}>
          All investments carry risk. <strong>Past performance is not indicative of future results.</strong> Please conduct your own due diligence and consult a qualified financial advisor before making any investment decisions.
        </p>
        <button
          onClick={() => setOpen(false)}
          style={{
            display: 'block', width: '100%',
            background: '#1D9E75', color: '#fff',
            border: 'none', borderRadius: '8px',
            padding: '12px', fontSize: '14px', fontWeight: '600',
            cursor: 'pointer', letterSpacing: '0.3px',
          }}
        >
          I Understand — Continue to SmartBasket
        </button>
      </div>
    </div>
  );
}

export default Disclaimer;

