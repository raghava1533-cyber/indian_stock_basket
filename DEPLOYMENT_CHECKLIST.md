# 📋 Deployment Checklist

## Quick 1-2-3 Deployment (Render + Vercel)

### ✅ Step 1: Backend on Render (5 minutes)

- [ ] Go to https://render.com
- [ ] Sign up with GitHub
- [ ] Click "New Web Service"
- [ ] Select `indian_stock_basket` repository
- [ ] Set Name: `stock-basket-api`
- [ ] Root Directory: `backend`
- [ ] Build Command: `cd backend && npm install`
- [ ] Start Command: `npm start`
- [ ] Add Environment Variables:
  - [ ] `MONGODB_URI=mongodb+srv://...` (from MongoDB Atlas)
  - [ ] `EMAIL_USER=your_email@gmail.com`
  - [ ] `EMAIL_PASSWORD=app_password`
  - [ ] `JWT_SECRET=your_secret_key`
  - [ ] `NODE_ENV=production`
- [ ] Deploy
- [ ] **Copy API URL** (e.g., `https://stock-basket-api.onrender.com`)

### ✅ Step 2: Frontend on Vercel (3 minutes)

- [ ] Go to https://vercel.com
- [ ] Sign up with GitHub
- [ ] Select `indian_stock_basket` repository
- [ ] Set Root Directory: `frontend`
- [ ] Build Command: `cd frontend && npm run build`
- [ ] Output Directory: `frontend/build`
- [ ] Add Environment Variable:
  - [ ] `REACT_APP_API_URL=https://stock-basket-api.onrender.com/api`
- [ ] Deploy
- [ ] **Copy Frontend URL** (e.g., `https://stock-basket.vercel.app`)

### ✅ Step 3: Setup Database (MongoDB Atlas)

- [ ] Go to https://www.mongodb.com/cloud/atlas
- [ ] Create free account
- [ ] Create free cluster
- [ ] Create database user and password
- [ ] Get connection string
- [ ] Update Render environment variable with connection string

### ✅ Step 4: Update Backend Configs

- [ ] Go to Render dashboard
- [ ] Edit `FRONTEND_URL` variable:
  ```
  FRONTEND_URL=https://stock-basket.vercel.app
  ```
- [ ] Save and redeploy

### ✅ Step 5: Test

- [ ] Open https://stock-basket.vercel.app
- [ ] Subscribe with your email
- [ ] Check basket details
- [ ] Try rebalancing
- [ ] Check your email for notification

---

## 🔑 Required Keys

### Gmail App Password
1. Go to https://myaccount.google.com/apppasswords
2. Enable 2-Factor Authentication first
3. Create App Password for "Mail"
4. Copy the 16-character password

### MongoDB Atlas
1. Create free cluster at https://www.mongodb.com/cloud/atlas
2. Create database user
3. Get connection string: `mongodb+srv://user:password@cluster.mongodb.net/db`

### JWT Secret
- Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Or use: `your_super_secret_key_change_in_production`

---

## 📊 Status Tracking

| Component | Platform | Status | URL |
|-----------|----------|--------|-----|
| Backend API | Render | [ ] | `https://stock-basket-api.onrender.com` |
| Frontend | Vercel | [ ] | `https://stock-basket.vercel.app` |
| Database | MongoDB Atlas | [ ] | `mongodb+srv://...` |
| Email | Gmail | [ ] | Configured |

---

## 🔍 Verification Tests

After deployment, verify:

```bash
# Test 1: API Health
curl https://stock-basket-api.onrender.com/health
# Should return: {"status":"Server is running",...}

# Test 2: Get Baskets
curl https://stock-basket-api.onrender.com/api/baskets
# Should return array of baskets

# Test 3: Frontend loads
Open https://stock-basket.vercel.app
# Should see dashboard with 6 baskets

# Test 4: Subscribe
Enter email and click Subscribe
# Should get success message

# Test 5: Email
Check your email for subscription confirmation
# Should receive notification
```

---

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| Build fails | Check logs, verify build commands |
| API connection error | Verify FRONTEND_URL and REACT_APP_API_URL match |
| Database won't connect | Check MongoDB Atlas IP whitelist and connection string |
| Emails not sending | Verify Gmail App Password, not regular password |
| Frontend blank | Check browser console for errors |

---

## 📞 Support Links

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas: https://docs.mongodb.com/atlas/
- GitHub: https://github.com/raghava1533-cyber/indian_stock_basket

---

## ✨ You're Done!

Once all steps are complete, your application will be:
- ✅ Live and accessible
- ✅ Auto-scaling
- ✅ Connected to database
- ✅ Sending emails
- ✅ Production-ready

Share your URL: `https://stock-basket.vercel.app`

---

**Estimated total time: 15-20 minutes**

**Cost: $0 (completely free)**

**Let's go! 🚀**
