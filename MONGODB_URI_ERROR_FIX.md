# 🔐 MongoDB URI Error - Fix Guide

## ❌ Error You Got

```
Error: Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://"
==> Exited with status 1
```

## 🎯 The Problem

Your **MONGODB_URI** environment variable on Render is either:
1. **Missing** - not added to environment variables
2. **Empty** - blank value
3. **Invalid format** - doesn't start with `mongodb://` or `mongodb+srv://`
4. **Has typos** - malformed connection string

---

## ✅ The Fix

### Step 1: Go to Render Dashboard
```
https://dashboard.render.com
```

### Step 2: Open Your Service
```
Click: stock-basket-api
```

### Step 3: Go to Environment Tab
```
Click: "Environment" tab
```

### Step 4: Check MONGODB_URI Variable

**Look for:** A variable named `MONGODB_URI`

**If NOT there:**
- Click "Add Environment Variable"
- Add it now

**If it's there:**
- Check the value
- Make sure it starts with `mongodb+srv://`
- Make sure there are NO spaces
- Make sure there are NO typos

### Step 5: Correct Format

Your MONGODB_URI must be:
```
mongodb+srv://raghava1533_db_user:YOUR_PASSWORD@stock-basket-cluster.8embexz.mongodb.net/indian-stock-basket?appName=stock-basket-cluster
```

**MUST START WITH:** `mongodb+srv://` ✅

**MUST INCLUDE:**
- Username: `raghava1533_db_user`
- Password: `YOUR_PASSWORD` (your actual database password)
- Cluster: `stock-basket-cluster.8embexz.mongodb.net`
- Database: `/indian-stock-basket`
- App name: `?appName=stock-basket-cluster`

### Step 6: Update Value

If the value is wrong:
1. Click on the MONGODB_URI value
2. Clear it completely
3. Paste the correct connection string
4. Click outside or press Enter

### Step 7: Save

Click **"Save"** button

Render will redeploy automatically.

### Step 8: Wait & Test

Wait 2-3 minutes for deployment to complete.

Status should change: `In Progress` → `Live ✅`

---

## 📋 All 6 Environment Variables Required

Make sure ALL of these are set:

```
1. MONGODB_URI
   mongodb+srv://raghava1533_db_user:YOUR_PASSWORD@stock-basket-cluster.8embexz.mongodb.net/indian-stock-basket?appName=stock-basket-cluster

2. EMAIL_USER
   your_email@gmail.com

3. EMAIL_PASSWORD
   [your Gmail app password - no spaces]

4. JWT_SECRET
   your_super_secret_key_12345

5. NODE_ENV
   production

6. FRONTEND_URL
   [leave empty]
```

---

## 🔍 Common Mistakes

| Mistake | Wrong | Correct |
|---------|-------|---------|
| Missing protocol | `raghava1533_db_user:pass@...` | `mongodb+srv://raghava1533_db_user:pass@...` |
| Wrong protocol | `mongodb://` (should be `mongodb+srv://`) | `mongodb+srv://` |
| Password with special chars | Not URL-encoded | `%24` for `$`, `%40` for `@` |
| Extra spaces | `mongodb+srv:// user:pass@...` | No spaces |
| Wrong password | Using account password | Database user password |
| Missing database | `...mongodb.net?appName=...` | `...mongodb.net/indian-stock-basket?appName=...` |

---

## ✅ Validation Checklist

- [ ] MONGODB_URI variable exists on Render
- [ ] Value starts with `mongodb+srv://`
- [ ] Contains username: `raghava1533_db_user`
- [ ] Contains your actual database password
- [ ] Contains cluster: `stock-basket-cluster.8embexz.mongodb.net`
- [ ] Contains database: `/indian-stock-basket`
- [ ] No extra spaces
- [ ] No typos
- [ ] Other 5 variables also set (EMAIL_USER, EMAIL_PASSWORD, JWT_SECRET, NODE_ENV, FRONTEND_URL)
- [ ] Clicked "Save"
- [ ] Waiting for redeploy to complete

---

## 🚀 After Fix

Once redeploy is complete and status is `Live ✅`:

Test health endpoint:
```
https://stock-basket-api.onrender.com/health
```

Should return:
```json
{
  "status": "Server is running",
  "timestamp": "..."
}
```

If you get this, MongoDB connection is working! ✅

---

## 🆘 Still Getting Error?

### Check Build Logs
1. Go to **"Deploys"** tab
2. Click on the failed deployment
3. Read the full error log
4. Look for exact error message

### Common Issues

**Error: "authentication failed"**
- Wrong password in MONGODB_URI
- Check database user password from MongoDB Atlas
- Make sure it matches exactly

**Error: "host not found"**
- Typo in cluster name
- Check it matches: `stock-basket-cluster.8embexz.mongodb.net`

**Error: "IP not whitelisted"**
- Go to MongoDB Atlas
- Check Network Access
- Make sure `0.0.0.0/0` is whitelisted

**Error: "database not found"**
- Check `/indian-stock-basket` is in connection string
- Verify spelling

---

## 📚 Reference Guides

- **RENDER_QUICK_FIX.md** - Quick fix for Start Command
- **RENDER_BUILD_ERROR_FIX.md** - Build error troubleshooting
- **RENDER_START_COMMAND_FIX.md** - Start command error fixes
- **MONGODB_ATLAS_SETUP.md** - MongoDB setup and connection string

---

## 🎯 Next Steps

1. ✅ Fix MONGODB_URI on Render
2. ✅ Make sure all 6 environment variables are set
3. ✅ Click Save
4. ✅ Wait for redeploy
5. ✅ Test health endpoint
6. → Deploy frontend on Vercel
7. → Update FRONTEND_URL
8. → Test complete application

---

**Your backend will be LIVE once MongoDB URI is correct!** 🚀
