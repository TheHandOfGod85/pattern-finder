// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Catalogue } from "../src/catalogue";
import type { Design } from "../src/designs";

// jsdom exposes <dialog> and its open attribute but not showModal or close.
if (typeof window.HTMLDialogElement.prototype.showModal !== "function") {
  window.HTMLDialogElement.prototype.showModal = function showModal(
    this: HTMLDialogElement,
  ): void {
    this.setAttribute("open", "");
  };

  window.HTMLDialogElement.prototype.close = function close(
    this: HTMLDialogElement,
  ): void {
    this.removeAttribute("open");
  };
}

const willowBough: Design = {
  id: "O1",
  title: "Willow Bough",
  maker: "William Morris",
  dateText: "1887",
  year: 1887,
  objectType: "Wallpaper",
  placeOfOrigin: "England",
  imageId: "image-1",
  thumbnailUrl: "https://example.test/image-1.jpg",
  largeImageUrl: "https://example.test/image-1-large.jpg",
  recordUrl: "https://example.test/item/O1",
};

const trellis: Design = {
  id: "O2",
  title: "Trellis",
  maker: "William Morris",
  dateText: "1862",
  year: 1862,
  objectType: "Wallpaper sample",
  placeOfOrigin: "England",
  imageId: "image-2",
  thumbnailUrl: "https://example.test/image-2.jpg",
  largeImageUrl: "https://example.test/image-2-large.jpg",
  recordUrl: "https://example.test/item/O2",
};

const silkDamask: Design = {
  id: "O3",
  title: "Silk damask",
  maker: "Anna Maria Garthwaite",
  dateText: "1750",
  year: 1750,
  objectType: "Textile design",
  placeOfOrigin: "England",
  imageId: "image-3",
  thumbnailUrl: "https://example.test/image-3.jpg",
  largeImageUrl: "https://example.test/image-3-large.jpg",
  recordUrl: "https://example.test/item/O3",
};

const undatedWallpaper: Design = {
  id: "O4",
  title: "Wallpaper fragment",
  maker: "Unknown",
  dateText: null,
  year: null,
  objectType: "Wallpaper sample",
  placeOfOrigin: null,
  imageId: "image-4",
  thumbnailUrl: "https://example.test/image-4.jpg",
  largeImageUrl: "https://example.test/image-4-large.jpg",
  recordUrl: "https://example.test/item/O4",
};

const mockCatalogue: Catalogue = {
  source: "https://api.vam.ac.uk/v2/objects/search",
  fetchedAt: "2026-11-05T00:00:00.000Z",
  credit: "© Victoria and Albert Museum, London",
  designs: [willowBough, trellis, silkDamask, undatedWallpaper],
};

const defaultBookResponse = {
  docs: [{ title: "The Hobbit", first_publish_year: 1937 }],
};

const bauhausTextile: Design = {
  id: "O5",
  title: "Bauhaus textile",
  maker: "Unknown",
  dateText: "1935",
  year: 1935,
  objectType: "Textile design",
  placeOfOrigin: "Germany",
  imageId: "image-5",
  thumbnailUrl: "https://example.test/image-5.jpg",
  largeImageUrl: "https://example.test/image-5-large.jpg",
  recordUrl: "https://example.test/item/O5",
};

const eraCatalogue: Catalogue = {
  ...mockCatalogue,
  designs: [...mockCatalogue.designs, bauhausTextile],
};

type CatalogueFailure = "rejected" | "not-found" | "malformed";

async function renderApp(
  options: {
    catalogue?: Catalogue;
    catalogueFailure?: CatalogueFailure;
    bookResponse?: unknown;
  } = {},
): Promise<void> {
  document.body.innerHTML = '<div id="app"></div>';

  const catalogue = options.catalogue ?? mockCatalogue;
  const bookResponse = options.bookResponse ?? defaultBookResponse;

  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("openlibrary.org")) {
        const payload: unknown = await bookResponse;
        return { ok: true, json: async () => payload };
      }

      if (options.catalogueFailure === "rejected") {
        throw new Error("The catalogue could not be loaded.");
      }

      if (options.catalogueFailure === "not-found") {
        return { ok: false, status: 404, json: async () => ({}) };
      }

      if (options.catalogueFailure === "malformed") {
        return { ok: true, json: async () => ({}) };
      }

      return { ok: true, json: async () => catalogue };
    }),
  );

  vi.resetModules();
  await import("../src/main");
}

