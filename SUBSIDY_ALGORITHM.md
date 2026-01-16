# ISM Subsidy Algorithm - Technical Documentation

## Overview

The MMS Portal implements a tier-based subsidy system that automatically calculates the appropriate subsidy rate for each ISM event attendance based on membership type and historical usage.

## Core Principle

**"Subsidy tiers are consumed in a specific order, and once used, cannot be reused."**

Each membership type has access to specific subsidy tiers. The system tracks which tiers have been used and grants the next available tier when a member attends an ISM event.

## Subsidy Tiers

| Tier | Percentage | Available To        |
| ---- | ---------- | ------------------- |
| 0    | 90%        | Ordinary A only     |
| 1    | 70%        | Ordinary A & B      |
| 2    | 50%        | Ordinary A only     |
| 3    | 10%        | All members (floor) |

## Algorithm Logic

### Associate Members

```
Always return 10%
```

Simple case - Associate members always get the minimum subsidy regardless of history.

### Ordinary B Members

```javascript
if (70% tier has been used) {
  return 10%
} else {
  return 70%
}
```

Ordinary B members get one 70% subsidy, then drop to 10%.

### Ordinary A Members

```javascript
if (90% tier has NOT been used) {
  return 90%
} else if (70% tier has NOT been used) {
  return 70%
} else if (50% tier has NOT been used) {
  return 50%
} else {
  return 10%
}
```

Ordinary A members progress through tiers: 90% → 70% → 50% → 10%

## Implementation

### Code Location

File: `src/utils/helpers.js`
Function: `calculateNextSubsidyRate(membershipType, subsidyHistory)`

### Parameters

- `membershipType` (string): 'Associate', 'Ordinary B', or 'Ordinary A'
- `subsidyHistory` (array): Array of previously used subsidy percentages, e.g., `[90, 70]`

### Returns

- (number): The next subsidy percentage (90, 70, 50, or 10)

### Example Usage

```javascript
import { calculateNextSubsidyRate } from "../utils/helpers";

// New Ordinary A member, no history
calculateNextSubsidyRate("Ordinary A", []);
// Returns: 90

// After first ISM at 90%
calculateNextSubsidyRate("Ordinary A", [90]);
// Returns: 70

// After second ISM at 70%
calculateNextSubsidyRate("Ordinary A", [90, 70]);
// Returns: 50

// After third ISM at 50%
calculateNextSubsidyRate("Ordinary A", [90, 70, 50]);
// Returns: 10
```

## Special Scenarios

### Scenario 1: Membership Upgrade (B to A)

**Example:**

1. Student starts as Ordinary B
2. Attends ISM Beijing → Uses 70% (History: `[70]`)
3. Upgrades to Ordinary A
4. Attends ISM Tokyo → Gets 90% (History: `[70, 90]`)
5. Attends ISM Seoul → Gets 50% (History: `[70, 90, 50]`)
   - Note: 70% is skipped because already used as Ord B
6. Attends ISM Bangkok → Gets 10% (History: `[70, 90, 50, 10]`)

**Key Point**: The 70% subsidy used as Ordinary B is preserved in history and won't be granted again after upgrade.

### Scenario 2: Membership Downgrade (A to B)

**Example:**

1. Student starts as Ordinary A
2. Attends ISM Beijing → Uses 90% (History: `[90]`)
3. Downgrades to Ordinary B (rare, but possible)
4. Attends ISM Tokyo → Gets 70% (History: `[90, 70]`)
5. Attends ISM Seoul → Gets 10% (History: `[90, 70, 10]`)

**Key Point**: Past history is preserved. Even though they used 90% as Ord A, they can still use 70% as Ord B if not already used.

### Scenario 3: Multiple ISM Events in One Semester

If a member attends multiple ISMs in quick succession:

1. ISM Beijing → 90% (Ord A)
2. ISM Tokyo (2 weeks later) → 70%
3. ISM Seoul (1 month later) → 50%

Each attendance consumes the next available tier immediately.

### Scenario 4: Late Registration

If a member attended ISMs but wasn't registered in the system:

- Admin can backfill attendance records
- Add ISM attendance entries for past events
- System will automatically assign subsidy rates based on chronological order
- **Important**: Add in chronological order for accurate subsidy tracking

## Data Structure

### Member Document (Firestore)

```javascript
{
  membershipType: "Ordinary A",
  ismAttendance: [
    {
      eventName: "ISM Beijing 2024",
      subsidyUsed: 90,
      date: "2024-03-15T00:00:00.000Z"
    },
    {
      eventName: "ISM Tokyo 2024",
      subsidyUsed: 70,
      date: "2024-05-20T00:00:00.000Z"
    }
  ]
}
```

