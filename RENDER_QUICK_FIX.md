# 🚀 RENDER DEPLOYMENT - QUICK TROUBLESHOOTING GUIDE

## Current Issue You're Facing

```
npm error path /opt/render/project/src/package.json
npm error enoent Could not read package.json
```

## ✅ THE FIX (Do This Now)

### Step 1: Go to Render Dashboard
```
https://dashboard.render.com
```

### Step 2: Click Your Service
```
Click: stock-basket-api
```

### Step 3: Click Settings Tab
```
At top of page, click "Settings"
```

### Step 4: Fix Root Directory
```
Find field: "Root Directory"
Current value: src (or wrong path)
Change to: backend
```

### Step 5: Verify Other Settings
```
Build Command: npm install
Start Command: npm start
```

### Step 6: Save
```
Click: "Save" button
Render auto-redeploys
```

### Step 7: Wait & Test
```
Wait 2-3 minutes
Go to "Deploys" tab
Status should show: Live ✅

Test: https://stock-basket-api.onrender.com/health
Should see JSON response
```

---

## 📋 Root Cause

| Setting | Current (Wrong) | Should Be |
|---------|-----------------|-----------|
| Root Directory | `src` | `backend` |
| Build Command | `npm install` | `npm install` ✅ |
| Start Command | `npm start` | `npm start` ✅ |

The Root Directory is the ONLY thing wrong. Change it to `backend` and you're done.

---

## 🎯 Why This Happens

Render runs:
```
cd /opt/render/project/src/     ← Looking in WRONG place
npm install                     ← Can't find package.json
npm start                       ← Fails
```

Should run:
```
cd /opt/render/project/backend/ ← Look in RIGHT place
npm install                     ← Finds backend/package.json ✅
npm start                       ← Server starts ✅
```

Your `package.json` is in `backend/package.json`, not `src/package.json`.

---

## ✅ Complete Checklist

- [ ] Go to https://dashboard.render.com
- [ ] Click stock-basket-api
- [ ] Click Settings tab
- [ ] Find Root Directory field
- [ ] Change from `src` to `backend`
- [ ] Verify Build Command: npm install
- [ ] Verify Start Command: npm start
- [ ] Click Save
- [ ] Go to Deploys tab
- [ ] Wait for status: Live ✅
- [ ] Test health endpoint
- [ ] See JSON response ✅

---

## 🎉 Once Backend is Live

You'll have:
```
API URL: https://stock-basket-api.onrender.com
Health Check: https://stock-basket-api.onrender.com/health
Status: ✅ Live & Running
```

Next steps:
1. Deploy frontend on Vercel
2. Get Vercel URL
3. Come back to Render and set FRONTEND_URL
4. Test complete application

---

## 📞 Still Having Issues?

See detailed troubleshooting:
- **RENDER_START_COMMAND_FIX.md** - This exact error explained
- **RENDER_BUILD_ERROR_FIX.md** - Build errors
- **DEPLOYMENT_MASTER.md** - Complete overview

---

**THIS IS THE ONLY CHANGE YOU NEED! Change Root Directory to `backend` on Render Settings and you're done! 🚀**
