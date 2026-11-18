"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  makeProfessionalArtwork,
  publishProfessionalUpdate,
  readJobApplications,
  readLegalJobs,
  readProfessionalImage,
  saveJobApplication,
  saveLegalJob,
  type LegalJob,
  type LegalJobApplication,
} from "@/lib/professional-content";
import type { ProfessionalRole } from "@/lib/professional-profile";

const SAMPLE_JOBS: LegalJob[] = [
  {
    id: "sample-legal-research-intern",
    title: "Legal Research Intern",
    organization: "LEX SUPERMUS Community",
    location: "Chennai",
    employmentType: "Internship",
    description: "Research, case summaries and drafting support.",
    createdAt: 0,
    postedBy: "LEX SUPERMUS",
  },
  {
    id: "sample-compliance-intern",
    title: "Compliance Intern",
    organization: "LEX SUPERMUS Community",
    location: "Hybrid",
    employmentType: "Internship",
    description: "Regulatory research and documentation.",
    createdAt: 0,
    postedBy: "LEX SUPERMUS",
  },
];

type JobDraft = {
  title: string;
  organization: string;
  location: string;
  employmentType: string;
  description: string;
};

const EMPTY_JOB: JobDraft = {
  title: "",
  organization: "",
  location: "",
  employmentType: "Full-time",
  description: "",
};

function formatJobDate(timestamp: number): string {
  return timestamp
    ? new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "Sample listing";
}

function makeLegalOpportunityCaption(job: JobDraft): string {
  const opportunityDetails = [
    job.employmentType.trim(),
    job.location.trim(),
  ].filter(Boolean).join(" · ");
  return [
    "New legal opportunity",
    [job.title.trim() || "Legal opportunity", opportunityDetails].filter(Boolean).join(" · "),
    job.organization.trim() ? `Organization: ${job.organization.trim()}` : "",
    job.description.trim(),
    "View the full details in Jobs & Internships.",
    "#LegalCareers #LegalJobs",
  ].filter(Boolean).join("\n\n");
}

