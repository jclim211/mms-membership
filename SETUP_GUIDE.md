# Quick Start Guide - MMS Portal

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Setup Firebase

1. **Create Firebase Project**

   - Go to https://console.firebase.google.com/
   - Click "Add project"
   - Follow the wizard to create your project

2. **Enable Authentication**

   - In Firebase Console, go to **Build > Authentication**
   - Click "Get started"
   - Enable **Email/Password** provider
   - Click "Save"

3. **Enable Firestore**

   - In Firebase Console, go to **Build > Firestore Database**
   - Click "Create database"
   - Choose "Start in test mode" (for development)
   - Select your preferred location
   - Click "Enable"

4. **Get Firebase Configuration**

   - Go to **Project Settings** (gear icon) > **General**
   - Scroll to "Your apps"
   - Click the web icon `</>`
   - Register your app with a nickname (e.g., "MMS Admin Portal")
   - Copy the `firebaseConfig` object

5. **Update Configuration**
   - Open `src/services/firebase.js`
   - Replace the placeholder config with your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...", // Your actual values
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
};
```

### Step 3: Create Admin Account

1. In Firebase Console, go to **Authentication > Users**
2. Click "Add user"
3. Enter:
   - Email: `admin@yourdomain.com`
   - Password: Choose a secure password
4. Click "Add user"

### Step 4: Run the Application

```bash
npm run dev
```

Open your browser to http://localhost:5173

### Step 5: Login

- Use the email and password you created in Step 3
- You're in! Start adding members.

---

## 📋 Quick Feature Tour

### Adding Your First Member

1. Click the blue **"Add Member"** button
2. Fill in the required fields:

   - Campus ID (e.g., 01234567)
   - Full Name
   - Admit Year
   - Student Status
   - Membership Type
   - School
   - School Email

3. Optional: Add ISM attendance, tracks, or dynamic fields
4. Click **"Add Member"**

### Understanding Subsidy Rates

The system automatically calculates the next subsidy rate:

- **Associate Members**: Always 10%
- **Ordinary B Members**: 70% (first ISM), then 10%
- **Ordinary A Members**:
  - First ISM: 90%
  - Second ISM: 70%
  - Third ISM: 50%
  - After: 10%

The rate is displayed in the "Next Subsidy" column and automatically applied when you add ISM attendance.

### Exporting Data

Click the green **"Export to Excel"** button to download all member data including:

- Personal information
- Membership details
- Complete ISM attendance history
- All custom fields

---

## 🔒 Production Deployment (Firebase Hosting)

### One-Time Setup

1. Install Firebase CLI:

```bash
npm install -g firebase-tools
```

2. Login:

```bash
firebase login
```

3. Initialize hosting:

```bash
firebase init hosting
```

- Select your Firebase project
- Public directory: `dist`
- Single-page app: `Yes`
- GitHub integration: `No` (or `Yes` if you want CI/CD)

### Deploy Updates

```bash
npm run build
firebase deploy
```

Your site will be live at `https://your-project.web.app`

---

## 🛡️ Security: Update Firestore Rules

⚠️ **Important**: Before going to production, update your Firestore security rules.

1. Go to **Firestore Database > Rules** in Firebase Console
2. Replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /members/{document=**} {
      // Only authenticated users can read/write
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click "Publish"

This ensures only logged-in admins can access member data.

---

## 💡 Tips & Best Practices

### Managing Admin Users

- Create admin accounts directly in Firebase Console > Authentication
- Don't share admin credentials
- Use strong passwords

### Data Backup

- Firebase automatically backs up your Firestore data
- Use "Export to Excel" regularly for local backups

### Adding Custom Fields

- Use the "Additional Fields" section in the member form
- Perfect for one-off data like "Dietary Restrictions" or "Emergency Contact"

### ISM Subsidy Tracking

- Always add ISM attendance through the modal (not manually in Firestore)
- The system will automatically calculate and save the correct subsidy rate
- Subsidy history is preserved even if membership type changes

---

## 🐛 Common Issues

### "Firebase not initialized" error

- Check that your Firebase config in `src/services/firebase.js` is correct
- Verify all config values are strings (wrapped in quotes)

### Can't login

- Ensure Email/Password authentication is enabled in Firebase Console
- Verify you created the admin user in Firebase Authentication
- Check browser console for specific error messages

### Members not loading

- Check Firestore is enabled
- Verify security rules allow authenticated access
- Check browser console for Firestore errors

### Build fails

- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Ensure Node.js version is 20.19+ or 22.12+

---

## 📞 Need Help?

Check the main README.md for detailed documentation, or:

1. Check the Firebase Console for errors
2. Open browser Developer Tools (F12) and check the Console tab
3. Verify all setup steps were completed

---

Built with ❤️ using Vue 3 + Firebase
