export type JobsSection = "opportunities" | "resume" | "applications";

export default function JobsSectionSwitcher({
  active,
  idPrefix,
  onChange,
}: {
  active: JobsSection;
  idPrefix: string;
  onChange: (section: JobsSection) => void;
}) {
  return (
    <div className="jobs-section-switcher" role="tablist" aria-label="Jobs workspace">
      <button
        id={`${idPrefix}-jobs-tab`}
        type="button"
        role="tab"
        aria-selected={active === "opportunities"}
        aria-controls={`${idPrefix}-jobs-panel`}
        onClick={() => onChange("opportunities")}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <rect x="3" y="7" width="18" height="14" rx="2" />
          <path d="M8 7V4h8v3M3 12h18m-11 0v2h4v-2" />
        </svg>
        <span>Jobs &amp; Internships</span>
      </button>
      <button
        id={`${idPrefix}-resume-tab`}
        type="button"
        role="tab"
        aria-selected={active === "resume"}
        aria-controls={`${idPrefix}-resume-panel`}
        onClick={() => onChange("resume")}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M6 3.5h8l4 4V20H6z" />
          <path d="M14 3.5V8h4M9 12h6m-6 4h6" />
        </svg>
        <span>Resume Builder</span>
      </button>
      <button
        id={`${idPrefix}-applications-tab`}
        type="button"
        role="tab"
        aria-selected={active === "applications"}
        aria-controls={`${idPrefix}-applications-panel`}
        onClick={() => onChange("applications")}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <rect x="5" y="4.5" width="14" height="17" rx="2" />
          <path d="M9 4.5h6v3H9zM8.5 12l2 2 5-5m-7 8h7" />
        </svg>
        <span>Application Status</span>
      </button>
    </div>
  );
}
