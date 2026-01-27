# Freeda News Integration - Implementierungsanleitung

## 🎯 Ziel

Integration dynamischer News aus der Freeda CMS API in eine bestehende Astro-Website mit Build-Zeit Content-Fetching, WebP-Bildoptimierung und SEO-Optimierung.

## 📋 Voraussetzungen

### Technische Anforderungen

- Node.js 18+
- Astro Website (bereits vorhanden)
- Tailwind CSS (bereits konfiguriert)
- Freeda CMS API-Zugang

### Bestehende Struktur (muss vorhanden sein)

- `/src/pages/news/index.astro` - News-Übersichtsseite
- `/src/components/Header.astro` - Navigation mit News-Link
- `/src/layouts/BaseLayout.astro` - Basis-Layout

## 🚀 Schritt 1: Environment Setup

### 1.1 Dependencies installieren

```bash
npm install image-size marked sanitize-html dotenv
```

**Dependency-Erklärung:**

- `image-size`: Bildmaße für Layout-Shift-Vermeidung
- `marked`: Markdown → HTML Konvertierung
- `sanitize-html`: HTML-Sanitization für Sicherheit
- `dotenv`: Environment Variables in Build-Skripten

### 1.2 Environment Variables (.env)

```env
# Freeda API Configuration
VITE_FREEDA_API_BASEURL=https://api.devel2.freeda.cloud/public
VITE_FREEDA_COMPANY_UUID=9d07193c-f47f-43f3-bdfc-017e3f01eb51
VITE_FREEDA_API_KEY=your-api-key-here
VITE_NEWS_CATEGORY=news
VITE_SITEMAP_DOMAIN=https://www.golfclub-homburg.de
VITE_FREEDA_FORCE_LIVE=0  # 1 = Live-Fetch in Dev-Mode
```

### 1.3 Package.json Scripts erweitern

```json
{
  "scripts": {
    "prebuild": "node scripts/prebuild.js",
    "build": "npm run prebuild && astro build",
    "prebuild:smoke": "node scripts/prebuild-smoke.js"
  }
}
```

### 1.4 Gitignore erweitern

```gitignore
# Generated prebuild artifacts
content/freeda-news.json
public/sitemap.xml
public/robots.txt
public/uploads/freeda/

# Generated freeda assets (ignore downloaded images)
src/assets/freedaimg_*

# Environment variables
.env
```

## 🔧 Schritt 2: API Client erstellen

### 2.1 Freeda API Client (`src/utils/freeda-api-client.js`)

**Funktionalität:**

- Environment Variables laden
- HTTP-Requests mit Retry-Logic
- Response-Validierung
- Fehlerbehandlung

**Implementierung:** Siehe `script_templates/freeda-api-client.js`

### 2.2 Sanitization Config (`src/config/sanitize-config.js`)

**Zweck:** HTML-Content aus der API sicher darstellen

**Konfiguration:**

- Erlaubte HTML-Tags definieren
- Attribute-Whitelist
- Schutz vor XSS-Attacken

## 🏗️ Schritt 3: Prebuild System

### 3.1 Hauptbuild-Skript (`scripts/prebuild.js`)

**Aufgaben:**

1. Freeda API abfragen
2. News-Daten validieren und transformieren
3. Bilder herunterladen als `freedaimg_*` in `src/assets/`
4. Sitemap generieren
5. Cache-Datei erstellen (`content/freeda-news.json`)

**Besonderheit WebP-Optimierung:**

- Bilder werden mit `freedaimg_` Präfix in `src/assets/` gespeichert
- Astro behandelt sie als lokale Assets → vollständige WebP-Optimierung
- Automatische responsive Sizes: 400, 800, 1200, 1600px

### 3.2 Build-Validierung (`scripts/prebuild-smoke.js`)

**Zweck:** Post-Build Validierung

- Prüft ob News-Routen erreichbar sind
- Validiert Sitemap-Generierung
- Error-Reporting für CI/CD

## 🎨 Schritt 4: Komponenten erstellen

### 4.1 ArticleHeroImage.astro

**Funktionalität:**

- WebP-optimierte Bilddarstellung
- Responsive Images mit `sizes` Attribut
- Fallback für fehlende Bilder
- Layout-Shift-Prevention

**Template:** `component_templates/ArticleHeroImage.astro`

### 4.2 ArticleContent.astro

**Features:**

- HTML-Sanitization mit allowList
- Markdown-Rendering
- Typography-optimierte Styles
- Print-freundliches Layout

### 4.3 NewsCard.astro

**Design:**

- Card-basiertes Design mit Hover-Effekten
- Bild + Titel + Teaser-Text
- Responsive Grid-Layout
- CTA-Button zum Artikel

## 🛣️ Schritt 5: Dynamic Routes

### 5.1 Dynamic Route (`src/pages/news/[slug].astro`)

**Funktionalität:**

