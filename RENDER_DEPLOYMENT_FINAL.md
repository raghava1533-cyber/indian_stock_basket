# ✅ RENDER DEPLOYMENT - FINAL CHECKLIST

## 🎯 You Are Here: Ready to Deploy Backend on Render

You have all the prerequisites. This checklist gets you to "Service is live"!

---

## 📋 YOUR 6 ENVIRONMENT VARIABLES

Copy these values exactly as shown:

### 1️⃣ MONGODB_URI
```
mongodb+srv://raghava1533_db_user:[YOUR_DB_PASSWORD]@stock-basket-cluster.8embexz.mongodb.net/indian-stock-basket?appName=stock-basket-cluster
```
Replace `[YOUR_DB_PASSWORD]` with your actual database password.

### 2️⃣ EMAIL_USER
```
your_email@gmail.com
```
Your Gmail email address.

### 3️⃣ EMAIL_PASSWORD
```
[your Gmail app password with NO SPACES]
```
Example: `abcdefghijklmnop` (16 characters, no spaces)

### 4️⃣ JWT_SECRET
```
your_super_secret_key_12345
```
Or any random string you prefer.

### 5️⃣ NODE_ENV
```
production
```
Exactly this word.

### 6️⃣ FRONTEND_URL
```
[LEAVE EMPTY - just don't add this variable]
```
You'll update this after Vercel deployment.

---

## 🚀 RENDER DEPLOYMENT STEPS

### Step 1: Go to Render Dashboard
**URL:** https://dashboard.render.com

Click on your service: **stock-basket-api**

### Step 2: Go to Environment Tab
- Find tabs at the top: Settings, Environment, Deploys, Logs
- Click **"Environment"**

### Step 3: Add Environment Variable #1 (MONGODB_URI)
1. Click **"+ Add Environment Variable"** button
2. **Key:** `MONGODB_URI`
3. **Value:** `mongodb+srv://raghava1533_db_user:[PASSWORD]@stock-basket-cluster.8embexz.mongodb.net/indian-stock-basket?appName=stock-basket-cluster`
   (Replace [PASSWORD] with your actual password)
4. Press **Enter** or click outside

### Step 4: Add Environment Variable #2 (EMAIL_USER)
1. Click **"+ Add Environment Variable"** button
2. **Key:** `EMAIL_USER`
3. **Value:** `your_email@gmail.com`
4. Press **Enter**

### Step 5: Add Environment Variable #3 (EMAIL_PASSWORD)
1. Click **"+ Add Environment Variable"** button
2. **Key:** `EMAIL_PASSWORD`
3. **Value:** `[your 16-character Gmail app password with no spaces]`
4. Press **Enter**

### Step 6: Add Environment Variable #4 (JWT_SECRET)
1. Click **"+ Add Environment Variable"** button
2. **Key:** `JWT_SECRET`
3. **Value:** `your_super_secret_key_12345`
4. Press **Enter**

### Step 7: Add Environment Variable #5 (NODE_ENV)
1. Click **"+ Add Environment Variable"** button
2. **Key:** `NODE_ENV`
3. **Value:** `production`
4. Press **Enter**

### Step 8: Save Changes
- Look for a **"Save"** button or similar
- Click it
- Render will show: **"Updated environment"**

### Step 9: Wait for Redeploy
- Render automatically starts redeploying
- Go to **"Deploys"** tab to watch progress
- Wait for status: **"✅ Live"**
- This takes 2-3 minutes

### Step 10: Get Your API URL
- Go back to top of service page
- Look for your URL (appears near the service name)
- Example: `https://stock-basket-api.onrender.com`
- **COPY THIS URL** - you need it for Vercel!

---

## ✅ VERIFY DEPLOYMENT

Test your backend is working:

1. **Open in browser:**
   ```
   https://stock-basket-api.onrender.com/health
   ```

2. **You should see:**
   ```json
   {
     "status": "Server is running",
     "timestamp": "2026-04-16T..."
   }
   ```

3. **If you see this, backend is LIVE! ✅**

---

## 📝 STEP-BY-STEP CHECKLIST

- [ ] Have all 6 environment variables ready (see above)
- [ ] Go to https://dashboard.render.com
- [ ] Click on stock-basket-api service
- [ ] Click "Environment" tab
- [ ] Add MONGODB_URI variable
- [ ] Add EMAIL_USER variable
- [ ] Add EMAIL_PASSWORD variable
- [ ] Add JWT_SECRET variable
- [ ] Add NODE_ENV variable
- [ ] Click "Save"
- [ ] Go to "Deploys" tab
- [ ] Wait for status: "Live" (2-3 minutes)
- [ ] Copy your API URL from service page
- [ ] Test health endpoint: `/health`
- [ ] Verify you get JSON response ✅

---

## 🎯 AFTER BACKEND IS DEPLOYED

Once you see "✅ Live":

1. ✅ Backend is deployed
2. ✅ You have API URL: `https://stock-basket-api.onrender.com`
3. → Next: Deploy frontend on Vercel
4. → Use API URL when deploying frontend
5. → Come back to update FRONTEND_URL

---

## ⏰ TIMING

- Adding variables: 2-3 minutes
- Deployment: 2-3 minutes
- **Total: 5 minutes to Live! 🚀**

---

## 🆘 TROUBLESHOOTING

### Build Failed?
- Check build logs in "Deploys" tab
- Common issue: Missing environment variable
- Verify all 5 variables are added (don't add FRONTEND_URL)

### "Cannot connect to MongoDB"?
- Check MONGODB_URI is correct
- Verify password in connection string
- Ensure `/indian-stock-basket` is in the URL

### "Email service error"?
- Check EMAIL_PASSWORD has no spaces
- Verify it's Gmail app password, not regular password
- Check EMAIL_USER matches

### Service shows "Suspended"?
- Might be free tier spun down
- Open the URL again to wake it up
- Will be back to "Live" in 30 seconds

---

## 📞 HELP

**Guides in your GitHub:**
- RENDER_ENV_QUICK_SETUP.md - Quick reference
- MONGODB_CONNECTION_STRING_COMPLETE.md - Connection string help
- JWT_SECRET_SETUP.md - JWT_SECRET options
- FRONTEND_URL_SETUP.md - FRONTEND_URL explained
- DEPLOYMENT_MASTER.md - Complete 5-part workflow

**All at:** https://github.com/raghava1533-cyber/indian_stock_basket

---

## 🎉 READY?

You have everything! Go to Render and deploy! 🚀

Follow the 10 steps above and you'll be live in 5 minutes!
