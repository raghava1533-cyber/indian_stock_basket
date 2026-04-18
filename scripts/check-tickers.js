/**
 * Ticker Health Check Script
 * Run: node scripts/check-tickers.js
 * 
 * Tests every ticker in STOCK_UNIVERSE against Yahoo Finance and reports:
 *   OK    - price + day change both valid
 *   PRICE - price is 0 or null
 *   DAY   - day change is null/missing (prevClose not available)
 *   FAIL  - ticker returned 404 / no data from Yahoo Finance
 */

const https = require('https');

// ── Ticker map (same as baskets.js) ──────────────────────────────────────────
const TICKER_MAP = {
  'DEEPAKNITRITE': 'DEEPAKNTR',
  'MAHINDCIE':     '532756.BO',
  'KALPATPOWR':    'KPIL',
};

// ── All unique tickers from STOCK_UNIVERSE ───────────────────────────────────
const ALL_TICKERS = [
  // largecap
  'RELIANCE.NS','TCS.NS','INFY.NS','HDFCBANK.NS','ICICIBANK.NS','HINDUNILVR.NS',
  'MARUTI.NS','SBIN.NS','BAJAJFINSV.NS','TITAN.NS','ASIANPAINT.NS','NESTLEIND.NS',
  'WIPRO.NS','ITC.NS','KOTAKBANK.NS','LT.NS','AXISBANK.NS','BAJFINANCE.NS',
  'HCLTECH.NS','NTPC.NS',
  // midcap
  'APOLLOHOSP.NS','ADANIPORTS.NS','LTTS.NS','CHOLAFIN.NS','MUTHOOTFIN.NS',
  'JSWSTEEL.NS','HINDALCO.NS','INDIGO.NS','GODREJPROP.NS','FEDERALBNK.NS',
  'VOLTAS.NS','PAGEIND.NS','IDFCFIRSTB.NS','GAIL.NS','SAIL.NS','TRENT.NS',
  'PERSISTENT.NS','COFORGE.NS','PIIND.NS','POLYCAB.NS',
  // smallcap
  'JUSTDIAL.NS','RADICO.NS','AUBANK.NS','KANSAINER.NS','TATACONSUM.NS',
  'JKCEMENT.NS','EDELWEISS.NS','NATCOPHARM.NS','PIDILITIND.NS','DIVISLAB.NS',
  'DEEPAKNITRITE.NS','RBLBANK.NS','SOBHA.NS','BRIGADE.NS','AARTIIND.NS',
  'CAMS.NS','LATENTVIEW.NS','MAHINDCIE.NS','SUDARSCHEM.NS','WHIRLPOOL.NS',
  // tech
  'TECHM.NS','MPHASIS.NS','KPITTECH.NS','TATAELXSI.NS','LTIM.NS','OFSS.NS',
  'CYIENT.NS','MASTEK.NS','BIRLASOFT.NS','ZENSAR.NS','ROUTE.NS','INTELLECT.NS',
  'DATAMATICS.NS',
  // finance
  'IRFC.NS','PFC.NS','RECLTD.NS','BAJFINANCE.NS','MANAPPURAM.NS','M&MFIN.NS',
  'SUNDARMFIN.NS','LICHSGFIN.NS','BANDHANBNK.NS','CANBK.NS',
  // healthcare
  'SUNPHARMA.NS','CIPLA.NS','DRREDDY.NS','LUPIN.NS','TORNTPHARM.NS',
  'AUROPHARMA.NS','ALKEM.NS','BIOCON.NS','GRANULES.NS','GLENMARK.NS',
  'ABBOTINDIA.NS','GLAXO.NS','PFIZER.NS','IPCALAB.NS','LAURUSLABS.NS',
  'APLLTD.NS','ERIS.NS','METROPOLIS.NS',
  // renewable
  'ADANIGREEN.NS','TATAPOWER.NS','SUZLON.NS','INOXWIND.NS','WAAREEENER.NS',
  'SJVN.NS','NHPC.NS','IREDA.NS','POWERGRID.NS','TORNTPOWER.NS','THERMAX.NS',
  'CESC.NS','KEC.NS','KPIL.NS','GPIL.NS','GREENPANEL.NS','RPOWER.NS',
  'JSWENERGY.NS',
  // consumer
  'BRITANNIA.NS','DABUR.NS','MARICO.NS','COLPAL.NS','GODREJCP.NS','EMAMILTD.NS',
  'JYOTHYLAB.NS','VBL.NS','ZOMATO.NS','JUBLFOOD.NS','WESTLIFE.NS','DEVYANI.NS',
  'SAPPHIRE.NS','NYKAA.NS','MANYAVAR.NS','PATANJALI.NS',
  // infrastructure
  'RVNL.NS','NBCC.NS','ENGINERSIN.NS','HGINFRA.NS','KNRCON.NS','IRB.NS',
  'GMRINFRA.NS','ASHOKA.NS','BEL.NS','GRINFRA.NS','PNCINFRA.NS','TITAGARH.NS',
  'AHLUCONT.NS','HAL.NS','BDL.NS','RAILTEL.NS','COCHINSHIP.NS',
  // auto
  'TATAMOTORS.NS','M&M.NS','BAJAJ-AUTO.NS','HEROMOTOCO.NS','EICHERMOT.NS',
  'ASHOKLEY.NS','TVSMOTOR.NS','MOTHERSON.NS','BOSCHLTD.NS','MRF.NS',
  'APOLLOTYRE.NS','BALKRISIND.NS','EXIDEIND.NS','BHARATFORG.NS','SONACOMS.NS',
  'TIINDIA.NS','SWARAJENG.NS','CEATLTD.NS','FORCEMOT.NS',
  // metals (partial)
  'TATASTEEL.NS',
];

