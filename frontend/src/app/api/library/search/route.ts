import { NextRequest, NextResponse } from "next/server";
import { normalizeIndiaCodeSearch } from "@/lib/india-code-library";

const INDIA_CODE_SEARCH_URL =
  "https://indiacode.gov.in/server/api/discover/search/objects";
const PAGE_SIZE = 30;

export const dynamic = "force-dynamic";

function escapeSearchPhrase(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export async function GET(request: NextRequest) {
  const searchText = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const collection = request.nextUrl.searchParams.get("collection") ?? "ACT";
  const state = request.nextUrl.searchParams.get("state") ?? "";
  const status = request.nextUrl.searchParams.get("status") ?? "all";
  const actId = request.nextUrl.searchParams.get("actId") ?? "";
  const pageValue = request.nextUrl.searchParams.get("page") ?? "0";
  const page = Number(pageValue);

  if (searchText.length > 200) {
    return NextResponse.json(
      { error: "Search queries must be 200 characters or fewer." },
      { status: 400 },
    );
  }

  if (collection !== "ACT" && collection !== "SECTION") {
    return NextResponse.json(
      { error: "Choose a supported library collection." },
      { status: 400 },
    );
  }

  if (
    state &&
    state !== "CENTRAL" &&
    state !== "STATE" &&
    !/^[a-zA-Z ]{2,50}$/.test(state)
  ) {
    return NextResponse.json(
      { error: "Choose a valid state or jurisdiction." },
      { status: 400 },
    );
  }

  if (!["all", "current", "repealed"].includes(status)) {
    return NextResponse.json(
      { error: "Choose a supported Act status filter." },
      { status: 400 },
    );
  }

  if (actId && !/^AC_[A-Z0-9_-]+$/i.test(actId)) {
    return NextResponse.json(
      { error: "The selected Act identifier is invalid." },
      { status: 400 },
    );
  }

  if (collection === "SECTION" && !actId) {
    return NextResponse.json(
      { error: "Choose an Act before browsing its sections." },
      { status: 400 },
    );
  }

  if (!Number.isSafeInteger(page) || page < 0) {
    return NextResponse.json(
      { error: "Page must be a non-negative whole number." },
      { status: 400 },
    );
  }

  const searchClauses = [`dc.identifier.collection:${collection}`];
  if (state === "CENTRAL") {
    searchClauses.push("dc.identifier.state_name:CENTRAL");
  } else if (state === "STATE") {
    searchClauses.push("NOT dc.identifier.state_name:CENTRAL");
  } else if (state) {
    searchClauses.push(`dc.identifier.state_name:${escapeSearchPhrase(state)}`);
  }
  if (status === "current") {
    searchClauses.push("dc.identifier.repealed:false");
  } else if (status === "repealed") {
    searchClauses.push("dc.identifier.repealed:true");
  }
  if (actId) {
    searchClauses.push(`dc.identifier.act_id:${actId}`);
  }
  if (searchText) {
    searchClauses.push(
      collection === "ACT"
        ? `dc.title:${escapeSearchPhrase(searchText)}`
        : escapeSearchPhrase(searchText),
    );
  }

  const query = searchClauses.join(" AND ");
  const upstreamUrl = new URL(INDIA_CODE_SEARCH_URL);
  upstreamUrl.searchParams.set("query", query);
  upstreamUrl.searchParams.set("page", String(page));
  upstreamUrl.searchParams.set("size", String(PAGE_SIZE));
  if (collection === "SECTION") {
    upstreamUrl.searchParams.set(
      "sort",
      "dc.identifier.order_number,ASC",
    );
  }

  try {
    const response = await fetch(upstreamUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) {
      console.error(`India Code search returned HTTP ${response.status}.`);
      return NextResponse.json(
        { error: "The official India Code search is temporarily unavailable." },
        { status: 502 },
      );
    }

    const payload: unknown = await response.json();
    return NextResponse.json(normalizeIndiaCodeSearch(payload, searchText));
  } catch (error) {
    console.error("India Code search request failed.", error);
    return NextResponse.json(
      { error: "Could not reach the official India Code search. Please try again." },
      { status: 502 },
    );
  }
}
