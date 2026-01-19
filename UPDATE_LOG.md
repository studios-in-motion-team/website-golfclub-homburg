# Update Log — Freeda News Integration

Datum: 2026-01-19

## Änderungen

- `src/utils/freeda-api-client.js` hinzugefügt
  - Build-Endpunkt aus Env-Variablen
  - `fetchFreedaNews()` mit Retry-Mechanismus
  - Response-Transformation

- `src/pages/news/index.astro` aktualisiert
  - Import von `fetchFreedaNews`
  - Versuch, News aus Freeda API zu laden
  - Fallback auf `placeholderNews` bei Fehlern

- `src/components/ArticleContent.astro` hinzugefügt
  - Komponente zur Darstellung von Artikel-Inhalten
  - Unterstützt HTML- und Markdown-Fallback

- `src/pages/news/[slug].astro` aktualisiert
  - Nutzt `ArticleContent` für die Artikeldarstellung
  - `getStaticPaths()` implementiert (mit API-Fetch)
  - `getStaticPaths()` fügt nun Dev-Fallback-Platzhalter hinzu, falls API nicht erreichbar

- `src/components/NewsCard.astro` aktualisiert
  - Unterstützt nun HTML in `textShort` (gerendert mit `set:html`)

- `src/config/sanitize-config.js` hinzugefügt
  - Zentrale Sanitization-Policy (erlaubte Tags, Attribute, Link-Transform)

- `src/components/Header.astro` aktualisiert
  - `News` Link in der Hauptnavigation hinzugefügt

- `DYNAMIC_PAGES_PLAN.md` und `AI_AGENT_TUTORIAL_FREEDA_NEWS.md` ergänzt
  - Freeda API-Endpunkt und Response-Struktur dokumentiert

## Nächste Schritte

1. `src/pages/news/[slug].astro` erstellt (Dynamic Route)
2. `ArticleContent.astro`, `NewsCard.astro` Komponenten anlegen
3. Integration in Build-Prozess (prebuild + caching)
4. Tests: Dev-Server, Build, SEO Metatags

---

Hinweis: Diese Datei ist Teil der Projekt-Dokumentation. Bitte bei weiteren Änderungen ergänzen.