// Deduplicate
const UNIQUE_TICKERS = [...new Set(ALL_TICKERS)];

// Apply ticker map (same logic as baskets.js)
function resolveYFTicker(rawTicker) {
  const base = rawTicker.replace(/\.(NS|BO)$/, '');
  const mapped = TICKER_MAP[base];
  if (mapped) return mapped.includes('.') ? mapped : mapped + '.NS';
  return rawTicker;
}

// ── Yahoo Finance v8 fetch ────────────────────────────────────────────────────
function fetchTicker(yfTicker) {
  return new Promise((resolve) => {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yfTicker)}?interval=1d&range=5d`;
    const opts = {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      },
      timeout: 12000,
    };
    const req = https.get(url, opts, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        if (res.statusCode !== 200) return resolve({ status: 'FAIL', detail: `HTTP ${res.statusCode}` });
        try {
          const json = JSON.parse(body);
          const result = json?.chart?.result?.[0];
          if (!result) return resolve({ status: 'FAIL', detail: 'empty result' });

          const meta = result.meta;
          const closes = (result.indicators?.quote?.[0]?.close || []).filter(c => c != null);
          const price = meta.regularMarketPrice ?? (closes.length ? closes[closes.length - 1] : null);
          const prevClose = meta.chartPreviousClose ?? null;

          if (!price || price === 0) return resolve({ status: 'PRICE', detail: `price=${price}, prevClose=${prevClose}` });
          if (!prevClose) return resolve({ status: 'DAY', detail: `price=₹${price?.toFixed(2)}, prevClose missing` });

          const dayChange = price - prevClose;
          resolve({ status: 'OK', detail: `₹${price.toFixed(2)}, day=${dayChange >= 0 ? '+' : ''}${dayChange.toFixed(2)} (${((dayChange/prevClose)*100).toFixed(2)}%)` });
        } catch (e) {
          resolve({ status: 'FAIL', detail: `parse error: ${e.message}` });
        }
      });
    });
    req.on('error', (e) => resolve({ status: 'FAIL', detail: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 'FAIL', detail: 'timeout' }); });
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const results = { OK: [], PRICE: [], DAY: [], FAIL: [] };
  const total = UNIQUE_TICKERS.length;
  let done = 0;

  console.log(`\nChecking ${total} tickers against Yahoo Finance...\n`);

  // Process in batches of 8 to avoid rate limiting
  const BATCH = 8;
  for (let i = 0; i < UNIQUE_TICKERS.length; i += BATCH) {
    const batch = UNIQUE_TICKERS.slice(i, i + BATCH);
    const checks = batch.map(async (raw) => {
      const yf = resolveYFTicker(raw);
      const label = yf !== raw ? `${raw} → ${yf}` : raw;
      const result = await fetchTicker(yf);
      done++;
      const icon = result.status === 'OK' ? '✓' : result.status === 'DAY' ? '⚠' : '✗';
      process.stdout.write(`  ${icon} [${done}/${total}] ${label.padEnd(30)} ${result.status.padEnd(5)} ${result.detail}\n`);
      results[result.status].push({ ticker: raw, yf, ...result });
    });
    await Promise.all(checks);
    // Small delay between batches to avoid rate limiting
    if (i + BATCH < UNIQUE_TICKERS.length) await new Promise(r => setTimeout(r, 400));
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(70));
  console.log(`SUMMARY: ${results.OK.length} OK, ${results.DAY.length} missing day change, ${results.PRICE.length} bad price, ${results.FAIL.length} failed`);
  console.log('='.repeat(70));

  if (results.FAIL.length) {
    console.log(`\n✗ FAILED (${results.FAIL.length}) — these tickers return 404 or no data:`);
    results.FAIL.forEach(r => console.log(`    ${r.ticker.padEnd(25)} YF: ${r.yf.padEnd(25)} ${r.detail}`));
  }
  if (results.PRICE.length) {
    console.log(`\n⚠ BAD PRICE (${results.PRICE.length}) — price is 0 or null:`);
    results.PRICE.forEach(r => console.log(`    ${r.ticker.padEnd(25)} YF: ${r.yf.padEnd(25)} ${r.detail}`));
  }
  if (results.DAY.length) {
    console.log(`\n⚠ NO DAY CHANGE (${results.DAY.length}) — prevClose missing (will show —):`);
    results.DAY.forEach(r => console.log(`    ${r.ticker.padEnd(25)} YF: ${r.yf.padEnd(25)} ${r.detail}`));
  }
  if (results.FAIL.length === 0 && results.PRICE.length === 0 && results.DAY.length === 0) {
    console.log('\nAll tickers are healthy!');
  }
  console.log('');
}

main().catch(console.error);
