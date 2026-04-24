import { useEffect, useState } from "react";
import { getMarketData } from "../services/api";

export default function Dashboard() {
  const [market, setMarket] = useState("INDIA");
  const [data, setData] = useState({});

  const load = async () => {
    const res = await getMarketData(market);
    setData(res);
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 60000); // ✅ 1 min refresh
    return () => clearInterval(timer);
  }, [market]);

  // Show last updated time if available
  let lastUpdated = null;
  if (data && data.updatedAt) {
    try {
      const updatedDate = new Date(data.updatedAt);
      const now = new Date();
      if (updatedDate > now) {
        lastUpdated = updatedDate.toLocaleString('en-US', { timeZone: 'UTC' }) + ' UTC';
      } else {
        lastUpdated = updatedDate.toLocaleString();
      }
    } catch {
      lastUpdated = String(data.updatedAt);
    }
  }

  return (
    <div>
      <h2>{market} Market</h2>

      <button onClick={() => setMarket("INDIA")}>India</button>
      <button onClick={() => setMarket("US")}>USA</button>

      {lastUpdated && (
        <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>
          Last updated: {lastUpdated}
        </div>
      )}

      {Object.entries(data).filter(([k]) => k !== 'updatedAt').map(([name, val]) => (
        <div key={name}>
          <h3>{name}</h3>
          <p>{val.price}</p>
          <p style={{ color: val.change >= 0 ? "green" : "red" }}>
            {val.change >= 0 ? '+' : ''}{val.change} ({val.pct >= 0 ? '+' : ''}{val.pct}%)
          </p>
        </div>
      ))}
    </div>
  );
}