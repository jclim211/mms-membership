# Field Rename Migration: ncsAttended → validNcsAttended

**Date:** February 2, 2026  
**Migration Type:** Rename field for better clarity  
**Strategy:** Dual-field migration (zero downtime)

---

## 📊 What's Changing

**Current:**

- `ncsAttended`: Valid NCS events counting toward graduation

**New:**

- `validNcsAttended`: Valid NCS events counting toward graduation (more descriptive)

---

## 🎯 Why This Change

1. **Clarity**: Name clearly indicates these are VALID events, not total
2. **Consistency**: Pairs with `ncsTotalAttended` logically
3. **Self-Documenting**: New developers immediately understand the distinction

---

## 🚀 Migration Phases

### Phase 1: Add New Field (Deploy This First)

**Code Changes:**

- Add `validNcsAttended` alongside `ncsAttended` everywhere
- Write to BOTH fields when updating
- Read from `validNcsAttended` first, fallback to `ncsAttended`
- This ensures backward compatibility

**Files Updated:** ✅

1. `memberStore.js` - `getValidNCSCount()` reads `validNcsAttended` first, fallback to `ncsAttended`
2. `MemberModal.vue` - formData, watch, recalculate, and template use `validNcsAttended`
3. `EventsView.vue` - All 3 attendance update locations write both fields
4. `QuickAddStudentModal.vue` - Initializes both `validNcsAttended: 0` and `ncsAttended: 0`
5. `BulkAttendanceImportModal.vue` - Initializes both fields
6. `exportExcel.js` - Exports `validNcsAttended ?? ncsAttended`
7. `BulkImportModal.vue` - Exports `validNcsAttended ?? ncsAttended`

**Timeline:** Can be deployed immediately without breaking anything

---

### Phase 2: Batch Migrate Data

**Run this script after Phase 1 is deployed:**

```javascript
// Copy ncsAttended → validNcsAttended for all existing members
async function migrateValidNcsField() {
  const membersRef = collection(db, "members");
  const snapshot = await getDocs(membersRef);

  const batch = writeBatch(db);
  let count = 0;

  for (const docSnap of snapshot.docs) {
    const member = docSnap.data();

    // If validNcsAttended doesn't exist but ncsAttended does, copy it
    if (
      member.validNcsAttended === undefined &&
      member.ncsAttended !== undefined
    ) {
      const memberRef = doc(db, "members", docSnap.id);
      batch.update(memberRef, {
        validNcsAttended: member.ncsAttended,
        updatedAt: new Date().toISOString(),
      });

      count++;

      // Commit in batches of 500 (Firestore limit)
      if (count % 500 === 0) {
        await batch.commit();
        console.log(`Migrated ${count} members...`);
      }
    }
  }

  // Commit remaining
  if (count % 500 !== 0) {
    await batch.commit();
  }

  console.log(`✅ Migration complete! Updated ${count} members.`);
}

// Run migration
migrateValidNcsField();
```

**Timeline:** Run within 1-2 days of Phase 1 deployment

---

### Phase 3: Switch Primary Usage (Optional Cleanup)

**Code Changes:**

- Remove fallback logic (stop reading from `ncsAttended`)
- Still write to both for safety

**Timeline:** 1-2 weeks after Phase 2

---

### Phase 4: Remove Old Field (Optional Final Cleanup)

**Code Changes:**

- Stop writing to `ncsAttended`
- Remove all references to `ncsAttended`

**Database Cleanup (Optional):**

```javascript
// Remove old ncsAttended field from all documents
async function removeOldField() {
  const membersRef = collection(db, "members");
  const snapshot = await getDocs(membersRef);

  const batch = writeBatch(db);
  let count = 0;

  for (const docSnap of snapshot.docs) {
    const memberRef = doc(db, "members", docSnap.id);
    batch.update(memberRef, {
      ncsAttended: deleteField(),
    });

    count++;

    if (count % 500 === 0) {
      await batch.commit();
    }
  }

  if (count % 500 !== 0) {
    await batch.commit();
  }

  console.log(`✅ Cleanup complete! Removed old field from ${count} members.`);
}
```

**Timeline:** 1+ month after Phase 3 (optional, not required)

---

## 📝 Code Examples

### Reading with Fallback (Phase 1-2)

```javascript
// memberStore.js
const getValidNCSCount = (member) => {
  // Try new field first
  if (
    member.validNcsAttended !== undefined &&
    member.validNcsAttended !== null
  ) {
    return member.validNcsAttended;
  }

  // Fallback to old field
  if (member.ncsAttended !== undefined && member.ncsAttended !== null) {
    return member.ncsAttended;
  }

  // Calculate from events
  if (!member.ncsEvents) return 0;
  return member.ncsEvents.filter((event) => isNCSEventValid(member, event))
    .length;
};
```

### Writing to Both (Phase 1-3)

```javascript
// EventsView.vue - when updating attendance
updatedData.validNcsAttended = validCount;
updatedData.ncsAttended = validCount; // Keep for backward compatibility
```

### MemberModal formData (Phase 1-2)

```javascript
const formData = ref({
  // ... other fields
  validNcsAttended:
    props.member?.validNcsAttended ?? props.member?.ncsAttended ?? 0,
  ncsAttended: props.member?.ncsAttended ?? props.member?.validNcsAttended ?? 0,
});
```

---

## ✅ Testing Checklist

### Phase 1 ✅ COMPLETED

- [x] New members get both `validNcsAttended` and `ncsAttended` set
- [x] Editing existing members preserves `ncsAttended`, creates `validNcsAttended`
- [x] Dashboard displays correctly for both migrated and un-migrated members
- [x] Attendance marking updates both fields

### Phase 2 - Run Migration Script

- [ ] Batch migration script runs without errors
- [ ] All members now have `validNcsAttended` field
- [ ] Values match between `ncsAttended` and `validNcsAttended`

### Phase 3

- [ ] Removing fallback logic doesn't break anything
- [ ] All displays still correct

### Phase 4

- [ ] App works without `ncsAttended` field
- [ ] Database cleanup successful

---

## 🚨 Rollback Plan

### If Issues in Phase 1-2

- Code still reads from `ncsAttended` as fallback - no data loss
- Simply redeploy previous version

### If Issues in Phase 3-4

- Restore backup
- Redeploy Phase 2 code with fallback logic
- Investigate issue before proceeding

---

## 📊 Impact Assessment

**Database:**

- Temporary: Both fields exist (~2x storage for one number per member)
- Final: Only `validNcsAttended` exists

**Code:**

- Temporary: Dual-write logic (minor performance impact)
- Final: Cleaner, more maintainable code

**Risk Level:** ⚪ LOW

- Zero downtime
- Backward compatible
- Gradual migration
- Easy rollback

---

## 🎯 Recommendation

**Do this AFTER** completing the `ncsTotalAttended` migration:

1. ✅ First: Run batch migration for `ncsTotalAttended` (from previous migration)
2. ✅ Wait 1-2 days, verify everything works
3. ✅ Then: Start Phase 1 of `ncsAttended` → `validNcsAttended` rename
4. ✅ Run Phase 2 batch migration
5. ⚪ Optional: Phases 3-4 for cleanup

**Total Timeline:** 2-4 weeks for full migration (with safety buffer)

---

## 📂 Migration Scripts Location

Migration scripts are available in `/scripts/`:

- `migrate-valid-ncs-browser.js` - Browser console script for Phase 2
- See `/scripts/README.md` for detailed instructions
