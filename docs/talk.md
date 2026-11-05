# The 20-minute talk

Interview: Sanderson Design Group, Software Engineer, second stage — 2026-11-06, 15:00.

The brief (page 2): *"We want to see how you build, not only what you have built."*
Page 7 lists the five things the panel assesses: how I engineered it, how I worked with the agent, how I
checked quality, how I got it live, and what I would change. Page 8 gives 20 minutes, then 25 minutes of
questions. Page 3 allows a local run, a container or a free cloud tier.

**The reframe:** the app is the carrier. The method is the product. Target: 4 minutes of app, 16 minutes of
method.

## Before you start

- Open the live site once and confirm it loads: `https://thehandofgod85.github.io/pattern-finder/`.
- Check the footer date. It must be today or within four weeks. If it is older, run `npm run ingest`,
  `npm run build` and the deploy steps in [`docs/deploy.md`](deploy.md).
- Keep these tabs open: the live site; the design; the plan; this file; the process record; the review; the
  security note.
- Walk the exact demo below once, so the clicks are muscle memory.
- If the live site fails, the fallback is `npm run preview` and `http://localhost:4173/`. Say so calmly; it
  is the runbook working.

## 0:00–1:00 — The reframe

> "The brief says you want to see how I build, not only what I built. So the app is deliberately small.
> What I want to show you is the method around it, and I can point at a file or a screen for every claim."

Then the five artefacts in one breath: the design, the plan and the phase commits, the tests, the review,
the live address and the runbook.

## 1:00–5:00 — The app

Open the live URL. Talk while clicking; do not read the screen.

1. **Search "morris".** The count reads `23 of 1,854 designs`. Say: one JSON file holds the whole catalogue;
   there is no server and no database; the browser filters it in a fraction of a millisecond.
2. **Choose a period and a type.** The grid narrows. Point out the count still says how many of the whole
   catalogue are showing.
3. **Open a card.** The detail view shows the large image, maker, date, place, type and a link to the
   museum's own record. Close it with the button, and mention Escape also works.
4. **Reset**, then type **"The Hobbit"** and press **Find its era**. The status says *"The Hobbit was first
   published in 1937. Showing designs from 1922 to 1952."* and the count drops to `311 of 1,854 designs`.
   Say: this is the only live call the reader can trigger — Open Library, keyless — and if it fails the grid
   does not change and the page says so.
5. **Point at the footer.** `© Victoria and Albert Museum, London` and the catalogue fetch date. Say the
   four V&A terms in one sentence: credit, images from their address, cache no older than four weeks, one
   request per second at ingest.

Do not demo every filter. Four minutes is enough for one clean run.

## 5:00–8:30 — How I engineered it

Show the design document.

- **The design came first.** It has the reframe, a decisions table with the rejected alternatives, the
  research findings, the data model and the riskiest assumptions. Point at two rejects: the Met API returned
  HTTP 410; a C#/Blazor build would have spent the evening on the build, not the method.
- **The data pipeline is the engineering.** Ingest the museum's search results at one request per second,
  clean and deduplicate them, and write one cached JSON file with its fetch date. The browser never touches
  the museum.
- **The pure modules.** Date parsing, record mapping, the filter and the book range are pure functions with
  tests. The page layer only reads and writes. That is why the demo cannot fail because the museum is slow.
- **The V&A terms are design rules, not notes.** The credit, the image addresses, the four-week cache and
  the one-request-per-second ingest are in the plan as work.

## 8:30–12:30 — Working with the agent

Show the plan and the process record.

- **The plan split the build into six vertical phases.** Every phase has scenarios written as
  given/when/then, its own files and its own verification command.
- **One fresh implementer per phase, in the foreground.** The brief carried the full phase text, the
  approved scenarios, the real API facts and the rules. The agent did not have to rediscover the
  requirements.
- **The model policy, stated per phase.** Reconnaissance on `haiku`; ordinary phases on `sonnet`; the two
  phases with real cross-file and async work — the grid and book mode — on `opus`, with a named reason; the
  review on `opus`. Never `haiku` for implementation.
- **The checks before every commit.** I read the report, the diff and the untracked files; compared every
  changed path with the phase's file list; and checked every scenario against its test. That is where an
  extra file or a weakened test gets caught, one phase wide.
- **What I kept for myself.** The design decisions, the answers to the agent's questions, every commit, the
  deploy. The agent never committed.

The one-line lesson: a fresh context per phase is what keeps the agent honest and the cost down.

## 12:30–15:00 — Review and quality

Show the tests and [`docs/review.md`](review.md).

- **Scenario-first.** Every behaviour had a failing test before its implementation. There are 95 tests
  across six files; the plan records which test proves which scenario.
