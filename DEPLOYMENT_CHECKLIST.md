# Pre-Deployment Checklist

Before deploying your MMS Portal to production, ensure you've completed all these steps:

## ✅ Firebase Configuration

- [ ] Created Firebase project
- [ ] Enabled Email/Password authentication
- [ ] Created Firestore database
- [ ] Updated Firebase config in `src/services/firebase.js` with real credentials
- [ ] Created at least one admin user in Firebase Authentication
- [ ] Updated Firestore security rules to require authentication

## ✅ Security

- [ ] Changed default Firebase security rules to authenticated-only access
- [ ] Removed test/demo admin credentials if any
- [ ] Verified only authorized personnel have admin accounts
- [ ] Added `.env` to `.gitignore` (if using environment variables)
- [ ] Considered using Firebase App Check for additional security

## ✅ Testing

- [ ] Tested login with admin credentials
- [ ] Added a test member successfully
- [ ] Edited an existing member
- [ ] Deleted a test member
- [ ] Tested search functionality
- [ ] Tested membership type filter
- [ ] Added ISM attendance and verified subsidy calculation
- [ ] Exported to Excel and verified data
- [ ] Tested on different browsers (Chrome, Firefox, Safari)
- [ ] Tested responsive design on mobile devices

## ✅ Data

- [ ] Backed up any existing member data
- [ ] Imported existing members (if migrating from another system)
- [ ] Verified all member data displays correctly
- [ ] Tested subsidy calculations with real scenarios

## ✅ Performance

- [ ] Ran `npm run build` successfully with no errors
- [ ] Tested built version with `npm run preview`
- [ ] Verified all features work in production build
- [ ] Checked bundle size is reasonable

## ✅ Documentation

- [ ] Updated README.md with your project-specific details
- [ ] Documented any custom modifications
- [ ] Created admin user guide for team members
- [ ] Stored Firebase credentials securely

## ✅ Deployment (Firebase Hosting)

- [ ] Installed Firebase CLI (`npm install -g firebase-tools`)
- [ ] Logged into Firebase (`firebase login`)
- [ ] Initialized Firebase hosting (`firebase init hosting`)
- [ ] Built production version (`npm run build`)
- [ ] Deployed to Firebase (`firebase deploy`)
- [ ] Verified live site works correctly
- [ ] Tested all features on live URL

## ✅ Post-Deployment

- [ ] Shared live URL with admin team
- [ ] Distributed login credentials securely (not via email/chat)
- [ ] Monitored Firebase Console for errors
- [ ] Set up Firebase usage alerts (optional)
- [ ] Created backup schedule for member data exports

## 🔐 Production Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Members collection - requires authentication
    match /members/{memberId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 📊 Firebase Quotas (Free Tier Limits)

Be aware of these free tier limits:

- **Authentication**: 10,000 phone authentications/month (email is unlimited)
- **Firestore**:
  - 50,000 reads/day
  - 20,000 writes/day
  - 20,000 deletes/day
  - 1 GiB storage
- **Hosting**: 10 GB storage, 360 MB/day

For a typical club with <500 members and ~10 admins, free tier is sufficient.

## 🚨 Emergency Contacts

Document these for your team:

- **Firebase Project Owner**: ******\_\_\_******
- **Firebase Project ID**: ******\_\_\_******
- **Live URL**: ******\_\_\_******
- **Admin Support Contact**: ******\_\_\_******

## 📝 Regular Maintenance

Set reminders to:

- [ ] Weekly: Export member data backup (Excel)
- [ ] Monthly: Review Firebase usage in Console
- [ ] Quarterly: Review and update admin user list
- [ ] Annually: Review and update security rules

---

## Next Steps After Deployment

1. **Train your admin team**

   - Share SETUP_GUIDE.md
   - Walk through adding/editing members
   - Explain subsidy calculation logic
   - Demo Excel export

2. **Monitor usage**

   - Check Firebase Console > Usage tab
   - Monitor for any error spikes
   - Review authentication logs

3. **Gather feedback**

   - Ask admins about missing features
   - Note any usability issues
   - Plan incremental improvements

4. **Data hygiene**
   - Regularly export backups
   - Archive graduated members (optional)
   - Clean up test data

---

**Deployment Date**: ******\_\_\_******
**Deployed By**: ******\_\_\_******
**Version**: 1.0.0
