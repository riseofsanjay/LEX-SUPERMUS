"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  ADVOCATE_RESUME_DRAFT_STORAGE_KEY,
  getSavedProfileSectionsKey,
  PROFESSIONAL_FEED_STORAGE_KEY,
  STUDENT_RESUME_DRAFT_STORAGE_KEY,
  type ProfessionalProfileEntry,
  type ProfessionalProfileSectionKey,
  type ProfessionalRole,
  type SavedProfessionalProfileSections,
} from "@/lib/professional-profile";
import {
  makeProfessionalArtwork,
  publishProfessionalUpdate,
  readProfessionalImage,
} from "@/lib/professional-content";
import {
  parseStudentEducationDetails,
  STUDENT_EDUCATION_STORAGE_KEY,
} from "@/lib/student-resume";

type EntryFieldKey = "title" | "organization" | "context" | "dates" | "description" | "url";

type SectionKey = ProfessionalProfileSectionKey;
type ProfileEntry = ProfessionalProfileEntry;
type ProfileSections = SavedProfessionalProfileSections;

type SectionField = {
  key: EntryFieldKey;
  label: string;
  placeholder: string;
  multiline?: boolean;
};

type SectionDefinition = {
  key: SectionKey;
  title: string;
  emptyText: string;
  fields: SectionField[];
};

type ActivityPost = {
  id: string;
  author: string;
  text: string;
  image?: string;
  createdAt: number;
  likes: number;
  comments: number;
};

type StoredActivityPost = {
  id: string;
  author: string;
  text: string;
  image?: string;
  createdAt: number;
  likedBy: unknown[];
  comments: unknown[];
};

const SECTION_DEFINITIONS: SectionDefinition[] = [
  {
    key: "experience",
    title: "Experience",
    emptyText: "Add internships, legal practice, research, or other relevant experience.",
    fields: [
      { key: "title", label: "Role / position", placeholder: "e.g. Legal Research Intern" },
      { key: "organization", label: "Organization", placeholder: "Court, chamber, firm, or institution" },
      { key: "context", label: "Type / focus", placeholder: "e.g. Internship · Civil litigation" },
      { key: "dates", label: "Dates", placeholder: "e.g. May 2025 – Aug 2025" },
      { key: "description", label: "Description", placeholder: "Describe your work and contributions.", multiline: true },
    ],
  },
  {
    key: "education",
    title: "Education",
    emptyText: "Add your law school, university, and other relevant education.",
    fields: [
      { key: "title", label: "Degree / qualification", placeholder: "e.g. B.A. LL.B." },
      { key: "organization", label: "Institution", placeholder: "University or law school" },
      { key: "context", label: "Field / grade", placeholder: "e.g. Constitutional law · GPA / score" },
      { key: "dates", label: "Dates", placeholder: "e.g. 2022 – 2027" },
      { key: "description", label: "Description", placeholder: "Add relevant coursework or academic highlights.", multiline: true },
    ],
  },
  {
    key: "licenses",
    title: "Licenses & certifications",
    emptyText: "Add Bar Council enrolment details, certificates, or professional courses.",
    fields: [
      { key: "title", label: "Credential", placeholder: "Credential or certificate name" },
      { key: "organization", label: "Issuing organization", placeholder: "Issuing body" },
      { key: "context", label: "Credential ID (optional)", placeholder: "Credential ID" },
      { key: "dates", label: "Issue / expiry date", placeholder: "e.g. Issued Jun 2025" },
      { key: "url", label: "Credential URL (optional)", placeholder: "https://…" },
    ],
  },
  {
    key: "volunteering",
    title: "Volunteering",
    emptyText: "Highlight pro bono work, legal aid, community service, or leadership.",
    fields: [
      { key: "title", label: "Role", placeholder: "e.g. Legal aid volunteer" },
      { key: "organization", label: "Organization", placeholder: "Organization or initiative" },
      { key: "context", label: "Cause / area", placeholder: "e.g. Access to justice" },
      { key: "dates", label: "Dates", placeholder: "e.g. 2024 – Present" },
      { key: "description", label: "Description", placeholder: "Describe your contribution.", multiline: true },
    ],
  },
  {
    key: "skills",
    title: "Skills",
    emptyText: "Add legal and professional skills you can confidently demonstrate.",
    fields: [
      { key: "title", label: "Skill", placeholder: "e.g. Legal research" },
      { key: "context", label: "Related area (optional)", placeholder: "e.g. Civil procedure" },
    ],
  },
  {
    key: "publications",
    title: "Publications",
    emptyText: "Add published articles, case comments, papers, or legal research.",
    fields: [
      { key: "title", label: "Title", placeholder: "Publication or paper title" },
      { key: "organization", label: "Publisher / journal", placeholder: "Journal, publisher, or conference" },
      { key: "context", label: "Publication type", placeholder: "e.g. Article · Case comment" },
      { key: "dates", label: "Publication date", placeholder: "e.g. Mar 2025" },
      { key: "url", label: "Link (optional)", placeholder: "https://…" },
      { key: "description", label: "Description", placeholder: "Add a short summary.", multiline: true },
    ],
  },
  {
    key: "honors",
    title: "Honors & awards",
    emptyText: "Add awards, moot court recognition, scholarships, or other honors.",
    fields: [
      { key: "title", label: "Award / honor", placeholder: "Award or recognition" },
      { key: "organization", label: "Issuing organization", placeholder: "Organization" },
      { key: "context", label: "Recognition (optional)", placeholder: "e.g. Finalist · Best memorial" },
      { key: "dates", label: "Date", placeholder: "e.g. 2025" },
      { key: "description", label: "Description (optional)", placeholder: "Add context.", multiline: true },
    ],
  },
  {
    key: "languages",
    title: "Languages",
    emptyText: "Add languages and your level of proficiency.",
    fields: [
      { key: "title", label: "Language", placeholder: "e.g. Tamil" },
      { key: "context", label: "Proficiency", placeholder: "e.g. Native · Professional working" },
    ],
  },
];

