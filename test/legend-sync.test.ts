import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

import * as mainEntry from "../src";
import {
  createLegendSyncAddon,
  type LegendSyncOptions
} from "../src/addons/legend-sync";
import {
  EVENTS,
  RepeatableFieldsetError,
  createRepeatableFieldset
} from "../src/index";
import {
  createTestRepeatableFieldsetMarkup,
  type TestRepeatableFieldsetMarkup
} from "./helpers/create-markup";

const SOURCE_SELECTOR =
  "[data-a11y-repeatable-fieldset-legend-source]";
const TARGET_SELECTOR =
  "[data-a11y-repeatable-fieldset-legend-value]";

interface LegendSyncMarkup {
  readonly markup: TestRepeatableFieldsetMarkup;
  readonly existingTarget: HTMLElement;
  readonly templateTarget: HTMLElement;
}

function appendLegendTarget(
  item: HTMLFieldSetElement,
  initialText = ""
): HTMLElement {
  const legend = item.querySelector("legend");

  if (legend === null) {
    throw new Error("Expected a legend in the Legend Sync test item.");
  }

  const target = item.ownerDocument.createElement("span");
  target.dataset["a11yRepeatableFieldsetLegendValue"] = "";
  target.textContent = initialText;
  legend.append(target);

  return target;
}

function createLegendSyncMarkup(
  existingValue = "",
  existingTargetText = ""
): LegendSyncMarkup {
  const markup = createTestRepeatableFieldsetMarkup(document);
  markup.input.dataset["a11yRepeatableFieldsetLegendSource"] = "";
  markup.input.value = existingValue;
  const templateInput = markup.templateItem.querySelector<HTMLInputElement>(
    "input"
  );

  if (templateInput === null) {
    throw new Error("Expected a template source input.");
  }

  templateInput.dataset["a11yRepeatableFieldsetLegendSource"] = "";

  return {
    markup,
    existingTarget: appendLegendTarget(markup.item, existingTargetText),
    templateTarget: appendLegendTarget(markup.templateItem)
  };
}

function getAddedLegendParts(item: HTMLFieldSetElement): {
  readonly source: HTMLInputElement;
  readonly target: HTMLElement;
} {
  const source = item.querySelector<HTMLInputElement>(SOURCE_SELECTOR);
  const target = item.querySelector<HTMLElement>(TARGET_SELECTOR);

  if (source === null || target === null) {
    throw new Error("Expected an added Legend Sync source and target.");
  }

  return { source, target };
}

