# Template Files - Implementierungsübersicht

## 📁 Alle Template-Dateien im Überblick

### 🎨 Komponenten (→ `src/components/`)
- **ArticleHeroImage.astro** - WebP-optimierte Hero-Bilder für Artikel
- **ArticleContent.astro** - Sanitized HTML/Markdown Content-Rendering
- **NewsCard.astro** - News-Vorschaukarten für Übersichtsseiten
- **news-slug-template.astro** - Template für Dynamic Route `/news/[slug].astro`

### 📜 Scripts (→ `scripts/`)
- **prebuild.js** - Haupt-Build-Skript für News-Download und Asset-Optimierung
- **freeda-api-client.js** - API-Client mit Retry-Logic (→ `src/utils/`)
- **sanitize-config.js** - HTML-Sanitization-Konfiguration (→ `src/config/`)
- **prebuild-smoke.js** - Build-Validierung und Testing

### ⚙️ Konfiguration
- **.env.example** - Environment Variables Template
- **package.json.example** - NPM-Dependencies und Scripts
- **astro.config.mjs.example** - Astro-Konfiguration mit Image-Optimierung
- **.gitignore.additions** - Zusätzliche Git-Ignore-Einträge

## 🚀 Implementierungsreihenfolge

### Schritt 1: Environment Setup
```bash
# 1. Dependencies installieren
npm install image-size marked sanitize-html dotenv

# 2. Environment konfigurieren  
cp freeda_news_docu/config_templates/.env.example .env
# API-Key in .env eintragen

# 3. Package.json erweitern
# Scripts aus config_templates/package.json.example kopieren

# 4. Gitignore erweitern
cat freeda_news_docu/config_templates/.gitignore.additions >> .gitignore
```

### Schritt 2: Core Files kopieren
```bash
# Utils & Config
mkdir -p src/utils src/config scripts
cp freeda_news_docu/script_templates/freeda-api-client.js src/utils/
cp freeda_news_docu/script_templates/sanitize-config.js src/config/

# Build Scripts
cp freeda_news_docu/script_templates/prebuild.js scripts/
cp freeda_news_docu/script_templates/prebuild-smoke.js scripts/
chmod +x scripts/*.js
```

### Schritt 3: Komponenten implementieren
```bash
# Astro Komponenten
cp freeda_news_docu/component_templates/ArticleHeroImage.astro src/components/
cp freeda_news_docu/component_templates/ArticleContent.astro src/components/
cp freeda_news_docu/component_templates/NewsCard.astro src/components/

# Dynamic Route
cp freeda_news_docu/component_templates/news-slug-template.astro src/pages/news/[slug].astro
```

### Schritt 4: Astro Config aktualisieren
```bash
# Backup erstellen
cp astro.config.mjs astro.config.mjs.backup

# Neue Config nutzen (oder manuell mergen)
cp freeda_news_docu/config_templates/astro.config.mjs.example astro.config.mjs
```

### Schritt 5: Testing & Validation
```bash
# Build-System testen
npm run prebuild:smoke

# Entwicklungsserver starten
npm run dev

# Production Build
npm run build
```

## 🎯 Template-Anpassungen

### Erforderliche Anpassungen je nach Projekt

#### 1. Styling & Design
- **Farben:** Templates nutzen `emerald-*` (Tailwind) → an Brand anpassen
- **Fonts:** `font-serif` für Headlines → projektspezifische Fonts
- **Layout:** Container-Größen und Spacing anpassen

#### 2. Navigation & Routing
- **Header-Integration:** NewsCard-Links auf korrekte Navigation prüfen
- **BaseLayout:** Import-Pfade an Projektstruktur anpassen
- **Breadcrumb:** Domain und Seitentitel projektspezifisch setzen

#### 3. Content-Anpassungen
- **Placeholder-Bilder:** Fallback-Images an Projekt anpassen
- **Date-Formatting:** Lokalisierung und Format prüfen
- **Text-Snippets:** "Mehr erfahren", "Zurück zu News" übersetzen

#### 4. SEO & Meta
- **Site-URL:** In allen Templates korrekte Domain setzen
- **Social Media:** OG-Images und Sharing-URLs anpassen
- **Structured Data:** Organization-Details aktualisieren

