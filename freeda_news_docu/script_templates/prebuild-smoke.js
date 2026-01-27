#!/usr/bin/env node
// Prebuild Smoke Test
// Validates that the prebuild process generates all expected files
// Usage: node scripts/prebuild-smoke.js

import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";

const execFileP = promisify(execFile);

/**
 * Runs the prebuild script and captures output
 */
async function runPrebuild() {
  console.log("🔄 Running prebuild script...");
  try {
    const { stdout, stderr } = await execFileP(
      "node",
      ["scripts/prebuild.js"],
      { 
        cwd: process.cwd(),
        timeout: 60000 // 1 minute timeout
      }
    );
    
    if (stdout) console.log("📤 STDOUT:", stdout.trim());
    if (stderr) console.warn("⚠️  STDERR:", stderr.trim());
    
    console.log("✅ Prebuild script completed");
  } catch (err) {
    console.error("❌ Prebuild process failed:", err.message);
    if (err.stdout) console.log("Last STDOUT:", err.stdout.trim());
    if (err.stderr) console.error("Last STDERR:", err.stderr.trim());
    throw err;
  }
}

/**
 * Checks if a file exists and is not empty
 */
async function assertFileExists(relativePath, minSize = 1) {
  const fullPath = path.resolve(process.cwd(), relativePath);
  
  if (!fsSync.existsSync(fullPath)) {
    throw new Error(`Missing expected file: ${relativePath}`);
  }
  
  const stat = await fs.stat(fullPath);
  if (stat.size < minSize) {
    throw new Error(`File ${relativePath} is too small (${stat.size} bytes, expected at least ${minSize})`);
  }
  
  console.log(`✅ ${relativePath} (${stat.size} bytes)`);
  return stat;
}

/**
 * Validates the content structure of freeda-news.json
 */
async function validateNewsJson() {
  const newsPath = path.resolve(process.cwd(), "content/freeda-news.json");
  
  try {
    const content = await fs.readFile(newsPath, 'utf-8');
    const newsData = JSON.parse(content);
    
    if (!Array.isArray(newsData)) {
      throw new Error("freeda-news.json should contain an array");
    }
    
    console.log(`📰 News data contains ${newsData.length} items`);
    
    // Validate structure of first item if exists
    if (newsData.length > 0) {
      const firstItem = newsData[0];
      const requiredFields = ['uuid', 'name', 'slug', 'created'];
      
      for (const field of requiredFields) {
        if (!firstItem[field]) {
          throw new Error(`First news item missing required field: ${field}`);
        }
      }
      
      console.log(`✅ News structure validation passed`);
    }
    
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error("freeda-news.json not found");
    }
    throw new Error(`Invalid news JSON: ${err.message}`);
  }
}

/**
 * Validates the sitemap XML structure
 */
async function validateSitemap() {
  const sitemapPath = path.resolve(process.cwd(), "public/sitemap.xml");
  
  try {
    const content = await fs.readFile(sitemapPath, 'utf-8');
    
    // Basic XML validation
    if (!content.includes('<?xml version="1.0"')) {
      throw new Error("Sitemap missing XML declaration");
    }
    
    if (!content.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) {
      throw new Error("Sitemap missing proper urlset declaration");
    }
    
    // Count URLs
    const urlMatches = content.match(/<url>/g);
    const urlCount = urlMatches ? urlMatches.length : 0;
    
    if (urlCount === 0) {
      throw new Error("Sitemap contains no URLs");
    }
    
    console.log(`🗺️  Sitemap contains ${urlCount} URLs`);
    
    // Check for news URLs
    if (content.includes('<loc>/news/')) {
      console.log(`✅ Sitemap includes news URLs`);
    } else {
      console.warn("⚠️  No news URLs found in sitemap");
    }
    
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error("sitemap.xml not found");
    }
    throw new Error(`Invalid sitemap: ${err.message}`);
  }
}

/**
 * Validates robots.txt content
 */
async function validateRobots() {
  const robotsPath = path.resolve(process.cwd(), "public/robots.txt");
  
  try {
    const content = await fs.readFile(robotsPath, 'utf-8');
    
    if (!content.includes('User-agent:')) {
      throw new Error("robots.txt missing User-agent directive");
    }
    
    if (!content.includes('Sitemap:')) {
      throw new Error("robots.txt missing Sitemap directive");
    }
    
    console.log(`🤖 robots.txt validation passed`);
    
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error("robots.txt not found");
    }
    throw new Error(`Invalid robots.txt: ${err.message}`);
  }
}

/**
 * Checks if any freedaimg_* assets were created
 */
async function validateAssets() {
  const assetsDir = path.resolve(process.cwd(), "src/assets");
  
  try {
    if (!fsSync.existsSync(assetsDir)) {
      console.log("📁 No assets directory found (no images downloaded)");
      return;
    }
    
    const files = await fs.readdir(assetsDir);
    const freedaImages = files.filter(f => f.startsWith('freedaimg_'));
    
    if (freedaImages.length > 0) {
      console.log(`🖼️  Found ${freedaImages.length} downloaded images`);
      
      // Check a sample image
      const sampleImage = path.join(assetsDir, freedaImages[0]);
      const stat = await fs.stat(sampleImage);
      if (stat.size > 0) {
        console.log(`✅ Sample image ${freedaImages[0]} (${stat.size} bytes)`);
      }
    } else {
      console.log("📁 No freedaimg_* assets found (no remote images in news)");
    }
    
  } catch (err) {
    console.warn("⚠️  Could not validate assets:", err.message);
  }
}

/**
 * Main smoke test function
 */
async function main() {
  console.log("🧪 Starting prebuild smoke test...");
  
  try {
    // Run the prebuild script
    await runPrebuild();
    
    // Validate essential files exist
    console.log("\n📋 Checking file existence...");
    await assertFileExists("content/freeda-news.json", 10); // At least 10 bytes
    await assertFileExists("public/sitemap.xml", 100);      // At least 100 bytes
    await assertFileExists("public/robots.txt", 20);        // At least 20 bytes
    
    // Validate file contents
    console.log("\n🔍 Validating file contents...");
    await validateNewsJson();
    await validateSitemap();
    await validateRobots();
    await validateAssets();
    
    console.log("\n🎉 Smoke test passed! All prebuild artifacts are valid.");
    console.log("\n📊 Summary:");
    console.log("   ✅ Prebuild script executed successfully");
    console.log("   ✅ News data cache file created");
    console.log("   ✅ Sitemap generated with URLs");
    console.log("   ✅ Robots.txt created");
    console.log("   ✅ Assets processed (if any)");
    
    process.exit(0);
    
  } catch (error) {
    console.error("\n❌ Smoke test failed:", error.message);
    console.error("\n🚨 This indicates a problem with the prebuild process.");
    console.error("   Check the prebuild script and API configuration.");
    
    process.exit(2);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}