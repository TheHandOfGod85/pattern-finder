# Pattern Finder — design

- Date: 2026-11-05
- Status: approved
- Interview: Sanderson Design Group, second stage, 2026-11-06 at 15:00

## 1. The reframe and the problem

The brief says: build something small that you find useful, using Claude Code as your main tool.

The obvious reading is: build a good app, then explain how. That reading loses.

Page 7 of the brief lists the five things the panel assesses:

1. How you engineered it.
2. How you worked with the agent.
3. How you checked quality.
4. How you got it live.
5. What you would change.

The app is not on that list. The app is the vehicle for those five.

**The real problem: make the method visible in 20 minutes.**

Each claim needs an artefact the panel can see:

- "I designed it" — the design document.
- "I delegated it" — the plan and the implementer reports.
- "I tested it" — a test that failed first.
- "I reviewed it" — the review findings.
- "I shipped it" — a live address and a runbook.

Two rules follow.

First, the app must be small enough to finish. An unfinished app undermines every process claim.

Second, the app must be understood on one screen. If the demo takes ten minutes, only ten are left for the part they said matters more.

The design below is deliberately modest. It is small on purpose, not by accident.

## 2. The approach and decisions

A static site over a catalogue fetched once and cached.

The reader searches wallpapers and furnishing fabrics from the Victoria and Albert Museum. They filter by period and type, then open a design. They can also name the book they are reading, and the app shows designs from the fifteen years either side of its first publication.

There is no server. The browser loads one JSON file and does all the filtering itself.

| # | Decision | Why | Rejected |
|---|---|---|---|
| D1 | TypeScript and Vite, no user-interface framework | The interface is small. A framework would hide the DOM work the panel may ask about | React, Vue |
| D2 | The Victoria and Albert Museum API | Keyless, public, and full of the fabric and wallpaper Sanderson works with | Metropolitan Museum (HTTP 410), Cooper Hewitt (HTTP 404) |
| D3 | The search endpoint, not one call per object | One call returns 100 complete records | Per-object fetch, 100 times the calls |
| D4 | Cache at ingest time | The demo cannot fail on a slow upstream | Live calls from the browser |
| D5 | Parse the date, keep the raw text | Filtering needs a number. Display needs the wording | Display only |
| D6 | Book mode uses Open Library | Keyless, and it links the archive to the reader's hobby | A hard-coded book list |
| D7 | Wallpapers and furnishing fabrics only | The grid looks like Sanderson's world, not a store room | All textile records |
| D8 | Colour search is parked | It needs every image downloaded and processed, and is the riskiest part | Colour-first browsing |
| D9 | GitHub Pages plus a runbook | A live address, free, always awake | Local only, Docker |
| D10 | The user commits after each phase | Their rule. The history stays under their control | Agent commits |
| D11 | The four V&A terms are design rules | The API is non-commercial use only, and it imposes conditions | Ignoring them |

### The four V&A rules

1. The page shows `© Victoria and Albert Museum, London`.
2. Images load from the V&A's own address. The app never stores a copy.
3. The cached catalogue records its fetch date and must not be older than four weeks.
4. The ingest makes no more than one request per second.

The commercial rules do not apply. This is a personal, non-commercial exercise. The hostname rule holds too: `thehandofgod85.github.io/pattern-finder` contains none of the reserved words.

### Later / Not now

- Colour extraction and colour search.
- Favourites and saved collections.
- A server, a database, accounts.
- A Docker image.
- A full browser test suite.

## 3. Research findings

Every fact below was checked on 2026-11-05.

