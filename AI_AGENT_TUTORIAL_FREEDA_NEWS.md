# Freeda CMS Integration Tutorial für AI-Agenten

## Dynamische News-Integration in Astro Website

> **Version:** 1.2  
> **Letztes Update:** 20. Januar 2026  
> **Status:** Vollständig implementiert mit Bildoptimierung  
> **Nächste Schritte:** Optional - WebP-Konvertierung während Prebuild

---

## 📦 Benötigte Dependencies & Scripts

### NPM Dependencies

```bash
npm install image-size marked sanitize-html dotenv
```

- **`image-size`**: Bildmaße ermitteln für CLS-Vermeidung
- **`marked`**: Markdown zu HTML Konvertierung
- **`sanitize-html`**: HTML-Sanitization für Sicherheit
- **`dotenv`**: Environment Variables in Scripts laden

### Neue Dateien erstellen

**Scripts:**

- `scripts/prebuild.js` - API-Fetch, Bild-Download, Sitemap-Generierung
- `scripts/prebuild-smoke.js` - Build-Validierung (optional)

**Komponenten:**

- `src/components/ArticleHeroImage.astro` - Optimierte Bild-Darstellung
- `src/components/ArticleContent.astro` - Artikel-Content mit Sanitization
- `src/components/NewsCard.astro` - News-Karten für Übersicht

**Pages:**

- `src/pages/news/[slug].astro` - Dynamic Route für Einzelartikel

**Utils:**

- `src/utils/freeda-api-client.js` - API-Client mit Retry-Logic
- `src/config/sanitize-config.js` - HTML-Sanitization-Regeln

**Dokumentation:**

- `README.me` - Entwickler-Dokumentation für Prebuild-System

### Environment Variables (.env)

```env
VITE_FREEDA_API_BASEURL=https://api.devel2.freeda.cloud/public
VITE_FREEDA_COMPANY_UUID=9d07193c-f47f-43f3-bdfc-017e3f01eb51
VITE_FREEDA_API_KEY=your-api-key-here
VITE_NEWS_CATEGORY=news
VITE_SITEMAP_DOMAIN=https://www.golfclub-homburg.de
VITE_FREEDA_FORCE_LIVE=0  # 1 = Live-Fetch in Dev-Mode
```

### Package.json Scripts

```json
{
  "scripts": {
    "prebuild": "node scripts/prebuild.js",
    "build": "npm run prebuild && astro build"
  }
}
```

### Astro Config Anpassungen

```javascript
// astro.config.mjs
export default defineConfig({
  integrations: [tailwind()],
  image: {
    service: {
      entrypoint: "astro/assets/services/sharp",
    },
    domains: [],
    remotePatterns: [],
  },
});
```

### Gitignore Ergänzungen

```gitignore
# Generated prebuild artifacts
content/freeda-news.json
public/sitemap.xml
public/robots.txt
public/uploads/freeda/

# Generated freeda assets (ignored to avoid versioning downloaded images)
src/assets/freedaimg_*
```

### Ordnerstruktur (neu erstellt)

```
content/               # Build-Zeit Cache
public/uploads/freeda/ # Heruntergeladene Bilder (Fallback)
src/assets/freedaimg_* # Optimierte Assets (WebP-Quelle)
```

---

## 🎯 Aufgabe für AI-Agenten

Du sollst **dynamische News aus der Freeda CMS API** in eine bestehende Astro-Website integrieren. Die News sollen in der Kategorie `/news` angezeigt werden und sowohl statische Übersichtsseiten als auch dynamische Einzelartikel unterstützen.

## 📋 Aktueller Stand (Januar 2026)

### ✅ Bereits implementiert:

- News-Kategorie unter `/src/pages/news/index.astro`
- Navigation erweitert (Header enthält News-Link)
- Placeholder-Datenstruktur kompatibel mit Freeda API
- Responsive Design für News-Übersicht
- SEO-optimierte Meta-Tags

### 🔄 Noch zu implementieren:

- API Client für Freeda-Anbindung
- Dynamic Route `/news/[slug].astro`
- Build-Time Content-Fetching
- Caching-Strategien
- Error Handling

## 🔧 Technische Grundlagen

### API-Konfiguration (bereits vorhanden)

```env
VITE_FREEDA_API_BASEURL=https://api.devel2.freeda.cloud/public
VITE_FREEDA_COMPANY_UUID=9d07193c-f47f-43f3-bdfc-017e3f01eb51
VITE_FREEDA_API_KEY=your-api-key-here
```

### Ziel-Endpunkt

