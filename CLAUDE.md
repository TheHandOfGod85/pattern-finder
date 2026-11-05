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
