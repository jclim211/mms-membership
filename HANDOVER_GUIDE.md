# 🤝 MMS Project Handover Guide

**Start here if you are taking over this project!**

This guide is designed for administrators or new owners who may not have a programming background.

---

## 1. What is this project?

The **Club Membership Management System (MMS)** is a private website for managing your club's members. It replaces Excel sheets with a secure, searchable, and smart database.

**Key capabilities:**

- **Member Database**: Store profiles, photos, and contact info.
- **Subsidy Calculator**: Automatically calculates how much subsidy a member gets for events.
- **Event Tracking**: Logs attendance for ISM, NCS, and ISS events.
- **Smart Logic**: Automatically tracks scholarship eligibility and graduation requirements.
- **Bulk Tools**: Upload hundreds of members at once from Excel.

---

## 2. How do I "Run" the website?

Since this is a web application, it lives on the internet (hosted on Firebase).

- **Public URL**: `https://your-project-id.web.app` (Ask the previous owner for the link)
- **Admin Login**: You need an email and password to access the dashboard.

### If you need to run it on your own computer (e.g., for testing):

You will need to follow the **[NON_TECHNICAL_GUIDE.md](NON_TECHNICAL_GUIDE.md)**. It explains:

1. Installing the basic tools (VS Code, Node.js).
2. Typing the simple commands to start the site.
3. Troubleshooting common issues.

> 💡 **Tip:** Most of the time, you will just use the live website. You only need to run code if you are changing how the website _works_ or _looks_.

---

## 3. Daily Administration Tasks

### Adding a New Member

1. Click the navy **+ Add Member** button on the dashboard.
2. Fill in the Compulsory Fields (Name, ID, School, etc.).
3. Click **Save**.

   > **Note on Membership & Tracks**:
   >
   > - Selecting **ITI** or **MBOT** tracks will automatically upgrade the member to **Ordinary A**.
   > - You **cannot** be an Ordinary A member without selecting one of these tracks. The system will block the save if you try.

### Managing Subsidies (ISM)

1. Open a member's profile.
2. Scroll to "ISM Attendance".
3. Click **Add ISM Attendance**.
4. Enter the event name.
5. **Magic**: The system checks their history and automatically fills in the refined subsidy rate (90%, 70%, etc.).
6. **Manual Override**: You can change the subsidy if needed (dropdown: 95%, 90%, 70%, 50%, 10%).
7. **Smart Tracking**: The system tracks whether subsidies were auto-applied or manually overridden:
   - **(Auto)** - System calculated, counts towards next calculation
   - **(Manual)** - Admin overridden, doesn't affect future calculations
   - This prevents members from "gaming" the system

### Managing NCS Events (Graduation Requirements)

You can track which NCS events a member attended.

