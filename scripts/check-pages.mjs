import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { pagesAssetCopies, verifyPageAssetSources } from "./pages-assets.mjs";

const workspaceRoot = fileURLToPath(new URL("../", import.meta.url));
const docsRoot = new URL("docs/", `file://${workspaceRoot}`);
const siteRoot = new URL(
  "https://vmitsaras.github.io/A11y-Repeatable-Fieldset/"
);
const socialImageUrl = new URL("assets/social-preview.png", siteRoot).href;
const allowedExternalUrls = new Set([
  "https://github.com/vmitsaras/",
  "https://github.com/vmitsaras/A11y-Repeatable-Fieldset",
  "https://linkedin.com/in/vasilis-mitsaras"
]);

function getRequiredMatch(markup, pattern, description, page) {
  const match = markup.match(pattern);

  if (match?.[1] === undefined || match[1].trim() === "") {
    throw new Error(`${page} is missing ${description}.`);
  }

  return match[1];
}

function getExpectedCanonical(page) {
  const relativePath = decodeURIComponent(
    page.pathname.slice(docsRoot.pathname.length)
  );

  return relativePath === "index.html"
    ? siteRoot.href
    : new URL(relativePath, siteRoot).href;
}

function assertSeoMetadata(markup, page) {
  const title = getRequiredMatch(
    markup,
    /<title>([^<]+)<\/title>/,
    "a title",
    page
  );
  const description = getRequiredMatch(
    markup,
    /<meta name="description" content="([^"]+)">/,
    "a meta description",
    page
  );
  const canonical = getRequiredMatch(
    markup,
    /<link rel="canonical" href="([^"]+)">/,
    "a canonical URL",
    page
  );
  const expectedCanonical = getExpectedCanonical(page);
  const expectedTags = [
    '<meta name="robots" content="index,follow">',
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="A11yRepeatableFieldset">',
    '<meta property="og:locale" content="en_US">',
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:url" content="${expectedCanonical}">`,
    `<meta property="og:image" content="${socialImageUrl}">`,
    '<meta property="og:image:width" content="1280">',
    '<meta property="og:image:height" content="640">',
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${description}">`,
    `<meta name="twitter:image" content="${socialImageUrl}">`
  ];

  if (canonical !== expectedCanonical) {
    throw new Error(
      `${page} uses canonical ${canonical}; expected ${expectedCanonical}.`
    );
  }

  if (description.length < 120 || description.length > 160) {
    throw new Error(
      `${page} has a ${description.length}-character meta description; expected 120–160.`
    );
  }

  for (const tag of expectedTags) {
    if (!markup.includes(tag)) {
      throw new Error(`${page} is missing or mismatches SEO tag: ${tag}`);
    }
  }

  const openGraphAlt = getRequiredMatch(
    markup,
    /<meta property="og:image:alt" content="([^"]+)">/,
    "Open Graph image alternative text",
    page
  );
  const twitterAlt = getRequiredMatch(
    markup,
    /<meta name="twitter:image:alt" content="([^"]+)">/,
    "Twitter/X image alternative text",
    page
  );

  if (openGraphAlt !== twitterAlt) {
    throw new Error(`${page} uses mismatched social-image alternative text.`);
  }

  const jsonLdBlocks = [
    ...markup.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
    )
  ];

  if (jsonLdBlocks.length !== 1 || jsonLdBlocks[0]?.[1] === undefined) {
    throw new Error(`${page} must contain exactly one JSON-LD block.`);
  }

  let jsonLd;

  try {
    jsonLd = JSON.parse(jsonLdBlocks[0][1]);
  } catch (error) {
    throw new Error(`${page} contains invalid JSON-LD.`, { cause: error });
  }

  const graph = Array.isArray(jsonLd?.["@graph"])
    ? jsonLd["@graph"]
    : [];
  const webPage = graph.find(({ "@type": type }) => type === "WebPage");
  const software = graph.find(
    ({ "@type": type }) => type === "SoftwareSourceCode"
  );

  if (
    jsonLd?.["@context"] !== "https://schema.org" ||
    webPage?.["@id"] !== `${expectedCanonical}#webpage` ||
    webPage?.url !== expectedCanonical ||
    webPage?.name !== title ||
    webPage?.description !== description ||
    software?.codeRepository !==
      "https://github.com/vmitsaras/A11y-Repeatable-Fieldset" ||
    !Array.isArray(software?.sameAs) ||
    !software.sameAs.includes(
      "https://github.com/vmitsaras/A11y-Repeatable-Fieldset"
    ) ||
    !software.sameAs.includes(
      "https://www.npmjs.com/package/a11y-repeatable-fieldset"
    )
  ) {
    throw new Error(`${page} contains mismatched or unverifiable JSON-LD.`);
  }

  return { title, description };
}

