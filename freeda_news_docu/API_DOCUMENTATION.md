# Freeda CMS API - Technische Dokumentation

## 🌐 API-Übersicht

**Basis-URL:** `https://api.devel2.freeda.cloud/public`  
**Authentifizierung:** API-Key über Query-Parameter oder Header  
**Format:** JSON  
**Rate Limiting:** Ja (Details siehe Limits)

## 🔐 Authentifizierung

### Environment Variables

```env
VITE_FREEDA_API_BASEURL=https://api.devel2.freeda.cloud/public
VITE_FREEDA_COMPANY_UUID=9d07193c-f47f-43f3-bdfc-017e3f01eb51
VITE_FREEDA_API_KEY=your-api-key-here
```

### API-Key verwendung

```javascript
// Als Query-Parameter (empfohlen)
const url = `${baseUrl}/company/${companyUuid}/external/news?api_key=${apiKey}`;

// Als Header (alternative)
headers: {
  'Authorization': `Bearer ${apiKey}`,
  'X-API-Key': apiKey
}
```

## 📊 News-Endpunkt

### Request

```http
GET /company/{companyUuid}/external/news
Host: api.devel2.freeda.cloud
```

**Parameter:**

- `companyUuid` (required): UUID der Firma
- `api_key` (required): API-Schlüssel
- `category` (optional): News-Kategorie filtern
- `limit` (optional): Anzahl der Ergebnisse (default: alle)
- `offset` (optional): Paginierung

### Response-Struktur

```json
{
  "status": "success",
  "data": [
    {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Neuer Clubmeister 2026",
      "slug": "neuer-clubmeister-2026",
      "textShort": "Kurzbeschreibung des Artikels für Teasers und Meta-Descriptions",
      "text": {
        "md": "# Artikel-Titel\n\nMarkdown-formatierter **Volltext** des Artikels...",
        "html": "<h1>Artikel-Titel</h1><p>HTML-formatierter <strong>Volltext</strong>...</p>"
      },
      "isHighlighted": 1,
      "isActive": 1,
      "created": "2026-01-20 10:30:00",
      "updated": "2026-01-20 15:45:00",
      "media": {
        "url": "https://api.devel2.freeda.cloud/storage/images/news/image123.jpg",
        "name": "Gewinner Clubmeisterschaft 2026",
        "alt": "Siegerfoto der Clubmeisterschaft",
        "width": 1200,
        "height": 800
      },
      "category": "news",
      "author": {
        "name": "Redaktion",
        "email": "redaktion@golfclub-homburg.de"
      },
      "seo": {
        "metaTitle": "Neuer Clubmeister 2026 - Golfclub Homburg",
        "metaDescription": "Erfahren Sie mehr über unseren neuen Clubmeister 2026...",
        "keywords": ["clubmeister", "golf", "homburg", "turnier"]
      }
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "per_page": 20,
    "total_pages": 2
  },
  "meta": {
    "generated_at": "2026-01-27T14:30:00Z",
    "cache_expires": "2026-01-27T15:30:00Z"
  }
}
```

## 📝 Datenfeld-Definitionen

### News-Objekt

| Feld            | Typ      | Beschreibung                  | Verwendung               |
| --------------- | -------- | ----------------------------- | ------------------------ |
| `uuid`          | string   | Eindeutige ID                 | Interne Referenz         |
| `name`          | string   | Artikel-Titel                 | `<h1>`, Meta-Title       |
| `slug`          | string   | URL-freundlicher Name         | Route `/news/{slug}`     |
| `textShort`     | string   | Teaser-Text (150-300 Zeichen) | Cards, Meta-Description  |
| `text.md`       | string   | Volltext als Markdown         | Content-Rendering        |
| `text.html`     | string   | Volltext als HTML             | Alternative zu MD        |
| `isHighlighted` | 0\|1     | Featured News                 | Prominente Darstellung   |
| `isActive`      | 0\|1     | Veröffentlicht                | Nur aktive News anzeigen |
| `created`       | datetime | Erstellungsdatum              | Sortierung, Anzeige      |
| `updated`       | datetime | Letzte Änderung               | Cache-Invalidierung      |

### Media-Objekt

| Feld     | Typ     | Beschreibung   | Verwendung                      |
| -------- | ------- | -------------- | ------------------------------- |
| `url`    | string  | Bild-URL       | Download für lokale Optimierung |
| `name`   | string  | Bild-Titel     | Alt-Text, Bildunterschrift      |
| `alt`    | string  | Alt-Text       | Accessibility                   |
| `width`  | integer | Originalbreite | Layout-Shift-Prevention         |
| `height` | integer | Originalhöhe   | Aspect-Ratio-Berechnung         |

## 🚦 API-Limits & Caching

### Rate Limiting

- **Requests/Minute:** 60
- **Requests/Stunde:** 1000
- **Burst-Limit:** 10 gleichzeitige Requests

### Retry-Strategie

```javascript
const retryConfig = {
  attempts: 3,
  backoffMs: [1000, 2000, 5000],
  retryOn: [429, 500, 502, 503, 504],
};
```

### Caching-Headers