1. Open a member's profile.
2. Scroll to "NCS Event Details".
3. **Green Badge (✓ COUNTS)**: Event counts towards graduation (attended _after_ declaring Ordinary A).
4. **Grey Badge (✗ DOESN'T COUNT)**: Event was too early.
5. **Manual Override**: If an event _should_ count but is marked grey (e.g., special permission), click the **Shield/Force Count** button next to it. It will turn green and be counted.

### Bulk Import (Start of Semester)

1. Click **Bulk Import** on the dashboard.
2. Download the **Excel Template**.
3. Paste your new members into that Excel file.
4. **Drag and drop** it back into the website (or click to browse).
5. **Preview Step Features**:
   - **Verification Mode** (orange button): Compare uploaded list against database to identify missing Ordinary A members
   - **Bulk Set Ordinary A Declaration Date** ✨ **NEW**:
     - Check the box to enable
     - Select the date when track members officially became Ordinary A
     - Automatically applies to all Ordinary A members without a date
     - Critical for NCS graduation tracking (only events after this date count)
6. **Bulk Editing**: Click "Download Existing Data" to export all current members with complete details, edit the file, and re-upload to update in bulk.

> 💡 **Pro Tip**: When onboarding a new ITT/MBOT cohort:
>
> 1. Import them with their basic info
> 2. In the preview step, enable "Bulk Set Ordinary A Declaration Date"
> 3. Set it to the date they officially joined the track
> 4. This ensures NCS attendance tracking starts from the correct date

### Event Management & Attendance

Instead of manually editing each member, you can use the **Events Page**:

1. Click the **Events** icon/link in the navigation (if available) or go to `/events`.
2. **Create Event**: Click "Create ISM Event" (or NCS/ISS).
3. **Mark Attendance**: Click "Mark Attendance" on an event card.
   - You can toggle attendance for existing members.
   - **Quick Add**: If a student isn't in the database, you can "Quick Add" them right there. They will be added as "Associate" members.
   - **ISM Events**: System automatically calculates subsidy rates, but you can override if needed.
   - **Event Linking**: Attendance marked through Events page is automatically linked to the event (shows "Synced" badge in member profile).
4. **Bulk Attendance Import**: Inside an event, click "Bulk Import" to upload attendance for that specific event.
   - **Drag & Drop**: Simply drag your Excel file into the upload zone.
   - **Download Existing**: Export current attendees to edit and re-upload.
   - System supports subsidy parsing and calculation.
5. **Deleting Events**: A confirmation modal will appear asking you to confirm. You can choose whether to delete the event _only_ from the list, or also remove it from every student's history (cleaning up their profiles).

> 💡 **Synced vs Manual Events**:
>
> - Events added through the Events page show a blue "Synced" badge
> - Events added manually in member profiles show an amber "Manual" badge
> - Synced events update automatically when you rename/delete an event in Event Store

---

## 4. Data Backup & Restore

### Automated Daily Backup ✨ NEW

The system automatically backs up your data every day at **2 AM SGT** using GitHub Actions.

- Backups are saved to a separate private GitHub repository (`mms-backup`)
- Each backup creates a dated folder (e.g., `backups/2026-02-24/`) containing:
  - `members.json` — full member data
  - `events.json` — all events
  - `backup_YYYY-MM-DD.xlsx` — Excel workbook with Members & Events sheets
  - `manifest.json` — summary of record counts
- The **Dashboard** shows the date/time and record counts of the last backup in the Backup Reminder card
- You can also trigger a backup manually: go to GitHub → your codebase repo → **Actions** → **Firestore Backup** → **Run workflow**

> ✅ **No action needed for daily backups** — they run automatically. Check the Dashboard to confirm they are happening.

### Manual Export (In-App)

1. Go to **Admin Management** page.
2. Scroll to "Export Data" section.
3. **Select collections**: Check/uncheck Members, Events, Admins.
4. Click **Export Selected** to download a single JSON backup file.

On the **Dashboard**, clicking **Export All/Filtered** downloads an Excel file of members.

### Importing Data (Restore)

1. Go to **Admin Management** page.
2. Scroll to "Import Data" section.
3. **Drag & drop** your JSON backup file.
4. Review the preview (shows record counts).
5. **Select collections** to import.
6. Choose import mode:
   - **Replace**: ⚠️ Deletes existing data, then imports
   - **Merge**: Keeps existing data, adds/updates from file
7. Click **Import Selected Data**.
8. Type "IMPORT" in the confirmation modal to proceed.

> ⚠️ **Warning**: Import is a powerful feature. Always export a backup BEFORE importing!

---

## 5. Where is the data?

All data is stored in **Google Firebase**, a secure cloud database.

- **Safe**: Backed up by Google and also by the daily automated GitHub backup.
- **Exportable**: Click **Export Selected** on Admin Management to download a JSON backup.
- **Restorable**: Import JSON backups to restore data.
- **Secure**: Only logged-in admins can see or change data.

> ⚠️ **Important**: Even though backups are automated, it's good practice to also manually export data before making big changes.

---

## 6. 🔑 Transferring Ownership to a New Admin/Owner

This section is for when you are **handing the entire project over** to the next person (e.g., next year's Exco).

---

### What accounts / services are involved?

| Service                               | What it holds                             | Who needs access |
| ------------------------------------- | ----------------------------------------- | ---------------- |
| **GitHub** (codebase repo)            | All source code, GitHub Actions workflows | New owner        |
| **GitHub** (backup repo `mms-backup`) | Automated daily backups                   | New owner        |
| **Firebase Console**                  | Live database, hosting, authentication    | New owner        |
| **Google Account**                    | Used to sign in to Firebase               | New owner        |

---

### Step 1 — Transfer GitHub repository ownership

1. Ask the current owner to go to: **GitHub → `mms-membership` repo → Settings → General → Danger Zone → Transfer ownership**
2. Enter the new owner's GitHub username.
3. Repeat for the **`mms-backup`** repo.

> Alternatively, the new owner can be added as an **admin collaborator** instead of full ownership transfer (safer if multiple people share access).

---

### Step 2 — Add new owner to Firebase project

1. Go to the **[Firebase Console](https://console.firebase.google.com)**.
2. Select the **mms-membership** project.
3. Click ⚙️ **Project Settings** → **Users and permissions**.
4. Click **Add member**, enter the new owner's Google email, set role to **Owner**.
5. They will receive an invitation email — they must accept it.

Once accepted, they can manage the database, deploy rules, and view hosting.

---

### Step 3 — Regenerate the Firebase Service Account Key (automated backup)

The daily backup requires a **Firebase Service Account Key** stored as a GitHub Actions secret. You must regenerate this for the new owner's setup.

1. Go to **Firebase Console → Project Settings → Service accounts**.
2. Click **Generate new private key** → **Generate Key**.
3. Save the downloaded `.json` file securely — **do not share it** via chat or email.
4. Go to **GitHub → `mms-membership` repo → Settings → Secrets and variables → Actions**.
5. Update the secret `FIREBASE_SERVICE_ACCOUNT_KEY` by pasting the full contents of the `.json` file.

> ⚠️ The old key should be **deleted** from Firebase after rotating: Firebase Console → Service Accounts → find the key → Delete.

---

### Step 4 — Regenerate the GitHub Personal Access Token (for backup repo)

The workflow uses a Personal Access Token (PAT) to push backups to `mms-backup`.

1. The **new owner** logs into GitHub and goes to: **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. Set:
   - **Token name**: `MMS Backup Bot`
   - **Expiration**: 1 year (set a calendar reminder to renew)
   - **Repository access**: Only `mms-backup`
   - **Permissions**: Contents → **Read and Write**
3. Copy the generated token.
4. Go to **GitHub → `mms-membership` → Settings → Secrets and variables → Actions**.
5. Update the secret `BACKUP_REPO_PAT` with the new token.
6. Also confirm `BACKUP_REPO` secret is set to the correct value: `new-username/mms-backup`.

---

### Step 5 — Add new admin to the MMS website itself

1. The new owner logs into the live MMS site with their Google account.
2. The **current admin** goes to **Admin Management** → **Add New Admin** → enters the new owner's email.
3. The new owner's account is now approved and they can access the dashboard.
4. The old admin can then remove themselves if desired.

---

### Step 6 — Update Firebase Hosting authorised users (optional)

If you want the new owner to be able to deploy the website:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Run `firebase login` with the new owner's Google account.
3. Run `firebase projects:list` to confirm the project is visible.
4. They can now run `firebase deploy` to push updates.

---

### Step 7 — Transfer remaining credentials/docs

Make sure the new owner has:

- [ ] The live website URL (`https://mms-membership.web.app`)
- [ ] Access to the GitHub codebase repo (`mms-membership`)
- [ ] Access to the GitHub backup repo (`mms-backup`)
- [ ] Firebase project access (Owner role)
- [ ] A copy of this documentation folder
- [ ] The `.env` variable names (see `.env.example`) — the actual values are in Firebase and don't need to be transferred

---

## 7. If something breaks...

Don't panic!

1. **Refresh the page**: Often fixes glitches.
2. **Check the guide**: Read **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** for simple fixes.
3. **Ask for help**: If you see a "red error" in the code terminal, take a screenshot and show it to a developer.

---

## Summary of Documentation Files

- **[HANDOVER_GUIDE.md](HANDOVER_GUIDE.md)**: **You are reading this.** Start here for ownership & admin tasks.
- **[NON_TECHNICAL_GUIDE.md](NON_TECHNICAL_GUIDE.md)**: Simple technical guide for non-coders (how to run the site locally).
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)**: How to set up the website from scratch (for developers).
- **[CHANGELOG.md](CHANGELOG.md)**: Version history and feature changes.
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)**: Common issues and fixes.
- **[README.md](README.md)**: Technical developer manual.
