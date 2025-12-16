# Troubleshooting Guide

Common issues and their solutions for the MMS Portal.

---

## ⚠️ CSS Warnings

### "@tailwind" Unknown at Rule

**Issue:**

```
Unknown at rule @tailwind
Unknown at rule @apply
```

**Status:** ✅ **This is normal and safe to ignore**

**Explanation:**

- These are CSS linting warnings, not actual errors
- VS Code's default CSS validator doesn't recognize Tailwind directives
- The app compiles and runs perfectly fine

**Solution (Optional):**
Add to VS Code settings.json:

```json
{
  "css.lint.unknownAtRules": "ignore"
}
```

---

## 🔥 Firebase Issues

### "Firebase not initialized" Error

**Symptoms:**

- App shows blank screen
- Console error: "Firebase: Firebase App named '[DEFAULT]' already exists"

**Solution:**

1. Check `src/services/firebase.js` has valid configuration
2. Ensure all config values are strings (wrapped in quotes)
3. Restart the dev server: `Ctrl+C`, then `npm run dev`

---

### "Missing or insufficient permissions" Error

**Symptoms:**

- Can't read/write members
- Firestore error in console

**Solution:**

1. Go to Firebase Console > Firestore Database > Rules
2. Update rules to:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /members/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click "Publish"
4. Wait 30 seconds for rules to propagate

---

### Authentication Not Working

**Symptoms:**

- Can't login
- "User not found" error

**Solution:**

1. Verify Email/Password provider is enabled:
   - Firebase Console > Authentication > Sign-in method
   - Ensure "Email/Password" is enabled
2. Check admin user exists:
   - Firebase Console > Authentication > Users
   - If not, click "Add user" and create one
3. Try password reset if needed

---

## 🖥️ Development Server Issues

### Port Already in Use

**Symptoms:**

```
Port 5173 is in use, trying another one...
```

**Status:** ✅ **This is normal**

**Explanation:**
Vite automatically tries the next available port (5174, 5175, etc.)

**No action needed** - just use the displayed port number.

---

### "Cannot find module" Error

**Symptoms:**

```
Cannot find module 'pinia'
Cannot find module 'firebase'
```

**Solution:**

