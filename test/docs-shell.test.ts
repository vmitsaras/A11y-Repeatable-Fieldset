import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  EVENTS,
  RepeatableFieldsetError,
  createRepeatableFieldset
} from "../src";
import { createValidationBridge } from "../src/addons/validation-bridge";
import { createLegendSyncAddon } from "../src/addons/legend-sync";
import { createRemoveGuard } from "../src/addons/remove-guard";
import { createAccessibleReorder } from "../src/addons/accessible-reorder";
import { createFormMemoryBridge } from "../src/addons/form-memory-bridge";

const docsDirectory = resolve(process.cwd(), "docs");
const siteUrl =
  "https://vmitsaras.github.io/A11y-Repeatable-Fieldset/";
const socialImageUrl = `${siteUrl}assets/social-preview.png`;
const repositoryUrl =
  "https://github.com/vmitsaras/A11y-Repeatable-Fieldset";
const pages = [
  "index.html",
  "basic.html",
  "existing-items.html",
  "limits.html",
  "complex-fields.html",
  "stable-keys.html",
  "lifecycle-events.html",
  "localization.html",
  "addons.html",
  "validation-integration.html",
  "form-memory-integration.html",
  "api.html",
  "no-javascript.html",
  "realistic-multi-person.html",
  "event-inspector.html",
  "transactional-failure-lab.html",
  "edge-cases.html",
  "duplicate-item.html",
  "undo-remove.html"
] as const;

function readDocsFile(path: string): string {
  return readFileSync(resolve(docsDirectory, path), "utf8");
}

function parseDocsPage(path: string): Document {
  return new DOMParser().parseFromString(readDocsFile(path), "text/html");
}

