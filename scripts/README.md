# Migration Scripts

This directory contains database migration scripts for the MMS Membership Portal.

## Available Migrations

### 1. NCS Total Count Migration (`migrate-ncs-total-count.js`)

Populates the `ncsTotalAttended` field for all existing members.

**When to run:** After deploying code that adds the `ncsTotalAttended` field.

**How to run:**

#### Option A: Browser Console (Easiest)

1. Open the MMS Dashboard in your browser
2. Log in as admin
3. Open browser DevTools (F12)
4. Go to Console tab
5. Run:
   ```javascript
   // Copy and paste the contents of migrate-ncs-browser.js
   ```
6. Wait for completion message
7. Refresh the page

#### Option B: Node.js Script

1. Ensure you have Firebase Admin SDK configured
2. Update the import path in `migrate-ncs-total-count.js` if needed
3. Run:
   ```bash
   node scripts/migrate-ncs-total-count.js
   ```

---

### 2. Valid NCS Field Rename Migration (`migrate-valid-ncs-browser.js`)

Copies values from `ncsAttended` to `validNcsAttended` for the field rename migration.

**When to run:** After deploying code that renames `ncsAttended` to `validNcsAttended`.

**How to run:**

#### Browser Console

1. Open the MMS Dashboard in your browser
2. Log in as admin
3. Open browser DevTools (F12)
4. Go to Console tab
5. Copy and paste the contents of `migrate-valid-ncs-browser.js`
6. Press Enter to run
7. Wait for completion message
8. Refresh the page

**Note:** The code has backward compatibility built in, so it will read from `validNcsAttended` first, then fall back to `ncsAttended`. Both fields will be written to during the transition period, so existing data will continue to work.

---

## Migration Safety

All migration scripts:

- ✅ Use Firestore batching (max 500 operations per batch)
- ✅ Skip records that already have the field
- ✅ Can be run multiple times safely
- ✅ Provide detailed progress logging
- ✅ Include error handling

## After Running Migrations

1. Check the console for the summary report
2. Verify a few member records manually in Firebase Console
3. Test the dashboard to ensure counts display correctly
4. Check member modal for correct values

## Troubleshooting

**Script fails with "db not found":**

- Make sure you're running the browser version on the actual dashboard page
- Try the Node.js version instead

**Batch commit errors:**

- Check Firebase quota limits
- Ensure you have write permissions
- Check internet connection

**Counts still don't match:**

- Clear browser cache and refresh
- Check browser console for errors
- Verify the migration completed successfully
