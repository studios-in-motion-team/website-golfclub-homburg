# Sitemap & Build Integration for Freeda Dynamic News

Ziel: Sicherstellen, dass dynamische News-Seiten aus der Freeda-API bei einem normalen `npm run build` korrekt erzeugt werden und in `public/sitemap.xml` auftauchen.

Diese Anleitung beschreibt die empfohlene Implementierung und Konfiguration — die CI-Integration folgt später.

---

## Grundprinzip

- Vor dem eigentlichen `astro build` werden Inhalte von der Freeda API geholt.
- Aus diesen Inhalten werden:
  - ein JSON-Cache (`content/freeda-news.json`) für reproducible builds erzeugt
  - eine `public/sitemap.xml` mit allen relevanten URLs erstellt
- Während des Builds lesen die Astro-Seiten (z.B. `/news` und `/news/[slug]`) zuerst den lokalen Cache `content/freeda-news.json`. Falls die Datei fehlt (z.B. beim lokalen Dev ohne `prebuild`), fällt die Seite auf Live-Fetch zurück.

---

## Dateien & Scripts

### 1) `scripts/prebuild.js`

- Lädt (`fetchFreedaNews()`) alle News (nur aktive Artikel).
- Speichert Ergebnis in `content/freeda-news.json`.
- Erzeugt `public/sitemap.xml` mit `<url><loc>...</loc><lastmod>...</lastmod></url>` Einträgen.

Beispiel-Implementierung (vereinfachte Skizze):

```javascript
import fs from "fs/promises";
import path from "path";
import { fetchFreedaNews } from "../src/utils/freeda-api-client.js";

async function main() {
  const items = await fetchFreedaNews({ onlyActive: true });
  await fs.mkdir(path.resolve(process.cwd(), "content"), { recursive: true });
  await fs.writeFile(
    path.resolve(process.cwd(), "content/freeda-news.json"),
    JSON.stringify(items, null, 2),
  );

  const urls = items.map((i) => ({
    loc: `/news/${i.slug}`,
    lastmod: new Date(i.created).toISOString(),
  }));
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join("\n")}\n</urlset>`;
  await fs.mkdir(path.resolve(process.cwd(), "public"), { recursive: true });
  await fs.writeFile(
    path.resolve(process.cwd(), "public/sitemap.xml"),
    sitemap,
  );
  console.log(
    "prebuild: wrote content/freeda-news.json and public/sitemap.xml",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### 2) `package.json` scripts

```json
{
  "scripts": {
    "prebuild": "node scripts/prebuild.js",
    "build": "npm run prebuild && astro build"
  }
}
```

> Hinweis: Alternativ kann man `prebuild` als `prebuild` hook nutzen (`"prebuild": "node scripts/prebuild.js"` und `"build": "astro build"`).

---

## Integration in Astro Pages

- `src/pages/news/index.astro` und `src/pages/news/[slug].astro` sollten beim Build zuerst versuchen, `content/freeda-news.json` zu importieren und nur falls diese Datei fehlt die Live-API nutzen.

Pseudo-Logik:

```js
let newsData;
try {
  newsData = await import("../../content/freeda-news.json");
} catch (e) {
  newsData = await fetchFreedaNews(); // dev fallback
}
```

Dadurch sind Builds deterministisch und reproduzierbar.

---

## Tests & Validierung

- Lokaler Test:
  - Setze `.env` mit Freeda-API-Zugang.
  - `npm run prebuild` → `content/freeda-news.json` und `public/sitemap.xml` sollten erstellt werden.
  - `npm run build` → `dist` generiert.

- CI-Test (später):
  - Workflow läuft `npm ci`, `npm run prebuild`, prüft `public/sitemap.xml` existence, dann `npm run build`.

---

## Betrieb & Hinweise

- Achten Sie auf `created`-Feld-Format und Zeitzonen; konvertieren Sie bei Bedarf zu UTC.
- Sitemap-URLs sollten die produktive Domain enthalten. Ersetzen Sie relative Pfade durch absolute URLs in `prebuild.js` oder während Deployment.
- Sie können zusätzlich `robots.txt` aktualisieren, um auf die Sitemap hinzuweisen.

---

## Weiterführende Optionen

- Incremental Prebuild: Nur geänderte News herunterladen (Delta) für große Datenmengen.
- Caching in CI-Artifacts, um Builds zu beschleunigen.
- Validierung der Sitemap gegen Schema in CI.

---

Wenn Sie wollen, erstelle ich jetzt `scripts/prebuild.js`, passe `package.json` an und aktualisiere `src/pages/news/index.astro` & `[slug].astro` so, dass sie `content/freeda-news.json` bevorzugen. Soll ich das jetzt anlegen? Wenn ja, welche Domain soll in der Sitemap verwendet werden (z. B. `https://golfclub-homburg.de`)?
