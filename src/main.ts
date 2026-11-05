import "./styles.css";
import { buildBookYearRange, lookupFirstPublicationYear } from "./book";
import { CREDIT_LINE, type Catalogue } from "./catalogue";
import {
  buildPeriodStarts,
  filterDesigns,
  intersectYearRanges,
  PERIOD_SIZE,
  type Design,
  type YearRange,
} from "./designs";
import { isRecord } from "./is-record";

const OBJECT_TYPE_OPTIONS = ["All", "Wallpaper", "Textile", "Fabric"] as const;

type BookEra = {
  title: string;
  year: number;
  range: YearRange;
};

const appElement = document.querySelector<HTMLDivElement>("#app");

if (appElement === null) {
  throw new Error("The app element is missing from index.html.");
}

let catalogue: Catalogue;
let searchInput: HTMLInputElement;
let periodSelect: HTMLSelectElement;
let typeSelect: HTMLSelectElement;
let bookTitleInput: HTMLInputElement;
let findEraButton: HTMLButtonElement;
let resetButton: HTMLButtonElement;
let bookStatusElement: HTMLParagraphElement;
let bookEra: BookEra | null = null;
let bookNotice: string | null = null;
let countElement: HTMLOutputElement;
let gridElement: HTMLDivElement;
let detailDialog: HTMLDialogElement;

let loadedCatalogue: Catalogue | null = null;

try {
  loadedCatalogue = await loadCatalogue();
} catch (error) {
  console.error(error);
}

if (loadedCatalogue === null) {
  appElement.replaceChildren(
    createCatalogueFailure(),
    createFooter({ credit: CREDIT_LINE }),
  );
} else {
  catalogue = loadedCatalogue;
  startApp(appElement);
}

function startApp(appElement: HTMLDivElement): void {
  searchInput = createSearchInput();
  periodSelect = createPeriodSelect(catalogue.designs);
  typeSelect = createTypeSelect();
  bookTitleInput = createBookTitleInput();
  findEraButton = createActionButton({
    buttonId: "find-era",
    labelText: "Find its era",
  });
  resetButton = createActionButton({
    buttonId: "reset",
    labelText: "Reset",
  });
  bookStatusElement = createBookStatus();
  countElement = document.createElement("output");
  gridElement = document.createElement("div");
  gridElement.className = "grid";
  detailDialog = document.createElement("dialog");
  detailDialog.className = "detail";
  detailDialog.setAttribute("aria-labelledby", "detail-title");

  const pageTitle = document.createElement("h1");
  pageTitle.textContent = "Pattern Finder";

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

  const bookControlsElement = document.createElement("section");
  bookControlsElement.className = "book-controls";
  bookControlsElement.append(
    createControlGroup({
      controlId: "book-title",
      labelText: "Book you are reading",
      control: bookTitleInput,
    }),
    findEraButton,
    resetButton,
    bookStatusElement,
  );

  appElement.replaceChildren(
    pageTitle,
    controlsElement,
    bookControlsElement,
    countElement,
    gridElement,
    detailDialog,
    createFooter({
      credit: catalogue.credit,
      fetchedAt: catalogue.fetchedAt,
    }),
  );

  searchInput.addEventListener("input", render);
  periodSelect.addEventListener("change", render);
  typeSelect.addEventListener("change", render);
  findEraButton.addEventListener("click", () => void findEra());
  resetButton.addEventListener("click", resetControls);

  render();
}

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
    period: intersectYearRanges({
      first: period,
      second: bookEra?.range ?? null,
    }),
    objectType: typeSelect.value,
  });

  gridElement.replaceChildren(...designs.map(createDesignCard));
  countElement.textContent = `${designs.length} of ${catalogue.designs.length} designs`;
  bookStatusElement.textContent = buildBookStatusText({
    bookEra,
    bookNotice,
    period,
  });
}

function buildBookStatusText(options: {
  bookEra: BookEra | null;
  bookNotice: string | null;
  period: YearRange | null;
}): string {
  if (options.bookNotice !== null) {
    return options.bookNotice;
  }

  if (options.bookEra === null) {
    return "";
  }

  const publicationSentence = `${options.bookEra.title} was first published in ${options.bookEra.year}.`;

  if (options.period === null) {
    return `${publicationSentence} Showing designs from ${options.bookEra.range.start} to ${options.bookEra.range.end}.`;
  }

  const effectiveRange = intersectYearRanges({
    first: options.period,
    second: options.bookEra.range,
  });

  if (effectiveRange === null || effectiveRange.start > effectiveRange.end) {
    return `${publicationSentence} No designs in the chosen period fall within ${options.bookEra.range.start} to ${options.bookEra.range.end}.`;
  }

  return `${publicationSentence} Showing designs from ${effectiveRange.start} to ${effectiveRange.end} within the chosen period.`;
}

async function findEra(): Promise<void> {
  const title = bookTitleInput.value.trim();

  if (title === "") {
    bookNotice = "Type a book title first.";
    render();
    return;
  }

  bookNotice = "Looking up the book…";
  render();
  findEraButton.disabled = true;
  resetButton.disabled = true;

  try {
    const year = await lookupFirstPublicationYear(title);

    if (year === null) {
      bookNotice = "I could not find that book. Try the full title.";
      render();
      return;
    }

    bookEra = { title, year, range: buildBookYearRange(year) };
    bookNotice = null;
    render();
  } finally {
    findEraButton.disabled = false;
    resetButton.disabled = false;
  }
}

function resetControls(): void {
  searchInput.value = "";
  periodSelect.value = "";
  typeSelect.value = "All";
  bookTitleInput.value = "";
  bookEra = null;
  bookNotice = null;
  render();
}

function createCatalogueFailure(): HTMLParagraphElement {
  const message = document.createElement("p");
  message.textContent =
    "The catalogue could not load. Run the ingest, then try again.";
  return message;
}

function createSearchInput(): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "search";
  input.name = "search";
  input.autocomplete = "off";
  return input;
}

function createBookTitleInput(): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "text";
  input.autocomplete = "off";
  return input;
}

function createActionButton(options: {
  buttonId: string;
  labelText: string;
}): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.id = options.buttonId;
  button.textContent = options.labelText;
  return button;
}

function createBookStatus(): HTMLParagraphElement {
  const status = document.createElement("p");
  status.id = "book-status";
  status.setAttribute("role", "status");
  return status;
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
  card.setAttribute("role", "button");
  card.tabIndex = 0;

  const image = document.createElement("img");
  image.src = design.thumbnailUrl;
  image.alt = design.title;
  image.loading = "lazy";

  const title = document.createElement("h2");
  title.textContent = design.title;

  const maker = document.createElement("p");
  maker.textContent = design.maker;

  card.addEventListener("click", () => showDesignDetail(design));
  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    showDesignDetail(design);
  });
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
  fetchedAt?: string;
}): HTMLElement {
  const footer = document.createElement("footer");

  const credit = document.createElement("p");
  credit.textContent = options.credit;
  footer.append(credit);

  if (options.fetchedAt !== undefined) {
    const fetchedAt = document.createElement("p");
    fetchedAt.textContent = `Catalogue fetched ${options.fetchedAt.slice(0, 10)}`;
    footer.append(fetchedAt);
  }

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
