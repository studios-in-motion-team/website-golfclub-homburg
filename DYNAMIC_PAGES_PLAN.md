# Dynamic Pages Implementation Plan

## API-basierte Seitengenerierung für Astro

### Überblick

Implementierung eines Systems, das vor dem Build-Prozess (und während der Entwicklung) Daten von einem API-Endpunkt abruft und daraus dynamische Seiten generiert.

## 1. Architektur-Übersicht

### Komponenten

- **API Client**: Zentrale Schnittstelle für API-Aufrufe
- **Content Manager**: Verwaltet Seitendaten und Caching
- **Dynamic Route Handler**: Generiert Astro-Seiten aus API-Daten
- **Build Integration**: Integriert sich in Astro's Build-Pipeline
- **Dev Server Integration**: Unterstützt Hot-Reload während der Entwicklung

### API-Endpunkt

**Freeda CMS Integration:**

- Base URL: `VITE_FREEDA_API_BASEURL` (aus .env)
- Company UUID: `VITE_FREEDA_COMPANY_UUID` (aus .env)
- News Endpunkt: `{{VITE_FREEDA_API_BASEURL}}/company/{{VITE_FREEDA_COMPANY_UUID}}/external/news`

### Datenfluss

```
Freeda API → Content Manager → Cache → Dynamic Routes → Astro Pages
```

## 2. Technische Implementierung

### 2.1 API Client (`src/utils/api-client.js`)

```javascript
// Funktionen:
// - fetchNews(): Holt News von Freeda API
// - buildFreedaEndpoint(): Konstruiert API-URL aus Env-Variablen
// - validateFreedaResponse(): Validiert Freeda API-Antworten
// - handleApiErrors(): Fehlerbehandlung für Freeda API
// - transformNewsToPages(): Konvertiert News-Daten zu Seiten-Format
```

**Freeda API Integration:**

- Endpunkt: `${VITE_FREEDA_API_BASEURL}/company/${VITE_FREEDA_COMPANY_UUID}/external/news`
- Authentifizierung: `VITE_FREEDA_API_KEY`
- Response Format: News-Array mit Content-Feldern

#### API Response Struktur

```json
{
  "data": [
    {
      "uuid": "841c39c2-67bb-45fb-ad0d-f4906f7f35f2",
      "name": "Artikeltitel",
      "textShort": "Kurzbeschreibung des Artikels",
      "text": {
        "md": "Volltext in Markdown-Format",
        "html": "Volltext in HTML-Format"
      },
      "isHighlighted": 0,
      "mediaRatio": null,
      "isActive": 1,
      "created": "2026-01-19 15:12:27",
      "media": {
        "name": "Medien-Name",
        "copyrights": null,
        "description": null,
        "source": null,
        "fileSize": null,
        "mimeType": "image/jpeg",
        "type": "image",
        "uuid": "92e10575-aea8-4ac6-9943-5019a91a4d14",
        "mediaPoolUuid": "a14a526b-f43c-4ddd-bda2-74ea4d9d6f08",
        "extension": "jpg",
        "url": "https://api.local.freeda.devel:8890/public/uploads/..."
      },
      "slug": "artikel-slug"
    }
  ]
}
```

#### Datenfeld-Mapping

| Freeda Feld     | Astro Verwendung         | Beschreibung          |
| --------------- | ------------------------ | --------------------- |
| `uuid`          | Eindeutige ID            | Interne Referenz      |
| `name`          | SEO Title, H1            | Haupt-Überschrift     |
| `textShort`     | Meta Description, Teaser | Kurzzusammenfassung   |
| `text.md`       | Content (Markdown)       | Hauptinhalt für Astro |
| `text.html`     | Content (HTML)           | Fallback-Format       |
| `slug`          | URL Path                 | Route-Parameter       |
| `created`       | Publish Date             | Sortierung, Datum     |
| `media.url`     | Featured Image           | Hero-Bild, Thumbnails |
| `isActive`      | Publish Status           | Sichtbarkeits-Filter  |
| `isHighlighted` | Priority Flag            | Hervorhebung          |

**Features:**

