# 🔧 Render Build Error Fix - Root Directory Issue

## ❌ Error You Got

```
==> Running build command 'cd backend && npm install'...
bash: line 1: cd: backend: No such file or directory
==> Build failed 😞
```

## 🎯 The Problem

Render can't find the `backend` folder because the **Root Directory** setting is incorrect.

When Render runs the build, it's looking in the wrong location for the `backend` folder.

---

## ✅ The Solution - 2 Options

### OPTION 1: Correct Root Directory Setting (Recommended)

**Step 1: Go to Settings**
1. https://dashboard.render.com
2. Click: `stock-basket-api`
3. Click: **"Settings"** tab

**Step 2: Find "Root Directory"**
Look for the field labeled **"Root Directory"**

**Step 3: Set It Correctly**
```
Root Directory: . (just a dot)
```

OR leave it completely **empty** (blank)

**Step 4: Keep Build Command As Is**
```
Build Command: cd backend && npm install
```

**Step 5: Save & Redeploy**
- Click "Save"
- Render will automatically redeploy
- ⏳ Wait 2-3 minutes
- ✅ Look for "Service is live"

---

### OPTION 2: Alternative - Set Root Directory to backend

If you prefer to set Root Directory to `backend`:

| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Build Command | `npm install` (without "cd backend") |
| Start Command | `npm start` |

Then:
- Click "Save"
- Render redeploys
- ✅ Should work

---

## 📋 Correct Complete Configuration

**Use this as reference:**

| Setting | Value |
|---------|-------|
| **Name** | stock-basket-api |
| **Root Directory** | `.` (dot) |
| **Build Command** | `cd backend && npm install` |
| **Start Command** | `npm start` |
| **Environment** | Node |
| **Plan** | Free (or Starter) |

---

## 🔍 How to Find Root Directory Setting

**Location on Render:**

```
Dashboard → stock-basket-api → Settings Tab
                                    ↓
                        Build & Deploy
                                    ↓
                    [Root Directory input field]
                          OR
                    [Advanced Settings]
```

**What it might show:**
- Empty (blank)
- `/`
- `backend`
- `.`

**Change it to:** `.` (dot) or leave empty

---

## 🚀 Step-by-Step Fix Process

### Step 1: Navigate to Service Settings
```
1. Open: https://dashboard.render.com
2. Click: stock-basket-api service
3. Click: "Settings" tab (at top)
```

### Step 2: Locate Root Directory
Scroll to find: **"Root Directory"** field

### Step 3: Update the Value
```
If it says: backend
Change to: . (dot)

If it says: /
Change to: . (dot)

If it's empty:
Change to: . (dot)
```

### Step 4: Verify Build Command
Make sure it shows:
```
Build Command: cd backend && npm install
```

### Step 5: Verify Start Command
Make sure it shows:
```
Start Command: npm start
```

### Step 6: Click Save
Look for a **"Save"** button at bottom of page
Click it

### Step 7: Redeploy
Render will show:
```
"Your settings have been saved. Redeploying..."
```

### Step 8: Wait for Deployment
Go to **"Deploys"** tab to watch progress

Status will show:
```
In Progress → Live ✅
```

⏳ Takes 2-3 minutes

### Step 9: Verify Success
Test the health endpoint:
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

✅ Build fixed!

---

## 📸 Visual Guide

**What the Settings page looks like:**

```
Render Dashboard
└─ Services
   └─ stock-basket-api
      ├─ Settings (← CLICK HERE)
      ├─ Environment
      ├─ Deploys
      └─ Logs
         
    In Settings page, find:
    
    Build & Deploy Section
    ├─ Root Directory: . ← CHANGE THIS TO DOT
    ├─ Build Command: cd backend && npm install
    ├─ Start Command: npm start
    └─ [Save Button] ← CLICK HERE
```

---

## 🆘 Troubleshooting

### Problem: Still says "Root Directory not found"
**Solution:**
- Try Option 2: Set Root Directory to `backend`
- Change Build Command to just: `npm install`

### Problem: Can't find Settings tab
**Solution:**
- Make sure you're on the service page
- Look for tabs: Overview, Settings, Environment, Deploys, Logs
- Settings is usually 2nd or 3rd tab

### Problem: Settings doesn't show Root Directory
**Solution:**
- Scroll down on Settings page
- It might be under "Advanced Settings"
- Look for "Build Configuration" section

### Problem: Still getting build error
**Solution:**
1. Go to "Deploys" tab
2. Click on the failed deployment
3. Read the full log to see actual error
4. Check if environment variables are all set

---

## ✅ Complete Checklist

- [ ] Go to Render dashboard
- [ ] Click stock-basket-api service
- [ ] Click "Settings" tab
- [ ] Find "Root Directory" field
- [ ] Change it to: `.` (dot)
- [ ] Verify Build Command: `cd backend && npm install`
- [ ] Verify Start Command: `npm start`
- [ ] Click "Save"
- [ ] Go to "Deploys" tab
- [ ] Wait for status: "Live" ✅
- [ ] Test: https://stock-basket-api.onrender.com/health
- [ ] See JSON response ✅

---

## 📞 Quick Reference

**If Root Directory is wrong:**
- Change it to: `.` (just a dot)

**If that doesn't work:**
- Set Root Directory to: `backend`
- Change Build Command to: `npm install`

**Then save and redeploy!**

---

## 🎯 Next Steps

1. Make the Root Directory fix
2. Save and redeploy
3. Wait for "Service is live" ✅
4. Copy your API URL: `https://stock-basket-api.onrender.com`
5. Deploy frontend on Vercel next

---

**Ready to fix it? Go to Render and update the Root Directory setting!** 🚀
