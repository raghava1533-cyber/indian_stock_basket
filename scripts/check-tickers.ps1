# Ticker Health Check Script — Indian + US
# Run: powershell -ExecutionPolicy Bypass -File scripts\check-tickers.ps1
#
# Tests every ticker in STOCK_UNIVERSE against Yahoo Finance and reports:
#   OK    - price + day change both valid
#   PRICE - price is 0 or null
#   DAY   - day change is null/missing (will show — on site)
#   FAIL  - ticker returned 404 / no data from Yahoo Finance

$TickerMap = @{
    'DEEPAKNITRITE' = 'DEEPAKNTR'
    'MAHINDCIE'     = '532756.BO'
    'KALPATPOWR'    = 'KPIL'
}

$AllTickers = @(
    # ── INDIAN ────────────────────────────────────────────────────────────────
    # largecap
    'RELIANCE.NS','TCS.NS','INFY.NS','HDFCBANK.NS','ICICIBANK.NS','HINDUNILVR.NS',
    'MARUTI.NS','SBIN.NS','BAJAJFINSV.NS','TITAN.NS','ASIANPAINT.NS','NESTLEIND.NS',
    'WIPRO.NS','ITC.NS','KOTAKBANK.NS','LT.NS','AXISBANK.NS','BAJFINANCE.NS',
    'HCLTECH.NS','NTPC.NS',
    # midcap
    'APOLLOHOSP.NS','ADANIPORTS.NS','LTTS.NS','CHOLAFIN.NS','MUTHOOTFIN.NS',
    'JSWSTEEL.NS','HINDALCO.NS','INDIGO.NS','GODREJPROP.NS','FEDERALBNK.NS',
    'VOLTAS.NS','PAGEIND.NS','IDFCFIRSTB.NS','GAIL.NS','SAIL.NS','TRENT.NS',
    'PERSISTENT.NS','COFORGE.NS','PIIND.NS','POLYCAB.NS',
    # smallcap
    'JUSTDIAL.NS','RADICO.NS','AUBANK.NS','KANSAINER.NS','TATACONSUM.NS',
    'JKCEMENT.NS','EDELWEISS.NS','NATCOPHARM.NS','PIDILITIND.NS','DIVISLAB.NS',
    'DEEPAKNITRITE.NS','RBLBANK.NS','SOBHA.NS','BRIGADE.NS','AARTIIND.NS',
    'CAMS.NS','LATENTVIEW.NS','MAHINDCIE.NS','SUDARSCHEM.NS','WHIRLPOOL.NS',
    # tech (updated: BIRLASOFT->BSOFT, ZENSAR->ZENSARTECH)
    'TECHM.NS','MPHASIS.NS','KPITTECH.NS','TATAELXSI.NS','LTIM.NS','OFSS.NS',
    'CYIENT.NS','MASTEK.NS','BSOFT.NS','ZENSARTECH.NS','ROUTE.NS','INTELLECT.NS',
    'DATAMATICS.NS',
    # finance
    'IRFC.NS','PFC.NS','RECLTD.NS','MANAPPURAM.NS','M&MFIN.NS',
    'SUNDARMFIN.NS','LICHSGFIN.NS','BANDHANBNK.NS','CANBK.NS',
    # healthcare
    'SUNPHARMA.NS','CIPLA.NS','DRREDDY.NS','LUPIN.NS','TORNTPHARM.NS',
    'AUROPHARMA.NS','ALKEM.NS','BIOCON.NS','GRANULES.NS','GLENMARK.NS',
    'ABBOTINDIA.NS','GLAXO.NS','PFIZER.NS','IPCALAB.NS','LAURUSLABS.NS',
    'APLLTD.NS','ERIS.NS','METROPOLIS.NS',
    # renewable
    'ADANIGREEN.NS','TATAPOWER.NS','SUZLON.NS','INOXWIND.NS','WAAREEENER.NS',
    'SJVN.NS','NHPC.NS','IREDA.NS','POWERGRID.NS','TORNTPOWER.NS','THERMAX.NS',
    'CESC.NS','KEC.NS','KPIL.NS','GPIL.NS','GREENPANEL.NS','RPOWER.NS','JSWENERGY.NS',
    # consumer (updated: ZOMATO->ETERNAL)
    'BRITANNIA.NS','DABUR.NS','MARICO.NS','COLPAL.NS','GODREJCP.NS','EMAMILTD.NS',
    'JYOTHYLAB.NS','VBL.NS','ETERNAL.NS','JUBLFOOD.NS','WESTLIFE.NS','DEVYANI.NS',
    'SAPPHIRE.NS','NYKAA.NS','MANYAVAR.NS','PATANJALI.NS',
    # infrastructure (updated: GMRINFRA->GMRAIRPORT)
    'RVNL.NS','NBCC.NS','ENGINERSIN.NS','HGINFRA.NS','KNRCON.NS','IRB.NS',
    'GMRAIRPORT.NS','ASHOKA.NS','BEL.NS','GRINFRA.NS','PNCINFRA.NS','TITAGARH.NS',
    'AHLUCONT.NS','HAL.NS','BDL.NS','RAILTEL.NS','COCHINSHIP.NS',
    # auto (updated: TATAMOTORS->OLECTRA)
    'OLECTRA.NS','M&M.NS','BAJAJ-AUTO.NS','HEROMOTOCO.NS','EICHERMOT.NS',
    'ASHOKLEY.NS','TVSMOTOR.NS','MOTHERSON.NS','BOSCHLTD.NS','MRF.NS',
    'APOLLOTYRE.NS','BALKRISIND.NS','EXIDEIND.NS','BHARATFORG.NS','SONACOMS.NS',
    'TIINDIA.NS','SWARAJENG.NS','CEATLTD.NS','FORCEMOT.NS',
    # metals
    'TATASTEEL.NS','HINDALCO.NS','JSWSTEEL.NS','NATIONALUM.NS','VEDL.NS',
    'COALINDIA.NS','NMDC.NS','APLAPOLLO.NS',

    # ── US ────────────────────────────────────────────────────────────────────
    # usa_tech
    'AAPL','MSFT','GOOGL','NVDA','META','CRM','ADBE','ORCL','CSCO','INTC',
    'AMD','AVGO','NOW','PANW','SNOW','UBER','AFRM','SHOP','PLTR','CRWD',
    # usa_finance
    'JPM','BAC','WFC','GS','MS','C','BLK','SCHW','AXP','V',
    'MA','PYPL','COF','USB','PNC','TFC','AJG','AON','ICE','CME',
    # usa_healthcare
    'UNH','JNJ','LLY','PFE','ABBV','MRK','TMO','ABT','DHR','BMY',
    'AMGN','GILD','ISRG','VRTX','REGN','MDT','SYK','ZTS','ELV','HCA',
    # usa_renewable
    'ENPH','SEDG','FSLR','NEE','PLUG','RUN','BE','CSIQ','AES','DQ',
    'ARRY','CEG','SPWR','MAXN','SHLS','ORA','CWEN','BEP','STEM','CLNE',
    # usa_consumer
    'AMZN','WMT','PG','KO','PEP','COST','NKE','MCD','SBUX','TGT',
    'CL','EL','KMB','MDLZ','GIS','CPB','HSY','MNST','DG','DLTR',
    # usa_infrastructure
    'CAT','DE','UNP','HON','GE','RTX','LMT','BA','MMM','EMR',
    'ETN','VMC','MLM','PWR','J','AME','WM','NSC','CSX','FAST',
    # usa_auto
    'TSLA','F','GM','RIVN','LCID','APTV','BWA','LEA','PCAR','CMI',
    'TM','RACE','NIO','XPEV','LI','STLA','ALV','VC','THRM','GT',
    # usa_metals
    'FCX','NUE','STLD','CLF','AA','WOR','RS','ATI','CMC','MT',
    'RIO','BHP','VALE','GOLD','NEM','RGLD','WPM','MP','CENX','KALU',
    # usa_telecom
    'TMUS','VZ','T','CMCSA','CHTR','LUMN','SHEN','GOGO','ASTS','SATS',
    'CCOI','EGHT','CALX','IDCC','CIEN','VIAV','LSCC','BAND','RBBN','GILT'
)

