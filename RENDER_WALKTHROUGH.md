# RENDER DEPLOYMENT - STEP-BY-STEP WALKTHROUGH

## You are here: Connected repo to Render ✅

Now you see a form on Render. Follow these exact steps:

---

## STEP 1: Fill Basic Info (30 seconds)

On the form you see, look for these fields and fill them:

```
Field: Name
Enter: stock-basket-api

Field: Environment
Select: Node (or already selected)

Field: Branch
Value: main (or already selected)

Field: Root Directory
Enter: backend

Field: Build Command
Enter: cd backend && npm install

Field: Start Command
Enter: npm start
```

✅ Once filled, scroll down to Environment Variables section.

---

## STEP 2: Get Prerequisites (10 minutes)

### Part A: MongoDB Connection String

**YOU DO:**
1. Open new tab: https://www.mongodb.com/cloud/atlas
2. Click "Sign Up" or "Sign In"
3. Create account if needed
4. Click "Create" → "Cluster"
5. Select M0 Cluster (Free)
6. Wait for cluster creation (2-3 min)
7. Click "Connect"
8. Click "Connect your application" 
9. Copy the connection string

**YOU GET:**
Example format: `mongodb+srv://myusername:mypassword@cluster0.abc123.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`

**MODIFY IT:**
- Replace `<username>` with your database user
- Replace `<password>` with your database password
- Replace `myFirstDatabase` with `indian-stock-basket`
- Final: `mongodb+srv://user:password@cluster0.abc123.mongodb.net/indian-stock-basket`

### Part B: Gmail App Password

**YOU DO:**
1. Open new tab: https://myaccount.google.com/security
2. Scroll to "2-Step Verification"
3. Click it and enable (if not already enabled)
4. Go to: https://myaccount.google.com/apppasswords
5. Select "Mail" → "Windows Computer"
6. Google generates 16-character password

**YOU GET:**
Example: `abcd efgh ijkl mnop` (with spaces)

**CLEAN IT:**
Remove all spaces: `abcdefghijklmnop`

---

## STEP 3: Add Environment Variables on Render

Back on Render form, find "Environment Variables" section.

**ADD VARIABLE #1:**
```
Key: MONGODB_URI
Value: mongodb+srv://your_user:your_password@cluster0.xyz.mongodb.net/indian-stock-basket
(Use the connection string from Step 2 Part A)
```
Click "Add" button

**ADD VARIABLE #2:**
```
Key: EMAIL_USER
Value: your_email@gmail.com
(Your Gmail address)
```
Click "Add" button

**ADD VARIABLE #3:**
```
Key: EMAIL_PASSWORD
Value: abcdefghijklmnop
(The 16 characters from Step 2 Part B, NO SPACES)
```
Click "Add" button

**ADD VARIABLE #4:**
```
Key: JWT_SECRET
Value: your_super_secret_key_12345
(Any random string - keep it secret)
```
Click "Add" button

**ADD VARIABLE #5:**
```
Key: NODE_ENV
Value: production
```
Click "Add" button

**ADD VARIABLE #6:**
```
Key: FRONTEND_URL
Value: [leave empty - we'll update after Vercel]
```
Click "Add" button

✅ All 6 variables added!

---

## STEP 4: DEPLOY!

1. Scroll to bottom of form
2. Look for blue button "Deploy" or "Create Web Service"
3. **CLICK IT**
4. You'll see logs scrolling
5. Wait for message: **"=== Service is live"**
6. ✅ DONE! Your backend is deployed!

---

## STEP 5: Get Your API URL

After deployment:
1. On Render dashboard, click your service "stock-basket-api"
2. At the top, you'll see a URL like: `https://stock-basket-api.onrender.com`
3. **COPY THIS URL** - you need it for Vercel deployment

---

## TESTING (Optional)

Test if your API works:
1. Open browser
2. Go to: `https://your-api.onrender.com/health`
   (Replace `your-api` with your actual URL)
3. Should see: `{"status":"Server is running","timestamp":"..."}`

---

## NEXT: Deploy Frontend on Vercel

Once you have your API URL from Step 5:
1. Go to https://vercel.com
2. Sign up with GitHub
3. Import repository
4. Set build command: `cd frontend && npm run build`
5. Set root directory: `frontend`
6. Add environment variable: `REACT_APP_API_URL=https://your-api.onrender.com/api`
7. Deploy

---

## CHECKLIST

- [ ] Step 1: Filled basic info on Render form
- [ ] Step 2 Part A: Got MongoDB connection string
- [ ] Step 2 Part B: Got Gmail app password (cleaned)
- [ ] Step 3: Added all 6 environment variables on Render
- [ ] Step 4: Clicked Deploy button
- [ ] Step 5: Copied your API URL
- [ ] Testing: API responds with health check
- [ ] Next: Deploy on Vercel with API URL

---

## ERRORS? CHECK THESE

**"Build failed" error:**
- Check build logs
- Verify Root Directory is `backend`
- Verify Build Command is exactly: `cd backend && npm install`

**"Cannot connect to MongoDB" error:**
- Check MONGODB_URI is correct
- Verify MongoDB Atlas cluster is running
- Check username/password in connection string

**"Emails not sending" error:**
- Verify EMAIL_PASSWORD is app password (not regular password)
- Remove spaces from EMAIL_PASSWORD
- Check EMAIL_USER is correct Gmail

**Still stuck?**
- Contact Render support: https://render.com/docs
- Check logs on Render dashboard

---

## YOU'RE ALMOST THERE! 🚀

Just follow this step-by-step and your backend will be live!

Then deploy frontend on Vercel and you're done!