describe("Legend Sync addon", () => {
  it("creates a frozen addon with safe committed-change defaults", () => {
    const addon = createLegendSyncAddon();

    expect(addon.id).toBe("a11y-repeatable-fieldset.legend-sync");
    expect(addon.setup).toBeUndefined();
    expect(addon.setupItem).toBeTypeOf("function");
    expect(Object.isFrozen(addon)).toBe(true);

    expect(() =>
      createLegendSyncAddon(null as unknown as LegendSyncOptions)
    ).toThrowError("Legend Sync: options must be an object.");
    expect(() => createLegendSyncAddon({ source: " input " })).toThrowError(
      "Legend Sync: source must be a trimmed, non-empty selector."
    );
    expect(() =>
      createLegendSyncAddon({
        updateOn: "input" as unknown as "change"
      })
    ).toThrowError('Legend Sync: updateOn must be "change".');
    expect(() =>
      createLegendSyncAddon({
        emptyText: null as unknown as string
      })
    ).toThrowError("Legend Sync: emptyText must be a string.");
    expect(() =>
      createLegendSyncAddon({
        source: SOURCE_SELECTOR,
        target: SOURCE_SELECTOR
      })
    ).toThrowError(
      "Legend Sync: source and target must use different selectors."
    );
    expect(() =>
      createLegendSyncAddon({
        unexpected: true
      } as unknown as LegendSyncOptions)
    ).toThrowError('Legend Sync: unknown option "unexpected".');
  });

  it("synchronizes existing and added legends only on committed change", () => {
    const { markup, existingTarget } = createLegendSyncMarkup("  Maria  ");
    const addon = createLegendSyncAddon({
      source: SOURCE_SELECTOR,
      target: TARGET_SELECTOR,
      updateOn: "change",
      emptyText: ""
    });
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0,
      itemLabel: "Contact",
      addons: [addon]
    });

    expect(existingTarget.textContent).toBe(" — Maria");
    expect(markup.item.querySelector("legend")?.textContent).toBe(
      "Contact 1 — Maria"
    );

    const added = instance.add();
    expect(added.ok).toBe(true);

    if (!added.ok) {
      throw new Error("Expected Legend Sync-backed Add to succeed.");
    }

    const { source, target } = getAddedLegendParts(added.item.element);
    expect(target.textContent).toBe("");
    expect(added.item.element.querySelector("legend")?.textContent).toBe(
      "Contact 2"
    );

    source.value = "  Amina   Yusuf  ";
    source.dispatchEvent(new Event("input", { bubbles: true }));
    expect(target.textContent).toBe("");

    source.dispatchEvent(new Event("change", { bubbles: true }));
    expect(target.textContent).toBe(" — Amina Yusuf");
    expect(added.item.element.querySelector("legend")?.textContent).toBe(
      "Contact 2 — Amina Yusuf"
    );

    instance.destroy();
  });

  it("uses the explicit empty state without replacing label or position", () => {
    const first = createLegendSyncMarkup("   ");
    const firstInstance = createRepeatableFieldset(first.markup.root, {
      addons: [createLegendSyncAddon()]
    });

    expect(first.existingTarget.textContent).toBe("");
    expect(first.markup.item.querySelector("legend")?.textContent).toBe(
      "Contact 1"
    );
    firstInstance.destroy();
    first.markup.root.remove();

    const second = createLegendSyncMarkup("");
    const secondInstance = createRepeatableFieldset(second.markup.root, {
      addons: [createLegendSyncAddon({ emptyText: "  Not named  " })]
    });

    expect(second.existingTarget.textContent).toBe(" — Not named");
    expect(second.markup.item.querySelector("legend")?.textContent).toBe(
      "Contact 1 — Not named"
    );
    secondInstance.destroy();
  });

  it("uses a single-select's visible option label instead of its submitted value", () => {
    const { markup, existingTarget } = createLegendSyncMarkup();
    markup.input.removeAttribute(
      "data-a11y-repeatable-fieldset-legend-source"
    );
    const select = document.createElement("select");
    select.dataset["a11yRepeatableFieldsetLegendSource"] = "";
    select.innerHTML =
      '<option value="">Choose a contact</option><option value="m-42">María García</option>';
    select.value = "m-42";
    markup.input.before(select);
    const instance = createRepeatableFieldset(markup.root, {
      addons: [createLegendSyncAddon()]
    });

    expect(existingTarget.textContent).toBe(" — María García");
    select.value = "";
    select.dispatchEvent(new Event("change"));
    expect(existingTarget.textContent).toBe("");

    instance.destroy();
  });

  it("restores author text and detaches listeners during remove and destroy", () => {
    const { markup, existingTarget } = createLegendSyncMarkup(
      "Maria",
      " — Server value"
    );
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0,
      addons: [createLegendSyncAddon()]
    });

    expect(existingTarget.textContent).toBe(" — Maria");
    const added = instance.add();
    expect(added.ok).toBe(true);

    if (!added.ok) {
      throw new Error("Expected Legend Sync-backed Add to succeed.");
    }

    const addedParts = getAddedLegendParts(added.item.element);
    addedParts.source.value = "Noah";
    addedParts.source.dispatchEvent(new Event("change"));
    expect(addedParts.target.textContent).toBe(" — Noah");

    expect(instance.remove(added.item)).toMatchObject({ ok: true });
    expect(addedParts.target.textContent).toBe("");
    addedParts.source.value = "Detached value";
    addedParts.source.dispatchEvent(new Event("change"));
    expect(addedParts.target.textContent).toBe("");

    instance.destroy();
    expect(existingTarget.textContent).toBe(" — Server value");
    markup.input.value = "After destroy";
    markup.input.dispatchEvent(new Event("change"));
    expect(existingTarget.textContent).toBe(" — Server value");
  });

  it("excludes markers in a nested root from the owning item", () => {
    const { markup, existingTarget } = createLegendSyncMarkup("Maria");
    const nestedRoot = document.createElement("section");
    nestedRoot.dataset["a11yRepeatableFieldset"] = "";
    const nestedFieldset = document.createElement("fieldset");
    const nestedLegend = document.createElement("legend");
    const nestedTarget = document.createElement("span");
    nestedTarget.dataset["a11yRepeatableFieldsetLegendValue"] = "";
    nestedLegend.append("Nested 1", nestedTarget);
    const nestedSource = document.createElement("input");
    nestedSource.dataset["a11yRepeatableFieldsetLegendSource"] = "";
    nestedSource.value = "Nested secret";
    nestedFieldset.append(nestedLegend, nestedSource);
    nestedRoot.append(nestedFieldset);
    markup.item.insertBefore(nestedRoot, markup.removeButton);

    const instance = createRepeatableFieldset(markup.root, {
      addons: [createLegendSyncAddon()]
    });

    expect(existingTarget.textContent).toBe(" — Maria");
    expect(nestedTarget.textContent).toBe("");
    nestedSource.dispatchEvent(new Event("change"));
    expect(nestedTarget.textContent).toBe("");

    instance.destroy();
  });

  it("isolates the same addon configuration across multiple roots", () => {
    const first = createLegendSyncMarkup("Maria");
    const second = createLegendSyncMarkup("Noah");
    const secondLabel = second.markup.item.querySelector("label");
    second.markup.item.dataset["a11yRepeatableFieldsetKey"] = "server-84";
    second.markup.input.id = "contact-server-84-name";
    second.markup.input.name = "contacts[server-84][name]";

    if (secondLabel === null) {
      throw new Error("Expected the second root's source label.");
    }

    secondLabel.htmlFor = second.markup.input.id;
    const addon = createLegendSyncAddon();
    const firstInstance = createRepeatableFieldset(first.markup.root, {
      addons: [addon]
    });
    const secondInstance = createRepeatableFieldset(second.markup.root, {
      addons: [addon]
    });

    expect(first.existingTarget.textContent).toBe(" — Maria");
    expect(second.existingTarget.textContent).toBe(" — Noah");

    first.markup.input.value = "Iris";
    first.markup.input.dispatchEvent(new Event("change"));
    expect(first.existingTarget.textContent).toBe(" — Iris");
    expect(second.existingTarget.textContent).toBe(" — Noah");

    firstInstance.destroy();
    secondInstance.destroy();
  });

  it.each([
    ["password input", { type: "password" }],
    ["hidden input", { type: "hidden" }],
    ["file input", { type: "file" }],
    ["payment autocomplete", { type: "text", autocomplete: "cc-number" }],
    ["one-time-code autocomplete", { type: "text", autocomplete: "one-time-code" }]
  ])("rejects a sensitive %s source transactionally", (_name, attributes) => {
    const { markup, existingTarget } = createLegendSyncMarkup("Secret");
    markup.input.type = attributes.type;

    if ("autocomplete" in attributes) {
      markup.input.setAttribute("autocomplete", attributes.autocomplete);
    }

    expect(() =>
      createRepeatableFieldset(markup.root, {
        addons: [createLegendSyncAddon()]
      })
    ).toThrowError(RepeatableFieldsetError);
    expect(existingTarget.textContent).toBe("");
    expect(markup.addButton.hidden).toBe(true);
  });

  it.each(["hidden", "inert", "aria-hidden"])(
    "rejects a source with the %s state",
    (attribute) => {
      const { markup } = createLegendSyncMarkup("Private value");
      markup.input.setAttribute(
        attribute,
        attribute === "aria-hidden" ? "true" : ""
      );

      expect(() =>
        createRepeatableFieldset(markup.root, {
          addons: [createLegendSyncAddon()]
        })
      ).toThrowError(RepeatableFieldsetError);
    }
  );

  it("rolls back an added item whose template uses a sensitive source", () => {
    const { markup } = createLegendSyncMarkup("Maria");
    const templateSource = markup.templateItem.querySelector<HTMLInputElement>(
      SOURCE_SELECTOR
    );

    if (templateSource === null) {
      throw new Error("Expected a template Legend Sync source.");
    }

    templateSource.type = "password";
    const instance = createRepeatableFieldset(markup.root, {
      addons: [createLegendSyncAddon()]
    });
    const addedEvents = vi.fn();
    markup.root.addEventListener(EVENTS.itemAdded, addedEvents);

    expect(instance.add()).toMatchObject({
      ok: false,
      reason: "addon-error"
    });
    expect(instance.getCount()).toBe(1);
    expect(markup.items.children).toHaveLength(1);
    expect(addedEvents).not.toHaveBeenCalled();

    instance.destroy();
  });

  it("restores earlier legend targets when a later existing item fails setup", () => {
    const { markup, existingTarget } = createLegendSyncMarkup(
      "Maria",
      " — Authored server summary"
    );
    const second = markup.item.cloneNode(true) as HTMLFieldSetElement;
    second.dataset["a11yRepeatableFieldsetKey"] = "server-84";
    const secondInput = second.querySelector<HTMLInputElement>(SOURCE_SELECTOR);
    const secondLabel = second.querySelector("label");

    if (secondInput === null || secondLabel === null) {
      throw new Error("Expected the cloned existing Legend Sync item.");
    }

    secondInput.id = "contact-server-84-name";
    secondInput.name = "contacts[server-84][name]";
    secondInput.type = "password";
    secondLabel.htmlFor = secondInput.id;
    markup.items.append(second);

    expect(() =>
      createRepeatableFieldset(markup.root, {
        addons: [createLegendSyncAddon()]
      })
    ).toThrowError(RepeatableFieldsetError);
    expect(existingTarget.textContent).toBe(" — Authored server summary");
    expect(markup.addButton.hidden).toBe(true);
  });

  it("does not create a second live region, event, or structural message", () => {
    const { markup } = createLegendSyncMarkup("Maria");
    const addedEvents = vi.fn();
    markup.root.addEventListener(EVENTS.itemAdded, addedEvents);
    const instance = createRepeatableFieldset(markup.root, {
      itemLabel: "Contact",
      addons: [createLegendSyncAddon()]
    });
    const added = instance.add();

    expect(added.ok).toBe(true);
    expect(addedEvents).toHaveBeenCalledTimes(1);

    if (!added.ok) {
      throw new Error("Expected Legend Sync-backed Add to succeed.");
    }

    const statusRegions = markup.root.querySelectorAll(
      '[role="status"], [role="alert"], [aria-live]:not([aria-live="off"])'
    );
    const status = markup.root.querySelector<HTMLElement>(
      "[data-a11y-repeatable-fieldset-status]"
    );
    const statusBeforeLegendChange = status?.textContent;
    const { source, target } = getAddedLegendParts(added.item.element);

    expect(statusRegions).toHaveLength(1);
    expect(statusBeforeLegendChange).not.toContain("Maria");

    source.value = "A deliberately selected value";
    source.dispatchEvent(new Event("change", { bubbles: true }));

    expect(target.textContent).toBe(" — A deliberately selected value");
    expect(status?.textContent).toBe(statusBeforeLegendChange);
    expect(addedEvents).toHaveBeenCalledTimes(1);
    expect(markup.root.querySelectorAll("[role='alert']")).toHaveLength(0);

    instance.destroy();
  });

  it("rejects invalid or unsafe marker contracts", () => {
    const invalidSelector = createLegendSyncMarkup("Maria");
    expect(() =>
      createRepeatableFieldset(invalidSelector.markup.root, {
        addons: [createLegendSyncAddon({ source: "[" })]
      })
    ).toThrowError(RepeatableFieldsetError);

    const duplicateSource = createLegendSyncMarkup("Maria");
    const extraSource = document.createElement("input");
    extraSource.dataset["a11yRepeatableFieldsetLegendSource"] = "";
    duplicateSource.markup.item.append(extraSource);
    expect(() =>
      createRepeatableFieldset(duplicateSource.markup.root, {
        addons: [createLegendSyncAddon()]
      })
    ).toThrowError(RepeatableFieldsetError);

    const liveTarget = createLegendSyncMarkup("Maria");
    liveTarget.existingTarget.setAttribute("aria-live", "polite");
    expect(() =>
      createRepeatableFieldset(liveTarget.markup.root, {
        addons: [createLegendSyncAddon()]
      })
    ).toThrowError(RepeatableFieldsetError);
  });

  it("keeps the concrete addon out of the main runtime entry", () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), "package.json"), "utf8")
    ) as {
      exports: Record<string, unknown>;
      dependencies: Record<string, unknown>;
    };
    const mainSource = readFileSync(
      resolve(process.cwd(), "src/index.ts"),
      "utf8"
    );
    const coreBundle = readFileSync(
      resolve(process.cwd(), "docs/assets/a11y-repeatable-fieldset.js"),
      "utf8"
    );
    const addonBundle = readFileSync(
      resolve(process.cwd(), "docs/assets/legend-sync.js"),
      "utf8"
    );

    expect(mainEntry).not.toHaveProperty("createLegendSyncAddon");
    expect(mainSource).not.toContain("legend-sync");
    expect(coreBundle).not.toContain("createLegendSyncAddon");
    expect(addonBundle).toContain("createLegendSyncAddon");
    expect(packageJson.exports).toHaveProperty("./addons/legend-sync");
    expect(packageJson.dependencies).toEqual({});
  });
});
