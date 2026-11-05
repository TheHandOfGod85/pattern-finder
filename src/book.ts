import type { YearRange } from "./designs";
import { isRecord } from "./is-record";

const BOOK_LOOKUP_URL = "https://openlibrary.org/search.json";
const YEAR_RANGE_PADDING = 15;

export function buildBookYearRange(year: number): YearRange {
  return {
    start: year - YEAR_RANGE_PADDING,
    end: year + YEAR_RANGE_PADDING,
  };
}

export async function lookupFirstPublicationYear(
  title: string,
): Promise<number | null> {
  let response: Response;

  try {
    response = await fetch(createLookupUrl(title));
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    return null;
  }

  const firstDocument = getFirstDocument(payload);
  const year = firstDocument?.["first_publish_year"];

  return typeof year === "number" ? year : null;
}

function createLookupUrl(title: string): string {
  const url = new URL(BOOK_LOOKUP_URL);
  url.searchParams.set("q", title.trim());
  url.searchParams.set("fields", "title,first_publish_year");
  url.searchParams.set("limit", "1");
  return url.toString();
}

function getFirstDocument(payload: unknown): Record<string, unknown> | null {
  if (!isRecord(payload) || !Array.isArray(payload["docs"])) {
    return null;
  }

  const firstDocument = payload["docs"][0];
  return isRecord(firstDocument) ? firstDocument : null;
}
