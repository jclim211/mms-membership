/**
 * Calculate the next subsidy rate for a member based on their membership type,
 * Exco status, and past subsidy usage history.
 *
 * Algorithm:
 * - Exco members: Always 95% (regardless of membership tier)
 * - Associate members: Always 10%
 * - Ordinary B members: Sequence [70, 10] - use 70% first, then 10% forever
 * - Ordinary A members: Sequence [90, 70, 50, 10] - go through unused rates in order, then 10% forever
 *
 * The key logic: Go through the sequence in ORDER and return the first rate that hasn't been used yet.
 * This handles upgrades correctly (e.g., Ord B used 70%, upgrades to Ord A, gets 90% next, then 50%)
 *
 * @param {string} membershipType - The membership type ('Associate', 'Ordinary B', 'Ordinary A')
 * @param {boolean} isExco - Whether the member is an Exco member
 * @param {number[]} subsidyHistory - Array of subsidy percentages already used
 * @returns {number} The next subsidy percentage (95, 90, 70, 50, or 10)
 */
export function calculateNextSubsidyRate(
  membershipType,
  isExco = false,
  subsidyHistory = [],
) {
  // Exco members always get 95% regardless of membership tier
  if (isExco) {
    return 95;
  }

  // Associate members always get 10%
  if (membershipType === "Associate") {
    return 10;
  }

  // Ordinary B members: Sequence [70, 10]
  if (membershipType === "Ordinary B") {
    const sequence = [70, 10];
    for (const rate of sequence) {
      if (!subsidyHistory.includes(rate)) {
        return rate;
      }
    }
    return 10; // All used, continue with minimum
  }

  // Ordinary A members: Sequence [90, 70, 50, 10]
  if (membershipType === "Ordinary A") {
    const sequence = [90, 70, 50, 10];
    for (const rate of sequence) {
      if (!subsidyHistory.includes(rate)) {
        return rate;
      }
    }
    return 10; // All used, continue with minimum
  }

  // Default fallback
  return 10;
}

/**
 * Format a phone number to ensure it's properly displayed
 * @param {string} phone - The phone number to format
 * @returns {string} Formatted phone number
 */
export function formatPhoneNumber(phone) {
  if (!phone) return "";
  // Remove all non-digit characters
  const cleaned = phone.toString().replace(/\D/g, "");
  return cleaned;
}

/**
 * Format a Telegram handle to ensure it has @ prefix
 * @param {string} handle - The Telegram handle
 * @returns {string} Formatted handle with @
 */
export function formatTelegramHandle(handle) {
  if (!handle) return "";
  const trimmed = handle.trim();
  if (trimmed.startsWith("@")) return trimmed;
  return `@${trimmed}`;
}

/**
 * Check if a member is eligible for scholarship
 * @param {string} membershipType - The membership type
 * @param {boolean} scholarshipAwarded - Whether scholarship has been awarded
 * @returns {boolean} True if eligible
 */
export function isScholarshipEligible(membershipType, scholarshipAwarded) {
  return membershipType === "Ordinary A" && !scholarshipAwarded;
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get badge color class based on membership type
 * @param {string} type - Membership type
 * @returns {string} Tailwind CSS classes
 */
export function getMembershipBadgeColor(type) {
  switch (type) {
    case "Exco":
      return "bg-purple-600 text-white";
    case "Ordinary A":
      return "bg-navy text-white";
    case "Ordinary B":
      return "bg-blue-500 text-white";
    case "Associate":
      return "bg-gray-400 text-white";
    default:
      return "bg-gray-300 text-gray-800";
  }
}

/**
 * Get the appropriate color for subsidy rate display
 * @param {number} rate - Subsidy rate percentage
 * @returns {string} Tailwind CSS classes
 */
export function getSubsidyRateColor(rate) {
  if (rate >= 95) return "text-purple-600 font-bold";
  if (rate >= 90) return "text-emerald font-bold";
  if (rate >= 70) return "text-blue-600 font-semibold";
  if (rate >= 50) return "text-yellow-600";
  return "text-gray-500";
}

/**
 * Get badge configuration for student status (Pill UI)
 * @param {string} status - Student Status (Undergraduate, Postgraduate, etc.)
 * @returns {object} { label: string, color: string }
 */
export function getStudentStatusBadge(status) {
  switch (status) {
    case "Undergraduate":
      return { label: "U", color: "bg-blue-100 text-blue-800 border-blue-200" };
    case "Postgraduate":
      return {
        label: "P",
        color: "bg-purple-100 text-purple-800 border-purple-200",
      };
    case "Alumni":
      return {
        label: "A",
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
      };
    case "Exchange Student":
      return {
        label: "E",
        color: "bg-orange-100 text-orange-800 border-orange-200",
      };
    default:
      return { label: "?", color: "bg-gray-100 text-gray-800 border-gray-200" };
  }
}

/**
 * Normalize Campus ID by ensuring it's a valid integer with leading zero for 7-digit IDs
 * Excel may store as number or string, we ensure consistent format
 * @param {string|number} id - Campus ID to normalize
 * @returns {string} Normalized campus ID (with leading zero if 7 digits)
 */
export function normalizeCampusId(id) {
  if (!id) return "";

  // Convert to string and remove any whitespace
  const idStr = id.toString().trim();

  // Check if it's a valid integer (digits only)
  if (!/^\d+$/.test(idStr)) {
    return ""; // Return empty for invalid formats
  }

  // If it's exactly 7 digits, add leading zero
  if (idStr.length === 7) {
    return "0" + idStr;
  }

  // Otherwise return as-is (as string to preserve any existing leading zeros)
  return idStr;
}
