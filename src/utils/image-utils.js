import * as fs from "fs";
import * as path from "path";
import sizeOf from "image-size";

/**
 * Helper to find the asset import for a Freeda image URL.
 * Works by matching the filename against the keys in the glob object.
 */
export function getAssetImport(url, freedaImages) {
  if (
    !url ||
    typeof url !== "string" ||
    !url.startsWith("~/assets/freedaimg_")
  )
    return null;
  const filename = url.replace("~/assets/", "");

  // Find the key that ends with the filename
  const key = Object.keys(freedaImages).find((k) =>
    k.endsWith(filename),
  );
  if (!key) return null;

  return freedaImages[key]?.default || null;
}

/**
 * Ensures that local Freeda images have width and height metadata
 * by reading the files from disk if dimensions are missing.
 */
export function ensureLocalImageSizes(items) {
  if (!Array.isArray(items)) return;
  for (const it of items) {
    try {
      const m = it?.media?.url;
      if (
        m &&
        typeof m === "string" &&
        m.startsWith("~/assets/freedaimg_") &&
        (!it.media?.width || !it.media?.height)
      ) {
        const local = path.resolve(
          process.cwd(),
          "src/assets",
          m.replace(/^~\/assets\//, ""),
        );
        if (fs.existsSync(local)) {
          try {
            const d = sizeOf(local);
            if (d?.width && d?.height) {
              if (!it.media) it.media = {};
              it.media.width = d.width;
              it.media.height = d.height;
            }
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (e) {
      // ignore per-item failures
    }
  }
}
