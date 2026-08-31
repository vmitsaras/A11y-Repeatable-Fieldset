import { access, copyFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const workspaceRoot = fileURLToPath(new URL("../", import.meta.url));

export const pagesAssetCopies = Object.freeze([
  Object.freeze({
    source: "dist/index.js",
    destination: "docs/assets/a11y-repeatable-fieldset.js"
  }),
  Object.freeze({
    source: "dist/index.min.js",
    destination: "docs/assets/a11y-repeatable-fieldset.min.js"
  }),
  Object.freeze({
    source: "dist/addons/validation-bridge.js",
    destination: "docs/assets/validation-bridge.js"
  }),
  Object.freeze({
    source: "dist/addons/legend-sync.js",
    destination: "docs/assets/legend-sync.js"
  }),
  Object.freeze({
    source: "dist/addons/remove-guard.js",
    destination: "docs/assets/remove-guard.js"
  }),
  Object.freeze({
    source: "dist/addons/accessible-reorder.js",
    destination: "docs/assets/accessible-reorder.js"
  }),
  Object.freeze({
    source: "dist/addons/duplicate-item.js",
    destination: "docs/assets/duplicate-item.js"
  }),
  Object.freeze({
    source: "dist/addons/undo-remove.js",
    destination: "docs/assets/undo-remove.js"
  }),
  Object.freeze({
    source: "dist/addons/form-memory-bridge.js",
    destination: "docs/assets/form-memory-bridge.js"
  }),
  Object.freeze({
    source: "dist/styles.css",
    destination: "docs/assets/a11y-repeatable-fieldset.css"
  })
]);

function getPath(relativePath) {
  return new URL(relativePath, `file://${workspaceRoot}`);
}

export async function verifyPageAssetSources() {
  for (const { source } of pagesAssetCopies) {
    try {
      await access(getPath(source));
    } catch {
      throw new Error(
        `Cannot synchronize Pages assets: required build file ${source} is missing. Run the package build first.`
      );
    }
  }
}

export async function syncPagesAssets() {
  await verifyPageAssetSources();
  await mkdir(getPath("docs/assets/"), { recursive: true });

  for (const { source, destination } of pagesAssetCopies) {
    await copyFile(getPath(source), getPath(destination));
  }
}
