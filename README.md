# 🎓 Club Membership Management System (MMS)

> A modern, full-featured web application for managing club memberships, event attendance, and subsidies.

[![Vue 3](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js)](https://vuejs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.6-FFCA28?logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A centralized, secure dashboard for club administrators to manage member data, track scholarship eligibility, monitor event attendance, and calculate subsidies with powerful bulk import capabilities.

## 📋 Table of Contents

- [Features](#-features)
- [**Handover Guide**](#-handover-guide) (Start Here for New Admins)
- [Demo](#-demo)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Documentation](#-documentation)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

## 🌟 Features

### Core Functionality

> **📚 New here?** Check out [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) for a complete guide to all documentation.
>
> **🤝 Taking over the project?** Read [HANDOVER_GUIDE.md](HANDOVER_GUIDE.md) first!
>
> **Rocket Quick Start:** Jump to [SETUP_GUIDE.md](SETUP_GUIDE.md) for a 5-minute setup guide.
>
> **🆕 Non-Technical Guide:** See [NON_TECHNICAL_GUIDE.md](NON_TECHNICAL_GUIDE.md) for troubleshooting without coding knowledge.

### Authentication & Security

- 🔐 **Multi-Provider Authentication** - Email/password and Google Sign-In via Firebase
- 👤 **Admin Management** - Dedicated admin panel for user management
- 🛡️ **Role-Based Access** - Secure admin-only access control

### Member Management

- 👥 **CRUD Operations** - Add, edit, delete, and view member profiles
- 🔍 **Advanced Search** - Search by name, Campus ID, email, or Telegram handle (with/without @)
- 🎯 **Multi-Filter System** - Filter by membership type, school, year, status, and track
- 📋 **Smart Sorting** - Sort by name, admit year, or date added with visual indicators
- ✅ **Duplicate Prevention** - Campus ID uniqueness validation

### Data Management

- 📤 **Bulk Import** - Excel-based mass upload with:
  - Drag & drop file upload
  - 4-step validation workflow
  - Case-insensitive field mapping
  - Intelligent upsert (add new, update existing)
  - Partial update mode (update only filled columns)
  - Verification mode for list cleanup (identify missing Ordinary A members)
  - **Bulk Ordinary A Declaration Date setting** for mass date assignment
  - Support for Excel date serial numbers (automatic conversion)
  - Comprehensive error reporting
  - Support for 24+ fields including event history
- 📥 **Smart Export** - Multiple export options:
  - Export all members
  - Export filtered results
  - Export members not added to Telegram
  - Download existing data for bulk editing
- 💾 **Auto Backup Reminders** - Persistent notification system
- 🔄 **Bulk Editing** - Download, edit, and re-upload member data

### Subsidy & Attendance

- 🎯 **Intelligent Subsidy Calculator** - Automatic tier-based calculation:
  - Ordinary A: 90% → 70% → 50% → 10%
  - Ordinary B: 70% → 10%
  - Associate: 10% (fixed)
- 🔧 **Manual Override** - Admin can set custom subsidy rates (95%, 90%, 70%, 50%, 10%)
- 🧠 **Smart Subsidy Tracking** - Distinguishes auto-calculated vs manual subsidies:
  - Only auto-applied subsidies count in history
  - Prevents gaming the system with manual overrides
  - Clear indicators: (Auto) / (Manual) in UI
- 📈 **Event Tracking** - Log ISM/NCS/ISS attendance with detailed history
- 📊 **Bulk Attendance Import** - Upload attendance for events with subsidy calculation
- 🎓 **Scholarship Management** - Auto-calculated eligibility tracking

### User Experience

- 🎨 **Modern UI** - Clean, Notion-inspired design with Tailwind CSS
- 📱 **Fully Responsive** - Works on mobile, tablet, and desktop
- ⚡ **Real-Time Updates** - Instant feedback and live data sync
- ✨ **Dynamic Fields** - Add custom fields for unique data needs
- 📊 **Dashboard Analytics** - Quick overview with key statistics

## 🎬 Demo

![Dashboard Screenshot](docs/screenshots/dashboard.png)
_Main dashboard with member table and statistics_

> **Note:** Replace with your own screenshots after deployment

## ⚡ Features

## 🛠️ Tech Stack

| Category       | Technology                                      |
| -------------- | ----------------------------------------------- |
| **Frontend**   | Vue 3.5 (Composition API with `<script setup>`) |
| **Build Tool** | Vite 7.2.4                                      |
| **State**      | Pinia 3.0.4                                     |
| **Styling**    | Tailwind CSS 3.4.0                              |
| **Icons**      | Lucide Vue Next 0.561.0                         |
| **Routing**    | Vue Router 4.5.0                                |
| **Backend**    | Firebase 12.6.0 (Auth + Firestore)              |
| **Excel**      | xlsx 0.18.5                                     |
| **Hosting**    | Firebase Hosting                                |

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v20.19.0 or >=22.12.0 ([Download](https://nodejs.org/))
- **npm**: Comes with Node.js
- **Git**: For cloning the repository ([Download](https://git-scm.com/))
- **Firebase Account**: Free tier available ([Sign up](https://firebase.google.com/))

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/mms-membership.git
cd mms-membership
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Setup

#### a) Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "my-club-membership")
4. Follow the setup wizard

#### b) Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get started"
3. Enable **Email/Password** sign-in method
4. (Optional) Enable **Google** sign-in method

#### c) Create Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Start in **test mode** (you'll update security rules later)
4. Choose a location closest to your users

#### d) Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps"
3. Click the web icon `</>`
4. Register your app with a nickname
5. Copy the `firebaseConfig` object

#### e) Configure Environment Variables

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your Firebase config:

   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

   > ⚠️ **Important:** Never commit `.env` to Git! It's already in `.gitignore`.

### 4. Create Admin User

1. Go to Firebase Console → **Authentication** → **Users**
2. Click "Add user"
3. Enter email and password for your admin account
4. Save the credentials securely

### 5. Update Security Rules

Copy these rules to Firestore and Authentication:

**Firestore Rules** (Firestore Database → Rules):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can read/write
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 6. Run Development Server

```bash
npm run dev
```

The application will open at `http://localhost:5173`

### 7. Login & Start Using

1. Open `http://localhost:5173`
2. Login with your admin credentials
3. Start managing members!

## 📚 Documentation

## Project Structure

```
mms-membership/
├── src/
│   ├── components/
│   │   └── MemberModal.vue       # Add/Edit member modal
│   ├── router/
│   │   └── index.js              # Vue Router configuration
│   ├── services/
│   │   ├── firebase.js           # Firebase initialization
│   │   ├── authService.js        # Authentication service
│   │   └── memberService.js      # Member CRUD operations
│   ├── stores/
│   │   ├── authStore.js          # Auth state management
│   │   └── memberStore.js        # Member state management
│   ├── utils/
│   │   ├── helpers.js            # Utility functions
│   │   └── exportExcel.js        # Excel export functionality
│   ├── views/
│   │   ├── LoginView.vue         # Login page
│   │   └── DashboardView.vue     # Main dashboard
│   ├── App.vue                   # Root component
│   ├── main.js                   # App entry point
│   └── style.css                 # Tailwind CSS imports
├── public/
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## Usage Guide

### Login

- Navigate to `/login`
- Enter your admin credentials
- You'll be redirected to the dashboard

### Dashboard

- View statistics at the top: Total Members, Ordinary A Members, Scholarship Eligible
- Use the search bar to find members by name or Campus ID
- Filter by membership type using the dropdown
- Click "Export to Excel" to download all member data
- Click "Add Member" to create a new member

### Adding/Editing Members

**Compulsory Fields:**

- Campus ID
- Full Name
- Admit Year
- Student Status (Undergraduate/Postgraduate/Graduated)
- Membership Type (Ordinary A/B/Associate)
- School
- School Email

**ISM Attendance:**

- Click "Add ISM Attendance"
- Enter event name
- The system automatically calculates and applies the correct subsidy rate based on:
  - Current membership type
  - Past subsidy usage history
  - Tier-based algorithm

**Subsidy Logic:**

- **Associate:** Always 10%
- **Ordinary B:** 70% (first time), then 10%
- **Ordinary A:** 90% → 70% → 50% → 10% (in order of availability)

**Optional Features:**

- Additional counters (NCS, ISS attendance)
- Scholarship tracking
- Dynamic custom fields

## Firestore Data Structure

### Members Collection

```javascript
{
  campusId: "01234567",
  fullName: "John Doe",
  admitYear: 2023,
  membershipType: "Ordinary A",
  degree: "Undergraduate",
  school: "Computing & Information Systems",
  schoolEmail: "john.doe.2023@smu.edu.sg",
  telegramHandle: "@johndoe",
  phoneNumber: "91234567",
  tracks: ["ITI", "MBOT"],
  ismAttendance: [
    {
      eventName: "ISM Beijing 2024",
      subsidyUsed: 90,
      date: "2024-03-15T00:00:00.000Z"
    }
  ],
  ncsAttended: 2,
  issAttended: 1,
  scholarshipAwarded: false,
  reasonForOrdinaryB: "",
  dynamicFields: [
    { key: "T-Shirt Size", value: "M" }
  ],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
}
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

### Deploy to Firebase Hosting

1. **Install Firebase CLI** (if not already installed):

   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:

   ```bash
   firebase login
   ```

3. **Initialize Firebase** (first time only):

   ```bash
   firebase init hosting
   ```

   - Select your Firebase project
   - Set public directory to `dist`
   - Configure as single-page app: `Yes`
   - Don't overwrite `dist/index.html`

4. **Deploy**:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

Your site will be live at `https://your-project-id.web.app`

### Deploy to Other Platforms

The `dist/` folder can be deployed to any static hosting service:

- **Vercel**: `vercel --prod`
- **Netlify**: Drag `dist/` folder to Netlify dashboard
- **GitHub Pages**: Copy `dist/` to gh-pages branch
- **AWS S3**: Upload `dist/` to S3 bucket with static hosting

## 🔒 Security

### Environment Variables

✅ **DO:**

- Use `.env` for sensitive data
- Add `.env` to `.gitignore` (already done)
- Share `.env.example` as a template
- Use different Firebase projects for dev/prod

❌ **DON'T:**

- Commit `.env` to Git
- Share API keys in public issues
- Use production credentials in development

### Firestore Security Rules

**Production-Ready Rules:**

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

2. **Authentication**: Only create admin accounts in Firebase Console manually
3. **Environment Variables**: Consider using environment variables for Firebase config in production

## Troubleshooting

### Auth not working

- Ensure Email/Password authentication is enabled in Firebase Console
- Check that you've created an admin user in Firebase Authentication

### Firestore errors

- Verify Firestore is enabled in Firebase Console
- Check Firestore security rules allow authenticated access
- Ensure Firebase config is correct in `firebase.js`

### Build errors

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version matches requirements

## Current Feature Summary (Latest)

### ✅ Authentication & Admin

- Email/Password and Google Sign-In
- Admin management interface
- Role-based access control

### ✅ Member Management

- Add, edit, delete members
- Duplicate Campus ID prevention
- Auto-formatting (names → UPPERCASE, emails → lowercase)
- 15 data fields supported

### ✅ Search & Filter

- Multi-field search (name, ID, email, Telegram handle)
- 5 independent filters (membership, status, year, school, track)
- Real-time results count
- Clear all filters option

### ✅ Sorting

- Sortable: Full Name, Admit Year, Date Added
- Visual direction indicators
- Ascending/descending toggle

### ✅ Bulk Import

- Excel template download
- Drag & drop upload
- 4-step workflow with validation
- Duplicate detection
- ISM attendance parsing
- Comprehensive help guide

### ✅ Export

- Export all members
- Export Telegram not added
- Full ISM attendance history included

### ✅ ISM Subsidy System

- Automatic tier-based calculation
- Manual override capability
- Individual subsidy rates per event
- Override indicator in table

### ✅ Responsive Design

- Mobile, tablet, desktop support
- Touch-friendly interface
- Collapsible columns

### ✅ User Experience

- Backup reminder banner
- Loading states
- Progress indicators
- Tooltips and help text
- Confirmation dialogs

---

## 📋 Usage & Forking

This project is **open for cloning and personal use**, but **not accepting contributions**.

Feel free to:

- ✅ Clone/fork for your own organization
- ✅ Modify for your specific needs
- ✅ Use as a template for similar projects
- ✅ Learn from the codebase

**Note:** Pull requests and issues will not be reviewed. If you find bugs or want features, please fork and implement in your own version.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### What this means:

- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use
- ⚠️ Liability and warranty disclaimers apply

## 🙏 Acknowledgments

- [Vue.js](https://vuejs.org/) - The Progressive JavaScript Framework
- [Firebase](https://firebase.google.com/) - Backend and hosting
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Lucide Icons](https://lucide.dev/) - Beautiful & consistent icons
- All contributors who helped improve this project

## 📞 Support

This is a template project provided as-is. Support is not actively provided, but you can:

- 📖 **Documentation**: Check [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) for comprehensive guides
- 🔍 **Self-Help**: Review [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues
- 📚 **Learning**: Explore [NON_TECHNICAL_GUIDE.md](NON_TECHNICAL_GUIDE.md) for detailed explanations

**Note:** Issues and discussions are not monitored. For your own fork, you'll need to troubleshoot independently or hire developers.

## 🗺️ Potential Enhancements

If you fork this project, consider adding:

- [ ] Email notifications for member updates
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Mobile app (React Native)
- [ ] API for external integrations
- [ ] Member self-service portal
- [ ] Automated report generation
- [ ] Payment integration for membership fees
- [ ] Event management and registration

## ⭐ Found This Useful?

If this template helped your organization, consider giving it a ⭐ on GitHub to help others discover it!

---

**Made with ❤️ for club administrators everywhere**

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```
