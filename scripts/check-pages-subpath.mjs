import { createServer } from "node:http";
import {
  cp,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, normalize, relative } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = fileURLToPath(new URL("../", import.meta.url));
const sourceDocsRoot = join(workspaceRoot, "docs");
const repositoryName = "A11y-Repeatable-Fieldset";
const contentTypes = Object.freeze({
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
});

async function collectFiles(directory, root = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(path, root)));
    } else if (entry.isFile()) {
      files.push(relative(root, path).split("\\").join("/"));
    }
  }

  return files;
}

function createStaticServer(root) {
  return createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
      const decodedPath = decodeURIComponent(requestUrl.pathname);
      const normalizedPath = normalize(decodedPath).replace(/^[/\\]+/, "");
      let filePath = join(root, normalizedPath);
      const relativePath = relative(root, filePath);

      if (
        relativePath === ".." ||
        relativePath.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)
      ) {
        response.writeHead(403).end("Forbidden");
        return;
      }

      const fileStats = await stat(filePath);

      if (fileStats.isDirectory()) {
        filePath = join(filePath, "index.html");
      }

      const body = await readFile(filePath);
      response.writeHead(200, {
        "content-type":
          contentTypes[extname(filePath)] ?? "application/octet-stream"
      });
      response.end(body);
    } catch {
      response.writeHead(404).end("Not found");
    }
  });
}

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();

  if (address === null || typeof address === "string") {
    throw new Error("Pages subpath server did not expose a TCP port.");
  }

  return address.port;
}

async function close(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error === undefined) {
        resolve();
      } else {
        reject(error);
      }
    });
  });
}

const temporaryRoot = await mkdtemp(
  join(tmpdir(), "a11y-repeatable-fieldset-pages-")
);
const simulatedRepositoryRoot = join(temporaryRoot, repositoryName);
const server = createStaticServer(temporaryRoot);

try {
  await cp(sourceDocsRoot, simulatedRepositoryRoot, { recursive: true });
  const files = await collectFiles(simulatedRepositoryRoot);
  const port = await listen(server);
  const baseUrl = `http://127.0.0.1:${port}/${repositoryName}/`;
  const urls = [
    baseUrl,
    ...files.map((path) => new URL(path, baseUrl).href)
  ];

  for (const url of urls) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Repository-subpath simulation returned ${response.status} for ${url}.`
      );
    }
  }
} finally {
  if (server.listening) {
    await close(server);
  }

  await rm(temporaryRoot, { recursive: true, force: true });
}