- Environment-basierte API-URLs (dev/prod)
- Request Retry-Mechanismus
- Response Caching
- Error Fallbacks

### 2.2 Content Manager (`src/utils/content-manager.js`)

```javascript
// Funktionen:
// - loadContent(): Lädt und cached Inhalte
// - getPageData(slug): Gibt Seitendaten zurück
// - refreshContent(): Aktualisiert Cache
// - validateContent(): Überprüft Datenintegrität
```

**Caching-Strategie:**

- **Development**: Memory Cache mit File Watcher
- **Production**: Build-Time Cache mit optionalem Fallback
- Cache-Invalidierung basierend auf Timestamps

### 2.3 Dynamic Routes & Hybrid-Routing

#### Routing-Strategie für News-Kategorie

**Empfohlener Ansatz: Nested Dynamic Routes**

```
src/pages/
├── news/
│   ├── index.astro           # Statische News-Übersicht (/news)
│   └── [slug].astro         # Dynamische News-Artikel (/news/artikel-slug)
└── api-content/
    └── [...slug].astro      # Fallback für andere Content-Typen
```

#### Implementierungs-Optionen

**Option 1: Category-Specific Routes (Empfohlen)**

```astro
<!-- src/pages/news/[slug].astro -->
---
export async function getStaticPaths() {
  const newsData = await fetchFreedaNews();

  return newsData
    .filter(item => item.isActive)
    .map(item => ({
      params: { slug: item.slug },
      props: { article: item }
    }));
}

const { article } = Astro.props;
---
```

**Option 2: Multi-Category Dynamic Routes**

```astro
<!-- src/pages/[category]/[slug].astro -->
---
export async function getStaticPaths() {
  const contentMapping = {
    'news': await fetchFreedaNews(),
    'events': await fetchFreedaEvents(), // Zukünftige Erweiterung
  };

  const routes = [];
  for (const [category, items] of Object.entries(contentMapping)) {
    items.forEach(item => {
      routes.push({
        params: { category, slug: item.slug },
        props: { item, category }
      });
    });
  }
  return routes;
}
---
```

**Option 3: Environment-Based Category**

```javascript
// config/routing-config.js
export const routingConfig = {
  newsCategory: process.env.VITE_NEWS_CATEGORY || "news",
  enableMultiCategory: process.env.VITE_MULTI_CATEGORY === "true",
  basePath: process.env.VITE_CONTENT_BASE_PATH || "/news",
};
```

#### Projektstruktur-Anpassung

```
src/pages/
├── news/
│   ├── index.astro                    # News-Übersichtsseite
│   │                                 # - Zeigt alle News-Artikel
│   │                                 # - Pagination, Filter, Suche
│   │                                 # - Statisches Layout
│   └── [slug].astro                   # Dynamische News-Artikel
│                                     # - Einzelartikel aus Freeda API
│                                     # - SEO-optimiert
│                                     # - Shared Layout mit statischen Seiten
├── club/
├── sport/
└── platz/
```

#### News-Übersichtsseite Integration

```astro
<!-- src/pages/news/index.astro -->
---
import { fetchFreedaNews } from '../utils/api-client.js';

// Lade alle News für Übersichtsseite
const allNews = await fetchFreedaNews();
const activeNews = allNews.filter(item => item.isActive);
const highlightedNews = activeNews.filter(item => item.isHighlighted);
---

<BaseLayout title="News - Golfclub Homburg">
  <!-- Hervorgehobene News -->
  <section class="highlighted-news">
    {highlightedNews.map(article => (
      <article>
        <h2><a href={`/news/${article.slug}`}>{article.name}</a></h2>
        <p>{article.textShort}</p>
      </article>
    ))}
  </section>

  <!-- Alle News -->
  <section class="all-news">
    {activeNews.map(article => (
      <article>
        <h3><a href={`/news/${article.slug}`}>{article.name}</a></h3>
        <time>{new Date(article.created).toLocaleDateString()}</time>
      </article>
    ))}
  </section>
</BaseLayout>
```

#### Konfiguration

```env
# .env - Routing-Konfiguration
VITE_NEWS_CATEGORY=news
VITE_CONTENT_BASE_PATH=/news
VITE_ENABLE_BREADCRUMBS=true
```

