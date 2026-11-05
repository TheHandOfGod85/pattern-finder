export type Design = {
  id: string;
  title: string;
  maker: string;
  dateText: string | null;
  year: number | null;
  objectType: string;
  placeOfOrigin: string | null;
  imageId: string;
  thumbnailUrl: string;
  largeImageUrl: string;
  recordUrl: string;
};

export type YearRange = {
  start: number;
  end: number;
};

export type FilterDesignsOptions = {
  designs: readonly Design[];
  search: string;
  period: YearRange | null;
  objectType: string;
};

const ALL_TYPES_OPTION = "all";

export const PERIOD_SIZE = 50;

export function intersectYearRanges(options: {
  first: YearRange | null;
  second: YearRange | null;
}): YearRange | null {
  if (options.first === null) {
    return options.second;
  }

  if (options.second === null) {
    return options.first;
  }

  return {
    start: Math.max(options.first.start, options.second.start),
    end: Math.min(options.first.end, options.second.end),
  };
}

export function buildPeriodStarts(designs: readonly Design[]): number[] {
  const years = designs
    .map((design) => design.year)
    .filter((year): year is number => year !== null);

  if (years.length === 0) {
    return [];
  }

  const firstStart = Math.floor(Math.min(...years) / PERIOD_SIZE) * PERIOD_SIZE;
  const latestYear = Math.max(...years);
  const starts: number[] = [];

  for (let start = firstStart; start <= latestYear; start += PERIOD_SIZE) {
    starts.push(start);
  }

  return starts;
}

function matchesSearch(design: Design, search: string): boolean {
  if (search === "") {
    return true;
  }

  return (
    design.title.toLowerCase().includes(search) ||
    design.maker.toLowerCase().includes(search)
  );
}

function matchesPeriod(design: Design, period: YearRange | null): boolean {
  if (period === null) {
    return true;
  }

  return (
    design.year !== null &&
    design.year >= period.start &&
    design.year <= period.end
  );
}

function matchesObjectType(design: Design, objectType: string): boolean {
  if (objectType === "" || objectType === ALL_TYPES_OPTION) {
    return true;
  }

  return design.objectType.toLowerCase().includes(objectType);
}

export function filterDesigns(options: FilterDesignsOptions): Design[] {
  const search = options.search.trim().toLowerCase();
  const objectType = options.objectType.trim().toLowerCase();

  return options.designs.filter(
    (design) =>
      matchesSearch(design, search) &&
      matchesPeriod(design, options.period) &&
      matchesObjectType(design, objectType),
  );
}
