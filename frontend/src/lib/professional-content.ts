import type { ProfessionalRole } from "@/lib/professional-profile";
import {
  PROFESSIONAL_FEED_STORAGE_KEY,
} from "@/lib/professional-profile";

export const LEGAL_JOBS_STORAGE_KEY = "lex-supermus-legal-jobs";
export const PROFESSIONAL_APPLICATIONS_STORAGE_KEY = "lex-supermus-professional-applications";
export const PROFESSIONAL_NOTIFICATIONS_STORAGE_KEY = "lex-supermus-professional-notifications";
export const PROFESSIONAL_NOTIFICATIONS_UPDATED_EVENT = "lex-supermus-notifications-updated";
export const MAX_PROFESSIONAL_IMAGE_SIZE = 1024 * 1024;

type ProfessionalNotificationState = {
  notificationIds: string[];
  readIds: string[];
};

export type LegalJob = {
  id: string;
  title: string;
  organization: string;
  location: string;
  employmentType: string;
  description: string;
  createdAt: number;
  postedBy: string;
};

export type LegalJobApplication = {
  jobId: string;
  applicantName: string;
  status: "Interested";
  createdAt: number;
};

export type PublishedProfessionalUpdate = {
  id: string;
  author: string;
  role: ProfessionalRole;
  text: string;
  tags: string[];
  createdAt: number;
  likedBy: string[];
  comments: unknown[];
  shares: unknown[];
  image?: string;
};

export function readProfessionalImage(file: File): Promise<string> {
  const supportedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!supportedTypes.includes(file.type)) {
    return Promise.reject(new Error("Choose a JPEG, PNG, WebP, or GIF image."));
  }
  if (file.size > MAX_PROFESSIONAL_IMAGE_SIZE) {
    return Promise.reject(new Error("Choose an image smaller than 1 MB."));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The selected image could not be read."));
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("The selected image could not be prepared."));
        return;
      }
      resolve(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isProfessionalNotificationState(value: unknown): value is ProfessionalNotificationState {
  return isRecord(value) &&
    Array.isArray(value.notificationIds) &&
    value.notificationIds.every((id) => typeof id === "string") &&
    Array.isArray(value.readIds) &&
    value.readIds.every((id) => typeof id === "string");
}

function readProfessionalNotificationState(): ProfessionalNotificationState {
  const raw = window.localStorage.getItem(PROFESSIONAL_NOTIFICATIONS_STORAGE_KEY);
  if (!raw) return { notificationIds: [], readIds: [] };
  const parsed: unknown = JSON.parse(raw);
  if (!isProfessionalNotificationState(parsed)) {
    throw new Error("Saved notification status has an invalid format.");
  }
  return parsed;
}

function writeProfessionalNotificationState(state: ProfessionalNotificationState) {
  window.localStorage.setItem(PROFESSIONAL_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(PROFESSIONAL_NOTIFICATIONS_UPDATED_EVENT));
}

export function syncProfessionalNotifications(notificationIds: string[]) {
  const currentIds = [...new Set(notificationIds)];
  const currentIdSet = new Set(currentIds);
  const state = readProfessionalNotificationState();
  writeProfessionalNotificationState({
    notificationIds: currentIds,
    readIds: state.readIds.filter((id) => currentIdSet.has(id)),
  });
}

export function markProfessionalNotificationsRead() {
  const state = readProfessionalNotificationState();
  writeProfessionalNotificationState({
    notificationIds: state.notificationIds,
    readIds: [...new Set([...state.readIds, ...state.notificationIds])],
  });
}

export function getUnreadProfessionalNotificationCount(): number {
  const state = readProfessionalNotificationState();
  const readIds = new Set(state.readIds);
  return state.notificationIds.filter((id) => !readIds.has(id)).length;
}

function isLegalJob(value: unknown): value is LegalJob {
  return isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.organization === "string" &&
    typeof value.location === "string" &&
    typeof value.employmentType === "string" &&
    typeof value.description === "string" &&
    typeof value.createdAt === "number" &&
    typeof value.postedBy === "string";
}

function isLegalJobApplication(value: unknown): value is LegalJobApplication {
  return isRecord(value) &&
    typeof value.jobId === "string" &&
    typeof value.applicantName === "string" &&
    value.status === "Interested" &&
    typeof value.createdAt === "number";
}

function isFeedPost(value: unknown): value is Record<string, unknown> {
  return isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.author === "string" &&
    (value.role === "STUDENT" || value.role === "ADVOCATE" || value.role === "COMMUNITY") &&
    typeof value.text === "string" &&
    Array.isArray(value.tags) &&
    typeof value.createdAt === "number" &&
    Array.isArray(value.likedBy) &&
    Array.isArray(value.comments);
}

export function readLegalJobs(): LegalJob[] {
  const raw = window.localStorage.getItem(LEGAL_JOBS_STORAGE_KEY);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every(isLegalJob)) {
    throw new Error("Saved job listings have an invalid format.");
  }
  return parsed;
}

export function saveLegalJob(job: LegalJob): LegalJob[] {
  const jobs = readLegalJobs();
  const nextJobs = [job, ...jobs];
  window.localStorage.setItem(LEGAL_JOBS_STORAGE_KEY, JSON.stringify(nextJobs));
  return nextJobs;
}

export function readJobApplications(applicantName: string): LegalJobApplication[] {
  const raw = window.localStorage.getItem(PROFESSIONAL_APPLICATIONS_STORAGE_KEY);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every(isLegalJobApplication)) {
    throw new Error("Saved job applications have an invalid format.");
  }
  return parsed.filter(
    (application) => application.applicantName.toLowerCase() === applicantName.toLowerCase(),
  );
}

