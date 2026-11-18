export type IndiaCodeLibraryEntry = {
  handle: string;
  title: string;
  collection: string;
  actId: string;
  actTitle: string;
  longTitle: string;
  actNumber: string;
  actYear: string;
  sectionNumber: string;
  sectionText: string;
  enactmentDate: string;
  commencementDate: string;
  jurisdiction: string;
  repealed: boolean | null;
};

export type IndiaCodeSearchResult = {
  query: string;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  results: IndiaCodeLibraryEntry[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function metadataValue(metadata: unknown, key: string): string {
  if (!isRecord(metadata) || !Array.isArray(metadata[key])) return "";
  const firstValue = metadata[key][0];
  if (!isRecord(firstValue) || typeof firstValue.value !== "string") return "";
  return firstValue.value.trim();
}

function htmlToText(value: string): string {
  return value
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*hr\b[^>]*>/gi, "\n")
    .replace(/<\s*\/\s*(p|div|li|section)\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (entity, value: string) => {
      const codePoint = Number.parseInt(value, 16);
      return codePoint <= 0x10ffff &&
        (codePoint < 0xd800 || codePoint > 0xdfff)
        ? String.fromCodePoint(codePoint)
        : entity;
    })
    .replace(/&#(\d+);/g, (entity, value: string) => {
      const codePoint = Number.parseInt(value, 10);
      return codePoint <= 0x10ffff &&
        (codePoint < 0xd800 || codePoint > 0xdfff)
        ? String.fromCodePoint(codePoint)
        : entity;
    })
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeEntry(value: unknown): IndiaCodeLibraryEntry | null {
  if (!isRecord(value) || !isRecord(value.metadata)) return null;

  const handle = typeof value.handle === "string" ? value.handle : "";
  const title = typeof value.name === "string"
    ? value.name.trim()
    : metadataValue(value.metadata, "dc.title");
  if (!/^\d+\/\d+$/.test(handle) || !title) return null;

  const collection = metadataValue(value.metadata, "dc.identifier.collection");
  const repealedValue =
    metadataValue(value.metadata, "dc.identifier.repealed") ||
    metadataValue(value.metadata, "dc.identifier.act_repealed");

  return {
    handle,
    title,
    collection,
    actId: metadataValue(value.metadata, "dc.identifier.act_id"),
    actTitle: metadataValue(value.metadata, "dc.identifier.act_name") || title,
    longTitle: metadataValue(value.metadata, "dc.title.long_title"),
    actNumber: metadataValue(value.metadata, "dc.identifier.act_number"),
    actYear: metadataValue(value.metadata, "dc.date.act_year"),
    sectionNumber: metadataValue(value.metadata, "dc.identifier.section_number"),
    sectionText: htmlToText(
      metadataValue(value.metadata, "dc.identifier.section_page_note"),
    ),
    enactmentDate:
      metadataValue(value.metadata, "dc.date.enact_date") ||
      metadataValue(value.metadata, "dc.date.issued"),
    commencementDate: metadataValue(value.metadata, "dc.date.enforcement_date"),
    jurisdiction: metadataValue(value.metadata, "dc.identifier.state_name"),
    repealed: repealedValue === "true"
      ? true
      : repealedValue === "false"
        ? false
        : null,
  };
}

export function normalizeIndiaCodeSearch(
  payload: unknown,
  query: string,
): IndiaCodeSearchResult {
  if (!isRecord(payload) || !isRecord(payload._embedded)) {
    throw new Error("India Code returned an unexpected search response.");
  }

  const searchResult = payload._embedded.searchResult;
  if (!isRecord(searchResult) || !isRecord(searchResult.page)) {
    throw new Error("India Code returned an unexpected search response.");
  }

  const embedded = searchResult._embedded;
  const objects = isRecord(embedded) && Array.isArray(embedded.objects)
    ? embedded.objects
    : [];
  const page = searchResult.page;

  return {
    query,
    page: typeof page.number === "number" ? page.number : 0,
    size: typeof page.size === "number" ? page.size : objects.length,
    totalElements: typeof page.totalElements === "number" ? page.totalElements : 0,
    totalPages: typeof page.totalPages === "number" ? page.totalPages : 0,
    results: objects
      .map((item) => {
        if (!isRecord(item) || !isRecord(item._embedded)) return null;
        return normalizeEntry(item._embedded.indexableObject);
      })
      .filter((entry): entry is IndiaCodeLibraryEntry => entry !== null),
  };
}
