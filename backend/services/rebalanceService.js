const Basket = require('../models/Basket');
const RebalanceHistory = require('../models/RebalanceHistory');
const emailService = require('./emailService');

// ─── Hardcoded stock universe with fundamentals ───────────────────────────────
const STOCK_UNIVERSE = {
  largeCap: [
    { ticker: 'RELIANCE.NS',   companyName: 'Reliance Industries',      currentPrice: 2850, high52Week: 3217, low52Week: 2220, marketCapCr: 1930000, peRatio: 24.5, earningsGrowth: 12, futureGrowth: 9, socialSentiment: 8 },
    { ticker: 'TCS.NS',        companyName: 'Tata Consultancy Services', currentPrice: 3780, high52Week: 4592, low52Week: 3311, marketCapCr: 1370000, peRatio: 28.2, earningsGrowth: 10, futureGrowth: 8, socialSentiment: 8 },
    { ticker: 'INFY.NS',       companyName: 'Infosys',                   currentPrice: 1620, high52Week: 1904, low52Week: 1358, marketCapCr:  675000, peRatio: 24.1, earningsGrowth: 9,  futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'HDFCBANK.NS',   companyName: 'HDFC Bank',                 currentPrice: 1720, high52Week: 1880, low52Week: 1430, marketCapCr: 1310000, peRatio: 19.8, earningsGrowth: 18, futureGrowth: 9, socialSentiment: 8 },
    { ticker: 'ICICIBANK.NS',  companyName: 'ICICI Bank',                currentPrice: 1380, high52Week: 1427, low52Week: 1014, marketCapCr:  970000, peRatio: 18.5, earningsGrowth: 22, futureGrowth: 9, socialSentiment: 9 },
    { ticker: 'HINDUNILVR.NS', companyName: 'Hindustan Unilever',        currentPrice: 2350, high52Week: 2810, low52Week: 2200, marketCapCr:  551000, peRatio: 55.0, earningsGrowth: 7,  futureGrowth: 6, socialSentiment: 7 },
    { ticker: 'MARUTI.NS',     companyName: 'Maruti Suzuki',             currentPrice: 12200,high52Week: 13680,low52Week: 9630, marketCapCr:  369000, peRatio: 26.3, earningsGrowth: 20, futureGrowth: 8, socialSentiment: 8 },
    { ticker: 'SBIN.NS',       companyName: 'State Bank of India',       currentPrice: 790,  high52Week: 912,  low52Week: 600,  marketCapCr:  704000, peRatio: 10.2, earningsGrowth: 25, futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'BAJAJFINSV.NS', companyName: 'Bajaj Finserv',             currentPrice: 1890, high52Week: 2030, low52Week: 1419, marketCapCr:  301000, peRatio: 22.1, earningsGrowth: 20, futureGrowth: 9, socialSentiment: 8 },
    { ticker: 'TITAN.NS',      companyName: 'Titan Company',             currentPrice: 3200, high52Week: 3885, low52Week: 2775, marketCapCr:  284000, peRatio: 85.0, earningsGrowth: 18, futureGrowth: 8, socialSentiment: 9 },
    { ticker: 'ASIANPAINT.NS', companyName: 'Asian Paints',              currentPrice: 2470, high52Week: 3395, low52Week: 2025, marketCapCr:  236000, peRatio: 52.0, earningsGrowth: 5,  futureGrowth: 6, socialSentiment: 7 },
    { ticker: 'NESTLEIND.NS',  companyName: 'Nestle India',              currentPrice: 2290, high52Week: 2778, low52Week: 2100, marketCapCr:  220000, peRatio: 70.0, earningsGrowth: 8,  futureGrowth: 6, socialSentiment: 7 },
    { ticker: 'WIPRO.NS',      companyName: 'Wipro',                     currentPrice: 470,  high52Week: 577,  low52Week: 400,  marketCapCr:  244000, peRatio: 21.5, earningsGrowth: 7,  futureGrowth: 7, socialSentiment: 6 },
    { ticker: 'ITC.NS',        companyName: 'ITC Limited',               currentPrice: 430,  high52Week: 539,  low52Week: 399,  marketCapCr:  537000, peRatio: 27.0, earningsGrowth: 10, futureGrowth: 7, socialSentiment: 7 },
    { ticker: 'KOTAKBANK.NS',  companyName: 'Kotak Mahindra Bank',       currentPrice: 1950, high52Week: 2115, low52Week: 1544, marketCapCr:  388000, peRatio: 20.5, earningsGrowth: 15, futureGrowth: 8, socialSentiment: 7 },
  ],
  midCap: [
    { ticker: 'APOLLOHOSP.NS', companyName: 'Apollo Hospitals',         currentPrice: 6800, high52Week: 7545, low52Week: 5200, marketCapCr: 97000,  peRatio: 68.0, earningsGrowth: 35, futureGrowth: 9, socialSentiment: 9 },
    { ticker: 'ADANIPORTS.NS', companyName: 'Adani Ports & SEZ',        currentPrice: 1290, high52Week: 1608, low52Week: 980,  marketCapCr: 278000, peRatio: 22.0, earningsGrowth: 22, futureGrowth: 9, socialSentiment: 7 },
    { ticker: 'LTTS.NS',       companyName: 'L&T Technology Services',  currentPrice: 4850, high52Week: 6000, low52Week: 3900, marketCapCr: 51000,  peRatio: 30.0, earningsGrowth: 18, futureGrowth: 9, socialSentiment: 8 },
    { ticker: 'CHOLAFIN.NS',   companyName: 'Cholamandalam Finance',    currentPrice: 1350, high52Week: 1652, low52Week: 950,  marketCapCr: 111000, peRatio: 25.0, earningsGrowth: 30, futureGrowth: 9, socialSentiment: 8 },
    { ticker: 'MUTHOOTFIN.NS', companyName: 'Muthoot Finance',          currentPrice: 1850, high52Week: 2228, low52Week: 1350, marketCapCr: 74000,  peRatio: 14.5, earningsGrowth: 20, futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'JSWSTEEL.NS',   companyName: 'JSW Steel',                currentPrice: 940,  high52Week: 1063, low52Week: 760,  marketCapCr: 230000, peRatio: 15.0, earningsGrowth: 12, futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'HINDALCO.NS',   companyName: 'Hindalco Industries',      currentPrice: 680,  high52Week: 772,  low52Week: 490,  marketCapCr: 153000, peRatio: 11.0, earningsGrowth: 18, futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'INDIGO.NS',     companyName: 'IndiGo (InterGlobe)',      currentPrice: 4800, high52Week: 5017, low52Week: 3050, marketCapCr: 185000, peRatio: 17.0, earningsGrowth: 45, futureGrowth: 8, socialSentiment: 8 },
    { ticker: 'GODREJPROP.NS', companyName: 'Godrej Properties',        currentPrice: 2450, high52Week: 3402, low52Week: 1762, marketCapCr: 68000,  peRatio: 52.0, earningsGrowth: 28, futureGrowth: 8, socialSentiment: 8 },
    { ticker: 'FEDERALBNK.NS', companyName: 'Federal Bank',             currentPrice: 185,  high52Week: 213,  low52Week: 142,  marketCapCr: 45000,  peRatio: 10.5, earningsGrowth: 22, futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'VOLTAS.NS',     companyName: 'Voltas',                   currentPrice: 1450, high52Week: 1800, low52Week: 1050, marketCapCr: 48000,  peRatio: 55.0, earningsGrowth: 22, futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'PAGEIND.NS',    companyName: 'Page Industries',          currentPrice: 42000,high52Week: 48000,low52Week: 33000,marketCapCr: 46900,  peRatio: 60.0, earningsGrowth: 14, futureGrowth: 7, socialSentiment: 7 },
    { ticker: 'IDFCFIRSTB.NS', companyName: 'IDFC First Bank',          currentPrice: 75,   high52Week: 92,   low52Week: 55,   marketCapCr: 55000,  peRatio: 14.0, earningsGrowth: 40, futureGrowth: 9, socialSentiment: 7 },
    { ticker: 'GAIL.NS',       companyName: 'GAIL India',               currentPrice: 205,  high52Week: 246,  low52Week: 155,  marketCapCr: 134000, peRatio: 12.5, earningsGrowth: 15, futureGrowth: 7, socialSentiment: 6 },
    { ticker: 'SAIL.NS',       companyName: 'Steel Authority of India', currentPrice: 130,  high52Week: 175,  low52Week: 100,  marketCapCr: 53000,  peRatio: 7.0,  earningsGrowth: 10, futureGrowth: 6, socialSentiment: 6 },
  ],
  smallCap: [
    { ticker: 'JUSTDIAL.NS',   companyName: 'Just Dial',               currentPrice: 900,  high52Week: 1215, low52Week: 700,  marketCapCr: 7700,  peRatio: 20.0, earningsGrowth: 25, futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'RADICO.NS',     companyName: 'Radico Khaitan',          currentPrice: 1850, high52Week: 2327, low52Week: 1400, marketCapCr: 24600, peRatio: 50.0, earningsGrowth: 18, futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'AUBANK.NS',     companyName: 'AU Small Finance Bank',   currentPrice: 620,  high52Week: 813,  low52Week: 490,  marketCapCr: 44000, peRatio: 22.0, earningsGrowth: 30, futureGrowth: 9, socialSentiment: 8 },
    { ticker: 'KANSAINER.NS',  companyName: 'Kansai Nerolac Paints',  currentPrice: 310,  high52Week: 395,  low52Week: 250,  marketCapCr: 16700, peRatio: 30.0, earningsGrowth: 12, futureGrowth: 7, socialSentiment: 6 },
    { ticker: 'CENTURYTEX.NS', companyName: 'Century Textiles',        currentPrice: 2100, high52Week: 2640, low52Week: 1450, marketCapCr: 23700, peRatio: 28.0, earningsGrowth: 22, futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'JKCEMENT.NS',   companyName: 'JK Cement',               currentPrice: 4200, high52Week: 5055, low52Week: 3200, marketCapCr: 32500, peRatio: 36.0, earningsGrowth: 15, futureGrowth: 7, socialSentiment: 6 },
    { ticker: 'EDELWEISS.NS',  companyName: 'Edelweiss Financial',     currentPrice: 90,   high52Week: 122,  low52Week: 68,   marketCapCr: 8700,  peRatio: 12.0, earningsGrowth: 20, futureGrowth: 7, socialSentiment: 6 },
    { ticker: 'NATCOPHARM.NS', companyName: 'Natco Pharma',            currentPrice: 1450, high52Week: 1760, low52Week: 1100, marketCapCr: 26300, peRatio: 18.0, earningsGrowth: 20, futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'PIDILITIND.NS', companyName: 'Pidilite Industries',     currentPrice: 2900, high52Week: 3440, low52Week: 2200, marketCapCr: 147000,peRatio: 75.0, earningsGrowth: 14, futureGrowth: 8, socialSentiment: 8 },
    { ticker: 'DIVISLAB.NS',   companyName: "Divi's Laboratories",     currentPrice: 5300, high52Week: 6235, low52Week: 3350, marketCapCr: 140000,peRatio: 67.0, earningsGrowth: 30, futureGrowth: 9, socialSentiment: 8 },
  ],
  tech: [
    { ticker: 'TCS.NS',        companyName: 'Tata Consultancy Services',currentPrice: 3780, high52Week: 4592, low52Week: 3311, marketCapCr: 1370000,peRatio: 28.2, earningsGrowth: 10, futureGrowth: 8, socialSentiment: 8 },
    { ticker: 'INFY.NS',       companyName: 'Infosys',                  currentPrice: 1620, high52Week: 1904, low52Week: 1358, marketCapCr: 675000, peRatio: 24.1, earningsGrowth: 9,  futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'WIPRO.NS',      companyName: 'Wipro',                    currentPrice: 470,  high52Week: 577,  low52Week: 400,  marketCapCr: 244000, peRatio: 21.5, earningsGrowth: 7,  futureGrowth: 7, socialSentiment: 6 },
    { ticker: 'HCLTECH.NS',    companyName: 'HCL Technologies',         currentPrice: 1580, high52Week: 1950, low52Week: 1235, marketCapCr: 428000, peRatio: 22.0, earningsGrowth: 12, futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'LTTS.NS',       companyName: 'L&T Technology Services',  currentPrice: 4850, high52Week: 6000, low52Week: 3900, marketCapCr: 51000,  peRatio: 30.0, earningsGrowth: 18, futureGrowth: 9, socialSentiment: 8 },
    { ticker: 'TECHM.NS',      companyName: 'Tech Mahindra',            currentPrice: 1490, high52Week: 1807, low52Week: 1060, marketCapCr: 145000, peRatio: 28.0, earningsGrowth: 20, futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'PERSISTENT.NS', companyName: 'Persistent Systems',       currentPrice: 5200, high52Week: 6789, low52Week: 3600, marketCapCr: 80000,  peRatio: 55.0, earningsGrowth: 35, futureGrowth: 9, socialSentiment: 9 },
    { ticker: 'MPHASIS.NS',    companyName: 'Mphasis',                  currentPrice: 2650, high52Week: 3098, low52Week: 1963, marketCapCr: 49500,  peRatio: 32.0, earningsGrowth: 15, futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'COFORGE.NS',    companyName: 'Coforge',                  currentPrice: 7200, high52Week: 9575, low52Week: 4350, marketCapCr: 43500,  peRatio: 48.0, earningsGrowth: 28, futureGrowth: 9, socialSentiment: 8 },
    { ticker: 'KPITTECH.NS',   companyName: 'KPIT Technologies',        currentPrice: 1350, high52Week: 1929, low52Week: 1120, marketCapCr: 36500,  peRatio: 55.0, earningsGrowth: 40, futureGrowth: 9, socialSentiment: 9 },
    { ticker: 'TATAELXSI.NS',  companyName: 'Tata Elxsi',               currentPrice: 6800, high52Week: 9120, low52Week: 5300, marketCapCr: 42200,  peRatio: 45.0, earningsGrowth: 22, futureGrowth: 9, socialSentiment: 8 },
  ],
  finance: [
    { ticker: 'HDFCBANK.NS',   companyName: 'HDFC Bank',               currentPrice: 1720, high52Week: 1880, low52Week: 1430, marketCapCr: 1310000,peRatio: 19.8, earningsGrowth: 18, futureGrowth: 9, socialSentiment: 8 },
    { ticker: 'ICICIBANK.NS',  companyName: 'ICICI Bank',               currentPrice: 1380, high52Week: 1427, low52Week: 1014, marketCapCr: 970000, peRatio: 18.5, earningsGrowth: 22, futureGrowth: 9, socialSentiment: 9 },
    { ticker: 'KOTAKBANK.NS',  companyName: 'Kotak Mahindra Bank',      currentPrice: 1950, high52Week: 2115, low52Week: 1544, marketCapCr: 388000, peRatio: 20.5, earningsGrowth: 15, futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'SBIN.NS',       companyName: 'State Bank of India',      currentPrice: 790,  high52Week: 912,  low52Week: 600,  marketCapCr: 704000, peRatio: 10.2, earningsGrowth: 25, futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'AXISBANK.NS',   companyName: 'Axis Bank',                currentPrice: 1120, high52Week: 1340, low52Week: 955,  marketCapCr: 346000, peRatio: 15.0, earningsGrowth: 20, futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'BAJAJFINSV.NS', companyName: 'Bajaj Finserv',            currentPrice: 1890, high52Week: 2030, low52Week: 1419, marketCapCr: 301000, peRatio: 22.1, earningsGrowth: 20, futureGrowth: 9, socialSentiment: 8 },
    { ticker: 'CHOLAFIN.NS',   companyName: 'Cholamandalam Finance',    currentPrice: 1350, high52Week: 1652, low52Week: 950,  marketCapCr: 111000, peRatio: 25.0, earningsGrowth: 30, futureGrowth: 9, socialSentiment: 8 },
    { ticker: 'MUTHOOTFIN.NS', companyName: 'Muthoot Finance',          currentPrice: 1850, high52Week: 2228, low52Week: 1350, marketCapCr: 74000,  peRatio: 14.5, earningsGrowth: 20, futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'IRFC.NS',       companyName: 'Indian Railway Finance',   currentPrice: 175,  high52Week: 229,  low52Week: 130,  marketCapCr: 229000, peRatio: 25.0, earningsGrowth: 18, futureGrowth: 9, socialSentiment: 8 },
    { ticker: 'PFC.NS',        companyName: 'Power Finance Corporation',currentPrice: 460,  high52Week: 580,  low52Week: 348,  marketCapCr: 152000, peRatio: 8.0,  earningsGrowth: 20, futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'RECLTD.NS',     companyName: 'REC Limited',              currentPrice: 480,  high52Week: 654,  low52Week: 360,  marketCapCr: 126000, peRatio: 9.0,  earningsGrowth: 22, futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'IDFCFIRSTB.NS', companyName: 'IDFC First Bank',          currentPrice: 75,   high52Week: 92,   low52Week: 55,   marketCapCr: 55000,  peRatio: 14.0, earningsGrowth: 40, futureGrowth: 9, socialSentiment: 7 },
  ],
  healthcare: [
    { ticker: 'SUNPHARMA.NS',  companyName: 'Sun Pharmaceutical',      currentPrice: 1700, high52Week: 1960, low52Week: 1290, marketCapCr: 407000, peRatio: 36.0, earningsGrowth: 18, futureGrowth: 9, socialSentiment: 8 },
    { ticker: 'APOLLOHOSP.NS', companyName: 'Apollo Hospitals',        currentPrice: 6800, high52Week: 7545, low52Week: 5200, marketCapCr: 97000,  peRatio: 68.0, earningsGrowth: 35, futureGrowth: 9, socialSentiment: 9 },
    { ticker: 'DIVISLAB.NS',   companyName: "Divi's Laboratories",     currentPrice: 5300, high52Week: 6235, low52Week: 3350, marketCapCr: 140000, peRatio: 67.0, earningsGrowth: 30, futureGrowth: 9, socialSentiment: 8 },
    { ticker: 'CIPLA.NS',      companyName: 'Cipla',                   currentPrice: 1480, high52Week: 1694, low52Week: 1160, marketCapCr: 119000, peRatio: 26.0, earningsGrowth: 20, futureGrowth: 8, socialSentiment: 8 },
    { ticker: 'DRREDDY.NS',    companyName: "Dr. Reddy's Laboratories",currentPrice: 1250, high52Week: 1424, low52Week: 1050, marketCapCr: 104000, peRatio: 18.0, earningsGrowth: 22, futureGrowth: 8, socialSentiment: 8 },
    { ticker: 'LUPIN.NS',      companyName: 'Lupin',                   currentPrice: 2150, high52Week: 2445, low52Week: 1440, marketCapCr: 97000,  peRatio: 30.0, earningsGrowth: 25, futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'TORNTPHARM.NS', companyName: 'Torrent Pharmaceuticals', currentPrice: 3200, high52Week: 3669, low52Week: 2350, marketCapCr: 54200,  peRatio: 38.0, earningsGrowth: 20, futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'AUROPHARMA.NS', companyName: 'Aurobindo Pharma',        currentPrice: 1200, high52Week: 1371, low52Week: 900,  marketCapCr: 70000,  peRatio: 18.0, earningsGrowth: 15, futureGrowth: 7, socialSentiment: 6 },
    { ticker: 'ALKEM.NS',      companyName: 'Alkem Laboratories',      currentPrice: 5200, high52Week: 6052, low52Week: 4200, marketCapCr: 62100,  peRatio: 24.0, earningsGrowth: 18, futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'BIOCON.NS',     companyName: 'Biocon',                  currentPrice: 340,  high52Week: 395,  low52Week: 235,  marketCapCr: 40800,  peRatio: 40.0, earningsGrowth: 30, futureGrowth: 9, socialSentiment: 8 },
  ],
  renewable: [
    { ticker: 'ADANIGREEN.NS', companyName: 'Adani Green Energy',      currentPrice: 1700, high52Week: 2175, low52Week: 900,  marketCapCr: 268000, peRatio: 180.0,earningsGrowth: 60, futureGrowth: 10,socialSentiment: 8 },
    { ticker: 'TATAPOWER.NS',  companyName: 'Tata Power',              currentPrice: 390,  high52Week: 473,  low52Week: 290,  marketCapCr: 124000, peRatio: 30.0, earningsGrowth: 35, futureGrowth: 9, socialSentiment: 9 },
    { ticker: 'NTPC.NS',       companyName: 'NTPC',                    currentPrice: 370,  high52Week: 448,  low52Week: 285,  marketCapCr: 359000, peRatio: 18.0, earningsGrowth: 15, futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'SUZLON.NS',     companyName: 'Suzlon Energy',           currentPrice: 58,   high52Week: 86,   low52Week: 38,   marketCapCr: 79000,  peRatio: 35.0, earningsGrowth: 80, futureGrowth: 10,socialSentiment: 9 },
    { ticker: 'INOXWIND.NS',   companyName: 'Inox Wind',               currentPrice: 185,  high52Week: 248,  low52Week: 110,  marketCapCr: 24500,  peRatio: 45.0, earningsGrowth: 100,futureGrowth: 10,socialSentiment: 8 },
    { ticker: 'WAAREEENER.NS', companyName: 'Waaree Energies',         currentPrice: 2450, high52Week: 3743, low52Week: 1400, marketCapCr: 69600,  peRatio: 40.0, earningsGrowth: 85, futureGrowth: 10,socialSentiment: 9 },
    { ticker: 'SJVN.NS',       companyName: 'SJVN Limited',            currentPrice: 115,  high52Week: 170,  low52Week: 78,   marketCapCr: 45000,  peRatio: 28.0, earningsGrowth: 20, futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'NHPC.NS',       companyName: 'NHPC Limited',            currentPrice: 92,   high52Week: 118,  low52Week: 64,   marketCapCr: 92000,  peRatio: 20.0, earningsGrowth: 12, futureGrowth: 7, socialSentiment: 6 },
    { ticker: 'BOROSIL.NS',    companyName: 'Borosil Renewables',      currentPrice: 380,  high52Week: 520,  low52Week: 260,  marketCapCr: 7800,   peRatio: 50.0, earningsGrowth: 40, futureGrowth: 9, socialSentiment: 8 },
    { ticker: 'WEBSOL.NS',     companyName: 'Websol Energy System',    currentPrice: 1050, high52Week: 1614, low52Week: 580,  marketCapCr: 3500,   peRatio: 55.0, earningsGrowth: 70, futureGrowth: 9, socialSentiment: 8 },
  ],
  consumer: [
    { ticker: 'HINDUNILVR.NS', companyName: 'Hindustan Unilever',      currentPrice: 2350, high52Week: 2810, low52Week: 2200, marketCapCr: 551000, peRatio: 55.0, earningsGrowth: 7,  futureGrowth: 6, socialSentiment: 7 },
    { ticker: 'ITC.NS',        companyName: 'ITC Limited',             currentPrice: 430,  high52Week: 539,  low52Week: 399,  marketCapCr: 537000, peRatio: 27.0, earningsGrowth: 10, futureGrowth: 7, socialSentiment: 7 },
    { ticker: 'NESTLEIND.NS',  companyName: 'Nestle India',            currentPrice: 2290, high52Week: 2778, low52Week: 2100, marketCapCr: 220000, peRatio: 70.0, earningsGrowth: 8,  futureGrowth: 6, socialSentiment: 7 },
    { ticker: 'BRITANNIA.NS',  companyName: 'Britannia Industries',    currentPrice: 5200, high52Week: 6185, low52Week: 4600, marketCapCr: 125000, peRatio: 52.0, earningsGrowth: 12, futureGrowth: 7, socialSentiment: 7 },
    { ticker: 'DABUR.NS',      companyName: 'Dabur India',             currentPrice: 530,  high52Week: 660,  low52Week: 480,  marketCapCr: 94000,  peRatio: 48.0, earningsGrowth: 9,  futureGrowth: 7, socialSentiment: 7 },
    { ticker: 'MARICO.NS',     companyName: 'Marico',                  currentPrice: 630,  high52Week: 725,  low52Week: 480,  marketCapCr: 81500,  peRatio: 50.0, earningsGrowth: 10, futureGrowth: 7, socialSentiment: 7 },
    { ticker: 'COLPAL.NS',     companyName: 'Colgate-Palmolive India', currentPrice: 2800, high52Week: 3890, low52Week: 2300, marketCapCr: 76000,  peRatio: 48.0, earningsGrowth: 12, futureGrowth: 7, socialSentiment: 7 },
    { ticker: 'GODREJCP.NS',   companyName: 'Godrej Consumer Products',currentPrice: 1280, high52Week: 1591, low52Week: 1022, marketCapCr: 131000, peRatio: 55.0, earningsGrowth: 14, futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'TATACONSUM.NS', companyName: 'Tata Consumer Products',  currentPrice: 1050, high52Week: 1261, low52Week: 855,  marketCapCr: 97000,  peRatio: 68.0, earningsGrowth: 18, futureGrowth: 8, socialSentiment: 8 },
    { ticker: 'EMAMILTD.NS',   companyName: 'Emami',                   currentPrice: 610,  high52Week: 800,  low52Week: 490,  marketCapCr: 27000,  peRatio: 32.0, earningsGrowth: 12, futureGrowth: 7, socialSentiment: 6 },
  ],
  infrastructure: [
    { ticker: 'LT.NS',         companyName: 'Larsen & Toubro',         currentPrice: 3500, high52Week: 3963, low52Week: 2775, marketCapCr: 480000, peRatio: 28.0, earningsGrowth: 18, futureGrowth: 9, socialSentiment: 9 },
    { ticker: 'ADANIPORTS.NS', companyName: 'Adani Ports & SEZ',       currentPrice: 1290, high52Week: 1608, low52Week: 980,  marketCapCr: 278000, peRatio: 22.0, earningsGrowth: 22, futureGrowth: 9, socialSentiment: 7 },
    { ticker: 'RVNL.NS',       companyName: 'Rail Vikas Nigam',        currentPrice: 395,  high52Week: 647,  low52Week: 280,  marketCapCr: 82000,  peRatio: 40.0, earningsGrowth: 25, futureGrowth: 9, socialSentiment: 8 },
    { ticker: 'IRFC.NS',       companyName: 'Indian Railway Finance',  currentPrice: 175,  high52Week: 229,  low52Week: 130,  marketCapCr: 229000, peRatio: 25.0, earningsGrowth: 18, futureGrowth: 9, socialSentiment: 8 },
    { ticker: 'NBCC.NS',       companyName: 'NBCC (India)',            currentPrice: 95,   high52Week: 148,  low52Week: 68,   marketCapCr: 17000,  peRatio: 32.0, earningsGrowth: 20, futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'ENGINERSIN.NS', companyName: 'Engineers India',         currentPrice: 215,  high52Week: 280,  low52Week: 155,  marketCapCr: 12000,  peRatio: 22.0, earningsGrowth: 18, futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'HGINFRA.NS',    companyName: 'H.G. Infra Engineering',  currentPrice: 1550, high52Week: 1895, low52Week: 1100, marketCapCr: 11500,  peRatio: 15.0, earningsGrowth: 25, futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'KNRCON.NS',     companyName: 'KNR Constructions',       currentPrice: 320,  high52Week: 415,  low52Week: 235,  marketCapCr: 9000,   peRatio: 12.0, earningsGrowth: 20, futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'IRB.NS',        companyName: 'IRB Infrastructure',      currentPrice: 65,   high52Week: 80,   low52Week: 43,   marketCapCr: 39000,  peRatio: 18.0, earningsGrowth: 22, futureGrowth: 8, socialSentiment: 7 },
    { ticker: 'GMRINFRA.NS',   companyName: 'GMR Airports Infra',      currentPrice: 92,   high52Week: 120,  low52Week: 64,   marketCapCr: 55000,  peRatio: 60.0, earningsGrowth: 35, futureGrowth: 9, socialSentiment: 8 },
    { ticker: 'ASHOKA.NS',     companyName: 'Ashoka Buildcon',         currentPrice: 230,  high52Week: 305,  low52Week: 170,  marketCapCr: 6400,   peRatio: 14.0, earningsGrowth: 18, futureGrowth: 7, socialSentiment: 6 },
  ]
};

