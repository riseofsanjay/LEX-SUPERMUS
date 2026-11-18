"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PortalShell from "@/components/PortalShell";
import ProfessionalProfileOverview from "@/components/ProfessionalProfileOverview";
import JobsSectionSwitcher, { type JobsSection } from "@/components/portals/JobsSectionSwitcher";
import LegalOpportunitiesPanel, { JobApplicationStatusPanel } from "@/components/portals/LegalOpportunitiesPanel";
import StudentResumeBuilder from "@/components/StudentResumeBuilder";

const TABS = [
  { key: "overview", label: "My Profile" },
  { key: "jobs", label: "Jobs & Internships" },
];

/**
 * Student portal — ported from the prototype's `studentTab()` function.
 * Each `m[...]` template literal becomes a branch below.
 */
export default function StudentPortal() {
  const [tab, setTab] = useState("overview");
  const [jobsSection, setJobsSection] = useState<JobsSection>("opportunities");

  useEffect(() => {
    const syncTab = () => {
      if (window.location.hash === "#jobs" || window.location.hash === "#resume" || window.location.hash === "#applications") {
        setTab("jobs");
        setJobsSection(
          window.location.hash === "#resume"
            ? "resume"
            : window.location.hash === "#applications"
              ? "applications"
              : "opportunities",
        );
      } else {
        setTab("overview");
      }
    };
    syncTab();
    window.addEventListener("hashchange", syncTab);
    return () => window.removeEventListener("hashchange", syncTab);
  }, []);

  function selectTab(key: string) {
    setTab(key);
    if (key === "jobs") setJobsSection("opportunities");
    const nextHash = key === "jobs" ? "#jobs" : "";
    if (window.location.hash !== nextHash) window.location.hash = nextHash;
  }

  function selectJobsSection(section: JobsSection) {
    setTab("jobs");
    setJobsSection(section);
    const nextHash = section === "resume" ? "#resume" : section === "applications" ? "#applications" : "#jobs";
    if (window.location.hash !== nextHash) window.location.hash = nextHash;
  }

  function openResumeBuilder() {
    selectJobsSection("resume");
  }

  return (
    <PortalShell title="Student Portal" tabs={TABS} active={tab} onChange={selectTab} variant="network">
      <Link className="portal-back-link" href="/feed" aria-label="Back to professional feed" title="Back to professional feed">
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M19 12H5m7 7-7-7 7-7" />
        </svg>
      </Link>
      {tab === "overview" && (
        <>
          <ProfessionalProfileOverview
            role="STUDENT"
            onOpenResume={openResumeBuilder}
          />
        </>
      )}

      {tab === "jobs" && (
        <div className="student-jobs-page">
          <h1>Jobs &amp; Internships</h1>
          <JobsSectionSwitcher active={jobsSection} idPrefix="student" onChange={selectJobsSection} />
          {jobsSection === "opportunities" ? (
            <section id="student-jobs-panel" role="tabpanel" aria-labelledby="student-jobs-tab">
              <LegalOpportunitiesPanel role="STUDENT" />
            </section>
          ) : jobsSection === "resume" ? (
            <section id="student-resume-panel" className="student-resume-workspace" role="tabpanel" aria-labelledby="student-resume-tab">
              <h2>Resume Builder</h2>
              <p className="sub">Build a polished resume using the education and experience from your profile.</p>
              <StudentResumeBuilder onGoToProfile={() => selectTab("overview")} />
            </section>
          ) : (
            <section id="student-applications-panel" role="tabpanel" aria-labelledby="student-applications-tab">
              <JobApplicationStatusPanel role="STUDENT" />
            </section>
          )}
        </div>
      )}
    </PortalShell>
  );
}
