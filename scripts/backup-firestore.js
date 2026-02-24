// Firestore Backup Script
// Usage: node scripts/backup-firestore.js
// Env vars required:
//   FIREBASE_SERVICE_ACCOUNT_KEY  - JSON string of service account key
//   FIREBASE_PROJECT_ID           - Firebase project ID (optional, taken from key)

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

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

// ─── XLSX helpers (mirrors exportExcel.js logic) ──────────────────────────────

function buildMembersSheet(members) {
  const exportData = members.map((member) => {
    const ismAttendance = (member.ismAttendance || [])
      .map((ism) => `${ism.eventName}:${ism.subsidyUsed}`)
      .join(", ");

    const ncsEvents = member.ncsEvents || [];
    const ncsNames = ncsEvents
      .map((event) => {
        const bracketParts = [];
        if (!(event.session1 && event.session2)) {
          const sessions = [];
          if (event.session1) sessions.push("1");
          if (event.session2) sessions.push("2");
          bracketParts.push(sessions.join(","));
        }
        if (event.forceValid) {
          bracketParts.push(`F:${event.forceValidReason || ""}`);
        }
        return bracketParts.length === 0
          ? event.eventName
          : `${event.eventName}[${bracketParts.join(",")}]`;
      })
      .join(", ");

    const issNames = (member.issEvents || [])
      .map((e) => e.eventName)
      .join("; ");

    const tracks = Array.isArray(member.tracks)
      ? member.tracks.join(", ")
      : member.tracks || "";

    const dynamicFieldsStr = Array.isArray(member.dynamicFields)
      ? member.dynamicFields.map((f) => `${f.key}: ${f.value}`).join("; ")
      : "";

    return {
      "Campus ID": member.campusId || "",
      "Full Name": member.fullName || "",
      "Admit Year": member.admitYear || "",
      "Student Status": member.studentStatus || "",
      School: member.school || "",
      "First Degree": member.firstDegree || "",
      "Second Degree": member.secondDegree || "",
      "Membership Type": member.membershipType || "",
      "Exco Member": member.isExco ? "TRUE" : "FALSE",
      "Ordinary A Declaration Date": member.ordinaryADeclarationDate
        ? new Date(member.ordinaryADeclarationDate).toLocaleDateString("en-GB")
        : "",
      "Tracks (comma-separated)": tracks,
      "School Email": member.schoolEmail || "",
      "Personal Email": member.personalEmail || "",
      "Telegram Handle": member.telegramHandle || "",
      "Added to Telegram Group (1=Yes, 0=No)": member.addedToTelegram ? 1 : 0,
      "Phone Number": member.phoneNumber || "",
      "ISM Attendance": ismAttendance,
      "Total ISM Count": (member.ismAttendance || []).length,
      "Total NCS Attended": member.ncsTotalAttended || 0,
      "Valid NCS (Counting Toward Graduation)":
        member.validNcsAttended ?? member.ncsAttended ?? 0,
      "NCS Events (comma-separated)": ncsNames,
      "ISS Attended": member.issAttended || 0,
      "ISS Events (comma-separated)": issNames,
      "Scholarship Eligible":
        member.membershipType === "Ordinary A" && !member.scholarshipAwarded
          ? "YES"
          : "NO",
      "Scholarship Awarded": member.scholarshipAwarded ? "TRUE" : "FALSE",
      "Scholarship Year": member.scholarshipYear || "",
      "Reason for Ordinary B": member.reasonForOrdinaryB || "",
      "Dynamic Fields": dynamicFieldsStr,
      "Created At": member.createdAt || "",
      "Updated At": member.updatedAt || "",
    };
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  ws["!cols"] = [
    { wch: 12 },
    { wch: 20 },
    { wch: 10 },
    { wch: 15 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 10 },
    { wch: 20 },
    { wch: 20 },
    { wch: 25 },
    { wch: 25 },
    { wch: 18 },
    { wch: 10 },
    { wch: 15 },
    { wch: 35 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 35 },
    { wch: 12 },
    { wch: 35 },
    { wch: 18 },
    { wch: 18 },
    { wch: 15 },
    { wch: 25 },
    { wch: 30 },
    { wch: 20 },
    { wch: 20 },
  ];
  return ws;
}

function buildEventsSheet(events) {
  const exportData = events.map((event) => ({
    "Event ID": event.id || "",
    "Event Name": event.name || "",
    Type: event.type || "",
    Date: event.date ? new Date(event.date).toLocaleDateString("en-GB") : "",
    "Attendee Count": Array.isArray(event.attendees)
      ? event.attendees.length
      : 0,
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  ws["!cols"] = [
    { wch: 25 },
    { wch: 35 },
    { wch: 10 },
    { wch: 12 },
    { wch: 14 },
  ];
  return ws;
}

// ─── Main backup logic ────────────────────────────────────────────────────────

async function backupCollection(collectionName) {
  console.log(`📦 Backing up collection: ${collectionName}`);
  const snapshot = await db.collection(collectionName).get();

  const docs = {};
  snapshot.forEach((doc) => {
    docs[doc.id] = { id: doc.id, ...doc.data() };
  });

  const count = Object.keys(docs).length;
  console.log(`   ✅ ${count} documents found`);
  return docs;
}

async function run() {
  console.log(`\n🔄 MMS Firestore Backup — ${dateStr}`);
  console.log(`📁 Output directory: backups/${dateStr}/\n`);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const results = {};
  const allData = {};

  for (const collection of COLLECTIONS) {
    try {
      const data = await backupCollection(collection);
      results[collection] = Object.keys(data).length;
      allData[collection] = data;

      // Save JSON
      fs.writeFileSync(
        path.join(backupDir, `${collection}.json`),
        JSON.stringify(data, null, 2),
        "utf8",
      );
      console.log(`   💾 JSON saved → backups/${dateStr}/${collection}.json\n`);
    } catch (err) {
      console.error(`❌ Failed to back up ${collection}:`, err.message);
      process.exit(1);
    }
  }

  // ── Generate combined XLSX ──────────────────────────────────────────────────
  console.log("📊 Generating XLSX backup...");
  try {
    const wb = XLSX.utils.book_new();

    const membersArray = Object.values(allData.members || {});
    XLSX.utils.book_append_sheet(
      wb,
      buildMembersSheet(membersArray),
      "Members",
    );

    const eventsArray = Object.values(allData.events || {});
    XLSX.utils.book_append_sheet(wb, buildEventsSheet(eventsArray), "Events");

    const xlsxPath = path.join(backupDir, `backup_${dateStr}.xlsx`);
    XLSX.writeFile(wb, xlsxPath);
    console.log(
      `   💾 XLSX saved  → backups/${dateStr}/backup_${dateStr}.xlsx\n`,
    );
  } catch (err) {
    console.error(
      "⚠️  XLSX generation failed (JSON backups are intact):",
      err.message,
    );
  }

  // ── Write manifest ──────────────────────────────────────────────────────────
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

  // ── Write last-backup status to Firestore (_meta/lastBackup) ───────────────
  console.log("🔖 Writing last-backup timestamp to Firestore...");
  try {
    await db.collection("_meta").doc("lastBackup").set({
      timestamp: today.toISOString(),
      dateStr,
      collections: results,
      totalDocuments: manifest.totalDocuments,
    });
    console.log("   ✅ Firestore _meta/lastBackup updated\n");
  } catch (err) {
    console.error(
      "⚠️  Could not write to Firestore _meta/lastBackup:",
      err.message,
    );
  }

  console.log("✅ Backup complete!");
  console.log(
    `   📊 Summary: members=${results.members}, events=${results.events}`,
  );
  console.log(`   📄 Manifest → backups/${dateStr}/manifest.json`);

  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Unexpected error:", err);
  process.exit(1);
});
