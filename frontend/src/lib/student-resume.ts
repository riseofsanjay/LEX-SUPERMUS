export type EducationEntry = {
  institution: string;
  qualification: string;
  completionYear: string;
  score: string;
};

export type ExperienceDetails = {
  organization: string;
  role: string;
  duration: string;
  description: string;
};

export type AdditionalCourse = {
  name: string;
  organization: string;
  year: string;
};

export type StudentEducationDetails = {
  ssc: EducationEntry;
  hsc: EducationEntry;
  ug: EducationEntry;
  pg: EducationEntry;
  additionalCourses: AdditionalCourse[];
  ugCurrentlyPursuing?: boolean;
  pgCurrentlyPursuing?: boolean;
  experience: ExperienceDetails;
};

export const STUDENT_EDUCATION_STORAGE_KEY = "lex-supermus-student-additional-details";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEducationEntry(value: unknown): value is EducationEntry {
  if (!isRecord(value)) return false;
  const educationFields: (keyof EducationEntry)[] = [
    "institution",
    "qualification",
    "completionYear",
    "score",
  ];
  return educationFields.every((field) => typeof value[field] === "string");
}

function isEducationEntryList(value: unknown[]): value is EducationEntry[] {
  return value.every(isEducationEntry);
}

function isAdditionalCourse(value: unknown): value is AdditionalCourse {
  if (!isRecord(value)) return false;
  return ["name", "organization", "year"].every(
    (field) => typeof value[field] === "string",
  );
}

function isAdditionalCourseList(value: unknown): value is AdditionalCourse[] {
  return Array.isArray(value) && value.every(isAdditionalCourse);
}

function isExperienceDetails(value: unknown): value is ExperienceDetails {
  if (!isRecord(value)) return false;
  const experienceFields: (keyof ExperienceDetails)[] = [
    "organization",
    "role",
    "duration",
    "description",
  ];
  return experienceFields.every((field) => typeof value[field] === "string");
}

export function parseStudentEducationDetails(
  value: unknown,
): StudentEducationDetails | null {
  if (!isRecord(value)) return null;

  const {
    ssc,
    hsc,
    ug,
    pg,
    experience,
    ugCurrentlyPursuing,
    pgCurrentlyPursuing,
  } = value;
  const legacyPgEntries = Array.isArray(pg) ? pg : [pg];
  if (
    !isEducationEntry(ssc) ||
    !isEducationEntry(hsc) ||
    !isEducationEntry(ug) ||
    !isEducationEntryList(legacyPgEntries) ||
    !isExperienceDetails(experience) ||
    (ugCurrentlyPursuing !== undefined &&
      typeof ugCurrentlyPursuing !== "boolean") ||
    (pgCurrentlyPursuing !== undefined &&
      typeof pgCurrentlyPursuing !== "boolean")
  ) {
    return null;
  }

  const legacyAdditionalCourses = legacyPgEntries.slice(1).map((entry) => ({
    name: entry.qualification,
    organization: entry.institution,
    year: entry.completionYear,
  }));
  const additionalCourses = value.additionalCourses ?? legacyAdditionalCourses;
  if (!isAdditionalCourseList(additionalCourses)) return null;

  return {
    ssc,
    hsc,
    ug,
    pg: legacyPgEntries[0] ?? {
      institution: "",
      qualification: "",
      completionYear: "",
      score: "",
    },
    additionalCourses,
    experience,
    ...(typeof ugCurrentlyPursuing === "boolean" ? { ugCurrentlyPursuing } : {}),
    ...(typeof pgCurrentlyPursuing === "boolean" ? { pgCurrentlyPursuing } : {}),
  };
}