- **A different model reviewed the whole Story before the last commit.** It found three Important issues:
  a blank page when the catalogue fails (the designed error message was never rendered); two pure functions
  tested nowhere, including the book/period intersection; and cards that opened only by mouse.
- **One fix round.** All three fixed with tests that failed first, then a re-review: *Ready to merge.*
- **Four Minor findings I accepted** — the status message now reports the effective range, the shared guard,
  the stricter test config, the page heading. **Two I declined**, with reasons.
- **Security.** No runtime dependencies; `npm audit` 0 vulnerabilities; no keys; no `innerHTML`; the
  catalogue validated at runtime; the book title encoded. The checks are in
  [`docs/security.md`](security.md).

Say the honest line: *"It is a different model, same vendor. I don't call it an independent review."*

## 15:00–17:30 — Getting it live

Show the README and [`docs/deploy.md`](deploy.md).

- **The route:** ingest → JSON → Vite build → GitHub Pages. No server code.
- **The rebuild:** the README's "start again from nothing" section: clone, install, ingest, test, build,
  preview. That is the half of "getting it live" most people forget: can you stand it up again?
- **The sub-path:** the build uses relative asset paths and the page fetches the catalogue relatively, so it
  works under `/pattern-finder/`.
- **The deploy:** one push and a `gh-pages` publish; the settings are written down.

## 17:30–20:00 — What I would change

Be specific and unembarrassed. This is the fifth thing the panel assesses.

- **The first attempt was deleted.** I built something in one silent pass. It showed none of the method the
  brief is asking for. Restarting from the design was the right call, and it cost time.
- **The first build session failed before the first task** because the agent ran git in a folder that was not
  a repository. The plan now records the start-inside-the-repo requirement.
- **The plan asks for all of a phase's tests before its implementation**, while the TDD skill prefers one at
  a time. I followed the approved plan and reported the tension honestly.
- **The catalogue-load failure was caught at review, not at design.** It was in the design's error table but
  in no phase. Next time the error table becomes its own checklist item.
- **One edge is deferred:** a failed lookup after a successful one leaves the previous era filter applied.
  It needs a behaviour decision, not a patch.
- **Next, with more time:** colour search (parked because it needs every image processed), a nightly ingest,
  and a small server for the book cache. The current shape is a POC, and I would keep it that way until
  those three are real needs.

Close:

> "The app is small on purpose. What I wanted you to see is the method around it: a design with the rejects,
> a plan with scenarios, one agent per phase, checks before every commit, a different model's review, and a
> live route I can rebuild from nothing."

## The artefacts map

| Claim | Show them |
|---|---|
| I designed it | `docs/designs/2026-11-05-pattern-finder.md` |
| I delegated it | `docs/plans/2026-11-05-pattern-finder.md`, `docs/process.md`, the six phase commits |
| I tested it | `tests/`, and the plan's `→ test:` lines |
| I reviewed it | `docs/review.md` |
| I checked security | `docs/security.md` |
| I shipped it | the live URL, `README.md`, `docs/deploy.md` |
| What I would change | the section above |

## The questions they may ask

| Question | Short answer |
|---|---|
| Why TypeScript and not C#? | The brief allows any stack. A static site removes the server and the deploy risk and leaves the evening for tests, review and this talk. The C# depth is a separate conversation. |
| Why no framework? | The interface is small, and a framework would hide the DOM work you may ask about. There are no runtime dependencies. |
| Why no database? | The catalogue is one cached JSON file. 1,854 records filter in well under a millisecond. A database would add a server and a failure mode for no gain. |
| How did you control cost and context? | Fresh subagent per phase, small briefs, `haiku` for recon, `sonnet` for most, `opus` only where named. The main session held the plan and the checks, not the file dumps. |
| How do you know the agent did what you asked? | The report, diff, scope and scenario checks before every commit; the tests; and a different model's review. |
| What did the review find? | Three Important issues: the catalogue-failure blank page, untested pure logic and the book/period intersection, and mouse-only cards. All fixed with tests. |
| What about the V&A licence? | Four rules: credit, images from their address, cache no older than four weeks, one request per second. They are built, not just documented. |
| What if the V&A API changes? | The cache covers four weeks, and the design names the Art Institute of Chicago as the fallback. |
| Why Open Library? | It is keyless and it links the archive to reading — which is the "something you find useful" the brief asks for. |
| How did you test the live flow? | The orchestrator opened the built site in a real browser under a sub-path and walked search, detail by keyboard, the book era and the footer. |
| What was hardest? | The supervision, not the code: keeping the agent's scope tight and the checks honest. |
