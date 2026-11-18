"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PortalShell from "@/components/PortalShell";
import ProfessionalProfileOverview from "@/components/ProfessionalProfileOverview";
import JobsSectionSwitcher, { type JobsSection } from "@/components/portals/JobsSectionSwitcher";
import LegalOpportunitiesPanel, { JobApplicationStatusPanel } from "@/components/portals/LegalOpportunitiesPanel";
import AdvocateResumeBuilder from "@/components/AdvocateResumeBuilder";

const TABS = [
  { key: "overview", label: "My Profile" },
  { key: "opportunities", label: "Jobs & Internships" },
  { key: "verification", label: "Bar Council Verification" },
  { key: "appointments", label: "Appointments" },
];

/**
 * Advocate portal — ported from the prototype's `advTab()` function.
 * The "Bar Council Verification" tab mirrors the review workflow described in
 * docs/LEX_SUPERMUS_Advocate_Bar_Council_Verification_Module.pdf.
 * (Submission is demo-only in the UI; the real workflow lives in
 * services/advocate-service.)
 */
export default function AdvocatePortal() {
  const [tab, setTab] = useState("overview");
  const [jobsSection, setJobsSection] = useState<JobsSection>("opportunities");
  const [verificationPending, setVerificationPending] = useState(false);
  const verificationLabel =
    verificationPending ? "Pending review · demo" : "Not submitted";

  useEffect(() => {
    setVerificationPending(
      window.localStorage.getItem("lex-supermus-advocate-verification-status") === "PENDING_REVIEW_DEMO"
    );
    const syncTab = () => {
      const tabByHash: Record<string, string> = {
        "#jobs": "opportunities",
        "#resume": "opportunities",
        "#applications": "opportunities",
        "#verification": "verification",
        "#appointments": "appointments",
      };
      const hash = window.location.hash;
      setTab(tabByHash[hash] ?? "overview");
      if (hash === "#jobs" || hash === "#resume" || hash === "#applications") {
        setJobsSection(hash === "#resume" ? "resume" : hash === "#applications" ? "applications" : "opportunities");
      }
    };
    syncTab();
    window.addEventListener("hashchange", syncTab);
    return () => window.removeEventListener("hashchange", syncTab);
  }, []);

  function selectTab(key: string) {
    setTab(key);
    if (key === "opportunities") setJobsSection("opportunities");
    const nextHash = key === "opportunities" ? "#jobs" : `#${key}`;
    if (window.location.hash !== nextHash) window.location.hash = nextHash;
  }

  function selectJobsSection(section: JobsSection) {
    setTab("opportunities");
    setJobsSection(section);
    const nextHash = section === "resume" ? "#resume" : section === "applications" ? "#applications" : "#jobs";
    if (window.location.hash !== nextHash) window.location.hash = nextHash;
  }

  function openResumeBuilder() {
    selectJobsSection("resume");
  }

  return (
    <PortalShell title="Advocate Portal" tabs={TABS} active={tab} onChange={selectTab} variant="network" hideNavigation>
      <Link className="portal-back-link" href="/feed" aria-label="Back to professional feed" title="Back to professional feed">
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M19 12H5m7 7-7-7 7-7" />
        </svg>
      </Link>
      {tab === "overview" && (
        <>
          <ProfessionalProfileOverview
            role="ADVOCATE"
            verificationLabel={verificationLabel}
            onOpenResume={openResumeBuilder}
          />
        </>
      )}

      {tab === "opportunities" && (
        <div className="student-jobs-page">
          <h1>Jobs &amp; Professional Opportunities</h1>
          <JobsSectionSwitcher active={jobsSection} idPrefix="advocate" onChange={selectJobsSection} />
          {jobsSection === "opportunities" ? (
            <section id="advocate-jobs-panel" role="tabpanel" aria-labelledby="advocate-jobs-tab">
              <LegalOpportunitiesPanel role="ADVOCATE" />
            </section>
          ) : jobsSection === "resume" ? (
            <section id="advocate-resume-panel" className="student-resume-workspace" role="tabpanel" aria-labelledby="advocate-resume-tab">
              <h2>Professional Resume Builder</h2>
              <p className="sub">Build a polished resume using the education and experience from your profile.</p>
              <AdvocateResumeBuilder />
            </section>
          ) : (
            <section id="advocate-applications-panel" role="tabpanel" aria-labelledby="advocate-applications-tab">
              <JobApplicationStatusPanel role="ADVOCATE" />
            </section>
          )}
        </div>
      )}

      {tab === "verification" && (
        <>
          <h1>Bar Council Verification</h1>
          <p className="sub">Review the enrolment details submitted with your account.</p>
          <div className="stats">
            <div className="stat">
              1 · Personal<b>Details</b>
            </div>
            <div className="stat">
              2 · Enrolment<b>Information</b>
            </div>
            <div className="stat">
              3 · Review<b>{verificationLabel}</b>
            </div>
          </div>
          <label>Full legal name</label>
          <input placeholder="As shown in enrolment records" />
          <label>State Bar Council</label>
          <select defaultValue="Select council">
            <option>Select council</option>
            <option>Bar Council of Tamil Nadu and Puducherry</option>
            <option>Other State Bar Council</option>
          </select>
          <label>Enrolment number</label>
          <input placeholder="Enter enrolment number" />
          <label>Supporting document</label>
          <input type="file" />
          <button
            className="primary"
            onClick={() =>
              window.alert(
                "Demo only: submission captured locally; no real verification is performed."
              )
            }
          >
            Submit for review
          </button>
          <div className="notice">
            Status: {verificationPending ? "Pending review · demo" : "Not submitted"} · No external
            verification performed.
          </div>
        </>
      )}

      {tab === "appointments" && (
        <>
          <h1>Appointments</h1>
          <div className="item">
            <h3>Consultation calendar</h3>
            <p>No connected calendar in this prototype.</p>
          </div>
        </>
      )}
    </PortalShell>
  );
}