#### Features:

- **Hybrid-Routing**: Statische Kategorie + Dynamische Inhalte
- **SEO-Optimierung**: Einheitliche URL-Struktur `/news/artikel-slug`
- **Breadcrumb-Navigation**: Automatische Navigation-Pfade
- **Shared Layouts**: Konsistentes Design zwischen statischen und dynamischen Seiten
- **Performance**: Statische Generierung aller News-Seiten

## 3. Development-Modus Integration

### 3.1 Astro Integration (`integrations/dynamic-content.js`)

```javascript
// Features:
// - Lädt Inhalte beim Server-Start
// - Überwacht API-Änderungen
// - Triggert Hot-Reload bei Content-Updates
// - Bietet Development-Tools
```

### 3.2 Dev-Server Features

- **Hot Content Reload**: Automatische Aktualisierung bei API-Änderungen
- **Content Preview**: Vorschau unveröffentlichter Inhalte
- **Debug Tools**: API-Status und Cache-Information
- **Offline Mode**: Arbeiten mit gecachten Daten

### 3.3 File Watcher

```javascript
// Überwacht:
// - API-Client Konfiguration
// - Content-Templates
// - Triggert Neu-Laden bei Änderungen
```

## 4. Build-Prozess Integration

### 4.1 Pre-Build Hook

```javascript
// scripts/prebuild.js
// - Lädt alle API-Daten
// - Generiert statische Route-Definitionen
// - Erstellt Fallback-Daten für Offline-Builds
```

### 4.2 Build-Time Optimierungen

- **Parallel API Calls**: Gleichzeitiger Abruf mehrerer Endpunkte
- **Incremental Builds**: Nur geänderte Inhalte neu generieren
- **Asset Optimization**: Bilder und Media aus API automatisch optimieren
- **Sitemap Generation**: Automatische Sitemap aus API-Routen

## 5. Projektstruktur

### Neue Dateien/Ordner

```
├── src/
│   ├── utils/
│   │   ├── api-client.js              # API-Kommunikation
│   │   ├── content-manager.js         # Content-Verwaltung
│   │   └── route-generator.js         # Route-Generierung
│   ├── types/
│   │   └── api-types.ts              # TypeScript Definitionen
│   ├── pages/
│   │   └── api-content/
│   │       └── [...slug].astro       # Dynamische API-Seiten
│   ├── components/
│   │   ├── DynamicContent.astro      # Content-Renderer
│   │   ├── ApiPage.astro             # API-Seiten Template
│   │   └── ContentTypes/             # Spezifische Content-Templates
│   │       ├── Article.astro
│   │       ├── Landing.astro
│   │       └── Gallery.astro
│   └── layouts/
│       └── DynamicLayout.astro       # Layout für API-Seiten
├── integrations/
│   └── dynamic-content.js            # Astro Integration
├── scripts/
│   ├── prebuild.js                   # Pre-Build Script
│   └── content-sync.js               # Content-Synchronisation
└── config/
    ├── api-config.js                 # API-Konfiguration
    └── content-mapping.js            # Content-Type Mappings
```

## 6. Konfiguration

### 6.1 Environment Variables

```env
# .env (bereits vorhanden)
VITE_FREEDA_API_BASEURL=https://api.devel2.freeda.cloud/public
VITE_FREEDA_COMPANY_UUID=9d07193c-f47f-43f3-bdfc-017e3f01eb51
VITE_FREEDA_API_KEY=your-api-key-here

# Zusätzliche Konfiguration
API_CACHE_TTL=300
DEV_HOT_RELOAD=true
BUILD_FALLBACK=true

# Computed Endpoint
# ${VITE_FREEDA_API_BASEURL}/company/${VITE_FREEDA_COMPANY_UUID}/external/news
```

### 6.2 Astro Config Erweiterung

```javascript
// astro.config.mjs
export default defineConfig({
  integrations: [
    tailwind(),
    dynamicContent({
      freeda: {
        baseUrl: process.env.VITE_FREEDA_API_BASEURL,
        companyUuid: process.env.VITE_FREEDA_COMPANY_UUID,
        apiKey: process.env.VITE_FREEDA_API_KEY,
        newsEndpoint: "/external/news",
      },
      cacheStrategy: "memory",
      enableHotReload: process.env.NODE_ENV === "development",
    }),
  ],
});
```

