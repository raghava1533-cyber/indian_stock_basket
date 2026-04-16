# Quick Start Guide

## Option 1: Using Docker (Easiest)

### Prerequisites
- Docker and Docker Compose installed

### Steps
1. Clone the repository:
```bash
git clone <repository-url>
cd indian-stock-basket
```

2. Create `.env` file in backend directory:
```bash
cp backend/.env.example backend/.env
```

3. Update `.env` with your email configuration:
```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
```

4. Start all services:
```bash
docker-compose up -d
```

5. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

6. Stop services:
```bash
docker-compose down
```

---

## Option 2: Manual Setup (Development)

### Prerequisites
- Node.js 14+
- MongoDB installed and running
- npm or yarn

### Backend Setup

1. Navigate to backend:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/indian-stock-basket
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
```

5. Start backend:
```bash
npm run dev
```

Backend runs on `http://localhost:5000`

### Frontend Setup (New Terminal)

1. Navigate to frontend:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start frontend:
```bash
npm start
```

Frontend runs on `http://localhost:3000`

---

## First Time Setup

### 1. Initialize MongoDB
```bash
# Make sure MongoDB is running
mongod
```

### 2. Configure Email
- Get Gmail App Password (not your regular password)
- Settings → 2-Step Verification → App Passwords
- Update `.env` with EMAIL_USER and EMAIL_PASSWORD

### 3. Create Admin User (Optional)
Backend will create baskets automatically on startup.

### 4. Access Application
- Open http://localhost:3000 in your browser
- Subscribe with your email to receive notifications
- View baskets and their details
- Click "Rebalance Now" to trigger manual rebalancing

---

## Testing the System

### Test Subscription
1. Go to Dashboard
2. Enter your email
3. Click "Save Email"
4. Click "Subscribe" on any basket
5. Check your email for subscription confirmation

### Test Rebalancing
1. Open any basket detail page
2. Click "Rebalance Now"
3. Wait for confirmation
4. Check your email for rebalance notification

### View Stock Data
1. Open any basket
2. Go to "Stocks" tab
3. See live prices, 52-week high/low
4. View why each stock was selected

---

## Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000  # Windows
lsof -i :5000                  # Mac/Linux

# Kill the process or use different port
```

### Frontend won't start
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000  # Windows
lsof -i :3000                  # Mac/Linux
```

### MongoDB connection error
```bash
# Verify MongoDB is running
# Update MONGODB_URI in .env if using Atlas

# For local: mongodb://localhost:27017/indian-stock-basket
# For Atlas: mongodb+srv://user:password@cluster.mongodb.net/indian-stock-basket
```

### Email not sending
```bash
# Check Gmail credentials
# Use App Password, not regular password
# Enable "Less secure apps" if needed
# Update EMAIL_USER and EMAIL_PASSWORD in .env
```

---

## Project Structure

```
indian-stock-basket/
├── backend/
│   ├── models/         # Database schemas
│   ├── routes/         # API endpoints
│   ├── services/       # Business logic
│   ├── config/         # Configuration
│   ├── server.js       # Main server
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.js
│   │   └── App.css
│   └── package.json
├── README.md
├── docker-compose.yml
└── .gitignore
```

---

## Features Available

- ✅ View 6 different stock baskets
- ✅ Subscribe to email notifications
- ✅ See live stock prices and 52-week data
- ✅ Manual rebalancing with "Rebalance Now" button
- ✅ Automatic rebalancing every 30 days
- ✅ Detailed stock information with selection rationale
- ✅ Benchmark comparison (vs Nifty 50)
- ✅ Rebalance history tracking
- ✅ Added/Removed/Partial stock tracking
- ✅ Email notifications on rebalance

---

## Next Steps

1. **Customize Baskets**: Edit basket definitions in `backend/models/Basket.js`
2. **Add Broker Integration**: Implement broker APIs for auto-trading
3. **Advanced Analytics**: Add charts and performance tracking
4. **Mobile App**: Create React Native version
5. **Machine Learning**: Improve stock selection with ML models

---

## Support

For issues or questions:
1. Check the README.md
2. Review .env configuration
3. Check backend logs
4. Verify MongoDB is running
5. Check email configuration

---

**Ready to start?** Run the Quick Start commands above!
