import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

import * as mainEntry from "../src";
import {
  ACCESSIBLE_REORDER_ATTRIBUTES,
  createAccessibleReorder,
  type AccessibleReorderOptions
} from "../src/addons/accessible-reorder";
import { EVENTS, RepeatableFieldsetError, createRepeatableFieldset } from "../src";
import { SELECTORS } from "../src/constants";
import { createTestRepeatableFieldsetMarkup } from "./helpers/create-markup";

function appendTarget(item: HTMLFieldSetElement): HTMLElement {
  const target = item.ownerDocument.createElement("div");
  target.setAttribute(ACCESSIBLE_REORDER_ATTRIBUTES.controls, "");
  item.append(target);
  return target;
}

function prepareMarkup() {
  const markup = createTestRepeatableFieldsetMarkup(document);
  const target = appendTarget(markup.item);
  const templateTarget = appendTarget(markup.templateItem);
  return { markup, target, templateTarget };
}

function getMoveButtons(item: HTMLFieldSetElement): readonly HTMLButtonElement[] {
  return Array.from(
    item.querySelectorAll<HTMLButtonElement>(
      `[${ACCESSIBLE_REORDER_ATTRIBUTES.moveUp}], [${ACCESSIBLE_REORDER_ATTRIBUTES.moveDown}]`
    )
  );
}

