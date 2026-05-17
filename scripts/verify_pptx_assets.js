#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith("--")) throw new Error(`Unexpected argument: ${key}`);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      args[key.slice(2)] = true;
    } else {
      args[key.slice(2)] = value;
      i += 1;
    }
  }
  return args;
}

function requireArg(args, key) {
  if (!args[key]) throw new Error(`Missing --${key}`);
  return args[key];
}

function resolveJsZip() {
  const candidates = [
    "jszip",
    "C:/Users/31044/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/jszip@3.10.1/node_modules/jszip",
  ];
  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch {
      // Try next known runtime location.
    }
  }
  throw new Error("Unable to load jszip. Install jszip or run inside the Codex bundled runtime.");
}

function countMatches(text, regex) {
  return (text.match(regex) || []).length;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const pptxPath = path.resolve(requireArg(args, "pptx"));
  const assetDir = path.resolve(requireArg(args, "asset-dir"));
  const manifestPath = args.manifest ? path.resolve(args.manifest) : undefined;
  const expectedSlides = args["expected-slides"] ? Number(args["expected-slides"]) : undefined;
  const expectedSvg = args["expected-svg"] ? Number(args["expected-svg"]) : undefined;
  const sourceName = args["source-name"] ? String(args["source-name"]) : undefined;

  if (!fs.existsSync(pptxPath)) throw new Error(`PPTX not found: ${pptxPath}`);
  if (!fs.existsSync(assetDir)) throw new Error(`Asset directory not found: ${assetDir}`);

  const JSZip = resolveJsZip();
  const pptxBytes = fs.statSync(pptxPath).size;
  const zip = await JSZip.loadAsync(fs.readFileSync(pptxPath));
  const files = Object.keys(zip.files);
  const slideFiles = files.filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f));
  const mediaFiles = files.filter((f) => f.startsWith("ppt/media/"));
  const embeddedSvg = mediaFiles.filter((f) => f.toLowerCase().endsWith(".svg"));
  const sourceEmbedded = sourceName
    ? mediaFiles.some((f) => f.includes(sourceName)) ||
      (await Promise.all(slideFiles.map((f) => zip.file(f).async("string")))).some((xml) => xml.includes(sourceName))
    : false;

  const assetSvgs = fs.readdirSync(assetDir).filter((f) => f.toLowerCase().endsWith(".svg"));
  let manifestCount;
  if (manifestPath) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    manifestCount = Array.isArray(manifest) ? manifest.length : Object.keys(manifest).length;
  }

  let editableShapes = 0;
  let editableTextRuns = 0;
  for (const slideFile of slideFiles) {
    const xml = await zip.file(slideFile).async("string");
    editableShapes += countMatches(xml, /<p:sp/g);
    editableTextRuns += countMatches(xml, /<a:t>/g);
  }

  const report = {
    pptx: pptxPath,
    pptxBytes,
    slideCount: slideFiles.length,
    outputSvgFiles: assetSvgs.length,
    manifestAssets: manifestCount,
    embeddedSvg: embeddedSvg.length,
    embeddedMedia: mediaFiles.length,
    editableShapes,
    editableTextRuns,
    sourceImageEmbedded: sourceEmbedded,
  };

  const failures = [];
  if (pptxBytes <= 0) failures.push("PPTX is empty.");
  if (expectedSlides !== undefined && slideFiles.length !== expectedSlides) {
    failures.push(`Expected ${expectedSlides} slide(s), found ${slideFiles.length}.`);
  }
  if (expectedSvg !== undefined && assetSvgs.length !== expectedSvg) {
    failures.push(`Expected ${expectedSvg} SVG file(s), found ${assetSvgs.length}.`);
  }
  if (expectedSvg !== undefined && embeddedSvg.length !== expectedSvg) {
    failures.push(`Expected ${expectedSvg} embedded SVG(s), found ${embeddedSvg.length}.`);
  }
  if (manifestCount !== undefined && manifestCount !== assetSvgs.length) {
    failures.push(`Manifest count ${manifestCount} does not match SVG files ${assetSvgs.length}.`);
  }
  if (sourceEmbedded) failures.push("Original source image appears embedded in PPTX.");
  if (editableShapes === 0) failures.push("No editable PPT shapes detected.");
  if (editableTextRuns === 0) failures.push("No editable PPT text runs detected.");

  console.log(JSON.stringify({ ok: failures.length === 0, failures, report }, null, 2));
  if (failures.length) process.exit(1);
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
