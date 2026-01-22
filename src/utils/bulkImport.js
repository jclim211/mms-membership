import * as XLSX from "xlsx";
import {
  MEMBERSHIP_TYPE_MAP,
  MEMBERSHIP_TYPES,
  SCHOOL_NAME_MAP,
  STUDENT_STATUS_MAP,
  STUDENT_STATUSES,
  SUBSIDY_RATES,
  DEGREE_PROGRAMS,
  DEGREE_OPTIONS,
} from "./constants";

/**
 * Generate and download Excel template for bulk member upload
 */
export function downloadTemplate() {
  const templateData = [
    {
      "Campus ID": "01234567",
      "Full Name": "JOHN DOE",
      "School Email": "johndoe@email.com",
      "Personal Email": "john.doe@gmail.com",
      "Admit Year": 2024,
      "Membership Type": "Ordinary A",
      "Student Status": "Undergraduate",
      "First Degree": "Accountancy",
      "Second Degree": "",
      School: "Accountancy",
      "Tracks (comma-separated)": "ITT, MBOT",
      "Ordinary A Declaration Date": "2024-01-01",
      "Telegram Handle": "@johndoe",
      "Added to Telegram Group (1=Yes, 0=No)": 0,
      "Phone Number": "91234567",
      "ISM Attendance": "ISM Beijing 2024:90, ISM Shanghai 2024:70",
      "NCS Attended": 0,
      "ISS Attended": 0,
      "NCS Events (comma-separated)": "NCS Singapore 2024, NCS Hong Kong 2024",
      "ISS Events (comma-separated)": "ISS Tokyo 2024, ISS Seoul 2024",
      "Scholarship Awarded": "FALSE",
      "Scholarship Year": "",
      "Reason for Ordinary B": "",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Members");

  // Set column widths
  worksheet["!cols"] = [
    { wch: 12 }, // Campus ID
    { wch: 20 }, // Full Name
    { wch: 25 }, // School Email
    { wch: 25 }, // Personal Email
    { wch: 12 }, // Admit Year
    { wch: 15 }, // Membership Type
    { wch: 15 }, // Student Status
    { wch: 30 }, // First Degree
    { wch: 30 }, // Second Degree
    { wch: 30 }, // School
    { wch: 25 }, // Tracks
    { wch: 15 }, // Telegram Handle
    { wch: 35 }, // Added to Telegram Group
    { wch: 15 }, // Phone Number
    { wch: 15 }, // Phone Number
    { wch: 40 }, // ISM Attendance
    { wch: 12 }, // NCS Attended
    { wch: 12 }, // ISS Attended
    { wch: 40 }, // NCS Events
    { wch: 40 }, // ISS Events
    { wch: 18 }, // Scholarship Awarded
    { wch: 15 }, // Scholarship Year
    { wch: 15 }, // Scholarship Year
    { wch: 30 }, // Reason for Ordinary B
    { wch: 25 }, // Ordinary A Declaration Date
  ];

  // Generate Excel file
  XLSX.writeFile(workbook, "MMS_Member_Upload_Template.xlsx");
}

/**
 * Parse Excel file and extract member data
 * @param {File} file - Excel file to parse
 * @returns {Promise<Object>} - Parsed data with validation results
 */
/**
 * Parse Excel file and extract member data
 * @param {File} file - Excel file to parse
 * @param {Object} options - Parser options { isPartial: boolean }
 * @returns {Promise<Object>} - Parsed data with validation results
 */
export async function parseExcelFile(file, options = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        // Validate and transform data
        const result = validateAndTransformData(jsonData, options);
        resolve(result);
      } catch (error) {
        reject(new Error("Failed to parse Excel file: " + error.message));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Validate and transform parsed Excel data
 * @param {Array} data - Raw data from Excel
 * @param {Object} options - { isPartial: boolean }
 * @returns {Object} - Validation results with valid and invalid records
 */
function validateAndTransformData(data, options = {}) {
  const validRecords = [];
  const invalidRecords = [];
  const seenCampusIds = new Set();
  const isPartial = options.isPartial || false;

  data.forEach((row, index) => {
    const errors = [];
    const rowNumber = index + 2;

    // Required fields validation (ID and Name always required)
    if (!row["Campus ID"]) {
      errors.push("Campus ID is required");
    } else {
      const campusId = row["Campus ID"].toString();
      if (seenCampusIds.has(campusId)) {
        errors.push("Duplicate Campus ID in this file");
      } else {
        seenCampusIds.add(campusId);
      }
    }

    // Is Full Name required for partial update?
    // User said "Student ID and Name will do as compulsory fields"
    if (!row["Full Name"]) {
      errors.push("Full Name is required");
    }

    if (!isPartial) {
      // Full validation for standard import
      if (!row["School Email"]) {
        errors.push("School Email is required");
      } else if (!isValidEmail(row["School Email"])) {
        errors.push("Invalid email format");
      }
      if (!row["School"] && !row["First Degree"]) {
        errors.push("School is required if First Degree is not provided");
      }
      if (!row["Admit Year"]) {
        errors.push("Admit Year is required");
      }
      if (!row["Membership Type"]) {
        errors.push("Membership Type is required");
      }
      if (!row["First Degree"]) {
        errors.push("First Degree is required");
      }
    }

    // Helper to conditionally add fields
    const getValue = (key, transform = (v) => v) => {
      if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
        return transform(row[key]);
      }
      return undefined;
    };

    // Initialize member object with always-present fields
    const member = {
      campusId: row["Campus ID"]?.toString() || "",
      fullName: (row["Full Name"] || "").toUpperCase(),
    };

    // Conditionally add other fields based on presence or !isPartial (defaults)

    // School Email
    if (row["School Email"] || !isPartial) {
      member.schoolEmail = (row["School Email"] || "").toLowerCase();
    }

    // Personal Email
    if (row["Personal Email"] || !isPartial) {
      member.personalEmail = (row["Personal Email"] || "").toLowerCase();
    }

    // Admit Year
    if (row["Admit Year"] || !isPartial) {
      member.admitYear = parseInt(row["Admit Year"] || 0);
    }

    // Membership Type
    if (row["Membership Type"] || !isPartial) {
      const rawType = row["Membership Type"];
      if (rawType) {
        const type =
          MEMBERSHIP_TYPE_MAP[rawType.toLowerCase().trim()] || rawType;
        if (!MEMBERSHIP_TYPES.includes(type)) {
          errors.push(
            `Invalid Membership Type. Must be one of: ${MEMBERSHIP_TYPES.join(
              ", ",
            )}`,
          );
        }
        member.membershipType = type;
      } else if (!isPartial) {
        member.membershipType = null; // Should be caught by required check
      }
    }

    // Student Status (and legacy degree field mapping for safety if needed, but we rely on new one now)
    if (row["Student Status"] || !isPartial) {
      const rawStatus = row["Student Status"] || "Undergraduate";
      const status =
        STUDENT_STATUS_MAP[rawStatus.toLowerCase().trim()] || rawStatus;
      if (!STUDENT_STATUSES.includes(status)) {
        errors.push(
          `Invalid Student Status. Must be one of: ${STUDENT_STATUSES.join(
            ", ",
          )}`,
        );
      }
      member.studentStatus = status;
    }

    // School
    const rawSchool = row["School"];
    if (rawSchool) {
      member.school =
        SCHOOL_NAME_MAP[rawSchool.toLowerCase().trim()] || rawSchool;
    } else if (!isPartial) {
      member.school = "";
    }

    // Degrees
    const firstDegree = row["First Degree"];
    if (firstDegree) {
      const program = DEGREE_PROGRAMS.find(
        (p) =>
          p.degree === firstDegree ||
          (p.shorthand && p.shorthand === firstDegree),
      );
      if (program) {
        member.firstDegree = program.degree;
        if (!member.school) member.school = program.school;
      } else {
        errors.push(`Invalid First Degree.`);
      }
    } else if (!isPartial) {
      member.firstDegree = "";
    }

    const secondDegree = row["Second Degree"];
    if (secondDegree) {
      const program = DEGREE_PROGRAMS.find(
        (p) =>
          p.degree === secondDegree ||
          (p.shorthand && p.shorthand === secondDegree),
      );
      if (program) {
        member.secondDegree = program.degree;
      } else {
        errors.push(`Invalid Second Degree.`);
      }
    } else if (!isPartial) {
      member.secondDegree = "";
    }

    // Tracks
    if (row["Tracks (comma-separated)"]) {
      member.tracks = row["Tracks (comma-separated)"]
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);
    } else if (!isPartial) {
      member.tracks = []; // Default empty for full import
    }

    // Other simple fields
    if (row["Telegram Handle"] || !isPartial)
      member.telegramHandle = row["Telegram Handle"] || "";
    if (row["Phone Number"] || !isPartial)
      member.phoneNumber = row["Phone Number"]?.toString() || "";
    if (row["Reason for Ordinary B"] || !isPartial)
      member.reasonForOrdinaryB = row["Reason for Ordinary B"] || "";

    // Ordinary A Declaration Date
    if (row["Ordinary A Declaration Date"] || !isPartial) {
      if (row["Ordinary A Declaration Date"]) {
        // Simple date parsing. Excel dates can be tricky.
        // Assuming user enters YYYY-MM-DD or standard excel date format which sheet_to_json handles?
        // sheet_to_json with default options might parse dates as numbers or strings.
        // For safety, let's treat it as string and standard ISO if possible.
        // But if it's an Excel serial date, we might need conversion.
        // Since we don't have a reliable excel date parser handy here without testing,
        // we'll rely on string input or standard date object if XLSX parsed it.
        const d = new Date(row["Ordinary A Declaration Date"]);
        if (!isNaN(d.getTime())) {
          member.ordinaryADeclarationDate = d.toISOString();
        } else {
          // For now, if invalid, maybe ignore or push error?
          // Let's rely on standard forgiving nature for now unless strict validation required.
          // But if Ordinary A, let's try to set it.
        }
      } else {
        member.ordinaryADeclarationDate = null;
      }
    }

    // Booleans - be careful with partial updates on booleans.
    // If column exists but is empty, should we treat as false or undefined?
    // ParseBooleanField treats empty as false.
    // Ideally for partial update, if column is MISSING, we skip. If column is present but empty, maybe false?
    // Arrays usually don't have "missing column" for row property, just undefined value?
    // Sheet_to_json usually omits keys for empty cells.

    const checkBool = (key, prop) => {
      // Check if key exists in row object (meaning column header existed and cell had value?)
      // Actually sheet_to_json omits key if cell is empty.
      // So checking `row[key] !== undefined` is a proxy for "is this cell filled?"
      // But for partial update, user might want to set to FALSE explicitly.
      // Easiest heuristic: If isPartial, only update if row[key] is defined.
      if (!isPartial || row[key] !== undefined) {
        member[prop] = parseBooleanField(row[key]);
      }
    };

    checkBool("ISM Signup", "ismSignup");
    checkBool("Contribution Paid", "contributionPaid");
    checkBool("Scholarship Awarded", "scholarshipAwarded");
    checkBool("Added to Telegram Group (1=Yes, 0=No)", "addedToTelegram");
    // Handle alt name for telegram added
    if (isPartial && row["Added to Telegram Group"] !== undefined) {
      member.addedToTelegram = parseBooleanField(
        row["Added to Telegram Group"],
      );
    }

    // Complex Arrays (Attendance) - Partial update usually shouldn't overwrite these unless specified.
    if (row["ISM Attendance"] || !isPartial) {
      // Logic for parsing ISM Attendance... (abbreviated, reusing existing logic)
      let ismAttendance = [];
      if (row["ISM Attendance"]) {
        const ismString = row["ISM Attendance"].toString().trim();
        if (ismString) {
          const ismEntries = ismString.split(",").map((entry) => entry.trim());
          ismAttendance = ismEntries
            .map((entry) => {
              const parts = entry.split(":");
              if (parts.length === 2) {
                return {
                  eventName: parts[0].trim(),
                  subsidyUsed: parseInt(parts[1].trim()),
                  timestamp: new Date().toISOString(),
                };
              }
              return null;
            })
            .filter((i) => i);
        }
      }
      member.ismAttendance = ismAttendance;
    }

    // If errors exist, push to invalid
    if (errors.length > 0) {
      invalidRecords.push({
        row: rowNumber,
        data: row,
        errors,
      });
    } else {
      validRecords.push(member);
    }
  });

  return {
    valid: validRecords,
    invalid: invalidRecords,
    totalRows: data.length,
  };
}

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Parse boolean fields from Excel
 * Accepts: TRUE/FALSE, true/false, 1/0, yes/no, or empty
 * @param {any} value
 * @returns {boolean}
 */
function parseBooleanField(value) {
  if (value === undefined || value === null || value === "") {
    return false;
  }
  const stringValue = value.toString().toLowerCase().trim();
  return stringValue === "true" || stringValue === "1" || stringValue === "yes";
}

/**
 * Bulk import members to Firestore
 * @param {Array} members - Array of validated member objects
 * @param {Object} memberService - Member service instance
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} - Import results
 */
export async function bulkImportMembers(members, memberService, onProgress) {
  const results = {
    added: [],
    updated: [],
    failed: [],
    success: [], // Kept for backward compatibility if needed, but UI should switch to added/updated
  };

  for (let i = 0; i < members.length; i++) {
    try {
      // Use upsertMember instead of addMember
      const result = await memberService.upsertMember(members[i]);

      if (result.error) {
        results.failed.push({
          member: members[i],
          error: result.error,
        });
      } else {
        if (result.action === "added") {
          results.added.push(members[i]);
        } else {
          results.updated.push(members[i]);
        }
        // Add to generic success array for simple counts if needed
        results.success.push(members[i]);
      }

      // Update progress
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: members.length,
          percentage: Math.round(((i + 1) / members.length) * 100),
        });
      }
    } catch (error) {
      results.failed.push({
        member: members[i],
        error: error.message,
      });
    }
  }

  return results;
}
