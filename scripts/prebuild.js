#!/usr/bin/env node
import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { fetchFreedaNews } from "../src/utils/freeda-api-client.js";
import fsSync from "fs";

// Helper: map src/pages file path to site URL path
function pagePathToUrl(filePath) {
  // filePath is absolute; make it relative to src/pages
  const rel = path.relative(path.resolve(process.cwd(), "src/pages"), filePath);
  // remove extensions
  const noExt = rel.replace(/\.(astro|md|mdx|html)$/, "");
  // index -> directory root
  if (noExt === "index") return "/";
  if (noExt.endsWith("/index"))
    return "/" + noExt.replace(/\/index$/, "") + "/";
  return "/" + noExt.replace(/\\/g, "/");
}

// Collect static pages from src/pages
async function collectStaticPages() {
  const pagesDir = path.resolve(process.cwd(), "src/pages");
  const results = [];

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        // skip _private or components folders
        if (
          e.name.startsWith("_") ||
          e.name === "components" ||
          e.name === "layouts"
        )
          continue;
        await walk(full);
      } else if (e.isFile()) {
        if (!/\.(astro|md|mdx|html)$/.test(e.name)) continue;
        // skip dynamic routes with [
        if (full.includes("[") || full.includes("]")) continue;
        // skip special files
        if (e.name.startsWith("_")) continue;
        // map to url
        const url = pagePathToUrl(full);
        try {
          const stat = await fs.stat(full);
          results.push({ loc: url, lastmod: stat.mtime.toISOString() });
        } catch (err) {
          // ignore stat errors
        }
      }
    }
  }

  if (fsSync.existsSync(pagesDir)) {
    await walk(pagesDir);
  }
  return results;
}

async function main() {
  try {
    const items = await fetchFreedaNews({ onlyActive: true, retries: 2 });
    const contentDir = path.resolve(process.cwd(), "content");
    await fs.mkdir(contentDir, { recursive: true });
    await fs.writeFile(
      path.join(contentDir, "freeda-news.json"),
      JSON.stringify(items, null, 2),
    );

    // Build sitemap
    const domain =
      process.env.VITE_SITEMAP_DOMAIN &&
      String(process.env.VITE_SITEMAP_DOMAIN).trim();
    const base = domain ? domain.replace(/\/$/, "") : "";
    const newsUrls = items.map((i) => ({
      loc: `/news/${i.slug}`,
      lastmod: i.created
        ? new Date(i.created).toISOString()
        : new Date().toISOString(),
    }));

    const staticPages = await collectStaticPages();

    // Merge and dedupe by loc
    const map = new Map();
    staticPages.concat(newsUrls).forEach((u) => map.set(u.loc, u));
    const urls = Array.from(map.values());
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((u) => {
        const loc = base ? `${base}${u.loc}` : u.loc;
        return `  <url><loc>${loc}</loc><lastmod>${u.lastmod}</lastmod></url>`;
      })
      .join("\n")}\n</urlset>`;
    await fs.mkdir(path.resolve(process.cwd(), "public"), { recursive: true });
    await fs.writeFile(
      path.resolve(process.cwd(), "public/sitemap.xml"),
      sitemap,
    );

    // Optional: Write robots.txt pointing to sitemap
    const robots = `User-agent: *\nAllow: /\nSitemap: ${base ? base + "/sitemap.xml" : "/sitemap.xml"}\n`;
    await fs.writeFile(
      path.resolve(process.cwd(), "public/robots.txt"),
      robots,
    );

    console.log(
      "prebuild: wrote content/freeda-news.json and public/sitemap.xml",
    );
  } catch (e) {
    console.error("prebuild failed:", e);
    process.exitCode = 1;
  }
}

main();
