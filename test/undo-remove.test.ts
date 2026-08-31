import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

import * as mainEntry from "../src";
import {
  EVENTS,
  RepeatableFieldsetError,
  createRepeatableFieldset
} from "../src";
import { createRemoveGuard } from "../src/addons/remove-guard";
import {
  UNDO_REMOVE_ATTRIBUTES,
  createUndoRemove,
  type UndoRemoveOptions
} from "../src/addons/undo-remove";
import { createTestRepeatableFieldsetMarkup } from "./helpers/create-markup";

function prepareMarkup() {
  const markup = createTestRepeatableFieldsetMarkup(document);
  const target = document.createElement("div");
  target.setAttribute(UNDO_REMOVE_ATTRIBUTES.controls, "");
  markup.template.before(target);
  markup.input.setAttribute(UNDO_REMOVE_ATTRIBUTES.state, "name");
  markup.templateItem
    .querySelector<HTMLInputElement>("input")!
    .setAttribute(UNDO_REMOVE_ATTRIBUTES.state, "name");

  return { markup, target };
}

function getUndoButton(root: HTMLElement): HTMLButtonElement {
  const button = root.querySelector<HTMLButtonElement>(
    `[${UNDO_REMOVE_ATTRIBUTES.button}]`
  );

  if (button === null) {
    throw new Error("Expected an Undo button.");
  }

  return button;
}

