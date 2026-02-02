import * as XLSX from "xlsx";

/**
 * Export members data to Excel file
 * @param {Array} members - Array of member objects
 * @param {string} filename - Name of the file to export
 */
export function exportToExcel(members, filename = "members_export.xlsx") {
  // Flatten the data for Excel export
  const exportData = members.map((member) => {
    // Flatten ISM attendance
    const ismAttendance = (member.ismAttendance || [])
      .map((ism) => `${ism.eventName}:${ism.subsidyUsed}`)
      .join(", ");

    // Flatten NCS events with bracket notation
    const ncsEvents = member.ncsEvents || [];
    const ncsNames = ncsEvents
      .map((event) => {
        const sessions = [];
        if (event.session1) sessions.push("1");
        if (event.session2) sessions.push("2");

        // Build bracket content
        const bracketParts = [];

        // Add sessions if not both
        if (!(event.session1 && event.session2)) {
          bracketParts.push(sessions.join(","));
        }

        // Add force valid if present
        if (event.forceValid) {
          const reason = event.forceValidReason || "";
          bracketParts.push(`F:${reason}`);
        }

        // If both sessions and not forced, no brackets
        if (bracketParts.length === 0) {
          return event.eventName;
        }

        return `${event.eventName}[${bracketParts.join(",")}]`;
      })
      .join(", ");

    // Flatten ISS events
    const issEvents = member.issEvents || [];
    const issNames = issEvents.map((event) => event.eventName).join("; ");

    // Flatten tracks
    const tracks = Array.isArray(member.tracks)
      ? member.tracks.join(", ")
      : member.tracks || "";

    // Flatten dynamic fields
    let dynamicFieldsStr = "";
    if (member.dynamicFields && Array.isArray(member.dynamicFields)) {
      dynamicFieldsStr = member.dynamicFields
        .map((field) => `${field.key}: ${field.value}`)
        .join("; ");
    }

    return {
      "Campus ID": member.campusId || "",
      "Full Name": member.fullName || "",
      "Admit Year": member.admitYear || "",
      "Student Status": member.studentStatus || "",
      School: member.school || "",
      "First Degree": member.firstDegree || "",
      "Second Degree": member.secondDegree || "",
      "Membership Type": member.membershipType || "",
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
      "Next Subsidy Rate": member.nextSubsidyRate
        ? `${member.nextSubsidyRate}%`
        : "",
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

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Set column widths for better readability
  const columnWidths = [
    { wch: 12 }, // Campus ID
    { wch: 20 }, // Full Name
    { wch: 10 }, // Admit Year
    { wch: 15 }, // Student Status
    { wch: 20 }, // School
    { wch: 15 }, // Membership Type
    { wch: 15 }, // Tracks
    { wch: 25 }, // School Email
    { wch: 25 }, // Personal Email
    { wch: 15 }, // Telegram Handle
    { wch: 15 }, // Added to TG Group
    { wch: 15 }, // Phone Number
    { wch: 15 }, // Next Subsidy Rate
    { wch: 30 }, // ISM Events Attended
    { wch: 20 }, // ISM Subsidies Used
    { wch: 12 }, // Total ISM Count
    { wch: 12 }, // NCS Attended
    { wch: 30 }, // NCS Events
    { wch: 12 }, // ISS Attended
    { wch: 30 }, // ISS Events
    { wch: 18 }, // Scholarship Eligible
    { wch: 18 }, // Scholarship Awarded
    { wch: 15 }, // Scholarship Year
    { wch: 25 }, // Reason for Ordinary B
    { wch: 30 }, // Dynamic Fields
    { wch: 20 }, // Created At
    { wch: 20 }, // Updated At
  ];
  worksheet["!cols"] = columnWidths;

  // Create workbook and add worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Members");

  // Generate and download file
  XLSX.writeFile(workbook, filename);
}
