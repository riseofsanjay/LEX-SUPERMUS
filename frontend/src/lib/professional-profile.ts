export type ProfessionalRole = "STUDENT" | "ADVOCATE" | "LAW_FIRM" | "ADMIN";
export type ProfessionalProfileSectionKey =
  | "experience"
  | "education"
  | "licenses"
  | "volunteering"
  | "skills"
  | "publications"
  | "honors"
  | "languages";

export type ProfessionalProfileEntry = {
  id: string;
  title: string;
  organization: string;
  context: string;
  dates: string;
  description: string;
  url: string;
};

export type SavedProfessionalProfileSections = Record<
  ProfessionalProfileSectionKey,
  ProfessionalProfileEntry[]
>;

export const PROFESSIONAL_FEED_STORAGE_KEY = "lex-supermus-professional-feed";
export const PROFESSIONAL_MESSAGES_STORAGE_KEY = "lex-supermus-professional-messages";
export const STUDENT_RESUME_DRAFT_STORAGE_KEY = "lex-supermus-student-resume-draft";
export const ADVOCATE_RESUME_DRAFT_STORAGE_KEY = "lex-supermus-advocate-resume-draft";

export function getSavedProfileKey(
  role: ProfessionalRole,
  field: "name" | "avatar" | "details"
): string {
  return `lex-supermus-saved-${role.toLowerCase()}-${field}`;
}

export function getSavedProfileSectionsKey(
  role: ProfessionalRole,
  fullName: string,
): string {
  return `lex-supermus-profile-sections:${role}:${fullName.trim().toLowerCase()}`;
}

export function getSavedProfileCoverKey(
  role: ProfessionalRole,
  fullName: string,
): string {
  return `lex-supermus-profile-cover:${role}:${fullName.trim().toLowerCase()}`;
}
