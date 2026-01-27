# Environment Setup Guide

## 🚀 Quick Start

### 1. Dependencies installieren

```bash
# Haupt-Dependencies für Freeda-Integration
npm install image-size marked sanitize-html dotenv

# Optional: TypeScript-Types für bessere IDE-Unterstützung
npm install --save-dev @types/sanitize-html
```

### 2. Environment Variables konfigurieren

```bash
# .env Datei im Projektroot erstellen
cp freeda_news_docu/config_templates/.env.example .env

# API-Key eintragen (von Freeda-Administrator erhalten)
# Datei bearbeiten und VITE_FREEDA_API_KEY setzen
```

### 3. Scripts zu package.json hinzufügen

```json
{
  "scripts": {
    "prebuild": "node scripts/prebuild.js",
    "build": "npm run prebuild && astro build",
    "prebuild:smoke": "node scripts/prebuild-smoke.js"
  }
}
```

### 4. Gitignore erweitern

```bash
# Gitignore-Ergänzungen hinzufügen
cat freeda_news_docu/config_templates/.gitignore.additions >> .gitignore
```

## 🔧 Detaillierte Konfiguration

### NPM Dependencies

| Package | Version | Zweck |
|---------|---------|--------|
| `image-size` | ^1.0.2 | Bildmaße für Layout-Shift-Prevention |
| `marked` | ^12.0.0 | Markdown → HTML Konvertierung |
| `sanitize-html` | ^2.12.1 | HTML-Sanitization gegen XSS |
| `dotenv` | ^16.3.1 | Environment Variables in Scripts |

### Environment Variables

| Variable | Pflicht | Beschreibung |
|----------|---------|--------------|
| `VITE_FREEDA_API_BASEURL` | ✅ | Freeda API Basis-URL |
| `VITE_FREEDA_COMPANY_UUID` | ✅ | Firma UUID |
| `VITE_FREEDA_API_KEY` | ✅ | API-Schlüssel (geheim!) |
| `VITE_SITEMAP_DOMAIN` | ❌ | Domain für Sitemap |
| `VITE_FREEDA_FORCE_LIVE` | ❌ | Live-API in Dev (Debug) |

### Ordnerstruktur nach Setup

```
projekt/
├── .env                           # Environment Variables (nicht in Git!)
├── content/
│   └── freeda-news.json          # Generierter News-Cache
├── public/
│   ├── sitemap.xml               # Generierte Sitemap
│   ├── robots.txt                # Generierte robots.txt
│   └── uploads/freeda/           # Fallback für Bilder
├── scripts/
│   ├── prebuild.js               # Haupt-Build-Script
│   └── prebuild-smoke.js         # Build-Validierung
├── src/
│   ├── assets/
│   │   └── freedaimg_*           # Optimierte Bilder (ignoriert)
│   ├── components/
│   │   ├── ArticleHeroImage.astro
│   │   ├── ArticleContent.astro
│   │   └── NewsCard.astro
│   ├── config/
│   │   └── sanitize-config.js
│   ├── pages/news/
│   │   ├── index.astro
│   │   └── [slug].astro          # Dynamic Route
│   └── utils/
│       └── freeda-api-client.js
```

## 🧪 Setup validieren

### 1. Environment Test
```bash
# Prüfe ob alle Variablen gesetzt sind
node -e "
import dotenv from 'dotenv';
dotenv.config();
const required = ['VITE_FREEDA_API_BASEURL', 'VITE_FREEDA_COMPANY_UUID', 'VITE_FREEDA_API_KEY'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error('Missing variables:', missing.join(', '));
  process.exit(1);
}
console.log('✅ All required environment variables set');
"
```

### 2. API-Verbindung testen
```bash
# Teste API-Zugriff
npm run prebuild
```

### 3. Build-Pipeline testen
```bash
# Vollständiger Test mit Validation
npm run prebuild:smoke
npm run build
```

## 🔒 Security Checklist

### Environment Variables
- [ ] `.env` ist in `.gitignore` eingetragen
- [ ] `VITE_FREEDA_API_KEY` ist gesetzt und geheim
- [ ] Produktions-API-Keys sind in CI/CD-System als Secrets gespeichert

### HTML Sanitization
- [ ] `sanitize-html` ist installiert und konfiguriert
- [ ] Sanitization ist standardmäßig aktiviert
- [ ] Nur vertrauenswürdige HTML-Tags sind erlaubt

### Build Security
- [ ] Keine Credentials in generierten Dateien
- [ ] Generated Assets sind in `.gitignore`
- [ ] Prebuild-Script hat Error Handling

## 🚨 Troubleshooting

### Häufige Probleme

#### "Missing Freeda configuration"
```bash
# Prüfe .env Datei
cat .env | grep FREEDA
# Sollte alle drei Basis-Variablen zeigen
```

#### "Global fetch is not available"
```bash
# Node.js Version prüfen (muss 18+ sein)
node --version
# Upgrade falls nötig
```

#### "HTTP 401 Unauthorized"
```bash
# API-Key validieren
echo $VITE_FREEDA_API_KEY
# Mit Freeda-Administrator prüfen
```

#### Build-Fehler
```bash
# Cache löschen und neu versuchen
npm run clean
npm run prebuild
```

### Debug-Modi

#### Verbose Logging
```bash
# Debug-Informationen aktivieren
export DEBUG=freeda:*
npm run prebuild
```

#### Force Live API
```bash
# Cache ignorieren, immer live API
export VITE_FREEDA_FORCE_LIVE=1
npm run dev
```

## 🔄 CI/CD Integration

### GitHub Actions Beispiel
```yaml
name: Build & Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - run: npm ci
      
      - name: Run prebuild
        env:
          VITE_FREEDA_API_KEY: ${{ secrets.FREEDA_API_KEY }}
          VITE_FREEDA_API_BASEURL: ${{ vars.FREEDA_API_BASEURL }}
          VITE_FREEDA_COMPANY_UUID: ${{ vars.FREEDA_COMPANY_UUID }}
          VITE_SITEMAP_DOMAIN: ${{ vars.SITEMAP_DOMAIN }}
        run: npm run prebuild:smoke
        
      - name: Build site
        run: npm run build
```

### Vercel Deployment
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "env": {
    "VITE_FREEDA_API_BASEURL": "@freeda-api-baseurl",
    "VITE_FREEDA_COMPANY_UUID": "@freeda-company-uuid",
    "VITE_FREEDA_API_KEY": "@freeda-api-key",
    "VITE_SITEMAP_DOMAIN": "@sitemap-domain"
  }
}
```

---

**Nächster Schritt:** Nach dem Setup siehe `IMPLEMENTATION_GUIDE.md` für die Schritt-für-Schritt Implementierung.