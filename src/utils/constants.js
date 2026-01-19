/**
 * Centralized constants for the application.
 * Use these instead of hardcoding strings in components.
 */

export const SCHOOLS = [
  "Accountancy",
  "Business",
  "Economics",
  "Computing & Information Systems",
  "Law",
  "Social Sciences",
  "College of Integrative Studies",
];

export const MEMBERSHIP_TYPES = [
  "Exco",
  "Ordinary A",
  "Ordinary B",
  "Associate",
];

export const STUDENT_STATUSES = ["Undergraduate", "Postgraduate", "Graduated"];

export const TRACKS = ["ITT", "MBOT"];

export const SUBSIDY_RATES = [95, 90, 70, 50, 10];

/**
 * Maps varying input strings to the canonical School name.
 * Useful for bulk import normalization.
 */
export const SCHOOL_NAME_MAP = {
  // Standard names
  accountancy: "Accountancy",
  business: "Business",
  economics: "Economics",
  "computing & information systems": "Computing & Information Systems",
  law: "Law",
  "social sciences": "Social Sciences",
  "college of integrative studies": "College of Integrative Studies",

  // Variations / Abbreviations
  "computing and information systems": "Computing & Information Systems",
  computing: "Computing & Information Systems",
  scis: "Computing & Information Systems",
  soss: "Social Sciences",
  cis: "College of Integrative Studies", // CIS usually refers to College of Integrative Studies
  integrative: "College of Integrative Studies",
};

/**
 * Maps varying input strings to the canonical Membership Type.
 */
export const MEMBERSHIP_TYPE_MAP = {
  exco: "Exco",
  "ordinary a": "Ordinary A",
  "ordinary b": "Ordinary B",
  associate: "Associate",
};

/**
 * Maps varying input strings to the canonical Student Status.
 */
export const STUDENT_STATUS_MAP = {
  undergraduate: "Undergraduate",
  postgraduate: "Postgraduate",
  graduated: "Graduated",
};