### Template-Variablen

| Variable | Template-Standard | Anpassung erforderlich |
|----------|-------------------|------------------------|
| `emerald-700` | Tailwind-Grün | → Brand-Farbe |
| `Golfclub Homburg` | Fester Text | → Projektname |
| `golfclub-homburg.de` | Domain | → Projekt-Domain |
| `/images/sample/` | Fallback-Pfad | → Asset-Pfade |
| `de-DE` | Lokalisierung | → Projekt-Locale |

## 🔧 Customization Guide

### News-Card Layout anpassen
```astro
<!-- In NewsCard.astro - Beispiel für andere Layouts -->

<!-- Original: Card-Design -->
<article class="bg-white rounded-lg shadow-lg">

<!-- Alternative 1: List-Design -->
<article class="border-b py-4 flex">

<!-- Alternative 2: Compact Grid -->
<article class="text-sm space-y-2">
```

### Bild-Optimierung konfigurieren
```javascript
// In ArticleHeroImage.astro - WebP-Settings anpassen
format="webp"           // → format="auto" für Browser-Detection
quality={80}            // → quality={90} für höhere Qualität
widths={[400, 800, 1200, 1600]}  // → Projekt-spezifische Breakpoints
```

### API-Client erweitern
```javascript
// In freeda-api-client.js - Zusätzliche Endpoints
export async function fetchFreedaEvents() {
  // Erweiterung für Events statt nur News
}

export async function fetchFreedaCategories() {
  // Kategorie-basierte Filterung
}
```

### Sanitization-Level anpassen
```javascript
// In sanitize-config.js - Für verschiedene Content-Typen
export const PRESETS = {
  ARTICLE: "default",     // Standard für News
  EDITORIAL: "relaxed",   // Für redaktionelle Inhalte  
  TEASER: "strict",       // Für Kurztexte
  USER_CONTENT: "strict"  // Für User-Generated Content
};
```

## 📚 Template-Dokumentation

### ArticleHeroImage.astro
**Zweck:** WebP-optimierte Darstellung von Artikel-Bildern
**Features:** 
- Glob-Import für `freedaimg_*` Assets
- Responsive Images mit mehreren Größen
- Fallback für externe URLs
- Layout-Shift-Prevention

### ArticleContent.astro
**Zweck:** Sichere HTML/Markdown-Darstellung
**Features:**
- Wählbare Sanitization-Level
- Markdown-zu-HTML Konvertierung
- XSS-Schutz
- Responsive Typography

### NewsCard.astro
**Zweck:** Vorschaukarten für News-Übersicht
**Features:**
- Hover-Effekte
- Responsive Card-Grid
- Date-Formatting
- HTML/Text-Detection

### prebuild.js
**Zweck:** Build-Zeit Content-Preparation
**Features:**
- News-API-Integration
- WebP-Asset-Download
- Sitemap-Generierung
- Error-Recovery

## 🔄 Template-Updates

### Wenn Templates aktualisiert werden:
```bash
# 1. Backup erstellen
cp -r src/components src/components.backup

# 2. Neue Templates vergleichen
diff -u src/components/NewsCard.astro freeda_news_docu/component_templates/NewsCard.astro

# 3. Selektiv übernehmen oder mergen
# (Manuelle Review empfohlen)

# 4. Tests ausführen
npm run prebuild:smoke
npm run build
```

---

## ✅ Fertigstellungs-Checklist

Nach Template-Implementation:
- [ ] Alle Template-Dateien kopiert und angepasst
- [ ] Environment Variables konfiguriert
- [ ] Build-System funktioniert (`npm run prebuild:smoke`)
- [ ] Styling an Brand angepasst
- [ ] Navigation funktioniert korrekt
- [ ] SEO-Meta-Tags projektspezifisch
- [ ] Performance-Tests bestanden (>90 Lighthouse)
- [ ] Cross-Browser-Tests durchgeführt
- [ ] Content-Team geschult

---

**Template-Version:** 1.0  
**Kompatibilität:** Astro 4.x, Node.js 18+  
**Letztes Update:** 27. Januar 2026