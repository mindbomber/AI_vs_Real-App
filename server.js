const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = __dirname;
const ASSETS_DIR = path.join(ROOT_DIR, "assets");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif"
};

const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".bmp",
  ".svg",
  ".avif"
]);

function pickFirstExistingDirectory(candidates) {
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return candidate;
    }
  }
  return null;
}

function toUrlPath(absolutePath) {
  const relativePath = path.relative(ROOT_DIR, absolutePath);
  const urlPath = relativePath
    .split(path.sep)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `/${urlPath}`;
}

function listImageUrls(directoryPath) {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile());

  return files
    .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file.name).toLowerCase()))
    .map((file) => path.join(directoryPath, file.name))
    .map(toUrlPath);
}

function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

const realDirectory = pickFirstExistingDirectory([
  path.join(ASSETS_DIR, "Art", "RealArt"),
  path.join(ASSETS_DIR, "RealArt")
]);

const aiDirectory = pickFirstExistingDirectory([
  path.join(ASSETS_DIR, "Art", "AiArtData"),
  path.join(ASSETS_DIR, "AiArtData")
]);

if (!realDirectory || !aiDirectory) {
  console.error("Could not find the required image folders:");
  console.error("- assets/Art/RealArt (or assets/RealArt)");
  console.error("- assets/Art/AiArtData (or assets/AiArtData)");
  process.exit(1);
}

const realImages = listImageUrls(realDirectory);
const aiImages = listImageUrls(aiDirectory);

if (!realImages.length || !aiImages.length) {
  console.error("One or both image folders do not contain supported image files.");
  process.exit(1);
}

function chooseNextImage() {
  const source = Math.random() < 0.5 ? "human" : "ai";
  const imageUrl = source === "human" ? randomFrom(realImages) : randomFrom(aiImages);

  return {
    imageUrl,
    source
  };
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": MIME_TYPES[".json"] });
  response.end(JSON.stringify(payload));
}

function sendFile(response, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || "application/octet-stream";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Not found");
        return;
      }

      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Internal server error");
      return;
    }

    response.writeHead(200, { "Content-Type": contentType });
    response.end(content);
  });
}

function resolveSafePath(pathname) {
  const decodedPath = decodeURIComponent(pathname);
  const joinedPath = path.join(ROOT_DIR, decodedPath);
  const normalizedPath = path.normalize(joinedPath);

  if (!normalizedPath.startsWith(ROOT_DIR)) {
    return null;
  }

  return normalizedPath;
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || HOST}`);
  const { pathname } = requestUrl;

  if (request.method === "GET" && pathname === "/api/next-image") {
    sendJson(response, 200, chooseNextImage());
    return;
  }

  if (request.method !== "GET") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  const routePath = pathname === "/" ? "/public/index.html" : pathname;
  const resolvedPath = resolveSafePath(routePath);

  if (!resolvedPath) {
    sendJson(response, 403, { error: "Forbidden" });
    return;
  }

  sendFile(response, resolvedPath);
});

server.listen(PORT, HOST, () => {
  console.log(`AI vs Real app running at http://${HOST}:${PORT}`);
  console.log(`Human images loaded: ${realImages.length}`);
  console.log(`AI images loaded: ${aiImages.length}`);
});