```
${VITE_FREEDA_API_BASEURL}/company/${VITE_FREEDA_COMPANY_UUID}/external/news
```

### Erwartete API-Response-Struktur

```json
{
  "data": [
    {
      "uuid": "string",
      "name": "string",
      "textShort": "string",
      "text": {
        "md": "string",
        "html": "string"
      },
      "isHighlighted": 0|1,
      "isActive": 0|1,
      "created": "YYYY-MM-DD HH:mm:ss",
      "media": {
        "url": "string",
        "name": "string"
      },
      "slug": "string"
    }
  ]
}
```

## 📚 Schritt-für-Schritt Implementierung

### Phase 1: API Client erstellen

**Datei:** `src/utils/freeda-api-client.js`

**Anforderungen:**

- Environment Variables aus `.env` lesen
- Fetch-Requests mit Error Handling
- Response-Validierung
- Retry-Mechanismus bei Fehlern

**Code-Template:**

```javascript
// Implementiere fetchFreedaNews() Funktion
// Nutze VITE_FREEDA_API_BASEURL und VITE_FREEDA_COMPANY_UUID
// Filtere nur isActive: 1 News
// Transformiere API-Response zu internem Format
```

### Phase 2: Dynamic Route erstellen

**Datei:** `src/pages/news/[slug].astro`

**Anforderungen:**

- `getStaticPaths()` Implementation
- SEO-Meta-Tags aus News-Daten
- Responsive Article-Layout
- Breadcrumb-Navigation
- Social Media Meta-Tags

**Layout-Komponenten nutzen:**

- `BaseLayout.astro` für Grundstruktur
- `PageHero.astro` für Header-Bereich
- Neue `ArticleContent.astro` für Artikeldarstellung

### Phase 3: News-Übersicht aktualisieren

**Datei:** `src/pages/news/index.astro`

**Änderungen:**

- Placeholder-Daten durch echte API-Calls ersetzen
- `fetchFreedaNews()` in getStaticProps verwenden
- Hervorgehobene News (`isHighlighted: 1`) priorisieren
- Sortierung nach `created` Datum

### Phase 4: Build-Integration

**Datei:** `integrations/freeda-content.js`

**Anforderungen:**

- Astro Integration erstellen
- Pre-Build Content-Fetching
- Caching für Development-Modus
- Hot-Reload bei Content-Änderungen

## 🎨 Design-Richtlinien

### Bestehende Website-Styles nutzen:

- **Farben:** Emerald-Palette (`emerald-700`, `emerald-800`)
- **Fonts:** Playfair Display (Headings), Lato (Body)
- **Layout:** Container mit `max-w-6xl`, responsive Grid
- **Komponenten:** Card-basiertes Design mit Hover-Effekten

### News-spezifische Anforderungen:

- Highlight-News: Großes horizontales Layout
- Regular News: 3-Spalten Grid auf Desktop
- Artikel-Seiten: Typografie-fokussiert, lesbar
- Bilder: Lazy Loading, Alt-Texte aus API

## 🔍 Testing & Validation

### Zu testen bei Implementierung:

- [ ] API-Verbindung funktioniert
- [ ] Alle aktiven News werden geladen
- [ ] Routing funktioniert: `/news` und `/news/artikel-slug`
- [ ] SEO-Meta-Tags werden korrekt gesetzt
- [ ] Responsive Design auf allen Geräten
- [ ] Error Handling bei API-Ausfällen
- [ ] Build-Prozess ohne Fehler
- [ ] Navigation zwischen News und anderen Kategorien

## 📁 Projektstruktur-Änderungen

### Neue Dateien erstellen:

```
src/
├── utils/
│   ├── freeda-api-client.js       # API-Anbindung
│   └── content-transformer.js     # Daten-Transformation
├── components/
│   ├── ArticleContent.astro       # Artikel-Layout
│   ├── NewsCard.astro            # News-Card-Komponente
│   └── NewsBreadcrumb.astro      # Breadcrumb-Navigation
├── pages/news/
│   ├── index.astro               # ✅ Bereits vorhanden
│   └── [slug].astro              # Zu erstellen
└── types/
    └── freeda-types.ts           # TypeScript Definitionen
```

### Bestehende Dateien anpassen:

- `src/components/Header.astro` ✅ News-Link bereits hinzugefügt
- `astro.config.mjs` - Freeda Integration hinzufügen
- `package.json` - Neue Dependencies

## ⚡ Performance-Optimierungen

### Implementiere:

