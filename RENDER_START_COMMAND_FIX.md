# 🔧 Render Start Command Error - Root Directory Issue

## ❌ Error You Got

```
npm error path /opt/render/project/src/package.json
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory
==> Exited with status 254
```

## 🎯 The Problem

Render is looking for `package.json` in the wrong location:
- **Looking in:** `/opt/render/project/src/package.json` ❌
- **Should look in:** `/opt/render/project/backend/package.json` ✅

This happens because **Root Directory** is set to `src` instead of `backend`.

---

## ✅ The Solution

### Root Cause
Your Render settings have:
```
Root Directory: src (WRONG)
```

Should be:
```
Root Directory: backend (CORRECT)
```

---

## 🚀 Fix Steps

### Step 1: Go to Render Settings
1. **https://dashboard.render.com**
2. Click: **stock-basket-api**
3. Click: **"Settings"** tab (top of page)

### Step 2: Find and Fix Root Directory
Look for field: **"Root Directory"**

**Current value:** `src` or something wrong

**Change to:** `backend`

### Step 3: Verify Other Settings
Make sure these are correct:

| Setting | Should Be |
|---------|-----------|
| Build Command | `npm install` |
| Start Command | `npm start` |
| Environment | Node |

### Step 4: Save Changes
Click **"Save"** button

Render will show:
```
"Your settings have been saved. Redeploying..."
```

### Step 5: Wait for Deployment
- Go to **"Deploys"** tab
- Watch status: `In Progress` → `Live ✅`
- Takes 2-3 minutes

### Step 6: Verify Success
Test health endpoint:
```
https://stock-basket-api.onrender.com/health
```

Should return:
```json
{
  "status": "Server is running",
  "timestamp": "2026-04-16T..."
}
```

✅ **Backend is now LIVE!**

---

## 📋 Complete Correct Configuration

This is what your Render settings should look like:

```
Service Name: stock-basket-api
Environment: Node
Build Command: npm install
Start Command: npm start
Root Directory: backend
```

---

## 🔍 Why This Happens

Render runs commands from the **Root Directory** location:

1. It changes to the Root Directory folder
2. It runs Build Command: `npm install`
3. It looks for package.json in that folder
4. It runs Start Command: `npm start`

If Root Directory is wrong, it can't find package.json.

**Your directory structure:**
```
indian_stock_basket/
├── backend/
│   ├── package.json ← We want Render to find THIS
│   ├── server.js
│   └── ...
├── frontend/
│   ├── package.json
│   └── ...
└── README.md
```

When Root Directory = `backend`, Render looks in the right place.

---

## 🔄 Alternative Fix (If Root Directory is already `.`)

If your Root Directory is already set to `.` (dot), use this configuration instead:

```
Root Directory: . (dot)
Build Command: cd backend && npm install
Start Command: cd backend && npm start
```

This tells Render to:
1. Start in project root (.)
2. Change into backend folder
3. Run npm install there
4. Run npm start there

This is equivalent to setting Root Directory to `backend`.

## 🆘 Troubleshooting

### Still seeing "Could not read package.json"?
- Verify Root Directory is set to: `backend`
- Click "Save"
- Redeploy
- Check Deploys tab for build progress

### Build Command still fails?
- Make sure Build Command is: `npm install`
- Make sure Start Command is: `npm start`
- Don't include `cd backend` in these commands if Root Directory = `backend`

### Service shows "Suspended"?
- Free tier spins down after 15 minutes of inactivity
- Open the health endpoint to wake it up
- It will restart automatically

### Still stuck?
- Go to "Deploys" tab
- Click on failed deployment
- Read full log to see exact error
- Compare settings to the table above

---

## ✅ Complete Checklist

- [ ] Go to Render dashboard
- [ ] Click stock-basket-api service
- [ ] Click Settings tab
- [ ] Find Root Directory field
- [ ] Change from `src` to `backend`
- [ ] Verify Build Command: `npm install`
- [ ] Verify Start Command: `npm start`
- [ ] Click Save
- [ ] Go to Deploys tab
- [ ] Wait for status: "Live" ✅
- [ ] Test: https://stock-basket-api.onrender.com/health
- [ ] See JSON response ✅

---

## 📊 What Render Does With These Settings

```
Render Deployment Process:
├─ Read settings
├─ Change to Root Directory: backend
├─ Run Build Command: npm install
│  └─ Installs all dependencies from backend/package.json
├─ Run Start Command: npm start
│  └─ Runs: node server.js (from backend folder)
├─ Start listening on port 5000
└─ Service is LIVE! ✅
```

---

## 🎯 Next Steps After Backend is Live

1. ✅ Backend API deployed
2. ✅ You have API URL: `https://stock-basket-api.onrender.com`
3. → Deploy frontend on Vercel
4. → Update FRONTEND_URL on Render
5. → Test complete application

---

## 📞 Quick Reference

**If you see error about package.json location:**
- Root Directory is wrong
- Change it to: `backend`
- Save and redeploy

**If npm install fails:**
- Check Build Command: `npm install`
- Check Root Directory: `backend`
- Verify no special characters

**If npm start fails:**
- Check Start Command: `npm start`
- Check Root Directory: `backend`
- Verify server.js exists in backend folder

---

**Make this fix now and your backend will be LIVE! 🚀**
