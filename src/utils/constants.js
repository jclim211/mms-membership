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

export const MEMBERSHIP_TYPES = ["Ordinary A", "Ordinary B", "Associate"];

export const STUDENT_STATUSES = [
  "Undergraduate",
  "Postgraduate",
  "Alumni",
  "Exchange Student",
];

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
  "ordinary a": "Ordinary A",
  "ordinary b": "Ordinary B",
  associate: "Associate",
  // Legacy mapping - Exco becomes Ordinary A with isExco=true
  exco: "Ordinary A",
};

/**
 * Maps varying input strings to the canonical Student Status.
 */
export const STUDENT_STATUS_MAP = {
  undergraduate: "Undergraduate",
  postgraduate: "Postgraduate",
  graduated: "Alumni",
  alumni: "Alumni",
  exchange: "Exchange Student",
  "exchange student": "Exchange Student",
};

/**
 * Degree programs mapping as per user requirement.
 */
export const DEGREE_PROGRAMS = [
  {
    school: "Accountancy",
    degree: "Accountancy",
    shorthand: "BAcc",
  },
  {
    school: "Business",
    degree: "Business Management",
    shorthand: "BBM",
  },
  {
    school: "Computing & Information Systems",
    degree: "Computing & Law",
    shorthand: "BSc (CL)",
  },
  {
    school: "Computing & Information Systems",
    degree: "Computer Science",
    shorthand: "BSc (CS)",
  },
  {
    school: "Computing & Information Systems",
    degree: "Information Systems",
    shorthand: "BSc (IS)",
  },
  {
    school: "Computing & Information Systems",
    degree: "Software Engineering",
    shorthand: "BSc (SE)",
  },
  {
    school: "Economics",
    degree: "Economics",
    shorthand: "BSc (Econ)",
  },
  {
    school: "College of Integrative Studies",
    degree: "Integrative Studies",
    shorthand: "CIS",
  },
  {
    school: "Law",
    degree: "Law",
    shorthand: "LLB",
  },
  {
    school: "Social Sciences",
    degree: "Politics, Law & Economics",
    shorthand: "BSocSc (PLE)",
  },
  {
    school: "Social Sciences",
    degree: "Social Sciences",
    shorthand: "BSocSc",
  },
];

// Simple list of degree names for dropdowns
export const DEGREE_OPTIONS = [
  ...DEGREE_PROGRAMS.map((p) => p.degree).sort(),
  "Other", // Add Other option at the end
];
