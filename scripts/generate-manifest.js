const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const supportedExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".bmp",
  ".svg",
  ".avif"
]);

function firstExistingDirectory(candidates) {
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return candidate;
    }
  }
  return null;
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function listImages(directoryPath) {
  return fs
    .readdirSync(directoryPath, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .filter((entry) => supportedExtensions.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => path.join(directoryPath, entry.name))
    .map((absolutePath) => path.relative(ROOT_DIR, absolutePath))
    .map(toPosixPath);
}

const humanDir = firstExistingDirectory([
  path.join(ROOT_DIR, "assets", "Art", "RealArt"),
  path.join(ROOT_DIR, "assets", "RealArt")
]);

const aiDir = firstExistingDirectory([
  path.join(ROOT_DIR, "assets", "Art", "AiArtData"),
  path.join(ROOT_DIR, "assets", "AiArtData")
]);

if (!humanDir || !aiDir) {
  console.error("Could not find required folders for manifest generation.");
  process.exit(1);
}

const manifest = {
  human: listImages(humanDir),
  ai: listImages(aiDir)
};

if (!manifest.human.length || !manifest.ai.length) {
  console.error("Manifest generation failed because one dataset is empty.");
  process.exit(1);
}

const outputPath = path.join(ROOT_DIR, "image-manifest.json");
fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(`Generated image-manifest.json (human=${manifest.human.length}, ai=${manifest.ai.length})`);
