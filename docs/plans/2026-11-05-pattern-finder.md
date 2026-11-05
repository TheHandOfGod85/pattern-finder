# Pattern Finder Implementation Plan

**Design:** [docs/designs/2026-11-05-pattern-finder.md](../designs/2026-11-05-pattern-finder.md)

**Goal:** Build and ship a static site that lets a reader search the V&A's wallpapers and furnishing fabrics, and see designs from the era of the book they are reading.

**Architecture:** A build-time ingest writes one cached JSON catalogue. A static TypeScript page reads that file and filters it in the browser. No server, no database, and no runtime call to the museum.

**Tech Stack:** TypeScript, Vite, Vitest, plain DOM and CSS. No runtime dependencies.

**Testing Strategy:** Scenario-first. Each behaviour gets a failing test first. Dense logic gets focused unit tests. The page wiring gets one DOM-level test.

**North-star step:** Not owned. This is a standalone POC with no product design behind it.

**Plan start:** `426a0501c8ff93c0c9176ee97b4c770a9c05b4dc`

> **Start the build session inside `C:\repos\pattern-finder`.** The diamond implementer agent runs git commands when it starts, so the session folder must be a git repository. A session opened in a non-repository folder fails before the first task.

---

## Global constraints

- **The V&A terms are rules, not notes.** The page shows `© Victoria and Albert Museum, London`. Images load from the V&A's own addresses. The catalogue records its fetch date and must not be older than four weeks. The ingest makes no more than one request per second.
- **No runtime dependencies.** Dev dependencies only.
- **The browser never calls the V&A.** It reads the cached file. The only live call is the book lookup the reader asks for.
- **Never put API data into `innerHTML`.** Build DOM nodes and set `textContent`.
- **Comments are rare.** A comment must record something a careful reader cannot recover from the code. Never restate the code.
- **Explicit names.** No abbreviations.
- **PowerShell for every shell command.** No bash.
- **The author commits.** Never commit, push or create a branch.

---

## Phase 1 — The project builds, and a date becomes a year

**Commit scope:** A repository that installs, tests and builds. `npm test` passes. `npm run build` writes a page.

**Verification:** `npm test` → all pass. `npm run build` → `dist/` exists.

### Scenarios

**New behaviour (must fail first):**

- **A circa date** — Given the date text "ca.1786", when the year is read, then the year is 1786.
  → test: `reads the year from a circa date`
- **A date range** — Given "1860-1870", when the year is read, then the year is 1860.
  → test: `reads the first year of a date range`
- **A decade** — Given "1890s", then the year is 1890.
  → test: `reads the year from a decade`
- **A century** — Given "19th century", then the year is 1850.
  → test: `reads the midpoint year of a century`
- **A qualified century** — Given "early 18th century", then the year is 1750.
  → test: `reads the midpoint year of a qualified century`
- **No year in the text** — Given "unknown", then there is no year.
  → test: `returns nothing when the text holds no year`
- **Empty text** — Given an empty or missing date, then there is no year.
  → test: `returns nothing for an empty or missing date`

**Regression guards (pass either way):** none — this is the first phase.

### Tasks

