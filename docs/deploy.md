# Deploy to GitHub Pages

Expected address: <https://thehandofgod85.github.io/pattern-finder/>

The site is published from a `gh-pages` branch. The branch holds the contents of `dist/`, and the `gh-pages` package updates it through `npx`. Nothing is added to `package.json`.

Every command below is run by the author in PowerShell, from the repository root.

## Before the first deploy

- The repository `TheHandOfGod85/pattern-finder` must be public. GitHub Pages on a private repository needs a paid plan.
- Check whether `origin` already exists:

  ```powershell
  git remote -v
  ```

  If it prints a remote, skip the `git remote add` line in the next section.

## First deploy

```powershell
git remote add origin https://github.com/TheHandOfGod85/pattern-finder.git
git push -u origin main
npm run build
npx --yes gh-pages -d dist
```

The last command creates the `gh-pages` branch and pushes `dist/` to it.

Then, in the repository on GitHub:

1. Open **Settings**.
2. Open **Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Set **Branch** to **gh-pages** and **Folder** to **/ (root)**.
5. Press **Save**.

Pages publishes the site at <https://thehandofgod85.github.io/pattern-finder/>. The first publish can take a minute.

## Later deploys

After a change to `main`:

```powershell
npm run build
npx --yes gh-pages -d dist
```

This updates the `gh-pages` branch and Pages republishes it.

## Why it works below a sub-path

`vite.config.ts` sets `base: "./"`, so the built `index.html` refers to `./assets/...` rather than `/assets/...`. The page fetches `data/designs.json` relative to itself. Both therefore resolve correctly whether the site is served from a domain root or from `/pattern-finder/`.

`dist/` is gitignored and is never committed to `main`; only the `gh-pages` branch holds the built files.
