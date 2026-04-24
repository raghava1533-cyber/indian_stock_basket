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

  return (
    <div>
      <h2>{market} Market</h2>

      <button onClick={() => setMarket("INDIA")}>India</button>
      <button onClick={() => setMarket("US")}>USA</button>

      {Object.entries(data).map(([name, val]) => (
        <div key={name}>
          <h3>{name}</h3>
          <p>{val.price}</p>
          <p style={{ color: val.change >= 0 ? "green" : "red" }}>
            {val.change} ({val.pct}%)
          </p>
        </div>
      ))}
    </div>
  );
}