- [x] **Task 1.1: Project setup**

  **Files:** Create `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`, `src/styles.css`, `CLAUDE.md`, `.gitignore`
  **Acceptance criteria:** `npm install` succeeds. `npm run build` succeeds and writes `dist/`.
  **Constraints:** Use `npm install --save-dev vite typescript vitest tsx @types/node jsdom`. The exact file contents are below.

  `package.json`:

  ```json
  {
    "name": "pattern-finder",
    "private": true,
    "version": "0.1.0",
    "type": "module",
    "scripts": {
      "dev": "vite",
      "build": "tsc --noEmit && vite build",
      "preview": "vite preview",
      "test": "vitest run",
      "ingest": "tsx scripts/ingest.ts"
    }
  }
  ```

  `tsconfig.json`:

  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "module": "ESNext",
      "moduleResolution": "Bundler",
      "strict": true,
      "noUncheckedIndexedAccess": true,
      "noEmit": true,
      "lib": ["ES2022", "DOM", "DOM.Iterable"],
      "types": ["node", "vite/client"],
      "skipLibCheck": true
    },
    "include": ["src", "scripts", "tests", "vite.config.ts"]
  }
  ```

  `vite.config.ts`:

  ```ts
  import { defineConfig } from "vitest/config";

  export default defineConfig({
    base: "./",
    build: {
      target: "es2022",
    },
    test: {
      passWithNoTests: true,
    },
  });
  ```

  `.gitignore`:

  ```
  node_modules/
  dist/
  .playwright-cli/
  ```

  `index.html` holds a `#app` element and loads `/src/main.ts` as a module. `src/main.ts` writes a single placeholder line into `#app`. `src/styles.css` is empty at this point.

  `CLAUDE.md`:

  ```markdown
  # Pattern Finder

  A static site that searches a public archive of wallpapers and textiles, and shows designs from the era of a book the reader is reading.

  Data: the Victoria and Albert Museum public API.

  ## Commands

  - `npm install`
  - `npm run dev`
  - `npm test`
  - `npm run build`
  - `npm run ingest`

  ## Architecture

  - `src/parse-year.ts` — pure date parsing, tested
  - `src/catalogue.ts` — record mapping and relevance, pure, tested
  - `src/designs.ts` — the design type and the filter, pure, tested
  - `src/book.ts` — the book lookup and the year range, tested
  - `src/main.ts` — DOM wiring only
  - `scripts/ingest.ts` — fetch and write the catalogue
  - `public/data/designs.json` — the cache

  ## Rules

  - No runtime dependencies.
  - The browser never calls the V&A.
  - Logic that can be wrong lives in a pure module and gets tests.
  - Build DOM nodes and set `textContent`. Never interpolate API data into `innerHTML`.
  - Comments only for a non-obvious external constraint. Never restate the code.
  - Explicit names. No abbreviations.
  - Every page shows `© Victoria and Albert Museum, London`.
  - Images load from the V&A address. Never copy an image.
  - The catalogue fetch date must not be older than four weeks.
  - The ingest makes no more than one request per second.
  ```

- [x] **Task 1.2: Tests for the date parser**

  **Files:** Create `tests/parse-year.test.ts`
  **Acceptance criteria:** Covers all seven scenarios above. Every test fails before Task 1.3.
  **Constraints:** Test names describe the behaviour, not the function.

- [x] **Task 1.3: Implement the date parser (make tests pass)**

  **Files:** Create `src/parse-year.ts`
  **Acceptance criteria:** All seven scenarios pass. `npm test` is green.
  **Constraints:** Pure function. No network, no page, no clock.

- [x] **Task 1.4: Verify the build**

  **Files:** None
  **Acceptance criteria:** `npm test` passes. `npm run build` succeeds and `dist/index.html` exists.

**→ Phase 1 complete. Safe to commit.**

---

## Phase 2 — The catalogue is real

**Commit scope:** `npm run ingest` writes `public/data/designs.json` with about 1,900 designs, the fetch date and the credit line. The record mapping is tested.

**Verification:** `npm test` → all pass. `npm run ingest` → completes. The file holds more than 1,000 designs and a fetch date.

### Scenarios

**New behaviour (must fail first):**

- **A complete record becomes a design** — Given a record with a title, maker, date, type, place and image id, when it is mapped, then the design carries all of those, a parsed year, a thumbnail address, a large image address and a record link.
- **A record with no image is skipped** — Given a record with no image id, when it is mapped, then the result is nothing.
- **A record with no date** — Given a record with no date text, then the design has no year.
- **A record with no maker** — Given a record with no maker, then the maker reads "Unknown".
- **A duplicate record appears once** — Given the same system number arrives twice, when the catalogue is built, then it holds one design.
- **An irrelevant object is skipped** — Given a record whose type is not wallpaper, textile or fabric, when it is mapped, then the result is nothing.

**Regression guards (pass either way):**

- **The date parser still works** — the Phase 1 tests stay green.

### Tasks

- [ ] **Task 2.1: Tests for the record mapping**

  **Files:** Create `tests/catalogue.test.ts`
  **Acceptance criteria:** Covers the six new scenarios above. Every test fails before Task 2.2.
  **Constraints:** Use small sample records written in the test. Do not call the network.

- [ ] **Task 2.2: Implement the record mapping (make tests pass)**

  **Files:** Create `src/catalogue.ts`
  **Acceptance criteria:** All six scenarios pass.
  **Constraints:** Pure functions. The mapping takes a record and returns a design or nothing. The relevance check is a separate pure function. Follow the design document's data model.

- [ ] **Task 2.3: Implement the ingest script**

  **Files:** Create `scripts/ingest.ts`; Modify `package.json`
  **Acceptance criteria:** `npm run ingest` fetches from the V&A search endpoint and writes `public/data/designs.json` with a `source` line, a `fetchedAt` date, the credit line, and the designs.
  **Constraints:**
  - Queries: `wallpaper`, `textile`, `printed fabric`, `wall covering`.
  - Page size 100, at most 6 pages per query.
  - **One request per second.** Wait after each request.
  - Deduplicate by system number.
  - Use the search endpoint only. Do not make one call per object.
  - The script must survive a failed request by reporting the failure and stopping, not by writing a partial file silently.

