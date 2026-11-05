import { describe, expect, it } from "vitest";
import { parseYear } from "../src/parse-year";

const datedScenarios = [
  {
    description: "reads the year from a circa date",
    dateText: "ca.1786",
    expectedYear: 1786,
  },
  {
    description: "reads the first year of a date range",
    dateText: "1860-1870",
    expectedYear: 1860,
  },
  {
    description: "reads the year from a decade",
    dateText: "1890s",
    expectedYear: 1890,
  },
  {
    description: "reads the midpoint year of a century",
    dateText: "19th century",
    expectedYear: 1850,
  },
  {
    description: "reads the midpoint year of a qualified century",
    dateText: "early 18th century",
    expectedYear: 1750,
  },
  {
    description: "returns nothing when the text holds no year",
    dateText: "unknown",
    expectedYear: null,
  },
];

describe("reading a year from date text", () => {
  it.each(datedScenarios)("$description", ({ dateText, expectedYear }) => {
    expect(parseYear(dateText)).toBe(expectedYear);
  });

  it("returns nothing for an empty or missing date", () => {
    expect(parseYear("")).toBeNull();
    expect(parseYear(null)).toBeNull();
    expect(parseYear(undefined)).toBeNull();
  });
});
