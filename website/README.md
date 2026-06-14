# Yawab website

The marketing/landing site for [Yawab](https://github.com/omercnet/yawab),
served at **https://yawab.app**.

A standalone Vite + React + TypeScript app, intentionally isolated from the
Electron app's toolchain so its CI is fast and its dependency tree stays tiny.

## Develop

```bash
pnpm install            # run inside website/ (isolated workspace)
pnpm dev                # local dev server
pnpm build              # production build -> dist/
pnpm preview            # serve the built dist/
pnpm test               # vitest
pnpm test:coverage      # vitest + coverage thresholds
pnpm check              # biome lint + format check
```

> All commands run **from this `website/` directory**. It carries its own
> `package.json`, `pnpm-lock.yaml`, and a `pnpm-workspace.yaml` sentinel so
> pnpm treats it as an independent project and never merges it into the parent
> Electron app's workspace.

## Always-latest downloads

Release installers are **version-stamped** (e.g. `Yawab-1.0.3-arm64.dmg`), so
their filenames change every release. The site never hard-codes them. Instead,
`src/lib/downloads.ts` fetches the GitHub Releases API
(`/repos/omercnet/yawab/releases/latest`) **at page load**, matches each
platform/arch asset with version-agnostic patterns, and wires the download
buttons dynamically (`src/lib/detect.ts` picks the visitor's OS/arch for the
primary button). The result is cached in `sessionStorage`.

If the API is unavailable (rate limit, offline), every button gracefully falls
back to `https://github.com/omercnet/yawab/releases/latest`. This means a new
release needs **zero site edits and zero redeploy** — the downloads follow the
latest release automatically.

## Base path

The site is served from the **`yawab.app`** apex domain, so the Vite `base` is
`/` (a committed `public/CNAME` keeps the custom domain set across Actions
deploys). The base stays env-driven for the relative PR-preview build:

```bash
pnpm build                    # production, base / (default)
VITE_BASE_PATH=./ pnpm build  # relative base (PR preview artifact)
```

The download URLs are absolute `github.com` links, so they are unaffected by the
base path — only static assets (CSS/JS/screenshots) care.

## Screenshots

Product screenshots in `public/screenshots/` are generated from the **real
Electron renderer** (with the deterministic fake WhatsApp backend), not mocked.
Regenerate them from the repo root:

```bash
pnpm screenshots:marketing   # builds the app + captures connect/contacts/compose/sending at 2x
```

## Deploy & CI

- **Production** — `.github/workflows/website-deploy.yml` builds the site and
  deploys it to GitHub Pages via the **GitHub Actions** Pages source
  (`actions/deploy-pages`) on every push to `main` that touches `website/`.
  There is no `gh-pages` branch; the site code lives in `main`.
- **Pull requests** — `.github/workflows/website-pr.yml` runs Biome, Vitest, and
  a production build on every PR that touches `website/`, then uploads the built
  site as a downloadable **preview artifact** (built with a relative base so it
  opens straight from disk) and posts a sticky comment linking it.
