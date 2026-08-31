import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, expectTypeOf, it, vi } from "vitest";

import * as mainEntry from "../src";
import {
  createFormMemoryBridge,
  type FormMemoryBridgeOptions,
  type FormMemoryDraftControlAdapter,
  type FormMemoryDraftRecord,
  type FormMemoryJsonValue
} from "../src/addons/form-memory-bridge";
import {
  EVENTS,
  createRepeatableFieldset,
  type RepeatableFieldsetAddon
} from "../src/index";
import { createTestRepeatableFieldsetMarkup } from "./helpers/create-markup";

const ADAPTER_ID = "a11y-repeatable-fieldset.form-memory-bridge.v1";
const FIELD_KEY = "application:contacts:structure";

interface CompatibleDraftControlAdapter {
  readonly id: string;
  matches(element: HTMLElement): boolean;
  getFieldKey?(
    element: HTMLElement,
    context: { readonly element: HTMLElement; readonly root: HTMLElement }
  ): string | null;
  read(
    element: HTMLElement,
    context: { readonly element: HTMLElement; readonly root: HTMLElement }
  ): FormMemoryJsonValue;
  compare?(
    current: FormMemoryJsonValue,
    saved: FormMemoryJsonValue,
    context: { readonly element: HTMLElement; readonly root: HTMLElement }
  ): boolean;
  write?(
    element: HTMLElement,
    saved: FormMemoryJsonValue,
    context: { readonly element: HTMLElement; readonly root: HTMLElement }
  ): void;
}

function createRecord(itemKeys: readonly string[]): FormMemoryDraftRecord {
  return Object.freeze({
    fields: Object.freeze([
      Object.freeze({
        adapterId: ADAPTER_ID,
        fieldKey: FIELD_KEY,
        kind: "custom",
        value: Object.freeze({
          schemaVersion: 1,
          itemKeys: Object.freeze([...itemKeys])
        })
      })
    ])
  });
}

function createBridge(
  root: HTMLElement,
  save: FormMemoryBridgeOptions["save"] = vi.fn()
) {
  return createFormMemoryBridge({
    root,
    fieldKey: FIELD_KEY,
    createInstance: createRepeatableFieldset,
    save
  });
}

function appendExistingItem(
  source: HTMLFieldSetElement,
  items: HTMLElement,
  key: string
): HTMLFieldSetElement {
  const clone = source.cloneNode(true) as HTMLFieldSetElement;
  clone.setAttribute("data-a11y-repeatable-fieldset-key", key);

  const input = clone.querySelector<HTMLInputElement>("input");
  const label = clone.querySelector<HTMLLabelElement>("label");

  if (input === null || label === null) {
    throw new Error("Expected a labelled input in the cloned test item.");
  }

  input.id = `contact-${key}-name`;
  input.name = `contacts[${key}][name]`;
  label.htmlFor = input.id;
  items.append(clone);
  return clone;
}

