// Freeda API Client
// Simple helper to fetch news from the Freeda CMS API
// Features:
// - Environment variable configuration
// - Retry logic with exponential backoff
// - Response transformation and validation
// - Error handling with meaningful messages

import "dotenv/config";

// Environment configuration
const BASE_URL = process.env.VITE_FREEDA_API_BASEURL;
const COMPANY_UUID = process.env.VITE_FREEDA_COMPANY_UUID;
const API_KEY = process.env.VITE_FREEDA_API_KEY;

/**
 * Builds the API endpoint URL
 */
function buildEndpoint() {
  if (!BASE_URL || !COMPANY_UUID) {
    throw new Error(
      "Missing Freeda configuration: VITE_FREEDA_API_BASEURL or VITE_FREEDA_COMPANY_UUID not set in environment",
    );
  }
  return `${BASE_URL.replace(/\/$/, "")}/company/${COMPANY_UUID}/external/news`;
}

/**
 * Sleep utility for retry delays
 */
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with retry logic and exponential backoff
 */
async function fetchWithRetry(url, options = {}, retries = 2, backoff = 300) {
  // Ensure fetch is available (Node 18+)
  if (typeof fetch !== "function") {
    throw new Error(
      "Global fetch is not available. Use Node 18+ or provide a fetch polyfill.",
    );
  }

  try {
    console.log(`🌐 Fetching: ${url} (${retries + 1} attempts left)`);
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
    console.warn(`⚠️  Fetch failed: ${err.message}`);

    if (retries > 0) {
      console.log(`🔄 Retrying in ${backoff}ms...`);
      await sleep(backoff);
      return fetchWithRetry(
        url,
        options,
        retries - 1,
        Math.min(backoff * 2, 2000), // Cap at 2 seconds
      );
    }
    throw err;
  }
}

/**
 * Fetches news from the Freeda API and returns transformed items
 *
 * @param {Object} options - Configuration options
 * @param {boolean} options.onlyActive - Filter for active news only (default: true)
 * @param {number} options.retries - Number of retry attempts (default: 2)
 * @returns {Promise<Array>} Array of news items
 */
export async function fetchFreedaNews({ onlyActive = true, retries = 2 } = {}) {
  const url = buildEndpoint();
  const headers = {
    Accept: "application/json",
    "User-Agent": "Freeda-News-Client/1.0",
  };

  // Add API key if available
  if (API_KEY) {
    headers["Authorization"] = `Bearer ${API_KEY}`;
  } else {
    console.warn("⚠️  No API key found. Some endpoints might be restricted.");
  }

  // Fetch data with retry logic
  const json = await fetchWithRetry(url, { headers }, retries);

  // Validate response structure
  if (!json || typeof json !== "object") {
    throw new Error("Invalid API response: Expected JSON object");
  }

  if (!Array.isArray(json.data)) {
    throw new Error("Invalid Freeda API response: `data` array missing");
  }

  console.log(`📄 Raw API response contains ${json.data.length} items`);

  // Transform API response to internal format
  const items = json.data
    .map((item, index) => {
      try {
        return {
          uuid: item.uuid,
          name: item.name,
          slug: item.slug,
          textShort: item.textShort || null,
          text: {
            html: item.text?.html || null,
            md: item.text?.md || null,
          },
          // Legacy compatibility
          textHtml: item.text?.html || null,
          textMd: item.text?.md || null,

          isActive: Boolean(Number(item.isActive)),
          isHighlighted: Boolean(Number(item.isHighlighted)),
          created: item.created || null,
          updated: item.updated || null,
          media: item.media || null,

          // Store raw item for debugging
          raw: item,
        };
      } catch (transformError) {
        console.warn(
          `⚠️  Error transforming item ${index}:`,
          transformError.message,
        );
        return null;
      }
    })
    .filter(Boolean); // Remove failed transformations

  console.log(`✅ Transformed ${items.length} valid news items`);

  // Filter active items if requested
  const result = onlyActive ? items.filter((i) => i.isActive) : items;

  if (onlyActive && result.length < items.length) {
    console.log(`🔍 Filtered to ${result.length} active items`);
  }

  return result;
}

/**
 * Validates required environment variables
 */
export function validateConfig() {
  const missing = [];

  if (!BASE_URL) missing.push("VITE_FREEDA_API_BASEURL");
  if (!COMPANY_UUID) missing.push("VITE_FREEDA_COMPANY_UUID");
  if (!API_KEY) missing.push("VITE_FREEDA_API_KEY");

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }

  return true;
}

/**
 * Gets current configuration (useful for debugging)
 */
export function getConfig() {
  return {
    baseUrl: BASE_URL,
    companyUuid: COMPANY_UUID,
    hasApiKey: Boolean(API_KEY),
    endpoint: BASE_URL && COMPANY_UUID ? buildEndpoint() : null,
  };
}

// Default export for compatibility
export default { fetchFreedaNews, buildEndpoint, validateConfig, getConfig };
