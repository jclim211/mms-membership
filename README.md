# Club Membership Management Portal (MMS)

A centralized, secure dashboard for club admins to manage member data, track scholarship eligibility, and monitor event attendance/subsidies.

> **📚 New here?** Check out [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) for a complete guide to all documentation.
>
> **🚀 Quick Start:** Jump to [SETUP_GUIDE.md](SETUP_GUIDE.md) for a 5-minute setup guide.

## Features

- 🔐 **Secure Admin Authentication** - Firebase Authentication with email/password
- 👥 **Member Management** - Add, edit, delete, and search members
- 📊 **Dashboard Statistics** - Quick overview of total members, Ordinary A members, and scholarship eligibility
- 🎯 **Smart Subsidy System** - Automatic calculation of ISM subsidy rates based on membership type and history
- 📈 **ISM Attendance Tracking** - Log event attendance with automatic subsidy assignment
- 🎓 **Scholarship Eligibility** - Auto-calculated based on membership type and award status
- 📥 **Excel Export** - One-click export of all member data including attendance history
- 🔍 **Advanced Filtering** - Search by name or Campus ID, filter by membership type
- ✨ **Dynamic Fields** - Admins can add custom fields for unexpected data needs
- 🎨 **Clean UI** - Modern, Notion-esque design with Tailwind CSS

## Tech Stack

- **Framework:** Vue 3 (Composition API with `<script setup>`)
- **Build Tool:** Vite
- **State Management:** Pinia
- **Styling:** Tailwind CSS
- **Icons:** Lucide Vue Next
- **Routing:** Vue Router
- **Backend:** Firebase (Authentication + Firestore)
- **Excel Export:** xlsx

## Prerequisites

- Node.js (v20.19.0 or >=22.12.0)
- Firebase account and project

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable **Authentication** (Email/Password provider)
4. Enable **Firestore Database** (Start in test mode for development)
5. Get your Firebase config:

   - Go to Project Settings > General
   - Scroll down to "Your apps"
   - Click the web icon to create a web app
   - Copy the Firebase configuration

6. Update the Firebase config in `src/services/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

### 3. Create Admin User

Since this is an admin-only portal, you need to create an admin user in Firebase:

1. Go to Firebase Console > Authentication > Users
2. Click "Add user"
3. Enter email and password for your admin account

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 5. Build for Production

```bash
npm run build
```

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

## Deployment

### Firebase Hosting

1. Install Firebase CLI:

```bash
npm install -g firebase-tools
```

2. Login to Firebase:

```bash
firebase login
```

3. Initialize Firebase hosting:

```bash
firebase init hosting
```

4. Build and deploy:

```bash
npm run build
firebase deploy
```

## Security Considerations

1. **Firestore Security Rules**: Update your Firestore rules to restrict access to authenticated users only:

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

## License

Private project for club use.

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
