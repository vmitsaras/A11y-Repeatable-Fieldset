import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

interface PackageJsonContract {
  readonly name: string;
  readonly version: string;
  readonly private: boolean;
  readonly type: string;
  readonly main: string;
  readonly module: string;
  readonly types: string;
  readonly files: readonly string[];
  readonly sideEffects: readonly string[];
  readonly exports: Readonly<Record<string, unknown>>;
  readonly dependencies: Readonly<Record<string, string>>;
}

const workspace = process.cwd();
const packageJson = JSON.parse(
  readFileSync(resolve(workspace, "package.json"), "utf8")
) as PackageJsonContract;
const basicExamplePath = resolve(workspace, "examples/basic/index.html");
const basicExampleReadmePath = resolve(workspace, "examples/basic/README.md");

describe("guarded release-candidate package contract", () => {
  it("keeps the ESM entries, exports, files, and dependency boundary coherent", () => {
    expect(packageJson).toMatchObject({
      name: "a11y-repeatable-fieldset",
      version: "1.0.0",
      private: true,
      type: "module",
      main: "./dist/index.js",
      module: "./dist/index.js",
      types: "./dist/index.d.ts"
    });
    expect(packageJson.dependencies).toEqual({});
    expect(packageJson.sideEffects).toEqual(["**/*.css"]);
    expect(packageJson.files).toEqual([
      "dist",
      "README.md",
      "ACCESSIBLE_REORDER.md",
      "DUPLICATE_ITEM.md",
      "LEGEND_SYNC.md",
      "REMOVE_GUARD.md",
      "UNDO_REMOVE.md",
      "FORM_MEMORY_BRIDGE.md",
      "VALIDATION_BRIDGE.md",
      "CHANGELOG.md",
      "LICENSE"
    ]);
    expect(packageJson.files).not.toContain("examples");

    for (const exportPath of [
      ".",
      "./min",
      "./docs",
      "./addons/validation-bridge",
      "./addons/legend-sync",
      "./addons/remove-guard",
      "./addons/accessible-reorder",
      "./addons/duplicate-item",
      "./addons/undo-remove",
      "./addons/form-memory-bridge",
      "./styles.css",
      "./package.json"
    ]) {
      expect(packageJson.exports).toHaveProperty(exportPath);
    }
  });

  it("provides the canonical semantic basic example without external runtimes", () => {
    expect(existsSync(basicExamplePath)).toBe(true);
    expect(existsSync(basicExampleReadmePath)).toBe(true);

    const markup = readFileSync(basicExamplePath, "utf8");
    const document = new DOMParser().parseFromString(markup, "text/html");
    const root = document.querySelector<HTMLElement>(
      "[data-a11y-repeatable-fieldset]"
    );
    const items = root?.querySelector<HTMLElement>(
      ":scope > [data-a11y-repeatable-fieldset-items]"
    );
    const item = items?.querySelector<HTMLFieldSetElement>(
      ":scope > fieldset[data-a11y-repeatable-fieldset-item]"
    );
    const template = root?.querySelector<HTMLTemplateElement>(
      ":scope > template[data-a11y-repeatable-fieldset-template]"
    );
    const addButton = root?.querySelector<HTMLButtonElement>(
      ":scope > button[data-a11y-repeatable-fieldset-add]"
    );
    const removeButton = item?.querySelector<HTMLButtonElement>(
      "button[data-a11y-repeatable-fieldset-remove]"
    );
    const input = item?.querySelector<HTMLInputElement>("input");
    const description = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]'
    );
    const trySection = document.querySelector<HTMLElement>(
      'section[aria-labelledby="try-heading"]'
    );
    const accessibilitySection = document.querySelector<HTMLElement>(
      'section[aria-labelledby="accessibility-heading"]'
    );

    expect(document.title).toBe(
      "Emergency Contacts Basic Example | A11yRepeatableFieldset"
    );
    expect(description?.content).toContain(
      "progressively enhanced emergency-contact form"
    );
    expect(trySection?.querySelector("h2")?.textContent).toBe("Try it");
    expect(trySection?.textContent).toContain("Add another contact");
    expect(trySection?.textContent).toContain("without JavaScript");
    expect(accessibilitySection?.querySelector("h2")?.textContent).toBe(
      "Accessibility notes"
    );
    expect(accessibilitySection?.textContent).toContain("template remains inert");
    expect(accessibilitySection?.textContent).toContain("polite status region");
    expect(accessibilitySection?.textContent).toContain("manual testing");
    expect(root?.tagName).toBe("SECTION");
    expect(item?.querySelector(":scope > legend")?.textContent?.trim()).not.toBe(
      ""
    );
    expect(input?.id).not.toBe("");
    expect(document.querySelector(`label[for="${input?.id}"]`)).not.toBeNull();
    expect(input?.name).toBe("contacts[server-primary][name]");
    expect(addButton?.type).toBe("button");
    expect(addButton?.hidden).toBe(true);
    expect(removeButton?.type).toBe("button");
    expect(removeButton?.hidden).toBe(true);
    expect(template?.content.childElementCount).toBe(1);
    expect(template?.content.firstElementChild?.tagName).toBe("FIELDSET");
    expect(template?.innerHTML).toContain("__A11Y_REPEATABLE_KEY__");
    expect(markup).toContain('href="../../dist/styles.css"');
    expect(markup).toContain('from "../../dist/index.js"');
    expect(markup).toContain("createRepeatableFieldset(root);");
    expect(markup).not.toMatch(/https?:\/\//u);
    expect(markup).not.toMatch(/\b(?:React|Vue|Angular|Svelte)\b/u);

    const exampleReadme = readFileSync(basicExampleReadmePath, "utf8");
    expect(exampleReadme).toContain("npm run build");
    expect(exampleReadme).toContain("python3 -m http.server 4173");
    expect(exampleReadme).toContain("Tab and Shift+Tab");
    expect(exampleReadme).toMatch(/manual accessibility\s+record/u);
  });
});