export default function LegalOpportunitiesPanel({ role }: { role: ProfessionalRole }) {
  const [jobs, setJobs] = useState<LegalJob[]>([]);
  const [applications, setApplications] = useState<LegalJobApplication[]>([]);
  const [userName, setUserName] = useState("");
  const [ready, setReady] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<JobDraft>(EMPTY_JOB);
  const [shareAsPost, setShareAsPost] = useState(false);
  const [caption, setCaption] = useState("");
  const [captionEdited, setCaptionEdited] = useState(false);
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const storedName = window.localStorage.getItem("lex-supermus-user-name") ?? "LEX SUPERMUS Member";
    setUserName(storedName);
    const syncJobs = () => {
      try {
        setJobs(readLegalJobs());
        if (role === "STUDENT") setApplications(readJobApplications(storedName));
        setError("");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Job information could not be loaded.");
      } finally {
        setReady(true);
      }
    };
    syncJobs();
    window.addEventListener("storage", syncJobs);
    return () => window.removeEventListener("storage", syncJobs);
  }, [role]);

  useEffect(() => {
    if (!shareAsPost || captionEdited) return;
    setCaption(makeLegalOpportunityCaption(draft));
  }, [captionEdited, draft.description, draft.employmentType, draft.location, draft.organization, draft.title, shareAsPost]);

  const allJobs = [...jobs, ...SAMPLE_JOBS];

  async function selectImage(file?: File) {
    if (!file) return;
    try {
      setImage(await readProfessionalImage(file));
      setError("");
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : "The image could not be read.");
    }
  }

  function postJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const cleanedJob: LegalJob = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: draft.title.trim(),
      organization: draft.organization.trim(),
      location: draft.location.trim(),
      employmentType: draft.employmentType,
      description: draft.description.trim(),
      createdAt: Date.now(),
      postedBy: userName,
    };
    if (!cleanedJob.title || !cleanedJob.organization || !cleanedJob.location || !cleanedJob.description) {
      setError("Complete the job title, organization, location, and description.");
      return;
    }

    try {
      setJobs(saveLegalJob(cleanedJob));
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? `The job could not be posted: ${saveError.message}`
          : "The job could not be posted.",
      );
      return;
    }

    let promotionError = "";
    if (shareAsPost) {
      try {
        const postCaption = caption.trim() || makeLegalOpportunityCaption(cleanedJob);
        publishProfessionalUpdate(
          userName,
          "ADVOCATE",
          postCaption,
          image || makeProfessionalArtwork(cleanedJob.title, `${cleanedJob.organization} · ${cleanedJob.location}`),
        );
        setNotice("Job posted and shared to the professional feed.");
      } catch (shareError) {
        setNotice("The job is posted and visible in the student Jobs portal.");
        promotionError =
          shareError instanceof Error
            ? `The job was saved, but the feed post could not be created: ${shareError.message}`
            : "The job was saved, but the feed post could not be created.";
      }
    } else {
      setNotice("Job posted. It is now visible in the student Jobs portal.");
    }
    setDraft(EMPTY_JOB);
    setShareAsPost(false);
    setCaption("");
    setCaptionEdited(false);
    setImage("");
    setShowForm(false);
    setError(promotionError);
  }

  function expressInterest(job: LegalJob) {
    try {
      setApplications(saveJobApplication(job.id, userName));
      setNotice(`Your interest in ${job.title} has been saved.`);
      setError("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Your interest could not be saved.");
    }
  }

  if (!ready) return <p className="network-profile-loading" aria-busy="true">Loading legal opportunities…</p>;

  return (
    <div className="legal-opportunities">
      <div className="legal-opportunities-heading">
        <div>
          <p className="sub">
            {role === "ADVOCATE"
              ? "Share a legal opportunity with students and professionals."
              : "Explore opportunities posted by advocates and the legal community."}
          </p>
          <p className="jobs-demo-note">Listings in this preview are stored in this browser.</p>
        </div>
        {role === "ADVOCATE" && (
          <button type="button" className="primary" onClick={() => { setShowForm((open) => !open); setNotice(""); setError(""); }}>
            {showForm ? "Cancel" : "+ Post a job"}
          </button>
        )}
      </div>

      {notice && <p className="job-notice" role="status">{notice}</p>}
      {error && <p className="feed-error" role="alert">{error}</p>}

      {role === "ADVOCATE" && showForm && (
        <form className="job-post-form" onSubmit={postJob}>
          <h2>Post a legal opportunity</h2>
          <div className="job-post-form-grid">
            <label>Job title<input maxLength={120} required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.currentTarget.value })} placeholder="e.g. Legal Research Associate" /></label>
            <label>Organization / chamber<input maxLength={120} required value={draft.organization} onChange={(event) => setDraft({ ...draft, organization: event.currentTarget.value })} placeholder="Firm, chamber, or organization" /></label>
            <label>Location<input maxLength={100} required value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.currentTarget.value })} placeholder="City or remote" /></label>
            <label>Opportunity type
              <select value={draft.employmentType} onChange={(event) => setDraft({ ...draft, employmentType: event.currentTarget.value })}>
                <option>Full-time</option><option>Part-time</option><option>Internship</option><option>Consulting</option><option>Volunteer</option>
              </select>
            </label>
            <label className="job-post-form-full">Description<textarea required maxLength={2000} rows={4} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.currentTarget.value })} placeholder="Responsibilities, qualifications, and how to apply…" /></label>
          </div>
          <label className="job-share-toggle">
            <input type="checkbox" checked={shareAsPost} onChange={(event) => { setShareAsPost(event.currentTarget.checked); setCaptionEdited(false); }} />
            <span>Also share this opportunity as a post on my profile</span>
          </label>
          {shareAsPost && (
            <div className="job-post-promotion">
              <label>Feed caption<textarea rows={8} maxLength={1800} value={caption} onChange={(event) => { setCaption(event.currentTarget.value); setCaptionEdited(true); }} /></label>
              <div className="job-promotion-image-field">
                <div>
                  <b>Post image</b>
                  <small>Generated automatically. Replace it with a photo or GIF, or return to the generated artwork.</small>
                </div>
                <input aria-label="Replace generated job image with a photo or GIF" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { const input = event.currentTarget; const file = input.files?.[0]; input.value = ""; void selectImage(file); }} />
                {image && <button type="button" className="resume-secondary-button" onClick={() => setImage("")}>Use generated artwork</button>}
                <img
                  className="job-promotion-preview"
                  src={image || makeProfessionalArtwork(draft.title || "Legal Opportunity", `${draft.organization || "LEX SUPERMUS"} · ${draft.location || "India"}`)}
                  alt="Preview of the generated legal-opportunity post image"
                />
              </div>
            </div>
          )}
          <button className="primary" type="submit">Publish job</button>
        </form>
      )}

      <div className="legal-job-list">
        {allJobs.map((job) => {
          const applied = applications.some((application) => application.jobId === job.id);
          const isOwnPost = job.postedBy.toLowerCase() === userName.toLowerCase();
          return (
            <article className="legal-job-card" key={job.id}>
              <div className="legal-job-card-heading">
                <div>
                  <span className="legal-job-type">{job.employmentType}</span>
                  <h2>{job.title}</h2>
                  <p>{job.organization} · {job.location}</p>
                </div>
                {role === "ADVOCATE" && isOwnPost && <span className="pill">Your listing</span>}
              </div>
              <p className="legal-job-description">{job.description}</p>
              <div className="legal-job-card-footer">
                <small>{job.createdAt ? `Posted by ${job.postedBy} · ${formatJobDate(job.createdAt)}` : "Sample listing"}</small>
                {role === "STUDENT" && (
                  <button type="button" className={applied ? "job-interest-button is-interested" : "job-interest-button"} aria-pressed={applied} disabled={applied} onClick={() => expressInterest(job)}>
                    {applied ? "✓ Interested" : "I’m interested"}
                  </button>
                )}
              </div>
            </article>
          );
        })}
        {allJobs.length === 0 && <p className="feed-empty">No opportunities have been posted yet.</p>}
      </div>
    </div>
  );
}