```http
Cache-Control: public, max-age=300
ETag: "abc123def456"
Last-Modified: Mon, 27 Jan 2026 14:30:00 GMT
```

## 🔍 Fehlerbehandlung

### HTTP-Status-Codes

| Code | Bedeutung    | Aktion                            |
| ---- | ------------ | --------------------------------- |
| 200  | OK           | Erfolgreich                       |
| 304  | Not Modified | Cache verwenden                   |
| 400  | Bad Request  | Parameter prüfen                  |
| 401  | Unauthorized | API-Key prüfen                    |
| 403  | Forbidden    | Berechtigung prüfen               |
| 404  | Not Found    | Endpunkt/Resource nicht vorhanden |
| 429  | Rate Limited | Retry mit Backoff                 |
| 500  | Server Error | Retry mit längerer Pause          |

### Error-Response-Format

```json
{
  "status": "error",
  "error": {
    "code": "INVALID_API_KEY",
    "message": "Der bereitgestellte API-Key ist ungültig oder abgelaufen",
    "details": {
      "provided_key": "abc123...",
      "valid_until": "2026-01-01T00:00:00Z"
    }
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-01-27T14:30:00Z"
  }
}
```

### Häufige Fehler

#### 1. Ungültiger API-Key

```json
{
  "status": "error",
  "error": {
    "code": "INVALID_API_KEY",
    "message": "API-Key ist ungültig oder fehlt"
  }
}
```

**Lösung:** Environment Variable `VITE_FREEDA_API_KEY` prüfen

#### 2. Company UUID nicht gefunden

```json
{
  "status": "error",
  "error": {
    "code": "COMPANY_NOT_FOUND",
    "message": "Firma mit UUID nicht gefunden"
  }
}
```

**Lösung:** `VITE_FREEDA_COMPANY_UUID` validieren

#### 3. Rate Limit erreicht

```json
{
  "status": "error",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Zu viele Requests. Versuchen Sie es später erneut.",
    "retry_after": 60
  }
}
```

**Lösung:** Exponential Backoff implementieren

## 🛠️ Client-Implementation

### Basis-Client (JavaScript)

```javascript
class FreedaApiClient {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.companyUuid = config.companyUuid;
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 10000;
  }

  async fetchNews(options = {}) {
    const url = this.buildUrl("/external/news", options);

    try {
      const response = await this.fetchWithRetry(url);
      return await this.handleResponse(response);
    } catch (error) {
      throw new ApiError(error.message, error);
    }
  }

  buildUrl(endpoint, params = {}) {
    const url = new URL(
      `/company/${this.companyUuid}${endpoint}`,
      this.baseUrl,
    );
    url.searchParams.set("api_key", this.apiKey);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });

    return url.toString();
  }

  async fetchWithRetry(url, maxRetries = 3) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "User-Agent": "Freeda-News-Client/1.0",
          },
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          return response;
        }

        // Bestimmte Status-Codes erneut versuchen
        if (
          [429, 500, 502, 503, 504].includes(response.status) &&
          attempt < maxRetries
        ) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries && error.name !== "AbortError") {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    throw lastError;
  }

  async handleResponse(response) {
    const data = await response.json();

    if (data.status === "error") {
      throw new ApiError(data.error.message, data.error);
    }

    return data;
  }
}

class ApiError extends Error {
  constructor(message, details) {
    super(message);
    this.name = "ApiError";
    this.details = details;
  }
}
```

## 🧪 Testing der API

### Manual Testing

```bash
# Direkte API-Anfrage
curl -X GET "https://api.devel2.freeda.cloud/public/company/9d07193c-f47f-43f3-bdfc-017e3f01eb51/external/news?api_key=YOUR_API_KEY" \
  -H "Accept: application/json"
```

### Automated Testing

```javascript
// Jest/Vitest Test
describe("Freeda API Client", () => {
  test("should fetch news successfully", async () => {
    const client = new FreedaApiClient({
      baseUrl: process.env.VITE_FREEDA_API_BASEURL,
      companyUuid: process.env.VITE_FREEDA_COMPANY_UUID,
      apiKey: process.env.VITE_FREEDA_API_KEY,
    });

    const result = await client.fetchNews();

    expect(result.status).toBe("success");
    expect(result.data).toBeInstanceOf(Array);
    expect(result.data[0]).toHaveProperty("uuid");
    expect(result.data[0]).toHaveProperty("name");
    expect(result.data[0]).toHaveProperty("slug");
  });
});
```

## 📱 Mobile-spezifische Überlegungen

### Bildgrößen für verschiedene Geräte

- **Mobile:** 400px Breite ausreichend
- **Tablet:** 800px für Retina-Displays
- **Desktop:** 1200px für große Screens
- **4K:** 1600px für High-DPI

### Datenvolumen optimieren

- Nur aktive News fetchen (`isActive: 1`)
- Paginierung für große Datasets
- Bildkomprimierung serverseitig
- Adaptive Bildgrößen je nach Viewport

---

**Version:** 1.0  
**Letztes Update:** 27. Januar 2026  
**API-Version:** v1  
**Status:** Produktiv
