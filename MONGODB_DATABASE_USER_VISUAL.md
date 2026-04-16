# 📋 MongoDB Atlas - Database Access User Creation (Visual Guide)

## Quick Navigation Guide

### Where to Find "Database Access"

**Current Location:** You're at https://cloud.mongodb.com

**Navigation Path:**
```
Step 1: Click your Project
        ↓
Step 2: Look at LEFT SIDEBAR
        ↓
Step 3: Find "Database Access"
        ↓
Step 4: Click "Add New Database User"
```

---

## VISUAL LOCATION MAP

```
┌─────────────────────────────────────────────────────────────┐
│ MongoDB Atlas Dashboard (at top)                            │
│ [Logo] ≡ [Search] [Alerts] [Account]                       │
└─────────────────────────────────────────────────────────────┘
│
├─ LEFT SIDEBAR (this is what you need to find)
│  │
│  ├─ ☐ Overview
│  ├─ ☐ Deployment
│  ├─ ☐ Database
│  ├─ ☑ Database Access ← YOU ARE HERE
│  ├─ ☐ Network Access
│  ├─ ☐ Backup
│  ├─ ☐ ...other options...
│  │
│
├─ MAIN CONTENT AREA (right side)
│  │
│  ├─ "Database Users" heading
│  │
│  ├─ [+ Add New Database User] ← GREEN BUTTON
│  │
│  └─ List of users (currently empty)
│
```

---

## Step-by-Step: Create Database User

### STEP 1: Find the "Add New Database User" Button

**Location:** Top right of the main content area

**What it looks like:** 
- Green button
- Text: "+ Add New Database User"
- Located next to filters/search

**IF YOU DON'T SEE IT:**
1. Make sure you clicked "Database Access" in left menu
2. If sidebar is collapsed, click **≡** (three horizontal lines) at top left
3. Then click "Database Access"

---

### STEP 2: Click the Green Button

Click **"+ Add New Database User"**

A form will appear:

```
┌─────────────────────────────────────────┐
│ Add Database User                       │
├─────────────────────────────────────────┤
│                                         │
│ Authentication Method:                  │
│ [Dropdown: Password ▼]                  │
│                                         │
│ Username:                               │
│ [Text Box: ____________]                │
│                                         │
│ Password:                               │
│ [Text Box: ____________]                │
│                                         │
│ Confirm Password:                       │
│ [Text Box: ____________]                │
│                                         │
│ Built-in Role:                          │
│ [Dropdown: Select Role ▼]               │
│                                         │
│ [Cancel] [Create User]                  │
│                                         │
└─────────────────────────────────────────┘
```

---

### STEP 3: Fill in the Form

#### FIELD 1: Authentication Method
```
Dropdown: Password (should be default)
Action: Leave as is (or click and select "Password")
```

#### FIELD 2: Username
```
Click in Username box
Type: stockuser
Result: Username: stockuser
```

#### FIELD 3: Password
```
Click in Password box
Type: MySecure$Pass123
(or your own strong password)
Result: Password: MySecure$Pass123
```

**Strong Password Tips:**
- At least 8 characters
- Mix of uppercase, lowercase, numbers, special characters
- Example: `MySecure$Pass123`

#### FIELD 4: Confirm Password
```
Click in Confirm Password box
Type: MySecure$Pass123
(same as password above)
Result: Confirm Password: MySecure$Pass123
```

#### FIELD 5: Built-in Role
```
Click on Dropdown that says "Select Role"
Select: Atlas Admin
Result: Built-in Role: Atlas Admin
```

---

### STEP 4: Click "Create User"

**Location:** Bottom of form, right side

**Button:** Blue or green "Create User" button

**Click it!**

⏳ **Wait a few seconds** for the user to be created.

---

## ✅ Success Confirmation

After clicking "Create User", you should see:

```
✓ Database user "stockuser" has been created
```

Or a success message at top of page.

The new user should now appear in the list below:

```
Database Users
└─ stockuser (Atlas Admin role)
```

---

## 🔒 Save Your Credentials

**IMPORTANT:** Write these down and save them safely:

```
MongoDB Username: stockuser
MongoDB Password: MySecure$Pass123
```

**Where to keep it:**
- Password manager (recommended)
- Secure text file on your computer
- Write on paper (if no digital storage)

**DO NOT:**
- Share with anyone
- Commit to git
- Post on public sites
- Forget (you'll need it for connection string)

---

## ❌ If Something Goes Wrong

### Error: "Dropdown shows different options"
**Solution:**
- Ensure "Password" is selected in Authentication Method
- If it shows "LDAP" or "X.509", click dropdown and select "Password"

### Error: "Can't find "Built-in Role" dropdown"
**Solution:**
- Scroll down in the form
- The role dropdown might be below
- Look for field labeled "Built-in Role"

### Error: "Button says "Finish" instead of "Create User""
**Solution:**
- This is normal - MongoDB sometimes shows different button labels
- Click it anyway - it will create the user

### Error: "Form closes without creating user"
**Solution:**
1. Try again
2. Check password requirements (may need longer/more complex)
3. Ensure both password fields match exactly
4. Click the actual "Create User" button (not outside form)

### Error: "User "stockuser" already exists"
**Solution:**
1. The user is already created - this is fine!
2. Skip to next step: Get Connection String
3. Your user is ready to use

---

## ✅ After User is Created

**What to do next:**

1. Verify user appears in the list ✅
2. Go to **"Database"** section (left sidebar)
3. Find your cluster: **stock-basket-cluster**
4. Click **"Connect"** button
5. Select **"Connect your application"**
6. Choose **"Node.js"** as driver
7. Copy the connection string
8. Replace `<username>` with: **stockuser**
9. Replace `<password>` with: **MySecure$Pass123**
10. Add database name: **indian-stock-basket**

**Final Connection String Format:**
```
mongodb+srv://stockuser:MySecure$Pass123@stock-basket-cluster.xyz.mongodb.net/indian-stock-basket?retryWrites=true&w=majority
```

(Replace `xyz` with your actual cluster ID)

---

## 📊 Complete Checklist

- [ ] Navigated to MongoDB Atlas Dashboard
- [ ] Found left sidebar menu
- [ ] Clicked "Database Access"
- [ ] Clicked "+ Add New Database User"
- [ ] Entered Username: stockuser
- [ ] Entered Password: MySecure$Pass123
- [ ] Confirmed Password: MySecure$Pass123
- [ ] Selected Built-in Role: Atlas Admin
- [ ] Clicked "Create User"
- [ ] Saw success message
- [ ] User appears in list
- [ ] Saved credentials safely
- [ ] Ready to get connection string

---

## 🎯 Still Stuck?

If you can't find Database Access:

**Tell me what you see:**
1. Are you on https://cloud.mongodb.com?
2. Do you see a left sidebar menu?
3. What items are listed in the left sidebar?
4. Is your cluster showing as "Provisioned" (green checkmark)?
5. What is your current location/page?

**Provide this info and I can help more specifically!**

---

**Once user is created, move to getting your Connection String!** 🚀
