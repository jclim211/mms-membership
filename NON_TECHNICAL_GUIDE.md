# Non-Technical User Guide & Troubleshooting

**For users with minimal coding knowledge**

This guide will help you maintain, troubleshoot, and make basic updates to the MMS (Membership Management System) without needing deep technical knowledge.

---

## 📋 Table of Contents

1. [Understanding Your System](#understanding-your-system)
2. [Using VS Code](#using-vs-code)
3. [Common Issues & Solutions](#common-issues--solutions)
4. [Making Simple Updates](#making-simple-updates)
5. [Emergency Procedures](#emergency-procedures)
6. [Getting Help](#getting-help)

---

## Understanding Your System

### What is this system?

The MMS is a web application that helps you manage club member information. It's made of:

- **Frontend (What you see)**: The website interface built with Vue.js
- **Backend (The database)**: Firebase stores all member data
- **VS Code**: The editor you use to view and edit code

### Important Files You Should Know

```
mms-membership/
├── src/
│   ├── views/
│   │   └── DashboardView.vue    ← Main page with member table
│   ├── components/
│   │   ├── MemberModal.vue      ← Add/Edit member form
│   │   ├── BulkImportModal.vue  ← Bulk upload feature
│   │   └── BulkImportHelp.vue   ← Help text for bulk import
│   ├── services/
│   │   └── firebase.js          ← Firebase configuration (API keys)
│   ├── utils/
│   │   └── bulkImport.js        ← Excel template & import logic
│   └── stores/
│       └── memberStore.js       ← Member data management
├── .firebaserc                   ← Firebase project settings
└── firebase.json                 ← Firebase deployment settings
```

---

## Using VS Code

### Opening Your Project

1. **Open VS Code**
2. **File → Open Folder**
3. Navigate to your project folder (e.g., `mms-membership`)
4. Click "Select Folder"

### Understanding the Interface

```
┌─────────────────────────────────────────┐
│  File  Edit  View  Terminal  Help      │  ← Top Menu
├────────┬────────────────────────────────┤
│ Files  │                                │
│ 📁 src │  Your code appears here       │  ← Main Editor
│ 📁 pub │                                │
│ 📄 pkg │                                │
├────────┴────────────────────────────────┤
│ > Terminal (PowerShell)                 │  ← Command Line
│                                          │
└──────────────────────────────────────────┘
```

### Opening the Terminal

- **Method 1**: Press `` Ctrl + ` `` (backtick key, top-left of keyboard)
- **Method 2**: Menu → Terminal → New Terminal
- **Method 3**: Click "Terminal" at bottom of screen

### Basic Terminal Commands

```powershell
# View files in current folder
Get-ChildItem

# Change to project folder (if not already there)
cd 'path\to\your\mms-membership'

# Start development server (test locally)
npm run dev

# Build for production
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

---

## Common Issues & Solutions

### Issue 1: Website Not Loading

**Symptoms**: Blank white page or "Cannot connect" error

**Solutions**:

1. **Check if dev server is running**

   ```powershell
   # In VS Code terminal
   npm run dev
   ```

   - Look for: `Local: http://localhost:5173`
   - Open that URL in your browser

2. **Clear browser cache**

   - Press `Ctrl + Shift + Delete`
   - Select "Cached images and files"
   - Click "Clear data"

3. **Restart everything**
   ```powershell
   # In terminal, press Ctrl+C to stop server
   # Then restart:
   npm run dev
   ```

### Issue 2: Changes Not Showing After Deploy

**Symptoms**: You deployed but the website looks the same

**Solutions**:

1. **Hard refresh the website**

   - Press `Ctrl + Shift + R` (Windows)
   - Or `Shift + F5`

2. **Check deployment status**

   ```powershell
   firebase deploy --only hosting
   ```

   - Wait for "Deploy complete!"
   - Check the URL shown

3. **Clear Firebase cache**
   - Wait 5-10 minutes for CDN to update
   - Try accessing from incognito/private window

### Issue 3: Bulk Import Not Working

**Symptoms**: Excel upload fails or shows errors

**Solutions**:

1. **Check Excel format**

   - Download a fresh template from the website
   - Copy your data to the new template
   - Make sure column headers are EXACT

2. **Required fields must be filled**:

   - Campus ID ✅
   - Full Name ✅
   - School Email ✅
   - School ✅
   - Admit Year ✅
   - Membership Type ✅

3. **Check for duplicates**
   - Each Campus ID must be unique
   - Search existing members first

### Issue 4: Login Not Working

**Symptoms**: "Invalid credentials" or can't sign in

**Solutions**:

1. **Check Firebase Console**

   - Go to: https://console.firebase.google.com/
   - Select your project: "mms-membership"
   - Click "Authentication" → "Users"
   - Verify your email exists

2. **Reset password**

   - In Firebase Console → Authentication → Users
   - Find your email → Click "⋮" → "Reset password"

3. **Check internet connection**
   - Firebase requires internet to authenticate

### Issue 5: Search Not Finding Members

**Symptoms**: Search returns no results for members you know exist

**Solutions**:

1. **Check search terms**

   - Search works for: Name, Campus ID, Email, Telegram handle
   - Try searching part of the name (e.g., "John" instead of "John Doe")

2. **Clear active filters**

   - Click the "Filters" button
   - Check if any filters are active
   - Click "Clear All Filters"

3. **Check spelling**
   - Names are stored in UPPERCASE
   - Emails are stored in lowercase

---

## Making Simple Updates

### Updating Help Text

**File**: `src/components/BulkImportHelp.vue`

1. Open the file in VS Code
2. Find the text you want to change
3. Edit it (keep the HTML tags around it)
4. Save: `Ctrl + S`
5. Deploy:
   ```powershell
   npm run build
   firebase deploy --only hosting
   ```

**Example**: Changing help text

```vue
<!-- BEFORE -->
<p class="text-sm text-gray-700 mb-2">
  Year of admission.
</p>

<!-- AFTER -->
<p class="text-sm text-gray-700 mb-2">
  Year of admission (e.g., 2024).
</p>
```

### Adding a New School

**File**: `src/utils/bulkImport.js`

1. Find the `schoolMap` section (around line 170)
2. Add your new school:

   ```javascript
   const schoolMap = {
     accountancy: "Accountancy",
     business: "Business",
     economics: "Economics",
     computing: "Computing & Information Systems",
     law: "Law",
     "social sciences": "Social Sciences",
     "college of integrative studies": "College of Integrative Studies",
     "new school name": "New School Name", // ← ADD THIS
   };
   ```

3. Save and deploy

### Changing the Backup Reminder Message

**File**: `src/views/DashboardView.vue`

1. Search for "Backup Reminder" (Ctrl + F)
2. Find this section:
   ```vue
   <p class="text-sm text-amber-700 mt-1">
     Always backup your data frequently by clicking 
     <span class="font-semibold">Export All</span> 
     to prevent data loss.
   </p>
   ```
3. Edit the message text
4. Save and deploy

### Updating Excel Template

**File**: `src/utils/bulkImport.js`

1. Find `downloadTemplate()` function (near top of file)
2. Update the `templateData` example:
   ```javascript
   const templateData = [
     {
       "Campus ID": "01234567",
       "Full Name": "JOHN DOE",
       // ... edit example values here
     },
   ];
   ```

---

## Emergency Procedures

### Site is Completely Broken

**What to do**:

1. **Don't Panic** - The data is safe in Firebase
2. **Check last deployment**:

   ```powershell
   # View recent changes
   git log --oneline -10
   ```

3. **Rollback to previous version**:
   ```powershell
   # Go to Firebase Console
   # Hosting → Release History
   # Click "Rollback" on a working version
   ```

### Lost Access to Firebase

**What to do**:

1. Check your Google account login
2. Verify you're added to the Firebase project
3. Contact the project owner to re-invite you

### Database Data Lost or Corrupted

**What to do**:

1. **Restore from backup**:

   - You should have Excel exports saved locally
   - Use "Bulk Import" to restore data

2. **Check Firestore Console**:

   - https://console.firebase.google.com/
   - Go to Firestore Database
   - Check if data exists there

3. **If data is truly lost**:
   - Import from your most recent Excel export
   - This is why the backup reminder exists!

---

## Getting Help

### Self-Help Resources

1. **Check existing documentation**:

   - [README.md](README.md) - General overview
   - [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Technical troubleshooting
   - [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Feature list

2. **Firebase Documentation**:

   - https://firebase.google.com/docs

3. **Vue.js Documentation**:
   - https://vuejs.org/guide/

### When to Ask for Technical Help

Ask for help if:

- ❌ The terminal shows RED error messages
- ❌ Firebase deploy fails repeatedly
- ❌ You need to add complex new features
- ❌ Database structure needs changing
- ❌ Security rules need updating

You can handle yourself:

- ✅ Changing text/labels
- ✅ Updating help messages
- ✅ Adding to dropdown lists
- ✅ Fixing typos
- ✅ Running standard commands

### How to Report Issues

When asking for help, provide:

1. **What were you trying to do?**

   - "I was trying to deploy to Firebase"

2. **What happened instead?**

   - "I got an error message"

3. **Error messages**:

   - Copy the FULL error from terminal
   - Include the red error text

4. **What you've tried**:

   - "I restarted VS Code"
   - "I cleared my cache"

5. **Screenshots**:
   - Screenshot of VS Code
   - Screenshot of browser error
   - Screenshot of Firebase Console

---

## Quick Reference Card

### Daily Tasks

| Task          | Command                                               |
| ------------- | ----------------------------------------------------- |
| Start working | `cd 'path\to\your\mms-membership'` then `npm run dev` |
| Test changes  | Open `http://localhost:5173` in browser               |
| Stop server   | Press `Ctrl + C` in terminal                          |
| Deploy        | `npm run build` then `firebase deploy --only hosting` |
| Export data   | Click "Export All" button on website                  |

### Emergency Commands

| Situation         | Command                                     |
| ----------------- | ------------------------------------------- |
| Terminal frozen   | Press `Ctrl + C`                            |
| Need to restart   | Close VS Code, reopen, run `npm run dev`    |
| Deployment failed | Run `npm run build` again, check for errors |
| Lost in folders   | `cd 'path\to\your\mms-membership'`          |

### File Locations

| What              | Where                                |
| ----------------- | ------------------------------------ |
| Main table page   | `src/views/DashboardView.vue`        |
| Add member form   | `src/components/MemberModal.vue`     |
| Bulk import       | `src/components/BulkImportModal.vue` |
| Help text         | `src/components/BulkImportHelp.vue`  |
| Excel template    | `src/utils/bulkImport.js`            |
| Firebase settings | `src/services/firebase.js`           |

---

## Tips for Success

1. **Always backup before making changes**

   - Export current data to Excel
   - Keep multiple dated backups

2. **Test locally first**

   - Run `npm run dev`
   - Check changes at `localhost:5173`
   - Only deploy if it works

3. **Make small changes**

   - Change one thing at a time
   - Test after each change
   - Don't change multiple files at once

4. **Keep notes**

   - Document what you changed
   - Save error messages
   - Track deployment dates

5. **Use version control**
   - Your changes are tracked in Git
   - You can always undo if needed

---

## Understanding Error Messages

### Common Terminal Errors

**"Command not found"**

```
Solution: You're not in the right folder
Run: cd 'path\to\your\mms-membership'
```

**"Module not found"**

```
Solution: Dependencies missing
Run: npm install
```

**"Port already in use"**

```
Solution: Dev server already running
Press Ctrl+C to stop it, then run npm run dev again
```

**"Firebase login required"**

```
Solution: Not logged into Firebase
Run: firebase login
Follow the browser prompts
```

### Browser Console Errors

Open browser console: Press `F12` → Click "Console" tab

**"404 Not Found"**

- File missing or wrong path
- Try rebuilding: `npm run build`

**"401 Unauthorized"**

- Login expired
- Log out and log back in

**"CORS Error"**

- Firebase configuration issue
- Check `firebase.js` settings

---

## Maintenance Schedule

### Daily

- ✅ Check if website is accessible
- ✅ Export data backup

### Weekly

- ✅ Review Firebase usage (free tier limits)
- ✅ Check for error logs in Firebase Console
- ✅ Clear old/test data from database

### Monthly

- ✅ Update documentation if features changed
- ✅ Review and archive old backups
- ✅ Check Firebase project settings

### As Needed

- ✅ Add new members manually or via bulk import
- ✅ Update help text based on user feedback
- ✅ Deploy changes to production

---

## Keyboard Shortcuts Reference

### VS Code

- `Ctrl + S` - Save file
- `Ctrl + F` - Find in file
- `Ctrl + Shift + F` - Find in all files
- ` Ctrl + ``  ` `` - Toggle terminal
- `Ctrl + P` - Quick file open
- `Ctrl + /` - Comment/uncomment line

### Browser

- `F12` - Open developer tools
- `Ctrl + Shift + R` - Hard refresh
- `Ctrl + Shift + Delete` - Clear cache
- `F5` - Refresh page

### Terminal

- `Ctrl + C` - Stop current process
- `Ctrl + L` or `cls` - Clear terminal
- Up Arrow - Previous command
- Tab - Auto-complete

---

**Remember**: When in doubt, don't change anything critical. Take a backup first, make small changes, and test thoroughly before deploying!

**Still stuck?** Refer to [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for more technical solutions.