```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

### Build Fails

**Symptoms:**

```bash
npm run build
# Error: ...
```

**Solutions:**

1. **Clear cache:**

```bash
rm -rf node_modules .vite dist
npm install
npm run build
```

2. **Check Node version:**

```bash
node --version
# Should be v20.19.0+ or v22.12.0+
```

3. **Check for syntax errors:**

- Look at the error message
- Usually points to specific file and line

---

## 📱 UI/Display Issues

### Styles Not Applied

**Symptoms:**

- App looks unstyled
- Plain HTML appearance

**Solution:**

1. Check `src/style.css` is imported in `main.js`
2. Verify Tailwind config exists: `tailwind.config.js`
3. Clear browser cache: `Ctrl+Shift+R`
4. Restart dev server

---

### Modal Not Showing

**Symptoms:**

- Click "Add Member" but nothing happens
- Modal appears but is invisible

**Solution:**

1. Check browser console for errors
2. Verify `z-50` class on modal wrapper (higher than other elements)
3. Check if modal state is being set: `showMemberModal.value = true`

---

### Icons Not Displaying

**Symptoms:**

- Icons show as empty boxes or nothing

**Solution:**

1. Verify lucide-vue-next is installed:

```bash
npm list lucide-vue-next
```

2. Reinstall if needed:

```bash
npm install lucide-vue-next
```

3. Check import statements in components

---

## 📊 Data Issues

### Members Not Loading

**Symptoms:**

- Dashboard shows "Loading members..."
- Table remains empty

**Solution:**

1. Check browser console for Firestore errors
2. Verify Firestore security rules allow authenticated read
3. Check network tab: Should see requests to Firestore
4. Try logging out and back in
5. Ensure `members` collection exists in Firestore

---

### Export to Excel Not Working

**Symptoms:**

- Click Export button, nothing happens
- Browser downloads empty file

**Solution:**

1. Check browser console for errors
2. Verify xlsx package is installed:

```bash
npm list xlsx
```

3. Check if members array has data
4. Try different browser (some block auto-downloads)

---

### Subsidy Calculation Seems Wrong

**Symptoms:**

- Next subsidy shows unexpected percentage

**Solution:**

1. Check membership type is correct (case-sensitive)
2. Review ISM attendance history:
   - Open browser DevTools
   - Find member in state
   - Check `ismAttendance` array
3. Refer to SUBSIDY_ALGORITHM.md for logic
4. Verify no manual Firestore edits were made

---

## 🔒 Authentication Issues

### Can't Access Dashboard

**Symptoms:**

- Redirected to login immediately after login
- Dashboard shows briefly then redirects

**Solution:**

1. Check auth state initialization in `App.vue`
2. Clear browser localStorage:

```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
```

3. Try incognito/private browsing mode
4. Check router guards in `src/router/index.js`

---

### "User Not Logged In" After Refresh

**Symptoms:**

- Logged in, refresh page, back to login

**Solution:**

1. Check Firebase persistence is default (session)
2. Verify `initAuth()` is called in `App.vue`
3. Check browser console for auth errors
4. Clear browser cache and cookies

---

## 🌐 Deployment Issues

### Build Succeeds, Production Blank

**Symptoms:**

- `npm run build` works
- Deployed site shows blank page

**Solution:**

1. Check browser console on production site
2. Common issue: Base URL incorrect in `vite.config.js`
3. Verify Firebase config is correct (not localhost URLs)
4. Check Firebase Hosting configuration

---

### Firebase Deploy Fails

**Symptoms:**

```
Error: HTTP Error: 403
```

**Solution:**

1. Check Firebase CLI is logged in:

```bash
firebase login --reauth
```

2. Verify project is selected:

```bash
firebase use --add
```

3. Check Firebase project permissions

---

## 🐛 Browser Compatibility

### Works in Chrome, Not Safari/Firefox

**Symptoms:**

- Functions in Chrome
- Errors in other browsers

**Solution:**

1. Check browser console for specific errors
2. Ensure Vue 3 and Firebase are up to date
3. Test in different browser versions
4. Check for browser-specific CSS issues

---

## 💾 Performance Issues

### App Slow to Load

**Symptoms:**

- Long initial load time
- Members take time to display

**Solution:**

1. Check number of members (Firestore has query limits)
2. Consider pagination if >1000 members
3. Optimize images if any added
4. Check network speed
5. Review Firebase quota usage

---

### Firestore Quota Exceeded

**Symptoms:**

```
Error: Quota exceeded
```

**Solution:**

1. Check Firebase Console > Usage
2. Free tier limits:
   - 50,000 reads/day
   - 20,000 writes/day
3. Solutions:
   - Wait for daily reset
   - Upgrade to Blaze plan
   - Optimize queries (add indexes)

---

## 🔧 Development Tips

### Hot Reload Not Working

**Symptoms:**

- Make changes, nothing updates
- Need to manually refresh

**Solution:**

1. Restart dev server
2. Check file is saved (Ctrl+S)
3. Clear Vite cache:

```bash
rm -rf node_modules/.vite
npm run dev
```

---

### TypeScript Errors (If Using)

**Symptoms:**

```
Property 'x' does not exist on type 'y'
```

**Solution:**
This project uses JavaScript, not TypeScript. If you added TypeScript:

1. Remove TypeScript files
2. Or properly configure `tsconfig.json`

---

## 🆘 Getting Help

### Check These First:

1. **Browser Console** (F12) - Shows JavaScript errors
2. **Network Tab** - Shows API/Firestore requests
3. **Firebase Console** - Shows quota, errors, logs
4. **Terminal** - Shows build/server errors

### Error Message Lookup:

- Google the exact error message
- Check Firebase documentation
- Review Vue 3 documentation

### Still Stuck?

1. Clear all caches (browser, npm, Vite)
2. Delete `node_modules`, reinstall
3. Try in incognito mode
4. Test in different browser
5. Restart your computer 😄

---

## 📋 Health Check Checklist

Run through this if things aren't working:

- [ ] Node.js version correct (v20.19+ or v22.12+)
- [ ] Firebase config in `firebase.js` is valid
- [ ] Email/Password auth enabled in Firebase Console
- [ ] Admin user exists in Firebase Authentication
- [ ] Firestore database exists
- [ ] Firestore rules allow authenticated access
- [ ] `npm install` completed without errors
- [ ] Dev server running without errors
- [ ] No console errors in browser
- [ ] Network requests to Firebase succeeding
- [ ] Logged in with valid admin credentials

---

## 🔄 Nuclear Option: Fresh Start

If nothing else works:

```bash
# 1. Backup your Firebase config first!

# 2. Delete everything
rm -rf node_modules dist .vite package-lock.json

# 3. Reinstall
npm install

# 4. Clear browser
# - Clear cache and cookies
# - Or use incognito

# 5. Restart dev server
npm run dev

# 6. Test login
```

---

## 📞 Error Codes Reference

### Firebase Auth Errors

- `auth/invalid-email`: Email format incorrect
- `auth/user-not-found`: No account with that email
- `auth/wrong-password`: Password incorrect
- `auth/too-many-requests`: Too many failed attempts, wait

### Firestore Errors

- `permission-denied`: Check security rules
- `not-found`: Collection/document doesn't exist
- `unavailable`: Network issue, check connection
- `deadline-exceeded`: Query too slow, add indexes

---

Remember: Most issues are configuration-related (Firebase setup) or environment-related (Node version, dependencies). Rarely are they actual bugs in the code.

If you encounter an issue not listed here, check the browser console first - it usually tells you exactly what's wrong!