- [ ] **Task 2.4: Run the ingest and check the output**

  **Files:** `public/data/designs.json`
  **Acceptance criteria:** The file holds more than 1,000 designs. Every design has an image address. `fetchedAt` and the credit line are present. Rerunning the script produces the same shape.

**→ Phase 2 complete. Safe to commit.**

---

## Phase 3 — Search and filter in the grid

**Commit scope:** The page loads the catalogue and shows a card grid. The reader can search by title or maker, filter by period and type, and see the count update.

**Verification:** `npm test` → all pass. `npm run dev` → the grid renders and the filters change it.

### Scenarios

**New behaviour (must fail first):**

- **A search matches the title or the maker** — Given a catalogue with "Willow Bough" by William Morris, when the reader types "morris", then that design appears.
- **A period shows only its years** — Given the period 1850 to 1899, then every card is dated in that range.
- **A design with no year is hidden by a period** — Given a design with no year, when a period is active, then that design does not appear.
- **The type filter works** — Given the type Wallpaper, then every card is a wallpaper.
- **No match is honest** — Given a search that matches nothing, then the count reads "0 of N designs" and the grid is empty.
- **Empty filters show everything** — Given no search, no period and the type All, then every design appears.

**Regression guards (pass either way):**

- **The date parser and catalogue tests stay green.**

### Tasks

- [ ] **Task 3.1: Tests for the filter**

  **Files:** Create `tests/designs.test.ts`
  **Acceptance criteria:** Covers all six new scenarios. Every test fails before Task 3.2.
  **Constraints:** Use multiple normal records, one record with no year, and one empty result case.

- [ ] **Task 3.2: Implement the filter (make tests pass)**

  **Files:** Create `src/designs.ts`
  **Acceptance criteria:** All six scenarios pass.
  **Constraints:** Pure function. The design type follows the design document.

- [ ] **Task 3.3: Tests for the page wiring**

  **Files:** Create `tests/app.test.ts`
  **Acceptance criteria:** With a mocked catalogue response, the page renders cards; typing "morris" reduces the grid to matching cards; a period with no matches shows "0 of N designs".
  **Constraints:** Start the file with `// @vitest-environment jsdom`. Mock `fetch`. Do not call the network.

- [ ] **Task 3.4: Implement the grid and the controls (make tests pass)**

  **Files:** Modify `src/main.ts`, `index.html`, `src/styles.css`
  **Acceptance criteria:** The page loads the catalogue, renders a card per design, and updates on search, period and type changes.
  **Constraints:** Build DOM nodes and set `textContent`. The period options are 50-year bands built from the catalogue. Type options are All, Wallpaper, Textile and Fabric. The count reads "N of M designs".

**→ Phase 3 complete. Safe to commit.**

---

## Phase 4 — The detail view and the credit

**Commit scope:** Clicking a card opens a detail view with the large image and the record facts. The footer shows the credit line and the date the catalogue was fetched.

**Verification:** `npm test` → all pass. A manual check in the browser.

### Scenarios

**New behaviour (must fail first):**

- **A card opens the detail view** — Given a card, when it is clicked, then the detail view shows the large image, the title, the maker, the date, the place, the type and a link to the museum record.
- **A missing maker is honest** — Given a design with no maker, then the detail view says "Unknown".
- **Closing returns to the grid** — Given the detail view is open, when it is closed, then the grid is unchanged.
- **The credit is visible** — Given the page is open, then the footer shows `© Victoria and Albert Museum, London` and the fetch date.

**Regression guards (pass either way):**

- **The earlier page tests stay green.**

### Tasks

- [ ] **Task 4.1: Tests for the detail view and the footer**

  **Files:** Modify `tests/app.test.ts`
  **Acceptance criteria:** Covers the four new scenarios. Every test fails before Task 4.2.
  **Constraints:** Mock the catalogue. Do not call the network.

- [ ] **Task 4.2: Implement the detail view and the footer (make tests pass)**

  **Files:** Modify `index.html`, `src/main.ts`, `src/styles.css`
  **Acceptance criteria:** All four scenarios pass.
  **Constraints:** Use the native dialog element. The close control is reachable by keyboard. Text from the API is set with `textContent`.

**→ Phase 4 complete. Safe to commit.**

---

## Phase 5 — Book mode

