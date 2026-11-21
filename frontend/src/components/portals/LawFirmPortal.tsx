"use client";

import Link from "next/link";
import { useState } from "react";
import PortalShell from "@/components/PortalShell";
import ProfessionalProfileOverview from "@/components/ProfessionalProfileOverview";

const TABS = [
  { key: "overview", label: "Firm Profile" },
  { key: "advocates", label: "Advocates & Invitations" },
  { key: "work", label: "Internal Work" },
  { key: "network", label: "Professional Network" },
];

export default function LawFirmPortal() {
  const [tab, setTab] = useState("overview");

  return (
    <PortalShell title="Law Firm Workspace" tabs={TABS} active={tab} onChange={setTab} variant="network">
      {tab === "overview" && (
        <ProfessionalProfileOverview
          role="LAW_FIRM"
          onOpenResume={() => setTab("work")}
        />
      )}
      {tab === "advocates" && (
        <>
          <h1>Advocates &amp; Invitations</h1>
          <p className="sub">Manage professional associations through the firm workspace.</p>
          <div className="notice">No firm team or invitation service is connected yet.</div>
        </>
      )}
      {tab === "work" && (
        <>
          <h1>Internal Work</h1>
          <p className="sub">Firm-only collaboration and internal case activity.</p>
          <div className="rowcards">
            <article className="item"><h3>Collaboration</h3><p>Coordinate work with firm advocates.</p></article>
            <article className="item"><h3>Notifications</h3><p>Review workspace updates.</p></article>
          </div>
        </>
      )}
      {tab === "network" && (
        <>
          <h1>Professional Network</h1>
          <p className="sub">Access existing professional and knowledge services.</p>
          <div className="client-actions">
            <Link className="primary" href="/feed">Open professional network</Link>
            <Link className="client-secondary-action" href="/library">Open Legal Library</Link>
            <Link className="client-secondary-action" href="/ai">Open Legal AI</Link>
          </div>
        </>
      )}
    </PortalShell>
  );
}
