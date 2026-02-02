# NCS Count Field Migration Guide

**Date:** February 2, 2026  
**Migration Type:** Add `ncsTotalAttended` field to separate total participation from valid graduation count

---

## 📊 What Changed

### Before

- `ncsAttended`: Single field representing valid NCS events counting toward graduation
- Confusing when members attended events that didn't count (partial attendance or before declaration date)

### After

- **`ncsTotalAttended`**: Total NCS events with ANY participation (at least one session)
- **`validNcsAttended`**: Valid NCS events counting toward graduation (full attendance + date requirements)
- **`ncsAttended`**: Legacy field (kept for backward compatibility, same value as `validNcsAttended`)

---

## 🎯 Why This Change

1. **Clarity**: Members can see they participated even if event doesn't count
2. **Transparency**: Clear distinction between participation vs. qualifying events
3. **Better Metrics**: Track overall engagement separately from requirements
4. **Easier Support**: "You attended 5 NCS total, but only 3 count because..."

---

## 🔧 What Was Updated

### Code Changes (Completed)

1. **memberStore.js**
   - Added `getTotalNCSCount()` helper function
   - Exported new helper alongside existing `getValidNCSCount()`

2. **MemberModal.vue**
   - Added `ncsTotalAttended` to formData
   - Updated `recalculateNCSAttended()` to calculate both counts
   - UI now shows both "Total NCS Attended" and "Valid NCS (Counting Toward Graduation)"

3. **EventsView.vue (AttendanceModal)**
   - Attendance marking now updates `ncsTotalAttended`, `validNcsAttended`, and `ncsAttended` (legacy)
   - Event removal recalculates all counts

4. **DashboardView.vue**
   - Table now displays valid count with total count below as gray text
   - Example: "3/5" with "Total: 5" underneath

5. **QuickAddStudentModal.vue**
   - Initializes `ncsTotalAttended: 0` for new students

6. **exportExcel.js**
   - Exports both "Total NCS Attended" and "Valid NCS (Counting Toward Graduation)"

7. **BulkImportModal.vue**
   - Download template includes both fields

8. **BulkImportHelp.vue**
   - Documentation updated to explain both fields

9. **BulkAttendanceImportModal.vue**
   - New student creation includes `ncsTotalAttended: 0`

---

## 📋 Migration Steps for Existing Data

### Option 1: Automatic Migration (RECOMMENDED)

The system will automatically calculate `ncsTotalAttended` from existing `ncsEvents[]` data when:

- Members are viewed (via `getTotalNCSCount()` helper)
- Members are edited and saved
- Attendance is marked in EventsView

**No immediate action required** - values will populate as members are accessed.

### Option 2: Batch Migration Script (One-Time)

For immediate migration of all existing members, run this in Firebase console or create a migration script:

```javascript
// Migration script to populate ncsTotalAttended for all existing members
async function migrateNCSCounts() {
  const membersRef = collection(db, "members");
  const snapshot = await getDocs(membersRef);

  const batch = writeBatch(db);
  let count = 0;

  for (const docSnap of snapshot.docs) {
    const member = docSnap.data();
    const ncsEvents = member.ncsEvents || [];

    // Calculate total (any session attended)
    const ncsTotalAttended = ncsEvents.filter(
      (e) => e.session1 || e.session2,
    ).length;

    // Calculate valid (using existing logic)
    const validNcsAttended = ncsEvents.filter((e) => {
      // If forced valid
      if (e.forceValid) return true;

      // Must have both sessions
      if (!e.session1 || !e.session2) return false;

      // If not Ordinary A, all count
      if (member.membershipType !== "Ordinary A") return true;

      // If no declaration date (grandfathered), count all
      if (!member.ordinaryADeclarationDate) return true;

      // Check date
      const eventDate = new Date(e.date);
      eventDate.setHours(0, 0, 0, 0);
      const declarationDate = new Date(member.ordinaryADeclarationDate);
      declarationDate.setHours(0, 0, 0, 0);

      return eventDate >= declarationDate;
    }).length;

    // Update document
    const memberRef = doc(db, "members", docSnap.id);
    batch.update(memberRef, {
      ncsTotalAttended,
      validNcsAttended,
      ncsAttended: validNcsAttended, // Legacy field
      updatedAt: new Date().toISOString(),
    });

    count++;

    // Commit in batches of 500 (Firestore limit)
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`Migrated ${count} members...`);
    }
  }

  // Commit remaining
  if (count % 500 !== 0) {
    await batch.commit();
  }

  console.log(`✅ Migration complete! Updated ${count} members.`);
}

// Run migration
migrateNCSCounts();
```

---

## ✅ Testing Checklist

- [x] `getTotalNCSCount()` returns correct count from `ncsEvents[]`
- [x] `getValidNCSCount()` still works as before
- [x] MemberModal displays both counts correctly
- [x] AttendanceModal updates both counts when marking attendance
- [x] Dashboard shows valid count prominently with total count as secondary
- [x] Excel export includes both fields
- [x] New members get `ncsTotalAttended: 0` initialized
- [x] Existing members display counts correctly (after migration)
- [x] Session attendance updates both counts properly
- [x] Event deletion recalculates both counts

---

## 🔍 Validation

### Check Individual Member

```javascript
// In browser console on dashboard
const member = memberStore.members[0];
console.log("Total NCS:", memberStore.getTotalNCSCount(member));
console.log("Valid NCS:", memberStore.getValidNCSCount(member));
console.log("Events:", member.ncsEvents);
```

### Verify Calculations

- **Total** should count: `ncsEvents.filter(e => e.session1 || e.session2).length`
- **Valid** should count: `ncsEvents.filter(e => isNCSEventValid(member, e)).length`

---

## 🚨 Rollback Plan

If issues arise:

1. **Code rollback**: Revert commits related to `ncsTotalAttended`
2. **Data cleanup**: Run script to remove `ncsTotalAttended` field from all documents
3. **No data loss**: `ncsEvents[]` array unchanged, can recalculate anytime

---

## 📝 Notes

- **Backward Compatible**: Old code will ignore new fields if present
- **Forward Compatible**: `getTotalNCSCount()` and `getValidNCSCount()` fall back to calculation if fields missing
- **Dual-Write Strategy**: Both `validNcsAttended` and legacy `ncsAttended` are written together
- **Safe Migration**: Deriving from existing `ncsEvents[]` data - no risk of data loss

---

## 👥 Communication

**For Users:**

> We've improved how NCS attendance is displayed. You'll now see:
>
> - **Total NCS Attended**: All NCS events you participated in (any session)
> - **Valid NCS**: Only events that count toward your graduation requirements
>
> This makes it clearer why some events might not count (e.g., partial attendance or attended before becoming Ordinary A).

**For Admins:**

> The system now tracks two NCS counts for better transparency. When marking attendance or editing members, both counts are automatically calculated. Existing members will have counts populated as they're accessed.
