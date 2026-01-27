# Häufige Probleme & Lösungsansätze

## 🚨 Environment & Setup Probleme

### Problem: "Missing Freeda configuration"
**Fehler:** `Missing Freeda configuration: VITE_FREEDA_API_BASEURL or VITE_FREEDA_COMPANY_UUID not set`

**Ursachen & Lösungen:**
1. **`.env` Datei fehlt**
   ```bash
   # Lösung: .env aus Template erstellen
   cp freeda_news_docu/config_templates/.env.example .env
   # Dann API-Key eintragen
   ```

2. **Environment Variables falsch benannt**
   ```bash
   # Prüfen ob VITE_ Präfix fehlt
   grep -E "FREEDA_API|FREEDA_COMPANY" .env
   # Sollte VITE_FREEDA_* sein
   ```

3. **Dotenv wird nicht geladen**
   ```javascript
   // In freeda-api-client.js sollte stehen:
   import "dotenv/config";
   ```

### Problem: "Global fetch is not available"
**Fehler:** `Global fetch is not available in this environment`

**Ursachen & Lösungen:**
1. **Node.js Version < 18**
   ```bash
   node --version  # Sollte 18.0.0 oder höher sein
   # Lösung: Node.js updaten
   nvm install 18
   nvm use 18
   ```

2. **Fetch Polyfill nötig (Node < 18)**
   ```bash
   npm install node-fetch
   ```
   ```javascript
   // Am Anfang von freeda-api-client.js
   import fetch from 'node-fetch';
   globalThis.fetch = fetch;
   ```

### Problem: "HTTP 401 Unauthorized"
**Fehler:** API-Request schlägt mit 401 fehl

**Debug-Schritte:**
```bash
# 1. API-Key prüfen
echo "API Key length: ${#VITE_FREEDA_API_KEY}"
# Sollte > 20 Zeichen sein

# 2. Direkte API-Anfrage testen
curl -H "Authorization: Bearer $VITE_FREEDA_API_KEY" \
     "$VITE_FREEDA_API_BASEURL/company/$VITE_FREEDA_COMPANY_UUID/external/news"

# 3. API-Key Gültigkeit prüfen
# Kontaktiere Freeda-Administrator
```

**Lösungsansätze:**
- API-Key erneuern lassen
- Company UUID validieren
- Base URL prüfen (devel vs. prod)

## 🔧 Build & Prebuild Probleme

### Problem: Prebuild-Skript schlägt fehl
**Fehler:** `prebuild failed: Error: [verschiedene Ursachen]`

**Debug-Ansatz:**
```bash
# 1. Verbose Output aktivieren
DEBUG=* npm run prebuild

# 2. Network-Verbindung testen
ping api.devel2.freeda.cloud

# 3. Permissions prüfen
ls -la scripts/prebuild.js  # Sollte ausführbar sein
```

**Häufige Ursachen:**
1. **Network-Timeout**
   ```javascript
   // In prebuild.js timeout erhöhen:
   const fetchOptions = {
     headers,
     timeout: 30000  // 30 Sekunden
   };
   ```

2. **Disk-Space-Problem**
   ```bash
   df -h  # Prüfe verfügbaren Speicherplatz
   # Lösung: Platz schaffen oder Downloads reduzieren
   ```

3. **Permission-Fehler**
   ```bash
   chmod +x scripts/prebuild.js
   mkdir -p content src/assets public
   ```

### Problem: Images werden nicht heruntergeladen
**Symptom:** Prebuild läuft durch, aber keine `freedaimg_*` Dateien

**Debug:**
```bash
# 1. Prüfe ob News Bilder haben
cat content/freeda-news.json | jq '.[].media.url'

# 2. Teste Image-Download manuell
curl -I [image-url]  # Sollte 200 OK geben

# 3. Prüfe Assets-Verzeichnis
ls -la src/assets/freedaimg_*
```

**Lösungen:**
- CORS-Probleme: Bilder sind möglicherweise geschützt
- SSL-Zertifikat-Probleme bei HTTPS-Images
- Rate-Limiting der Bild-Server

