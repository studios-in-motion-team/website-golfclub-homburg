# ASTRO Page

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## Prebuild / Prefetch Dokumentation

Kurz: Vor dem eigentlichen `astro build` wird ein `prebuild`-Script ausgeführt, das Inhalte von der Freeda-API holt und lokale Artefakte erzeugt. Diese Artefakte machen Builds reproduzierbar und erlauben es, die dynamischen News-Seiten statisch zu generieren.

Wichtige Dateien

- `scripts/prebuild.js` — Holt News aus Freeda, schreibt `content/freeda-news.json`, `public/sitemap.xml` und `public/robots.txt`.
- `content/freeda-news.json` — Cache der News (wird von den Seiten bevorzugt gelesen, sofern vorhanden).
- `public/sitemap.xml` — Sitemap mit News + statischen Seiten (absolute URLs, wenn `VITE_SITEMAP_DOMAIN` gesetzt ist).
- `public/robots.txt` — Verweist auf die Sitemap.
- `scripts/prebuild-smoke.js` — Smoke-Test, der `prebuild` ausführt und das Vorhandensein der Dateien prüft.

Env-Variablen

- `VITE_FREEDA_API_BASEURL` — Basis-URL der Freeda API (z. B. https://api.devel2.freeda.cloud/public)
- `VITE_FREEDA_COMPANY_UUID` — Company UUID für den API-Aufruf
- `VITE_FREEDA_API_KEY` — Optional: Bearer Token für API-Zugriff
- `VITE_SITEMAP_DOMAIN` — (Optional) Produktionsdomain, die in die Sitemap vorangestellt wird, z. B. https://www.golfclub-homburg.de
- `VITE_FREEDA_FORCE_LIVE` — (Dev only) Wenn auf `1`, `true` oder `yes` gesetzt, überspringen die Dev-Seiten den `content/freeda-news.json`-Cache und holen live von Freeda.

Dev-Workflow

1. Lokales Entwickeln mit Cache (default):
   - Wenn `content/freeda-news.json` existiert, verwenden die Seiten dieses Cache.
   - Das ist nützlich für reproduzierbare Local-Previews.

2. Live-Daten beim Entwickeln erzwingen:
   - Entweder `rm content/freeda-news.json` und im Browser neu laden
   - Oder Dev-Server mit Force-Live starten:

```bash
VITE_FREEDA_FORCE_LIVE=1 npm run dev
```

3. Cache aktualisieren (prebuild):

```bash
npm run prebuild
```

CI / Deployment

- Der Standard-`build`-Schritt im `package.json` führt `prebuild` vor `astro build` aus:

```json
"build": "npm run prebuild && astro build"
```

- In CI sollten die Freeda-API-Variablen als Secrets gesetzt werden (`VITE_FREEDA_API_BASEURL`, `VITE_FREEDA_COMPANY_UUID`, `VITE_FREEDA_API_KEY`, `VITE_SITEMAP_DOMAIN`).
- Optional: `content/freeda-news.json` nach dem Prebuild als Artefakt hochladen, wenn mehrere Jobs es benötigen.

Sitemap-Erweiterung

- `scripts/prebuild.js` sammelt bereits statische Seiten aus `src/pages` und News-URLs und verwendet Dateizeit (`mtime`) als `lastmod` für statische Seiten.
- Wenn du Frontmatter-`lastmod` bevorzugst, kann das Skript angepasst werden.

Vorsicht / Hinweise

- `VITE_FREEDA_FORCE_LIVE` ist nur für lokale Entwicklung gedacht — vermeide Live-Fetches in CI/Production.
- `content/freeda-news.json` und `public/sitemap.xml` sind generierte Artefakte und sollten in `.gitignore` stehen (bereits eingetragen).
- Bei Problemen mit veralteten Daten: `npm run prebuild` oder `rm content/freeda-news.json` benutzen.

Wenn du möchtest, kann ich noch eine kurze Abschnitt zu `How to add a new static page` ergänzen (z. B. Namenskonventionen für `src/pages`) oder das CI-YAML konkret als Datei anlegen.
