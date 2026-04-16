# 🌐 FRONTEND_URL - Complete Setup Guide

## What is FRONTEND_URL?

**FRONTEND_URL** is the web address of your frontend application (the user-facing website).

Your backend API uses this to:
- Enable CORS (Cross-Origin Resource Sharing) - allow frontend to talk to backend
- Send email links that point to your frontend
- Redirect users back to frontend after authentication

---

## 📍 Where Your URLs Come From

| Component | Platform | URL Format |
|-----------|----------|-----------|
| **Backend API** | Render | `https://stock-basket-api.onrender.com` |
| **Frontend** | Vercel | `https://stock-basket.vercel.app` |

---

## ⏳ Deployment Order

### Step 1: Deploy Backend FIRST (on Render) ✅
- Creates API at: `https://stock-basket-api.onrender.com`
- At this stage, leave `FRONTEND_URL` **EMPTY**

### Step 2: Deploy Frontend (on Vercel)
- Creates frontend at: `https://stock-basket.vercel.app`
- Get this URL from Vercel

### Step 3: Update FRONTEND_URL
- Go back to Render
- Set `FRONTEND_URL = https://stock-basket.vercel.app`
- Render redeploys automatically

---

## 🎯 For Right Now

**During Render Backend Deployment:**

Leave `FRONTEND_URL` **EMPTY** or **blank**

```
FRONTEND_URL = [leave empty]
```

OR simply don't add this variable - it will use a default value.

---

## 📝 After Vercel Deployment

Once you deploy on Vercel:

**You'll get a URL like:**
```
https://stock-basket.vercel.app
```

**Then go back to Render and update:**
```
FRONTEND_URL = https://stock-basket.vercel.app
```

---

## ✅ Your Complete 6 Environment Variables for Render

```
1. MONGODB_URI = mongodb+srv://raghava1533_db_user:[PASSWORD]@stock-basket-cluster.8embexz.mongodb.net/indian-stock-basket?appName=stock-basket-cluster

2. EMAIL_USER = your_email@gmail.com

3. EMAIL_PASSWORD = [your Gmail app password - no spaces]

4. JWT_SECRET = your_super_secret_key_12345

5. NODE_ENV = production

6. FRONTEND_URL = [LEAVE EMPTY FOR NOW]
```

---

## 🔄 The Timeline

```
NOW: Deploy Backend on Render
     ├─ FRONTEND_URL = [empty]
     ├─ API deployed at: https://stock-basket-api.onrender.com
     └─ ✅ Copy this URL
          ↓
NEXT: Deploy Frontend on Vercel
      ├─ Use API URL from Render: https://stock-basket-api.onrender.com/api
      ├─ Frontend deployed at: https://stock-basket.vercel.app
      └─ ✅ Copy this URL
           ↓
THEN: Update Backend on Render
      ├─ Set FRONTEND_URL = https://stock-basket.vercel.app
      ├─ Render auto-redeploys
      └─ ✅ Both working together!
           ↓
FINALLY: Test Everything
         ├─ Open frontend: https://stock-basket.vercel.app
         ├─ Subscribe with email
         ├─ Test rebalancing
         └─ ✅ LIVE! 🚀
```

---

## 📋 Right Now Checklist

For Render Backend Deployment NOW:

```
☑ MONGODB_URI = [your connection string with password]
☑ EMAIL_USER = [your email]
☑ EMAIL_PASSWORD = [Gmail app password]
☑ JWT_SECRET = your_super_secret_key_12345
☑ NODE_ENV = production
☑ FRONTEND_URL = [LEAVE EMPTY]
```

---

## 🚀 Next Steps

1. ✅ Gather all 6 environment variables (list above)
2. → Go to https://render.com
3. → Open your service: stock-basket-api
4. → Go to "Environment" tab
5. → Add the 6 variables
6. → Click "Save" or "Deploy"
7. → Wait for "Service is live" ✅
8. → Copy your API URL

**Then** deploy on Vercel and come back to update FRONTEND_URL.

---

## 💡 Why Leave It Empty?

The backend can run without knowing the frontend URL. Once the frontend is deployed, you'll add the URL so the backend knows where to find it.

This is just the normal deployment order!

---

## ✅ Checklist for Render Deployment

- [ ] Have MONGODB_URI ready (with password and /indian-stock-basket)
- [ ] Have EMAIL_USER ready (your Gmail)
- [ ] Have EMAIL_PASSWORD ready (Gmail app password, no spaces)
- [ ] Have JWT_SECRET decided (use: your_super_secret_key_12345)
- [ ] NODE_ENV is set to: production
- [ ] FRONTEND_URL is LEFT EMPTY
- [ ] Ready to go to Render.com
- [ ] Ready to add 6 environment variables

---

**Ready to deploy? You have everything you need! 🚀**

Go to https://render.com and add these variables to your stock-basket-api service!
