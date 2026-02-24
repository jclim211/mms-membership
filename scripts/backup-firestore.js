// Firestore Backup Script
// Usage: node scripts/backup-firestore.js
// Env vars required:
//   FIREBASE_SERVICE_ACCOUNT_KEY  - JSON string of service account key
//   FIREBASE_PROJECT_ID           - Firebase project ID

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Parse service account from environment
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountJson) {
  console.error("❌ Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable");
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountJson);
} catch (e) {
  console.error(
    "❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY as JSON:",
    e.message,
  );
  process.exit(1);
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Collections to back up
const COLLECTIONS = ["members", "events"];

// Timestamp for folder name (YYYY-MM-DD)
const today = new Date();
const dateStr = today.toISOString().split("T")[0]; // e.g. 2026-02-24

const backupDir = path.join(__dirname, "..", "backups", dateStr);

async function backupCollection(collectionName) {
  console.log(`📦 Backing up collection: ${collectionName}`);
  const snapshot = await db.collection(collectionName).get();

  const docs = {};
  snapshot.forEach((doc) => {
    docs[doc.id] = doc.data();
  });

  const count = Object.keys(docs).length;
  console.log(`   ✅ ${count} documents found`);
  return docs;
}

async function run() {
  console.log(`\n🔄 MMS Firestore Backup — ${dateStr}`);
  console.log(`📁 Output directory: backups/${dateStr}/\n`);

  // Create backup directory
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const results = {};

  for (const collection of COLLECTIONS) {
    try {
      const data = await backupCollection(collection);
      results[collection] = Object.keys(data).length;

      const outputPath = path.join(backupDir, `${collection}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf8");
      console.log(`   💾 Saved to backups/${dateStr}/${collection}.json\n`);
    } catch (err) {
      console.error(`❌ Failed to back up ${collection}:`, err.message);
      process.exit(1);
    }
  }

  // Write a manifest file with metadata
  const manifest = {
    backupDate: today.toISOString(),
    collections: results,
    totalDocuments: Object.values(results).reduce((a, b) => a + b, 0),
  };
  fs.writeFileSync(
    path.join(backupDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8",
  );

  console.log("✅ Backup complete!");
  console.log(`   📊 Summary: ${JSON.stringify(results)}`);
  console.log(`   📄 Manifest written to backups/${dateStr}/manifest.json`);

  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Unexpected error:", err);
  process.exit(1);
});