# Deduplicate
$UniqueTickers = $AllTickers | Select-Object -Unique

function Resolve-YFTicker($raw) {
    $base = $raw -replace '\.(NS|BO)$', ''
    if ($TickerMap.ContainsKey($base)) {
        $mapped = $TickerMap[$base]
        if ($mapped -match '\.') { return $mapped }
        return "$mapped.NS"
    }
    return $raw
}

$okList    = [System.Collections.Generic.List[string]]::new()
$dayList   = [System.Collections.Generic.List[string]]::new()
$priceList = [System.Collections.Generic.List[string]]::new()
$failList  = [System.Collections.Generic.List[string]]::new()

$total = $UniqueTickers.Count
$done  = 0

Write-Host "`nChecking $total tickers against Yahoo Finance...`n"

foreach ($raw in $UniqueTickers) {
    $done++
    $yf    = Resolve-YFTicker $raw
    $label = if ($yf -ne $raw) { "$raw -> $yf" } else { $raw }

    try {
        $r = Invoke-RestMethod "https://query1.finance.yahoo.com/v8/finance/chart/$([uri]::EscapeDataString($yf))?interval=1d&range=5d" `
                               -TimeoutSec 10 -ErrorAction Stop
        $result = $r.chart.result[0]
        $meta   = $result.meta
        $closes = @($result.indicators.quote[0].close | Where-Object { $_ -ne $null -and $_ -ne '' })

        $price    = if ($meta.regularMarketPrice) { $meta.regularMarketPrice } `
                    elseif ($closes.Count -gt 0)  { $closes[-1] } `
                    else { $null }
        $prevClose = $meta.chartPreviousClose

        if (-not $price -or $price -eq 0) {
            $detail = "price=$price prevClose=$prevClose"
            Write-Host "  X [$done/$total] $($label.PadRight(32)) PRICE  $detail" -ForegroundColor Red
            $priceList.Add("$($raw.PadRight(25))  YF: $($yf.PadRight(25)) $detail")
        } elseif (-not $prevClose) {
            $detail = "price=Rs$([math]::Round($price,2))  prevClose missing"
            Write-Host "  ! [$done/$total] $($label.PadRight(32)) DAY    $detail" -ForegroundColor Yellow
            $dayList.Add("$($raw.PadRight(25))  YF: $($yf.PadRight(25)) $detail")
        } else {
            $day    = $price - $prevClose
            $dayPct = [math]::Round(($day / $prevClose) * 100, 2)
            $sign   = if ($day -ge 0) { '+' } else { '' }
            $detail = "Rs$([math]::Round($price,2))  day=$sign$([math]::Round($day,2)) ($sign$dayPct%)"
            Write-Host "  OK[$done/$total] $($label.PadRight(32)) OK     $detail" -ForegroundColor Green
            $okList.Add("$raw")
        }
    } catch {
        $detail = $_.Exception.Message -replace '\r?\n.*', ''
        Write-Host "  X [$done/$total] $($label.PadRight(32)) FAIL   $detail" -ForegroundColor Red
        $failList.Add("$($raw.PadRight(25))  YF: $($yf.PadRight(25)) $detail")
    }

    # Small delay every 10 tickers to avoid rate limiting
    if ($done % 10 -eq 0) { Start-Sleep -Milliseconds 500 }
}

# ── Summary ──────────────────────────────────────────────────────────────────
Write-Host ("`n" + ("=" * 72))
Write-Host "SUMMARY: $($okList.Count) OK,  $($dayList.Count) missing day change,  $($priceList.Count) bad price,  $($failList.Count) failed"
Write-Host ("=" * 72)

if ($failList.Count -gt 0) {
    Write-Host "`nFAILED ($($failList.Count)) -- 404 / no data on Yahoo Finance:" -ForegroundColor Red
    $failList | ForEach-Object { Write-Host "    $_" }
}
if ($priceList.Count -gt 0) {
    Write-Host "`nBAD PRICE ($($priceList.Count)) -- price is 0 or null:" -ForegroundColor Red
    $priceList | ForEach-Object { Write-Host "    $_" }
}
if ($dayList.Count -gt 0) {
    Write-Host "`nNO DAY CHANGE ($($dayList.Count)) -- prevClose missing (will show -- on site):" -ForegroundColor Yellow
    $dayList | ForEach-Object { Write-Host "    $_" }
}
if ($failList.Count -eq 0 -and $priceList.Count -eq 0 -and $dayList.Count -eq 0) {
    Write-Host "`nAll tickers are healthy!" -ForegroundColor Green
}
Write-Host ""

# ── Stooq cross-check for failed tickers ─────────────────────────────────────
# Stooq is a free independent data source (no API key needed).
# If Yahoo 404s but Stooq has data → ticker needs remapping in the codebase.
# If both fail → stock is genuinely delisted/acquired and should be replaced.
if ($failList.Count -gt 0) {
    Write-Host "Cross-checking $($failList.Count) failed ticker(s) against Stooq (independent source)..." -ForegroundColor Cyan
    $stooqOk   = [System.Collections.Generic.List[string]]::new()
    $stooqFail = [System.Collections.Generic.List[string]]::new()

    foreach ($entry in $failList) {
        $raw = ($entry -split '\s+')[0].Trim()
        # Convert Yahoo ticker format to Stooq: AAPL -> aapl.us, RELIANCE.NS -> reliance.ns
        $stooqTicker = if ($raw -match '\.(NS|BO)$') { $raw.ToLower() } else { "$($raw.ToLower()).us" }
        try {
            $csv   = (Invoke-WebRequest "https://stooq.com/q/l/?s=$([uri]::EscapeDataString($stooqTicker))&f=sd2t2ohlcv&h&e=csv" `
                          -TimeoutSec 10 -UseBasicParsing).Content
            $lines = $csv.Trim().Split("`n")
            if ($lines.Count -ge 2) {
                $cols = $lines[1].Trim().Split(',')
                if ($cols.Count -ge 7 -and $cols[6] -ne 'N/D' -and $cols[6] -ne '') {
                    $close = [math]::Round([double]$cols[6], 2)
                    $msg   = "$($raw.PadRight(20)) Stooq price=$close  (Yahoo 404 but Stooq OK — may need ticker remap)"
                    Write-Host "  STOOQ OK : $msg" -ForegroundColor Yellow
                    $stooqOk.Add($msg)
                } else {
                    $msg = "$($raw.PadRight(20)) no data on Stooq either — likely delisted/acquired"
                    Write-Host "  STOOQ FAIL: $msg" -ForegroundColor Red
                    $stooqFail.Add($msg)
                }
            }
        } catch {
            $err = $_.Exception.Message -replace '\r?\n.*', ''
            Write-Host "  STOOQ ERR : $($raw.PadRight(20)) $err" -ForegroundColor DarkRed
        }
        Start-Sleep -Milliseconds 300
    }

    Write-Host ""
    if ($stooqOk.Count -gt 0) {
        Write-Host "ACTION NEEDED: $($stooqOk.Count) ticker(s) need Yahoo remapping (Stooq confirms they still trade):" -ForegroundColor Yellow
        $stooqOk | ForEach-Object { Write-Host "    $_" }
    }
    if ($stooqFail.Count -gt 0) {
        Write-Host "CONFIRMED DEAD: $($stooqFail.Count) ticker(s) are delisted/acquired on ALL sources:" -ForegroundColor Red
        $stooqFail | ForEach-Object { Write-Host "    $_" }
    }
    Write-Host ""
}
