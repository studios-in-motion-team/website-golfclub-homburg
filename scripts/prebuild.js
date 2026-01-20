#!/usr/bin/env node
import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { fetchFreedaNews } from "../src/utils/freeda-api-client.js";
import fsSync from "fs";
import crypto from "node:crypto";
import { pipeline } from "node:stream/promises";
import sizeOf from "image-size";

async function downloadExternalImages(items) {
  const outDir = path.resolve(process.cwd(), "src/assets");
  await fs.mkdir(outDir, { recursive: true });

  for (const item of items) {
    const url = item.media?.url;
    if (!url) continue;

    try {
      let outPath = null;

      // If remote, download to outDir and rewrite URL
      if (/^https?:\/\//i.test(url)) {
        const hash = crypto
          .createHash("sha1")
          .update(url)
          .digest("hex")
          .slice(0, 16);
        const ext = path.extname(new URL(url).pathname) || ".jpg";
        const filename = `freedaimg_${hash}${ext}`;
        outPath = path.join(outDir, filename);

        if (!fsSync.existsSync(outPath)) {
          const res = await fetch(url);
          if (!res.ok) {
            console.warn(`Failed to download ${url}: ${res.status}`);
          } else {
            const dest = await fs.open(outPath, "w");
            await pipeline(res.body, dest.createWriteStream());
            await dest.close();
            console.log(`downloaded ${url} -> ${outPath}`);
          }
        }

        item.media.url = `~/assets/${filename}`;
      }

      // If the media URL already points to assets, compute local path
      if (item.media.url && item.media.url.startsWith("~/assets/freedaimg_")) {
        const localPath = path.resolve(
          process.cwd(),
          "src/assets",
          item.media.url.replace(/^~\/assets\//, ""),
        );
        if (fsSync.existsSync(localPath)) outPath = localPath;
      }

      // If we have a local file, measure dimensions and store them
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
          // not fatal
        }
      }
    } catch (err) {
      console.warn(
        "Error downloading or sizing media",
        url,
        err?.message || err,
      );
    }
  }
}

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

    // Download external media and rewrite URLs to local uploads
    await downloadExternalImages(items);
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
