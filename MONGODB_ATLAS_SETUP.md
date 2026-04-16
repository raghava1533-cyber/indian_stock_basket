# 📊 MongoDB Atlas Setup - Complete Guide

## Create Free MongoDB Cluster (5 minutes)

### Step 1: Go to MongoDB Atlas
**URL:** https://www.mongodb.com/cloud/atlas

Click **"Try Free"** button

### Step 2: Create Account
Fill in the form:
```
Email: your_email@gmail.com
Password: Create a strong password
Confirm Password: Repeat
```

Check the boxes:
- ☑ I agree to the MongoDB Cloud Terms of Service
- ☑ I want to receive updates

Click **"Create an account"**

**Verify your email:** MongoDB will send you a verification email. Click the link in your inbox.

### Step 3: Complete Your Profile
After email verification, you'll see questions:
```
What are you building? → "Building an application" or "Learning"
What's your goal? → "Explore and learn"
Team size? → "Just me"
```

Click **"Finish"**

### Step 4: Create Organization (if needed)
- Organization Name: `Indian Stock Basket`
- Click **"Create Organization"**

### Step 5: Create Project
- Project Name: `Stock Basket Project`
- Click **"Create Project"**

### Step 6: Deploy Your Cluster
You'll see a "Deploy your first database" screen.

Click **"Build a Database"**

**Choose Deployment Type:**
```
☑ Shared
  └─ Recommended for learning and exploring
```

**Choose Cluster Tier:**
```
☑ M0 Cluster (Free Forever)
  - 512 MB Storage
  - Shared RAM
  - Basic Authentication
```

**Select Cloud Provider & Region:**
```
Provider: AWS (or your choice)
Region: Choose closest to you
  - Singapore (Singapore region)
  - Oregon (US region)
  - Frankfurt (EU region)
```

**Cluster Name:**
```
stock-basket-cluster
```

Click **"Create Deployment"**

⏳ **Wait 2-3 minutes** for cluster to finish creating

You'll see: "Deployment in progress" → "Your cluster is provisioned and ready to use"

### Step 7: Create Database User
After cluster is ready, click **"Create a Database User"**

**Database User Settings:**
```
Username: stockuser
Password: MySecure$Pass123
(Create your own strong password and save it!)

Authentication Method: Password
```

Click **"Create User"**

✅ User created

### Step 8: Whitelist IP Address
Click **"Finish and Close"** or go to **"Network Access"** section

Click **"Add IP Address"**

**Quick Settings:**
```
☑ Allow access from anywhere (0.0.0.0/0)
```

This allows your Render backend to connect.

Click **"Confirm"**

### Step 9: Get Connection String
1. Go back to Clusters view
2. Click **"Connect"** on your cluster
3. Select **"Connect your application"**
4. Choose **"Driver"**: Node.js
5. Choose **"Version"**: 5.x or later
6. Copy the connection string

**Example you'll see:**
```
mongodb+srv://stockuser:<password>@stock-basket-cluster.abcde.mongodb.net/?retryWrites=true&w=majority
```

### Step 10: Prepare Final Connection String
Replace `<password>` with your actual password:

**BEFORE:**
```
mongodb+srv://stockuser:<password>@stock-basket-cluster.abcde.mongodb.net/?retryWrites=true&w=majority
```

**AFTER (your actual string):**
```
mongodb+srv://stockuser:MySecure$Pass123@stock-basket-cluster.abcde.mongodb.net/?retryWrites=true&w=majority
```

**Add database name at the end:**
```
mongodb+srv://stockuser:MySecure$Pass123@stock-basket-cluster.abcde.mongodb.net/indian-stock-basket?retryWrites=true&w=majority
```

✅ **This is your MONGODB_URI for Render!**

---

## 📋 Reference: Your Credentials

Save this information somewhere secure (password manager, etc.):

```
SERVICE: MongoDB Atlas

MongoDB Atlas Account Email: your_email@gmail.com
MongoDB Atlas Account Password: [your account password]

Database User: stockuser
Database Password: MySecure$Pass123

Cluster Name: stock-basket-cluster
Connection String: mongodb+srv://stockuser:MySecure$Pass123@stock-basket-cluster.abcde.mongodb.net/indian-stock-basket?retryWrites=true&w=majority
```

---

## 🔍 Verify Setup Works

### Test Connection (Optional)
1. Go to MongoDB Atlas Dashboard
2. Click your cluster name
3. Click **"Collections"** tab
4. Should see message: "Create your first collection" or empty
5. ✅ Connection works!

---

## ✅ Troubleshooting

### Problem: Connection timeout
**Solution:**
- Check IP whitelist includes 0.0.0.0/0
- Verify username and password are correct
- Wait a few minutes after whitelist change

### Problem: "IP not allowed"
**Solution:**
- Go to Network Access
- Add IP Address: 0.0.0.0/0
- Confirm

### Problem: "Authentication failed"
**Solution:**
- Check username: `stockuser`
- Check password: matches what you entered
- Verify no extra spaces in connection string

### Problem: Database won't create data
**Solution:**
- Verify `indian-stock-basket` is in connection string
- Check database user has "Atlas Admin" role

---

## 📊 What's Included in Free Tier

```
✅ 512 MB Storage
✅ Shared RAM
✅ Unlimited API access
✅ Unlimited IP whitelist
✅ Basic authentication (username/password)
✅ One shared cluster
✅ 99.5% uptime SLA
✅ Automatic backups (limited)
```

Enough for testing and small-scale applications!

---

## 🚀 Next Steps

1. ✅ MongoDB Atlas cluster created
2. ✅ Database user created
3. ✅ IP whitelist configured
4. ✅ Connection string obtained

**Your next action:**
Go to Render.com and use this connection string in the `MONGODB_URI` environment variable.

---

## 📚 Additional Resources

- MongoDB Atlas Documentation: https://docs.mongodb.com/atlas/
- Connection String Reference: https://docs.mongodb.com/manual/reference/connection-string/
- Troubleshooting: https://docs.mongodb.com/atlas/troubleshoot-connection/

---

**Estimated Setup Time:** 5-10 minutes

**Cost:** FREE forever (M0 tier)

**You're all set! 🎉**