export function saveJobApplication(
  jobId: string,
  applicantName: string,
): LegalJobApplication[] {
  const raw = window.localStorage.getItem(PROFESSIONAL_APPLICATIONS_STORAGE_KEY);
  const allApplications: unknown = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(allApplications) || !allApplications.every(isLegalJobApplication)) {
    throw new Error("Saved job applications have an invalid format.");
  }
  const exists = allApplications.some((application) =>
    application.jobId === jobId &&
    application.applicantName.toLowerCase() === applicantName.toLowerCase(),
  );
  const nextApplications = exists
    ? allApplications
    : [{ jobId, applicantName, status: "Interested" as const, createdAt: Date.now() }, ...allApplications];
  window.localStorage.setItem(
    PROFESSIONAL_APPLICATIONS_STORAGE_KEY,
    JSON.stringify(nextApplications),
  );
  return nextApplications.filter(
    (application) => application.applicantName.toLowerCase() === applicantName.toLowerCase(),
  );
}

export function publishProfessionalUpdate(
  author: string,
  role: ProfessionalRole,
  text: string,
  image?: string,
): PublishedProfessionalUpdate {
  const raw = window.localStorage.getItem(PROFESSIONAL_FEED_STORAGE_KEY);
  const posts: unknown = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(posts) || !posts.every(isFeedPost)) {
    throw new Error("The shared professional feed has an invalid format.");
  }
  const post: PublishedProfessionalUpdate = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    author,
    role,
    text,
    tags: [],
    createdAt: Date.now(),
    likedBy: [],
    comments: [],
    shares: [],
    ...(image ? { image } : {}),
  };
  window.localStorage.setItem(
    PROFESSIONAL_FEED_STORAGE_KEY,
    JSON.stringify([post, ...posts]),
  );
  return post;
}

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "\"": "&quot;",
    "'": "&apos;",
  })[character] ?? character);
}

function wrapArtworkText(value: string, maxLineLength: number, maxLines: number): string[] {
  const words = value.trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
  const lines: string[] = [];
  let line = "";
  let truncated = false;

  for (const word of words) {
    const chunks = word.match(new RegExp(`.{1,${maxLineLength}}`, "g")) ?? [word];
    for (const chunk of chunks) {
      const nextLine = line ? `${line} ${chunk}` : chunk;
      if (line && nextLine.length > maxLineLength) {
        lines.push(line);
        line = chunk;
        if (lines.length === maxLines) {
          truncated = true;
          break;
        }
      } else {
        line = nextLine;
      }
    }
    if (truncated) break;
  }

  if (line && lines.length < maxLines) lines.push(line);
  if (truncated && lines.length) {
    const lastLine = lines.length - 1;
    lines[lastLine] = `${lines[lastLine].slice(0, maxLineLength - 1).trimEnd()}…`;
  }
  return lines;
}

export function makeProfessionalArtwork(title: string, subtitle: string): string {
  const titleLines = wrapArtworkText(title.slice(0, 96), 24, 3)
    .map((line, index) => `<text x="510" y="${222 + index * 62}" fill="#142943" font-family="Georgia,serif" font-size="52" font-weight="700">${escapeXml(line)}</text>`)
    .join("");
  const subtitleLines = wrapArtworkText(subtitle.slice(0, 120), 42, 2)
    .map((line, index) => `<text x="512" y="${438 + index * 34}" fill="#566477" font-family="Arial,sans-serif" font-size="23">${escapeXml(line)}</text>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="panel" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#142943"/><stop offset="1" stop-color="#203b5a"/></linearGradient><linearGradient id="paper" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fffefa"/><stop offset="1" stop-color="#f2f0e9"/></linearGradient></defs><rect width="1200" height="630" fill="url(#paper)"/><path d="M0 0h420v630H0z" fill="url(#panel)"/><path d="M420 0h16v630h-16z" fill="#c6a86a"/><circle cx="210" cy="294" r="132" fill="none" stroke="#d9c18e" stroke-opacity=".22" stroke-width="2"/><text x="62" y="88" fill="#fff" font-family="Arial,sans-serif" font-size="20" font-weight="700" letter-spacing="3">LEX SUPERMUS</text><text x="62" y="119" fill="#d9c18e" font-family="Arial,sans-serif" font-size="11" font-weight="700" letter-spacing="3">LEGAL NETWORK</text><g fill="none" stroke="#d9c18e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M210 183v174m-82-117h164m-82-1-42 63m42-63 42 63m-88 0c0 20 18 34 46 34s46-14 46-34m-134 0c0 20 18 34 46 34s46-14 46-34m-46 54h92m-107 22h122"/></g><text x="62" y="555" fill="#c8d3df" font-family="Arial,sans-serif" font-size="13" letter-spacing="1.5">WHERE LAW MEETS OPPORTUNITY</text><path d="M510 124h56" stroke="#c6a86a" stroke-width="4"/><text x="510" y="164" fill="#8a6c34" font-family="Arial,sans-serif" font-size="14" font-weight="700" letter-spacing="3">PROFESSIONAL UPDATE</text>${titleLines}${subtitleLines}<path d="M510 526h620" stroke="#d7d9dc" stroke-width="2"/><text x="510" y="566" fill="#566477" font-family="Arial,sans-serif" font-size="14" font-weight="700" letter-spacing="1.2">LEX SUPERMUS  ·  A NETWORK FOR THE LEGAL PROFESSION</text><circle cx="1128" cy="566" r="5" fill="#c6a86a"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
