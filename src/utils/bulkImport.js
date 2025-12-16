import * as XLSX from "xlsx";

/**
 * Generate and download Excel template for bulk member upload
 */
export function downloadTemplate() {
  const templateData = [
    {
      "Campus ID": "01234567",
      "Full Name": "JOHN DOE",
      "School Email": "johndoe@email.com",
      "Admit Year": 2024,
      "Membership Type": "Ordinary A",
      "Student Status": "Undergraduate",
      School: "Computing & Information Systems",
      "Tracks (comma-separated)": "ITT, MBOT",
      "Telegram Handle": "@johndoe",
      "Phone Number": "91234567",
      "ISM Attendance": "ISM Beijing 2024:90, ISM Shanghai 2024:70",
      "NCS Attended": 0,
      "ISS Attended": 0,
      "Scholarship Awarded": "FALSE",
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
    { wch: 12 }, // Admit Year
    { wch: 15 }, // Membership Type
    { wch: 15 }, // Student Status
    { wch: 30 }, // School
    { wch: 25 }, // Tracks
    { wch: 15 }, // Telegram Handle
    { wch: 15 }, // Phone Number
    { wch: 40 }, // ISM Attendance
    { wch: 12 }, // NCS Attended
    { wch: 12 }, // ISS Attended
    { wch: 18 }, // Scholarship Awarded
    { wch: 30 }, // Reason for Ordinary B
  ];

  // Generate Excel file
  XLSX.writeFile(workbook, "MMS_Member_Upload_Template.xlsx");
}

/**
 * Parse Excel file and extract member data
 * @param {File} file - Excel file to parse
 * @returns {Promise<Object>} - Parsed data with validation results
 */
export async function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        // Validate and transform data
        const result = validateAndTransformData(jsonData);
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
 * @returns {Object} - Validation results with valid and invalid records
 */
function validateAndTransformData(data) {
  const validRecords = [];
  const invalidRecords = [];
  const seenCampusIds = new Set();

  data.forEach((row, index) => {
    const errors = [];
    const rowNumber = index + 2; // +2 because Excel is 1-indexed and has header row

    // Required fields validation
    if (!row["Campus ID"]) {
      errors.push("Campus ID is required");
    } else {
      // Check for duplicate Campus ID within the Excel file
      const campusId = row["Campus ID"].toString();
      if (seenCampusIds.has(campusId)) {
        errors.push("Duplicate Campus ID in this file");
      } else {
        seenCampusIds.add(campusId);
      }
    }
    if (!row["Full Name"]) {
      errors.push("Full Name is required");
    }
    if (!row["School Email"]) {
      errors.push("School Email is required");
    } else if (!isValidEmail(row["School Email"])) {
      errors.push("Invalid email format");
    }
    if (!row["School"]) {
      errors.push("School is required");
    }
    if (!row["Admit Year"]) {
      errors.push("Admit Year is required");
    }
    if (!row["Membership Type"]) {
      errors.push("Membership Type is required");
    }

    // Get values for fields
    const admitYear = row["Admit Year"] || null;
    const rawMembershipType = row["Membership Type"] || null;
    const rawStudentStatus = row["Student Status"] || "Undergraduate";
    const rawSchool = row["School"] || "";

    // Validate and normalize membership type (case-insensitive)
    let membershipType = null;
    if (rawMembershipType) {
      const membershipTypeMap = {
        exco: "Exco",
        "ordinary a": "Ordinary A",
        "ordinary b": "Ordinary B",
        associate: "Associate",
      };
      membershipType =
        membershipTypeMap[rawMembershipType.toLowerCase().trim()] ||
        rawMembershipType;
      const validMembershipTypes = [
        "Exco",
        "Ordinary A",
        "Ordinary B",
        "Associate",
      ];
      if (!validMembershipTypes.includes(membershipType)) {
        errors.push(
          `Invalid Membership Type. Must be one of: ${validMembershipTypes.join(
            ", "
          )}`
        );
      }
    }

    // Validate and normalize student status (case-insensitive)
    const statusMap = {
      undergraduate: "Undergraduate",
      postgraduate: "Postgraduate",
      graduated: "Graduated",
    };
    const studentStatus =
      statusMap[rawStudentStatus.toLowerCase().trim()] || rawStudentStatus;
    const validStatuses = ["Undergraduate", "Postgraduate", "Graduated"];
    if (!validStatuses.includes(studentStatus)) {
      errors.push(
        `Invalid Student Status. Must be one of: ${validStatuses.join(", ")}`
      );
    }

    // Validate and normalize school (case-insensitive)
    const schoolMap = {
      accountancy: "Accountancy",
      business: "Business",
      economics: "Economics",
      "computing & information systems": "Computing & Information Systems",
      "computing and information systems": "Computing & Information Systems",
      computing: "Computing & Information Systems",
      cis: "Computing & Information Systems",
      scis: "Computing & Information Systems",
      law: "Law",
      "social sciences": "Social Sciences",
      soss: "Social Sciences",
      "college of integrative studies": "College of Integrative Studies",
      cis: "College of Integrative Studies",
      integrative: "College of Integrative Studies",
    };
    const school = schoolMap[rawSchool.toLowerCase().trim()] || rawSchool;

    // Parse tracks
    let tracks = [];
    if (row["Tracks (comma-separated)"]) {
      tracks = row["Tracks (comma-separated)"]
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);
    }

    // Parse subsidy override (optional)
    let subsidyOverride = null;
    const subsidyValue = row["Subsidy Override (%)"];
    if (
      subsidyValue !== undefined &&
      subsidyValue !== null &&
      subsidyValue !== ""
    ) {
      const parsedSubsidy = parseInt(subsidyValue);
      const validSubsidies = [95, 90, 70, 50, 10];
      if (validSubsidies.includes(parsedSubsidy)) {
        subsidyOverride = parsedSubsidy;
      }
    }

    // Parse boolean fields (optional)
    const ismSignup = parseBooleanField(row["ISM Signup"]);
    const contributionPaid = parseBooleanField(row["Contribution Paid"]);
    const scholarshipAwarded = parseBooleanField(row["Scholarship Awarded"]);

    // Parse attendance fields (optional)
    const ncsAttended = parseInt(row["NCS Attended"]) || 0;
    const issAttended = parseInt(row["ISS Attended"]) || 0;

    // Parse ISM Attendance (optional)
    // Format: "EventName1:subsidyRate1, EventName2:subsidyRate2"
    let ismAttendance = [];
    if (row["ISM Attendance"]) {
      const ismString = row["ISM Attendance"].toString().trim();
      if (ismString) {
        const ismEntries = ismString.split(",").map((entry) => entry.trim());
        ismAttendance = ismEntries
          .map((entry) => {
            const parts = entry.split(":");
            if (parts.length === 2) {
              const eventName = parts[0].trim();
              const subsidyUsed = parseInt(parts[1].trim());
              if (eventName && !isNaN(subsidyUsed)) {
                return {
                  eventName,
                  subsidyUsed,
                  timestamp: new Date().toISOString(),
                };
              }
            }
            return null;
          })
          .filter((item) => item !== null);
      }
    }

    // Create member object
    const member = {
      campusId: row["Campus ID"]?.toString() || "",
      fullName: (row["Full Name"] || "").toUpperCase(),
      schoolEmail: (row["School Email"] || "").toLowerCase(),
      admitYear: parseInt(admitYear),
      membershipType,
      degree: studentStatus,
      school,
      tracks,
      telegramHandle: row["Telegram Handle"] || "",
      phoneNumber: row["Phone Number"]?.toString() || "",
      ismAttendance,
      ismSignup,
      contributionPaid,
      ncsAttended,
      issAttended,
      scholarshipAwarded,
      reasonForOrdinaryB: row["Reason for Ordinary B"] || "",
      dynamicFields: [],
      addedToTelegram: false,
      subsidyOverride,
    };

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
    success: [],
    failed: [],
  };

  for (let i = 0; i < members.length; i++) {
    try {
      const result = await memberService.addMember(members[i]);

      if (result.error) {
        results.failed.push({
          member: members[i],
          error: result.error,
        });
      } else {
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