describe("static documentation shell", () => {
  it("ships every planned flat page and the Pages marker", () => {
    for (const page of pages) {
      expect(existsSync(resolve(docsDirectory, page))).toBe(true);
    }

    expect(existsSync(resolve(docsDirectory, ".nojekyll"))).toBe(
      true
    );
    expect(
      existsSync(resolve(docsDirectory, "assets/docs.css"))
    ).toBe(true);
    expect(
      existsSync(resolve(docsDirectory, "assets/favicon.svg"))
    ).toBe(true);
    expect(
      existsSync(resolve(docsDirectory, "assets/social-preview.png"))
    ).toBe(true);
    expect(
      existsSync(resolve(docsDirectory, "assets/validation-bridge.js"))
    ).toBe(true);
    expect(
      existsSync(resolve(docsDirectory, "assets/legend-sync.js"))
    ).toBe(true);
    expect(
      existsSync(resolve(docsDirectory, "assets/remove-guard.js"))
    ).toBe(true);
    expect(
      existsSync(resolve(docsDirectory, "assets/accessible-reorder.js"))
    ).toBe(true);
    expect(
      existsSync(resolve(docsDirectory, "assets/duplicate-item.js"))
    ).toBe(true);
    expect(
      existsSync(resolve(docsDirectory, "assets/undo-remove.js"))
    ).toBe(true);
    expect(
      existsSync(resolve(docsDirectory, "assets/form-memory-bridge.js"))
    ).toBe(true);
    expect(
      existsSync(resolve(docsDirectory, "assets/remove-guard-demo.js"))
    ).toBe(true);
    expect(
      existsSync(resolve(docsDirectory, "assets/accessible-reorder-demo.js"))
    ).toBe(true);
    expect(
      existsSync(resolve(docsDirectory, "assets/duplicate-item-demo.js"))
    ).toBe(true);
    expect(
      existsSync(resolve(docsDirectory, "assets/undo-remove-demo.js"))
    ).toBe(true);
    expect(
      existsSync(resolve(docsDirectory, "assets/form-memory-bridge-demo.js"))
    ).toBe(true);
  });

  it("gives every page a semantic shell and complete unique share metadata", () => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();

    for (const page of pages) {
      const markup = readDocsFile(page);
      const document = parseDocsPage(page);
      const title = document.title;
      const description = document
        .querySelector('meta[name="description"]')
        ?.getAttribute("content");
      const expectedCanonical =
        page === "index.html" ? siteUrl : `${siteUrl}${page}`;

      expect(markup).toContain('<html lang="en">');
      expect(markup).toContain('<meta name="viewport"');
      expect(markup).toContain("<title>");
      expect(markup).toContain('href="#main-content"');
      expect(markup).toContain('<nav aria-label="Main navigation">');
      expect(markup).toContain('<main class="docs-site__main" id="main-content">');
      expect(markup).toMatch(/<h1>/);
      expect(markup).toContain('href="./assets/docs.css"');
      expect(markup).toContain('href="./assets/favicon.svg"');
      expect(markup).toContain('data-demo-footer');
      expect(markup).toContain('aria-label="Project links"');
      expect(markup).toContain("GitHub repository");
      expect(markup).not.toMatch(/(?:href|src)="(?:\/|\.\.\/)/);
      expect(markup).not.toMatch(/(?:href|src)="[^\"]*(?:src|dist)\//);

      const footer = document.querySelector<HTMLElement>("[data-demo-footer]");
      const projectLinks = footer?.querySelectorAll<HTMLAnchorElement>(
        'nav[aria-label="Project links"] a'
      );
      expect(footer).not.toBeNull();
      expect(footer?.closest("[data-a11y-repeatable-fieldset]")).toBeNull();
      expect(projectLinks).toHaveLength(1);
      expect(projectLinks?.item(0).textContent).toBe("GitHub repository");
      expect(footer?.textContent).not.toContain("npm package");

      const header = document.querySelector<HTMLElement>(
        ".docs-site__header"
      );
      const brand = header?.querySelector<HTMLAnchorElement>(
        ".docs-site__brand"
      );
      const mainLinks = header?.querySelectorAll<HTMLAnchorElement>(
        'nav[aria-label="Main navigation"] a'
      );
      expect(brand?.textContent).toBe("A11yRepeatableFieldset");
      expect(brand?.getAttribute("href")).toBe("./index.html");
      expect(brand?.getAttribute("aria-label")).toBe(
        "A11yRepeatableFieldset home"
      );
      expect(Array.from(mainLinks ?? [], (link) => link.textContent)).toEqual([
        "Overview",
        "Examples",
        "Install"
      ]);
      expect(mainLinks?.item(0).getAttribute("href")).toBe("./index.html");
      expect(mainLinks?.item(1).getAttribute("href")).toBe(
        "./index.html#examples"
      );
      expect(mainLinks?.item(2).getAttribute("href")).toBe(repositoryUrl);

      expect(title).not.toBe("");
      expect(titles.has(title)).toBe(false);
      titles.add(title);

      expect(description?.length).toBeGreaterThanOrEqual(120);
      expect(description?.length).toBeLessThanOrEqual(160);
      expect(descriptions.has(description!)).toBe(false);
      descriptions.add(description!);

      expect(
        document
          .querySelector('link[rel="canonical"]')
          ?.getAttribute("href")
      ).toBe(expectedCanonical);
      expect(
        document
          .querySelector('meta[property="og:url"]')
          ?.getAttribute("content")
      ).toBe(expectedCanonical);
      expect(
        document
          .querySelector('meta[property="og:image"]')
          ?.getAttribute("content")
      ).toBe(socialImageUrl);
      expect(
        document
          .querySelector('meta[property="og:image:alt"]')
          ?.getAttribute("content")
      ).not.toBe("");
      expect(
        document
          .querySelector('meta[name="twitter:card"]')
          ?.getAttribute("content")
      ).toBe("summary_large_image");
      expect(
        document
          .querySelector('meta[name="twitter:image"]')
          ?.getAttribute("content")
      ).toBe(socialImageUrl);

      const jsonLdScripts = document.querySelectorAll(
        'head script[type="application/ld+json"]'
      );
      expect(jsonLdScripts).toHaveLength(1);
      const jsonLd = JSON.parse(jsonLdScripts.item(0).textContent ?? "");
      const webPage = jsonLd["@graph"].find(
        (entry: { "@type": string }) => entry["@type"] === "WebPage"
      );
      const software = jsonLd["@graph"].find(
        (entry: { "@type": string }) =>
          entry["@type"] === "SoftwareSourceCode"
      );
      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(webPage).toMatchObject({
        "@id": `${expectedCanonical}#webpage`,
        url: expectedCanonical,
        name: title,
        description
      });
      expect(software).toMatchObject({
        name: "A11yRepeatableFieldset",
        alternateName: "a11y-repeatable-fieldset",
        codeRepository:
          "https://github.com/vmitsaras/A11y-Repeatable-Fieldset",
        runtimePlatform: "Browser",
        version: "1.0.0"
      });
      expect(JSON.stringify(jsonLd)).toContain(
        "https://www.npmjs.com/package/a11y-repeatable-fieldset"
      );
    }
  });

  it("links to every planned page from the overview without a router", () => {
    const overview = readDocsFile("index.html");
    const overviewDocument = parseDocsPage("index.html");

    expect(overviewDocument.querySelector("#examples")).not.toBeNull();

    for (const page of pages.slice(1)) {
      expect(overview).toContain(`href="./${page}"`);
    }
  });

  it("keeps public pages free of temporary publication-status copy", () => {
    const overview = parseDocsPage("index.html");
    const api = parseDocsPage("api.html");

    expect(overview.querySelector("#status-heading")).toBeNull();
    expect(overview.querySelector("#featured-examples-heading")?.textContent).toBe(
      "Featured examples"
    );
    expect(overview.body.textContent).toContain("Baseline 2024");
    expect(overview.body.textContent).not.toContain("Unpublished");
    expect(overview.body.textContent).not.toContain("implemented locally");
    expect(api.body.textContent).not.toContain("unpublished");
    expect(api.body.textContent).not.toContain("implemented locally");
    expect(api.body.textContent).not.toContain("Implemented public surface");
  });

  it("keeps the basic demo server-rendered and imports only copied assets", () => {
    const basic = readDocsFile("basic.html");

    expect(basic).toContain('<form action="./basic.html" method="post">');
    expect(basic).toContain("data-a11y-repeatable-fieldset");
    expect(basic).toContain("data-a11y-repeatable-fieldset-items");
    expect(basic).toContain("data-a11y-repeatable-fieldset-template");
    expect(basic).toContain("data-a11y-repeatable-fieldset-add");
    expect(basic).toContain("data-a11y-repeatable-fieldset-remove");
    expect(basic).toContain("__A11Y_REPEATABLE_KEY__");
    expect(basic).toContain(
      'href="./assets/a11y-repeatable-fieldset.css"'
    );
    expect(basic).toContain(
      'from "./assets/a11y-repeatable-fieldset.js"'
    );
    expect(basic).toContain("createRepeatableFieldset(root");
    expect(basic).not.toMatch(/(?:href|src|from)="?[^\"]*(?:src|dist)\//);
  });

  it("implements every planned executable demo with public copied assets", () => {
    const inlineModulePages = [
      "basic.html",
      "existing-items.html",
      "limits.html",
      "complex-fields.html",
      "no-javascript.html",
      "edge-cases.html",
      "validation-integration.html"
    ] as const;

    for (const page of inlineModulePages) {
      const markup = readDocsFile(page);

      expect(markup).toContain(
        'href="./assets/a11y-repeatable-fieldset.css"'
      );
      expect(markup).toContain(
        'from "./assets/a11y-repeatable-fieldset.js"'
      );
      expect(markup).not.toMatch(/(?:href|src|from)="?[^\"]*(?:src|dist)\//);
    }

    const inspector = readDocsFile("event-inspector.html");
    expect(inspector).toContain('src="./assets/event-inspector.js"');
    expect(
      existsSync(resolve(docsDirectory, "assets/event-inspector.js"))
    ).toBe(true);

    const inspectorScript = readDocsFile("assets/event-inspector.js");
    expect(inspectorScript).toContain("EVENTS");
    expect(inspectorScript).toContain("createRepeatableFieldset");
    expect(inspectorScript).toContain("textContent");
    expect(inspectorScript).not.toContain("innerHTML");
    expect(inspectorScript).not.toContain("../src");
    expect(inspectorScript).not.toContain("../dist");

    const multiPerson = readDocsFile("realistic-multi-person.html");
    expect(multiPerson).toContain(
      'src="./assets/realistic-multi-person.js"'
    );
    expect(multiPerson).toContain("Legend Sync is packaged from an explicit subpath");
    expect(multiPerson).toContain("person-amina");
    expect(multiPerson).toContain("person-luca");
    expect(multiPerson).toContain("person-priya");

    const multiPersonScript = readDocsFile(
      "assets/realistic-multi-person.js"
    );
    expect(multiPersonScript).toContain(
      'import { createLegendSyncAddon } from "./legend-sync.js"'
    );
    expect(multiPersonScript).toContain("createLegendSyncAddon({");
    expect(multiPersonScript).toContain('updateOn: "change"');
    expect(multiPersonScript).not.toContain("../src");
    expect(multiPersonScript).not.toContain("../dist");

    const failureLab = readDocsFile("transactional-failure-lab.html");
    expect(failureLab).toContain(
      'src="./assets/transactional-failure-lab.js"'
    );
    expect(failureLab).toContain(
      'for="contact-__A11Y_REPEATABLE_KEY__-email"'
    );
    expect(failureLab).toContain(
      'id="contact-__A11Y_REPEATABLE_KEY__-address"'
    );

    const failureLabScript = readDocsFile(
      "assets/transactional-failure-lab.js"
    );
    expect(failureLabScript).toContain('id: "demo.audit-marker"');
    expect(failureLabScript).toContain('id: "demo.intentional-failure"');
    expect(failureLabScript).toContain("EVENTS.itemAdded");
    expect(failureLabScript).not.toContain("innerHTML");
    expect(failureLabScript).not.toContain("../src");
    expect(failureLabScript).not.toContain("../dist");

    const validation = readDocsFile("validation-integration.html");
    expect(validation).toContain(
      'from "./assets/validation-bridge.js"'
    );
    expect(validation).toContain("createValidationBridge({");
    expect(validation).toContain("applicationValidator.registerGroup");

    const addons = readDocsFile("addons.html");
    const removeGuardDemo = readDocsFile("assets/remove-guard-demo.js");
    const reorderDemo = readDocsFile("assets/accessible-reorder-demo.js");
    expect(addons).toContain('src="./assets/remove-guard-demo.js"');
    expect(removeGuardDemo).toContain(
      'import { createRemoveGuard } from "./remove-guard.js"'
    );
    expect(removeGuardDemo).toContain("createRemoveGuard({");
    expect(removeGuardDemo).toContain(
      'input[data-remove-guard-meaningful]'
    );
    expect(removeGuardDemo).not.toContain("../src");
    expect(removeGuardDemo).not.toContain("../dist");
    expect(addons).toContain('src="./assets/accessible-reorder-demo.js"');
    expect(reorderDemo).toContain(
      'import { createAccessibleReorder } from "./accessible-reorder.js"'
    );
    expect(reorderDemo).toContain("createAccessibleReorder()");
    expect(reorderDemo).not.toContain("../src");
    expect(reorderDemo).not.toContain("../dist");

    const duplicatePage = readDocsFile("duplicate-item.html");
    const duplicateDemo = readDocsFile("assets/duplicate-item-demo.js");
    const duplicateDocument = new DOMParser().parseFromString(
      duplicatePage,
      "text/html"
    );
    const duplicateForm = duplicateDocument.querySelector(
      "#duplicate-item-demo-form"
    );
    expect(duplicatePage).toContain('src="./assets/duplicate-item-demo.js"');
    expect(duplicatePage).toContain(
      "data-a11y-repeatable-fieldset-duplicate-controls"
    );
    expect(duplicateDemo).toContain(
      'import { createDuplicateItem } from "./duplicate-item.js"'
    );
    expect(duplicateDemo).toContain("EVENTS.itemDuplicated");
    expect(duplicateForm?.querySelector('button[type="submit"]')).toBeNull();
    expect(duplicatePage).not.toContain("Preview save");
    expect(duplicateDemo).not.toContain('addEventListener("submit"');
    expect(duplicateDemo).not.toContain("event.preventDefault()");

    const undoPage = readDocsFile("undo-remove.html");
    const undoDemo = readDocsFile("assets/undo-remove-demo.js");
    const undoDocument = new DOMParser().parseFromString(
      undoPage,
      "text/html"
    );
    const undoForm = undoDocument.querySelector("#undo-remove-demo-form");
    expect(undoPage).toContain('src="./assets/undo-remove-demo.js"');
    expect(undoPage).toContain(
      "data-a11y-repeatable-fieldset-undo-controls"
    );
    expect(undoPage).toContain(
      'data-a11y-repeatable-fieldset-undo-state="name"'
    );
    expect(undoPage).toContain("Expiry pauses while the Undo button has focus");
    expect(undoDemo).toContain(
      'import { createUndoRemove } from "./undo-remove.js"'
    );
    expect(undoDemo).toContain("EVENTS.itemRestored");
    expect(undoForm?.querySelector('button[type="submit"]')).toBeNull();
    expect(undoPage).not.toContain("Preview save");
    expect(undoDemo).not.toContain('addEventListener("submit"');
    expect(undoDemo).not.toContain("event.preventDefault()");
    expect(undoDemo).not.toContain("../src");
    expect(undoDemo).not.toContain("../dist");

    const memoryPage = readDocsFile("form-memory-integration.html");
    const memoryDemo = readDocsFile("assets/form-memory-bridge-demo.js");
    expect(memoryPage).toContain(
      'src="./assets/form-memory-bridge-demo.js"'
    );
    expect(memoryDemo).toContain(
      'import { createFormMemoryBridge } from "./form-memory-bridge.js"'
    );
    expect(memoryDemo).toContain(
      "createInstance: createRepeatableFieldset"
    );
    expect(memoryDemo).not.toContain("../src");
    expect(memoryDemo).not.toContain("../dist");
  });

  it("runs the Form Memory Bridge structure-before-values demo", async () => {
    const parsed = parseDocsPage("form-memory-integration.html");
    const moduleScript = readDocsFile(
      "assets/form-memory-bridge-demo.js"
    );
    const executableDemo = moduleScript.replace(
      /^\s*import .*;\s*$/gm,
      ""
    );

    document.documentElement.innerHTML = parsed.documentElement.innerHTML;
    const runDemo = new Function(
      "createRepeatableFieldset",
      "createFormMemoryBridge",
      executableDemo
    );
    runDemo(createRepeatableFieldset, createFormMemoryBridge);

    const restore = document.querySelector<HTMLButtonElement>(
      "#form-memory-demo-restore"
    );
    const root = document.querySelector<HTMLElement>(
      "#form-memory-demo-root"
    );
    const itemKeys = () =>
      Array.from(
        root!.querySelectorAll<HTMLFieldSetElement>(
          ":scope > [data-a11y-repeatable-fieldset-items] > [data-a11y-repeatable-fieldset-item]"
        ),
        (item) => item.dataset["a11yRepeatableFieldsetKey"]
      );

    expect(restore?.hidden).toBe(false);
    expect(itemKeys()).toEqual(["server-42"]);
    restore!.click();
    expect(itemKeys()).toEqual(["draft-7", "server-42"]);
    expect(
      root?.querySelector<HTMLInputElement>(
        'input[name="contacts[draft-7][name]"]'
      )?.value
    ).toBe("Grace Hopper");
    expect(
      document.querySelector("#form-memory-demo-outcome")?.textContent
    ).toContain("prepared before initialization");

    root
      ?.querySelector<HTMLButtonElement>(
        "[data-a11y-repeatable-fieldset-add]"
      )
      ?.click();
    await Promise.resolve();
    await Promise.resolve();
    expect(itemKeys()).toEqual(["draft-7", "server-42", "item-1"]);
    expect(
      document.querySelector("#form-memory-demo-snapshot")?.textContent
    ).toContain('"item-1"');
  });

  it("runs the realistic multi-person demo through the packaged Legend Sync addon", () => {
    const markup = readDocsFile("realistic-multi-person.html");
    const parsed = parseDocsPage("realistic-multi-person.html");
    const moduleScript = readDocsFile("assets/realistic-multi-person.js");
    const executableDemo = moduleScript.replace(
      /^\s*import .*;\s*$/gm,
      ""
    );

    document.documentElement.innerHTML = parsed.documentElement.innerHTML;
    const runDemo = new Function(
      "createRepeatableFieldset",
      "createLegendSyncAddon",
      executableDemo
    );
    runDemo(createRepeatableFieldset, createLegendSyncAddon);

    const root = document.querySelector<HTMLElement>("#people-root");
    const aminaName = document.querySelector<HTMLInputElement>(
      "#person-amina-name"
    );
    const aminaSummary = aminaName
      ?.closest("fieldset")
      ?.querySelector<HTMLElement>(
        "[data-a11y-repeatable-fieldset-legend-value]"
      );
    const addButton = root?.querySelector<HTMLButtonElement>(
      "[data-a11y-repeatable-fieldset-add]"
    );

    expect(markup).toContain("data-min-items=\"2\"");
    expect(root).not.toBeNull();
    expect(aminaName).not.toBeNull();
    expect(aminaSummary?.textContent).toBe(" — Amina Noor");
    expect(addButton?.hidden).toBe(false);

    aminaName!.value = "Amina Noor-Santos";
    aminaName!.dispatchEvent(new Event("input", { bubbles: true }));
    expect(aminaSummary?.textContent).toBe(" — Amina Noor");
    aminaName!.dispatchEvent(new Event("change", { bubbles: true }));
    expect(aminaSummary?.textContent).toBe(" — Amina Noor-Santos");

    addButton!.click();
    const items = root!.querySelectorAll<HTMLFieldSetElement>(
      "[data-a11y-repeatable-fieldset-item]"
    );
    const addedItem = items.item(3);
    expect(items).toHaveLength(4);
    expect(
      addedItem.querySelector(
        "[data-a11y-repeatable-fieldset-legend-value]"
      )?.textContent
    ).toBe(" — name not entered");
    expect(document.activeElement).toBe(
      addedItem.querySelector(
        "[data-a11y-repeatable-fieldset-legend-source]"
      )
    );
  });

  it("runs Remove Guard denial, async approval, and immediate blank removal", async () => {
    const parsed = parseDocsPage("addons.html");
    const moduleScript = readDocsFile("assets/remove-guard-demo.js");
    const executableDemo = moduleScript.replace(
      /^\s*import .*;\s*$/gm,
      ""
    );

    document.documentElement.innerHTML = parsed.documentElement.innerHTML;
    const dialog = document.querySelector<HTMLDialogElement>(
      "#remove-guard-dialog"
    );
    expect(dialog).not.toBeNull();
    Object.defineProperty(dialog!, "showModal", {
      configurable: true,
      value() {
        dialog!.setAttribute("open", "");
      }
    });

    const runDemo = new Function(
      "createRepeatableFieldset",
      "createRemoveGuard",
      executableDemo
    );
    runDemo(createRepeatableFieldset, createRemoveGuard);

    const root = document.querySelector<HTMLElement>(
      "#remove-guard-demo-form [data-a11y-repeatable-fieldset]"
    );
    const addButton = root?.querySelector<HTMLButtonElement>(
      "[data-a11y-repeatable-fieldset-add]"
    );
    const getItems = () =>
      root!.querySelectorAll<HTMLFieldSetElement>(
        "[data-a11y-repeatable-fieldset-item]"
      );
    const closeDialog = async (returnValue: string): Promise<void> => {
      dialog!.returnValue = returnValue;
      dialog!.removeAttribute("open");
      dialog!.dispatchEvent(new Event("close"));
      await Promise.resolve();
      await Promise.resolve();
    };

    expect(root).not.toBeNull();
    expect(addButton).not.toBeNull();
    expect(getItems()).toHaveLength(1);

    getItems()
      .item(0)
      .querySelector<HTMLButtonElement>(
        "[data-a11y-repeatable-fieldset-remove]"
      )!
      .click();
    expect(dialog?.hasAttribute("open")).toBe(true);
    expect(getItems()).toHaveLength(1);

    await closeDialog("cancel");
    expect(getItems()).toHaveLength(1);

    getItems()
      .item(0)
      .querySelector<HTMLButtonElement>(
        "[data-a11y-repeatable-fieldset-remove]"
      )!
      .click();
    await closeDialog("remove");
    expect(getItems()).toHaveLength(0);

    addButton!.click();
    expect(getItems()).toHaveLength(1);
    getItems()
      .item(0)
      .querySelector<HTMLButtonElement>(
        "[data-a11y-repeatable-fieldset-remove]"
      )!
      .click();
    expect(dialog?.hasAttribute("open")).toBe(false);
    expect(getItems()).toHaveLength(0);
  });

  it("runs Accessible Reorder through native controls and the public Move transaction", () => {
    const parsed = parseDocsPage("addons.html");
    const moduleScript = readDocsFile("assets/accessible-reorder-demo.js");
    const executableDemo = moduleScript.replace(/^\s*import .*;\s*$/gm, "");

    document.documentElement.innerHTML = parsed.documentElement.innerHTML;
    const root = document.querySelector<HTMLElement>(
      "#accessible-reorder-demo-form [data-a11y-repeatable-fieldset]"
    );
    const moved = vi.fn();
    root?.addEventListener(EVENTS.itemMoved, moved);

    const runDemo = new Function(
      "createRepeatableFieldset",
      "createAccessibleReorder",
      executableDemo
    );
    runDemo(createRepeatableFieldset, createAccessibleReorder);

    const items = () =>
      Array.from(
        root!.querySelectorAll<HTMLFieldSetElement>(
          ":scope > [data-a11y-repeatable-fieldset-items] > [data-a11y-repeatable-fieldset-item]"
        )
      );
    const firstMoveDown = items()[0]?.querySelector<HTMLButtonElement>(
      "[data-a11y-repeatable-fieldset-move-down]"
    );

    expect(firstMoveDown?.type).toBe("button");
    expect(firstMoveDown?.textContent).toBe("Move down");
    firstMoveDown!.focus();
    firstMoveDown!.click();

    expect(items().map((item) => item.dataset["a11yRepeatableFieldsetKey"])).toEqual([
      "address-work",
      "address-home"
    ]);
    expect(document.activeElement).toBe(firstMoveDown);
    expect(moved).toHaveBeenCalledTimes(1);
    expect(
      root?.querySelector("[data-a11y-repeatable-fieldset-status]")?.textContent
    ).toBe("Address moved to position 2 of 2.");
    expect(
      items()[1]?.querySelector<HTMLInputElement>("input")?.name
    ).toBe("addresses[address-home][line]");

    firstMoveDown!.click();
    expect(moved).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(firstMoveDown);
    expect(
      root?.querySelector("[data-a11y-repeatable-fieldset-status]")?.textContent
    ).toBe("Address 2 is already last.");
  });

  it("runs malformed-template blocking and addon rollback without private APIs", () => {
    const parsed = parseDocsPage("transactional-failure-lab.html");
    const moduleScript = readDocsFile(
      "assets/transactional-failure-lab.js"
    );
    const executableDemo = moduleScript.replace(
      /\s*import\s*\{[\s\S]*?\}\s*from\s*"\.\/a11y-repeatable-fieldset\.js";\s*/,
      ""
    );

    document.documentElement.innerHTML = parsed.documentElement.innerHTML;
    const runDemo = new Function(
      "EVENTS",
      "createRepeatableFieldset",
      executableDemo
    );
    runDemo(EVENTS, createRepeatableFieldset);

    const templateButton = document.querySelector<HTMLButtonElement>(
      "#template-attempt"
    );
    const addonButton = document.querySelector<HTMLButtonElement>(
      "#addon-attempt"
    );
    const shouldFail = document.querySelector<HTMLInputElement>(
      "#addon-should-fail"
    );

    expect(templateButton?.hidden).toBe(false);
    templateButton!.click();
    expect(document.querySelector("#template-result")?.textContent).toContain(
      "invalid-template"
    );
    expect(document.querySelector("#template-item-count")?.textContent).toBe(
      "1"
    );
    expect(document.querySelector("#template-event-count")?.textContent).toBe(
      "0"
    );

    expect(addonButton?.hidden).toBe(false);
    addonButton!.click();
    expect(document.querySelector("#addon-result")?.textContent).toContain(
      "addon-error"
    );
    expect(document.querySelector("#addon-item-count")?.textContent).toBe("1");
    expect(document.querySelector("#addon-marker-count")?.textContent).toBe(
      "1"
    );
    expect(document.querySelector("#addon-event-count")?.textContent).toBe(
      "0"
    );

    shouldFail!.checked = false;
    addonButton!.click();
    expect(document.querySelector("#addon-result")?.textContent).toContain(
      "Add succeeded"
    );
    expect(document.querySelector("#addon-item-count")?.textContent).toBe("2");
    expect(document.querySelector("#addon-marker-count")?.textContent).toBe(
      "2"
    );
    expect(document.querySelector("#addon-event-count")?.textContent).toBe(
      "1"
    );
  });

  it("keeps the live validation summary synchronized without making it a competing live region", () => {
    const markup = readDocsFile("validation-integration.html");
    const page = parseDocsPage("validation-integration.html");
    const summary = page.querySelector<HTMLElement>("#validation-summary");

    expect(summary).not.toBeNull();
    expect(summary?.getAttribute("role")).toBeNull();
    expect(summary?.getAttribute("aria-live")).toBeNull();
    expect(summary?.getAttribute("tabindex")).toBe("-1");
    expect(markup).toContain('addEventListener("blur", record.onBlur)');
    expect(markup).toContain('addEventListener("input", record.onInput)');
    expect(markup).toContain("LIVE_VALIDATION_DELAY = 180");
    expect(markup).toContain('validateRecord(record, "live")');
    expect(markup).toContain('validateRecord(record, "review")');
    expect(markup).toContain("if (isReviewing)");
    expect(markup).toContain('id="validation-review" type="button"');
    expect(markup).toContain('form.addEventListener("submit", (event) => {');
    expect(markup).toContain("event.preventDefault();");
    expect(markup).toContain('error.setAttribute("role", "status")');
    expect(markup).toContain('error.setAttribute("aria-live", "polite")');
    expect(markup).toContain('removeEventListener("blur", record.onBlur)');
    expect(markup).toContain('removeEventListener("input", record.onInput)');
    expect(markup).toContain("window.clearTimeout(record.validationTimer)");
    expect(markup.match(/summary\.focus\(\)/g)).toHaveLength(1);
  });

  it("runs the live validation, error-review focus, and removal-cleanup demo flow", async () => {
    vi.useFakeTimers();

    try {
      const markup = readDocsFile("validation-integration.html");
      const parsed = parseDocsPage("validation-integration.html");
      const inlineModule = markup.match(
        /<script type="module">([\s\S]*?)<\/script>/
      )?.[1];

      expect(inlineModule).toBeDefined();
      document.documentElement.innerHTML = parsed.documentElement.innerHTML;

      const executableDemo = inlineModule!.replace(
        /^\s*import .*;\s*$/gm,
        ""
      );
      const runDemo = new Function(
        "createRepeatableFieldset",
        "createValidationBridge",
        executableDemo
      );
      runDemo(createRepeatableFieldset, createValidationBridge);

      const root = document.querySelector<HTMLElement>(
        "[data-a11y-repeatable-fieldset]"
      );
      const form = document.querySelector<HTMLFormElement>(
        "#validation-demo-form"
      );
      const summary = document.querySelector<HTMLElement>(
        "#validation-summary"
      );
      const addButton = root?.querySelector<HTMLButtonElement>(
        "[data-a11y-repeatable-fieldset-add]"
      );
      const reviewButton = document.querySelector<HTMLButtonElement>(
        "#validation-review"
      );

      expect(root).not.toBeNull();
      expect(form).not.toBeNull();
      expect(summary).not.toBeNull();
      expect(addButton).not.toBeNull();
      expect(form?.getAttribute("action")).toBeNull();
      expect(reviewButton?.type).toBe("button");
      addButton!.click();

      const items = root!.querySelectorAll<HTMLFieldSetElement>(
        "[data-a11y-repeatable-fieldset-item]"
      );
      const addedItem = items.item(1);
      const addedName = addedItem.querySelector<HTMLInputElement>(
        'input[name$="[name]"]'
      );
      const addedEmail = addedItem.querySelector<HTMLInputElement>(
        'input[name$="[email]"]'
      );

      expect(addedName).not.toBeNull();
      expect(addedEmail).not.toBeNull();
      addedName!.focus();
      addedEmail!.focus();

      const nameError = addedItem.querySelector<HTMLElement>(
        `#${addedName!.id}-validation-error`
      );
      expect(nameError?.getAttribute("role")).toBe("status");
      expect(summary!.hidden).toBe(false);
      expect(summary!.querySelectorAll("a")).toHaveLength(1);
      expect(document.activeElement).toBe(addedEmail);

      addedName!.value = "Grace Hopper";
      addedName!.dispatchEvent(new Event("input", { bubbles: true }));
      await vi.advanceTimersByTimeAsync(180);

      expect(
        addedItem.querySelector(`#${addedName!.id}-validation-error`)
      ).toBeNull();
      expect(summary!.hidden).toBe(true);
      expect(summary!.querySelectorAll("a")).toHaveLength(0);

      const submit = new Event("submit", {
        bubbles: true,
        cancelable: true
      });
      form!.dispatchEvent(submit);

      expect(submit.defaultPrevented).toBe(true);
      expect(summary!.hidden).toBe(true);
      expect(summary!.querySelectorAll("a")).toHaveLength(0);

      reviewButton!.click();

      const emailError = addedItem.querySelector<HTMLElement>(
        `#${addedEmail!.id}-validation-error`
      );
      expect(document.activeElement).toBe(summary);
      expect(emailError?.getAttribute("role")).toBeNull();
      expect(emailError?.getAttribute("aria-live")).toBeNull();
      expect(summary!.querySelectorAll("a")).toHaveLength(1);

      summary!.querySelector<HTMLAnchorElement>("a")!.click();
      expect(document.activeElement).toBe(addedEmail);

      const pendingValidation = vi.spyOn(addedEmail!, "checkValidity");
      addedEmail!.value = "grace@example.com";
      addedEmail!.dispatchEvent(new Event("input", { bubbles: true }));
      pendingValidation.mockClear();

      addedItem
        .querySelector<HTMLButtonElement>(
          "[data-a11y-repeatable-fieldset-remove]"
        )!
        .click();
      await vi.advanceTimersByTimeAsync(180);

      expect(addedItem.isConnected).toBe(false);
      expect(pendingValidation).not.toHaveBeenCalled();
      pendingValidation.mockRestore();
      expect(summary!.hidden).toBe(true);
      expect(summary!.querySelectorAll("a")).toHaveLength(0);
      expect(
        document.querySelector("#validation-contact-server-42-email-server-error")
          ?.textContent
      ).toContain("Server message");

      createRepeatableFieldset(root!).destroy();
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
      document.body.replaceChildren();
    }
  });

  it("initializes the saved-items demo without recreating server state", () => {
    const page = parseDocsPage("existing-items.html");
    const root = page.querySelector<HTMLElement>(
      "[data-a11y-repeatable-fieldset]"
    );
    const savedName = page.querySelector<HTMLInputElement>(
      "#contact-1042-name"
    );
    const serverError = page.querySelector("#contact-2088-phone-error");

    expect(root).not.toBeNull();
    expect(savedName?.value).toBe("Ada Lovelace");
    expect(savedName?.name).toBe("contacts[contact-1042][name]");
    expect(serverError?.textContent).toContain("Server message");

    const instance = createRepeatableFieldset(root!);

    expect(instance.getCount()).toBe(2);
    expect(savedName?.value).toBe("Ada Lovelace");
    expect(savedName?.name).toBe("contacts[contact-1042][name]");
    expect(page.querySelector("#contact-2088-phone-error")).toBe(serverError);

    expect(instance.add().ok).toBe(true);
    expect(instance.getCount()).toBe(3);
    instance.destroy();
  });

  it("enforces the finite limits demonstrated by the limits page", () => {
    const page = parseDocsPage("limits.html");
    const markup = readDocsFile("limits.html");
    const root = page.querySelector<HTMLElement>(
      "[data-a11y-repeatable-fieldset]"
    );
    const form = page.querySelector<HTMLFormElement>("#delivery-contact-form");
    const preview = page.querySelector<HTMLOutputElement>(
      "#delivery-contact-preview"
    );
    const instance = createRepeatableFieldset(root!);

    expect(form?.method).toBe("get");
    expect(form?.action).toContain("/limits.html");
    expect(preview?.textContent).toBe("No preview generated yet.");
    expect(markup).toContain('form.addEventListener("submit"');
    expect(markup).toContain("event.preventDefault()");
    expect(markup).toContain('preview.value = contacts.join(" ")');
    expect(instance.getCount()).toBe(1);
    expect(instance.canRemove()).toBe(false);
    expect(instance.canAdd()).toBe(true);
    expect(instance.add().ok).toBe(true);
    expect(instance.add().ok).toBe(true);
    expect(instance.getCount()).toBe(3);
    expect(instance.canAdd()).toBe(false);
    expect(instance.add()).toMatchObject({
      ok: false,
      reason: "maximum"
    });
    instance.destroy();
  });

  it("materializes every complex field relationship with isolated radios", () => {
    const page = parseDocsPage("complex-fields.html");
    const root = page.querySelector<HTMLElement>(
      "[data-a11y-repeatable-fieldset]"
    );
    const instance = createRepeatableFieldset(root!);
    const firstAdd = instance.add();
    const secondAdd = instance.add();

    expect(firstAdd.ok).toBe(true);
    expect(secondAdd.ok).toBe(true);

    if (firstAdd.ok && secondAdd.ok) {
      const firstRadio = firstAdd.item.element.querySelector<HTMLInputElement>(
        'input[type="radio"]'
      );
      const secondRadio =
        secondAdd.item.element.querySelector<HTMLInputElement>(
          'input[type="radio"]'
        );
      const firstFile = firstAdd.item.element.querySelector<HTMLInputElement>(
        'input[type="file"]'
      );
      const describedInput =
        firstAdd.item.element.querySelector<HTMLInputElement>(
          'input[aria-describedby]'
        );

      expect(firstRadio?.name).toContain(firstAdd.item.key);
      expect(secondRadio?.name).toContain(secondAdd.item.key);
      expect(firstRadio?.name).not.toBe(secondRadio?.name);
      expect(firstFile?.files).toHaveLength(0);
      expect(describedInput?.getAttribute("aria-describedby")).toContain(
        firstAdd.item.key
      );
      expect(
        firstAdd.item.element
          .querySelector("[headers]")
          ?.getAttribute("headers")
      ).toContain(firstAdd.item.key);
    }

    instance.destroy();
  });

  it("keeps one no-JavaScript root uninitialized by explicit choice", () => {
    const page = parseDocsPage("no-javascript.html");
    const enhancedRoot = page.querySelector<HTMLElement>("#enhanced-example");
    const baselineRoot = page.querySelector<HTMLElement>("#baseline-example");
    const baselineAdd = baselineRoot?.querySelector<HTMLButtonElement>(
      "[data-a11y-repeatable-fieldset-add]"
    );

    const instance = createRepeatableFieldset(enhancedRoot!);

    expect(
      enhancedRoot?.querySelector<HTMLButtonElement>(
        "[data-a11y-repeatable-fieldset-add]"
      )?.hidden
    ).toBe(false);
    expect(baselineAdd?.hidden).toBe(true);
    expect(
      baselineRoot?.querySelector<HTMLInputElement>("input")?.name
    ).toBe("baselineReferences[reference-baseline][email]");
    instance.destroy();
  });

  it("demonstrates transactional invalid-option recovery", () => {
    const page = parseDocsPage("edge-cases.html");
    const root = page.querySelector<HTMLElement>("#recovery-root");
    const input = page.querySelector<HTMLInputElement>(
      "#subscriber-saved-email"
    );
    const addButton = root?.querySelector<HTMLButtonElement>(
      "[data-a11y-repeatable-fieldset-add]"
    );
    const before = {
      input,
      name: input?.name,
      value: input?.value,
      addHidden: addButton?.hidden
    };

    expect(() => createRepeatableFieldset(root!)).toThrowError(
      RepeatableFieldsetError
    );
    expect(input).toBe(before.input);
    expect(input?.name).toBe(before.name);
    expect(input?.value).toBe(before.value);
    expect(addButton?.hidden).toBe(before.addHidden);

    root!.dataset["maxItems"] = "2";
    const instance = createRepeatableFieldset(root!);
    expect(instance.getCount()).toBe(1);
    expect(addButton?.hidden).toBe(false);
    instance.destroy();
  });

  it("documents stable names without substituting visible positions", () => {
    const stableKeys = readDocsFile("stable-keys.html");

    expect(stableKeys).toContain("__A11Y_REPEATABLE_KEY__");
    expect(stableKeys).toContain("contacts[contact-2088][phone]");
    expect(stableKeys).toContain("contacts[item-1][name]");
    expect(stableKeys).toContain("Radio groups use the stable key");
    expect(stableKeys).not.toContain("pending");
  });

  it("documents the implemented API and exact lifecycle event set", () => {
    const api = readDocsFile("api.html");
    const lifecycle = readDocsFile("lifecycle-events.html");

    for (const exportName of [
      "A11yRepeatableFieldset",
      "createRepeatableFieldset",
      "initRepeatableFieldsetAll",
      "RepeatableFieldsetError",
      "./min",
      "./docs",
      "./addons/validation-bridge",
      "./addons/legend-sync",
      "./addons/remove-guard",
      "./addons/accessible-reorder",
      "./addons/duplicate-item",
      "./addons/undo-remove",
      "./addons/form-memory-bridge",
      "./styles.css"
    ]) {
      expect(api).toContain(exportName);
    }

    for (const eventName of [
      "a11y-repeatable-fieldset:init",
      "a11y-repeatable-fieldset:item-added",
      "a11y-repeatable-fieldset:item-duplicated",
      "a11y-repeatable-fieldset:item-removed",
      "a11y-repeatable-fieldset:item-restored",
      "a11y-repeatable-fieldset:item-moved",
      "a11y-repeatable-fieldset:destroy"
    ]) {
      expect(lifecycle).toContain(eventName);
    }

    expect(lifecycle).toContain("<code>bubbles: true</code>");
    expect(lifecycle).toContain("<code>composed: false</code>");
    expect(lifecycle).toContain("<code>cancelable: false</code>");
  });

  it("documents the shipped addons and keeps storage ownership separate", () => {
    const addons = readDocsFile("addons.html");
    const validation = readDocsFile("validation-integration.html");
    const memory = readDocsFile("form-memory-integration.html");

    expect(addons).toContain(
      "Validation Bridge, Legend Sync, Remove Guard, Accessible Reorder, Duplicate Item, Undo Remove, and Form Memory Bridge are implemented concrete addons"
    );
    expect(addons).toContain("reverse registration order");
    expect(addons).toContain("Placeholder exports are intentionally excluded");
    expect(validation).toContain("Validation Bridge is implemented and opt-in");
    expect(validation).toContain("before the fieldset is detached");
    expect(validation).toContain(
      "The bridge creates no structural live region"
    );
    expect(validation).toContain("A11y Form Validator 1.0.19");
    expect(validation).toContain("whole-form <code>clearErrors()</code>");
    expect(validation).toContain(
      'from "./assets/validation-bridge.js"'
    );
    expect(memory).toContain("Restore structure before values");
    expect(memory).toContain("Never read, serialize, assign, or claim to restore file-input values");
    expect(memory).toContain("schema version");
    expect(memory).toContain(
      "a11y-repeatable-fieldset/addons/form-memory-bridge"
    );
    expect(memory).toContain("A11yFormDraftPersistence");
    expect(memory).toContain("never writes to browser storage by itself");

    expect(addons).toContain(
      "a11y-repeatable-fieldset/addons/validation-bridge"
    );
    expect(addons).toContain(
      "a11y-repeatable-fieldset/addons/legend-sync"
    );
    expect(addons).toContain(
      "a11y-repeatable-fieldset/addons/remove-guard"
    );
    expect(addons).toContain(
      "a11y-repeatable-fieldset/addons/accessible-reorder"
    );
    expect(addons).toContain(
      "a11y-repeatable-fieldset/addons/duplicate-item"
    );
    expect(addons).toContain(
      "a11y-repeatable-fieldset/addons/undo-remove"
    );
    expect(addons).toContain(
      "a11y-repeatable-fieldset/addons/form-memory-bridge"
    );
    expect(addons).toContain("single control-driven Remove-request route");
    expect(addons).toContain("Public <code>instance.remove()</code> calls remain immediate approved API commands");
    expect(addons).toContain("applying the source marker is an explicit privacy decision");
    expect(validation).toContain(
      "a11y-repeatable-fieldset/addons/validation-bridge"
    );
  });

  it("runs a repository-subpath simulation as part of Pages checks", () => {
    const packageJson = readFileSync(
      resolve(process.cwd(), "package.json"),
      "utf8"
    );
    const checkerPath = resolve(
      process.cwd(),
      "scripts/check-pages-subpath.mjs"
    );
    const checker = readFileSync(checkerPath, "utf8");

    expect(existsSync(checkerPath)).toBe(true);
    expect(packageJson).toContain("node scripts/check-pages-subpath.mjs");
    expect(checker).toContain('const repositoryName = "A11y-Repeatable-Fieldset"');
    expect(checker).toContain("await fetch(url)");
    expect(checker).toContain("await rm(temporaryRoot");
  });
});
