# Yawab

A cross-platform desktop app that pairs with your WhatsApp account over a QR
code and sends a personalised message to a list of contacts loaded from a CSV
file. Built with **Electron + React + TypeScript** and
[Baileys](https://github.com/WhiskeySockets/Baileys).

> ⚠️ **Use responsibly.** Sending unsolicited bulk messages can violate
> WhatsApp's Terms of Service and may get your number banned. Only message
> people who have opted in, keep volumes modest, and respect the randomized
> sending delays. You are responsible for how you use this tool.

## Features

- 📱 **Pair over QR** — link the app to your WhatsApp like WhatsApp Web; the
  session is stored locally so you only scan once.
- 📄 **CSV import** — auto-detects the phone and name columns, normalizes phone
  numbers to E.164, de-duplicates, and reports skipped rows.
- ✍️ **Templated messages** — personalise with `{{name}}`, `{{phone}}`, or any
  other CSV column via `{{column}}` tokens, with a live preview.
- 🐢 **Safe pacing** — randomized delay between messages to reduce ban risk,
  with live progress and a cancel button.
- 🖥️ **Cross-platform** — packaged installers for macOS (`.dmg`) and Windows
  (`.exe`/NSIS) via GitHub Actions.
- 🌐 **Localized** — English, Hebrew, Russian, Arabic, and Spanish, with full
  RTL support. Picks the OS language on first run; switchable in the header.
- ♿ **Accessible** — semantic markup, labelled controls, keyboard focus styles,
  and a native progress element.
- 🧹 **Biome** (strict ruleset) for linting/formatting, **Vitest** for tests.

## How it works

```
┌──────────┐    QR pair    ┌────────────────┐   send    ┌──────────┐
│  React   │ ◀───────────▶ │  Baileys (main │ ────────▶ │ WhatsApp │
│ renderer │   IPC bridge  │    process)    │           │  servers │
└──────────┘               └────────────────┘           └──────────┘
```

All WhatsApp logic runs in the Electron **main** process (`src/main`). The
**renderer** (`src/renderer`) talks to it through a typed, context-isolated
preload bridge (`src/preload`). Pure, framework-free business logic lives in
`src/shared` and is fully unit-tested.

## Getting started

```bash
npm install      # installs deps and rebuilds native modules
npm run dev      # launch the app in development with hot reload
```

Then:

1. Click **Connect** and scan the QR code with WhatsApp →
   *Settings → Linked Devices → Link a Device*.
2. Upload a CSV (see [`examples/contacts.example.csv`](examples/contacts.example.csv)).
3. Compose your message using tokens like `{{name}}`.
4. Review and **Start sending**.

### CSV format

The phone column is auto-detected from common headers (`phone`, `number`,
`mobile`, `whatsapp`, …). A `name` column is optional. Any other columns become
template tokens.

```csv
name,phone,company
Ada Lovelace,+1 415 555 2671,Analytical Engines
Grace Hopper,+1 415 555 9000,US Navy
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run the app with hot reload |
| `npm run build` | Typecheck + build main/preload/renderer |
| `npm test` | Run the Vitest unit suite |
| `npm run test:coverage` | Run tests with coverage thresholds |
| `npm run test:e2e` | Run the Playwright E2E suite (build first) |
| `npm run check` | Biome lint + format check |
| `npm run format` | Biome format (write) |
| `npm run typecheck` | TypeScript checks (node + web) |
| `npm run build:mac` | Build a macOS `.dmg` |
| `npm run build:win` | Build a Windows installer |
| `npm run build:linux` | Build a Linux AppImage + `.deb` |

## Testing

Two layers, both run in CI:

- **Unit (Vitest)** — the pure `src/shared` logic (phone normalization, CSV
  parsing, templating, throttling, locale resolution) at 100% line coverage.
- **End-to-end (Playwright + Electron)** — `e2e/` drives the *built* app through
  the entire wizard (pair → upload → compose → send), plus language switching,
  RTL direction, and preference persistence across restarts. WhatsApp is
  replaced by a deterministic fake (`FakeWhatsAppService`, enabled with the
  `YAWAB_FAKE_WA` env flag) so no real account or network is needed.
- **Visual regression (Playwright screenshots)** — `e2e/visual.spec.ts`
  snapshots every screen, including the Hebrew/Arabic RTL layouts. Baselines
  live in `e2e/visual.spec.ts-snapshots/` and are platform-suffixed (`-linux`);
  CI and local runs use the same Noto fonts so rendering matches. Update
  intentionally with `--update-snapshots`.

```bash
npm run build && npm run test:e2e                       # run everything
npm run build && npx playwright test --update-snapshots  # refresh baselines
```

> Visual baselines are Linux-rendered. Regenerate them on Linux (or in CI) —
> macOS/Windows produce their own platform-suffixed snapshots.

## Releases & auto-update

Releases are automated with
[release-please](https://github.com/googleapis/release-please). It watches
Conventional Commits on `main` and keeps a **release PR** open; merging that PR
bumps the version, tags it, and the publish job in `release-please.yml` builds and
uploads **macOS (`.dmg`), Windows (NSIS), and Linux (AppImage + `.deb`)** artifacts
to the GitHub Release across a macOS/Windows/Linux runner matrix.

Production builds can send privacy-friendly error reports when `YAWAB_SENTRY_DSN`
is configured. Error reporting is enabled by default and can be disabled any time
in **Settings → Updates & data → Error reporting**. Reports are limited to
sanitized crash/error diagnostics; message text, contacts, phone numbers, CSV
data, and WhatsApp session details are never included. Release builds use
`YAWAB_SENTRY_RELEASE` from the release tag.

To enable macOS code signing / notarization, set the `CSC_LINK`,
`CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and
`APPLE_TEAM_ID` repository secrets (see the macOS troubleshooting section below).

On launch, production builds check GitHub Releases for a newer version via
[`electron-updater`](https://www.electron.build/auto-update) and notify the user
(no-op in dev and tests).

### macOS: “Yawab.app is damaged and can’t be opened”

This is **macOS Gatekeeper**, not a corrupt download. Builds that aren’t signed
with an Apple **Developer ID** and **notarized** are quarantined when downloaded,
and on Apple Silicon that surfaces as the “damaged” message.

**The real fix — a signed + notarized build (no warning, no Terminal):** the
release pipeline is already wired for it (`hardenedRuntime` and entitlements are
set), so adding these repository secrets makes every published `.dmg` open with
a normal double-click:

| Secret | What it is |
| --- | --- |
| `CSC_LINK` | base64 of your *Developer ID Application* certificate (`.p12`) |
| `CSC_KEY_PASSWORD` | password for that `.p12` |
| `APPLE_ID` | your Apple ID email |
| `APPLE_APP_SPECIFIC_PASSWORD` | an app-specific password for that Apple ID |
| `APPLE_TEAM_ID` | your Apple Developer Team ID |

This needs an **Apple Developer Program** membership ($99/yr); there is no free
way to remove the warning entirely.

**Until a signed build ships, to open the current build:**

- **Reliable:** `xattr -cr /Applications/Yawab.app` (clears the quarantine flag).
- **GUI** (works for a plain “unidentified developer” prompt, less reliably for
  “damaged”): **System Settings → Privacy & Security → Open Anyway**.

## Internationalization

UI strings live in `src/renderer/src/locales/<lang>.json` (one file per language:
`en`, `he`, `ru`, `ar`, `es`) and are loaded through
[i18next](https://www.i18next.com/) / `react-i18next`. The main process resolves
the language on startup from the persisted preference or the OS locale
(`app.getLocale()`), and the renderer applies the correct text `direction`
(LTR/RTL) to the document. Users can override the language from the selector in
the header; the choice is persisted in `settings.json` under the app's userData
directory.

To add a language: add its metadata to `SUPPORTED_LANGUAGES` in
`src/shared/locales.ts` and drop a matching `<code>.json` into the locales
folder.

## Project layout

```
src/
  main/        Electron main process — lifecycle, IPC, Baileys service,
               fake service (E2E), settings, auto-update
  preload/     Context-isolated bridge exposing window.api
  renderer/    React UI + i18n (connect → contacts → compose → send)
  shared/      Pure logic: phone, csv, template, throttle, locales (unit-tested)
e2e/           Playwright end-to-end specs + CSV fixtures
.github/
  workflows/   CI (lint/typecheck/unit/e2e/build) and Release (mac/win/linux)
website/        Marketing site (Vite + React), deployed to GitHub Pages
```

## Website

The landing page lives in [`website/`](website/) and is deployed to
**https://yawab.app** via GitHub Actions. Its download buttons
resolve the latest GitHub release at runtime, so they always point at the newest
installers with no redeploy. See [`website/README.md`](website/README.md).

## Acknowledgements

Project conventions — electron-vite scaffolding, a context-isolated preload
bridge, Biome, path aliases, and multi-OS GitHub release builds — follow the
patterns popularised by
[`daltonmenezes/electron-app`](https://github.com/daltonmenezes/electron-app).

## License

MIT — see [LICENSE](LICENSE).