describe("Accessible Reorder addon", () => {
  it("creates frozen native-button controls with explicit labels", () => {
    const addon = createAccessibleReorder({
      moveUpLabel: "Move earlier",
      moveDownLabel: "Move later"
    });
    const { markup } = prepareMarkup();
    createRepeatableFieldset(markup.root, { addons: [addon] });
    const buttons = getMoveButtons(markup.item);

    expect(addon.id).toBe("a11y-repeatable-fieldset.accessible-reorder");
    expect(Object.isFrozen(addon)).toBe(true);
    expect(Object.isFrozen(ACCESSIBLE_REORDER_ATTRIBUTES)).toBe(true);
    expect(buttons).toHaveLength(2);
    expect(buttons.map(({ type }) => type)).toEqual(["button", "button"]);
    expect(buttons.map(({ textContent }) => textContent)).toEqual([
      "Move earlier",
      "Move later"
    ]);
    expect(buttons.every((button) => button.getAttribute("tabindex") === null)).toBe(true);
    expect(buttons.every((button) => button.getAttribute("aria-disabled") === null)).toBe(true);
  });

  it("moves through core, preserves the active button, and reports boundaries", () => {
    const { markup } = prepareMarkup();
    const moved = vi.fn();
    markup.root.addEventListener(EVENTS.itemMoved, moved);
    const instance = createRepeatableFieldset(markup.root, {
      itemLabel: "Contact",
      addons: [createAccessibleReorder()]
    });
    const added = instance.add();

    if (!added.ok) {
      throw new Error("Expected a generated item.");
    }

    const moveDown = markup.item.querySelector<HTMLButtonElement>(
      `[${ACCESSIBLE_REORDER_ATTRIBUTES.moveDown}]`
    );
    moveDown!.focus();
    moveDown!.click();

    expect(instance.getItems().map(({ key }) => key)).toEqual([
      "item-1",
      "server-42"
    ]);
    expect(document.activeElement).toBe(moveDown);
    expect(moved).toHaveBeenCalledTimes(1);
    expect(
      markup.root.querySelector(SELECTORS.status)?.textContent
    ).toBe("Contact moved to position 2 of 2.");

    moveDown!.click();
    expect(instance.getItems().map(({ key }) => key)).toEqual([
      "item-1",
      "server-42"
    ]);
    expect(document.activeElement).toBe(moveDown);
    expect(moved).toHaveBeenCalledTimes(1);
    expect(
      markup.root.querySelector(SELECTORS.status)?.textContent
    ).toBe("Contact 2 is already last.");

    const moveUp = markup.item.querySelector<HTMLButtonElement>(
      `[${ACCESSIBLE_REORDER_ATTRIBUTES.moveUp}]`
    );
    moveUp!.focus();
    moveUp!.click();
    expect(instance.getItems().map(({ key }) => key)).toEqual([
      "server-42",
      "item-1"
    ]);
    expect(document.activeElement).toBe(moveUp);
  });

  it("sets up generated items and removes only addon-owned controls", () => {
    const { markup, target } = prepareMarkup();
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0,
      addons: [createAccessibleReorder()]
    });
    const added = instance.add();

    if (!added.ok) {
      throw new Error("Expected a generated item.");
    }

    const addedTarget = added.item.element.querySelector<HTMLElement>(
      `[${ACCESSIBLE_REORDER_ATTRIBUTES.controls}]`
    );
    expect(getMoveButtons(added.item.element)).toHaveLength(2);
    expect(instance.remove(added.item)).toMatchObject({ ok: true });
    expect(addedTarget?.isConnected).toBe(false);
    expect(addedTarget?.childElementCount).toBe(0);

    instance.destroy();
    expect(target.isConnected).toBe(true);
    expect(target.childElementCount).toBe(0);
  });

  it("fails initialization and Add transactionally for invalid targets", () => {
    const missing = createTestRepeatableFieldsetMarkup(document);
    const before = missing.root.cloneNode(true);

    expect(() =>
      createRepeatableFieldset(missing.root, {
        addons: [createAccessibleReorder()]
      })
    ).toThrowError(RepeatableFieldsetError);
    expect(missing.root.isEqualNode(before)).toBe(true);
    missing.root.remove();

    const { markup } = prepareMarkup();
    markup.templateItem
      .querySelector(`[${ACCESSIBLE_REORDER_ATTRIBUTES.controls}]`)
      ?.remove();
    const instance = createRepeatableFieldset(markup.root, {
      addons: [createAccessibleReorder()]
    });

    expect(instance.add()).toMatchObject({
      ok: false,
      reason: "addon-error"
    });
    expect(instance.getCount()).toBe(1);
    expect(getMoveButtons(markup.item)).toHaveLength(2);
  });

  it("rejects hidden, nonempty, legend, live-output, and duplicate targets", () => {
    const variants = ["hidden", "nonempty", "legend", "live", "duplicate"] as const;

    for (const variant of variants) {
      const markup = createTestRepeatableFieldsetMarkup(document);
      const target = appendTarget(markup.item);
      appendTarget(markup.templateItem);

      if (variant === "hidden") {
        target.hidden = true;
      } else if (variant === "nonempty") {
        target.textContent = "Author content";
      } else if (variant === "legend") {
        markup.item.querySelector("legend")?.append(target);
      } else if (variant === "live") {
        const live = document.createElement("div");
        live.setAttribute("role", "status");
        target.before(live);
        live.append(target);
      } else {
        appendTarget(markup.item);
      }

      expect(() =>
        createRepeatableFieldset(markup.root, {
          addons: [createAccessibleReorder()]
        })
      ).toThrowError(RepeatableFieldsetError);
      markup.root.remove();
    }
  });

  it("creates controls in the owning document realm", () => {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const frameDocument = frame.contentDocument;

    if (frameDocument === null) {
      throw new Error("Expected an iframe document for the realm test.");
    }

    const markup = createTestRepeatableFieldsetMarkup(frameDocument);
    appendTarget(markup.item);
    appendTarget(markup.templateItem);
    createRepeatableFieldset(markup.root, {
      addons: [createAccessibleReorder()]
    });

    const buttons = getMoveButtons(markup.item);
    expect(buttons).toHaveLength(2);
    expect(buttons[0]?.constructor).toBe(
      frameDocument.createElement("button").constructor
    );
    expect(buttons[0]?.ownerDocument).toBe(frameDocument);
    frame.remove();
  });

  it("validates and normalizes factory options", () => {
    expect(() =>
      createAccessibleReorder(null as unknown as AccessibleReorderOptions)
    ).toThrowError("Accessible Reorder: options must be an object.");
    expect(() =>
      createAccessibleReorder({ moveUpLabel: " " })
    ).toThrowError("Accessible Reorder: moveUpLabel must be a non-empty string.");
    expect(() =>
      createAccessibleReorder({ unexpected: true } as unknown as AccessibleReorderOptions)
    ).toThrowError('Accessible Reorder: unknown option "unexpected".');
  });

  it("keeps the concrete addon out of the main runtime entry", () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), "package.json"), "utf8")
    ) as { exports: Record<string, unknown>; dependencies: Record<string, unknown> };
    const mainSource = readFileSync(
      resolve(process.cwd(), "src/index.ts"),
      "utf8"
    );
    const coreBundle = readFileSync(
      resolve(process.cwd(), "docs/assets/a11y-repeatable-fieldset.js"),
      "utf8"
    );
    const addonBundle = readFileSync(
      resolve(process.cwd(), "docs/assets/accessible-reorder.js"),
      "utf8"
    );
    const styles = readFileSync(
      resolve(process.cwd(), "src/styles.css"),
      "utf8"
    );

    expect(mainEntry).not.toHaveProperty("createAccessibleReorder");
    expect(mainSource).not.toContain("addons/accessible-reorder");
    expect(coreBundle).not.toContain("createAccessibleReorder");
    expect(addonBundle).toContain("createAccessibleReorder");
    expect(styles).toContain(".a11y-repeatable-fieldset__move:focus-visible");
    expect(packageJson.exports).toHaveProperty("./addons/accessible-reorder");
    expect(packageJson.dependencies).toEqual({});
  });
});
