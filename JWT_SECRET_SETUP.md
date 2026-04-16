# 🔐 JWT_SECRET - Complete Setup Guide

## What is JWT_SECRET?

**JWT (JSON Web Token)** is used for user authentication in your application.

**JWT_SECRET** is the secret key that signs and verifies these tokens.

Think of it like a password that only your server knows - it protects user login sessions.

---

## 🎯 For This Project

You just need to set a value. It doesn't have to be complicated.

### Recommended Values (Pick One):

**Option 1: Simple & Easy (RECOMMENDED)**
```
JWT_SECRET = your_super_secret_key_12345
```

**Option 2: More Descriptive**
```
JWT_SECRET = stock_basket_app_secret_key_production_2026
```

**Option 3: Random Generated**
```
JWT_SECRET = a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
```

---

## 📋 Why You Need It

Your application uses JWT_SECRET for:
- User authentication (login/logout)
- Email verification tokens
- Session management
- Token refresh functionality

When someone logs in, the server creates a token signed with JWT_SECRET. When they use the app, the server verifies the token using the same secret.

---

## ⚙️ How to Generate One

### Method 1: Use Simple Value (Fastest)
Just use: `your_super_secret_key_12345`

Done! ✅

### Method 2: Generate Random Online
1. Go to: https://www.random.org/strings/
2. Set Length: 32
3. Set Characters: alphanumeric
4. Generate
5. Copy the result

### Method 3: Generate with Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

This outputs something like:
```
7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7
```

---

## 🔒 Security Guidelines

### ✅ DO:
- Use a strong, random string (32+ characters recommended)
- Store it ONLY in environment variables
- Keep it secret - never commit to git
- Never share it publicly
- Use same secret in production

### ❌ DON'T:
- Use simple words like "password" or "secret"
- Commit it to git repository
- Share it in emails or messages
- Reuse across different applications
- Store it in code files

---

## 📋 Your Complete Render Configuration

All 6 environment variables you need:

```
MONGODB_URI = mongodb+srv://raghava1533_db_user:[PASSWORD]@stock-basket-cluster.8embexz.mongodb.net/indian-stock-basket?appName=stock-basket-cluster

EMAIL_USER = your_email@gmail.com

EMAIL_PASSWORD = [your Gmail app password - no spaces]

JWT_SECRET = your_super_secret_key_12345

NODE_ENV = production

FRONTEND_URL = [leave empty for now]
```

---

## 🚀 Steps to Add to Render

1. **Go to:** https://render.com
2. **Open Dashboard:** https://dashboard.render.com
3. **Find Service:** `stock-basket-api`
4. **Click on it**
5. **Go to "Environment"** tab
6. **Click "+ Add Environment Variable"** (for each variable)
7. **Fill in 6 variables** (listed above)
8. **Save changes**
9. **Render will auto-redeploy** ✅

---

## ✅ Checklist

- [ ] Decided on JWT_SECRET value
- [ ] Have all 6 environment variables ready
- [ ] Gone to Render.com
- [ ] Opened your service: stock-basket-api
- [ ] Added MONGODB_URI variable
- [ ] Added EMAIL_USER variable
- [ ] Added EMAIL_PASSWORD variable
- [ ] Added JWT_SECRET variable
- [ ] Added NODE_ENV variable
- [ ] Left FRONTEND_URL empty
- [ ] Clicked Save/Deploy
- [ ] Waiting for "Service is live" message

---

## 🎯 Next Steps

1. ✅ Get JWT_SECRET (use: `your_super_secret_key_12345`)
2. → Gather all 6 environment variables
3. → Go to Render.com dashboard
4. → Add environment variables to stock-basket-api
5. → Click Deploy
6. → Wait for deployment ✅
7. → Copy your API URL
8. → Deploy frontend on Vercel
9. → Test everything

---

## 📞 Reference

**All deployment guides:** https://github.com/raghava1533-cyber/indian_stock_basket

**Key files:**
- RENDER_ENV_QUICK_SETUP.md - Quick copy-paste reference
- DEPLOYMENT_MASTER.md - Complete 5-part deployment
- MONGODB_CONNECTION_STRING_COMPLETE.md - Connection string help

---

**Ready to deploy on Render? Let's go! 🚀**