const SECTION_KEYS: SectionKey[] = SECTION_DEFINITIONS.map(({ key }) => key);
const SECTION_UPDATE_HASHTAGS: Record<Exclude<SectionKey, "languages">, string> = {
  experience: "#LegalCareers #ProfessionalGrowth",
  education: "#LegalEducation #LegalProfessionals",
  licenses: "#ProfessionalDevelopment #LegalCredentials",
  volunteering: "#ProBono #AccessToJustice",
  skills: "#LegalSkills #ProfessionalGrowth",
  publications: "#LegalResearch #LegalPublications",
  honors: "#LegalCommunity #Achievement",
};
const EMPTY_ENTRY: Omit<ProfileEntry, "id"> = {
  title: "",
  organization: "",
  context: "",
  dates: "",
  description: "",
  url: "",
};

function makeProfileUpdateCaption(section: SectionDefinition, entry: ProfileEntry): string {
  if (section.key === "languages") return "";
  const organizationLabel = section.key === "education"
    ? "Institution"
    : section.key === "licenses" || section.key === "honors"
      ? "Issued by"
      : section.key === "publications"
        ? "Publisher"
        : "Organization";
  const contextLabel = section.key === "education"
    ? "Focus / grade"
    : section.key === "licenses"
      ? "Credential details"
      : section.key === "publications"
        ? "Publication type"
        : section.key === "honors"
          ? "Recognition"
          : section.key === "skills"
            ? "Related area"
            : "Focus";
  return [
    `${section.title} update`,
    entry.title.trim(),
    entry.organization.trim() ? `${organizationLabel}: ${entry.organization.trim()}` : "",
    entry.context.trim() ? `${contextLabel}: ${entry.context.trim()}` : "",
    entry.dates.trim() ? `Dates: ${entry.dates.trim()}` : "",
    entry.description.trim(),
    SECTION_UPDATE_HASHTAGS[section.key],
  ].filter(Boolean).join("\n\n");
}

function makeProfileUpdateArtwork(section: SectionDefinition, entry: ProfileEntry): string {
  const subtitle = [
    entry.title.trim() || "Professional update",
    entry.organization.trim(),
  ].filter(Boolean).join(" · ");
  return makeProfessionalArtwork(section.title, subtitle);
}

