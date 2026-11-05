import type { Design } from "./designs";
import { isRecord } from "./is-record";
import { parseYear } from "./parse-year";

export const CREDIT_LINE = "© Victoria and Albert Museum, London";
export const SEARCH_ENDPOINT = "https://api.vam.ac.uk/v2/objects/search";

export type Catalogue = {
  source: string;
  fetchedAt: string;
  credit: string;
  designs: Design[];
};

const relevantObjectTypeFragments = ["wallpaper", "textile", "fabric"];

function readNonEmptyText(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return value;
}

export function isRelevantObjectType(objectType: unknown): boolean {
  const statedType = readNonEmptyText(objectType);

  if (statedType === null) {
    return false;
  }

  const normalisedType = statedType.toLowerCase();

  return relevantObjectTypeFragments.some((fragment) =>
    normalisedType.includes(fragment),
  );
}

export function mapRecordToDesign(record: unknown): Design | null {
  if (!isRecord(record)) {
    return null;
  }

  const id = readNonEmptyText(record["systemNumber"]);
  const objectType = readNonEmptyText(record["objectType"]);
  const imageId = readNonEmptyText(record["_primaryImageId"]);

  if (id === null || objectType === null || imageId === null) {
    return null;
  }

  if (!isRelevantObjectType(objectType)) {
    return null;
  }

  const dateText = readNonEmptyText(record["_primaryDate"]);
  const makerRecord = record["_primaryMaker"];
  const makerName = isRecord(makerRecord)
    ? readNonEmptyText(makerRecord["name"])
    : null;

  return {
    id,
    title: readNonEmptyText(record["_primaryTitle"]) ?? "Untitled",
    maker: makerName ?? "Unknown",
    dateText,
    year: parseYear(dateText),
    objectType,
    placeOfOrigin: readNonEmptyText(record["_primaryPlace"]),
    imageId,
    thumbnailUrl: `https://framemark.vam.ac.uk/collections/${imageId}/full/!400,400/0/default.jpg`,
    largeImageUrl: `https://framemark.vam.ac.uk/collections/${imageId}/full/!1200,1200/0/default.jpg`,
    recordUrl: `https://collections.vam.ac.uk/item/${id}/`,
  };
}

export function buildDesigns(records: readonly unknown[]): Design[] {
  const designs: Design[] = [];
  const seenIds = new Set<string>();

  for (const record of records) {
    const design = mapRecordToDesign(record);

    if (design === null || seenIds.has(design.id)) {
      continue;
    }

    seenIds.add(design.id);
    designs.push(design);
  }

  return designs;
}
