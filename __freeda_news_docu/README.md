# Freeda News Integration - Agent Documentation

## 📋 Übersicht

Dieses Verzeichnis enthält alle notwendigen Dateien und Anleitungen zur Integration des Freeda CMS News-Features in eine bestehende Astro-Website. Die Dokumentation ist speziell für AI-Agenten optimiert, um eine automatisierte Implementierung zu ermöglichen.

## 📂 Verzeichnisstruktur

```
freeda_news_docu/
├── README.md                          # Diese Datei
├── IMPLEMENTATION_GUIDE.md            # Schritt-für-Schritt Implementierungsanleitung
├── API_DOCUMENTATION.md               # Freeda API Spezifikationen
├── component_templates/               # Alle benötigten Astro-Komponenten
├── script_templates/                  # Build-Skripte (prebuild.js etc.)
├── config_templates/                  # Konfigurationsdateien
├── environment_setup/                 # Environment und Dependencies
├── testing_checklist/                # Test-Checklisten und Validierung
└── troubleshooting/                   # Problemlösung und Debugging
```

## 🎯 Für AI-Agenten

### Hauptaufgabe

Integration dynamischer News aus der Freeda CMS API in eine bestehende Astro-Website mit folgenden Anforderungen:

- **Build-Zeit Content-Fetching** mit Prebuild-Skripten
- **WebP-Bildoptimierung** für Performance
- **SEO-optimierte dynamische Routen** (`/news/[slug].astro`)
- **Responsive Design** mit Tailwind CSS
- **Error Handling** und Fallback-Strategien

### Implementierungsreihenfolge

1. **Environment Setup** - Dependencies und Konfiguration
2. **API Client** - Freeda-Anbindung mit Retry-Logic
3. **Prebuild System** - Content-Download zur Build-Zeit
4. **Komponenten** - News-Display und Artikel-Layouts
5. **Dynamic Routes** - URL-basierte Artikel-Navigation
6. **Bildoptimierung** - WebP-Konvertierung und Assets
7. **Testing & Validation** - Funktionalitätsprüfung

## 🚀 Quick Start für Agenten

### 1. Dependencies installieren

```bash
npm install image-size marked sanitize-html dotenv
```

### 2. Environment Variables setzen

```env
VITE_FREEDA_API_BASEURL=https://api.devel2.freeda.cloud/public
VITE_FREEDA_COMPANY_UUID=9d07193c-f47f-43f3-bdfc-017e3f01eb51
VITE_FREEDA_API_KEY=your-api-key-here
VITE_NEWS_CATEGORY=news
VITE_SITEMAP_DOMAIN=https://www.golfclub-homburg.de
VITE_FREEDA_FORCE_LIVE=0
```

### 3. Package.json Scripts erweitern

```json
{
  "scripts": {
    "prebuild": "node scripts/prebuild.js",
    "build": "npm run prebuild && astro build"
  }
}
```

### 4. Template-Dateien implementieren

- Kopiere alle Dateien aus `component_templates/` nach `src/components/`
- Kopiere alle Dateien aus `script_templates/` nach `scripts/`
- Kopiere alle Dateien aus `config_templates/` zu den entsprechenden Zielorten

### 5. Build & Test

```bash
npm run build
npm run dev
```

## ⚠️ Wichtige Hinweise

- **Git-Ignore**: `content/freeda-news.json` und `src/assets/freedaimg_*` sollten ignoriert werden
- **Bildoptimierung**: System nutzt `freedaimg_` Präfix für Asset-Integration
- **API-Limits**: Retry-Logic implementiert für Robustheit
- **SEO**: Automatische Sitemap-Generierung inklusive

## 📚 Detaillierte Dokumentation

Siehe `IMPLEMENTATION_GUIDE.md` für eine vollständige Schritt-für-Schritt Anleitung mit Code-Beispielen und Erklärungen.

## 🐛 Debugging

Bei Problemen siehe `troubleshooting/COMMON_ISSUES.md` für häufige Probleme und Lösungsansätze.

---

**Version:** 1.0  
**Letztes Update:** 27. Januar 2026  
**Status:** Produktionsreif