export function JobApplicationStatusPanel({ role }: { role: ProfessionalRole }) {
  const [items, setItems] = useState<LegalJob[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const userName = window.localStorage.getItem("lex-supermus-user-name") ?? "LEX SUPERMUS Member";
    const sync = () => {
      try {
        if (role === "STUDENT") {
          const jobs = readLegalJobs();
          setItems(readJobApplications(userName).map((application) =>
            jobs.find((job) => job.id === application.jobId) ??
            SAMPLE_JOBS.find((job) => job.id === application.jobId) ?? {
              id: application.jobId,
              title: "Legal opportunity",
              organization: "Listing no longer available",
              location: "",
              employmentType: application.status,
              description: "",
              createdAt: application.createdAt,
              postedBy: "",
            },
          ));
        } else {
          setItems(readLegalJobs().filter((job) =>
            job.postedBy.toLowerCase() === userName.toLowerCase(),
          ));
        }
        setError("");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Application status could not be loaded.");
      }
    };
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [role]);

  return (
    <section className="network-profile-section student-applications">
      <div className="network-profile-section-heading">
        <h2>{role === "STUDENT" ? "Application status" : "Your posted opportunities"}</h2>
        <span className="pill">{role === "STUDENT" ? `${items.length} saved` : `${items.length} posted`}</span>
      </div>
      {error && <p className="feed-error" role="alert">{error}</p>}
      {items.length === 0 ? (
        <p className="profile-section-empty">
          {role === "STUDENT"
            ? "Opportunities you mark as interested in will appear here."
            : "Jobs you post will appear here."}
        </p>
      ) : items.map((item) => (
        <div className="student-application-row" key={item.id}>
          <div>
            <b>{item.title}</b>
            <span>{role === "STUDENT" ? "You marked this opportunity as interesting" : `${item.organization} · ${item.location}`}</span>
          </div>
          <span className="pill">{role === "STUDENT" ? "Interested" : "Posted"}</span>
        </div>
      ))}
    </section>
  );
}