### Problem: Sitemap wird nicht generiert
**Fehler:** `public/sitemap.xml` fehlt nach Prebuild

**Debug:**
```bash
# 1. Prüfe VITE_SITEMAP_DOMAIN
echo $VITE_SITEMAP_DOMAIN  # Sollte gesetzt sein

# 2. Prüfe Public-Verzeichnis
ls -la public/
mkdir -p public  # Falls nicht vorhanden

# 3. Test Sitemap-Generierung isoliert
node -e "
import { collectStaticPages } from './scripts/prebuild.js';
const pages = await collectStaticPages();
console.log('Static pages:', pages.length);
"
```

## 🖼️ Bildoptimierung Probleme

### Problem: WebP-Konvertierung funktioniert nicht
**Symptom:** Bilder bleiben JPEG/PNG statt WebP

**Ursachen & Lösungen:**
1. **Sharp nicht installiert**
   ```bash
   npm install sharp
   # Oder für Apple Silicon:
   npm rebuild sharp
   ```

2. **Astro Image-Service falsch konfiguriert**
   ```javascript
   // astro.config.mjs
   export default defineConfig({
     image: {
       service: {
         entrypoint: "astro/assets/services/sharp"
       }
     }
   });
   ```

3. **Assets nicht als `~/assets/` importiert**
   ```astro
   <!-- Falsch: -->
   <img src="/uploads/freeda/image.jpg" />
   
   <!-- Richtig: -->
   <Image src={freedaImageImport} />
   ```

### Problem: Layout Shift bei Bildladen
**Symptom:** Seite "springt" beim Laden der Bilder

**Lösung:**
```astro
<!-- Immer width/height angeben -->
<Image 
  src={image} 
  width={media.width} 
  height={media.height}
  alt={media.name}
/>
```

```javascript
// In prebuild.js: Bildmaße messen
import sizeOf from 'image-size';
const dims = sizeOf(imagePath);
item.media.width = dims.width;
item.media.height = dims.height;
```

## 🌐 Runtime & Display Probleme

### Problem: News werden nicht angezeigt
**Symptom:** `/news` zeigt leere Seite oder Placeholder

**Debug-Schritte:**
```bash
# 1. Prüfe Cache-Datei
cat content/freeda-news.json | jq '. | length'
# Sollte > 0 sein

# 2. Prüfe ob isActive filtering funktioniert
cat content/freeda-news.json | jq '[.[] | select(.isActive == true)] | length'

# 3. Console in Browser prüfen
# Öffne /news und schaue nach JavaScript-Fehlern
```

**Häufige Ursachen:**
- Cache-Datei leer oder korrupt
- Alle News haben `isActive: false`
- JavaScript-Fehler verhindert Rendering
- Astro Import-Pfade falsch

### Problem: Dynamic Routes (Einzelartikel) funktionieren nicht
**Fehler:** `/news/artikel-slug` gibt 404

**Debug:**
```bash
# 1. Prüfe ob [slug].astro existiert
ls -la src/pages/news/[slug].astro

# 2. Teste getStaticPaths
node -e "
import fs from 'fs';
const news = JSON.parse(fs.readFileSync('content/freeda-news.json'));
console.log('Slugs:', news.map(n => n.slug));
"

# 3. Build-Output prüfen
npm run build
ls -la dist/news/  # Sollte Artikel-Ordner enthalten
```

### Problem: HTML-Sanitization zu strikt
**Symptom:** Formatierungen aus CMS werden entfernt

**Lösungen:**
1. **Relaxed Sanitization**
   ```javascript
   // In ArticleContent.astro
   const opts = getSanitizeOptions('relaxed', sanitizeHtml);
   ```

2. **Spezifische Tags erlauben**
   ```javascript
   // In sanitize-config.js
   allowedTags: ['p', 'strong', 'em', 'ul', 'li', 'h2', 'h3']
   ```

