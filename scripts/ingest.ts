import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildDesigns,
  CREDIT_LINE,
  SEARCH_ENDPOINT,
  type Catalogue,
} from "../src/catalogue";

const QUERIES = ["wallpaper", "textile", "printed fabric", "wall covering"];
const PAGE_SIZE = 100;
const MAXIMUM_PAGES_PER_QUERY = 6;
const REQUEST_INTERVAL_MILLISECONDS = 1_000;
const OUTPUT_PATH = fileURLToPath(
  new URL("../public/data/designs.json", import.meta.url),
);

function waitForNextRequest(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, REQUEST_INTERVAL_MILLISECONDS);
  });
}

function buildSearchUrl({ query, page }: { query: string; page: number }): URL {
  const url = new URL(SEARCH_ENDPOINT);
  url.searchParams.set("q", query);
  url.searchParams.set("images_exist", "1");
  url.searchParams.set("page_size", String(PAGE_SIZE));
  url.searchParams.set("page", String(page));
  return url;
}

function readRecords(payload: unknown): unknown[] | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  if (!("records" in payload)) {
    return null;
  }

  const { records } = payload;

  return Array.isArray(records) ? records : null;
}

async function fetchSearchPage({
  query,
  page,
}: {
  query: string;
  page: number;
}): Promise<unknown[]> {
  const address = buildSearchUrl({ query, page }).toString();

  let response: Response;

  try {
    response = await fetch(address);
  } catch (error) {
    throw new Error(`Could not fetch ${address}: ${String(error)}`, {
      cause: error,
    });
  }

  await waitForNextRequest();

  if (!response.ok) {
    throw new Error(
      `Request to ${address} failed with status ${response.status}.`,
    );
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new Error(`Could not parse the response from ${address}.`);
  }

  const records = readRecords(payload);

  if (records === null) {
    throw new Error(
      `The response from ${address} did not hold a records array.`,
    );
  }

  return records;
}

async function collectRecords(): Promise<unknown[]> {
  const records: unknown[] = [];

  for (const query of QUERIES) {
    for (let page = 1; page <= MAXIMUM_PAGES_PER_QUERY; page += 1) {
      const pageRecords = await fetchSearchPage({ query, page });

      console.log(
        `Fetched query "${query}" page ${page}: ${pageRecords.length} records.`,
      );

      records.push(...pageRecords);

      if (pageRecords.length < PAGE_SIZE) {
        break;
      }
    }
  }

  return records;
}

async function main(): Promise<void> {
  const records = await collectRecords();

  const catalogue: Catalogue = {
    source: SEARCH_ENDPOINT,
    fetchedAt: new Date().toISOString(),
    credit: CREDIT_LINE,
    designs: buildDesigns(records),
  };

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(
    OUTPUT_PATH,
    `${JSON.stringify(catalogue, null, 2)}\n`,
    "utf8",
  );

  console.log(`Wrote ${catalogue.designs.length} designs to ${OUTPUT_PATH}.`);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
