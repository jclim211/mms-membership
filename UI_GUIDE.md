# UI Component Guide

A visual guide to the MMS Portal interface and its components.

---

## 🎨 Color Reference

### Primary Colors

```css
--navy: #1e3a8a /* Primary buttons, headers, badges */ --emerald: #10b981
  /* Success states, eligible indicators */ --muted-red: #ef4444
  /* Delete actions, errors, alerts */ --light-grey: #f3f4f6 /* Background */;
```

### Semantic Colors

- **White (#FFFFFF)**: Cards, modals, table backgrounds
- **Gray Shades**: Borders, disabled states, secondary text
- **Blue Shades**: Links, info states, Ordinary B badge
- **Green Shades**: Scholarship eligible, positive states

---

## 📱 Page Layouts

### Login Page (`/login`)

```
┌─────────────────────────────────────┐
│                                     │
│         [App Background]            │
│                                     │
│    ┌─────────────────────┐         │
│    │                     │         │
│    │  MMS Admin Portal   │         │
│    │   [Admin Badge]     │         │
│    │                     │         │
│    │  Email    [input]   │         │
│    │  Password [input]   │         │
│    │                     │         │
│    │   [Sign In Button]  │         │
│    │                     │         │
│    └─────────────────────┘         │
│                                     │
└─────────────────────────────────────┘
```

**Key Elements:**

- Centered white card with shadow
- Navy "Admin Access Only" badge with lock icon
- Email and password fields with icons
- Navy blue submit button
- Error messages in red (when applicable)

---

### Dashboard (`/dashboard`)

```
┌──────────────────────────────────────────────────────────┐
│ Header (White bg, shadow)                                │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Membership Management System    admin@email  [Logout]│  │
│ │ Club Admin Dashboard                              │  │
│ └────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│ │  Total   │  │Ordinary A│  │Scholarship│              │
│ │ Members  │  │ Members  │  │ Eligible  │              │
│ │   150    │  │   120    │  │    95     │              │
│ └──────────┘  └──────────┘  └──────────┘              │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ [Search...]  [Filter▼]  [Export] [Add Member]    │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Campus ID │ Name │ Year │ Status │ ... │ Actions  │  │
│ ├────────────────────────────────────────────────────┤  │
│ │ 01234567  │ John │ 2023 │ UG     │ ... │ [✏️][🗑️] │  │
│ │ 01234568  │ Jane │ 2022 │ PG     │ ... │ [✏️][🗑️] │  │
│ │    ...    │  ... │  ... │  ...   │ ... │    ...   │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Key Sections:**

1. **Header**: Fixed top, white background
2. **Stats Row**: Three cards with icons
3. **Action Bar**: Search, filter, export, add member
4. **Data Table**: Scrollable, with row actions

---

## 🎯 Component Breakdown

### 1. Statistics Cards

Each stat card has:

- **Layout**: White card, rounded corners, subtle shadow
- **Icon**: Colored background circle with icon
- **Label**: Small gray text
- **Value**: Large bold number

```
┌──────────────────────────┐
│  Total Members      [👥] │
│                          │
│       150                │
│                          │
└──────────────────────────┘
```

**Variants:**

- Total Members: Navy icon
- Ordinary A: Blue icon
- Scholarship Eligible: Emerald icon

---

### 2. Action Bar

```
┌────────────────────────────────────────────────────────┐
│ [🔍 Search by name or ID...] [Filter ▼]               │
│                                                        │
│                          [📥 Export]  [+ Add Member]  │
└────────────────────────────────────────────────────────┘
```

**Components:**

- **Search Input**: Full-width, search icon, gray border
- **Filter Dropdown**: Select membership type
- **Export Button**: Emerald green, download icon
- **Add Member Button**: Navy blue, plus icon

---

### 3. Data Table

```
┌─────────────────────────────────────────────────────────┐
│ Campus ID │ Full Name    │ Year │ Status │ ... │ Actions│
├─────────────────────────────────────────────────────────┤
│ 01234567  │ John Doe     │ 2023 │ UG     │ ... │ [✏️][🗑️]│
│           │              │      │        │     │        │
├─────────────────────────────────────────────────────────┤
│ 01234568  │ Jane Smith   │ 2022 │ PG     │ ... │ [✏️][🗑️]│
│           │              │      │        │     │        │
└─────────────────────────────────────────────────────────┘
```

**Column Details:**

- **Campus ID**: Monospace font, bold
- **Full Name**: Regular weight
- **Membership Type**: Colored badge (Navy/Blue/Gray)
- **Next Subsidy**: Color-coded percentage (Emerald/Blue/Yellow/Gray)
- **Actions**: Edit (navy hover) and Delete (red hover) buttons

**Hover Effect**: Light gray background on row hover

---

### 4. Member Modal

The modal is divided into collapsible sections:

```
┌────────────────────────────────────────────────────────┐
│ [X] Edit Member / Add New Member                       │
├────────────────────────────────────────────────────────┤
│                                                        │
│ ═══ Compulsory Information ═══                        │
│                                                        │
│ Campus ID*      [________]    Full Name*  [________]  │
│ Admit Year      [________]    Degree      [▼______]   │
│ Membership Type [▼______]     School      [▼______]   │
│ School Email*   [__________________________]          │
│ Telegram        [@______]     Phone       [________]  │
│ Tracks          [☐ ITI] [☐ MBOT]                     │
│                                                        │
│ ═══ ISM Attendance & Subsidy Log ═══                  │
│                                                        │
│ ┌──────────────────────────────────────────┐         │
│ │ Next Subsidy Rate:              90%      │         │
│ │ Auto-applied to next ISM attendance      │         │
│ └──────────────────────────────────────────┘         │
│                                                        │
│ Past ISM Events:                                      │
│ • ISM Beijing 2024: 90% (Auto) - 2024-06-15          │
│ • ISM Shanghai 2024: 70% (Manual) - 2024-08-20       │
│ ┌────────────────────────────────────────┐           │
│ │ ISM Beijing 2024            90%   [🗑️] │           │
│ │ ISM Tokyo 2024              70%   [🗑️] │           │
│ └────────────────────────────────────────┘           │
│                                                        │
│ [+ Add ISM Attendance]                                │
│                                                        │
│ ═══ Optional Information ═══                          │
│                                                        │
│ # NCS Attended  [__]    # ISS Attended  [__]         │
│                                                        │
│ ┌──────────────────────────────────────────┐         │
│ │ ✓ Scholarship Eligible: YES              │         │
│ │ [☐] Scholarship has been awarded         │         │
│ └──────────────────────────────────────────┘         │
│                                                        │
│ ═══ Additional Fields ═══                             │
│                                                        │
│ Field Name     [________]    Value        [________]  │
│ [+ Add Field]                                         │
│                                                        │
├────────────────────────────────────────────────────────┤
│                             [Cancel] [Add Member]     │
└────────────────────────────────────────────────────────┘
```

**Section Styling:**

- **Headers**: Bold, bottom border
- **Required Fields**: Red asterisk (\*)
- **Info Boxes**: Blue background for subsidy info, emerald for eligible
- **Past Events**: Gray cards with delete button
- **Dynamic Fields**: Similar gray card layout

---

## 🎨 Component States

### Buttons

**Primary (Navy)**

```css
Normal:  bg-navy text-white
Hover:   bg-navy/90
Disabled: opacity-50 cursor-not-allowed
```

**Secondary (Gray)**

```css
Normal:  bg-gray-200 text-gray-700
Hover:   bg-gray-300
```

**Success (Emerald)**

```css
Normal:  bg-emerald text-white
Hover:   bg-emerald/90
```

**Danger (Red)**

```css
Normal:  text-gray-400
Hover:   text-muted-red bg-red-50
```

---

### Badges

**Ordinary A**

```css
Navy blue background, white text
px-3 py-1, rounded-full, font-medium
```

**Ordinary B**

```css
Blue-500 background, white text
px-3 py-1, rounded-full, font-medium
```

**Associate**

```css
Gray-400 background, white text
px-3 py-1, rounded-full, font-medium
```

---

### Input Fields

**Normal State**

```css
Border: gray-300
Focus: ring-2 ring-navy, border-navy
Padding: px-3 py-2
Rounded: rounded-lg
```

**Error State**

```css
Border: red-500
Focus: ring-2 ring-red-500
+ Red error message below
```

---

### Table

**Header Row**

```css
Background: gray-50
Text: gray-500 uppercase text-xs
Padding: px-6 py-3
Font: medium weight
```

**Data Rows**

```css
Background: white
Hover: gray-50
Border: gray-200 (bottom)
Padding: px-6 py-4
```

---

## 🎯 Icon Usage

### Lucide Icons Used

| Icon                           | Usage                     | Location          |
| ------------------------------ | ------------------------- | ----------------- |
| `Lock`                         | Login page, admin badge   | LoginView         |
| `Mail`                         | Email input               | LoginView         |
| `LogOut`                       | Logout button             | Dashboard header  |
| `Search`                       | Search input              | Action bar        |
| `Download`                     | Export button             | Action bar        |
| `Plus`                         | Add member, add field     | Action bar, Modal |
| `Edit2`                        | Edit member               | Table actions     |
| `Trash2`                       | Delete member/field       | Table, Modal      |
| `Users`                        | Total members stat        | Stats card        |
| `Award`                        | Scholarship eligible      | Stats card        |
| `CheckCircle` / `CheckCircle2` | Ordinary A stat, eligible | Stats, Modal      |
| `Filter`                       | Filter dropdown           | Action bar        |
| `AlertCircle`                  | Errors, warnings          | Modal, Errors     |
| `X`                            | Close modal               | Modal header      |

**Icon Sizing:**

- Small actions: 16-18px
- Regular actions: 20px
- Stat cards: 24px

---

## 📐 Spacing & Layout

### Padding

- **Cards**: p-6 (24px)
- **Modal content**: px-6 py-6
- **Table cells**: px-6 py-4
- **Buttons**: px-4 py-2

### Margins

- **Section gaps**: mb-8 (32px)
- **Card gaps**: gap-6 (24px in grid)
- **Form fields**: gap-4 (16px)

### Rounded Corners

- **Cards/Modals**: rounded-xl (12px)
- **Buttons/Inputs**: rounded-lg (8px)
- **Badges**: rounded-full

### Shadows

- **Cards**: shadow-sm (subtle)
- **Modal**: shadow-xl (prominent)

---

## 🎨 Typography Scale

```css
Hero (Modal title):     text-xl (20px) font-bold
Section Header:         text-lg (18px) font-semibold
Stat Value:            text-3xl (30px) font-bold
Body/Table:            text-sm (14px)
Labels:                text-sm (14px) font-medium
Tiny/Meta:             text-xs (12px)
```

---

## 🌈 Color-Coded Elements

### Subsidy Rates

- **90%**: Emerald, bold
- **70%**: Blue-600, semibold
- **50%**: Yellow-600, regular
- **10%**: Gray-500, regular

### Membership Badges

- **Ordinary A**: Navy background
- **Ordinary B**: Blue-500 background
- **Associate**: Gray-400 background

### Status Indicators

- **Eligible**: Emerald background
- **Not Eligible**: Gray background
- **Error**: Red background
- **Info**: Blue background

---

## 📱 Responsive Breakpoints

```css
Mobile:  < 640px   (sm)
Tablet:  640px+    (md)
Desktop: 1024px+   (lg)
Wide:    1280px+   (xl)
```

**Responsive Behaviors:**

- Stats: Stack on mobile (grid-cols-1), row on desktop (grid-cols-3)
- Action bar: Stack on mobile, row on desktop
- Table: Horizontal scroll on mobile
- Modal: Full width on mobile, max-w-4xl on desktop

---

## 🎭 Animations

### Transitions

```css
All interactive elements: transition-colors
Duration: Default (150ms)
```

### Hover Effects

- Buttons: Background color change
- Table rows: Background to gray-50
- Icons: Color change

**No Complex Animations**: Following the "Keep it snappy" requirement, animations are minimal and instant.

---

## ✨ Accessibility Notes

- **Focus States**: All inputs have visible focus rings (ring-2)
- **Button States**: Disabled buttons have reduced opacity
- **Color Contrast**: All text meets WCAG AA standards
- **Labels**: All inputs have associated labels
- **Icons**: Paired with text for clarity
- **Keyboard Navigation**: All actions keyboard-accessible

---

This guide should help you understand and maintain the visual consistency of the MMS Portal interface.
