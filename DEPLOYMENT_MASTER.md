# 🚀 DEPLOYMENT MASTER GUIDE

## Your Complete Deployment Path (30 minutes total)

You have:
- ✅ GitHub repository connected to Render
- ✅ All code ready
- → **NEXT:** Get prerequisites and deploy

---

## PART 1: GET PREREQUISITES (10 minutes)

### Prerequisites Checklist

- [ ] **MongoDB Connection String** (from MongoDB Atlas)
- [ ] **Gmail App Password** (from Google)
- [ ] **Gmail Email Address** (your email)

### How to Get Them

**Option A: Quick Links**
1. MongoDB Atlas: https://www.mongodb.com/cloud/atlas
2. Gmail App Password: https://myaccount.google.com/apppasswords
3. (See detailed guides below)

**Option B: Detailed Guides**
1. **MONGODB_ATLAS_SETUP.md** - Full step-by-step (5-10 min)
2. **GMAIL_APP_PASSWORD_SETUP.md** - Full step-by-step (3-5 min)

### Save Your Credentials

Once you have them, save in a text file:

```
MONGODB_URI=mongodb+srv://stockuser:YourPasswordHere@stock-basket-cluster.xyz.mongodb.net/indian-stock-basket?retryWrites=true&w=majority

EMAIL_USER=your_email@gmail.com

EMAIL_PASSWORD=abcdefghijklmnop

JWT_SECRET=your_super_secret_key_12345

NODE_ENV=production
```

---

## PART 2: DEPLOY BACKEND ON RENDER (5 minutes)

### Go to Render.com

**URL:** https://render.com

You should already be at the configuration page for your backend.

### Fill in Configuration Form

**Basic Settings:**
```
Name: stock-basket-api
Build Command: cd backend && npm install
Start Command: npm start
Root Directory: backend
```

### Add Environment Variables

Click "Add Environment Variable" for each:

```
1. MONGODB_URI = [your MongoDB connection string]
2. EMAIL_USER = your_email@gmail.com
3. EMAIL_PASSWORD = [your Gmail app password - no spaces]
4. JWT_SECRET = your_super_secret_key_12345
5. NODE_ENV = production
6. FRONTEND_URL = [leave empty for now]
```

### Deploy

Click the blue **"Deploy"** or **"Create Web Service"** button

⏳ **Wait 2-3 minutes** for build to complete

You'll see: `=== Service is live` ✅

### Get Your API URL

At the top of the page, you'll see your API URL:
```
https://stock-basket-api.onrender.com
```

**COPY THIS URL** - you need it for the next step!

---

## PART 3: DEPLOY FRONTEND ON VERCEL (5 minutes)

### Go to Vercel.com

**URL:** https://vercel.com

Sign up with GitHub if not already done.

### Import Repository

1. Click "Add New" → "Project"
2. Select `indian_stock_basket` repository
3. Set build settings:
   ```
   Framework: Create React App
   Root Directory: frontend
   Build Command: cd frontend && npm run build
   Output Directory: frontend/build
   ```

### Add Environment Variable

Critical! Add this environment variable:

```
REACT_APP_API_URL = https://stock-basket-api.onrender.com/api
```

(Replace with your actual Render API URL from Part 2)

### Deploy

Click "Deploy"

⏳ **Wait 3-5 minutes** for build to complete

You'll get a URL like:
```
https://stock-basket.vercel.app
```

**COPY THIS URL** - you need it for the next step!

---

## PART 4: UPDATE BACKEND WITH FRONTEND URL (1 minute)

Go back to Render.com:

1. Open your `stock-basket-api` service
2. Go to "Environment"
3. Edit `FRONTEND_URL` variable
4. Set value to your Vercel URL:
   ```
   FRONTEND_URL=https://stock-basket.vercel.app
   ```
5. Click "Save"

Render will automatically redeploy.

⏳ **Wait 1-2 minutes** for redeploy

---

## PART 5: TEST YOUR DEPLOYMENT (5 minutes)

### Test Backend API

Open in browser:
```
https://stock-basket-api.onrender.com/health
```

Should see:
```json
{
  "status": "Server is running",
  "timestamp": "2026-04-16T10:30:00Z"
}
```

