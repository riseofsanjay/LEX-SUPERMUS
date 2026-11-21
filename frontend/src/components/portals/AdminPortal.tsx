"use client";

import { useState } from "react";
import PortalShell from "@/components/PortalShell";

const TABS = [
  { key: "overview", label: "▦ Overview" },
  { key: "queue", label: "✓ Verification Queue" },
  { key: "users", label: "♙ User Management" },
  { key: "content", label: "▤ Content Management" },
  { key: "library", label: "⚖ Legal Library" },
  { key: "ai", label: "AI Monitoring" },
  { key: "security", label: "Security & Audit" },
];

/**
 * Admin console — ported from the prototype's `adminTab()` function.
 * The verification queue reviews advocate submissions produced by
 * services/advocate-service (Bar Council verification workflow).
 */
export default function AdminPortal() {
  const [tab, setTab] = useState("overview");

  return (
    <PortalShell title="Admin Console" tabs={TABS} active={tab} onChange={setTab}>
      {tab === "overview" && (
        <>
          <h1>Admin Dashboard</h1>
          <p className="sub">Illustrative platform operations overview.</p>
          <div className="stats">
            <div className="stat">
              Registered accounts<b>—</b>
            </div>
            <div className="stat">
              Verification queue<b>—</b>
            </div>
            <div className="stat">
              Content records<b>—</b>
            </div>
          </div>
          <div className="notice">
            No production data is connected. Admin actions are demonstrations
            only.
          </div>
        </>
      )}

      {tab === "queue" && (
        <>
          <h1>Advocate Verification Queue</h1>
          <div className="item">
            <b>Sample application A</b>
            <p>State Council · Pending review</p>
            <button
              className="primary"
              onClick={() => window.alert("Demo review only. No status changed.")}
            >
              Review
            </button>
          </div>
        </>
      )}

      {tab === "users" && (
        <>
          <h1>User Management</h1>
          <p className="sub">Role-based access management interface concept.</p>
          <div className="item">Student · Advocate · Client · Reviewer</div>
        </>
      )}

      {tab === "content" && (
        <>
          <h1>Content Management</h1>
          <p className="sub">
            Manage statutes, judgments, source metadata and version history.
          </p>
          <div className="item">Legal library ingestion and review queue</div>
        </>
      )}
      {tab === "library" && (
        <>
          <h1>Legal Library Management</h1>
          <p className="sub">Library sources, judgments, current affairs and metadata.</p>
          <div className="rowcards">
            <article className="item"><h3>Library sources</h3><p>Manage authoritative source metadata and coverage.</p></article>
            <article className="item"><h3>Judgment review</h3><p>Review Supreme Court and High Court record updates.</p></article>
          </div>
        </>
      )}
      {tab === "ai" && (
        <>
          <h1>AI Monitoring</h1>
          <p className="sub">Monitor AI usage and retain mandatory source verification notices.</p>
          <div className="notice">Production AI monitoring is not connected.</div>
        </>
      )}
      {tab === "security" && (
        <>
          <h1>Security &amp; Audit Logs</h1>
          <p className="sub">Platform security configuration and audit review.</p>
          <div className="item">Audit logs and security configuration require a production backend.</div>
        </>
      )}
    </PortalShell>
  );
}
