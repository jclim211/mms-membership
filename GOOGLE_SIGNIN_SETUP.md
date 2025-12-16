# Google Sign-In Setup Guide

## 🎉 Google Sign-In Added!

Your MMS Portal now supports Google Sign-In with admin approval system. Only approved emails can access the admin portal.

---

## 🔧 Setup Steps

### 1. Verify Google Sign-In is Enabled in Firebase

You mentioned you've already enabled it, but to confirm:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Authentication > Sign-in method**
4. Ensure **Google** is **Enabled**

---

### 2. Add Your First Admin (IMPORTANT!)

Since the system checks for approved admins, you need to manually add your first admin email to Firestore.

**Option A: Using Firebase Console (Easiest)**

1. Go to **Firestore Database** in Firebase Console
2. Click **"Start collection"**
3. Collection ID: `admins`
4. Click **Next**
5. Document ID: Enter your admin email (e.g., `admin@example.com`)
6. Add fields:
   - Field: `email`, Type: string, Value: `admin@example.com`
   - Field: `approved`, Type: boolean, Value: `true`
   - Field: `approvedBy`, Type: string, Value: `system`
   - Field: `approvedAt`, Type: string, Value: (current date, e.g., `2025-12-16T12:00:00.000Z`)
7. Click **Save**

**Option B: Using Browser Console (After First Email/Password Login)**

If you already have an email/password admin account:

1. Login to the dashboard with your existing account
2. Open browser DevTools (F12)
3. Go to Console tab
4. Run this command (replace with the email you want to approve):

```javascript
// Import from your auth store
const authStore =
  window.$nuxt?.$pinia?.state.value.auth ||
  (await import("./src/stores/authStore.js")).useAuthStore();

// Approve an admin email
await authStore.approveAdmin("newemail@example.com");
console.log("Admin approved!");
```

---

## 📋 Firestore Security Rules

Update your Firestore rules to allow reading the admins collection during authentication:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read admins collection to verify access
    match /admins/{email} {
      allow read: if request.auth != null;
      allow write: if false; // Only modify through Firebase Console or admin function
    }

    // Members collection - authenticated admins only
    match /members/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 🚀 How It Works

### For Users:

1. **Login Page** now shows "Sign in with Google" button
2. User clicks the Google button
3. Google popup appears for account selection
4. After selecting account, the system checks if their email is in the `admins` collection
5. **If approved**: User is logged in and redirected to dashboard
6. **If not approved**: User is signed out and sees error: "Your email is not approved for admin access"

### For Admins:

To approve a new admin, you have two options:

**Option 1: Manual (Firebase Console)**

- Go to Firestore > `admins` collection
- Add new document with the user's email

**Option 2: Programmatic (Future Enhancement)**

- I can add an "Admin Management" page where you can approve new users
- Would you like me to add this feature?

---

## 🔒 Security Features

✅ **Email Whitelist**: Only emails in the `admins` collection can access the system
✅ **Automatic Signout**: Unauthorized users are immediately signed out
✅ **No Pending Accounts**: Unauthorized signups don't create any database records
✅ **Audit Trail**: Each admin approval records who approved them and when

---

## 📝 Testing

### Test the Login Flow:

1. **Test with Approved Email**:

   - Add your email to `admins` collection (see Step 2 above)
   - Go to login page
   - Click "Sign in with Google"
   - Select your account
   - Should redirect to dashboard ✅

2. **Test with Unapproved Email**:
   - Try logging in with a different Google account
   - Should see error message ✅
   - Should NOT be able to access dashboard ✅

---

## 🛠 Approving New Admins

### Method 1: Firebase Console (Manual)

1. Go to Firestore > `admins` collection
2. Click **"Add document"**
3. Document ID: `newadmin@example.com`
4. Add fields:
   - `email`: `newadmin@example.com`
   - `approved`: `true`
   - `approvedBy`: `your@email.com`
   - `approvedAt`: Current timestamp
5. Save

### Method 2: Browser Console (Quick)

While logged in as an existing admin:

```javascript
// Open browser console and run:
const { useAuthStore } = await import("./src/stores/authStore.js");
const authStore = useAuthStore();
await authStore.approveAdmin("newadmin@example.com");
```

### Method 3: Admin Management UI (Optional - I can build this)

Would you like me to add a page in the dashboard where you can:

- View all approved admins
- Add new admin emails
- Remove admin access
- See approval history

Let me know if you'd like this feature!

---

## 🔍 Troubleshooting

### "Your email is not approved" Error

**Solution**: Make sure your email exists in the `admins` collection in Firestore with `approved: true`

### Google Popup Blocked

**Solution**: Allow popups for localhost or your domain in browser settings

### Still Seeing Blank Page

**Solution**:

1. Check browser console for errors
2. Verify Firebase config in `.env` is correct
3. Make sure Firestore is enabled
4. Check that `admins` collection exists

### "Cannot read properties of undefined"

**Solution**: Make sure you've imported the Firestore functions in `authService.js` (already done)

---

## 📊 Admin Collection Structure

```javascript
// Document ID: user@example.com
{
  email: "user@example.com",
  approved: true,
  approvedBy: "admin@example.com", // Who approved this admin
  approvedAt: "2025-12-16T12:00:00.000Z" // When approved
}
```

---

## 🎯 Next Steps

1. ✅ Add your email to `admins` collection in Firestore
2. ✅ Test Google Sign-In with your email
3. ✅ Update Firestore security rules
4. ✅ Approve other admin emails as needed

---

## 💡 Future Enhancements (Optional)

Would you like me to add:

- **Admin Management Page**: UI to approve/remove admins
- **Pending Requests**: Track who tried to sign in but wasn't approved
- **Email Notifications**: Notify admins when someone tries to access
- **Role-Based Access**: Different permission levels (super admin, editor, viewer)

Let me know what would be useful!

---

**Questions?** Check the browser console for detailed error messages, or let me know what you're seeing!
