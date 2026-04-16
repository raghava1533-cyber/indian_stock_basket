require('dotenv').config();
const mongoose = require('mongoose');
const Basket = require('./models/Basket');
const StockData = require('./models/StockData');
const connectDB = require('./config/database');

// Sample Indian stocks data
const SAMPLE_STOCKS = [
  // Largecap
  { ticker: 'RELIANCE.NS', name: 'Reliance Industries', sector: 'Energy', marketCap: '15.5T' },
  { ticker: 'TCS.NS', name: 'Tata Consultancy Services', sector: 'IT', marketCap: '14.2T' },
  { ticker: 'INFOSY.NS', name: 'Infosys Limited', sector: 'IT', marketCap: '7.8T' },
  { ticker: 'HINDUNILVR.NS', name: 'Hindustan Unilever', sector: 'FMCG', marketCap: '5.2T' },
  { ticker: 'ICICIBANK.NS', name: 'ICICI Bank', sector: 'Banking', marketCap: '5.8T' },
  { ticker: 'HDFC.NS', name: 'HDFC Bank', sector: 'Banking', marketCap: '9.1T' },
  { ticker: 'WIPRO.NS', name: 'Wipro Limited', sector: 'IT', marketCap: '3.2T' },
  { ticker: 'ITC.NS', name: 'ITC Limited', sector: 'Tobacco', marketCap: '3.5T' },
  { ticker: 'MARUTI.NS', name: 'Maruti Suzuki', sector: 'Automobiles', marketCap: '2.1T' },
  { ticker: 'SBIN.NS', name: 'State Bank of India', sector: 'Banking', marketCap: '4.3T' },
  // Tech
  { ticker: 'HCLTECH.NS', name: 'HCL Technologies', sector: 'IT', marketCap: '3.8T' },
  { ticker: 'TECHM.NS', name: 'Tech Mahindra', sector: 'IT', marketCap: '2.8T' },
  { ticker: 'PERSISTENT.NS', name: 'Persistent Systems', sector: 'IT', marketCap: '0.8T' },
  // Finance
  { ticker: 'AXISBANK.NS', name: 'Axis Bank', sector: 'Banking', marketCap: '3.5T' },
  { ticker: 'KOTAKBANK.NS', name: 'Kotak Bank', sector: 'Banking', marketCap: '3.9T' },
  { ticker: 'BAJAJFINSV.NS', name: 'Bajaj Finance', sector: 'Finance', marketCap: '4.2T' },
  // Healthcare
  { ticker: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical', sector: 'Pharma', marketCap: '2.1T' },
  { ticker: 'DIVISLAB.NS', name: 'Divi\'s Laboratories', sector: 'Pharma', marketCap: '1.9T' },
  { ticker: 'CIPLA.NS', name: 'Cipla Limited', sector: 'Pharma', marketCap: '1.5T' },
];

const initializeSampleData = async () => {
  try {
    await connectDB();

    // Clear existing data (optional - comment out for production)
    // await Basket.deleteMany({});
    // await StockData.deleteMany({});

    // Check if baskets already exist
    const existingBaskets = await Basket.countDocuments();
    
    if (existingBaskets === 0) {
      console.log('Creating sample baskets...');

      const baskets = [
        {
          name: 'Bluechip Giants',
          description: 'Top 10 large-cap companies with strong market presence and stable returns',
          category: 'Market Cap Based',
          theme: 'Large Cap',
          stocks: [
            {
              ticker: 'RELIANCE.NS',
              symbol: 'RELIANCE',
              quantity: 10,
              weight: 10,
              reason: 'Largest company in India by market cap. Diversified conglomerate with strong fundamentals.',
              status: 'active',
              addedDate: new Date(),
              high52Week: 3300,
              low52Week: 2200,
              marketCap: '15.5T',
              peRatio: 22.5
            },
            {
              ticker: 'TCS.NS',
              symbol: 'TCS',
              quantity: 20,
              weight: 10,
              reason: 'Leading IT company with consistent growth and strong balance sheet.',
              status: 'active',
              addedDate: new Date(),
              high52Week: 3900,
              low52Week: 2800,
              marketCap: '14.2T',
              peRatio: 24.3
            },
            {
              ticker: 'INFOSY.NS',
              symbol: 'INFOSY',
              quantity: 35,
              weight: 10,
              reason: 'Global IT leader with strong cash flow and dividend history.',
              status: 'active',
              addedDate: new Date(),
              high52Week: 1950,
              low52Week: 1400,
              marketCap: '7.8T',
              peRatio: 18.5
            },
            {
              ticker: 'HINDUNILVR.NS',
              symbol: 'HINDUNILVR',
              quantity: 15,
              weight: 10,
              reason: 'FMCG sector leader with strong brand and consumer loyalty.',
              status: 'active',
              addedDate: new Date(),
              high52Week: 2750,
              low52Week: 1900,
              marketCap: '5.2T',
              peRatio: 42.8
            },
            {
              ticker: 'HDFC.NS',
              symbol: 'HDFC',
              quantity: 25,
              weight: 10,
              reason: 'Major housing finance company with strong asset quality.',
              status: 'active',
              addedDate: new Date(),
              high52Week: 2950,
              low52Week: 2100,
              marketCap: '9.1T',
              peRatio: 20.1
            },
            {
              ticker: 'ICICIBANK.NS',
              symbol: 'ICICIBANK',
              quantity: 30,
              weight: 10,
              reason: 'Leading private bank with strong loan growth and asset quality.',
              status: 'active',
              addedDate: new Date(),
              high52Week: 1150,
              low52Week: 800,
              marketCap: '5.8T',
              peRatio: 16.2
            },
            {
              ticker: 'SBIN.NS',
              symbol: 'SBIN',
              quantity: 50,
              weight: 10,
              reason: 'Largest bank in India with extensive reach and profitability.',
              status: 'active',
              addedDate: new Date(),
              high52Week: 650,
              low52Week: 420,
              marketCap: '4.3T',
              peRatio: 13.5
            },
            {
              ticker: 'ITC.NS',
              symbol: 'ITC',
              quantity: 45,
              weight: 10,
              reason: 'Diversified company with strong cash generation and dividend yield.',
              status: 'active',
              addedDate: new Date(),
              high52Week: 440,
              low52Week: 300,
              marketCap: '3.5T',
              peRatio: 15.8
            },
            {
              ticker: 'WIPRO.NS',
              symbol: 'WIPRO',
              quantity: 40,
              weight: 10,
              reason: 'Global IT services company with strong client relationships.',
              status: 'active',
              addedDate: new Date(),
              high52Week: 650,
              low52Week: 400,
              marketCap: '3.2T',
              peRatio: 17.2
            },
            {
              ticker: 'MARUTI.NS',
              symbol: 'MARUTI',
              quantity: 20,
              weight: 10,
              reason: 'Leading auto company with strong market share and profitability.',
              status: 'active',
              addedDate: new Date(),
              high52Week: 11500,
              low52Week: 7800,
              marketCap: '2.1T',
              peRatio: 18.9
            }
          ],
          subscribers: [],
          totalValue: 500000,
          minimumInvestment: 50000,
          benchmark: { name: 'Nifty 50', value: 21450, performance: 3.2 },
          nextRebalanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdDate: new Date()
        },
        {
          name: 'Tech Innovators',
          description: 'Best technology and IT companies driving digital transformation in India',
          category: 'Thematic',
          theme: 'Technology',
          stocks: [
            {
              ticker: 'TCS.NS',
              symbol: 'TCS',
              quantity: 20,
              weight: 10,
              reason: 'Largest IT company with consistent innovation and growth.',
              status: 'active',
              addedDate: new Date(),
              high52Week: 3900,
              low52Week: 2800,
              marketCap: '14.2T',
              peRatio: 24.3
            },
            {
              ticker: 'INFOSY.NS',
              symbol: 'INFOSY',
              quantity: 35,
              weight: 10,
              reason: 'Global IT services with strong margins and R&D spending.',
              status: 'active',
              addedDate: new Date(),
              high52Week: 1950,
              low52Week: 1400,
              marketCap: '7.8T',
              peRatio: 18.5
            },
            {
              ticker: 'WIPRO.NS',
              symbol: 'WIPRO',
              quantity: 40,
              weight: 10,
              reason: 'Diversified IT services with digital transformation focus.',
              status: 'active',
              addedDate: new Date(),
              high52Week: 650,
              low52Week: 400,
              marketCap: '3.2T',
              peRatio: 17.2
            },
            {
              ticker: 'HCLTECH.NS',
              symbol: 'HCLTECH',
              quantity: 35,
              weight: 10,
              reason: 'IT services company with strong cloud and AI capabilities.',
              status: 'active',
              addedDate: new Date(),
              high52Week: 1380,
              low52Week: 950,
              marketCap: '3.8T',
              peRatio: 19.4
            },
            {
              ticker: 'TECHM.NS',
              symbol: 'TECHM',
              quantity: 45,
              weight: 10,
              reason: 'Tech services with strong digital and cloud portfolio.',
              status: 'active',
              addedDate: new Date(),
              high52Week: 1250,
              low52Week: 800,
              marketCap: '2.8T',
              peRatio: 16.1
            },
            {
              ticker: 'PERSISTENT.NS',
              symbol: 'PERSISTENT',
              quantity: 50,
              weight: 10,
              reason: 'High-growth software services company with strong innovation.',
              status: 'active',
              addedDate: new Date(),
              high52Week: 4250,
              low52Week: 2800,
              marketCap: '0.8T',
              peRatio: 35.2
            },
            {
              ticker: 'MINDTREE.NS',
              symbol: 'MINDTREE',
              quantity: 40,
              weight: 10,
              reason: 'Digital services company focused on emerging technologies.',
              status: 'active',
              addedDate: new Date(),
              high52Week: 4500,
              low52Week: 3200,
              marketCap: '0.7T',
              peRatio: 28.5
            },
            {
              ticker: 'LTTS.NS',
              symbol: 'LTTS',
              quantity: 30,
              weight: 10,
              reason: 'Engineering services with strong product engineering focus.',
              status: 'active',
              addedDate: new Date(),
              high52Week: 5200,
              low52Week: 3500,
              marketCap: '0.9T',
              peRatio: 45.3
            },
            {
              ticker: 'MPHASIS.NS',
              symbol: 'MPHASIS',
              quantity: 35,
              weight: 10,
              reason: 'IT services company with strong financial services expertise.',
              status: 'active',
              addedDate: new Date(),
              high52Week: 2800,
              low52Week: 1900,
              marketCap: '0.6T',
              peRatio: 22.8
            },
            {
              ticker: 'COFORGE.NS',
              symbol: 'COFORGE',
              quantity: 25,
              weight: 10,
              reason: 'Digital technology company with strong growth trajectory.',
              status: 'active',
              addedDate: new Date(),
              high52Week: 5800,
              low52Week: 3900,
              marketCap: '0.5T',
              peRatio: 38.2
            }
          ],
          subscribers: [],
          totalValue: 450000,
          minimumInvestment: 45000,
          benchmark: { name: 'Nifty IT', value: 34200, performance: 8.5 },
          nextRebalanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdDate: new Date()
        },
        {
          name: 'Finance Leaders',
          description: 'Top financial institutions with strong ROE and profitability',
          category: 'Thematic',
          theme: 'Finance',
          stocks: [],
          subscribers: [],
          totalValue: 400000,
          minimumInvestment: 40000,
          benchmark: { name: 'Nifty Bank', value: 45600, performance: 5.2 },
          nextRebalanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdDate: new Date()
        },
        {
          name: 'Midcap Momentum',
          description: 'Promising mid-cap companies with high growth potential',
          category: 'Market Cap Based',
          theme: 'Mid Cap',
          stocks: [],
          subscribers: [],
          totalValue: 350000,
          minimumInvestment: 35000,
          benchmark: { name: 'Nifty Midcap 50', value: 28750, performance: 12.3 },
          nextRebalanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdDate: new Date()
        },
        {
          name: 'Smallcap Leaders',
          description: 'Quality small-cap companies with high growth prospects',
          category: 'Market Cap Based',
          theme: 'Small Cap',
          stocks: [],
          subscribers: [],
          totalValue: 300000,
          minimumInvestment: 30000,
          benchmark: { name: 'Nifty Smallcap 50', value: 19200, performance: 18.5 },
          nextRebalanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdDate: new Date()
        },
        {
          name: 'Healthcare Growth',
          description: 'Healthcare and pharma companies with strong growth and innovation',
          category: 'Thematic',
          theme: 'Healthcare',
          stocks: [],
          subscribers: [],
          totalValue: 380000,
          minimumInvestment: 38000,
          benchmark: { name: 'Nifty Healthcare', value: 15800, performance: 6.8 },
          nextRebalanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdDate: new Date()
        }
      ];

      await Basket.insertMany(baskets);
      console.log('✅ Sample baskets created successfully');
    } else {
      console.log('ℹ️ Baskets already exist. Skipping initialization.');
    }

    // Initialize stock data
    const existingStocks = await StockData.countDocuments();
    if (existingStocks === 0) {
      console.log('Creating sample stock data...');

      const stockData = SAMPLE_STOCKS.map(stock => ({
        ...stock,
        currentPrice: Math.random() * 4000 + 500,
        high52Week: Math.random() * 5000 + 2000,
        low52Week: Math.random() * 2000 + 300,
        peRatio: Math.random() * 30 + 10,
        pbRatio: Math.random() * 5 + 0.5,
        roe: Math.random() * 25 + 10,
        debtToEquity: Math.random() * 2 + 0.2,
        lastUpdated: new Date(),
        createdDate: new Date()
      }));

      await StockData.insertMany(stockData);
      console.log('✅ Sample stock data created successfully');
    } else {
      console.log('ℹ️ Stock data already exists. Skipping initialization.');
    }

    console.log('✅ Database initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
};

// Run initialization
initializeSampleData();
