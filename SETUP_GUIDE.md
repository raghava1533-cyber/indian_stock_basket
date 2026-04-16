# Complete Setup Guide

## System Requirements

- **Node.js**: v14 or higher
- **MongoDB**: v4.4 or higher (local or Atlas)
- **npm** or **yarn**
- **Git**: For cloning the repository
- **4GB RAM**: Minimum for running all services

## Platform-Specific Prerequisites

### Windows
1. Download and install Node.js from https://nodejs.org/
2. Download and install MongoDB from https://www.mongodb.com/try/download/community
3. During MongoDB installation, choose "Install as Windows Service"

### macOS
```bash
# Using Homebrew
brew install node
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community
```

### Linux (Ubuntu/Debian)
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

## Step-by-Step Installation

### Step 1: Clone the Repository

```bash
cd Downloads/stocks
git clone <repository-url>
cd indian-stock-basket
```

Or if already cloned:
```bash
cd indian-stock-basket
git pull origin main
```

### Step 2: Backend Setup

#### 2a. Install Backend Dependencies
```bash
cd backend
npm install
```

#### 2b. Create Environment File
```bash
# Copy the example .env file
cp .env.example .env
```

#### 2c. Configure Environment Variables
Open `backend/.env` and update:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/indian-stock-basket
DB_NAME=indian-stock-basket

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_secret_key_change_this_in_production_12345
JWT_EXPIRE=7d

# Email Configuration (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

**Important: Gmail Setup for Email Notifications**

1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Create App Password:
   - Select "Mail" as app
   - Select "Windows/Mac/Linux" as device
   - Copy the generated 16-character password
4. Use this password as `EMAIL_PASSWORD` in `.env`

#### 2d. Initialize Database
```bash
# Make sure MongoDB is running first
npm run init-db
```

This will:
- Create initial basket collections
- Load sample stock data
- Set up indexes

#### 2e. Start Backend Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

You should see:
```
MongoDB Connected: localhost
Email service configured successfully
Server running on port 5000
Rebalance scheduler initialized (9:30 AM daily check)
```

### Step 3: Frontend Setup (New Terminal)

#### 3a. Navigate to Frontend Directory
```bash
# From project root
cd frontend
```

#### 3b. Install Frontend Dependencies
```bash
npm install
```

#### 3c. Start Frontend Development Server
```bash
npm start
```

The frontend will automatically open at http://localhost:3000

### Step 4: Verify Installation

1. **Backend Health Check**
   ```bash
   curl http://localhost:5000/health
   ```
   Should return: `{"status":"Server is running","timestamp":"..."}`

2. **Frontend Access**
   - Open http://localhost:3000 in your browser
   - You should see the dashboard with 6 baskets

3. **Database Check**
   - Backend console should show "MongoDB Connected"

4. **Email Verification**
   - Backend console should show "Email service configured successfully"

## First-Time Configuration

### 1. Subscribe to Notifications

1. Go to http://localhost:3000
2. Scroll to the top
3. Enter your email address
4. Click "Save Email"
5. Subscribe to any basket by clicking "Subscribe"
6. You should receive a confirmation email

### 2. Test Manual Rebalancing

1. Click "View Details" on any basket
2. Click "Rebalance Now" button
3. Wait for confirmation message
4. Check your email for rebalance notification

### 3. Monitor Stock Data

1. Open any basket detail
2. Go to "Stocks" tab
3. View live prices and 52-week data

## Troubleshooting

### MongoDB Not Running

**Windows:**
```bash
# Check if MongoDB service is running
Get-Service MongoDB

# Start MongoDB if stopped
Start-Service MongoDB
```

**macOS/Linux:**
```bash
# Check status
brew services list  # macOS
sudo systemctl status mongod  # Linux

# Start if stopped
brew services start mongodb-community  # macOS
sudo systemctl start mongod  # Linux
```

### Port Already in Use

```bash
# Find what's using port 5000
netstat -ano | findstr :5000  # Windows
lsof -i :5000  # macOS/Linux

# Kill the process (get PID from above)
taskkill /PID <PID> /F  # Windows
kill -9 <PID>  # macOS/Linux

# Or use different port in .env
PORT=5001
```

### Email Not Sending

