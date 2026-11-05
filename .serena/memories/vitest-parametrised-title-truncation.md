# Vitest parameterised title truncation

Vitest 5 truncates a long `it.each` interpolated title to about 60 characters plus `…`, and the registered (truncated) title is what `-t` matches. A filter built from the untruncated description selects zero tests, and `vitest run` exits 0 with every case skipped — a false pass if only the exit code is read.

For a long parameterised case, filter on a prefix short enough to survive truncation, and confirm the run reports the expected number of passing tests rather than "all skipped".
