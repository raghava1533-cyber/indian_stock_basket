# 🔐 Gmail App Password Setup - Complete Guide

## Generate Gmail App Password (3 minutes)

### Important: This is DIFFERENT from your Gmail password
You need to use an **App Password**, not your regular Gmail password for email services.

### Step 1: Enable 2-Factor Authentication (if not already enabled)

**Go to:** https://myaccount.google.com/security

1. Click **"2-Step Verification"**
2. If not enabled:
   - Click **"Get Started"**
   - Follow the prompts to add your phone number
   - Verify with code sent to your phone
   - Click **"Activate 2-Step Verification"**

✅ 2FA is now enabled

### Step 2: Generate App Password

**Go to:** https://myaccount.google.com/apppasswords

You should see a dropdown asking you to select the app and device.

**Select App:**
```
Dropdown: Select app
Choose: Mail
```

**Select Device:**
```
Dropdown: Select device type
Choose: Windows Computer
(or your device type)
```

Click **"Generate"**

### Step 3: Copy Your App Password

Google will show you a 16-character password with spaces:

```
Example: abcd efgh ijkl mnop
```

**Copy this password**

### Step 4: Remove Spaces

The password has spaces in it. Remove them for use in Render:

**WITH SPACES (from Google):**
```
abcd efgh ijkl mnop
```

**WITHOUT SPACES (for use):**
```
abcdefghijklmnop
```

✅ **This is your EMAIL_PASSWORD for Render!**

---

## 📋 Reference: Your Gmail Credentials

```
SERVICE: Gmail (for email notifications)

Gmail Email Address: your_email@gmail.com
Gmail Account Password: [your regular Gmail password - do NOT use this]

App Password (for Render): abcdefghijklmnop
(16 characters, no spaces)
```

---

## 🔍 Verify Setup Works

### Test Email Configuration (Optional)
You can test in Render after deployment by:
1. Making a test API call to `/api/baskets/[id]/rebalance`
2. Checking if you receive rebalance notification email

---

## ✅ Troubleshooting

### Problem: "App Passwords" option not showing
**Causes:**
- 2-Factor Authentication is not enabled
- You're not using Google Account
- You're using a work Google account (may need admin approval)

**Solution:**
1. Go to https://myaccount.google.com/security
2. Enable "2-Step Verification"
3. Go back to https://myaccount.google.com/apppasswords
4. Try again

### Problem: Email not sending from backend
**Causes:**
- Wrong EMAIL_PASSWORD (using regular password instead of app password)
- EMAIL_USER doesn't match app password email
- Spaces in PASSWORD

**Solution:**
- Use app password (from apppasswords, not your Gmail password)
- Verify no spaces: `abcdefghijklmnop` (not `abcd efgh ijkl mnop`)
- Verify email matches: your_email@gmail.com

### Problem: "Less secure app access" error
**Note:** Google has deprecated this. Use App Passwords instead.

**Solution:**
- Never use "Less secure app access"
- Use App Password method (this guide)

---

## 🚀 Security Notes

✅ **Safe:**
- Using App Password (limited scope, can be revoked)
- One app password per service
- Can generate new password anytime

❌ **NOT Safe:**
- Sharing your regular Gmail password
- Using regular password in .env files
- Storing passwords in git repository

---

## 📚 Additional Resources

- Google Support: https://support.google.com/accounts/answer/185833
- App Passwords Help: https://support.google.com/accounts/answer/185833?hl=en
- Gmail API Documentation: https://developers.google.com/gmail/api/guides

---

## 📋 Checklist

- [ ] Go to https://myaccount.google.com/security
- [ ] Enable 2-Factor Authentication (if needed)
- [ ] Go to https://myaccount.google.com/apppasswords
- [ ] Select App: Mail, Device: Windows Computer
- [ ] Click Generate
- [ ] Copy the 16-character password
- [ ] Remove all spaces
- [ ] Save as EMAIL_PASSWORD for Render

---

**Estimated Setup Time:** 3-5 minutes

**Cost:** FREE

**You're all set! 🎉**
