import { readFile, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const workspaceRoot = fileURLToPath(new URL("../", import.meta.url));
const docsRoot = new URL("docs/", `file://${workspaceRoot}`);
const packageJson = JSON.parse(
  await readFile(new URL("package.json", `file://${workspaceRoot}`), "utf8")
);

function getRequiredMatch(markup, pattern, description, page) {
  const match = markup.match(pattern);

  if (match?.[1] === undefined || match[1].trim() === "") {
    throw new Error(`${page} is missing ${description}.`);
  }

  return match[1].trim();
}

function normalizeRepositoryUrl(repository) {
  const raw =
    typeof repository === "string"
      ? repository
      : repository && typeof repository.url === "string"
        ? repository.url
        : "";

  return raw
    .replace(/^git\+/, "")
    .replace(/\.git$/, "")
    .replace(/^git@github\.com:/, "https://github.com/");
}

function createJsonLd(markup, page) {
  const name = getRequiredMatch(
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
  const pluginName = getRequiredMatch(
    markup,
    /<meta property="og:site_name" content="([^"]+)">/,
    "an Open Graph site name",
    page
  );
  const repositoryUrl = normalizeRepositoryUrl(packageJson.repository);
  const authorName =
    typeof packageJson.author === "string"
      ? packageJson.author
      : packageJson.author?.name;
  const authorId = "https://github.com/vmitsaras/#person";
  const license =
    repositoryUrl === ""
      ? packageJson.license
      : `${repositoryUrl}/blob/main/LICENSE`;
  const softwareId = `${canonical}#software`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${canonical}#webpage`,
        url: canonical,
        name,
        description,
        mainEntity: {
          "@id": softwareId
        }
      },
      {
        "@type": "SoftwareSourceCode",
        "@id": softwareId,
        name: pluginName,
        alternateName: packageJson.name,
        description: packageJson.description,
        codeRepository: repositoryUrl,
        programmingLanguage: ["TypeScript", "JavaScript"],
        runtimePlatform: "Browser",
        version: packageJson.version,
        license,
        keywords: packageJson.keywords,
        author: {
          "@id": authorId
        },
        targetProduct: {
          "@type": "SoftwareApplication",
          name: pluginName,
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Any",
          runtimePlatform: "Browser",
          softwareVersion: packageJson.version
        },
        sameAs: repositoryUrl === "" ? undefined : [repositoryUrl]
      },
      ...(authorName === "Vasileios Mitsaras"
        ? [
            {
              "@type": "Person",
              "@id": authorId,
              name: authorName,
              url: "https://github.com/vmitsaras/",
              sameAs: [
                "https://github.com/vmitsaras/",
                "https://linkedin.com/in/vasilis-mitsaras"
              ]
            }
          ]
        : [])
    ]
  };
}

function serializeJsonLd(value) {
  const json = JSON.stringify(value, null, 2)
    .split("\n")
    .map((line) => `    ${line}`)
    .join("\n");

  return `    <script type="application/ld+json">\n${json}\n    </script>`;
}

const entries = await readdir(docsRoot, { withFileTypes: true });

for (const entry of entries) {
  if (!entry.isFile() || !entry.name.endsWith(".html")) {
    continue;
  }

  const page = new URL(entry.name, docsRoot);
  const markup = await readFile(page, "utf8");
  const jsonLdBlock = serializeJsonLd(createJsonLd(markup, page));
  const existingPattern =
    /\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g;
  const withoutExisting = markup.replace(existingPattern, "");
  const stylesheetMarker = '    <link rel="stylesheet"';

  if (!withoutExisting.includes(stylesheetMarker)) {
    throw new Error(`${page} is missing a stylesheet insertion point.`);
  }

  const updated = withoutExisting.replace(
    stylesheetMarker,
    `${jsonLdBlock}\n${stylesheetMarker}`
  );

  await writeFile(page, updated);
}
