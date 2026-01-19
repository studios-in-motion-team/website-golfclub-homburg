#!/usr/bin/env node
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";

const execFileP = promisify(execFile);

async function runPrebuild() {
  console.log("Running prebuild...");
  try {
    const { stdout, stderr } = await execFileP(
      "node",
      ["scripts/prebuild.js"],
      { cwd: process.cwd() },
    );
    if (stdout) console.log(stdout.trim());
    if (stderr) console.error(stderr.trim());
  } catch (err) {
    console.error("prebuild process failed:", err);
    throw err;
  }
}

async function assertFileExists(rel) {
  const p = path.resolve(process.cwd(), rel);
  if (!fsSync.existsSync(p)) {
    throw new Error(`Missing expected file: ${rel}`);
  }
  const stat = await fs.stat(p);
  if (stat.size === 0) {
    throw new Error(`File ${rel} is empty`);
  }
  console.log(`OK: ${rel} (${stat.size} bytes)`);
}

async function main() {
  try {
    await runPrebuild();
    await assertFileExists("content/freeda-news.json");
    await assertFileExists("public/sitemap.xml");
    await assertFileExists("public/robots.txt");
    console.log("Smoke test passed. Prebuild generated expected files.");
    process.exit(0);
  } catch (err) {
    console.error("Smoke test failed:", err.message || err);
    process.exit(2);
  }
}

main();
