# Security and data checks

This file records the dependency, secret and input checks for Pattern Finder. Every result below was run
against the repository; the commands to repeat them are at the end.

## Dependencies

- **No runtime dependencies.** The app ships plain HTML, CSS and JavaScript. `package.json` has no
  `dependencies` block at all.
- Six development dependencies, all pinned in `package-lock.json`:
  `typescript`, `vite`, `vitest`, `tsx`, `@types/node` and `jsdom`.
- `npm audit` → **0 vulnerabilities**.

The absence of runtime dependencies is also a security decision: nothing third-party runs in the visitor's
browser except the browser itself.

## Secrets

- There are no API keys. The V&A search API and Open Library's search API are both keyless and public.
- `.env` files: none.
- A scan of the tracked files for common secret shapes (provider tokens, private-key headers, `api_key`,
  `password`, `secret`) found **no live secret**. The only textual match is this file's own line in the plan
  that lists the evidence pack.
- The deploy is a static site; GitHub Pages needs no build-time secret either.

## Input handling

- **The catalogue is validated at runtime.** `isCatalogue` and `isDesign` reject a payload whose fields are
  absent or the wrong type before any design reaches the renderer. This is a boundary check, not a substitute
  for correctness in the ingest.
- **No HTML injection.** Design text, the book status and the footer are written with `textContent`; the
  only `innerHTML` in the repository is the test harness resetting the page to `<div id="app"></div>`.
- **No code execution.** No `eval`, no `new Function`, no dynamic script or style injection.
- **The book title is encoded, not interpolated.** The reader's title goes through `URLSearchParams`, so it
  cannot add query parameters or break the request.
- **Links and image URLs come from fixed https prefixes.** The record link is
  `https://collections.vam.ac.uk/item/<systemNumber>/`; the image addresses are built from the image id
  against `https://framemark.vam.ac.uk/`. The catalogue generator produces them; the page does not build
  arbitrary URLs from free text.
- **No client storage.** The app uses no cookies, `localStorage` or `sessionStorage`, so there is no stored
  data to protect or expire.

## Network calls

| Call | When | Where |
|---|---|---|
| V&A search API | At ingest time only, on the author's machine | `scripts/ingest.ts` |
| The cached catalogue (`data/designs.json`) | When the page loads | `src/main.ts` |
| Open Library search | Only when the reader asks for a book | `src/book.ts` |

The browser never calls the V&A. The museum's terms require that images load from its own addresses; the
page does that, and no image is copied into the repository (0 tracked image files).

## The V&A terms, as built

1. Every page shows `© Victoria and Albert Museum, London` — including the catalogue-failure page.
2. Images load from `framemark.vam.ac.uk`; none is stored.
3. The catalogue records `fetchedAt`, and the footer shows the date. The README states the four-week rule
   and how to refresh it.
4. The ingest makes at most one request per second and waits after every request.

## Deployment

- GitHub Pages serves static files. No server code, no database, no account system.
- The repository is public, as GitHub Pages requires on the free plan. Nothing secret is in it.
- `dist/` is build output and is gitignored; only the `gh-pages` branch carries the built files.

## What is not covered

- **No Content-Security-Policy and no Subresource Integrity.** The page loads images from the V&A's image
  server and queries Open Library; those third parties are trusted for this exercise.
- **No penetration test.** The attack surface is a static page and two keyless public APIs.
- **The catalogue generator is trusted.** A compromised build machine or a hostile upstream response is out
  of scope; the runtime validation limits the damage to rendering, not code execution.
- **No rate-limit handling beyond the ingest's one-second wait and the book lookup's disabled-button state.**

## How to repeat the checks

```powershell
npm audit
npm ls --depth=0
git grep -n 'innerHTML' -- src tests
git grep -n -E 'eval\(|new Function' -- src scripts
git grep -n 'fetch(' -- src scripts
git ls-files | Select-String -Pattern '\.(png|jpe?g|gif|webp|svg|avif)$'
```