describe("Undo Remove addon", () => {
  it("restores structure from the template with the reserved key and marked state", () => {
    const { markup } = prepareMarkup();
    markup.input.value = "Ada";
    markup.input.defaultValue = "Server default";
    markup.input.setAttribute("aria-invalid", "true");
    markup.input.setCustomValidity("Server validation");

    const sourceFile = document.createElement("input");
    sourceFile.type = "file";
    Object.defineProperty(sourceFile, "value", {
      configurable: true,
      get() {
        throw new Error("file value was read");
      }
    });
    markup.item.append(sourceFile);
    const templateFile = document.createElement("input");
    templateFile.type = "file";
    markup.templateItem.append(templateFile);

    const restored = vi.fn();
    markup.root.addEventListener(EVENTS.itemRestored, restored);
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0,
      addons: [createUndoRemove()]
    });
    const original = markup.item;

    expect(instance.remove(original)).toMatchObject({ ok: true });
    const button = getUndoButton(markup.root);
    expect(button.hidden).toBe(false);
    expect(button.type).toBe("button");
    expect(button.hasAttribute("aria-disabled")).toBe(false);

    button.click();

    expect(instance.getCount()).toBe(1);
    const item = instance.getItems()[0]!;
    const input = item.element.querySelector<HTMLInputElement>(
      `[${UNDO_REMOVE_ATTRIBUTES.state}="name"]`
    )!;
    expect(item.key).toBe("server-42");
    expect(item.element).not.toBe(original);
    expect(input.value).toBe("Ada");
    expect(input.defaultValue).toBe("");
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    expect(input.validationMessage).toBe("");
    expect(
      item.element.querySelector<HTMLInputElement>('input[type="file"]')?.value
    ).toBe("");
    expect(document.activeElement).toBe(input);
    expect(button.hidden).toBe(true);
    expect(restored).toHaveBeenCalledTimes(1);
    expect(restored.mock.calls[0]?.[0].detail).toMatchObject({
      key: "server-42",
      previousIndex: 0,
      previousPosition: 1,
      index: 0,
      position: 1,
      count: 1,
      focusTarget: input
    });
    expect(
      markup.root.querySelector<HTMLElement>(
        "[data-a11y-repeatable-fieldset-status]"
      )?.textContent
    ).toBe("Item restored at position 1. 1 item total.");
  });

  it("expires in memory and pauses expiry while its button has focus", () => {
    vi.useFakeTimers();
    const { markup } = prepareMarkup();
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0,
      addons: [createUndoRemove({ expiryMs: 1_000 })]
    });
    const button = getUndoButton(markup.root);

    instance.remove(markup.item);
    button.focus();
    vi.advanceTimersByTime(2_000);
    expect(button.hidden).toBe(false);

    button.blur();
    vi.advanceTimersByTime(999);
    expect(button.hidden).toBe(false);
    vi.advanceTimersByTime(1);
    expect(button.hidden).toBe(true);
    vi.useRealTimers();
  });

  it("replaces the prior snapshot when another removal commits", () => {
    const { markup } = prepareMarkup();
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0,
      addons: [createUndoRemove()]
    });
    const added = instance.add();

    if (!added.ok) {
      throw new Error("Expected Add to succeed.");
    }

    markup.input.value = "First";
    const addedInput = added.item.element.querySelector<HTMLInputElement>(
      `[${UNDO_REMOVE_ATTRIBUTES.state}]`
    )!;
    addedInput.value = "Second";
    instance.remove(markup.item);
    instance.remove(added.item);
    getUndoButton(markup.root).click();

    expect(instance.getCount()).toBe(1);
    expect(instance.getItems()[0]?.key).toBe(added.item.key);
    expect(
      instance.getItems()[0]?.element.querySelector<HTMLInputElement>(
        `[${UNDO_REMOVE_ATTRIBUTES.state}]`
      )?.value
    ).toBe("Second");
  });

  it("rolls back a stale or malformed restore without replacing author DOM", () => {
    const { markup } = prepareMarkup();
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0,
      addons: [createUndoRemove()]
    });

    instance.remove(markup.item);
    markup.templateItem
      .querySelector(`[${UNDO_REMOVE_ATTRIBUTES.state}]`)
      ?.remove();
    const removed = vi.fn();
    markup.root.addEventListener(EVENTS.itemRestored, removed);
    const button = getUndoButton(markup.root);
    button.click();

    expect(instance.getCount()).toBe(0);
    expect(markup.items.childElementCount).toBe(0);
    expect(button.hidden).toBe(true);
    expect(removed).not.toHaveBeenCalled();
  });

  it("composes with control-request ownership from Remove Guard", () => {
    const { markup } = prepareMarkup();
    const confirm = vi.fn(() => true);
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0,
      addons: [
        createRemoveGuard({
          shouldConfirm: () => true,
          confirm
        }),
        createUndoRemove()
      ]
    });

    markup.removeButton.click();
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(instance.getCount()).toBe(0);
    expect(getUndoButton(markup.root).hidden).toBe(false);
  });

  it("keeps the restoration command unavailable until preparation commit returns", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const observed = vi.fn();
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0,
      addons: [
        {
          id: "test.restoration-readiness",
          setup(context) {
            context.onRemovePreparation(({ restoration }) => ({
              commit() {
                observed(restoration.restore());
              },
              rollback() {}
            }));
          }
        }
      ]
    });

    expect(instance.remove(markup.item)).toMatchObject({ ok: true });
    expect(observed).toHaveBeenCalledWith({
      ok: false,
      reason: "not-ready"
    });
  });

  it("rejects unsafe opt-in state and malformed options transactionally", () => {
    const variants = ["file", "password", "hidden", "payment"] as const;

    for (const variant of variants) {
      const { markup } = prepareMarkup();
      const control = document.createElement("input");
      control.type =
        variant === "payment" ? "text" : variant;
      control.setAttribute(UNDO_REMOVE_ATTRIBUTES.state, "unsafe");

      if (variant === "payment") {
        control.autocomplete = "cc-number";
      }

      markup.item.append(control);

      expect(() =>
        createRepeatableFieldset(markup.root, {
          minimum: 0,
          addons: [createUndoRemove()]
        })
      ).toThrowError(RepeatableFieldsetError);
      markup.root.remove();
    }

    expect(() =>
      createUndoRemove(null as unknown as UndoRemoveOptions)
    ).toThrowError("Undo Remove: options must be an object.");
    expect(() =>
      createUndoRemove({ expiryMs: 999 })
    ).toThrowError(/expiryMs/);
    expect(() =>
      createUndoRemove({ buttonLabel: " " })
    ).toThrowError(/buttonLabel/);
  });

  it("removes generated UI and retained state on destroy", () => {
    const { markup, target } = prepareMarkup();
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0,
      addons: [createUndoRemove()]
    });

    instance.remove(markup.item);
    expect(target.childElementCount).toBe(1);
    instance.destroy();
    expect(target.childElementCount).toBe(0);
  });

  it("creates its native control in the owning document realm", () => {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const frameDocument = frame.contentDocument;

    if (frameDocument === null) {
      throw new Error("Expected an iframe document.");
    }

    const markup = createTestRepeatableFieldsetMarkup(frameDocument);
    const target = frameDocument.createElement("div");
    target.setAttribute(UNDO_REMOVE_ATTRIBUTES.controls, "");
    markup.template.before(target);
    createRepeatableFieldset(markup.root, {
      minimum: 0,
      addons: [createUndoRemove()]
    });
    const button = getUndoButton(markup.root);

    expect(button.ownerDocument).toBe(frameDocument);
    expect(button.constructor).toBe(
      frameDocument.createElement("button").constructor
    );
    expect(button.hasAttribute("tabindex")).toBe(false);
    frame.remove();
  });

  it("ships only through its explicit dependency-free addon subpath", () => {
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
      resolve(
        process.cwd(),
        "docs/assets/a11y-repeatable-fieldset.js"
      ),
      "utf8"
    );
    const addonBundle = readFileSync(
      resolve(process.cwd(), "docs/assets/undo-remove.js"),
      "utf8"
    );

    expect(mainEntry).not.toHaveProperty("createUndoRemove");
    expect(mainSource).not.toContain("addons/undo-remove");
    expect(coreBundle).not.toContain("createUndoRemove");
    expect(addonBundle).toContain("createUndoRemove");
    expect(packageJson.exports).toHaveProperty("./addons/undo-remove");
    expect(packageJson.dependencies).toEqual({});
  });
});