function requireElement<ElementType extends Element>(
  selector: string,
): ElementType {
  const element = document.querySelector<ElementType>(selector);

  if (element === null) {
    throw new Error(`The page is missing ${selector}.`);
  }

  return element;
}

function cardTitles(): (string | null)[] {
  return Array.from(
    document.querySelectorAll("#app article h2"),
    (heading) => heading.textContent,
  );
}

function dispatchInput(element: HTMLInputElement): void {
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

function dispatchChange(element: HTMLSelectElement): void {
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

function findCard(title: string): HTMLElement {
  const card = Array.from(
    document.querySelectorAll<HTMLElement>("#app article"),
  ).find((article) => article.querySelector("h2")?.textContent === title);

  if (card === undefined) {
    throw new Error(`The page is missing the card ${title}.`);
  }

  return card;
}

function clickCard(title: string): void {
  findCard(title).click();
}

function detailFactValue(labelText: string): string | null {
  const term = Array.from(
    document.querySelectorAll("#app dialog dt"),
  ).find((element) => element.textContent === labelText);

  return term?.nextElementSibling?.textContent ?? null;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("the design grid", () => {
  beforeEach(async () => {
    await renderApp();
  });

  it("renders a card for each design in the catalogue", () => {
    expect(cardTitles()).toEqual([
      "Willow Bough",
      "Trellis",
      "Silk damask",
      "Wallpaper fragment",
    ]);
    expect(requireElement("#app").textContent).toContain("4 of 4 designs");
    expect(requireElement<HTMLImageElement>("#app article img").alt).toBe(
      "Willow Bough",
    );
  });

  it("reduces the grid to the designs matching the search", () => {
    const searchInput = requireElement<HTMLInputElement>("#search");
    searchInput.value = "morris";
    dispatchInput(searchInput);

    expect(cardTitles()).toEqual(["Willow Bough", "Trellis"]);
    expect(requireElement("#app").textContent).toContain("2 of 4 designs");
  });

  it("shows zero matches when the search matches no design", () => {
    const searchInput = requireElement<HTMLInputElement>("#search");
    searchInput.value = "ceramic teapot";
    dispatchInput(searchInput);

    expect(document.querySelectorAll("#app article")).toHaveLength(0);
    expect(requireElement("#app").textContent).toContain("0 of 4 designs");
  });

  it("keeps only the chosen type", () => {
    const typeSelect = requireElement<HTMLSelectElement>("#type");
    typeSelect.value = "Textile";
    dispatchChange(typeSelect);

    expect(cardTitles()).toEqual(["Silk damask"]);
    expect(requireElement("#app").textContent).toContain("1 of 4 designs");
  });

  it("shows zero matches when the chosen period holds no design", () => {
    const periodSelect = requireElement<HTMLSelectElement>("#period");
    periodSelect.value = "1800";
    dispatchChange(periodSelect);

    expect(document.querySelectorAll("#app article")).toHaveLength(0);
    expect(requireElement("#app").textContent).toContain("0 of 4 designs");
  });
});

describe("the book era", () => {
  it("finds the era of a known book and shows only its designs", async () => {
    await renderApp({ catalogue: eraCatalogue });

    requireElement<HTMLInputElement>("#book-title").value = "The Hobbit";
    requireElement<HTMLButtonElement>("#find-era").click();

    await vi.waitFor(() => {
      expect(requireElement("#book-status").textContent).toContain("1937");
    });

    const statusText = requireElement("#book-status").textContent ?? "";
    expect(statusText).toContain("1922");
    expect(statusText).toContain("1952");
    expect(cardTitles()).toEqual(["Bauhaus textile"]);
    expect(requireElement("#app").textContent).toContain("1 of 5 designs");
  });

  it("reports the effective range within the chosen period when the period narrows the era", async () => {
    await renderApp({ catalogue: eraCatalogue });

    requireElement<HTMLInputElement>("#book-title").value = "The Hobbit";
    requireElement<HTMLButtonElement>("#find-era").click();

    await vi.waitFor(() => {
      expect(requireElement("#book-status").textContent).toContain("1937");
    });

    const periodSelect = requireElement<HTMLSelectElement>("#period");
    periodSelect.value = "1900";
    dispatchChange(periodSelect);

    const statusText = requireElement("#book-status").textContent ?? "";
    expect(statusText).toContain("1937");
    expect(statusText).toContain("1922");
    expect(statusText).toContain("1949");
    expect(statusText).toContain("within the chosen period");
    expect(requireElement("#app").textContent).toContain("1 of 5 designs");
  });

  it("says no designs fall within the book era when the chosen period is disjoint", async () => {
    await renderApp({ catalogue: eraCatalogue });

    requireElement<HTMLInputElement>("#book-title").value = "The Hobbit";
    requireElement<HTMLButtonElement>("#find-era").click();

    await vi.waitFor(() => {
      expect(requireElement("#book-status").textContent).toContain("1937");
    });

    const periodSelect = requireElement<HTMLSelectElement>("#period");
    periodSelect.value = "1800";
    dispatchChange(periodSelect);

    const statusText = requireElement("#book-status").textContent ?? "";
    expect(statusText).toContain("1937");
    expect(statusText).toContain(
      "No designs in the chosen period fall within 1922 to 1952",
    );
    expect(document.querySelectorAll("#app article")).toHaveLength(0);
    expect(requireElement("#app").textContent).toContain("0 of 5 designs");
  });

  it("says it could not find an unknown book and leaves the grid unchanged", async () => {
    await renderApp({ bookResponse: { docs: [] } });
    const titlesBefore = cardTitles();

    requireElement<HTMLInputElement>("#book-title").value = "An imaginary book";
    requireElement<HTMLButtonElement>("#find-era").click();

    await vi.waitFor(() => {
      expect(requireElement("#book-status").textContent).toBe(
        "I could not find that book. Try the full title.",
      );
    });

    expect(cardTitles()).toEqual(titlesBefore);
    expect(requireElement("#app").textContent).toContain("4 of 4 designs");
  });

  it.each([
    { description: "empty", title: "" },
    { description: "only whitespace", title: "   " },
  ])(
    "refuses a title that is $description without asking the lookup",
    async ({ title }) => {
      await renderApp();

      requireElement<HTMLInputElement>("#book-title").value = title;
      requireElement<HTMLButtonElement>("#find-era").click();

      expect(requireElement("#book-status").textContent).toBe(
        "Type a book title first.",
      );

      const requestedUrls = vi
        .mocked(fetch)
        .mock.calls.map(([input]) => String(input));

      expect(requestedUrls).toEqual(["data/designs.json"]);
      expect(cardTitles()).toEqual([
        "Willow Bough",
        "Trellis",
        "Silk damask",
        "Wallpaper fragment",
      ]);
    },
  );

  it("clears the book, the period and the search when reset", async () => {
    await renderApp({ catalogue: eraCatalogue });

    const searchInput = requireElement<HTMLInputElement>("#search");
    searchInput.value = "morris";
    dispatchInput(searchInput);

    const periodSelect = requireElement<HTMLSelectElement>("#period");
    periodSelect.value = "1850";
    dispatchChange(periodSelect);

    const typeSelect = requireElement<HTMLSelectElement>("#type");
    typeSelect.value = "Textile";
    dispatchChange(typeSelect);

    const bookTitleInput = requireElement<HTMLInputElement>("#book-title");
    bookTitleInput.value = "The Hobbit";
    requireElement<HTMLButtonElement>("#find-era").click();

    await vi.waitFor(() => {
      expect(requireElement("#book-status").textContent).toContain("1937");
    });

    requireElement<HTMLButtonElement>("#reset").click();

    expect(searchInput.value).toBe("");
    expect(periodSelect.value).toBe("");
    expect(typeSelect.value).toBe("All");
    expect(bookTitleInput.value).toBe("");
    expect(requireElement("#book-status").textContent).toBe("");
    expect(cardTitles()).toEqual([
      "Willow Bough",
      "Trellis",
      "Silk damask",
      "Wallpaper fragment",
      "Bauhaus textile",
    ]);
    expect(requireElement("#app").textContent).toContain("5 of 5 designs");
  });

  it("shows the waiting state while the book lookup runs", async () => {
    let resolveBookResponse: (payload: unknown) => void = () => {};
    const bookResponse = new Promise<unknown>((resolve) => {
      resolveBookResponse = resolve;
    });

    await renderApp({ bookResponse });

    requireElement<HTMLInputElement>("#book-title").value = "The Hobbit";
    requireElement<HTMLButtonElement>("#find-era").click();

    expect(requireElement("#book-status").textContent).toBe(
      "Looking up the book…",
    );
    expect(requireElement<HTMLButtonElement>("#find-era").disabled).toBe(true);
    expect(requireElement<HTMLButtonElement>("#reset").disabled).toBe(true);

    resolveBookResponse(defaultBookResponse);

    await vi.waitFor(() => {
      expect(requireElement("#book-status").textContent).toContain("1937");
    });

    expect(requireElement<HTMLButtonElement>("#find-era").disabled).toBe(false);
    expect(requireElement<HTMLButtonElement>("#reset").disabled).toBe(false);
  });
});

describe("the design detail view", () => {
  beforeEach(async () => {
    await renderApp();
  });

  it("opens the detail view with the record facts when a card is clicked", () => {
    clickCard("Willow Bough");

    const dialog = requireElement<HTMLDialogElement>("#app dialog");
    expect(dialog.open).toBe(true);

    const image = requireElement<HTMLImageElement>("#app dialog img");
    expect(image.src).toBe(willowBough.largeImageUrl);
    expect(image.alt).toBe(willowBough.title);
    expect(requireElement("#app dialog h2").textContent).toBe(
      willowBough.title,
    );

    const expectedFacts = [
      { labelText: "Maker", valueText: "William Morris" },
      { labelText: "Date", valueText: "1887" },
      { labelText: "Place", valueText: "England" },
      { labelText: "Type", valueText: "Wallpaper" },
    ];

    for (const fact of expectedFacts) {
      expect(detailFactValue(fact.labelText)).toBe(fact.valueText);
    }

    const recordLink = requireElement<HTMLAnchorElement>("#app dialog a");
    expect(recordLink.href).toBe(willowBough.recordUrl);
    expect(recordLink.textContent?.trim()).not.toBe("");
  });

  it.each([
    { description: "Enter", key: "Enter" },
    { description: "Space", key: " " },
  ])(
    "opens the detail view when a card is activated with $description",
    ({ key }) => {
      findCard("Willow Bough").dispatchEvent(
        new KeyboardEvent("keydown", { key, bubbles: true }),
      );

      expect(requireElement<HTMLDialogElement>("#app dialog").open).toBe(true);
      expect(requireElement("#app dialog h2").textContent).toBe("Willow Bough");
    },
  );

  it("says Unknown when the design has no maker", () => {
    clickCard("Wallpaper fragment");

    expect(detailFactValue("Maker")).toBe("Unknown");
    expect(requireElement("#app dialog").textContent ?? "").not.toContain(
      "null",
    );
  });

  it("returns to the unchanged grid when the detail view is closed", () => {
    const titlesBefore = cardTitles();

    clickCard("Willow Bough");
    const dialog = requireElement<HTMLDialogElement>("#app dialog");
    expect(dialog.open).toBe(true);

    const closeButton = requireElement<HTMLButtonElement>("#app dialog button");
    expect(closeButton.textContent).toBe("Close");
    closeButton.click();

    expect(dialog.open).toBe(false);
    expect(cardTitles()).toEqual(titlesBefore);
  });
});

describe("a catalogue that cannot load", () => {
  it.each([
    { description: "the request rejects", failure: "rejected" as const },
    { description: "the response is not ok", failure: "not-found" as const },
    { description: "the payload is malformed", failure: "malformed" as const },
  ])(
    "shows the designed message and the credit when $description",
    async ({ failure }) => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await renderApp({ catalogueFailure: failure });

      expect(requireElement("#app p").textContent).toBe(
        "The catalogue could not load. Run the ingest, then try again.",
      );
      expect(requireElement("#app footer").textContent).toContain(
        "© Victoria and Albert Museum, London",
      );
      expect(consoleError).toHaveBeenCalledWith(expect.any(Error));
    },
  );
});

describe("the page footer", () => {
  beforeEach(async () => {
    await renderApp();
  });

  it("shows the museum credit and the catalogue fetch date", () => {
    const footerText = requireElement("#app footer").textContent ?? "";

    expect(footerText).toContain("© Victoria and Albert Museum, London");
    expect(footerText).toContain("Catalogue fetched 2026-11-05");
  });
});

describe("the page heading", () => {
  beforeEach(async () => {
    await renderApp();
  });

  it("names the page with a top-level heading", () => {
    const heading = requireElement("#app h1");

    expect(heading.textContent).toBe("Pattern Finder");
    expect(requireElement("#app").firstElementChild).toBe(heading);
  });
});