**Commit scope:** The reader can name a book. The page finds its first publication year and filters the grid to the fifteen years either side. Every failure has a message.

**Verification:** `npm test` → all pass. A manual check with "The Hobbit".

### Scenarios

**New behaviour (must fail first):**

- **A known book finds its era** — Given the reader enters "The Hobbit", when the lookup succeeds, then the page says 1937 and shows designs from 1922 to 1952.
- **An unknown book is honest** — Given a title the lookup cannot find, then the page says it could not find the book and the grid does not change.
- **An empty title is refused** — Given an empty title, when the reader asks, then the page says "Type a book title first." and makes no request.
- **Reset clears everything** — Given a book, a period and a search are active, when the reader resets, then all three are cleared and every design appears.

**Regression guards (pass either way):**

- **The earlier page tests stay green.**

### Tasks

- [ ] **Task 5.1: Tests for the book logic**

  **Files:** Create `tests/book.test.ts`
  **Acceptance criteria:** Covers the year range and the failure result. Every test fails before Task 5.2.
  **Constraints:** The fetch is mocked. Do not call the network.

- [ ] **Task 5.2: Implement the book lookup and the year range (make tests pass)**

  **Files:** Create `src/book.ts`
  **Acceptance criteria:** All four scenarios pass.
  **Constraints:** Call `https://openlibrary.org/search.json` with `fields=title,first_publish_year` and `limit=1`. Return nothing on a failed request. The range is the year minus fifteen to the year plus fifteen.

- [ ] **Task 5.3: Tests for the book controls**

  **Files:** Modify `tests/app.test.ts`
  **Acceptance criteria:** Covers the four scenarios through the page. Every test fails before Task 5.4.
  **Constraints:** Mock both fetches: the catalogue and the book lookup.

- [ ] **Task 5.4: Implement the book controls (make tests pass)**

  **Files:** Modify `index.html`, `src/main.ts`, `src/styles.css`
  **Acceptance criteria:** All four scenarios pass.
  **Constraints:** The status line says "Looking up the book…" while waiting. Buttons are disabled while a lookup runs.

**→ Phase 5 complete. Safe to commit.**

---

## Phase 6 — Build, runbook and live

**Commit scope:** The built site works from `dist/`. The README holds the runbook. The deploy steps are written and ready for the author to run.

**Verification:** `npm run build` → succeeds. `npm run preview` → the site works. The orchestrator opens the built site and checks the real flow.

### Scenarios

Scenarios: none — no new behaviour. Regression guard: the full test suite stays green, and the built site serves every asset from a sub-path.

### Tasks

- [ ] **Task 6.1: Write the runbook**

  **Files:** Modify `README.md`
  **Acceptance criteria:** The README names the install, ingest, test, build and preview commands. It has a "start again from nothing" section with ordered steps. It records the V&A credit and the four-week cache rule.
  **Constraints:** Exact commands in PowerShell.

- [ ] **Task 6.2: Build and check `dist/`**

  **Files:** None
  **Acceptance criteria:** `npm run build` succeeds. `dist/` holds `index.html`, the built assets and `data/designs.json`. Every asset path is relative, so the site works below a sub-path.

- [ ] **Task 6.3: Write the deploy steps**

  **Files:** Create `docs/deploy.md`
  **Acceptance criteria:** The file gives the exact PowerShell commands the author runs to publish to GitHub Pages, and the settings to choose in the repository. It names the expected address.
  **Constraints:** The author runs the git and GitHub commands. Do not run them.

- [ ] **Task 6.4: Orchestrator check of the built site**

  **Run by: orchestrator**
  **Files:** None
  **Acceptance criteria:** The built site opens. A search for "morris" shows cards. A card opens its detail view. "The Hobbit" narrows the grid and shows the 1937 message. The footer shows the credit.
  **Constraints:** Use `playwright-cli`. Do not change code in this task; report any failure.

**→ Phase 6 complete. Safe to commit.**

---

## After the plan

The build runs with `diamond:subagent-driven-development`, one implementer per phase, all in the foreground. The author commits after each phase.

The evidence pack for the interview:

- `docs/designs/2026-11-05-pattern-finder.md` — the design and the rejected alternatives.
- `docs/plans/2026-11-05-pattern-finder.md` — this plan.
- The implementer reports and the diff checks, kept in `docs/process.md`.
- `docs/review.md` — a different model's review.
- `docs/security.md` — the dependency, secret and input checks.
- `README.md` and `docs/deploy.md` — the rebuild and the live route.
- `docs/talk.md` — the 20-minute script.
