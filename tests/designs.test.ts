import { describe, expect, it } from "vitest";
import {
  buildPeriodStarts,
  filterDesigns,
  intersectYearRanges,
  type Design,
  type YearRange,
} from "../src/designs";

const baseDesign: Design = {
  id: "O0",
  title: "Untitled design",
  maker: "Unknown",
  dateText: null,
  year: null,
  objectType: "Wallpaper",
  placeOfOrigin: null,
  imageId: "image-0",
  thumbnailUrl: "https://example.test/image-0.jpg",
  largeImageUrl: "https://example.test/image-0-large.jpg",
  recordUrl: "https://example.test/item/O0",
};

function createDesign(overrides: Partial<Design> & { id: string }): Design {
  return { ...baseDesign, ...overrides };
}

const willowBough = createDesign({
  id: "O1",
  title: "Willow Bough",
  maker: "William Morris",
  dateText: "1887",
  year: 1887,
  objectType: "Wallpaper",
});

const trellis = createDesign({
  id: "O2",
  title: "Trellis",
  maker: "William Morris",
  dateText: "1862",
  year: 1862,
  objectType: "Wallpaper sample",
});

const silkDamask = createDesign({
  id: "O3",
  title: "Silk damask",
  maker: "Anna Maria Garthwaite",
  dateText: "1750",
  year: 1750,
  objectType: "Textile design",
});

const furnishingFabric = createDesign({
  id: "O4",
  title: "Furnishing fabric",
  maker: "Liberty & Co.",
  dateText: "1890",
  year: 1890,
  objectType: "Furnishing fabric",
});

const undatedWallpaper = createDesign({
  id: "O5",
  title: "Wallpaper fragment",
  maker: "Unknown",
  objectType: "Wallpaper sample",
});

const allDesigns: Design[] = [
  willowBough,
  trellis,
  silkDamask,
  furnishingFabric,
  undatedWallpaper,
];

function filter(
  overrides: Partial<{
    search: string;
    period: { start: number; end: number } | null;
    objectType: string;
  }> = {},
): Design[] {
  return filterDesigns({
    designs: allDesigns,
    search: "",
    period: null,
    objectType: "All",
    ...overrides,
  });
}

function designIds(designs: readonly Design[]): string[] {
  return designs.map((design) => design.id);
}

describe("filtering designs by search", () => {
  it.each([
    {
      description: "the title",
      search: "willow",
      expectedIds: ["O1"],
    },
    {
      description: "the maker",
      search: "morris",
      expectedIds: ["O1", "O2"],
    },
    {
      description: "the maker with surrounding space and other case",
      search: "  MORRIS  ",
      expectedIds: ["O1", "O2"],
    },
  ])(
    "finds a design when the search matches $description",
    ({ search, expectedIds }) => {
      expect(designIds(filter({ search }))).toEqual(expectedIds);
    },
  );

  it("returns nothing when the search matches no design", () => {
    expect(filter({ search: "ceramic teapot" })).toEqual([]);
  });
});

describe("filtering designs by period", () => {
  it.each([
    {
      description: "1850 to 1899",
      period: { start: 1850, end: 1899 },
      expectedIds: ["O1", "O2", "O4"],
    },
    {
      description: "1750 to 1799",
      period: { start: 1750, end: 1799 },
      expectedIds: ["O3"],
    },
    {
      description: "1887 to 1890 at both boundaries",
      period: { start: 1887, end: 1890 },
      expectedIds: ["O1", "O4"],
    },
  ])(
    "keeps only designs dated within $description",
    ({ period, expectedIds }) => {
      const designs = filter({ period });

      expect(designIds(designs)).toEqual(expectedIds);
      for (const design of designs) {
        expect(design.year).not.toBeNull();
        expect(design.year).toBeGreaterThanOrEqual(period.start);
        expect(design.year).toBeLessThanOrEqual(period.end);
      }
    },
  );

  it("hides a design with no year while a period is active", () => {
    const designs = filter({ period: { start: 1700, end: 2000 } });

    expect(designIds(designs)).not.toContain("O5");
  });
});