### 6.3 Content Mapping

```javascript
// config/content-mapping.js
export const contentTypeMapping = {
  article: "ContentTypes/Article.astro",
  landing: "ContentTypes/Landing.astro",
  gallery: "ContentTypes/Gallery.astro",
  default: "DynamicContent.astro",
};
```

## 7. Error Handling & Fallbacks

### 7.1 API Fehlerbehandlung

- **Connection Errors**: Fallback auf gecachte Daten
- **Invalid Responses**: Fehlerseite mit Retry-Option
- **Rate Limiting**: Exponential Backoff
- **Authentication**: Token-Refresh Mechanismus

### 7.2 Content Fallbacks

- **Missing Pages**: 404 mit Suchvorschlägen
- **Incomplete Data**: Placeholder-Inhalte
- **Image Errors**: Default-Bilder
- **Broken Links**: Automatische Weiterleitung

## 8. Performance & Optimierung

### 8.1 Caching-Strategien

- **Memory Cache**: Für Development (schnell, flüchtig)
- **File Cache**: Für Production Builds (persistent)
- **CDN Cache**: Für statische Assets
- **Browser Cache**: Client-seitige Optimierung

### 8.2 Build-Optimierung

- **Lazy Loading**: Nur sichtbare Inhalte zuerst laden
- **Code Splitting**: Route-basierte JS-Bundles
- **Asset Bundling**: Optimierte CSS/JS-Ausgabe
- **Prerendering**: Statische Generierung kritischer Seiten

## 9. Testing-Strategie

### 9.1 Unit Tests

- API Client Funktionalität
- Content Manager Logic
- Route Generation
- Error Handling

### 9.2 Integration Tests

- End-to-End API-Integration
- Build-Prozess Validierung
- Development Server Tests
- Cache-Verhalten Tests

### 9.3 Performance Tests

- API Response Times
- Build Duration Monitoring
- Memory Usage Profiling
- Bundle Size Analysis

## 10. Deployment & Monitoring

### 10.1 CI/CD Integration

```yaml
# .github/workflows/build.yml
- name: Pre-build API Sync
  run: npm run prebuild

- name: Build with API Content
  run: npm run build
```

### 10.2 Monitoring

- **API Health Checks**: Überwachung der API-Verfügbarkeit
- **Build Notifications**: Benachrichtigung bei Build-Fehlern
- **Performance Metrics**: Core Web Vitals Tracking
- **Error Tracking**: Sentry/LogRocket Integration

## 11. Migration & Rollout

### 11.1 Phasen-Plan

1. **Phase 1**: Basic API Integration + Simple Routes
2. **Phase 2**: Advanced Content Types + Caching
3. **Phase 3**: Development Tools + Hot Reload
4. **Phase 4**: Performance Optimization + Monitoring

### 11.2 Backwards Compatibility

- Bestehende statische Seiten bleiben funktional
- Schrittweise Migration von Inhalten
- Fallback auf statische Versionen bei API-Ausfällen

## 12. Dokumentation & Maintenance

### 12.1 Developer Documentation

- API Integration Guide
- Content Type Development
- Troubleshooting Guide
- Best Practices

### 12.2 Content Editor Guide

- Content-Struktur Requirements
- API Response Format
- SEO Guidelines
- Media Handling

---

## Nächste Schritte

1. **Umgebung Setup**: Environment Variables definieren
2. **API Client**: Grundlegende API-Kommunikation implementieren
3. **Content Manager**: Caching und Datenverwaltung
4. **Dynamic Routes**: Erste Route-Implementierung
5. **Astro Integration**: Development Server Integration
6. **Testing**: Unit Tests für Core-Funktionalität
7. **Documentation**: API-Dokumentation erstellen
8. **Production Deployment**: Build-Pipeline anpassen

**Geschätzte Entwicklungszeit: 2-3 Wochen**
**Priorität: Hoch - Ermöglicht Content-Management ohne Code-Deployment**