| Fact | Result | Source |
|---|---|---|
| V&A search API without a key | HTTP 200 | `https://api.vam.ac.uk/v2/objects/search?q=wallpaper&images_exist=1` |
| Wallpaper records | 15,410 in the index, 7,489 with images | V&A response metadata |
| Fields in a search record | Title, maker, date, place, image id, thumbnail address | A live search response |
| Image server | HTTP 200, `image/jpeg`, thumbnails and large images | `https://framemark.vam.ac.uk/collections/<id>/full/!400,400/0/default.jpg` |
| Art Institute of Chicago | HTTP 200, 133,165 textile records, no key | `https://api.artic.edu/api/v1/artworks/search?q=textile` |
| Metropolitan Museum | HTTP 410 Gone | `https://collectionapi.metmuseum.org/public/collection/v1/search` |
| Cooper Hewitt | HTTP 404 on the endpoint tried | `https://api.collection.cooperhewitt.org/rest/` |
| Open Library year lookup | Returns `first_publish_year`; "The Hobbit" returned 1937 | `https://openlibrary.org/search.json?q=the+hobbit` |
| Sanderson Design Group brands | Sanderson, Harlequin, Scion and Clarke named on their site | `https://www.sandersondesigngroup.com/` |
| Image rights and reuse | Non-commercial personal and educational use permitted. Credit required. Images served from the V&A address. API content cached no longer than four weeks | V&A websites terms and conditions, API section; IIIF manifests |
| Filter speed | 2,000 records filter in 0.264 ms | Node benchmark, 100 runs |
| Book lookup speed | Four of five lookups took 0.56–1.1 s. One took 5.7 s | Five live calls to Open Library |

### Non-findings

1. `vam.ac.uk/info/terms-of-use` returned 404. The working page is `vam.ac.uk/info/va-websites-terms-conditions`.
2. The object record does not state a licence. The licence lives in the IIIF manifest, which names the website terms and the attribution `©Victoria and Albert Museum, London`.

## 4. Architecture and data model

### Pipeline

```
V&A search API
      |
      |  one request per second
      v
scripts/ingest.ts
      |
      v
public/data/designs.json   <- the cache, with its fetch date
      |
      v
src/main.ts  ->  the page
      ^
      |
parse-year.ts, designs.ts   pure, tested
```

1. **Ingest** runs on this machine. It fetches, cleans, removes duplicates and writes one JSON file. It records when it ran.
2. **Build** runs Vite. It type-checks, then copies the source and the JSON into `dist/`.
3. **Serve** is GitHub Pages. It sends files. No server code runs.

### Data model

Each design holds:

- an id, from the museum system number
- the title
- the maker
- the date text as printed by the museum
- the parsed year, or nothing when the text has no year
- the object type
- the place of origin
- the image id
- a thumbnail address
- a large image address
- a link to the museum record

The catalogue file also holds the source line, the fetch date, and the credit line.

### Modules

| Module | Responsibility | Tested |
|---|---|---|
| `src/parse-year.ts` | Turn archive date text into a year | Yes, unit tests |
| `src/designs.ts` | The design type and the filter function | Yes, unit tests |
| `src/main.ts` | Read the catalogue and wire the DOM | Smoke test |
| `scripts/ingest.ts` | Fetch and write the catalogue | By running it |
| `index.html`, `src/styles.css` | Structure and presentation | No |

The rule: logic that can be wrong lives in a pure module and gets tests. The page layer only reads and writes.

A **pure module** = a module whose result depends only on its input. No network, no page, no clock.

### Data impact

The JSON file is new. Nothing reads an older format, so there is no migration. The file carries its fetch date, so the four-week V&A rule can be checked.

## 5. Examples

Each example is one behaviour the panel can try.

### Finding a design

- Given the catalogue is loaded, when the reader types "morris", then every card shows a design whose title or maker contains "morris".
- Given the reader chooses the period 1850 to 1899, then every card is dated inside that period.
- Given the reader chooses Wallpaper, then every card is a wallpaper.

### Missing data

- Given a design has no year, when a period is chosen, then that design does not appear.
- Given a design has no maker, then the card says "Unknown", and the design still appears.

### The book link

- Given the reader enters "The Hobbit", then the page says it was first published in 1937 and shows designs from 1922 to 1952.
- Given the reader enters "zzzzqqq not a book", then the page says it could not find that book, and the grid does not change.