async function getSiteFiles(directory = docsRoot) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryUrl = new URL(entry.name, directory);

    if (entry.isDirectory()) {
      files.push(...(await getSiteFiles(new URL(`${entry.name}/`, directory))));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".html") || entry.name.endsWith(".js"))
    ) {
      files.push(entryUrl);
    }
  }

  return files;
}

async function assertExactPathCase(target, page, value) {
  const relativePath = decodeURIComponent(
    target.pathname.slice(docsRoot.pathname.length)
  );
  const segments = relativePath.split("/").filter(Boolean);
  let directory = docsRoot;

  for (const [index, segment] of segments.entries()) {
    const entries = await readdir(directory, { withFileTypes: true });
    const exactEntry = entries.find(({ name }) => name === segment);

    if (exactEntry === undefined) {
      throw new Error(`${page} references a missing or case-mismatched URL: ${value}`);
    }

    if (index < segments.length - 1 && !exactEntry.isDirectory()) {
      throw new Error(`${page} references a non-directory URL segment: ${value}`);
    }

    directory = new URL(
      `${segment}${exactEntry.isDirectory() ? "/" : ""}`,
      directory
    );
  }
}

async function assertLocalDocsUrl(value, page) {
  if (
    value.startsWith("#") ||
    value.startsWith("mailto:") ||
    value.startsWith("tel:")
  ) {
    return;
  }

  if (allowedExternalUrls.has(value)) {
    return;
  }

  if (!value.startsWith("./")) {
    throw new Error(`${page} uses a non-local docs URL: ${value}`);
  }

  const resolved = new URL(value, page);

  if (!resolved.href.startsWith(docsRoot.href)) {
    throw new Error(`${page} escapes docs: ${value}`);
  }

  resolved.hash = "";
  resolved.search = "";
  await assertExactPathCase(resolved, page, value);
}

async function checkStaticUrls() {
  const siteFiles = await getSiteFiles();
  const titles = new Set();
  const descriptions = new Set();

  for (const page of siteFiles) {
    const markup = await readFile(page, "utf8");
    const localMarkup = page.pathname.endsWith(".html")
      ? markup.replace(/<link rel="canonical" href="[^"]+">\n?/g, "")
      : markup;

    if (page.pathname.endsWith(".html")) {
      const metadata = assertSeoMetadata(markup, page);

      if (titles.has(metadata.title)) {
        throw new Error(`${page} duplicates the title: ${metadata.title}`);
      }

      if (descriptions.has(metadata.description)) {
        throw new Error(
          `${page} duplicates the meta description: ${metadata.description}`
        );
      }

      titles.add(metadata.title);
      descriptions.add(metadata.description);
    }

    const references = [
      ...localMarkup.matchAll(/(?:href|src|action)="([^"]+)"/g),
      ...localMarkup.matchAll(/\b(?:from\s+|import\s*)["']([^"']+)["']/g)
    ];

    for (const match of references) {
      const value = match[1];

      if (value !== undefined) {
        await assertLocalDocsUrl(value, page);
      }
    }
  }
}

async function checkCopiedAssets() {
  await verifyPageAssetSources();

  for (const { source, destination } of pagesAssetCopies) {
    const [sourceBytes, destinationBytes] = await Promise.all([
      readFile(new URL(source, `file://${workspaceRoot}`)),
      readFile(new URL(destination, `file://${workspaceRoot}`))
    ]);

    if (!sourceBytes.equals(destinationBytes)) {
      throw new Error(
        `Pages asset ${destination} differs from fresh build output ${source}. Run npm run pages:sync.`
      );
    }
  }
}

async function checkSocialImage() {
  const image = await readFile(
    new URL("assets/social-preview.png", docsRoot)
  );
  const pngSignature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
  ]);

  if (!image.subarray(0, pngSignature.length).equals(pngSignature)) {
    throw new Error("The Pages social preview must be a PNG.");
  }

  const width = image.readUInt32BE(16);
  const height = image.readUInt32BE(20);

  if (width !== 1280 || height !== 640) {
    throw new Error(
      `The Pages social preview is ${width} × ${height}; expected 1280 × 640.`
    );
  }

  if (image.byteLength >= 1_000_000) {
    throw new Error(
      `The Pages social preview is ${image.byteLength} bytes; it must stay under 1,000,000 bytes.`
    );
  }
}

await Promise.all([
  checkStaticUrls(),
  checkCopiedAssets(),
  checkSocialImage(),
  readFile(new URL(".nojekyll", docsRoot)),
]);