✅ Backend works!

### Test Frontend

Open in browser:
```
https://stock-basket.vercel.app
```

Should see:
- Dashboard with 6 baskets
- Each basket showing: name, theme, description, stats
- Subscribe button

✅ Frontend works!

### Test Email Subscription

1. Enter your email
2. Click "Subscribe"
3. Should see success message
4. Check your email for subscription confirmation

✅ Email works!

### Test Rebalancing

1. Click "View Details" on any basket
2. Click "Rebalance Now" button
3. Should see success message
4. Check your email for rebalance notification

✅ Full system works!

---

## ✅ DEPLOYMENT COMPLETE!

Your application is now:
- ✅ **Live and accessible**: https://stock-basket.vercel.app
- ✅ **Auto-scaling**: Handles traffic automatically
- ✅ **Connected to database**: All data persisted
- ✅ **Sending emails**: Subscribers notified
- ✅ **Production-ready**: Using best practices

---

## 📊 What You Have

| Component | Platform | Status | URL |
|-----------|----------|--------|-----|
| Backend API | Render | ✅ Live | https://stock-basket-api.onrender.com |
| Frontend UI | Vercel | ✅ Live | https://stock-basket.vercel.app |
| Database | MongoDB Atlas | ✅ Connected | Free tier (512MB) |
| Email | Gmail | ✅ Working | App Password authenticated |

---

## 💰 COSTS

| Service | Plan | Cost |
|---------|------|------|
| Render Backend | Free | $0/month |
| Vercel Frontend | Hobby | $0/month |
| MongoDB Atlas | M0 | $0/month |
| Gmail | Standard | $0/month |
| **TOTAL** | | **$0/month** |

✅ Completely free!

---

## 🎯 NEXT STEPS (Optional)

### Monitor Your App
- Render Dashboard: https://dashboard.render.com
- Vercel Dashboard: https://vercel.com/dashboard
- MongoDB Atlas: https://cloud.mongodb.com

### Share Your App
```
Send this URL to friends:
https://stock-basket.vercel.app
```

### Keep It Running
- Render free tier: Spins down after 15 minutes of inactivity (automatic wake on request)
- Vercel: Always running, no cold start
- MongoDB Atlas: Always running for free tier

### Upgrade Later
- More traffic? Upgrade Render to paid tier ($7/month)
- More data? Upgrade MongoDB to M10 ($57/month)
- Custom domain? Add to Vercel for free

---

## 📞 SUPPORT

**Getting help:**
1. Check troubleshooting in individual guides:
   - RENDER_WALKTHROUGH.md
   - MONGODB_ATLAS_SETUP.md
   - GMAIL_APP_PASSWORD_SETUP.md

2. Check error logs:
   - Render: Dashboard → Logs tab
   - Vercel: Dashboard → Deployments → View Details

3. Visit documentation:
   - Render: https://render.com/docs
   - Vercel: https://vercel.com/docs
   - MongoDB: https://docs.mongodb.com/atlas/

---

## 🎉 CONGRATULATIONS!

Your Indian Stock Basket application is now live and running!

**From idea to production in 30 minutes, $0 cost!**

Share your success with others! 🚀

---

## 📋 QUICK REFERENCE

**Deployment URLs:**
- Frontend: https://stock-basket.vercel.app
- Backend API: https://stock-basket-api.onrender.com
- GitHub: https://github.com/raghava1533-cyber/indian_stock_basket

**Environment Variables (save for reference):**
- MONGODB_URI: [your connection string]
- EMAIL_USER: [your email]
- EMAIL_PASSWORD: [your app password]
- JWT_SECRET: [your secret]
- NODE_ENV: production
- FRONTEND_URL: https://stock-basket.vercel.app

**Important Files:**
- DEPLOY_NOW.md - Overall deployment guide
- RENDER_WALKTHROUGH.md - Render step-by-step
- MONGODB_ATLAS_SETUP.md - MongoDB setup
- GMAIL_APP_PASSWORD_SETUP.md - Gmail setup
- DEPLOYMENT_CHECKLIST.md - Printable checklist
- RENDER_SETUP.txt - Render configuration reference

---

**Ready to go live? Follow the 5 parts above!** 🚀