1. Verify Gmail credentials:
   - EMAIL_USER is correct Gmail address
   - EMAIL_PASSWORD is App Password (not regular password)
   - Gmail address has 2-Factor authentication enabled

2. Check Gmail App Passwords:
   - Go to https://myaccount.google.com/apppasswords
   - Create new App Password for Mail
   - Use the generated 16-character password

3. Test email in backend logs:
   - Look for "Email service configured successfully"
   - If error, fix credentials and restart backend

### Frontend Not Loading

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Start again
npm start
```

### Stocks Not Showing

1. Verify internet connection
2. Check if backend is running (should see "Server running on port 5000")
3. Initialize data:
   ```bash
   cd backend
   npm run init-db
   ```

## Environment Variables Explained

| Variable | Purpose | Example |
|----------|---------|---------|
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/db |
| `PORT` | Backend server port | 5000 |
| `EMAIL_USER` | Gmail address for notifications | user@gmail.com |
| `EMAIL_PASSWORD` | Gmail App Password | xxxx xxxx xxxx xxxx |
| `JWT_SECRET` | Secret for authentication | your_secret_key |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |

## File Structure After Setup

```
indian-stock-basket/
├── backend/
│   ├── node_modules/          # Dependencies installed
│   ├── models/
│   ├── services/
│   ├── routes/
│   ├── scripts/
│   ├── .env                   # Your configuration
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── node_modules/          # Dependencies installed
│   ├── public/
│   ├── src/
│   ├── .env.local             # If needed
│   └── package.json
└── README.md
```

## Running the Application

### Terminal 1: MongoDB (if not running as service)
```bash
mongod
```

### Terminal 2: Backend
```bash
cd backend
npm run dev
```

### Terminal 3: Frontend
```bash
cd frontend
npm start
```

## API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/baskets` | GET | Get all baskets |
| `/api/baskets/:id` | GET | Get basket details |
| `/api/baskets/:id/subscribe` | POST | Subscribe to basket |
| `/api/baskets/:id/unsubscribe` | POST | Unsubscribe from basket |
| `/api/baskets/:id/rebalance` | POST | Trigger manual rebalance |
| `/api/baskets/:id/stocks` | GET | Get basket stocks with live data |

## Next Steps

1. **Customize Baskets**: Modify basket definitions in `backend/models/Basket.js`
2. **Add More Stocks**: Update stock list in `backend/services/stockDataService.js`
3. **Connect Broker**: Implement broker API integration
4. **Deploy**: Use Docker or deploy to cloud (Heroku, Railway, Render)
5. **Database**: Migrate to MongoDB Atlas for cloud storage

## Performance Tips

- **Use MongoDB Atlas** instead of local MongoDB for production
- **Cache stock data** to reduce API calls
- **Optimize queries** with proper indexes
- **Enable compression** in production
- **Use CDN** for frontend assets

## Security Checklist

- [ ] Change JWT_SECRET to a strong random key
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS in production
- [ ] Set up CORS properly for your domain
- [ ] Use MongoDB with authentication
- [ ] Regular database backups
- [ ] Monitor error logs
- [ ] Implement rate limiting

## Getting Help

1. Check backend console for errors
2. Check browser console (F12 Developer Tools)
3. Verify .env configuration
4. Check MongoDB connection
5. Review API responses in Network tab

## Common Commands

```bash
# Backend
cd backend
npm install          # Install dependencies
npm run dev         # Run with auto-reload
npm run init-db     # Initialize database
npm start           # Run production

# Frontend
cd frontend
npm install         # Install dependencies
npm start           # Start dev server
npm run build       # Build for production
npm test            # Run tests

# Git
git status          # Check changes
git add .           # Stage changes
git commit -m "msg" # Commit changes
git push            # Push to remote
```

## System is Ready! 🎉

Your Indian Stock Basket Management System is now running with:
- ✅ Backend API on http://localhost:5000
- ✅ Frontend UI on http://localhost:3000
- ✅ MongoDB database connected
- ✅ Email notifications configured
- ✅ Automatic rebalancing scheduler active

Start by:
1. Subscribing with your email
2. Viewing basket details
3. Testing manual rebalance
4. Checking your email for notifications

Enjoy managing your quality stock baskets! 📈