3. **Sanitization temporär deaktivieren (DEBUG)**
   ```env
   VITE_FREEDA_SANITIZE_HTML=false
   ```

## 🔒 Security Probleme

### Problem: XSS durch unescaped Content
**Risk:** Malicious HTML aus CMS

**Prävention:**
```astro
<!-- Immer set:html mit Sanitization -->
<div set:html={sanitizedContent} />

<!-- NIEMALS direkt: -->
<div>{rawHtmlFromApi}</div>  ❌
```

### Problem: API-Key in Client-Code
**Risk:** API-Key wird in Browser gesendet

**Lösung:**
```javascript
// API-Key nur in Server-Side Code (prebuild)
// NICHT in Astro Frontend-Komponenten
if (typeof window !== 'undefined') {
  throw new Error('API-Client should not run in browser');
}
```

## ⚡ Performance Probleme

### Problem: Langsame Build-Zeit
**Symptom:** `npm run build` dauert sehr lange

**Optimierungen:**
1. **Parallele Image-Downloads**
   ```javascript
   // In prebuild.js
   await Promise.all(
     items.map(item => downloadImage(item))
   );
   ```

2. **Build-Cache nutzen**
   ```bash
   # Nur bei Änderungen neu builden
   if [ content/freeda-news.json -nt .prebuild-timestamp ]; then
     npm run prebuild
   fi
   ```

3. **Selective Downloads**
   ```javascript
   // Nur neue Bilder downloaden
   if (!fs.existsSync(localImagePath)) {
     await downloadImage(url);
   }
   ```

### Problem: Große Bundle-Größe
**Symptom:** JavaScript-Dateien > 500KB

**Lösungen:**
- Unused Dependencies entfernen
- Code-Splitting aktivieren
- Heavy libraries nur server-side nutzen
- Image-Assets optimieren

## 🔄 CI/CD Probleme

### Problem: Build schlägt in CI fehl
**Symptom:** Lokal funktioniert, CI/CD Pipeline fehlschlägt

**Häufige Ursachen:**
1. **Environment Variables fehlen**
   ```yaml
   # GitHub Actions
   env:
     VITE_FREEDA_API_KEY: ${{ secrets.FREEDA_API_KEY }}
   ```

2. **Node-Version unterschiedlich**
   ```yaml
   - uses: actions/setup-node@v4
     with:
       node-version: '18'
   ```

3. **Network-Restrictions**
   ```yaml
   # Timeout erhöhen
   - run: npm run prebuild
     timeout-minutes: 10
   ```

### Problem: Deployment-Caching-Issues
**Symptom:** Alte Inhalte werden angezeigt

**Lösungen:**
- Cache-Invalidierung nach Deploy
- Unique Asset-Namen (bereits implementiert)
- CDN-Purge nach Build

---

## 🆘 Emergency Fixes

### Schnelle Deaktivierung
```bash
# 1. Fallback auf Placeholder-News
mv src/utils/freeda-api-client.js src/utils/freeda-api-client.js.backup

# 2. News-Seiten temporär deaktivieren  
mv src/pages/news src/pages/news.disabled
```

### Hotfix für API-Ausfall
```javascript
// In news/index.astro - Fallback hinzufügen:
let news = [];
try {
  news = await fetchFreedaNews();
} catch (error) {
  console.warn('API failed, using placeholder');
  news = placeholderNews;
}
```

---

## 📞 Support Kontakte

### Bei API-Problemen:
- Freeda CMS Support
- API-Key-Administrator
- Network/DevOps Team

### Bei Build-Problemen:
- Development Team Lead
- CI/CD Administrator
- Infrastructure Team

### Eskalationsstufen:
1. **Selbst-Debug** mit dieser Anleitung (30 min)
2. **Team-Review** mit Kollegen (1 Stunde)
3. **Technical Lead** einbeziehen
4. **External Support** (Freeda/Hosting)

---

**Version:** 1.0  
**Letztes Update:** 27. Januar 2026  
**Status:** Produktiv