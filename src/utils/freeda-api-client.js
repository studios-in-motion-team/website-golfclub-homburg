// Freeda API Client
// Simple helper to fetch news from the Freeda CMS API
// - Reads configuration from environment variables
// - Implements a basic retry/backoff
// - Transforms the API response into a lightweight internal shape

// Load .env for development so local .env values are available to the dev server
import "dotenv/config";

const BASE_URL = process.env.VITE_FREEDA_API_BASEURL;
const COMPANY_UUID = process.env.VITE_FREEDA_COMPANY_UUID;
const API_KEY = process.env.VITE_FREEDA_API_KEY;

function buildEndpoint() {
  if (!BASE_URL || !COMPANY_UUID) {
    throw new Error(
      "Missing Freeda configuration: VITE_FREEDA_API_BASEURL or VITE_FREEDA_COMPANY_UUID not set in environment",
    );
  }
  return `${BASE_URL.replace(/\/$/, "")}/company/${COMPANY_UUID}/external/news`;
}

async function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function fetchWithRetry(url, options = {}, retries = 2, backoff = 300) {
  // Use global fetch - ensure Node version supports it (Node 18+)
  if (typeof fetch !== "function") {
    throw new Error(
      "Global fetch is not available in this environment. Use Node 18+ or provide a fetch polyfill.",
    );
  }

  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const err = new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
      err.status = res.status;
      throw err;
    }
    const json = await res.json();
    return json;
  } catch (err) {
    if (retries > 0) {
      await sleep(backoff);
      return fetchWithRetry(
        url,
        options,
        retries - 1,
        Math.min(backoff * 2, 2000),
      );
    }
    throw err;
  }
}

/**
 * Fetches news from the Freeda API and returns an array of transformed items.
 * Options:
 * - onlyActive: boolean (default true)
 * - retries: number (default 2)
 */
export async function fetchFreedaNews({ onlyActive = true, retries = 2 } = {}) {
  const url = buildEndpoint();
  const headers = {
    Accept: "application/json",
  };
  if (API_KEY) {
    headers["Authorization"] = `Bearer ${API_KEY}`;
  }

  const json = await fetchWithRetry(url, { headers }, retries);

  if (!json || !Array.isArray(json.data)) {
    throw new Error("Invalid Freeda API response: `data` array missing");
  }

  const items = json.data.map((item) => ({
    uuid: item.uuid,
    name: item.name,
    slug: item.slug,
    textShort: item.textShort || null,
    textHtml: item.text?.html || null,
    textMd: item.text?.md || null,
    isActive: Boolean(Number(item.isActive)),
    isHighlighted: Boolean(Number(item.isHighlighted)),
    created: item.created || null,
    media: item.media || null,
    raw: item,
  }));

  return onlyActive ? items.filter((i) => i.isActive) : items;
}

export default { fetchFreedaNews, buildEndpoint };
