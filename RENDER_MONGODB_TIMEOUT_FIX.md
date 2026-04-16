# 🔴 MongoDB Timeout Error - Fix Guide

## ❌ Error You Got

```
Error initializing baskets: MongooseError: Operation `baskets.countDocuments()` 
buffering timed out after 10000ms
```

## 🎯 What This Means

Your backend server **CANNOT CONNECT TO MONGODB** within 10 seconds.

The connection is timing out because:
1. **MONGODB_URI** is missing or malformed
2. **MongoDB Atlas IP whitelist** doesn't include Render's IP address
3. **Network connectivity** between Render and MongoDB Atlas is blocked
4. **Credentials** (username/password) are wrong

---

## ✅ The Fix (3 Parts)

### Part 1: Verify MONGODB_URI on Render

**Go to:** https://dashboard.render.com

**Steps:**
1. Click `stock-basket-api` service
2. Click `"Environment"` tab
3. Look for `MONGODB_URI`

**It MUST be exactly:**
```
mongodb+srv://raghava1533_db_user:YOUR_PASSWORD@stock-basket-cluster.8embexz.mongodb.net/indian-stock-basket?appName=stock-basket-cluster
```

**Replace** `YOUR_PASSWORD` with your actual database password (not your account password!)

**Check:**
- ✅ Starts with `mongodb+srv://`
- ✅ Username: `raghava1533_db_user`
- ✅ Password: (your database password)
- ✅ Cluster: `stock-basket-cluster.8embexz.mongodb.net`
- ✅ Database: `/indian-stock-basket`
- ✅ No extra spaces

If wrong, **Edit** it and **Click Save**.

---

### Part 2: Fix MongoDB Atlas IP Whitelist

**This is the most common cause of timeouts!**

Render's IP address changes frequently, so you need to whitelist **ALL IPs**.

**Go to:** https://cloud.mongodb.com

**Steps:**
1. Login to MongoDB Atlas
2. Click your project: `Stock Basket`
3. Click `Clusters` → `stock-basket-cluster`
4. Click `"Network Access"` tab
5. Look for `IP Access List`

**You should see one entry:**
```
0.0.0.0/0 (Allow Access from Anywhere)
```

**If NOT there, ADD IT:**
1. Click `"Add IP Address"` button
2. Click `"Allow Access from Anywhere"`
3. Click `"Confirm"`

**If it's there but says something like:**
```
203.0.113.123
```
(a specific IP address)

**DELETE it and ADD:**
```
0.0.0.0/0 (Allow Access from Anywhere)
```

---

### Part 3: Verify Database User

**Go back to:** https://cloud.mongodb.com

**Steps:**
1. Click your project: `Stock Basket`
2. Click `"Database Access"` tab
3. Look for user: `raghava1533_db_user`

**Check:**
- ✅ User exists
- ✅ Status says: `"Password: ••••••••"` (password is set)
- ✅ Database User Privileges: `"readWriteAnyDatabase@admin"`

**If wrong privileges:**
1. Click the `...` menu next to the user
2. Click `"Edit"` or `"Delete & Recreate"`
3. Set Role to: `"readWriteAnyDatabase"`
4. Click `"Update"` or `"Create"`

---

## 🔄 Redeploy After Changes

1. **Save any changes** you made
2. Go back to Render dashboard
3. Wait 2-3 minutes (auto redeploy)
4. Go to `"Deploys"` tab
5. Status should change: `In Progress` → `Live ✅`

---

## 🧪 Test After Deployment

Once status is `Live ✅`:

**Test health endpoint:**
```
https://stock-basket-api.onrender.com/health
```

**Should return:**
```json
{
  "status": "Server is running",
  "timestamp": "2026-04-16T..."
}
```

**If you see this, MongoDB is connected!** ✅

---

## 📋 Checklist

- [ ] Part 1: MONGODB_URI is correct on Render
- [ ] Part 1: MONGODB_URI starts with `mongodb+srv://`
- [ ] Part 1: Password is correct (database password, not account password)
- [ ] Part 2: MongoDB Atlas has `0.0.0.0/0` in IP Access List
- [ ] Part 2: Removed any specific IP addresses
- [ ] Part 3: Database user `raghava1533_db_user` exists
- [ ] Part 3: User has `readWriteAnyDatabase@admin` role
- [ ] Saved changes on Render
- [ ] Waited 2-3 minutes for redeploy
- [ ] Status is `Live ✅`
- [ ] Health endpoint returns JSON

---

## 🆘 Still Getting Timeout?

### Check Logs on Render

1. Go to https://dashboard.render.com
2. Click `stock-basket-api`
3. Click `"Logs"` tab
4. Look for the error message
5. Copy the full error

### Common Scenarios

**Scenario 1: "authentication failed"**
- Wrong password in MONGODB_URI
- Check MongoDB Atlas Database Access user password
- Make sure it matches exactly (case-sensitive!)

**Scenario 2: "command failed: authentication failed"**
- User doesn't exist
- Create user `raghava1533_db_user` in MongoDB Atlas
- Or username is spelled wrong

**Scenario 3: "connection timed out"**
- IP whitelist issue
- Make sure `0.0.0.0/0` is in MongoDB Atlas Network Access
- Wait 5 minutes after adding IP (Atlas needs time to update)

**Scenario 4: "host not found"**
- Typo in cluster name
- Should be: `stock-basket-cluster.8embexz.mongodb.net`
- Check spelling exactly

**Scenario 5: "database not found"**
- Typo in database name
- Should be: `/indian-stock-basket`
- Check `/` at beginning

---

## 📚 Reference

Connection string parts:
```
mongodb+srv://USERNAME:PASSWORD@CLUSTER/DATABASE?PARAMS
         ↑     ↑        ↑       ↑       ↑       ↑
      protocol user    pass  cluster  db    params
```

For you:
```
mongodb+srv://raghava1533_db_user:YOUR_PASSWORD@stock-basket-cluster.8embexz.mongodb.net/indian-stock-basket?appName=stock-basket-cluster
```

---

## ✅ Code Fix Applied

Your backend code has been updated to:
1. ✅ Properly await database connection before initialization
2. ✅ Better error messaging
3. ✅ Sequential startup (Connect → Initialize → Schedule → Test Email → Listen)

This prevents the timeout from happening due to code issues. **Now it's just about MongoDB Atlas configuration.**

---

## 🚀 Next Steps

1. ✅ Fix MONGODB_URI on Render
2. ✅ Fix IP whitelist on MongoDB Atlas
3. ✅ Verify database user
4. ✅ Wait for redeploy
5. ✅ Test health endpoint
6. → Deploy frontend on Vercel
7. → Update FRONTEND_URL on Render
8. → Full system testing

**Your backend will be LIVE once these 3 parts are fixed!** 🎉
