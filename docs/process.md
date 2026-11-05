# How the build was run

This is the process record for the Pattern Finder exercise. The design is in
[`docs/designs/2026-11-05-pattern-finder.md`](designs/2026-11-05-pattern-finder.md); the build plan is in
[`docs/plans/2026-11-05-pattern-finder.md`](plans/2026-11-05-pattern-finder.md). This file records how the
plan was executed, what each phase produced, and where the process changed course.

## The shape of the work

1. **Design first.** The design document was written and approved before any application code. It carries
   the reframe, the decisions and their rejected alternatives, the research findings, the data model, the
   examples and the riskiest assumptions.
2. **A plan of small phases.** The plan split the build into six vertical phases. Each phase has its own
   scenarios (a behaviour written as given/when/then), its own files and its own verification command.
3. **One fresh implementer per phase.** Every phase went to a `diamond:implementer` subagent in the
   foreground. The brief carried the full phase text, the approved scenarios, the real API facts and the
   project rules, so the agent never had to rediscover the requirements.
4. **Checks before every commit.** Before each phase closed, the main session checked the implementer's
   report, read the diff and the untracked files, compared every changed path with the phase's file list,
   and checked every scenario against its test. A phase did not close until those checks passed.
5. **One review at the end.** The whole Story went to a `diamond:code-reviewer` subagent, a different
   model with a fresh context, before the last phase was committed.
6. **The author committed.** Every commit is the author's. The agent never committed, staged or pushed.

The build ran in a fresh session opened in `C:\repos\pattern-finder` so that the implementer agents, which
run git commands when they start, would find a real repository.

## The model policy

The work used the plugin's model rubric, and the choice was stated for every phase before it was dispatched.

| Job | Model | Why |
|---|---|---|
| Reconnaissance and exploration | `haiku` | Cheapest, read-only search |
| A bounded implementation phase | `sonnet` | One or two files, a narrow change, an exemplar to follow |
| A large or subtle implementation phase | `opus`, with a named reason | Several files, a DOM integration test, async UI state |
| The code review | `opus` | The reviewer's own configuration; a different model from the implementers |

`haiku` was never used for implementation.

## The phases

| Phase | What it delivered | Tests after the phase | Commit |
|---|---|---|---|
| 1. The project builds, and a date becomes a year | Vite/TypeScript/Vitest scaffold, `CLAUDE.md`, the date parser and its seven scenarios | 7 | `5efdbc8` |
| 2. The catalogue is real | Tested V&A record mapping and dedupe, the ingest at one request per second, `public/data/designs.json` with 1,854 designs | 24 | `3be9d54` |
| 3. Search and filter in the grid | Pure search/period/type filter, the card grid and controls, the jsdom page test | 44 | `d1850aa` |
| 4. The detail view and the credit | Native `<dialog>` detail view, keyboard-reachable close control, footer credit and fetch date | 48 | `83c237d` |
| 5. Book mode | Open Library lookup, 15-year era range, status messages, disabled state, reset | 69 | `9176b68` |
| 6. Build, runbook and live | README runbook, deploy steps, built-site check, the Story code review | 85 | `e5d9033` |
| Follow-ups | The four author-approved review findings | 95 | `2395e1b` |

Each phase commit is the author's, with the author's own message.

### What the checks caught

- **Phase 2:** the real record shape was captured live before the mapping was written, so the tests used
  real field names (`_primaryTitle`, `_primaryMaker`, `_primaryImageId`) rather than invented ones.
- **Phase 3:** the real catalogue keeps the museum's raw object types (`Wallpaper sample`,
  `Textile design`, `Furnishing fabric`), so the type filter matches by containment. Exact matching would
  have hidden most of the catalogue.
- **Phase 4:** jsdom 31 implements `<dialog>` but not `showModal()` or `close()`. The page test carries a
  guarded polyfill; production uses the native dialog.
- **Phase 5:** a real Open Library lookup confirmed "The Hobbit" → 1937, and the live check later returned
  311 designs in the 1922–1952 window.
- **Phase 6:** the orchestrator opened the built site in a browser under a sub-path and walked the real
  flow: search, detail view by keyboard, book era, footer.

## The review and the fix round

The Story code review ran after Phase 6 and before its commit. It found three Important issues:

1. The catalogue-load failure was uncaught, so a missing or malformed catalogue produced a blank page and
   no credit line.
2. Two pieces of pure logic (`intersectYearRanges`, `buildPeriodStarts`) lived in the page layer, and the
   book/period intersection had no test.
3. Design cards opened only by mouse; keyboard users could not open a design.

All three were fixed in one round, with tests that failed first and a re-review that confirmed the fixes.
The six Minor findings were left to the author: four were accepted and fixed in the follow-up commit, two
were declined, and one edge was recorded and not fixed. The review is in [`docs/review.md`](review.md).

## What went wrong, and what changed

- **The first attempt was deleted.** Before the design work, an early implementation was written in one
  silent pass. It skipped the workflow the exercise exists to show. It was removed and the work restarted
  from the design.
- **The first build session failed before the first task.** The implementer agent ran `git status` in a
  folder that was not a repository. The plan now records that the build must start inside the repository,
  and the build ran in a fresh session there.
- **The plan's test-first split is bulk, the TDD skill's is incremental.** The plan requires all of a
  phase's tests before its implementation; the TDD skill prefers one test at a time. The phase text won,
  because it is the approved contract. The implementers reported the tension instead of hiding it.
- **A review finding became a design contract.** The catalogue-load failure was in the design's error
  table but in no plan phase. The review caught the gap; the fix added the designed message and kept the
  V&A credit visible in the failure state.
- **The rate limit is real work.** The V&A permits one request per second. The ingest makes 24 requests and
  waits after every one, so a full refresh takes about half a minute.

## Honest limits

- Pattern Finder is a proof of concept, not production software. It has no server, no accounts, no
  database and no browser-level security headers.
- The catalogue is a sample of the museum's index, not the whole archive.
- Colour search was deliberately parked; it would need every image downloaded and processed.
- The review was a different model, same vendor. It is not an independent vendor review.

## Where the raw evidence lives

- The commits in `git log` are the phase boundaries.
- The tests in `tests/` carry the scenario names the plan records.
- The code review is in [`docs/review.md`](review.md), the checks in
  [`docs/security.md`](security.md), the runbook in [`README.md`](../README.md) and the deploy steps in
  [`docs/deploy.md`](deploy.md).
- Claude Code keeps the full session logs under the user's `~/.claude/projects` directory.
