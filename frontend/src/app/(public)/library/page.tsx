"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  type IndiaCodeLibraryEntry,
  type IndiaCodeSearchResult,
} from "@/lib/india-code-library";
import {
  CONSTITUTION_ARTICLES,
  CONSTITUTION_AMENDMENTS,
  CONSTITUTION_LANDMARK_CASES,
  CONSTITUTION_PARTS,
  CONSTITUTION_PREAMBLE,
  CONSTITUTION_SCHEDULES,
} from "@/lib/constitution-data";

type LibraryTab =
  | "bare"
  | "constitution"
  | "central"
  | "state"
  | "current-affairs";
type ActStatus = "all" | "current" | "repealed";
type ConstitutionView =
  | "preamble"
  | "articles"
  | "schedules"
  | "amendments"
  | "cases";

const LEGAL_CURRENT_AFFAIRS_SOURCES = [
  {
    title: "Supreme Court of India",
    category: "Court developments",
    description: "Judgments, cause lists, notices and official court updates.",
    href: "https://www.sci.gov.in/",
  },
  {
    title: "Press Information Bureau",
    category: "Legislation & policy",
    description: "Official government updates on legislation, amendments and policy.",
    href: "https://pib.gov.in/",
  },
  {
    title: "India Code",
    category: "Legislation",
    description: "Official central Acts, subordinate legislation and amendment records.",
    href: "https://www.indiacode.nic.in/",
  },
  {
    title: "Department of Justice",
    category: "Judicial developments",
    description: "Judicial administration, reforms and official legal-system updates.",
    href: "https://doj.gov.in/",
  },
];

const STATES_AND_TERRITORIES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isLibraryEntry(value: unknown): value is IndiaCodeLibraryEntry {
  return (
    isRecord(value) &&
    typeof value.handle === "string" &&
    typeof value.title === "string" &&
    typeof value.collection === "string" &&
    typeof value.actId === "string" &&
    typeof value.actTitle === "string" &&
    typeof value.longTitle === "string" &&
    typeof value.actNumber === "string" &&
    typeof value.actYear === "string" &&
    typeof value.sectionNumber === "string" &&
    typeof value.sectionText === "string" &&
    typeof value.enactmentDate === "string" &&
    typeof value.commencementDate === "string" &&
    typeof value.jurisdiction === "string" &&
    (typeof value.repealed === "boolean" || value.repealed === null)
  );
}

function isSearchResult(value: unknown): value is IndiaCodeSearchResult {
  return (
    isRecord(value) &&
    typeof value.query === "string" &&
    typeof value.page === "number" &&
    typeof value.size === "number" &&
    typeof value.totalElements === "number" &&
    typeof value.totalPages === "number" &&
    Array.isArray(value.results) &&
    value.results.every(isLibraryEntry)
  );
}

function formatRecordDate(date: string): string {
  const isoDate = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(date);
  const indianDate = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(date);
  const year = Number(isoDate?.[1] ?? indianDate?.[3]);
  const month = Number(isoDate?.[2] ?? indianDate?.[2]);
  const day = Number(isoDate?.[3] ?? indianDate?.[1]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return date;

  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function ordinalNumber(value: number): string {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  if (value % 10 === 1) return `${value}st`;
  if (value % 10 === 2) return `${value}nd`;
  if (value % 10 === 3) return `${value}rd`;
  return `${value}th`;
}

function getErrorMessage(value: unknown): string | null {
  return isRecord(value) && typeof value.error === "string" ? value.error : null;
}

async function fetchLibraryEntries(
  query: string,
  page: number,
  collection: "ACT" | "SECTION",
  state: string,
  status: ActStatus,
  actId = "",
): Promise<IndiaCodeSearchResult> {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    collection,
    state,
    status,
  });
  if (actId) params.set("actId", actId);

  const response = await fetch(`/api/library/search?${params}`, {
    cache: "no-store",
  });
  const payload: unknown = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(payload) ?? "The library search could not be completed.",
    );
  }

  if (!isSearchResult(payload)) {
    throw new Error("The library received an unexpected search response.");
  }

  return payload;
}

function getJurisdiction(tab: LibraryTab, selectedState: string): string {
  if (selectedState) return selectedState;
  if (tab === "central") return "CENTRAL";
  if (tab === "state") return "STATE";
  return "";
}

