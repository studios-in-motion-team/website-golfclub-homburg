# Freeda News Integration - Test Checklist

## 🧪 Pre-Implementation Tests

### Environment Validation
- [ ] Node.js Version 18+ installiert
- [ ] NPM Dependencies installiert ohne Fehler
- [ ] `.env` Datei mit allen Required Variables erstellt
- [ ] API-Key ist gültig und funktioniert

### API Connection Tests
```bash
# Test 1: Basic API Connection
curl -H "Accept: application/json" \
  "${VITE_FREEDA_API_BASEURL}/company/${VITE_FREEDA_COMPANY_UUID}/external/news?api_key=${VITE_FREEDA_API_KEY}"

# Expected: JSON response with "data" array

# Test 2: API Response Structure
node -e "
import { fetchFreedaNews } from './src/utils/freeda-api-client.js';
const news = await fetchFreedaNews({ onlyActive: true });
console.log('✅ News count:', news.length);
console.log('✅ First item keys:', Object.keys(news[0] || {}));
"
```

## 🔧 Implementation Tests

### Phase 1: API Client
- [ ] `src/utils/freeda-api-client.js` erstellt
- [ ] Environment Variables werden korrekt geladen
- [ ] Retry-Logic funktioniert bei temporären Fehlern
- [ ] Response-Transformation ist korrekt
- [ ] Error Handling wirft aussagekräftige Fehler

**Test Commands:**
```bash
# Test API Client direkt
node -e "
import { fetchFreedaNews, validateConfig } from './src/utils/freeda-api-client.js';
try {
  validateConfig();
  console.log('✅ Configuration valid');
  const news = await fetchFreedaNews({ onlyActive: true });
  console.log('✅ API Client works:', news.length, 'items');
} catch (e) {
  console.error('❌ Error:', e.message);
}
"
```

### Phase 2: Prebuild System
- [ ] `scripts/prebuild.js` erstellt und ausführbar
- [ ] News werden erfolgreich geladen
- [ ] Bilder werden heruntergeladen als `freedaimg_*`
- [ ] `content/freeda-news.json` wird generiert
- [ ] Sitemap wird erstellt mit News-URLs
- [ ] `robots.txt` wird generiert

**Test Commands:**
```bash
# Test Prebuild
npm run prebuild

# Validate generated files
ls -la content/freeda-news.json
ls -la public/sitemap.xml  
ls -la public/robots.txt
ls -la src/assets/freedaimg_*

# Test smoke test
npm run prebuild:smoke
```

### Phase 3: Components
- [ ] `ArticleHeroImage.astro` zeigt Bilder korrekt an
- [ ] WebP-Optimierung funktioniert für `freedaimg_*`
- [ ] `ArticleContent.astro` rendert HTML/Markdown sicher
- [ ] `NewsCard.astro` zeigt Preview korrekt
- [ ] Responsive Design funktioniert auf allen Größen

**Test Commands:**
```bash
# Start dev server and test manually
npm run dev
# Browse to http://localhost:4321/news
```

### Phase 4: Dynamic Routes
- [ ] `/news` zeigt News-Übersicht
- [ ] `/news/artikel-slug` funktioniert für alle Artikel
- [ ] SEO-Meta-Tags werden korrekt gesetzt
- [ ] Breadcrumb-Navigation funktioniert
- [ ] 404-Handling für ungültige Slugs

## 🌐 Frontend Testing

### News Overview Page (`/news`)
- [ ] Alle aktiven News werden angezeigt
- [ ] Hervorgehobene News (`isHighlighted: 1`) sind prominenter
- [ ] Bilder laden schnell und sind responsive
- [ ] Cards sind klickbar und verlinken korrekt
- [ ] Datum wird korrekt formatiert (DE)
- [ ] Fallback bei fehlendem Bild funktioniert

### Individual Article Pages (`/news/[slug]`)
- [ ] Artikel-Content wird vollständig angezeigt
- [ ] Hero-Image ist optimiert (WebP, responsive)
- [ ] HTML-Content ist sanitized (XSS-Schutz)
- [ ] Markdown wird korrekt zu HTML konvertiert
- [ ] Breadcrumb-Navigation funktioniert
- [ ] Social Media Buttons verlinken korrekt
- [ ] "Zurück zu News" Link funktioniert

### Responsive Design
- [ ] Mobile (320px-768px): Single-column Layout
- [ ] Tablet (768px-1024px): 2-column Grid
- [ ] Desktop (1024px+): 3-column Grid
- [ ] Bilder skalieren korrekt
- [ ] Text ist auf allen Größen lesbar
- [ ] Touch-Targets sind groß genug (44px+)

## 📊 Performance Testing

### Lighthouse Scores (Target: >90)
- [ ] Performance Score > 90
- [ ] Accessibility Score > 95
- [ ] Best Practices Score > 90
- [ ] SEO Score > 95

**Test Commands:**
```bash
# Build and run Lighthouse
npm run build
npm run preview

# In browser dev tools:
# - Open Lighthouse tab
# - Run full audit on /news and /news/sample-article
```

### Image Optimization Validation
- [ ] WebP-Format wird für moderne Browser verwendet
- [ ] Multiple responsive sizes werden generiert
- [ ] Lazy Loading funktioniert
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Largest Contentful Paint (LCP) < 2.5s

**Check Commands:**
```bash
# Check generated images
ls -la dist/_astro/freedaimg_*.webp

# Check image sizes
file dist/_astro/freedaimg_*.webp | head -5
```

