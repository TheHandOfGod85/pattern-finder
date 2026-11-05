import { afterEach, describe, expect, it, vi, type Mock } from "vitest";
import { buildBookYearRange, lookupFirstPublicationYear } from "../src/book";

function createResponse(options: {
  payload: unknown;
  ok?: boolean;
}): Response {
  return {
    ok: options.ok ?? true,
    status: options.ok === false ? 500 : 200,
    json: async () => options.payload,
  } as unknown as Response;
}

function createFetchMock(response: Response): Mock<typeof fetch> {
  return vi.fn<typeof fetch>().mockResolvedValue(response);
}

describe("building the book year range", () => {
  it.each([
    { description: "1937", year: 1937, expected: { start: 1922, end: 1952 } },
    { description: "350", year: 350, expected: { start: 335, end: 365 } },
    { description: "2017", year: 2017, expected: { start: 2002, end: 2032 } },
  ])(
    "spans the fifteen years either side of $description",
    ({ year, expected }) => {
      expect(buildBookYearRange(year)).toEqual(expected);
    },
  );
});

describe("looking up the first publication year", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the publication year of the first match", async () => {
    vi.stubGlobal(
      "fetch",
      createFetchMock(
        createResponse({
          payload: {
            docs: [
              { title: "The Hobbit", first_publish_year: 1937 },
              { title: "A later reprint", first_publish_year: 2000 },
            ],
          },
        }),
      ),
    );

    await expect(lookupFirstPublicationYear("The Hobbit")).resolves.toBe(1937);
  });

  it("asks Open Library for one match with the trimmed title", async () => {
    const fetchMock = createFetchMock(createResponse({ payload: { docs: [] } }));
    vi.stubGlobal("fetch", fetchMock);

    await lookupFirstPublicationYear("  The Hobbit  ");

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));

    expect(`${requestUrl.origin}${requestUrl.pathname}`).toBe(
      "https://openlibrary.org/search.json",
    );
    expect(requestUrl.searchParams.get("q")).toBe("The Hobbit");
    expect(requestUrl.searchParams.get("fields")).toBe(
      "title,first_publish_year",
    );
    expect(requestUrl.searchParams.get("limit")).toBe("1");
  });

  const failureCases: {
    description: string;
    createFetch: () => Mock<typeof fetch>;
  }[] = [
    {
      description: "the response is not ok",
      createFetch: () =>
        createFetchMock(
          createResponse({
            payload: {
              docs: [{ title: "The Hobbit", first_publish_year: 1937 }],
            },
            ok: false,
          }),
        ),
    },
    {
      description: "the request rejects",
      createFetch: () =>
        vi.fn<typeof fetch>().mockRejectedValue(new TypeError("Network error")),
    },
    {
      description: "the body is not JSON",
      createFetch: () =>
        vi.fn<typeof fetch>().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => {
            throw new SyntaxError("Unexpected token");
          },
        } as unknown as Response),
    },
    {
      description: "the body is null",
      createFetch: () => createFetchMock(createResponse({ payload: null })),
    },
    {
      description: "the body has no docs",
      createFetch: () => createFetchMock(createResponse({ payload: {} })),
    },
    {
      description: "docs is empty",
      createFetch: () =>
        createFetchMock(createResponse({ payload: { docs: [] } })),
    },
    {
      description: "docs is not an array",
      createFetch: () =>
        createFetchMock(createResponse({ payload: { docs: "The Hobbit" } })),
    },
    {
      description: "the first document is not an object",
      createFetch: () =>
        createFetchMock(createResponse({ payload: { docs: [null] } })),
    },
    {
      description: "the first document has no publication year",
      createFetch: () =>
        createFetchMock(
          createResponse({ payload: { docs: [{ title: "The Hobbit" }] } }),
        ),
    },
    {
      description: "the publication year is not a number",
      createFetch: () =>
        createFetchMock(
          createResponse({
            payload: { docs: [{ first_publish_year: "1937" }] },
          }),
        ),
    },
  ];

  it.each(failureCases)("returns nothing when $description", async ({
    createFetch,
  }) => {
    vi.stubGlobal("fetch", createFetch());

    await expect(lookupFirstPublicationYear("The Hobbit")).resolves.toBeNull();
  });
});
