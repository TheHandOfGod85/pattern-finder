import "./styles.css";
import type { Catalogue } from "./catalogue";
import { filterDesigns, type Design, type YearRange } from "./designs";

const PERIOD_SIZE = 50;
const OBJECT_TYPE_OPTIONS = ["All", "Wallpaper", "Textile", "Fabric"] as const;

const appElement = document.querySelector<HTMLDivElement>("#app");

if (appElement === null) {
  throw new Error("The app element is missing from index.html.");
}

const catalogue = await loadCatalogue();
const searchInput = createSearchInput();
const periodSelect = createPeriodSelect(catalogue.designs);
const typeSelect = createTypeSelect();
const countElement = document.createElement("output");
const gridElement = document.createElement("div");
gridElement.className = "grid";
const detailDialog = document.createElement("dialog");
detailDialog.className = "detail";
detailDialog.setAttribute("aria-labelledby", "detail-title");

const controlsElement = document.createElement("section");
controlsElement.className = "controls";
controlsElement.append(
  createControlGroup({
    controlId: "search",
    labelText: "Search",
    control: searchInput,
  }),
  createControlGroup({
    controlId: "period",
    labelText: "Period",
    control: periodSelect,
  }),
  createControlGroup({
    controlId: "type",
    labelText: "Type",
    control: typeSelect,
  }),
);

appElement.replaceChildren(
  controlsElement,
  countElement,
  gridElement,
  detailDialog,
  createFooter({
    credit: catalogue.credit,
    fetchedAt: catalogue.fetchedAt,
  }),
);

function render(): void {
  const selectedPeriodStart =
    periodSelect.value === "" ? null : Number(periodSelect.value);
  const period: YearRange | null =
    selectedPeriodStart === null
      ? null
      : {
          start: selectedPeriodStart,
          end: selectedPeriodStart + PERIOD_SIZE - 1,
        };

  const designs = filterDesigns({
    designs: catalogue.designs,
    search: searchInput.value,
    period,
    objectType: typeSelect.value,
  });

  gridElement.replaceChildren(...designs.map(createDesignCard));
  countElement.textContent = `${designs.length} of ${catalogue.designs.length} designs`;
}

searchInput.addEventListener("input", render);
periodSelect.addEventListener("change", render);
typeSelect.addEventListener("change", render);

render();

function createSearchInput(): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "search";
  input.name = "search";
  input.autocomplete = "off";
  return input;
}

function createTypeSelect(): HTMLSelectElement {
  const select = document.createElement("select");

  for (const objectType of OBJECT_TYPE_OPTIONS) {
    select.append(createOption({ value: objectType, label: objectType }));
  }

  return select;
}

function createPeriodSelect(designs: readonly Design[]): HTMLSelectElement {
  const select = document.createElement("select");
  select.append(createOption({ value: "", label: "All" }));

  for (const start of buildPeriodStarts(designs)) {
    const end = start + PERIOD_SIZE - 1;
    select.append(
      createOption({ value: String(start), label: `${start}–${end}` }),
    );
  }

  return select;
}

function buildPeriodStarts(designs: readonly Design[]): number[] {
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

function createOption(options: {
  value: string;
  label: string;
}): HTMLOptionElement {
  const option = document.createElement("option");
  option.value = options.value;
  option.textContent = options.label;
  return option;
}

function createControlGroup(options: {
  controlId: string;
  labelText: string;
  control: HTMLInputElement | HTMLSelectElement;
}): HTMLDivElement {
  options.control.id = options.controlId;

  const label = document.createElement("label");
  label.htmlFor = options.controlId;
  label.textContent = options.labelText;

  const group = document.createElement("div");
  group.append(label, options.control);
  return group;
}

function createDesignCard(design: Design): HTMLElement {
  const card = document.createElement("article");
  card.className = "card";

  const image = document.createElement("img");
  image.src = design.thumbnailUrl;
  image.alt = design.title;
  image.loading = "lazy";

  const title = document.createElement("h2");
  title.textContent = design.title;

  const maker = document.createElement("p");
  maker.textContent = design.maker;

  card.addEventListener("click", () => showDesignDetail(design));
  card.append(image, title, maker);
  return card;
}

function showDesignDetail(design: Design): void {
  detailDialog.replaceChildren(
    createDetailContent(design),
    createCloseButton(),
  );
  detailDialog.showModal();
}

function createDetailContent(design: Design): HTMLElement {
  const content = document.createElement("div");

  const image = document.createElement("img");
  image.src = design.largeImageUrl;
  image.alt = design.title;

  const title = document.createElement("h2");
  title.id = "detail-title";
  title.textContent = design.title;

  const facts = document.createElement("dl");
  facts.append(
    createFact({ labelText: "Maker", valueText: design.maker }),
    createFact({ labelText: "Date", valueText: design.dateText ?? "Unknown" }),
    createFact({
      labelText: "Place",
      valueText: design.placeOfOrigin ?? "Unknown",
    }),
    createFact({ labelText: "Type", valueText: design.objectType }),
  );

  const recordLink = document.createElement("a");
  recordLink.href = design.recordUrl;
  recordLink.textContent = "View the museum record";

  content.append(image, title, facts, recordLink);
  return content;
}

function createFact(options: {
  labelText: string;
  valueText: string;
}): DocumentFragment {
  const term = document.createElement("dt");
  term.textContent = options.labelText;

  const description = document.createElement("dd");
  description.textContent = options.valueText;

  const fragment = document.createDocumentFragment();
  fragment.append(term, description);
  return fragment;
}

function createCloseButton(): HTMLButtonElement {
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.textContent = "Close";
  closeButton.addEventListener("click", () => detailDialog.close());
  return closeButton;
}

function createFooter(options: {
  credit: string;
  fetchedAt: string;
}): HTMLElement {
  const footer = document.createElement("footer");

  const credit = document.createElement("p");
  credit.textContent = options.credit;

  const fetchedAt = document.createElement("p");
  fetchedAt.textContent = `Catalogue fetched ${options.fetchedAt.slice(0, 10)}`;

  footer.append(credit, fetchedAt);
  return footer;
}

async function loadCatalogue(): Promise<Catalogue> {
  const response = await fetch("data/designs.json");

  if (!response.ok) {
    throw new Error(`The catalogue could not be loaded: ${response.status}.`);
  }

  const payload: unknown = await response.json();

  if (!isCatalogue(payload)) {
    throw new Error("The catalogue file is malformed.");
  }

  return payload;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDesign(value: unknown): value is Design {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value["id"] === "string" &&
    typeof value["title"] === "string" &&
    typeof value["maker"] === "string" &&
    (value["dateText"] === null || typeof value["dateText"] === "string") &&
    (value["year"] === null || typeof value["year"] === "number") &&
    typeof value["objectType"] === "string" &&
    (value["placeOfOrigin"] === null ||
      typeof value["placeOfOrigin"] === "string") &&
    typeof value["imageId"] === "string" &&
    typeof value["thumbnailUrl"] === "string" &&
    typeof value["largeImageUrl"] === "string" &&
    typeof value["recordUrl"] === "string"
  );
}

function isCatalogue(value: unknown): value is Catalogue {
  return (
    isRecord(value) &&
    typeof value["source"] === "string" &&
    typeof value["fetchedAt"] === "string" &&
    typeof value["credit"] === "string" &&
    Array.isArray(value["designs"]) &&
    value["designs"].every(isDesign)
  );
}
