/**
 * Browser Console Migration Script - Rename ncsAttended to validNcsAttended
 *
 * Run this directly in your browser console while on the MMS Dashboard
 *
 * Instructions:
 * 1. Open the MMS Dashboard in your browser
 * 2. Open browser DevTools (F12)
 * 3. Go to Console tab
 * 4. Copy and paste this entire script
 * 5. Press Enter to run
 */

(async function migrateValidNcsAttendedBrowser() {
  console.log(
    "🚀 Starting ncsAttended → validNcsAttended migration (Browser Mode)...",
  );

  // Use the app's authenticated Firebase instance (exposed via window)
  const { collection, getDocs, writeBatch, doc } = window.firebaseFirestore;
  const db = window.db;

  if (!db || !collection) {
    console.error(
      "❌ Firebase not found on window. Make sure you're on the dashboard page and the app is loaded.",
    );
    console.error(
      "   If this persists, the app may need to be redeployed with window.db exposed.",
    );
    return;
  }

  const membersRef = collection(db, "members");
  const snapshot = await getDocs(membersRef);

  console.log(`📊 Found ${snapshot.size} total members`);

  let batch = writeBatch(db);
  let count = 0;
  let updated = 0;
  let skipped = 0;

  for (const docSnap of snapshot.docs) {
    const member = docSnap.data();

    // Only update if validNcsAttended doesn't exist but ncsAttended does
    if (
      (member.validNcsAttended === undefined ||
        member.validNcsAttended === null) &&
      member.ncsAttended !== undefined &&
      member.ncsAttended !== null
    ) {
      // Copy value from ncsAttended to validNcsAttended
      const ref = doc(db, "members", docSnap.id);
      batch.update(ref, {
        validNcsAttended: member.ncsAttended,
      });
      count++;
      updated++;

      console.log(
        `✅ ${member.fullName}: validNcsAttended = ${member.ncsAttended}`,
      );

      // Firestore batch limit is 500
      if (count >= 500) {
        console.log(`📦 Committing batch of ${count} updates...`);
        await batch.commit();
        batch = writeBatch(db);
        count = 0;
      }
    } else {
      skipped++;
    }
  }

  // Commit remaining updates
  if (count > 0) {
    console.log(`📦 Committing final batch of ${count} updates...`);
    await batch.commit();
  }

  console.log(`
  ✅ Migration complete!
  📊 Total members: ${snapshot.size}
  ✅ Updated: ${updated}
  ⏭️  Skipped (already has validNcsAttended or no ncsAttended): ${skipped}
  `);
})();
