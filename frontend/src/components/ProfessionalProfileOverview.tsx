"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import ProfileAvatar from "@/components/ProfileAvatar";
import {
  getSavedProfileCoverKey,
  getSavedProfileKey,
  getSavedProfileSectionsKey,
  PROFESSIONAL_FEED_STORAGE_KEY,
  type ProfessionalProfileSectionKey,
  type ProfessionalRole,
} from "@/lib/professional-profile";
import ProfessionalProfileSections from "@/components/ProfessionalProfileSections";

type ProfileDetails = Record<string, string>;
type IntroDraft = {
  name: string;
  headline: string;
  city: string;
  country: string;
};

const PROFILE_ADD_OPTIONS: Array<{ key: ProfessionalProfileSectionKey; title: string }> = [
  { key: "experience", title: "Position / Experience" },
  { key: "education", title: "Education" },
  { key: "skills", title: "Skills" },
  { key: "licenses", title: "Licenses & certifications" },
  { key: "publications", title: "Publications" },
  { key: "honors", title: "Honors & awards" },
  { key: "volunteering", title: "Volunteering" },
  { key: "languages", title: "Languages" },
];

function isProfileDetails(value: unknown): value is ProfileDetails {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((field) => typeof field === "string")
  );
}

export default function ProfessionalProfileOverview({
  role,
  verificationLabel,
  onOpenResume,
}: {
  role: ProfessionalRole;
  verificationLabel?: string;
  onOpenResume: () => void;
}) {
  const [name, setName] = useState("LEX SUPERMUS Member");
  const [avatar, setAvatar] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [completion, setCompletion] = useState(0);
  const [details, setDetails] = useState<ProfileDetails>({});
  const [profileError, setProfileError] = useState("");
  const [showAddSection, setShowAddSection] = useState(false);
  const [showEditIntro, setShowEditIntro] = useState(false);
  const [introDraft, setIntroDraft] = useState<IntroDraft>({
    name: "",
    headline: "",
    city: "",
    country: "India",
  });
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedName =
      window.localStorage.getItem(getSavedProfileKey(role, "name")) ??
      window.localStorage.getItem("lex-supermus-user-name") ??
      "LEX SUPERMUS Member";
    setName(savedName);
    setAvatar(
      window.localStorage.getItem(getSavedProfileKey(role, "avatar")) ??
      window.localStorage.getItem("lex-supermus-user-avatar") ??
      "",
    );
    setCoverImage(
      window.localStorage.getItem(getSavedProfileCoverKey(role, savedName)) ?? "",
    );
    const savedCompletion = Number(
      window.localStorage.getItem("lex-supermus-profile-completion") ?? "0",
    );
    setCompletion(Number.isFinite(savedCompletion)
      ? Math.min(100, Math.max(0, savedCompletion))
      : 0);

    const rawDetails = window.localStorage.getItem(getSavedProfileKey(role, "details"));
    if (!rawDetails) return;
    try {
      const parsed: unknown = JSON.parse(rawDetails);
      if (!isProfileDetails(parsed)) {
        throw new Error("Saved profile details have an invalid format.");
      }
      setDetails(parsed);
    } catch (error) {
      setProfileError(
        error instanceof Error
          ? error.message
          : "Saved profile details could not be read.",
      );
    }
  }, [role]);

  function handleCoverImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProfileError("Choose an image file for your profile cover.");
      event.currentTarget.value = "";
      return;
    }
    if (file.size > 1024 * 1024) {
      setProfileError("Choose a profile cover image smaller than 1 MB.");
      event.currentTarget.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => setProfileError("The profile cover image could not be read.");
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setProfileError("The profile cover image could not be prepared.");
        return;
      }
      try {
        window.localStorage.setItem(
          getSavedProfileCoverKey(role, name),
          reader.result,
        );
        setCoverImage(reader.result);
        setProfileError("");
      } catch (error) {
        setProfileError(
          error instanceof Error
            ? `The profile cover could not be saved: ${error.message}`
            : "The profile cover could not be saved in this browser.",
        );
      }
    };
    reader.readAsDataURL(file);
    event.currentTarget.value = "";
  }

  function handleAvatarImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProfileError("Choose an image file for your profile photo.");
      event.currentTarget.value = "";
      return;
    }
    if (file.size > 1024 * 1024) {
      setProfileError("Choose a profile photo smaller than 1 MB.");
      event.currentTarget.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => setProfileError("The profile photo could not be read.");
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setProfileError("The profile photo could not be prepared.");
        return;
      }
      try {
        window.localStorage.setItem(getSavedProfileKey(role, "avatar"), reader.result);
        window.localStorage.setItem("lex-supermus-user-avatar", reader.result);
        setAvatar(reader.result);
        setProfileError("");
        window.dispatchEvent(new Event("lex-auth-updated"));
      } catch (error) {
        setProfileError(
          error instanceof Error
            ? `The profile photo could not be saved: ${error.message}`
            : "The profile photo could not be saved in this browser.",
        );
      }
    };
    reader.readAsDataURL(file);
    event.currentTarget.value = "";
  }

  const headline = role === "STUDENT"
    ? details.profileHeadline || [details.degree || "Law student", details.institution].filter(Boolean).join(" · ")
    : details.profileHeadline || [details.practiceAreas || "Legal practice", details.city].filter(Boolean).join(" · ");
  const location = [details.city, details.country || "India"].filter(Boolean).join(", ");
  const specialtyItems = (role === "STUDENT" ? details.legalInterests : details.practiceAreas)
    ?.split(/[,;]+/)
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

  function openIntroEditor() {
    setIntroDraft({
      name,
      headline,
      city: details.city ?? "",
      country: details.country || "India",
    });
    setShowEditIntro(true);
    setProfileError("");
  }

  function saveIntro(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = introDraft.name.trim();
    if (!nextName || !introDraft.headline.trim() || !introDraft.country.trim()) {
      setProfileError("Name, headline, and country are required.");
      return;
    }

    const nextDetails = {
      ...details,
      fullName: nextName,
      profileHeadline: introDraft.headline.trim(),
      city: introDraft.city.trim(),
      country: introDraft.country.trim(),
    };
    try {
      const oldSectionsKey = getSavedProfileSectionsKey(role, name);
      const newSectionsKey = getSavedProfileSectionsKey(role, nextName);
      const savedSections = window.localStorage.getItem(oldSectionsKey);
      if (savedSections && oldSectionsKey !== newSectionsKey && !window.localStorage.getItem(newSectionsKey)) {
        window.localStorage.setItem(newSectionsKey, savedSections);
      }

      const oldCoverKey = getSavedProfileCoverKey(role, name);
      const newCoverKey = getSavedProfileCoverKey(role, nextName);
      const savedCover = window.localStorage.getItem(oldCoverKey);
      if (savedCover && oldCoverKey !== newCoverKey && !window.localStorage.getItem(newCoverKey)) {
        window.localStorage.setItem(newCoverKey, savedCover);
      }

      const rawFeed = window.localStorage.getItem(PROFESSIONAL_FEED_STORAGE_KEY);
      if (rawFeed && name.toLowerCase() !== nextName.toLowerCase()) {
        const parsed: unknown = JSON.parse(rawFeed);
        if (!Array.isArray(parsed)) throw new Error("The shared feed has an invalid format.");
        const renamedPosts = parsed.map((post) => {
          if (
            typeof post === "object" &&
            post !== null &&
            "author" in post &&
            "role" in post &&
            post.role === role &&
            typeof post.author === "string" &&
            post.author.toLowerCase() === name.toLowerCase()
          ) {
            return { ...post, author: nextName };
          }
          return post;
        });
        window.localStorage.setItem(PROFESSIONAL_FEED_STORAGE_KEY, JSON.stringify(renamedPosts));
      }

      window.localStorage.setItem(getSavedProfileKey(role, "details"), JSON.stringify(nextDetails));
      window.localStorage.setItem(getSavedProfileKey(role, "name"), nextName);
      if (window.localStorage.getItem("lex-supermus-user-name")?.toLowerCase() === name.toLowerCase()) {
        window.localStorage.setItem("lex-supermus-user-name", nextName);
      }
      if (savedSections && oldSectionsKey !== newSectionsKey) {
        window.localStorage.removeItem(oldSectionsKey);
      }
      if (savedCover && oldCoverKey !== newCoverKey) {
        window.localStorage.removeItem(oldCoverKey);
      }
      setName(nextName);
      setDetails(nextDetails);
      setCoverImage(savedCover ?? coverImage);
      setShowEditIntro(false);
      setProfileError("");
      window.dispatchEvent(new Event("lex-auth-updated"));
    } catch (error) {
      setProfileError(
        error instanceof Error
          ? `Profile intro could not be saved: ${error.message}`
          : "Profile intro could not be saved.",
      );
    }
  }

  return (
    <div className="network-profile-layout">
      <div className="network-profile-main">
        <section className="network-profile-card">
          <div
            className="network-profile-cover"
            style={{
              backgroundImage: `linear-gradient(90deg,rgba(8,23,42,.52),rgba(8,23,42,.08)),url("${coverImage || "/profile-cover.svg"}")`,
            }}
          >
            <span>LEX SUPERMUS</span>
            <small>WHERE LAW MEETS INTELLIGENCE</small>
            <button
              type="button"
              className="network-profile-cover-upload"
              aria-label="Change profile cover image"
              title="Change cover image"
              onClick={() => coverInputRef.current?.click()}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M4 16.5V20h3.5L18.8 8.7l-3.5-3.5L4 16.5Z" />
                <path d="m13.9 6.6 3.5 3.5M4 20l4.3-1" />
              </svg>
            </button>
            <input
              ref={coverInputRef}
              className="network-profile-cover-input"
              type="file"
              accept="image/*"
              onChange={handleCoverImage}
              aria-label="Choose a profile cover image"
            />
          </div>
          <div className="network-profile-intro">
            <div className="network-profile-avatar-control">
              <Link
                href={role === "STUDENT" ? "/student" : "/advocate"}
                className="network-profile-avatar-link"
                aria-label="Open your profile"
              >
                <ProfileAvatar
                  name={name}
                  image={avatar}
                  completion={completion}
                  size="large"
                  className="network-profile-avatar"
                />
              </Link>
              <button
                type="button"
                className="network-profile-avatar-edit"
                aria-label="Change profile photo"
                title="Change profile photo"
                onClick={() => avatarInputRef.current?.click()}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M4 16.5V20h3.5L19 8.5 15.5 5 4 16.5Z" />
                  <path d="m13.5 7 3.5 3.5" />
                </svg>
              </button>
              <input
                ref={avatarInputRef}
                className="network-profile-cover-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarImage}
                aria-label="Choose a profile photo"
              />
            </div>
            <div className="network-profile-identity">
              <span className="network-profile-role">
                {role === "STUDENT" ? "LAW STUDENT" : "LEGAL PROFESSIONAL"}
              </span>
              <button
                type="button"
                className="network-profile-intro-edit"
                aria-label="Edit profile intro"
                title="Edit profile intro"
                onClick={openIntroEditor}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M4 16.5V20h3.5L19 8.5 15.5 5 4 16.5Z" />
                  <path d="m13.5 7 3.5 3.5" />
                </svg>
              </button>
              <h1>{name}</h1>
              <p>{headline}</p>
              <span className="network-profile-location">{location}</span>
            </div>
            <div className="network-profile-actions">
              <button
                type="button"
                className="network-profile-add-section"
                onClick={() => setShowAddSection(true)}
              >
                + Add section
              </button>
              <Link className="network-profile-share" href="/feed">Share an update</Link>
            </div>
          </div>
          {specialtyItems.length > 0 && (
            <div className="network-profile-tags">
              {specialtyItems.map((item) => <span key={item}>{item}</span>)}
            </div>
          )}
        </section>

        {profileError && <p className="feed-error" role="alert">{profileError}</p>}
        <ProfessionalProfileSections role={role} profileName={name} />
      </div>

      <aside className="network-profile-aside">
        <section className="network-profile-aside-card">
          <h2>Profile strength</h2>
          <div className="network-profile-progress"><span style={{ width: `${completion}%` }} /></div>
          <p>{completion}% complete</p>
          <small>A complete profile helps other legal professionals understand your background.</small>
        </section>
        <section className="network-profile-aside-card">
          <h2>Build your professional profile</h2>
          <ul>
            {role === "STUDENT" ? (
              <>
                <li>Showcase your education and internships.</li>
                <li>Add skills, activities, and achievements.</li>
                <li>Keep your resume ready to share.</li>
              </>
            ) : (
              <>
                <li>Highlight your practice and experience.</li>
                <li>Add credentials and publications.</li>
                <li>Keep your professional resume current.</li>
              </>
            )}
          </ul>
          <button type="button" className="profile-resume-button" onClick={onOpenResume}>
            Open resume builder
          </button>
          <Link href="/feed">Visit professional network →</Link>
        </section>
        {role === "ADVOCATE" && (
          <section className="network-profile-aside-card">
            <h2>Bar Council status</h2>
            <p>{verificationLabel || "Not submitted"}</p>
            <small>Enrolment details are self-reported until reviewed through the verification workflow.</small>
          </section>
        )}
      </aside>

      {showAddSection && (
        <div className="profile-add-overlay">
          <section className="profile-add-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-add-heading">
            <div className="profile-add-dialog-heading">
              <h2 id="profile-add-heading">Add to profile</h2>
              <button type="button" aria-label="Close add to profile" onClick={() => setShowAddSection(false)}>×</button>
            </div>
            <div className="profile-add-options">
              {PROFILE_ADD_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option.key}
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("lex-profile-add-section", { detail: option.key }));
                    setShowAddSection(false);
                  }}
                >
                  <span>{option.title}</span><b aria-hidden="true">+</b>
                </button>
              ))}
            </div>
            <p className="profile-add-more">Choose a section to add details to your professional profile.</p>
          </section>
        </div>
      )}
      {showEditIntro && (
        <div className="profile-add-overlay profile-intro-overlay">
          <form className="profile-intro-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-intro-heading" onSubmit={saveIntro}>
            <div className="profile-add-dialog-heading">
              <h2 id="profile-intro-heading">Edit intro</h2>
              <button type="button" aria-label="Close edit intro" onClick={() => setShowEditIntro(false)}>×</button>
            </div>
            <div className="profile-intro-fields">
              <label>Full name<input autoComplete="name" maxLength={120} required value={introDraft.name} onChange={(event) => setIntroDraft({ ...introDraft, name: event.currentTarget.value })} /></label>
              <label>Headline<input maxLength={180} required value={introDraft.headline} onChange={(event) => setIntroDraft({ ...introDraft, headline: event.currentTarget.value })} placeholder={role === "STUDENT" ? "LL.B. · Law school" : "Practice areas · Chamber"} /></label>
              <label>City<input maxLength={100} value={introDraft.city} onChange={(event) => setIntroDraft({ ...introDraft, city: event.currentTarget.value })} /></label>
              <label>Country / region<input maxLength={100} required value={introDraft.country} onChange={(event) => setIntroDraft({ ...introDraft, country: event.currentTarget.value })} /></label>
            </div>
            {profileError && <p className="feed-error" role="alert">{profileError}</p>}
            <div className="profile-intro-actions">
              <button type="button" className="resume-secondary-button" onClick={() => setShowEditIntro(false)}>Cancel</button>
              <button type="submit" className="primary">Save intro</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