### Extracting Subsidy History

```javascript
const subsidyHistory = member.ismAttendance.map((ism) => ism.subsidyUsed);
// Result: [90, 70]
```

## UI Integration

### Display Next Subsidy Rate

**Dashboard Table:**

- Column: "Next Subsidy"
- Shows the next available subsidy rate
- Updates automatically when membership type changes

**Member Modal:**

- Blue info box showing "Next Subsidy Rate"
- Updates in real-time as ISM attendance is added
- Displays the exact rate that will be applied to the next event

### Manual Subsidy Override (Temporary)

**Purpose**: Allows admins to preview how different subsidy rates would affect a member during editing.

**Behavior**:

- Available in the Member Modal when editing a member
- Admin can select a custom rate: 95%, 90%, 70%, 50%, or 10%
- The override is **temporary** and only applies during the current edit session
- When the member is saved, `subsidyOverride` is automatically cleared (set to `null`)
- After save, the system reverts to automatic calculation based on membership type and history

**Use Cases**:

- Preview how a specific subsidy rate would look for a member
- Temporary testing of different rates during editing
- **Not for permanent overrides** - the system always uses automatic calculation after save

**Important**: If you need to permanently override a rate for special circumstances, you must modify the member's membership type or ISM attendance history instead.

### Adding ISM Attendance

When admin clicks "Add ISM Attendance":

1. System calculates next subsidy rate using current membership type and history
2. Displays calculated rate in the modal
3. Admin enters event name
4. On save, the calculated subsidy rate is stored with the event

## Testing Scenarios

### Test Case 1: Fresh Ordinary A Member

```javascript
Input: membershipType = 'Ordinary A', subsidyHistory = []
Expected Output: 90
```

### Test Case 2: Ordinary B with One ISM

```javascript
Input: membershipType = 'Ordinary B', subsidyHistory = [70]
Expected Output: 10
```

### Test Case 3: Ordinary A at Floor

```javascript
Input: membershipType = 'Ordinary A', subsidyHistory = [90, 70, 50]
Expected Output: 10
```

### Test Case 4: Upgrade Scenario

```javascript
// As Ord B
Input: membershipType = 'Ordinary B', subsidyHistory = [70]
Output: 10

// After upgrade to Ord A
Input: membershipType = 'Ordinary A', subsidyHistory = [70]
Output: 90 (can still use 90%, only 70% was consumed)
```

### Test Case 5: Associate Member

```javascript
Input: membershipType = 'Associate', subsidyHistory = [] // or any history
Expected Output: 10 (always)
```

## Edge Cases

1. **Empty History**: Returns highest tier for membership type
2. **Null History**: Treated as empty array `[]`
3. **Unknown Membership Type**: Returns 10% (safe default)
4. **Invalid Subsidy Values in History**: Ignored, doesn't affect calculation
5. **Duplicate Subsidy Values**: Each occurrence counts (though shouldn't happen in normal flow)

## Future Enhancements (Not Implemented)

Potential improvements for future versions:

1. **Academic Year Reset**: Reset subsidy tiers annually
2. **Per-ISM Subsidy Limits**: Different rates for different destination types
3. **Retroactive Recalculation**: Recalculate all subsidies if algorithm changes
4. **Subsidy Caps**: Maximum total subsidy amount per member
5. **Prorated Subsidies**: Based on ISM cost or duration

## Debugging

If subsidy calculations seem incorrect:

1. **Check Membership Type**: Verify it's exactly 'Ordinary A', 'Ordinary B', or 'Associate' (case-sensitive)
2. **Inspect Subsidy History**: Use browser DevTools to check `ismAttendance` array
3. **Verify Chronological Order**: Ensure ISM events are added in the order they occurred
4. **Check for Manual Edits**: If someone edited Firestore directly, data might be inconsistent

### Debug Console Commands

```javascript
// In browser console
const member = /* member object from state */
const history = member.ismAttendance?.map(ism => ism.subsidyUsed) || []
console.log('Membership:', member.membershipType)
console.log('History:', history)
console.log('Next Rate:', calculateNextSubsidyRate(member.membershipType, history))
```

## Maintenance

- **Version**: 1.0
- **Last Updated**: Initial Implementation
- **Author**: MMS Development Team
- **Review Frequency**: Annually, or when club policies change

---

For questions or algorithm modifications, consult this document and test thoroughly with all scenarios before deploying changes.
