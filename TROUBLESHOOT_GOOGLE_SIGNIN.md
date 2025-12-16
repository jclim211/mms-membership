# Troubleshooting Google Sign-In

## 🔍 Debug Steps

I've added detailed logging to help diagnose the issue. Follow these steps:

### Step 1: Check Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to the **Console** tab
3. Try signing in with Google again
4. Look for messages starting with 🔍, 📄, 📋, ✅, or ❌

**What to look for:**

```
🔍 Checking admin approval for: your@email.com
📄 Document exists: true/false
📋 Document data: {...}
✅ Approved status: true/false
```

---

### Step 2: Verify Firestore Document Structure

Your admin document in Firestore **MUST** have this exact structure:

**Document ID**: `your@email.com` (exactly as it appears in Google)

**Fields**:

```javascript
{
  email: "your@email.com",      // Type: string
  approved: true,                // Type: boolean (NOT string "true")
  approvedBy: "system",          // Type: string
  approvedAt: "2025-12-16T..."   // Type: string
}
```

⚠️ **Common Mistakes:**

1. **Wrong Document ID**:

   - ❌ Using a random ID like `abc123`
   - ✅ Use your EXACT email as the Document ID

2. **Wrong Field Type**:

   - ❌ `approved: "true"` (string)
   - ✅ `approved: true` (boolean)

3. **Email Mismatch**:
   - ❌ `admin@gmail.com` in Firestore but signing in with `admin@googlemail.com`
   - ✅ Must match exactly (check console logs for exact email)

---

### Step 3: Manual Verification in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database**
4. Look for the `admins` collection
5. Find the document with your email

**Check:**

- [ ] Collection name is exactly `admins` (lowercase, plural)
- [ ] Document ID matches your Google account email exactly
- [ ] Field `approved` is boolean `true` (has toggle icon, not quotes)
- [ ] Field `email` matches the Document ID

---

### Step 4: Check Firestore Security Rules

Make sure your Firestore rules allow reading the admins collection:

1. Go to **Firestore Database** > **Rules** tab
2. Check if you have this rule:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read admins collection
    match /admins/{email} {
      allow read: if request.auth != null;
      allow write: if false;
    }

    match /members/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

⚠️ **Important**: Without the `allow read` rule, the code cannot check if you're approved!

---

### Step 5: Quick Fix - Create Document Correctly

If your document is set up wrong, delete it and recreate:

**Using Firebase Console:**

1. Delete the existing document (if any)
2. Click **"Start collection"** or **"Add document"**
3. Collection ID: `admins`
4. Document ID: **Enter your EXACT Google email** (e.g., `john.doe@gmail.com`)
5. Add fields:

| Field Name | Field Type  | Field Value              |
| ---------- | ----------- | ------------------------ |
| email      | string      | john.doe@gmail.com       |
| approved   | **boolean** | true (toggle ON)         |
| approvedBy | string      | system                   |
| approvedAt | string      | 2025-12-16T12:00:00.000Z |

6. Click **Save**

---

### Step 6: Test with Console Commands

After creating the document, test it manually:

1. Open browser console while on the login page
2. Run this command:

```javascript
// Import Firestore functions
const { getDoc, doc } = await import("firebase/firestore");
const { db } = await import("./src/services/firebase.js");

// Test the exact function
const email = "your@email.com"; // Replace with your email
const adminDoc = await getDoc(doc(db, "admins", email));

console.log("Document exists:", adminDoc.exists());
if (adminDoc.exists()) {
  console.log("Document data:", adminDoc.data());
  console.log("Approved:", adminDoc.data().approved === true);
}
```

**Expected Output:**

```
Document exists: true
Document data: { email: "...", approved: true, ... }
Approved: true
```

---

## 🎯 Most Common Issues & Solutions

### Issue 1: "Document exists: false"

**Cause**: Document ID doesn't match your email

**Solution**:

1. Check the console log for the exact email being checked
2. Make sure the Firestore document ID matches EXACTLY
3. Some Google accounts have aliases (gmail.com vs googlemail.com)

---

### Issue 2: "Approved: false"

**Cause**: The `approved` field is a string instead of boolean

**Solution**:

1. Go to Firestore Console
2. Find your admin document
3. Click on the `approved` field
4. Change type to **boolean**
5. Toggle to **true**

---

### Issue 3: Error in console about permissions

**Cause**: Firestore security rules not set up

**Solution**:

1. Go to Firestore Database > Rules
2. Add the rule from Step 4 above
3. Click **Publish**

---

### Issue 4: Collection doesn't exist

**Cause**: You haven't created the `admins` collection yet

**Solution**: Follow Step 5 to create it properly

---

## 🚀 Quick Test

After fixing, try this:

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Refresh the page**
3. **Open Console** (F12)
4. **Click "Sign in with Google"**
5. **Watch the console logs**

You should see:

```
🔍 Checking admin approval for: your@email.com
📄 Document exists: true
📋 Document data: {email: "...", approved: true, ...}
✅ Approved status: true
```

Then you should be redirected to the dashboard! ✅

---

## 📞 Still Having Issues?

Share the console output with me, and I'll help you debug further. The emoji logs will tell us exactly what's happening!

**What to share:**

1. The complete console log (all lines with 🔍📄📋✅❌)
2. Screenshot of your Firestore document
3. The exact error message you see

---

## 💡 Pro Tip: Email Case Sensitivity

Google emails are case-insensitive, but Firestore document IDs are case-sensitive!

- If you sign in with `John.Doe@Gmail.com`
- But the document ID is `john.doe@gmail.com`
- It won't match!

**Solution**: Always use lowercase for document IDs, or check the console log for the exact email format.
