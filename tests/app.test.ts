// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Catalogue } from "../src/catalogue";
import type { Design } from "../src/designs";

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

async function renderApp(): Promise<void> {
  document.body.innerHTML = '<div id="app"></div>';
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCatalogue,
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

afterEach(() => {
  vi.unstubAllGlobals();
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
