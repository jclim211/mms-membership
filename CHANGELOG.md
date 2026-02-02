# 📋 Changelog

All notable changes to the MMS Portal are documented in this file.

---

## [2.1.0] - 2026-02-02

### 🔄 Event ID Tracking System

A major improvement to how member event records are linked to the Event Store for reliable syncing.

#### New Features

- **Event ID Linking**: Member event records (ISM attendance, ISS events, NCS events) now include an `eventId` field that links them to the corresponding Event Store document
- **Manual Entry Flag**: Events added manually through Member Modal are marked with `isManualEvent: true` to distinguish them from synced events
- **Visual Indicators**:
  - 🔗 Blue "Synced" badge for events linked to Event Store
  - ⚠️ Amber "Manual" badge for manually added events
- **Improved Sync Logic**: When events are renamed or deleted in Event Store, member records are now updated reliably using `eventId` matching instead of name+date matching

#### Technical Details

- `eventId` field added when marking attendance in EventsView
- `isManualEvent: true` added when manually adding events in MemberModal
- `memberStore.js` updated with `isSameEvent()` helper that prioritizes eventId matching
- Falls back to name+date matching for legacy records without eventId

---

### 📦 Data Export & Import

Enhanced backup functionality with selective export and full import capabilities.

#### Export Enhancements

- **Collection Selection**: Choose which collections to export (Members, Events, Admins)
- **Single File Export**: All selected data exported to one JSON file with metadata
- **Record Counts**: Shows number of records in each collection before export

#### Import Features

- **File Upload**: Drag-and-drop JSON file upload with validation
- **Preview Panel**: Shows record counts and export date before import
- **Collection Selection**: Choose which collections to import from file
- **Import Modes**:
  - **Replace**: Deletes existing data before importing (⚠️ dangerous)
  - **Merge**: Keeps existing data, adds/updates from import file
- **Safety Measures**:
  - Admins checkbox off by default
  - Strong confirmation modal requiring user to type "IMPORT"
  - Clear warnings about data overwrite risks
- **Batch Processing**: Handles large datasets efficiently (500 records per batch)

---

### 🛡️ Event Deletion Confirmations

Added confirmation modals to prevent accidental event deletions.

#### Changes

- **Delete Event Confirmation**: Modal with event name and warning message
- **Sync to Members Confirmation**: Separate confirmation when deleting synced attendance records
- **Clear Visual Warnings**: Red styling to emphasize destructive actions

---

### 🎨 UI/UX Improvements

#### Member Modal Enhancements

- **Sync Warnings**: Added warnings about manual entries not syncing with Event Store
- **Less Prominent Override Buttons**: Manual override buttons now gray and smaller to discourage misuse
- **Synced/Manual Badges**: Visual indicators for each event showing sync status

#### Event Management

- **Confirmation Modals**: All delete actions now require confirmation
- **Clearer Action Buttons**: Better visual hierarchy for safe vs dangerous actions

---

### 🐛 Bug Fixes

- **Fixed**: Firestore undefined value error in `toggleNCSForceValid` function
- **Fixed**: Tailwind color classes (changed from `emerald-600` to `emerald` due to custom color definition)

---

### 🗑️ Removed Features

- **Bulk Event Import**: Removed from bulk import to prevent sync issues with Event Store
  - Members can still be bulk imported
  - Events should be created in Event Store for proper syncing
- **Migration Script**: Removed after successful one-time migration to add eventId to existing records

---

## [2.0.0] - Previous Version

### Features

- Member management with CRUD operations
- Event management (ISM, ISS, NCS)
- Bulk import/export functionality
- Admin management
- Google Sign-In authentication
- Subsidy calculation system
- Real-time Firestore sync

---

## Migration Notes

### From 2.0.0 to 2.1.0

1. **EventId Migration**: A one-time migration was run to backfill `eventId` into existing member event records
   - Records matched to Event Store entries received `eventId`
   - Unmatched records were marked as `isManualEvent: true`
2. **Data Backup**: Export your data before any major changes using the new Export feature in Admin Management

---

## File Changes Summary

### Modified Files

| File                                | Changes                                                       |
| ----------------------------------- | ------------------------------------------------------------- |
| `src/views/EventsView.vue`          | Added eventId when syncing attendance to members              |
| `src/views/AdminManagementView.vue` | Added export/import functionality, removed migration script   |
| `src/components/MemberModal.vue`    | Added isManualEvent flag, sync warnings, Synced/Manual badges |
| `src/stores/memberStore.js`         | Updated sync functions to use eventId matching                |

### New Data Fields

| Collection              | Field         | Type    | Description                      |
| ----------------------- | ------------- | ------- | -------------------------------- |
| members.ismAttendance[] | eventId       | string  | Links to Event Store document ID |
| members.ismAttendance[] | isManualEvent | boolean | True if manually added           |
| members.issEvents[]     | eventId       | string  | Links to Event Store document ID |
| members.issEvents[]     | isManualEvent | boolean | True if manually added           |
| members.ncsEvents[]     | eventId       | string  | Links to Event Store document ID |
| members.ncsEvents[]     | isManualEvent | boolean | True if manually added           |