- `getStaticPaths()` für Build-Zeit-Generierung
- SEO-Meta-Tags aus News-Daten
- Strukturierte Daten (JSON-LD)
- Social Media Meta-Tags (Open Graph)

**Code-Struktur:**

```astro
---
export async function getStaticPaths() {
  // News aus Cache-File laden
  // Paths für alle aktiven News generieren
}

const { slug } = Astro.params;
// News-Daten für spezifischen Slug laden
---

<BaseLayout>
  <ArticleHeroImage />
  <ArticleContent />
</BaseLayout>
```

### 5.2 News-Übersicht aktualisieren (`src/pages/news/index.astro`)

**Änderungen:**

- Placeholder-Daten durch echte API-Integration ersetzen
- Hervorgehobene News (`isHighlighted: 1`) prominenter darstellen
- Sortierung nach Erstellungsdatum
- Pagination (optional)

## 🖼️ Schritt 6: Bildoptimierung

### 6.1 Asset-Integration-Ansatz

**Revolutionärer Ansatz:**

1. Externe Bilder werden als `freedaimg_*` in `src/assets/` gespeichert
2. Astro behandelt sie als echte lokale Assets
3. Vollständige WebP-Optimierung mit 4 responsive Größen
4. Dramatische Größenreduktion: 2.5MB → 108KB

### 6.2 Image-Komponente nutzen

```astro
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

## 🔍 Schritt 7: Testing & Validation

### 7.1 Funktionsprüfung

**Checklist:**

- [ ] API-Verbindung funktioniert
- [ ] Prebuild-Skript läuft ohne Fehler
- [ ] News-Übersicht zeigt echte Daten
- [ ] Einzelartikel sind unter `/news/[slug]` erreichbar
- [ ] Bilder werden optimiert geladen (WebP)
- [ ] SEO-Tags werden korrekt gesetzt
- [ ] Sitemap wird generiert

### 7.2 Performance-Tests

**Tools:**

- Lighthouse für Performance-Score
- WebPageTest für Ladezeiten
- Chrome DevTools für Bundle-Analyse

**Zielwerte:**

- Performance Score > 90
- First Contentful Paint < 2s
- Cumulative Layout Shift < 0.1

### 7.3 Build-Tests

```bash
# Vollständiger Build-Test
npm run build

# Validierung
npm run prebuild:smoke

# Development-Server
npm run dev
```

## 🚨 Schritt 8: Error Handling

### 8.1 API-Fehler

**Szenarien:**

- API nicht erreichbar → Cached Content nutzen
- Invalid Response → Fallback zu Placeholder
- Rate Limiting → Retry mit Backoff

### 8.2 Build-Fehler

**Häufige Probleme:**

- Missing Environment Variables
- Network-Timeouts
- Malformed API-Response
- Image-Download-Fehler

**Lösungsansätze:**

- Robust Error Handling in Prebuild-Skript
- Graceful Degradation bei fehlenden Bildern
- Build-Validierung vor Deployment

## 🔄 Schritt 9: CI/CD Integration

### 9.1 Build-Pipeline

```yaml
# Beispiel GitHub Actions
- name: Install dependencies
  run: npm ci

- name: Run prebuild
  run: npm run prebuild
  env:
    VITE_FREEDA_API_KEY: ${{ secrets.FREEDA_API_KEY }}

- name: Build site
  run: npm run build

- name: Validate build
  run: npm run prebuild:smoke
```

### 9.2 Environment Variables

**Production Secrets:**

- `VITE_FREEDA_API_KEY` als Secret konfigurieren
- Andere Variablen können public sein (VITE\_ Präfix)

## ✅ Schritt 10: Final Checklist

### Vor Go-Live prüfen:

**Funktionalität:**

- [ ] Alle News werden korrekt geladen
- [ ] Links funktionieren (`/news` → `/news/artikel-slug`)
- [ ] Bilder laden schnell (WebP-Format)
- [ ] Mobile Ansicht ist responsive
- [ ] SEO-Tags sind vollständig

**Performance:**

- [ ] Lighthouse Score > 90
- [ ] Bildgrößen unter 200KB (WebP)
- [ ] Build-Zeit unter 2 Minuten
- [ ] Sitemap enthält alle News-URLs

**Security:**

- [ ] HTML-Content ist sanitized
- [ ] API-Key ist sicher gespeichert
- [ ] Keine sensitive Daten in Git

---

## 📚 Weiterführende Ressourcen

- **API-Dokumentation:** `API_DOCUMENTATION.md`
- **Troubleshooting:** `troubleshooting/COMMON_ISSUES.md`
- **Template-Dateien:** `component_templates/`, `script_templates/`
- **Original Tutorial:** `../AI_AGENT_TUTORIAL_FREEDA_NEWS.md`

**Version:** 1.0  
**Status:** Produktionsreif  
**Letztes Update:** 27. Januar 2026
