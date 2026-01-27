#!/usr/bin/env node
// Freeda News Prebuild-Skript
// Lädt News aus der Freeda API, lädt Bilder herunter und generiert eine Sitemap
// Verwendung: node scripts/prebuild.js

import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { fetchFreedaNews } from "../src/utils/freeda-api-client.js";
import fsSync from "fs";
import crypto from "node:crypto";
import { pipeline } from "node:stream/promises";
import sizeOf from "image-size";

/**
 * Downloads external images and stores them as freedaimg_* assets
 * This enables full Astro optimization with WebP conversion
 */
async function downloadExternalImages(items) {
  const outDir = path.resolve(process.cwd(), "src/assets");
  await fs.mkdir(outDir, { recursive: true });

  for (const item of items) {
    const url = item.media?.url;
    if (!url) continue;

    try {
      let outPath = null;

      // Download remote images and store with freedaimg_ prefix
      if (/^https?:\/\//i.test(url)) {
        const hash = crypto
          .createHash("sha1")
          .update(url)
          .digest("hex")
          .slice(0, 16);
        const ext = path.extname(new URL(url).pathname) || ".jpg";
        const filename = `freedaimg_${hash}${ext}`;
        outPath = path.join(outDir, filename);

        // Download if not already exists
        if (!fsSync.existsSync(outPath)) {
          const res = await fetch(url);
          if (!res.ok) {
            console.warn(`Failed to download ${url}: ${res.status}`);
            continue;
          }

          const dest = await fs.open(outPath, "w");
          await pipeline(res.body, dest.createWriteStream());
          await dest.close();
          console.log(`Downloaded: ${url} → ${filename}`);
        }

        // Update URL to point to local asset (Astro-compatible)
        item.media.url = `~/assets/${filename}`;
      }

      // Check if asset already exists locally
      if (item.media.url && item.media.url.startsWith("~/assets/freedaimg_")) {
        const localPath = path.resolve(
          process.cwd(),
          "src/assets",
          item.media.url.replace(/^~\/assets\//, ""),
        );
        if (fsSync.existsSync(localPath)) outPath = localPath;
      }

      // Measure image dimensions for layout-shift prevention
      if (outPath && fsSync.existsSync(outPath)) {
        try {
          const buffer = fsSync.readFileSync(outPath);
          const dims = sizeOf(buffer);
          if (!item.media) item.media = {};
          if (dims && dims.width && dims.height) {
            item.media.width = dims.width;
            item.media.height = dims.height;
          }
        } catch (err) {
          console.warn(
            `Could not measure dimensions for ${outPath}:`,
            err.message,
          );
        }
      }
    } catch (err) {
      console.warn(`Error processing media for ${url}:`, err?.message || err);
    }
  }
}

/**
 * Converts file path from src/pages to URL path
 */
function pagePathToUrl(filePath) {
  const rel = path.relative(path.resolve(process.cwd(), "src/pages"), filePath);
  const noExt = rel.replace(/\.(astro|md|mdx|html)$/, "");

  if (noExt === "index") return "/";
  if (noExt.endsWith("/index")) {
    return "/" + noExt.replace(/\/index$/, "") + "/";
  }
  return "/" + noExt.replace(/\\/g, "/");
}

/**
 * Collects all static pages from src/pages for sitemap generation
 */
async function collectStaticPages() {
  const pagesDir = path.resolve(process.cwd(), "src/pages");
  const results = [];

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);

      if (e.isDirectory()) {
        // Skip private or component directories
        if (
          e.name.startsWith("_") ||
          e.name === "components" ||
          e.name === "layouts"
        )
          continue;
        await walk(full);
      } else if (e.isFile()) {
        // Only include page files
        if (!/\.(astro|md|mdx|html)$/.test(e.name)) continue;
        // Skip dynamic routes (contain brackets)
        if (full.includes("[") || full.includes("]")) continue;
        // Skip private files
        if (e.name.startsWith("_")) continue;

        const url = pagePathToUrl(full);
        try {
          const stat = await fs.stat(full);
          results.push({
            loc: url,
            lastmod: stat.mtime.toISOString(),
          });
        } catch (err) {
          // Ignore stat errors
        }
      }
    }
  }

  if (fsSync.existsSync(pagesDir)) {
    await walk(pagesDir);
  }
  return results;
}

/**
 * Generates XML sitemap with static pages and news articles
 */
async function generateSitemap(newsItems) {
  const domain = process.env.VITE_SITEMAP_DOMAIN?.trim();
  const base = domain ? domain.replace(/\/$/, "") : "";

  // News URLs from fetched items
  const newsUrls = newsItems.map((item) => ({
    loc: `/news/${item.slug}`,
    lastmod: item.created
      ? new Date(item.created).toISOString()
      : new Date().toISOString(),
  }));

  // Static pages from filesystem
  const staticPages = await collectStaticPages();

  // Merge and deduplicate by location
  const urlMap = new Map();
  [...staticPages, ...newsUrls].forEach((url) => urlMap.set(url.loc, url));
  const allUrls = Array.from(urlMap.values());

  // Generate XML sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map((url) => {
    const loc = base ? `${base}${url.loc}` : url.loc;
    return `  <url><loc>${loc}</loc><lastmod>${url.lastmod}</lastmod></url>`;
  })
  .join("\n")}
</urlset>`;

  // Write sitemap and robots.txt
  const publicDir = path.resolve(process.cwd(), "public");
  await fs.mkdir(publicDir, { recursive: true });

  await fs.writeFile(path.join(publicDir, "sitemap.xml"), sitemap);

  const robots = `User-agent: *
Allow: /
Sitemap: ${base ? base + "/sitemap.xml" : "/sitemap.xml"}
`;
  await fs.writeFile(path.join(publicDir, "robots.txt"), robots);

  console.log(`✅ Sitemap generated with ${allUrls.length} URLs`);
}

/**
 * Main prebuild function
 */
async function main() {
  console.log("🚀 Starting Freeda News prebuild...");

  try {
    // Fetch news from Freeda API
    console.log("📡 Fetching news from Freeda API...");
    const items = await fetchFreedaNews({ onlyActive: true, retries: 3 });
    console.log(`✅ Fetched ${items.length} news items`);

    // Download and process images
    console.log("🖼️  Processing images...");
    await downloadExternalImages(items);

    // Save news data as cache file
    const contentDir = path.resolve(process.cwd(), "content");
    await fs.mkdir(contentDir, { recursive: true });
    await fs.writeFile(
      path.join(contentDir, "freeda-news.json"),
      JSON.stringify(items, null, 2),
    );
    console.log("✅ News cache file written: content/freeda-news.json");

    // Generate sitemap
    console.log("🗺️  Generating sitemap...");
    await generateSitemap(items);

    console.log("🎉 Prebuild completed successfully!");

    // Print summary
    const imageCount = items.filter((item) => item.media?.url).length;
    console.log(`
📊 Summary:
   • ${items.length} news articles processed
   • ${imageCount} images downloaded and optimized
   • Sitemap generated with static pages and news
   • Cache file ready for Astro build
`);
  } catch (error) {
    console.error("❌ Prebuild failed:", error);
    console.error("Stack:", error.stack);
    process.exitCode = 1;
  }
}

// Run the main function
main();