function adapterContext(root: HTMLElement) {
  return Object.freeze({ element: root, root: root.closest("form") ?? root });
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe("Form Memory Bridge addon", () => {
  it("creates a frozen optional bridge with an upstream-compatible adapter", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const save = vi.fn();
    const bridge = createBridge(markup.root, save);

    expect(bridge.id).toBe("a11y-repeatable-fieldset.form-memory-bridge");
    expect(bridge.setup).toBeTypeOf("function");
    expect(bridge.setupItem).toBeUndefined();
    expect(bridge.draftControlAdapter.id).toBe(ADAPTER_ID);
    expect(Object.isFrozen(bridge)).toBe(true);
    expect(Object.isFrozen(bridge.draftControlAdapter)).toBe(true);
    expectTypeOf(
      bridge.draftControlAdapter
    ).toMatchTypeOf<CompatibleDraftControlAdapter>();
    expectTypeOf(
      bridge.draftControlAdapter
    ).toEqualTypeOf<FormMemoryDraftControlAdapter>();

    expect(bridge.draftControlAdapter.matches(markup.root)).toBe(true);
    expect(
      bridge.draftControlAdapter.matches(markup.item)
    ).toBe(false);
    expect(
      bridge.draftControlAdapter.getFieldKey(
        markup.root,
        adapterContext(markup.root)
      )
    ).toBe(FIELD_KEY);
    expect(save).not.toHaveBeenCalled();
  });

  it("validates options without importing or initializing either package", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);

    expect(() =>
      createFormMemoryBridge(null as unknown as FormMemoryBridgeOptions)
    ).toThrowError("Form Memory Bridge: options must be an object.");
    expect(() =>
      createFormMemoryBridge({
        root: markup.root,
        fieldKey: " contacts ",
        createInstance: createRepeatableFieldset,
        save: vi.fn()
      })
    ).toThrowError(
      "Form Memory Bridge: fieldKey must be a trimmed, non-empty string."
    );
    expect(() =>
      createFormMemoryBridge({
        root: markup.root,
        fieldKey: FIELD_KEY,
        createInstance: createRepeatableFieldset,
        save: null as unknown as FormMemoryBridgeOptions["save"]
      })
    ).toThrowError("Form Memory Bridge: save must be a function.");
    expect(() =>
      createFormMemoryBridge({
        root: markup.root,
        fieldKey: FIELD_KEY,
        createInstance: null,
        save: vi.fn()
      } as unknown as FormMemoryBridgeOptions)
    ).toThrowError("Form Memory Bridge: createInstance must be a function.");
    expect(markup.addButton.hidden).toBe(true);
  });

  it("initializes without a draft and reads only stable structure", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    markup.input.value = "Current server value";
    const bridge = createBridge(markup.root);
    const result = bridge.initialize();

    expect(result).toMatchObject({
      ok: true,
      structure: "not-found",
      addedKeys: [],
      preservedItemCount: 1,
      reordered: false
    });
    expect(markup.input.value).toBe("Current server value");
    expect(
      bridge.draftControlAdapter.read(
        markup.root,
        adapterContext(markup.root)
      )
    ).toEqual({
      schemaVersion: 1,
      itemKeys: ["server-42"]
    });

    if (result.ok) {
      result.instance.destroy();
    }
  });

  it("restores missing keys and saved order before one quiet core init", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const divider = document.createElement("hr");
    markup.items.append(divider);
    const extra = appendExistingItem(
      markup.item,
      markup.items,
      "server-extra"
    );
    const addedEvents = vi.fn();
    const initEvents = vi.fn();
    markup.root.addEventListener(EVENTS.itemAdded, addedEvents);
    markup.root.addEventListener(EVENTS.init, initEvents);
    const record = createRecord(["draft-7", "server-42"]);
    const bridge = createBridge(markup.root);
    const result = bridge.initialize({ record });

    expect(result).toMatchObject({
      ok: true,
      structure: "restored",
      addedKeys: ["draft-7"],
      preservedItemCount: 1,
      reordered: true
    });
    expect(addedEvents).not.toHaveBeenCalled();
    expect(initEvents).toHaveBeenCalledTimes(1);

    const children = Array.from(markup.items.children);
    const items = Array.from(
      markup.items.querySelectorAll<HTMLFieldSetElement>(
        ":scope > [data-a11y-repeatable-fieldset-item]"
      )
    );

    expect(
      items.map((item) =>
        item.getAttribute("data-a11y-repeatable-fieldset-key")
      )
    ).toEqual(["draft-7", "server-42", "server-extra"]);
    expect(children).toEqual([
      items[0],
      divider,
      items[1],
      items[2]
    ]);
    expect(items[2]).toBe(extra);
    expect(items[0]?.querySelector("input")?.getAttribute("name")).toBe(
      "contacts[draft-7][name]"
    );
    expect(items[0]?.querySelector("label")?.htmlFor).toBe(
      "contact-draft-7-name"
    );
    expect(items[0]?.querySelector("input")?.id).toBe(
      "contact-draft-7-name"
    );

    const savedValue = record.fields[0]?.value;

    if (savedValue === undefined) {
      throw new Error("The test record is missing its structure value.");
    }

    expect(() =>
      bridge.draftControlAdapter.write(
        markup.root,
        savedValue,
        adapterContext(markup.root)
      )
    ).not.toThrow();

    if (result.ok) {
      result.instance.destroy();
    }
  });

  it("rejects corrupt and over-maximum snapshots without changing author DOM", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const originalChildren = Array.from(markup.items.children);
    const bridge = createBridge(markup.root);
    const invalid = {
      fields: [
        {
          adapterId: ADAPTER_ID,
          fieldKey: FIELD_KEY,
          kind: "custom",
          value: {
            schemaVersion: 1,
            itemKeys: ["duplicate", "duplicate"]
          }
        }
      ]
    } satisfies FormMemoryDraftRecord;

    expect(bridge.initialize({ record: invalid })).toEqual({
      ok: false,
      reason: "invalid-snapshot"
    });
    expect(Array.from(markup.items.children)).toEqual(originalChildren);
    expect(markup.addButton.hidden).toBe(true);

    expect(
      bridge.initialize({
        record: createRecord(["server-42", "draft-2"]),
        repeatableFieldsetOptions: { maximum: 1 }
      })
    ).toEqual({
      ok: false,
      reason: "maximum-exceeded",
      maximum: 1,
      requiredCount: 2
    });
    expect(Array.from(markup.items.children)).toEqual(originalChildren);
    expect(markup.addButton.hidden).toBe(true);
  });

  it("returns a structure error for IDs duplicated across prepared items", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const staticId = document.createElement("span");
    staticId.id = "template-static-id";
    markup.templateItem.append(staticId);
    const originalChildren = Array.from(markup.items.children);
    const bridge = createBridge(markup.root);
    const result = bridge.initialize({
      record: createRecord(["server-42", "draft-2", "draft-3"])
    });

    expect(result.ok).toBe(false);

    if (result.ok) {
      throw new Error("Expected duplicate prepared IDs to fail.");
    }

    expect(result.reason).toBe("structure-error");
    expect(Array.from(markup.items.children)).toEqual(originalChildren);
    expect(markup.addButton.hidden).toBe(true);
  });

  it("rolls prepared DOM back when core addon initialization fails", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const originalChildren = Array.from(markup.items.children);
    const bridge = createBridge(markup.root);
    const failure = new Error("application addon failed");
    const failingAddon = {
      id: "application.failing-addon",
      setupItem() {
        throw failure;
      }
    } satisfies RepeatableFieldsetAddon;

    expect(() =>
      bridge.initialize({
        record: createRecord(["server-42", "draft-2"]),
        repeatableFieldsetOptions: { addons: [failingAddon] }
      })
    ).toThrow();
    expect(Array.from(markup.items.children)).toEqual(originalChildren);
    expect(markup.addButton.hidden).toBe(true);
    expect(markup.removeButton.hidden).toBe(true);

    const recovered = bridge.initialize();
    expect(recovered.ok).toBe(true);

    if (recovered.ok) {
      recovered.instance.destroy();
    }
  });

  it("coalesces committed structural changes and stops scheduling on destroy", async () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const save = vi.fn(() => Promise.resolve({ status: "saved" }));
    const bridge = createBridge(markup.root, save);
    const initialized = bridge.initialize({
      repeatableFieldsetOptions: { minimum: 0 }
    });

    if (!initialized.ok) {
      throw new Error("Expected bridge initialization to succeed.");
    }

    const first = initialized.instance.add();
    const second = initialized.instance.add();
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    await flushMicrotasks();
    expect(save).toHaveBeenCalledTimes(1);

    if (second.ok) {
      expect(initialized.instance.move(second.item, "up").ok).toBe(true);
    }

    initialized.instance.destroy();
    await flushMicrotasks();
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("ignores an in-flight save rejection after destroy", async () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    let rejectSave: ((reason?: unknown) => void) | undefined;
    const save = vi.fn(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectSave = reject;
        })
    );
    const onSaveError = vi.fn();
    const bridge = createFormMemoryBridge({
      root: markup.root,
      fieldKey: FIELD_KEY,
      createInstance: createRepeatableFieldset,
      save,
      onSaveError
    });
    const initialized = bridge.initialize({
      repeatableFieldsetOptions: { minimum: 0 }
    });

    if (!initialized.ok) {
      throw new Error("Expected bridge initialization to succeed.");
    }

    expect(initialized.instance.add().ok).toBe(true);
    await flushMicrotasks();
    expect(save).toHaveBeenCalledTimes(1);

    initialized.instance.destroy();

    if (rejectSave === undefined) {
      throw new Error("Expected the deferred save to be in flight.");
    }

    rejectSave(new Error("storage unavailable"));
    await flushMicrotasks();

    expect(onSaveError).not.toHaveBeenCalled();
    expect(save).toHaveBeenCalledTimes(1);
    expect(markup.root.querySelector('[role="alert"]')).toBeNull();
    expect(markup.root.querySelectorAll("[aria-live]")).toHaveLength(0);
    expect(initialized.instance.getCount()).toBe(0);
  });

  it("reports rejected saves without adding UI or breaking later commands", async () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const error = new Error("storage unavailable");
    const onSaveError = vi.fn();
    const bridge = createFormMemoryBridge({
      root: markup.root,
      fieldKey: FIELD_KEY,
      createInstance: createRepeatableFieldset,
      save: () => Promise.reject(error),
      onSaveError
    });
    const initialized = bridge.initialize();

    if (!initialized.ok) {
      throw new Error("Expected bridge initialization to succeed.");
    }

    expect(initialized.instance.add().ok).toBe(true);
    await flushMicrotasks();
    expect(onSaveError).toHaveBeenCalledWith(error);
    expect(markup.root.querySelector('[role="alert"]')).toBeNull();
    expect(markup.root.querySelectorAll("[aria-live]")).toHaveLength(1);
    expect(initialized.instance.add().ok).toBe(true);
    initialized.instance.destroy();
  });

  it("keeps the implementation out of the main entry and wires a real subpath", () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), "package.json"), "utf8")
    ) as {
      readonly dependencies?: Record<string, string>;
      readonly exports: Record<string, unknown>;
    };
    const buildConfig = readFileSync(
      resolve(process.cwd(), "tsdown.config.ts"),
      "utf8"
    );
    const mainSource = readFileSync(
      resolve(process.cwd(), "src/index.ts"),
      "utf8"
    );
    const coreBundle = readFileSync(
      resolve(process.cwd(), "docs/assets/a11y-repeatable-fieldset.js"),
      "utf8"
    );
    const addonBundle = readFileSync(
      resolve(process.cwd(), "docs/assets/form-memory-bridge.js"),
      "utf8"
    );

    expect("createFormMemoryBridge" in mainEntry).toBe(false);
    expect(mainSource).not.toContain("form-memory-bridge");
    expect(coreBundle).not.toContain("createFormMemoryBridge");
    expect(addonBundle).toContain("createFormMemoryBridge");
    expect(addonBundle).not.toContain("class A11yRepeatableFieldset");
    expect(addonBundle).not.toContain("activeInstances");
    expect(packageJson.dependencies).toEqual({});
    expect(packageJson.exports).toHaveProperty(
      "./addons/form-memory-bridge"
    );
    expect(buildConfig).toContain(
      '"addons/form-memory-bridge":'
    );
    expect(buildConfig).toContain(
      '"./src/addons/form-memory-bridge.ts"'
    );
  });
});
