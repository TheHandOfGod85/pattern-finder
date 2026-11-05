import { describe, expect, it } from "vitest";
import { isRecord } from "../src/is-record";

describe("recognising a record", () => {
  it.each([
    {
      description: "an object with values",
      value: { title: "Willow Bough" },
      expected: true,
    },
    { description: "an empty object", value: {}, expected: true },
    { description: "null", value: null, expected: false },
    { description: "an array", value: ["Willow Bough"], expected: false },
    { description: "a string", value: "Willow Bough", expected: false },
    { description: "a number", value: 1887, expected: false },
    { description: "undefined", value: undefined, expected: false },
  ])("returns $expected for $description", ({ value, expected }) => {
    expect(isRecord(value)).toBe(expected);
  });
});