- **Image Optimization:** Astro's Image-Komponente nutzen
- **Lazy Loading:** Für News-Cards und Artikel-Bilder
- **Static Generation:** Alle News-Seiten zur Build-Zeit generieren
- **Caching:** API-Responses cachen (Memory + File)
- **Preloading:** Critical CSS und Fonts

### ✅ Bildoptimierung implementiert (Januar 2026)

**🚀 Asset-Prefix-Ansatz für echte WebP-Optimierung:**

- **Revolutionärer Ansatz:** Externe Bilder werden als `freedaimg_*` in `src/assets/` gespeichert
- **Vollständige Astro-Integration:** Behandlung als echte lokale Assets ermöglicht alle Optimierungen
- **WebP + Responsive:** Automatische Konvertierung und 4 responsive Größen (400, 800, 1200, 1600px)
- **Dramatische Größenreduktion:** 2.5MB → 108KB, 3.8MB → 186KB durch WebP-Komprimierung
- **Perfekte Bildqualität:** 80% Qualitätseinstellung für optimale Balance

**Implementation Details:**

```astro
// Glob-Import für dynamische Asset-Erkennung
const freedaImages = import.meta.glob('../assets/freedaimg_*', { eager: true });

// WebP-optimierte Darstellung mit allen Astro-Features
<Image
  src={assetImport}
  alt={media.name}
  format="webp"
  widths={[400, 800, 1200, 1600]}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
  quality={80}
  width={media.width}
  height={media.height}
/>
```

**Prebuild-Integration:**

```javascript
// Download mit freedaimg_ Präfix in src/assets/
const filename = `freedaimg_${hash}${ext}`;
const outDir = path.resolve(process.cwd(), "src/assets");
item.media.url = `~/assets/${filename}`;
```

**Build-Ergebnis:**

```
generating optimized images
▶ /_astro/freedaimg_ba3f3dd02a87a865.ChtxDS1w_1CwNf.webp (before: 2552kB, after: 108kB)
▶ /_astro/freedaimg_39dba6f35a98af2c.Cqwo2pn__2kCWzJ.webp (before: 3851kB, after: 186kB)
```

**Automatisierung:**

- Build-Prozess: `prebuild` → Download als Assets → `astro build` → Vollständige WebP-Optimierung
- Keine Original-JPEG im finalen Build, nur optimierte WebP-Versionen
- Git-Ignore für `freedaimg_*` verhindert Versionierung der Downloads
- CI-Ready: Reproduzierbare Builds ohne manuelle Schritte

## 🚨 Error Handling

### Szenarien abdecken:

- API nicht erreichbar → Cached/Placeholder Content
- Einzelne News nicht gefunden → 404-Seite mit Suchvorschlägen
- Malformed API Response → Fehlerseite mit Kontakt-Info
- Slow API Response → Loading-States

## 🔄 Zukünftige Erweiterungen (Placeholder)

> **Hinweis für zukünftige Updates:** Hier neue Features dokumentieren

### Geplante Features:

- [ ] Pagination für News-Übersicht
- [ ] Kategorie-Filter für News
- [ ] Suchfunktion
- [ ] Newsletter-Integration
- [ ] Social Media Sharing
- [ ] Kommentar-System
- [ ] Related Articles
- [ ] RSS Feed

### Potential weitere Content-Typen:

- [ ] Events (`/events`)
- [ ] Tournaments (`/tournaments`)
- [ ] Press Releases (`/press`)

---

## 📞 Debugging & Support

### Häufige Probleme:

1. **API-Key falsch:** Prüfe VITE_FREEDA_API_KEY in `.env`
2. **CORS-Fehler:** API-Endpunkt muss CORS für Domain freigeben
3. **Build-Fehler:** Prüfe ob alle API-Calls in getStaticPaths erfolgen
4. **Styling-Probleme:** Nutze bestehende Tailwind-Klassen der Website

### Log-Files prüfen:

- `npm run build` - Build-Logs für API-Fehler
- `npm run dev` - Development-Logs für Routing
- Browser DevTools - Network-Tab für API-Calls

### Kontakt bei Problemen:

- Projektdokumentation: `DYNAMIC_PAGES_PLAN.md`
- Environment-Setup: `.env` (API-Credentials)
- Code-Beispiele: Bestehende Astro-Pages als Referenz

---

**📝 Changelog:**

- **v1.0 (19.01.2026):** Basis-Tutorial erstellt, News-Kategorie implementiert
- **v1.1 (20.01.2026):** API-Integration und Dynamic Routes implementiert, Prebuild-System
- **v1.2 (20.01.2026):** WebP-Bildoptimierung und responsive Images implementiert