function getTabTitle(tab: LibraryTab): string {
  if (tab === "central") return "Central Acts";
  if (tab === "state") return "State Acts";
  if (tab === "constitution") return "Constitution of India";
  if (tab === "current-affairs") return "Legal Current Affairs";
  return "Bare Acts";
}

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<LibraryTab>("bare");
  const [selectedState, setSelectedState] = useState("");
  const [status, setStatus] = useState<ActStatus>("all");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<IndiaCodeSearchResult | null>(null);
  const [selectedAct, setSelectedAct] = useState<IndiaCodeLibraryEntry | null>(
    null,
  );
  const [constitutionView, setConstitutionView] =
    useState<ConstitutionView>("preamble");
  const [constitutionPart, setConstitutionPart] = useState("I");
  const [selectedArticle, setSelectedArticle] = useState<number | "51A" | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    fetchLibraryEntries("", 0, "ACT", "", "all")
      .then((response) => {
        if (active) setResult(response);
      })
      .catch((searchError: unknown) => {
        if (active) {
          setError(
            searchError instanceof Error
              ? searchError.message
              : "The library could not be loaded. Please try again.",
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function searchLibrary(
    searchText: string,
    page: number,
    act: IndiaCodeLibraryEntry | null,
    tab: LibraryTab,
    state: string,
    actStatus: ActStatus,
  ) {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetchLibraryEntries(
        searchText.trim(),
        page,
        act ? "SECTION" : "ACT",
        act ? "" : getJurisdiction(tab, state),
        act ? "all" : actStatus,
        act?.actId,
      );
      setResult(response);
    } catch (searchError) {
      setResult(null);
      setError(
        searchError instanceof Error
          ? searchError.message
          : "The library search could not be completed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void searchLibrary(
      query,
      0,
      selectedAct,
      activeTab,
      selectedState,
      status,
    );
  }

  function selectTab(tab: LibraryTab) {
    setActiveTab(tab);
    setSelectedState("");
    setSelectedAct(null);
    setQuery("");
    if (tab === "constitution") {
      setConstitutionView("preamble");
      setError("");
      setResult(null);
      setIsLoading(false);
      return;
    }
    if (tab === "current-affairs") {
      setError("");
      setResult(null);
      setIsLoading(false);
      return;
    }
    void searchLibrary("", 0, null, tab, "", status);
  }

  function selectState(state: string) {
    const tab: LibraryTab = state === "CENTRAL" ? "central" : "state";
    const selected = state === "CENTRAL" ? "" : state;
    setActiveTab(tab);
    setSelectedState(selected);
    setSelectedAct(null);
    setQuery("");
    void searchLibrary("", 0, null, tab, selected, status);
  }

  function selectStatus(nextStatus: ActStatus) {
    setStatus(nextStatus);
    setSelectedAct(null);
    void searchLibrary(query, 0, null, activeTab, selectedState, nextStatus);
  }

  function openAct(act: IndiaCodeLibraryEntry) {
    if (!act.actId) return;
    setSelectedAct(act);
    setQuery("");
    void searchLibrary("", 0, act, activeTab, selectedState, status);
  }

  function returnToActList() {
    setSelectedAct(null);
    setQuery("");
    void searchLibrary("", 0, null, activeTab, selectedState, status);
  }

  const stateSelectValue =
    activeTab === "central" ? "CENTRAL" : selectedState;

  return (
    <section id="library" className="page">
      <div className="library-workspace">
        <div className="library-workspace-heading">
          <div>
            <p className="library-eyebrow">LEX SUPERMUS LEGAL LIBRARY</p>
            <h1>Indian Acts &amp; Sections</h1>
            <p>
              Browse legislation and read its indexed section text without
              leaving the library.
            </p>
          </div>
          <span className="library-catalogue-badge">India Code catalogue</span>
        </div>

        <nav className="library-tabs" aria-label="Act collections">
          <button
            type="button"
            className={activeTab === "bare" ? "active" : ""}
            aria-pressed={activeTab === "bare"}
            disabled={isLoading}
            onClick={() => selectTab("bare")}
          >
            Bare Acts
          </button>
          <button
            type="button"
            className={activeTab === "constitution" ? "active" : ""}
            aria-pressed={activeTab === "constitution"}
            disabled={isLoading}
            onClick={() => selectTab("constitution")}
          >
            Constitution
          </button>
          <button
            type="button"
            className={activeTab === "central" ? "active" : ""}
            aria-pressed={activeTab === "central"}
            disabled={isLoading}
            onClick={() => selectTab("central")}
          >
            Central Acts
          </button>
          <button
            type="button"
            className={activeTab === "state" ? "active" : ""}
            aria-pressed={activeTab === "state"}
            disabled={isLoading}
            onClick={() => selectTab("state")}
          >
            State Acts
          </button>
          <button
            type="button"
            className={activeTab === "current-affairs" ? "active" : ""}
            aria-pressed={activeTab === "current-affairs"}
            onClick={() => selectTab("current-affairs")}
          >
            Current Affairs
          </button>
        </nav>

        <form className="library-filter-bar" onSubmit={submitSearch}>
          <label htmlFor="library-status-filter">Filter:</label>
          <select
            id="library-status-filter"
            value={status}
            disabled={
              isLoading ||
              Boolean(selectedAct) ||
              activeTab === "current-affairs"
            }
            onChange={(event) => {
              const nextStatus = event.currentTarget.value;
              if (
                nextStatus === "all" ||
                nextStatus === "current" ||
                nextStatus === "repealed"
              ) {
                selectStatus(nextStatus);
              }
            }}
          >
            <option value="all">All Acts</option>
            <option value="current">Not marked repealed</option>
          </select>
          <select
            aria-label="State or jurisdiction"
            value={stateSelectValue}
            disabled={
              isLoading ||
              Boolean(selectedAct) ||
              activeTab === "current-affairs"
            }
            onChange={(event) => selectState(event.currentTarget.value)}
          >
            <option value="">All Categories / States</option>
            <option value="CENTRAL">Central Acts</option>
            <optgroup label="States and Union Territories">
              {STATES_AND_TERRITORIES.map((state) => (
                <option key={state} value={state}>
                  {state} Acts
                </option>
              ))}
            </optgroup>
          </select>
          <label className="sr-only" htmlFor="library-act-search">
            Bare Act name
          </label>
          <input
            id="library-act-search"
            placeholder={
              activeTab === "constitution"
                ? "Article, amendment or constitutional topic"
                : selectedAct
                  ? "Search within this Act"
                  : "Bare Act name"
            }
            value={query}
            disabled={isLoading || activeTab === "current-affairs"}
            onChange={(event) => setQuery(event.currentTarget.value)}
            maxLength={200}
          />
          <button type="submit" disabled={isLoading || activeTab === "current-affairs"}>
            {isLoading ? "Searching…" : "Search"}
          </button>
        </form>

        <div className="library-browser-grid">
          <aside className="library-state-sidebar">
            <h2>
              {activeTab === "constitution"
                ? "Constitution"
                : activeTab === "current-affairs"
                  ? "Current Affairs"
                  : "Browse by State"}
            </h2>
            {activeTab === "constitution" &&
              [
                { key: "preamble" as const, label: "Preamble" },
                { key: "articles" as const, label: "All Articles" },
                { key: "schedules" as const, label: "Schedules" },
                { key: "amendments" as const, label: "Constitutional Amendments" },
                { key: "cases" as const, label: "Landmark Cases" },
              ].map((section) => (
                <button
                  type="button"
                  key={section.key}
                  className={constitutionView === section.key ? "active" : ""}
                  onClick={() => setConstitutionView(section.key)}
                >
                  {section.label}
                </button>
              ))}
            {activeTab === "current-affairs" &&
              LEGAL_CURRENT_AFFAIRS_SOURCES.map((source) => (
                <a
                  className="library-source-link"
                  key={source.title}
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {source.title}
                </a>
              ))}
            {activeTab !== "constitution" && activeTab !== "current-affairs" && (
              <>
            <button
              type="button"
              className={activeTab === "central" ? "active" : ""}
              disabled={isLoading}
              onClick={() => selectState("CENTRAL")}
            >
              Central Acts
            </button>
            {STATES_AND_TERRITORIES.map((state) => (
              <button
                type="button"
                key={state}
                className={selectedState === state ? "active" : ""}
                disabled={isLoading}
                onClick={() => selectState(state)}
              >
                {state} State Laws
              </button>
            ))}
              </>
            )}
          </aside>

          <section className="library-act-panel" aria-labelledby="library-panel-heading">
            <div className="library-panel-title">
              {selectedAct ? (
                <>
                  <button
                    type="button"
                    className="library-back-button"
                    disabled={isLoading}
                    onClick={returnToActList}
                  >
                    Back to Acts
                  </button>
                  <h2 id="library-panel-heading">{selectedAct.title}</h2>
                </>
              ) : (
                <h2 id="library-panel-heading">{getTabTitle(activeTab)}</h2>
              )}
            </div>

            {selectedAct && (
              <div className="library-selected-act-summary">
                {selectedAct.longTitle && <p>{selectedAct.longTitle}</p>}
                <div className="library-act-metadata">
                  {selectedAct.actNumber && (
                    <span>Act No. {selectedAct.actNumber}</span>
                  )}
                  {selectedAct.actYear && <span>{selectedAct.actYear}</span>}
                  {selectedAct.jurisdiction && (
                    <span>{selectedAct.jurisdiction}</span>
                  )}
                  {selectedAct.enactmentDate && (
                    <span>
                      Enacted {formatRecordDate(selectedAct.enactmentDate)}
                    </span>
                  )}
                  {selectedAct.commencementDate && (
                    <span>
                      Commenced{" "}
                      {formatRecordDate(selectedAct.commencementDate)}
                    </span>
                  )}
                  {selectedAct.repealed === true && (
                    <span className="library-repealed">Repealed</span>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="library-error" role="alert">
                <p>{error}</p>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() =>
                    void searchLibrary(
                      query,
                      result?.page ?? 0,
                      selectedAct,
                      activeTab,
                      selectedState,
                      status,
                    )
                  }
                >
                  Try again
                </button>
              </div>
            )}

            {isLoading && (
              <p className="library-loading" role="status" aria-live="polite">
                Loading legal materials…
              </p>
            )}

            {activeTab === "constitution" && !isLoading && (
              <div className="constitution-view">
                {constitutionView === "preamble" && (
                  <article className="constitution-preamble">
                    <span>PREAMBLE</span>
                    <h2>We, the People of India</h2>
                    <blockquote>{CONSTITUTION_PREAMBLE}</blockquote>
                    <a
                      href="https://legislative.gov.in/constitution-of-india/"
                      target="_blank"
                      rel="noreferrer"
                      className="library-official-link"
                    >
                      Read the Constitution from the Legislative Department
                    </a>
                  </article>
                )}

                {constitutionView === "articles" && (
                  <section className="constitution-act-reader">
                    <div className="constitution-act-heading">
                      <div>
                        <span>THE CONSTITUTION OF INDIA</span>
                        <h2>
                          {CONSTITUTION_PARTS.find((item) => item.part === constitutionPart)?.range}
                        </h2>
                        <p>
                          Part {constitutionPart}:{" "}
                          {CONSTITUTION_PARTS.find((item) => item.part === constitutionPart)?.title}
                        </p>
                      </div>
                    </div>
                    <div className="constitution-act-layout">
                      <aside className="constitution-part-list" aria-label="Constitution Parts">
                        {CONSTITUTION_PARTS.map((item) => (
                          <button
                            type="button"
                            key={item.part}
                            className={constitutionPart === item.part ? "active" : ""}
                            onClick={() => {
                              setConstitutionPart(item.part);
                              setSelectedArticle(null);
                            }}
                          >
                            <span>Part {item.part}</span>
                            <b>{item.title}</b>
                          </button>
                        ))}
                      </aside>

                      <div className="constitution-chapter-reader">
                        {CONSTITUTION_PARTS.find((item) => item.part === constitutionPart)?.chapters.map((chapter) => (
                          <details className="constitution-chapter" key={chapter.title}>
                            <summary>
                              <b>{chapter.title}</b>
                              <span>{chapter.range}</span>
                            </summary>
                            <div className="constitution-article-list">
                              {Array.from(
                                { length: Math.max(0, chapter.end - chapter.start + 1) },
                                (_, index) => chapter.start + index,
                              ).map((article) => (
                                <details
                                  className="constitution-article"
                                  key={article}
                                  open={selectedArticle === article}
                                  onToggle={(event) => {
                                    if (event.currentTarget.open) setSelectedArticle(article);
                                  }}
                                >
                                  <summary>Article {article}</summary>
                                  <div>
                                    <p>
                                      Official Article text is available from the Legislative Department
                                      and the India Code repository.
                                    </p>
                                    <a
                                      href="https://legislative.gov.in/constitution-of-india/"
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      Open official Constitution source
                                    </a>
                                  </div>
                                </details>
                              ))}
                            </div>
                          </details>
                        ))}

                        {CONSTITUTION_PARTS.find((item) => item.part === constitutionPart)?.chapters.length === 0 &&
                          (() => {
                            const part = CONSTITUTION_PARTS.find((item) => item.part === constitutionPart);
                            if (!part) return null;
                            if (part.part === "IV-A") {
                              return (
                                <details className="constitution-article" open={selectedArticle === "51A"} onToggle={(event) => {
                                  if (event.currentTarget.open) setSelectedArticle("51A");
                                }}>
                                  <summary>Article 51A</summary>
                                  <div>
                                    <p>Official Fundamental Duties text is available from the Legislative Department.</p>
                                    <a href="https://legislative.gov.in/constitution-of-india/" target="_blank" rel="noreferrer">Open official Constitution source</a>
                                  </div>
                                </details>
                              );
                            }
                            return (
                              <div className="constitution-article-list">
                                {CONSTITUTION_ARTICLES
                                  .filter((article) => article >= part.start && article <= part.end)
                                  .map((article) => (
                                    <details
                                      className="constitution-article"
                                      key={article}
                                      open={selectedArticle === article}
                                      onToggle={(event) => {
                                        if (event.currentTarget.open) setSelectedArticle(article);
                                      }}
                                    >
                                      <summary>Article {article}</summary>
                                      <div>
                                        <p>
                                          Official Article text is available from the Legislative Department
                                          and the India Code repository.
                                        </p>
                                        <a
                                          href="https://legislative.gov.in/constitution-of-india/"
                                          target="_blank"
                                          rel="noreferrer"
                                        >
                                          Open official Constitution source
                                        </a>
                                      </div>
                                    </details>
                                  ))}
                              </div>
                            );
                          })()}
                      </div>
                    </div>
                  </section>
                )}

                {constitutionView === "schedules" && (
                  <section>
                    <div className="constitution-section-heading">
                      <h2>Schedules of the Constitution</h2>
                      <p>All twelve Schedules, with official catalogue search links.</p>
                    </div>
                    <div className="constitution-list">
                      {CONSTITUTION_SCHEDULES.map((schedule) => (
                        <button
                          type="button"
                          key={schedule.number}
                          onClick={() => {
                            setQuery(`Schedule ${schedule.number}`);
                            void searchLibrary(
                              `Schedule ${schedule.number}`,
                              0,
                              null,
                              "central",
                              "",
                              "all",
                            );
                          }}
                        >
                          <span>Schedule {schedule.number}</span>
                          <b>{schedule.title}</b>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {constitutionView === "amendments" && (
                  <section>
                    <div className="constitution-section-heading">
                      <h2>Constitutional Amendments</h2>
                      <p>Amendment 1 to 106. Select an amendment to verify the original text.</p>
                    </div>
                    <div className="constitution-amendment-grid">
                      {CONSTITUTION_AMENDMENTS.map((amendment) => (
                        <a
                          key={amendment.number}
                          href={`https://www.indiacode.nic.in/simple-search?query=${encodeURIComponent(`${ordinalNumber(amendment.number)} Constitutional Amendment`)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span>{ordinalNumber(amendment.number)} Amendment</span>
                          {amendment.topic && <b>{amendment.topic}</b>}
                        </a>
                      ))}
                    </div>
                  </section>
                )}

                {constitutionView === "cases" && (
                  <section>
                    <div className="constitution-section-heading">
                      <h2>Landmark Cases by Constitutional Provision</h2>
                      <p>Established judgments grouped by the Articles or constitutional provisions involved.</p>
                    </div>
                    <div className="constitution-case-list">
                      {CONSTITUTION_LANDMARK_CASES.map((caseEntry) => (
                        <article key={caseEntry.name}>
                          <span>{caseEntry.articles}</span>
                          <h3>{caseEntry.name}</h3>
                          <p>{caseEntry.topic}</p>
                          <a href={caseEntry.source} target="_blank" rel="noreferrer">
                            View Supreme Court judgments
                          </a>
                        </article>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {activeTab === "current-affairs" && !isLoading && (
              <div className="library-current-affairs">
                <p className="library-current-affairs-intro">
                  Follow authoritative government and court sources for legal developments.
                  LEX SUPERMUS does not publish unverified news or invent current-affairs entries.
                </p>
                <div className="library-current-affairs-grid">
                  {LEGAL_CURRENT_AFFAIRS_SOURCES.map((source) => (
                    <article className="library-current-affairs-card" key={source.title}>
                      <span>{source.category}</span>
                      <h3>{source.title}</h3>
                      <p>{source.description}</p>
                      <a href={source.href} target="_blank" rel="noreferrer">
                        Visit official source
                      </a>
                    </article>
                  ))}
                </div>
                <div className="library-current-affairs-note">
                  No authoritative current-affairs feed is currently connected.
                  For a legal update, verify publication date, issuer and original document.
                </div>
              </div>
            )}

            {activeTab !== "current-affairs" && !error && !isLoading && result && (
              <>
                <p className="library-result-count">
                  {result.totalElements.toLocaleString("en-IN")}{" "}
                  {selectedAct
                    ? result.totalElements === 1
                      ? "section"
                      : "sections"
                    : result.totalElements === 1
                      ? "Act"
                      : "Acts"}{" "}
                  found
                  {result.query ? ` for “${result.query}”` : ""}
                </p>

                {result.results.length === 0 ? (
                  <div className="library-empty-state">
                    No matching records were found. Try another spelling or
                    choose a different state.
                  </div>
                ) : selectedAct ? (
                  <div className="library-section-list">
                    {result.results.map((entry, index) => (
                      <details
                        className="library-section-entry"
                        key={entry.handle}
                        open={index === 0}
                      >
                        <summary>
                          {entry.sectionNumber
                            ? `Section ${entry.sectionNumber}: `
                            : ""}
                          {entry.title}
                        </summary>
                        {entry.sectionText ? (
                          <div className="library-section-text">
                            {entry.sectionText
                              .split(/\n{2,}/)
                              .map((paragraph, paragraphIndex) => (
                                <p key={`${entry.handle}-${paragraphIndex}`}>
                                  {paragraph}
                                </p>
                              ))}
                          </div>
                        ) : (
                          <p className="library-no-section-text">
                            Text is not included in this catalogue record.
                          </p>
                        )}
                      </details>
                    ))}
                  </div>
                ) : (
                  <div className="library-act-list">
                    {result.results.map((act) => (
                      <button
                        type="button"
                        className="library-act-entry"
                        key={act.handle}
                        disabled={isLoading || !act.actId}
                        onClick={() => openAct(act)}
                      >
                        <span className="library-act-entry-title">
                          {act.title}
                        </span>
                        <span className="library-act-entry-meta">
                          {act.jurisdiction && <span>{act.jurisdiction}</span>}
                          {act.actYear && <span>{act.actYear}</span>}
                          {act.repealed === true && (
                            <span className="library-repealed">Repealed</span>
                          )}
                        </span>
                        {act.longTitle && (
                          <span className="library-act-entry-long-title">
                            {act.longTitle}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {result.totalPages > 1 && (
                  <nav
                    className="library-pagination"
                    aria-label="Library pages"
                  >
                    <button
                      type="button"
                      disabled={isLoading || result.page === 0}
                      onClick={() =>
                        void searchLibrary(
                          query,
                          result.page - 1,
                          selectedAct,
                          activeTab,
                          selectedState,
                          status,
                        )
                      }
                    >
                      Previous
                    </button>
                    <span>
                      Page {result.page + 1} of{" "}
                      {result.totalPages.toLocaleString("en-IN")}
                    </span>
                    <button
                      type="button"
                      disabled={
                        isLoading || result.page + 1 >= result.totalPages
                      }
                      onClick={() =>
                        void searchLibrary(
                          query,
                          result.page + 1,
                          selectedAct,
                          activeTab,
                          selectedState,
                          status,
                        )
                      }
                    >
                      Next
                    </button>
                  </nav>
                )}
              </>
            )}

            <p className="library-disclaimer">
              {activeTab === "current-affairs"
                ? "Current-affairs links lead to official external sources. LEX SUPERMUS does not reproduce or independently verify external updates."
                : "Section text is displayed from the India Code catalogue. The catalogue may have incomplete records or amendments; check the effective date and applicability before relying on any provision. This library is a research aid, not legal advice."}
            </p>
          </section>

          <aside className="library-act-details">
            <h2>
              {activeTab === "constitution"
                ? "Constitution overview"
                : activeTab === "current-affairs"
                  ? "Source guidance"
                  : selectedAct
                    ? "Act details"
                    : "Read law in this library"}
            </h2>
            {activeTab === "constitution" ? (
              <>
                {constitutionView === "articles" ? (
                  <>
                    <p>
                      {selectedArticle
                        ? `Selected: Article ${selectedArticle}`
                        : `Selected Part ${constitutionPart}`}
                    </p>
                    <dl>
                      {CONSTITUTION_PARTS.filter((item) => item.part === constitutionPart).map((item) => (
                        <div key={item.part}>
                          <dt>Part</dt>
                          <dd>{item.part} · {item.title}</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="library-details-note">
                      Article text is not synthesized by this page. Open the official
                      Legislative Department source for the authoritative full text.
                    </p>
                  </>
                ) : (
                  <>
                    <p>Explore the Constitution through authoritative official sources.</p>
                    <ul>
                      <li>Preamble and constitutional precepts</li>
                      <li>Articles and Parts</li>
                      <li>Schedules and amendments</li>
                      <li>Constitutional developments require independent current-source verification</li>
                    </ul>
                    <p className="library-details-note">
                      Use the official source links for the complete and current text.
                    </p>
                  </>
                )}
              </>
            ) : activeTab === "current-affairs" ? (
              <>
                <p>Current-affairs records should include publication date, category, source and original URL.</p>
                <ul>
                  <li>Legislation and amendments</li>
                  <li>Supreme Court and High Court developments</li>
                  <li>Government notifications</li>
                  <li>Regulatory and legal-policy updates</li>
                </ul>
                <p className="library-details-note">
                  No source feed is connected; verify every update at the original authority.
                </p>
              </>
            ) : selectedAct ? (
              <>
                <p>{selectedAct.title}</p>
                {selectedAct.longTitle && (
                  <p className="library-details-long-title">
                    {selectedAct.longTitle}
                  </p>
                )}
                <dl>
                  {selectedAct.actNumber && (
                    <div>
                      <dt>Act number</dt>
                      <dd>{selectedAct.actNumber}</dd>
                    </div>
                  )}
                  {selectedAct.actYear && (
                    <div>
                      <dt>Year</dt>
                      <dd>{selectedAct.actYear}</dd>
                    </div>
                  )}
                  {selectedAct.jurisdiction && (
                    <div>
                      <dt>Jurisdiction</dt>
                      <dd>{selectedAct.jurisdiction}</dd>
                    </div>
                  )}
                  {selectedAct.enactmentDate && (
                    <div>
                      <dt>Enacted</dt>
                      <dd>{formatRecordDate(selectedAct.enactmentDate)}</dd>
                    </div>
                  )}
                  {selectedAct.commencementDate && (
                    <div>
                      <dt>Commencement</dt>
                      <dd>{formatRecordDate(selectedAct.commencementDate)}</dd>
                    </div>
                  )}
                </dl>
                <p className="library-details-note">
                  Expand a section to read its text. Use the search field above
                  to find a phrase within this Act.
                </p>
              </>
            ) : (
              <>
                <p>
                  Choose an Act to read its section-by-section text here. You
                  will stay on this page.
                </p>
                <ul>
                  <li>Browse central and state legislation.</li>
                  <li>Search by Act title or text within an Act.</li>
                  <li>Open sections directly in the reading panel.</li>
                </ul>
                <p className="library-details-note">
                  Hindi-language filtering is unavailable because the current
                  catalogue does not provide a reliable language field.
                </p>
              </>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
