/**
 * Browser Console Migration Script
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

(async function migrateNCSTotalCountBrowser() {
  console.log("🚀 Starting ncsTotalAttended migration (Browser Mode)...");

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
    const ncsEvents = member.ncsEvents || [];

    // Only update if ncsTotalAttended doesn't exist
    if (
      member.ncsTotalAttended === undefined ||
      member.ncsTotalAttended === null
    ) {
      // Calculate total NCS (any event with at least one session attended)
      const ncsTotalAttended = ncsEvents.filter(
        (e) => e.session1 || e.session2,
      ).length;

      const memberRef = doc(db, "members", docSnap.id);
      batch.update(memberRef, {
        ncsTotalAttended,
        updatedAt: new Date().toISOString(),
      });

      updated++;
      count++;

      // Commit in batches of 500 (Firestore limit)
      if (count % 500 === 0) {
        await batch.commit();
        console.log(
          `✅ Committed batch: ${count} members processed, ${updated} updated`,
        );
        batch = writeBatch(db); // Start new batch
      }
    } else {
      skipped++;
    }
  }

  // Commit remaining updates
  if (count % 500 !== 0 && updated > 0) {
    await batch.commit();
    console.log(`✅ Committed final batch`);
  }

  console.log("\n📈 Migration Summary:");
  console.log(`   Total members: ${snapshot.size}`);
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ⏭️  Skipped (already had field): ${skipped}`);
  console.log(
    "\n✨ Migration complete! Refresh the page to see updated counts.",
  );
})();