### Opening a design

- Given a card is clicked, then the detail view shows the large image, the title, the maker, the date, the place, the type and a link to the museum record.

### Empty and reset

- Given nothing matches, then the count reads "0 of 1907 designs" and the grid is empty.
- Given filters are active, when the reader resets, then every control is empty and every design appears.

### Credit and freshness

- Given the page is open, then the footer shows `© Victoria and Albert Museum, London` and the date the catalogue was fetched.

## 6. Product checks and testing impact

### Naming

The page uses the reader's words: "Search", "Period", "Type", "Book you are reading", "Find its era", "Reset". No internal term appears on screen.

### Errors

| Error | Category | What the page says |
|---|---|---|
| The catalogue cannot load | System error | "The catalogue could not load. Run the ingest, then try again." |
| The book lookup fails | System error | "I could not find that book. Try the full title." |
| An image fails to load | System error | The card shows a plain block, and the detail view still opens |
| The reader asks for a book with no title | Invalid user input | "Type a book title first." |
| The book lookup is slow | Not an error | The status line says "Looking up the book…" |

A design with no date is not an error. It is missing data, so a period filter cannot place it. The design is hidden while a period is active.

### Discovery

The README gives one command per job. The page footer names the data source and the fetch date.

### North-star step

Not applicable. This is a standalone POC with no product design behind it.

### Testing impact

New test files:

- `tests/parse-year.test.ts` — eight date forms, plus empty and nonsense input.
- `tests/designs.test.ts` — text, maker, type, period, missing year, no matches.

No existing tests need changing. There are none.

One smoke test opens the built page, searches for "morris", and checks that cards appear.

## 7. The first slice and the Later / Not now list

### The first slice is a spike

Before any application code, one short script calls the V&A search endpoint and prints:

- the title, maker, date, image address and record link for ten records
- whether the licence line is present
- whether the thumbnail address returns an image

It takes about ten minutes. It tests the one assumption that could still change the shape: that a record we may show is also a record we can address.

### Then seven vertical slices

| Slice | Result |
|---|---|
| 1 | A date becomes a year, proven by tests |
| 2 | The catalogue exists as one JSON file, with its fetch date |
| 3 | A filter returns the right designs, proven by tests |
| 4 | The grid, the filters and the detail view work |
| 5 | Book mode works, including the failure case |
| 6 | The built site opens from `dist/` |
| 7 | The site is live, and the runbook rebuilds it |

Only slices 1 and 3 are pure logic. They go first because they are cheap to test and expensive to get wrong.

### Why this order

The spike is first because it attacks the risk. The tested modules come next because every later slice depends on them. The deploy is last because it needs a finished build.

## 8. Riskiest assumptions

| Assumption | Class | What proves it wrong | When it is checked |
|---|---|---|---|
| The search endpoint keeps the fields we use | Assumed | A field disappears or changes name | The spike, before any code |
| About 1,900 records are enough for a good demo | Assumed | The grid looks thin or repetitive | Slice 2, after the ingest |
| The page filters 1,900 records quickly | Researched | — | Benchmark: 0.264 ms |
| Book lookup works on the day | Researched | — | Five live calls |
| GitHub Pages serves the site under a sub-path | Assumed | Assets return 404 on the live address | Slice 7 |
| The V&A keeps the API open | Deferred bet | The API is withdrawn | Cannot be tested. The cache covers four weeks |

A **deferred bet** = a risk taken on purpose, with the cost written down.

The shape risk is gone. The image terms were the only assumption that could have changed the design. They are cleared, and their four rules are in it.

The deferred bet: the V&A may change or withdraw the API. Tomorrow's demo survives that, because the catalogue is cached. If the API vanished later, the fallback is the Art Institute of Chicago. That fallback is real, but untested.

What is not on this list: anything that could have been looked up. A long assumption list usually means the research was skipped. This one is short on purpose.
