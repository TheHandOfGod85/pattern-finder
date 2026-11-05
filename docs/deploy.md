# Deploy to GitHub Pages

Expected address: <https://thehandofgod85.github.io/pattern-finder/>

The site is published by **GitHub Actions**. The workflow at `.github/workflows/deploy.yml` installs, tests,
builds and deploys `dist/` on every push to `main`. Nothing is published from your machine; GitHub builds it.

## Before the first deploy

- The repository `TheHandOfGod85/pattern-finder` must **exist on GitHub** and be public. GitHub Pages on a
  private repository needs a paid plan. Check it, and create it empty if it is missing:

  ```powershell
  gh repo view TheHandOfGod85/pattern-finder
  gh repo create TheHandOfGod85/pattern-finder --public --description "Pattern Finder: a searchable catalogue of V&A wallpapers and textiles"
  ```

  Do not add a README, a `.gitignore` or a licence. An empty repository is what the first push expects.

- Check whether `origin` already exists:

  ```powershell
  git remote -v
  ```

  If it prints a remote, skip the `git remote add` line below.

- In the repository: **Settings** → **Pages** → **Build and deployment** → **Source** → choose
  **GitHub Actions**. The page may suggest workflows; this repository carries its own, so no template is
  needed.

## First deploy

```powershell
# Only when origin is not set yet:
git remote add origin https://github.com/TheHandOfGod85/pattern-finder.git

git push -u origin main
```

The push triggers the workflow. Open the repository's **Actions** tab and wait for **Deploy to GitHub Pages**
to finish; the deploy job prints the live address. The first deployment can take a minute.

## Later deploys

Push to `main`. The workflow runs by itself. To run it by hand: **Actions** → **Deploy to GitHub Pages** →
**Run workflow**.

## If it fails

- The build job runs `npm ci`, `npm test` and `npm run build`; its log names the failing step.
- The deploy job needs the Pages source set to GitHub Actions, as above.
- The live address is <https://thehandofgod85.github.io/pattern-finder/>.

## Why it works below a sub-path

`vite.config.ts` sets `base: "./"`, so the built `index.html` refers to `./assets/...` rather than
`/assets/...`. The page fetches `data/designs.json` relative to itself. Both therefore resolve correctly
whether the site is served from a domain root or from `/pattern-finder/`.

`dist/` is gitignored and is never committed; the workflow uploads it as the Pages artifact.
