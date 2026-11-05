# Pattern Finder

A static site for searching the Victoria and Albert Museum's wallpapers and furnishing fabrics, and for seeing designs from the era of the book you are reading. It is built with TypeScript and Vite and served as plain files.

Data source: the Victoria and Albert Museum public API. The site reads a catalogue that is fetched once at build time into `public/data/designs.json`; it never queries the museum from the browser.

## Commands

Run these from the repository root in PowerShell.

| Command | What it does |
| --- | --- |
| `npm install` | Install the development dependencies. |
| `npm run dev` | Serve the site with live reload while you work. |
| `npm test` | Run the Vitest suite. |
| `npm run build` | Type-check and build the site into `dist/`. |
| `npm run preview` | Serve the built `dist/` site locally. |
| `npm run ingest` | Fetch the V&A catalogue and rewrite `public/data/designs.json`. |

## Start again from nothing

On a machine with Node.js, npm and git installed, from PowerShell:

1. Get the code:

   ```powershell
   git clone https://github.com/TheHandOfGod85/pattern-finder.git
   Set-Location pattern-finder
   ```

2. Install the dependencies:

   ```powershell
   npm install
   ```

3. Fetch a fresh catalogue:

   ```powershell
   npm run ingest
   ```

   This writes `public/data/designs.json`. It makes at most 24 requests, one per second, so it usually takes about half a minute.

4. Run the tests:

   ```powershell
   npm test
   ```

5. Build the site:

   ```powershell
   npm run build
   ```

6. Check the built site:

   ```powershell
   npm run preview
   ```

Use `npm run dev` in place of steps 5 and 6 while you are changing the site: it serves the source directly and reloads on change.

## Data rules

- Every page shows `© Victoria and Albert Museum, London`.
- The catalogue records its fetch date in `fetchedAt`. It must not be older than four weeks; re-run `npm run ingest` to refresh it.
- The ingest makes no more than one request per second.
- Design images load from the V&A's own addresses and are never copied.
- The browser never calls the V&A. It reads the cached catalogue. The only live call is the Open Library book lookup the reader asks for.

## Deploy

See [docs/deploy.md](docs/deploy.md).