### Bundle Size
- [ ] News pages laden in < 3s (3G)
- [ ] JavaScript Bundle < 100KB
- [ ] Critical CSS inline
- [ ] Assets sind mit Cache-Headers versehen

## 🔍 SEO & Accessibility Testing

### Meta Tags
- [ ] `<title>` ist unique für jeden Artikel
- [ ] Meta-Description aus `textShort`
- [ ] Open Graph Tags für Social Media
- [ ] Canonical URLs sind korrekt
- [ ] Structured Data (JSON-LD) ist valid

**Validation Commands:**
```bash
# Test meta tags
curl -s "http://localhost:4321/news/sample-article" | grep -E '<title|<meta.*og:|<meta.*description'

# Validate structured data
# Use Google's Structured Data Testing Tool
```

### Accessibility (WCAG 2.1 AA)
- [ ] Alle Bilder haben Alt-Text
- [ ] Farbkontrast ist ausreichend (4.5:1)
- [ ] Keyboard-Navigation funktioniert
- [ ] Screen Reader findet Hauptinhalt
- [ ] Headings sind hierarchisch (h1 → h2 → h3)

### Sitemap & SEO
- [ ] `/sitemap.xml` ist erreichbar
- [ ] Sitemap enthält alle News-URLs
- [ ] `/robots.txt` verweist auf Sitemap
- [ ] URLs sind SEO-friendly (slug-basiert)

## 🚨 Error Handling Testing

### API Failure Scenarios
- [ ] API nicht erreichbar → Fallback auf Cache
- [ ] Malformed JSON Response → Error Handling
- [ ] Rate Limiting (429) → Retry mit Backoff
- [ ] Invalid API Key (401) → Meaningful Error

**Test Simulations:**
```bash
# Test with invalid API key
VITE_FREEDA_API_KEY=invalid npm run prebuild
# Should show clear error message

# Test with no network
# Disconnect internet, run prebuild
# Should use cached data if available
```

### Build Failure Recovery
- [ ] Build schlägt fehl bei API-Problemen → Clear Error
- [ ] Image-Download-Fehler → Graceful Degradation
- [ ] Malformed News Data → Item wird übersprungen
- [ ] Disk-Space-Probleme → Meaningful Error

### Runtime Error Handling
- [ ] 404 für nicht existierende News-Slugs
- [ ] Fehlende Bilder → Fallback anzeigen
- [ ] Leere News-Liste → Placeholder anzeigen
- [ ] JavaScript-Fehler → Seite bleibt funktional

## 📱 Cross-Browser Testing

### Desktop Browser
- [ ] Chrome (Latest)
- [ ] Firefox (Latest)
- [ ] Safari (Latest)
- [ ] Edge (Latest)

### Mobile Browser
- [ ] Chrome Mobile
- [ ] Safari iOS
- [ ] Firefox Mobile
- [ ] Samsung Internet

### Feature Support
- [ ] WebP-Images mit Fallback
- [ ] CSS Grid mit Fallback
- [ ] Modern JavaScript mit Polyfills
- [ ] Lazy Loading mit Intersection Observer

## 🎯 User Acceptance Testing

### Content Management Workflow
- [ ] Neue News in Freeda CMS → Erscheint nach Build
- [ ] News-Deaktivierung → Verschwindet nach Build
- [ ] Bild-Updates → Neue Bilder nach Build
- [ ] HTML-Formatting → Wird korrekt sanitized

### Editorial Testing
- [ ] Lange Artikel sind gut lesbar
- [ ] Bilder haben angemessene Größe
- [ ] Links öffnen korrekt (intern/extern)
- [ ] Datum/Zeit wird verständlich angezeigt
- [ ] Teaser-Text ist aussagekräftig

### Navigation Testing
- [ ] News-Link in Hauptnavigation funktioniert
- [ ] Breadcrumb macht Navigation einfach
- [ ] "Weitere News" Verlinkung ist intuitiv
- [ ] Social Media Sharing funktioniert
- [ ] Zurück-Button im Browser funktioniert

## ✅ Final Validation Checklist

### Before Go-Live
- [ ] Alle Tests der Checkliste bestanden
- [ ] Performance-Budgets eingehalten
- [ ] Security-Review abgeschlossen
- [ ] Content-Review durch Editorial-Team
- [ ] Fallback-Strategien dokumentiert
- [ ] Monitoring & Alerting eingerichtet

### Post-Launch Monitoring
- [ ] Error-Tracking eingerichtet
- [ ] Performance-Monitoring aktiv
- [ ] SEO-Rankings überwachen
- [ ] User-Feedback sammeln
- [ ] API-Usage überwachen

---

## 🛠️ Test Automation

### Automated Tests (Optional)
```javascript
// test/news-integration.test.js
import { test, expect } from '@playwright/test';

test('News overview loads correctly', async ({ page }) => {
  await page.goto('/news');
  
  // Check for news cards
  const newsCards = page.locator('[data-testid="news-card"]');
  expect(await newsCards.count()).toBeGreaterThan(0);
  
  // Check images load
  const images = page.locator('img');
  for (const img of await images.all()) {
    expect(await img.getAttribute('src')).toBeTruthy();
  }
});

test('Individual article page works', async ({ page }) => {
  await page.goto('/news');
  
  // Click first article
  await page.locator('[data-testid="news-card"] a').first().click();
  
  // Should be on article page
  expect(page.url()).toMatch(/\/news\/[^\/]+$/);
  
  // Check content loads
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('[data-testid="article-content"]')).toBeVisible();
});
```

---

**Status Tracking:** Abhaken während Implementierung  
**Version:** 1.0  
**Letztes Update:** 27. Januar 2026