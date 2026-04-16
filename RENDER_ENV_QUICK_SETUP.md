# 🚀 QUICK SETUP REFERENCE - Ready to Deploy

## Your MongoDB Connection String (Incomplete)

```
mongodb+srv://raghava1533_db_user:<db_password>@stock-basket-cluster.8embexz.mongodb.net/?appName=stock-basket-cluster
```

---

## ⚡ QUICK FIX - 2 CHANGES NEEDED

### Change 1: Replace `<db_password>`
```
❌ BEFORE: <db_password>
✅ AFTER: [Your actual database password]
```

### Change 2: Add Database Name
```
❌ BEFORE: ...mongodb.net/?appName=...
✅ AFTER: ...mongodb.net/indian-stock-basket?appName=...
```

---

## ✅ FINAL FORMAT

```
mongodb+srv://raghava1533_db_user:[PASSWORD]@stock-basket-cluster.8embexz.mongodb.net/indian-stock-basket?appName=stock-basket-cluster
```

Replace `[PASSWORD]` with your database user password.

---

## 📋 RENDER ENVIRONMENT VARIABLES (Copy & Paste)

Add these 6 variables to Render configuration:

```
MONGODB_URI = mongodb+srv://raghava1533_db_user:[PASSWORD]@stock-basket-cluster.8embexz.mongodb.net/indian-stock-basket?appName=stock-basket-cluster

EMAIL_USER = your_email@gmail.com

EMAIL_PASSWORD = [your Gmail app password - no spaces]

JWT_SECRET = your_super_secret_key_12345

NODE_ENV = production

FRONTEND_URL = [leave empty for now]
```

---

## 🎯 NEXT STEPS

1. ✅ Have your database password ready
2. → Go to https://render.com
3. → Find your `stock-basket-api` service
4. → Go to "Environment" section
5. → Add/update the 6 variables above
6. → Click "Save"
7. → Render will auto-redeploy
8. → Wait for "Service is live" ✅
9. → Copy your API URL (e.g., https://stock-basket-api.onrender.com)
10. → Move to Vercel frontend deployment

---

## 📞 HELP

**Connection string guide:** MONGODB_CONNECTION_STRING_COMPLETE.md

**All deployment docs:** https://github.com/raghava1533-cyber/indian_stock_basket

---

**Ready? Go to Render.com and add these environment variables! 🚀**
