/**
 * Migration Script: Populate ncsTotalAttended for Existing Members
 * 
 * This script calculates and populates the ncsTotalAttended field for all
 * existing members who don't have it yet.
 * 
 * Run this in your browser console on the dashboard or in a Node.js environment
 * with Firebase Admin SDK.
 */

import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from './src/services/firebase.js';

async function migrateNCSTotalCount() {
  console.log('🚀 Starting ncsTotalAttended migration...');
  
  const membersRef = collection(db, 'members');
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
    if (member.ncsTotalAttended === undefined || member.ncsTotalAttended === null) {
      // Calculate total NCS (any event with at least one session attended)
      const ncsTotalAttended = ncsEvents.filter(
        e => e.session1 || e.session2
      ).length;
      
      const memberRef = doc(db, 'members', docSnap.id);
      batch.update(memberRef, {
        ncsTotalAttended,
        updatedAt: new Date().toISOString()
      });
      
      updated++;
      count++;
      
      // Commit in batches of 500 (Firestore limit)
      if (count % 500 === 0) {
        await batch.commit();
        console.log(`✅ Committed batch: ${count} members processed, ${updated} updated`);
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
  
  console.log('\n📈 Migration Summary:');
  console.log(`   Total members: ${snapshot.size}`);
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ⏭️  Skipped (already had field): ${skipped}`);
  console.log('\n✨ Migration complete!');
}

// Run the migration
migrateNCSTotalCount().catch(error => {
  console.error('❌ Migration failed:', error);
});
