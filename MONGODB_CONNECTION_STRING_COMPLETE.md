# 🔗 MongoDB Connection String - Complete Setup Guide

## Your Connection String Status

**You have received:**
```
mongodb+srv://raghava1533_db_user:<db_password>@stock-basket-cluster.8embexz.mongodb.net/?appName=stock-basket-cluster
```

**Status:** ⚠️ Incomplete - needs password and database name

---

## Step 1: Identify Your Password

**What you need:** The password you created for `raghava1533_db_user` database user.

**Where to find it:**
- Look in your notes/password manager
- Or check your email if MongoDB sent confirmation
- Or look at the screen where you created the user

**Example password:** `MySecure$Pass123`

---

## Step 2: Build Complete Connection String

### Format Template:
```
mongodb+srv://raghava1533_db_user:[PASSWORD]@stock-basket-cluster.8embexz.mongodb.net/indian-stock-basket?appName=stock-basket-cluster
```

### Parts Breakdown:

| Part | Value | Notes |
|------|-------|-------|
| Protocol | `mongodb+srv://` | Always use this |
| Username | `raghava1533_db_user` | Your database user |
| Password | `[YOUR_PASSWORD]` | Replace with actual password |
| Cluster | `stock-basket-cluster.8embexz.mongodb.net` | Your cluster endpoint |
| Database | `indian-stock-basket` | Application database name |
| App Name | `appName=stock-basket-cluster` | Metadata parameter |

### Example Complete String:
```
mongodb+srv://raghava1533_db_user:MySecure$Pass123@stock-basket-cluster.8embexz.mongodb.net/indian-stock-basket?appName=stock-basket-cluster
```

---

## Step 3: Special Characters in Password

**Important:** If your password contains special characters, you may need to URL-encode them.

### Common Special Characters Encoding:

| Character | Encoded | Character | Encoded |
|-----------|---------|-----------|---------|
| `@` | `%40` | `!` | `%21` |
| `#` | `%23` | `$` | `%24` |
| `%` | `%25` | `&` | `%26` |
| `:` | `%3A` | `/` | `%2F` |
| `?` | `%3F` | `=` | `%3D` |

### Example with Special Characters:

**Your password:** `My$Pass@123`

**Needs encoding:**
- `$` becomes `%24`
- `@` becomes `%40`

**Result:** `My%24Pass%40123`

**Complete string:**
```
mongodb+srv://raghava1533_db_user:My%24Pass%40123@stock-basket-cluster.8embexz.mongodb.net/indian-stock-basket?appName=stock-basket-cluster
```

---

## Step 4: Verify Your Connection String

Your final connection string should:

- ✅ Start with: `mongodb+srv://`
- ✅ Have username: `raghava1533_db_user`
- ✅ Have your password (encoded if needed)
- ✅ Have cluster: `stock-basket-cluster.8embexz.mongodb.net`
- ✅ Have database: `/indian-stock-basket`
- ✅ Have app name: `?appName=stock-basket-cluster`

**Format:**
```
mongodb+srv://raghava1533_db_user:[PASSWORD]@stock-basket-cluster.8embexz.mongodb.net/indian-stock-basket?appName=stock-basket-cluster
```

---

## Step 5: Use in Render Deployment

### On Render.com Configuration Page:

**Add Environment Variable:**

```
Key: MONGODB_URI

Value: mongodb+srv://raghava1533_db_user:[YOUR_PASSWORD]@stock-basket-cluster.8embexz.mongodb.net/indian-stock-basket?appName=stock-basket-cluster
```

(Replace `[YOUR_PASSWORD]` with your actual password)

---

## Step 6: Other Required Environment Variables

On Render, also add these (from earlier):

```
EMAIL_USER = your_email@gmail.com

EMAIL_PASSWORD = [your Gmail app password, no spaces]

JWT_SECRET = your_super_secret_key_12345

NODE_ENV = production

FRONTEND_URL = [leave empty, will update later]
```

---

## 🔐 Security Checklist

- [ ] Password is URL-encoded if it contains special characters
- [ ] Password is NOT stored in git or shared publicly
- [ ] Connection string is ONLY in Render environment variables
- [ ] Password is saved in secure location (password manager)
- [ ] You're using database password, NOT your MongoDB Atlas account password

---

## ✅ Complete Checklist

- [ ] Found your database password
- [ ] Built complete connection string
- [ ] URL-encoded special characters (if any)
- [ ] Verified format is correct
- [ ] Ready to add to Render

---

## 📋 Your Connection String Reference

**Save this template with YOUR values:**

```
mongodb+srv://raghava1533_db_user:[YOUR_PASSWORD_HERE]@stock-basket-cluster.8embexz.mongodb.net/indian-stock-basket?appName=stock-basket-cluster
```

**Username:** raghava1533_db_user
**Cluster:** stock-basket-cluster.8embexz.mongodb.net
**Database:** indian-stock-basket
**Password:** (your database user password - keep secure)

---

## 🚀 Next Steps After Getting Connection String

1. ✅ Complete MongoDB connection string (this guide)
2. → Go to Render.com deployment page
3. → Add MONGODB_URI environment variable
4. → Add other 5 environment variables
5. → Click "Deploy" button
6. → Wait for "Service is live" message
7. → Copy API URL
8. → Deploy frontend on Vercel
9. → Test your complete application

---

## ❓ Connection String Troubleshooting

### Problem: "Connection timeout"
**Check:**
- Password is correct (matches what you set)
- Special characters are URL-encoded
- Cluster is provisioned (green checkmark on MongoDB Atlas)
- IP whitelist includes 0.0.0.0/0

### Problem: "Authentication failed"
**Check:**
- Username is spelled correctly: `raghava1533_db_user`
- Password is exact match (case-sensitive)
- No extra spaces before/after password

### Problem: "Cannot reach database"
**Check:**
- Connection string includes database name: `/indian-stock-basket`
- Cluster endpoint is correct: `stock-basket-cluster.8embexz.mongodb.net`
- Network Access allows 0.0.0.0/0 on MongoDB Atlas

### Problem: "Cannot find collection"
**This is normal on first run** - application will create collections automatically

---

## 📚 Resources

- MongoDB Connection String Docs: https://docs.mongodb.com/manual/reference/connection-string/
- URL Encoding Reference: https://www.w3schools.com/tags/ref_urlencode.asp
- MongoDB Atlas Troubleshooting: https://docs.mongodb.com/atlas/troubleshoot-connection/

---

## 🎯 You're Almost There!

1. **Get password** (from your MongoDB setup)
2. **Build connection string** (using template above)
3. **URL-encode if needed** (special characters)
4. **Add to Render** (MONGODB_URI environment variable)
5. **Deploy** (click Deploy on Render)
6. **Watch it go live!** 🚀

---

**Ready to deploy? Let's go!** 🎉