describe("filtering designs by type", () => {
  it("keeps only designs whose object type contains the type option", () => {
    const designs = filter({ objectType: "Wallpaper" });

    expect(designIds(designs)).toEqual(["O1", "O2", "O5"]);
    for (const design of designs) {
      expect(design.objectType.toLowerCase()).toContain("wallpaper");
    }
  });

  it.each([
    { description: "Textile", objectType: "Textile", expectedIds: ["O3"] },
    { description: "Fabric", objectType: "Fabric", expectedIds: ["O4"] },
  ])(
    "keeps only $description designs",
    ({ objectType, expectedIds }) => {
      expect(designIds(filter({ objectType }))).toEqual(expectedIds);
    },
  );
});

describe("intersecting year ranges", () => {
  const cases: {
    description: string;
    first: YearRange | null;
    second: YearRange | null;
    expected: YearRange | null;
  }[] = [
    {
      description: "both ranges overlap",
      first: { start: 1850, end: 1899 },
      second: { start: 1880, end: 1930 },
      expected: { start: 1880, end: 1899 },
    },
    {
      description: "one range contains the other",
      first: { start: 1800, end: 2000 },
      second: { start: 1850, end: 1899 },
      expected: { start: 1850, end: 1899 },
    },
    {
      description: "the ranges are disjoint",
      first: { start: 1700, end: 1799 },
      second: { start: 1850, end: 1899 },
      expected: { start: 1850, end: 1799 },
    },
    {
      description: "only a period is chosen",
      first: { start: 1850, end: 1899 },
      second: null,
      expected: { start: 1850, end: 1899 },
    },
    {
      description: "only a book range is chosen",
      first: null,
      second: { start: 1922, end: 1952 },
      expected: { start: 1922, end: 1952 },
    },
    {
      description: "neither is chosen",
      first: null,
      second: null,
      expected: null,
    },
  ];

  it.each(cases)(
    "returns the intersection when $description",
    ({ first, second, expected }) => {
      expect(intersectYearRanges({ first, second })).toEqual(expected);
    },
  );
});

describe("building period starts", () => {
  const cases: {
    description: string;
    designs: Design[];
    expectedStarts: number[];
  }[] = [
    {
      description: "dated designs spanning several periods",
      designs: allDesigns,
      expectedStarts: [1750, 1800, 1850],
    },
    {
      description: "a design exactly on a period boundary",
      designs: [createDesign({ id: "O6", year: 1800 })],
      expectedStarts: [1800],
    },
    {
      description: "a design just below a period boundary",
      designs: [createDesign({ id: "O7", year: 1799 })],
      expectedStarts: [1750],
    },
    {
      description: "only undated designs",
      designs: [undatedWallpaper],
      expectedStarts: [],
    },
    {
      description: "no designs",
      designs: [],
      expectedStarts: [],
    },
  ];

  it.each(cases)(
    "returns $expectedStarts for $description",
    ({ designs, expectedStarts }) => {
      expect(buildPeriodStarts(designs)).toEqual(expectedStarts);
    },
  );
});

describe("combining the filters", () => {
  it("shows every design when the filters are empty", () => {
    const designs = filter();

    expect(designIds(designs)).toEqual(["O1", "O2", "O3", "O4", "O5"]);
    expect(designs).not.toBe(allDesigns);
  });

  it("shows every design when the search holds only whitespace", () => {
    expect(designIds(filter({ search: "   " }))).toEqual([
      "O1",
      "O2",
      "O3",
      "O4",
      "O5",
    ]);
  });

  it("requires a design to match the search, period and type together", () => {
    const designs = filter({
      search: "morris",
      period: { start: 1850, end: 1899 },
      objectType: "Wallpaper",
    });

    expect(designIds(designs)).toEqual(["O1", "O2"]);
  });

  it("returns nothing when one filter excludes every remaining design", () => {
    const designs = filter({
      search: "willow",
      period: null,
      objectType: "Textile",
    });

    expect(designs).toEqual([]);
  });
});