function emptySections(): ProfileSections {
  return {
    experience: [],
    education: [],
    licenses: [],
    volunteering: [],
    skills: [],
    publications: [],
    honors: [],
    languages: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isProfileEntry(value: unknown): value is ProfileEntry {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    (["title", "organization", "context", "dates", "description", "url"] as const)
      .every((field) => typeof value[field] === "string")
  );
}

function isProfileSections(value: unknown): value is ProfileSections {
  return isRecord(value) && SECTION_KEYS.every(
    (key) => Array.isArray(value[key]) && value[key].every(isProfileEntry),
  );
}

function makeEntry(
  section: SectionKey,
  values: Partial<Omit<ProfileEntry, "id">>,
  index = 0,
): ProfileEntry {
  return {
    id: `${section}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
    ...EMPTY_ENTRY,
    ...values,
  };
}

function readDraft(storageKey: string): Record<string, string> {
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return {};
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed) || !isRecord(parsed.content)) return {};
  return Object.fromEntries(
    Object.entries(parsed.content).filter((entry): entry is [string, string] =>
      typeof entry[1] === "string",
    ),
  );
}

function lines(value: string | undefined, splitComma = false): string[] {
  if (!value) return [];
  return value
    .split(splitComma ? /\r?\n|,/ : /\r?\n/)
    .map((item) => item.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean);
}

function isSafeProfileUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function ProfileActionIcon({ action }: { action: "add" | "edit" }) {
  if (action === "add") {
    return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>;
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 16.5V20h3.5L19 8.5 15.5 5 4 16.5Z" /><path d="m13.5 7 3.5 3.5" /></svg>;
}

function ProfileIconButton({
  action,
  label,
  onClick,
  pressed,
}: {
  action: "add" | "edit";
  label: string;
  onClick: () => void;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      className="profile-icon-button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={onClick}
    >
      <ProfileActionIcon action={action} />
    </button>
  );
}

function addListEntries(
  sections: ProfileSections,
  section: SectionKey,
  value: string | undefined,
  splitComma = false,
) {
  sections[section].push(
    ...lines(value, splitComma).map((title, index) => makeEntry(section, { title }, index)),
  );
}

function seedProfileSections(
  role: ProfessionalRole,
  details: Record<string, string>,
): ProfileSections {
  const sections = emptySections();

  if (role === "STUDENT") {
    const rawEducation = window.localStorage.getItem(STUDENT_EDUCATION_STORAGE_KEY);
    if (rawEducation) {
      const education = parseStudentEducationDetails(JSON.parse(rawEducation));
      if (education) {
        const academicEntries = [
          ["Undergraduate", education.ug],
          ["Postgraduate", education.pg],
          ["Higher Secondary", education.hsc],
          ["Secondary", education.ssc],
        ] as const;
        academicEntries.forEach(([label, entry], index) => {
          if (Object.values(entry).some(Boolean)) {
            sections.education.push(makeEntry("education", {
              title: entry.qualification || label,
              organization: entry.institution,
              context: entry.score ? `Score: ${entry.score}` : "",
              dates: entry.completionYear,
            }, index));
          }
        });
        if (education.experience.role || education.experience.organization || education.experience.description) {
          sections.experience.push(makeEntry("experience", {
            title: education.experience.role,
            organization: education.experience.organization,
            dates: education.experience.duration,
            description: education.experience.description,
          }));
        }
        education.additionalCourses.forEach((course, index) => {
          if (course.name || course.organization) {
            sections.licenses.push(makeEntry("licenses", {
              title: course.name,
              organization: course.organization,
              dates: course.year,
            }, index));
          }
        });
      }
    }

    if (sections.education.length === 0 && (details.degree || details.institution)) {
      sections.education.push(makeEntry("education", {
        title: details.degree,
        organization: details.institution,
        context: details.yearOfStudy ? `Year of study: ${details.yearOfStudy}` : "",
        dates: details.graduationYear ? `Expected ${details.graduationYear}` : "",
      }));
    }

    const draft = readDraft(STUDENT_RESUME_DRAFT_STORAGE_KEY);
    addListEntries(sections, "experience", draft.internships);
    addListEntries(sections, "licenses", draft.certifications);
    addListEntries(sections, "volunteering", draft.volunteering);
    addListEntries(sections, "skills", details.legalInterests, true);
    addListEntries(sections, "skills", draft.skills, true);
    addListEntries(sections, "honors", draft.achievements);
    addListEntries(sections, "languages", draft.languages, true);
  } else {
    const council = details.stateBarCouncil;
    const enrolmentNumber = details.barCouncilNumber;
    if (council || enrolmentNumber) {
      sections.licenses.push(makeEntry("licenses", {
        title: "Bar Council enrolment (self-reported)",
        organization: council,
        context: enrolmentNumber ? `Enrolment number: ${enrolmentNumber}` : "",
      }));
    }

    const draft = readDraft(ADVOCATE_RESUME_DRAFT_STORAGE_KEY);
    addListEntries(sections, "skills", details.practiceAreas, true);
    if (draft.lawDegree || draft.lawInstitution) {
      sections.education.push(makeEntry("education", {
        title: draft.lawDegree,
        organization: draft.lawInstitution,
        dates: draft.graduationYear,
      }));
    }
    addListEntries(sections, "experience", draft.professionalExperience);
    addListEntries(sections, "licenses", draft.certifications);
    addListEntries(sections, "skills", draft.skills, true);
    addListEntries(sections, "publications", draft.publications);
    addListEntries(sections, "honors", draft.achievements);
    addListEntries(sections, "languages", draft.languages, true);
  }

  return sections;
}

function isActivityPost(value: unknown): value is StoredActivityPost {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.author === "string" &&
    typeof value.text === "string" &&
    (value.image === undefined || typeof value.image === "string") &&
    typeof value.createdAt === "number" &&
    Array.isArray(value.likedBy) &&
    Array.isArray(value.comments)
  );
}

function formatActivityDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ActivitySection({
  posts,
  profileName,
}: {
  posts: ActivityPost[];
  profileName: string;
}) {
  const memberPosts = posts.filter(
    (post) => post.author.toLowerCase() === profileName.toLowerCase(),
  );

  return (
    <section className="network-profile-section">
      <div className="network-profile-section-heading">
        <div>
          <h2>Activity</h2>
          <p>{memberPosts.length} posts · Share your legal journey with the community.</p>
        </div>
        <Link href="/feed">Create a post</Link>
      </div>
      {memberPosts.length === 0 ? (
        <div className="profile-section-empty">
          <p>Your posts, case notes, and career updates will appear here.</p>
          <Link href="/feed">Share your first update →</Link>
        </div>
      ) : (
        <div className="profile-activity-list">
          {memberPosts.slice(0, 3).map((post) => (
            <article className="profile-activity-item" key={post.id}>
              <p>{post.text}</p>
              {post.image && <img className="profile-activity-image" src={post.image} alt="Image attached to this profile update" />}
              <div>
                <span>{formatActivityDate(post.createdAt)}</span>
                <span>♥ {post.likes}</span>
                <span>{post.comments} comments</span>
              </div>
            </article>
          ))}
          {memberPosts.length > 3 && <Link href="/feed">View all activity →</Link>}
        </div>
      )}
    </section>
  );
}

export default function ProfessionalProfileSections({
  role,
  profileName,
}: {
  role: ProfessionalRole;
  profileName: string;
}) {
  const [sections, setSections] = useState<ProfileSections>(emptySections);
  const [activity, setActivity] = useState<ActivityPost[]>([]);
  const [ready, setReady] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [managingSection, setManagingSection] = useState<SectionKey | null>(null);
  const [draft, setDraft] = useState<ProfileEntry>(() => makeEntry("experience", {}));
  const [sectionError, setSectionError] = useState("");
  const [shareUpdate, setShareUpdate] = useState(false);
  const [updateCaption, setUpdateCaption] = useState("");
  const [updateCaptionEdited, setUpdateCaptionEdited] = useState(false);
  const [updateImage, setUpdateImage] = useState("");
  const storageKey = getSavedProfileSectionsKey(role, profileName);

  useEffect(() => {
    if (!shareUpdate || !editingSection || editingSection === "languages" || updateCaptionEdited) return;
    const section = SECTION_DEFINITIONS.find((item) => item.key === editingSection);
    if (!section) return;
    setUpdateCaption(makeProfileUpdateCaption(section, draft));
  }, [draft, editingSection, shareUpdate, updateCaptionEdited]);

  useEffect(() => {
    try {
      const savedSections = window.localStorage.getItem(storageKey);
      if (savedSections) {
        const parsed: unknown = JSON.parse(savedSections);
        if (!isProfileSections(parsed)) {
          throw new Error("Saved profile sections have an invalid format.");
        }
        setSections(parsed);
      } else {
        const rawDetails = window.localStorage.getItem(`lex-supermus-saved-${role.toLowerCase()}-details`);
        const parsedDetails: unknown = rawDetails ? JSON.parse(rawDetails) : {};
        const details = isRecord(parsedDetails)
          ? Object.fromEntries(
              Object.entries(parsedDetails).filter((entry): entry is [string, string] =>
                typeof entry[1] === "string",
              ),
            )
          : {};
        setSections(seedProfileSections(role, details));
      }

      const rawActivity = window.localStorage.getItem(PROFESSIONAL_FEED_STORAGE_KEY);
      if (rawActivity) {
        const parsed: unknown = JSON.parse(rawActivity);
        if (!Array.isArray(parsed) || !parsed.every(isActivityPost)) {
          throw new Error("Saved activity has an invalid format.");
        }
        setActivity(parsed.map((post) => ({
          id: post.id,
          author: post.author,
          text: post.text,
          image: post.image,
          createdAt: post.createdAt,
          likes: post.likedBy.length,
          comments: post.comments.length,
        })));
      }
    } catch (error) {
      setProfileError(
        error instanceof Error
          ? `Some profile information could not be loaded: ${error.message}`
          : "Some profile information could not be loaded.",
      );
    } finally {
      setReady(true);
    }
  }, [role, storageKey]);

  function openAddForm(section: SectionKey) {
    setEditingSection(section);
    setEditingEntryId(null);
    setDraft(makeEntry(section, {}));
    setSectionError("");
    setShareUpdate(false);
    setUpdateCaption("");
    setUpdateCaptionEdited(false);
    setUpdateImage("");
  }

  function openEditForm(section: SectionKey, entry: ProfileEntry) {
    setEditingSection(section);
    setEditingEntryId(entry.id);
    setDraft({ ...entry });
    setSectionError("");
    setShareUpdate(false);
    setUpdateCaption("");
    setUpdateCaptionEdited(false);
    setUpdateImage("");
  }

  useEffect(() => {
    const handleAddSection = (event: Event) => {
      const section = (event as CustomEvent<SectionKey>).detail;
      if (!SECTION_KEYS.includes(section)) return;
      setEditingSection(section);
      setEditingEntryId(null);
      setDraft(makeEntry(section, {}));
      setSectionError("");
      setShareUpdate(false);
      setUpdateCaption("");
      setUpdateCaptionEdited(false);
      setUpdateImage("");
      window.setTimeout(() => {
        document.getElementById(`profile-section-${section}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 0);
    };
    window.addEventListener("lex-profile-add-section", handleAddSection);
    return () => window.removeEventListener("lex-profile-add-section", handleAddSection);
  }, []);

  function saveSections(nextSections: ProfileSections): boolean {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(nextSections));
      setSections(nextSections);
      setEditingSection(null);
      setEditingEntryId(null);
      setSectionError("");
      setProfileError("");
      return true;
    } catch (error) {
      setSectionError(
        error instanceof Error
          ? `This section could not be saved: ${error.message}`
          : "This section could not be saved in this browser.",
      );
      return false;
    }
  }

  async function saveEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingSection || !draft.title.trim()) {
      setSectionError("Add a title or role before saving this entry.");
      return;
    }
    if (draft.url.trim() && !isSafeProfileUrl(draft.url.trim())) {
      setSectionError("Enter a valid http or https link.");
      return;
    }
    const cleanedEntry: ProfileEntry = {
      id: draft.id,
      title: draft.title.trim(),
      organization: draft.organization.trim(),
      context: draft.context.trim(),
      dates: draft.dates.trim(),
      description: draft.description.trim(),
      url: draft.url.trim(),
    };
    const currentEntries = sections[editingSection];
    const nextEntries = editingEntryId
      ? currentEntries.map((entry) => entry.id === editingEntryId ? cleanedEntry : entry)
      : [...currentEntries, cleanedEntry];
    if (!saveSections({ ...sections, [editingSection]: nextEntries })) return;

    if (shareUpdate && editingSection !== "languages") {
      const section = SECTION_DEFINITIONS.find((item) => item.key === editingSection);
      if (!section) return;
      try {
        const post = publishProfessionalUpdate(
          profileName,
          role,
          updateCaption.trim() || makeProfileUpdateCaption(section, cleanedEntry),
          updateImage || makeProfileUpdateArtwork(section, cleanedEntry),
        );
        setActivity((current) => [{
          id: post.id,
          author: post.author,
          text: post.text,
          image: post.image,
          createdAt: post.createdAt,
          likes: 0,
          comments: 0,
        }, ...current]);
      } catch (error) {
        setProfileError(
          error instanceof Error
            ? `Profile saved, but the update could not be posted: ${error.message}`
            : "Profile saved, but the update could not be posted.",
        );
      }
    }
    setShareUpdate(false);
    setUpdateCaption("");
    setUpdateCaptionEdited(false);
    setUpdateImage("");
  }

  function removeEntry(section: SectionKey, entryId: string) {
    saveSections({
      ...sections,
      [section]: sections[section].filter((entry) => entry.id !== entryId),
    });
  }

  function toggleSectionManagement(section: SectionKey) {
    setManagingSection((current) => current === section ? null : section);
    if (editingSection === section) {
      setEditingSection(null);
      setEditingEntryId(null);
      setSectionError("");
    }
  }

  function deleteEditingEntry() {
    if (!editingSection || !editingEntryId) return;
    const section = SECTION_DEFINITIONS.find((item) => item.key === editingSection);
    if (!section || !window.confirm(`Delete this ${section.title.toLowerCase()} entry?`)) return;
    removeEntry(editingSection, editingEntryId);
  }

  if (!ready) {
    return <p className="network-profile-loading" aria-busy="true">Loading your profile sections…</p>;
  }

  return (
    <div className="network-profile-sections">
      {profileError && <p className="feed-error" role="alert">{profileError}</p>}
      <ActivitySection posts={activity} profileName={profileName} />
      {SECTION_DEFINITIONS.map((section) => (
        <section className="network-profile-section" id={`profile-section-${section.key}`} key={section.key}>
          <div className="network-profile-section-heading">
            <h2>{section.title}</h2>
            <div className="profile-section-controls">
              <ProfileIconButton
                action="add"
                label={`Add ${section.title.toLowerCase()}`}
                onClick={() => openAddForm(section.key)}
              />
              <ProfileIconButton
                action="edit"
                label={`${managingSection === section.key ? "Stop editing" : "Edit"} ${section.title.toLowerCase()}`}
                pressed={managingSection === section.key}
                onClick={() => toggleSectionManagement(section.key)}
              />
            </div>
          </div>

          {sections[section.key].length === 0 ? (
            <div className="profile-section-empty">
              <p>{section.emptyText}</p>
            </div>
          ) : section.key === "skills" || section.key === "languages" ? (
            <div className="profile-skill-list">
              {sections[section.key].map((entry) => (
                <article className="profile-skill-item" key={entry.id}>
                  <div>
                    <b>{entry.title}</b>
                    {entry.context && <span>{entry.context}</span>}
                  </div>
                  {managingSection === section.key && (
                    <div className="profile-entry-actions">
                      <ProfileIconButton action="edit" label={`Edit ${entry.title}`} onClick={() => openEditForm(section.key, entry)} />
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="profile-entry-list">
              {sections[section.key].map((entry) => (
                <article className="profile-entry" key={entry.id}>
                  <div className="profile-entry-content">
                    <h3>{entry.title}</h3>
                    {entry.organization && <p className="profile-entry-organization">{entry.organization}</p>}
                    {(entry.context || entry.dates) && (
                      <p className="profile-entry-meta">{[entry.context, entry.dates].filter(Boolean).join(" · ")}</p>
                    )}
                    {entry.description && <p className="profile-entry-description">{entry.description}</p>}
                    {entry.url && isSafeProfileUrl(entry.url) && (
                      <a href={entry.url} target="_blank" rel="noreferrer">View credential / publication</a>
                    )}
                  </div>
                  {managingSection === section.key && (
                    <div className="profile-entry-actions">
                      <ProfileIconButton action="edit" label={`Edit ${entry.title}`} onClick={() => openEditForm(section.key, entry)} />
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          {editingSection === section.key && (
            <form className="profile-section-form" onSubmit={saveEntry}>
              <h3>{editingEntryId ? `Edit ${section.title.toLowerCase()}` : `Add ${section.title.toLowerCase()}`}</h3>
              <div className="profile-section-form-grid">
                {section.fields.map((field) => (
                  <label className={field.multiline ? "profile-form-field profile-form-field--full" : "profile-form-field"} key={field.key}>
                    {field.label}
                    {field.multiline ? (
                      <textarea
                        value={draft[field.key]}
                        onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))}
                        placeholder={field.placeholder}
                        rows={3}
                      />
                    ) : (
                      <input
                        type={field.key === "url" ? "url" : "text"}
                        value={draft[field.key]}
                        onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))}
                        placeholder={field.placeholder}
                        required={field.key === "title"}
                      />
                    )}
                  </label>
                ))}
              </div>
              {section.key !== "languages" && (
                <div className="profile-share-update">
                  <label className="profile-share-update-toggle">
                    <input
                      type="checkbox"
                      checked={shareUpdate}
                      onChange={(event) => {
                        setShareUpdate(event.currentTarget.checked);
                        setUpdateCaptionEdited(false);
                      }}
                    />
                    <span>Share this {section.title.toLowerCase()} update on the professional feed</span>
                  </label>
                  {shareUpdate && (
                    <div className="profile-share-update-fields">
                      <label>
                        Caption
                        <textarea
                          rows={3}
                          maxLength={1800}
                          value={updateCaption}
                          onChange={(event) => {
                            setUpdateCaption(event.currentTarget.value);
                            setUpdateCaptionEdited(true);
                          }}
                        />
                      </label>
                      <div className="profile-update-artwork">
                        <b>Post image</b>
                        <small>Generated automatically. Replace it with a photo or GIF, or return to the generated artwork.</small>
                        <input
                          aria-label="Replace generated profile update image with a photo or GIF"
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={async (event) => {
                            const file = event.currentTarget.files?.[0];
                            event.currentTarget.value = "";
                            if (!file) return;
                            try {
                              setUpdateImage(await readProfessionalImage(file));
                              setSectionError("");
                            } catch (error) {
                              setSectionError(error instanceof Error ? error.message : "The image could not be read.");
                            }
                          }}
                        />
                        {updateImage && <button type="button" className="resume-secondary-button" onClick={() => setUpdateImage("")}>Use generated artwork</button>}
                        <small>Photos and GIFs must be 1 MB or smaller.</small>
                        <img
                          className="profile-update-image-preview"
                          src={updateImage || makeProfileUpdateArtwork(section, draft)}
                          alt="Preview of the generated profile-update image"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
              {sectionError && <p className="feed-error" role="alert">{sectionError}</p>}
              <div className="profile-section-form-actions">
                <button className="primary" type="submit">Save section</button>
                {editingEntryId && (
                  <button className="profile-section-delete-button" type="button" onClick={deleteEditingEntry}>
                    Delete entry
                  </button>
                )}
                <button className="resume-secondary-button" type="button" onClick={() => { setEditingSection(null); setSectionError(""); }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      ))}
    </div>
  );
}
