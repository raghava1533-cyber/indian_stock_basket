# 🚀 Easy Deployment Options

## Recommended: Deploy on Free Cloud Platforms (No Local Setup Needed)

### Option 1: Render (Easiest - 5 Minutes)

**What you need:**
- GitHub account ✅ (you already have this)
- No credit card needed

**Steps:**

1. **Deploy Backend:**
   - Go to https://render.com
   - Click "New +" → "Web Service"
   - Connect GitHub → Select `indian_stock_basket` repository
   - Settings:
     ```
     Build Command: cd backend && npm install
     Start Command: npm start
     Root Directory: backend
     Environment: Node
     ```
   - Add Environment Variables:
     ```
     MONGODB_URI=mongodb://localhost:27017/indian-stock-basket
     EMAIL_USER=your_email@gmail.com
     EMAIL_PASSWORD=your_app_password
     JWT_SECRET=your_secret_key
     FRONTEND_URL=your_frontend_url
     ```
   - Click "Create Web Service"
   - Wait 2-3 minutes → You'll get a URL like `https://your-api.onrender.com`

2. **Deploy Frontend:**
   - Go to Render again
   - Click "New +" → "Static Site"
   - Select same repository
   - Settings:
     ```
     Build Command: cd frontend && npm install && npm run build
     Publish Directory: frontend/build
     Root Directory: frontend
     ```
   - Add Environment:
     ```
     REACT_APP_API_URL=https://your-api.onrender.com/api
     ```
   - Click "Create Static Site"
   - Wait 2-3 minutes → You'll get your frontend URL

✅ **Done! Your site is live!**

---

### Option 2: Vercel (Frontend Only - 3 Minutes)

Great for just the frontend. Backend goes to Render.

1. Go to https://vercel.com
2. Import GitHub repository
3. Set Build Settings:
   ```
   Build Command: cd frontend && npm run build
   Output Directory: frontend/build
   ```
4. Deploy → Done!

---

### Option 3: Railway (Alternative - 5 Minutes)

Similar to Render, all in one platform.

1. Go to https://railway.app
2. "New Project" → "Deploy from GitHub"
3. Select repository
4. Create service for backend
5. Create service for frontend
6. Link databases and environment variables

---

## If You Want to Run Locally First

### Prerequisites Installation:

**Windows:**
```bash
# 1. Install Node.js from https://nodejs.org/
# Download LTS version and run installer

# 2. Install MongoDB Community from https://www.mongodb.com/try/download/community
# Run installer and choose "Install as Windows Service"

# 3. Verify installation
node --version
npm --version
mongod --version
```

**After installation:**
```bash
# 1. Start MongoDB
mongod

# 2. Backend setup (new terminal)
cd backend
npm install
cp .env.example .env
# Edit .env with your email credentials
npm run dev

# 3. Frontend setup (new terminal)
cd frontend
npm install
npm start
# Opens http://localhost:3000
```

---

## Quick Comparison

| Platform | Setup Time | Cost | Database | Domain |
|----------|-----------|------|----------|--------|
| **Render** | 5 min | Free | Included | *.onrender.com |
| **Vercel** (Frontend) | 3 min | Free | N/A | *.vercel.app |
| **Railway** | 5 min | Free tier | Included | *.railway.app |
| **Heroku** | 5 min | $7/month | $7-50/month | *.herokuapp.com |
| **AWS** | 10 min | Free tier | Free (limited) | Custom |

---

## Step-by-Step: Deploy on Render (Recommended)

### Backend Deployment:

1. **Go to Render.com**
2. **Sign up** with GitHub
3. **Click "New +"** → Select **"Web Service"**
4. **Connect GitHub:**
   - Authorize Render
   - Select `indian_stock_basket` repo
   - Select `main` branch

5. **Configure:**
   ```
   Name: stock-basket-api
   Environment: Node
   Build Command: cd backend && npm install
   Start Command: npm start
   Root Directory: backend
   ```

6. **Environment Variables:**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/indian-stock-basket
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_specific_password
   JWT_SECRET=your_secret_key_12345
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend.vercel.app
   ```

7. **Click "Create Web Service"**
8. **Wait 2-3 minutes** for build
9. **Copy the API URL** (e.g., `https://stock-basket-api.onrender.com`)

### Frontend Deployment (on Vercel):

1. **Go to Vercel.com**
2. **Sign up** with GitHub
3. **Click "Add New..."** → **"Project"**
4. **Select `indian_stock_basket` repo**
5. **Configure:**
   ```
   Framework Preset: Create React App
   Build Command: cd frontend && npm run build
   Output Directory: frontend/build
   Root Directory: frontend
   ```

6. **Environment Variables:**
   ```
   REACT_APP_API_URL=https://stock-basket-api.onrender.com/api
   ```

7. **Click "Deploy"**
8. **Wait 3-5 minutes**
9. **Copy Frontend URL** (e.g., `https://stock-basket.vercel.app`)

### Update Render Backend:

1. Go back to Render dashboard
2. Edit `FRONTEND_URL` environment variable:
   ```
   FRONTEND_URL=https://stock-basket.vercel.app
   ```
3. Save and redeploy

✅ **Your site is now live!**

---

## After Deployment

### Configure Database:

**Using MongoDB Atlas (Free):**

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster (free tier)
4. Get connection string
5. Add to environment variables:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/indian-stock-basket
   ```

**Initialize Database:**
- Platform will automatically run npm install
- To run init script, add to "Render" settings:
  ```
  Build Command: cd backend && npm install && npm run init-db
  ```

---

## Test Your Deployment

```bash
# Test API
curl https://your-api.onrender.com/health

# Should return:
# {"status":"Server is running","timestamp":"..."}

# Test Frontend
Open https://your-frontend.vercel.app in browser
```

---

## Monitor Your Deployment

**On Render:**
- Logs: Dashboard → Select service → "Logs"
- Metrics: View CPU, memory usage

**On Vercel:**
- Logs: Dashboard → Select project → "Logs"
- Analytics: View traffic and performance

---

## Troubleshooting

### Build fails on Render
- Check build logs
- Verify environment variables
- Check Node.js version compatibility

### API not connecting
- Verify `FRONTEND_URL` is correct
- Check CORS settings
- Verify MongoDB connection string

### Database connection issues
- Test MongoDB Atlas credentials
- Verify IP whitelist on Atlas
- Check connection string format

### Emails not sending
- Verify Gmail App Password (not regular password)
- Enable 2FA on Gmail
- Check email credentials in env vars

---

## Costs

✅ **Completely FREE for:**
- Render (free tier)
- Vercel (free tier)
- MongoDB Atlas (512MB free)
- Total: $0/month to start

**Optional upgrades (when traffic grows):**
- Render: $7/month per service
- MongoDB Atlas: $57/month for 1GB

---

## Next Steps

**Choose your deployment:**
1. ✅ **Recommended**: Render (backend) + Vercel (frontend)
2. Alternative: Railway (all in one)
3. Advanced: AWS/GCP/Azure

**Then:**
1. Follow the setup steps above
2. Get your live URLs
3. Test the deployment
4. Share your app!

---

**Ready to go live? Pick your platform above and start deploying! 🚀**