// ─── Quality scoring (0-100) ──────────────────────────────────────────────────
const scoreStock = (stock) => {
  let score = 0;
  // 1. Market Trend — 52W position (0-20 pts)
  const range = stock.high52Week - stock.low52Week;
  if (range > 0) {
    const pos = (stock.currentPrice - stock.low52Week) / range;
    if (pos >= 0.3 && pos <= 0.7) score += 20;
    else if (pos < 0.3) score += pos * 40;
    else score += (1 - pos) * 40;
  } else { score += 10; }
  // 2. Valuation — PE (0-25 pts)
  if (stock.peRatio && stock.peRatio > 0) {
    if (stock.peRatio < 15) score += 25;
    else if (stock.peRatio < 25) score += 20;
    else if (stock.peRatio < 40) score += 14;
    else if (stock.peRatio < 60) score += 8;
    else score += 3;
  } else { score += 10; }
  // 3. Earnings Growth (0-20 pts)
  const eg = stock.earningsGrowth || 0;
  if (eg >= 50) score += 20;
  else if (eg >= 25) score += 16;
  else if (eg >= 15) score += 12;
  else if (eg >= 8) score += 8;
  else score += 4;
  // 4. Future Growth (0-20 pts)
  score += Math.min((stock.futureGrowth || 5) * 2, 20);
  // 5. Social Sentiment (0-15 pts)
  score += Math.min((stock.socialSentiment || 5) * 1.5, 15);
  return Math.round(score * 100) / 100;
};

const buildReason = (stock, rank) => {
  const pe = stock.peRatio ? `PE ${stock.peRatio.toFixed(1)}` : 'PE N/A';
  return `Rank #${rank} | ${pe} | EPS growth ${stock.earningsGrowth}% | Future growth ${stock.futureGrowth}/10 | Sentiment ${stock.socialSentiment}/10`;
};

const getCategoryFromName = (name) => {
  if (name.includes('Midcap'))     return 'midCap';
  if (name.includes('Smallcap'))   return 'smallCap';
  if (name.includes('Tech'))       return 'tech';
  if (name.includes('Finance'))    return 'finance';
  if (name.includes('Healthcare')) return 'healthcare';
  if (name.includes('Renewable'))  return 'renewable';
  if (name.includes('Consumer'))   return 'consumer';
  if (name.includes('Infra'))      return 'infrastructure';
  return 'largeCap';
};

const selectTopStocks = (category) => {
  const universe = STOCK_UNIVERSE[category] || STOCK_UNIVERSE.largeCap;
  const scored = universe.map(s => ({ ...s, score: scoreStock(s) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 10).map((stock, idx) => ({
    ticker:       stock.ticker,
    companyName:  stock.companyName,
    symbol:       stock.ticker,
    currentPrice: stock.currentPrice,
    high52Week:   stock.high52Week,
    low52Week:    stock.low52Week,
    marketCap:    stock.marketCapCr ? stock.marketCapCr + ' Cr' : null,
    peRatio:      stock.peRatio,
    weight:       10,
    quantity:     1,
    reason:       buildReason(stock, idx + 1),
    status:       'active',
    addedDate:    new Date(),
    score:        stock.score,
  }));
};

const rebalanceBasket = async (basketId, manualTrigger = false) => {
  try {
    const basket = await Basket.findById(basketId);
    if (!basket) throw new Error('Basket not found');
    const category = getCategoryFromName(basket.name);
    const newStocks = selectTopStocks(category);
    const changes = { added: [], removed: [] };
    for (const old of basket.stocks) {
      if (!newStocks.find(s => s.ticker === old.ticker))
        changes.removed.push({ ticker: old.ticker, companyName: old.companyName });
    }
    for (const ns of newStocks) {
      if (!basket.stocks.find(s => s.ticker === ns.ticker))
        changes.added.push({ ticker: ns.ticker, companyName: ns.companyName, reason: ns.reason });
    }
    basket.stocks = newStocks.map(s => ({
      ...s,
      addedDate: basket.stocks.find(b => b.ticker === s.ticker)?.addedDate || new Date(),
    }));
    basket.minimumInvestment = Math.ceil(newStocks.reduce((sum, s) => sum + s.currentPrice, 0));
    basket.lastRebalanceDate = new Date();
    basket.nextRebalanceDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await basket.save();
    try {
      await new RebalanceHistory({ basketId, changes, reason: manualTrigger ? 'Manual rebalance' : 'Auto rebalance (30-day)', manualTrigger, emailsSent: 0 }).save();
    } catch (e) { console.warn('History save failed:', e.message); }
    if (basket.subscribers?.length) {
      for (const email of basket.subscribers) {
        try { await emailService.sendRebalanceNotification(email, basket, changes); }
        catch (e) { console.warn('Email failed:', e.message); }
      }
    }
    return { success: true, basket, changes, emailsSent: basket.subscribers.length };
  } catch (err) {
    console.error('Rebalance error:', err);
    throw err;
  }
};

const getRebalanceSummary = async (basketId) => {
  const basket = await Basket.findById(basketId);
  let history = [];
  try { history = await RebalanceHistory.find({ basketId }).sort({ createdAt: -1 }).limit(10); }
  catch (e) { console.warn('History fetch failed:', e.message); }
  return { basket: { name: basket.name, lastRebalanceDate: basket.lastRebalanceDate, nextRebalanceDate: basket.nextRebalanceDate, minimumInvestment: basket.minimumInvestment }, recentChanges: history };
};

module.exports = { rebalanceBasket, selectTopStocks, getRebalanceSummary };