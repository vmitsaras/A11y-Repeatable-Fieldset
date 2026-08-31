import { describe, expect, it } from "vitest";

import { ATTRIBUTES, SELECTORS } from "../src/constants";
import {
  createRepeatableFieldset,
  RepeatableFieldsetError
} from "../src/index";
import {
  createTestRepeatableFieldsetMarkup,
  type TestRepeatableFieldsetMarkup
} from "./helpers/create-markup";

function createMarkup(): TestRepeatableFieldsetMarkup {
  return createTestRepeatableFieldsetMarkup(document);
}

function getRemoveButtons(
  markup: TestRepeatableFieldsetMarkup
): readonly HTMLButtonElement[] {
  return Array.from(
    markup.items.querySelectorAll<HTMLButtonElement>(SELECTORS.remove)
  );
}

describe("minimum and maximum constraints", () => {
  it("reveals controls and uses native disabled state at the defaults", () => {
    const markup = createMarkup();

    createRepeatableFieldset(markup.root);

    expect(markup.addButton.hidden).toBe(false);
    expect(markup.addButton.disabled).toBe(false);
    expect(markup.removeButton.hidden).toBe(false);
    expect(markup.removeButton.disabled).toBe(true);
    expect(markup.addButton.hasAttribute("aria-disabled")).toBe(false);
    expect(markup.removeButton.hasAttribute("aria-disabled")).toBe(false);
  });

  it("enables removal at minimum zero with an unbounded maximum", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0,
      maximum: null
    });

    expect(markup.addButton.disabled).toBe(false);
    expect(markup.removeButton.disabled).toBe(false);
    expect(instance.remove(markup.item).ok).toBe(true);
    expect(markup.addButton.disabled).toBe(false);
  });

  it("disables both boundaries when minimum and maximum equal count", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 1,
      maximum: 1
    });

    expect(markup.addButton.disabled).toBe(true);
    expect(markup.removeButton.disabled).toBe(true);
    expect(markup.addButton.hasAttribute("aria-disabled")).toBe(false);
    expect(markup.removeButton.hasAttribute("aria-disabled")).toBe(false);
    expect(instance.add()).toMatchObject({
      ok: false,
      reason: "maximum"
    });
    expect(instance.remove(markup.item)).toMatchObject({
      ok: false,
      reason: "minimum"
    });
    expect(markup.items.children).toHaveLength(1);
  });

  it("synchronizes every control across finite boundary transitions", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 1,
      maximum: 2
    });

    expect(markup.addButton.disabled).toBe(false);
    expect(markup.removeButton.disabled).toBe(true);

    const added = instance.add();

    expect(added.ok).toBe(true);

    if (!added.ok) {
      throw new Error("Expected Add to succeed.");
    }

    expect(markup.addButton.disabled).toBe(true);
    expect(getRemoveButtons(markup)).toHaveLength(2);
    expect(
      getRemoveButtons(markup).every((button) => !button.disabled)
    ).toBe(true);
    expect(instance.add()).toMatchObject({
      ok: false,
      reason: "maximum"
    });

    expect(instance.remove(added.item).ok).toBe(true);
    expect(markup.addButton.disabled).toBe(false);
    expect(markup.removeButton.disabled).toBe(true);
    expect(instance.remove(markup.item)).toMatchObject({
      ok: false,
      reason: "minimum"
    });
  });

  it("keeps Add enabled across an unbounded series of additions", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root, {
      maximum: null
    });

    expect(instance.add().ok).toBe(true);
    expect(instance.add().ok).toBe(true);
    expect(instance.add().ok).toBe(true);
    expect(markup.addButton.disabled).toBe(false);
    expect(
      getRemoveButtons(markup).every((button) => !button.disabled)
    ).toBe(true);
  });

  it("supports a zero maximum and removal down to an empty collection", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0,
      maximum: 0
    });

    expect(markup.addButton.disabled).toBe(true);
    expect(markup.removeButton.disabled).toBe(false);
    expect(instance.add()).toMatchObject({
      ok: false,
      reason: "maximum"
    });
    expect(instance.remove(markup.item).ok).toBe(true);
    expect(markup.items.children).toHaveLength(0);
    expect(markup.addButton.disabled).toBe(true);
  });

  it("rolls back initialization control writes transactionally", () => {
    const markup = createMarkup();
    markup.addButton.disabled = true;

    Object.defineProperty(markup.addButton, "hidden", {
      configurable: true,
      get(): boolean {
        return true;
      },
      set(): never {
        throw new Error("reveal failed");
      }
    });

    expect(() =>
      createRepeatableFieldset(markup.root)
    ).toThrowError(RepeatableFieldsetError);
    expect(markup.addButton.disabled).toBe(true);
    expect(markup.addButton.hasAttribute("hidden")).toBe(true);
    expect(markup.removeButton.hasAttribute("hidden")).toBe(true);

    Reflect.deleteProperty(markup.addButton, "hidden");

    expect(() =>
      createRepeatableFieldset(markup.root)
    ).not.toThrow();
  });

  it("rolls back an Add when maximum-state synchronization fails", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root, {
      maximum: 2
    });
    let disabled = false;

    Object.defineProperty(markup.addButton, "disabled", {
      configurable: true,
      get(): boolean {
        return disabled;
      },
      set(value: boolean): void {
        if (value) {
          throw new Error("maximum write failed");
        }

        disabled = value;
      }
    });

    const failed = instance.add();

    expect(failed).toMatchObject({
      ok: false,
      reason: "invalid-template"
    });
    expect(markup.items.children).toHaveLength(1);
    expect(markup.addButton.disabled).toBe(false);
    expect(markup.removeButton.disabled).toBe(true);

    Reflect.deleteProperty(markup.addButton, "disabled");

    expect(instance.add()).toMatchObject({
      ok: true,
      item: {
        key: "item-2"
      }
    });
  });

  it("rolls back a Remove when minimum-state synchronization fails", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root, {
      maximum: 2
    });
    const added = instance.add();

    expect(added.ok).toBe(true);

    if (!added.ok) {
      throw new Error("Expected Add to succeed.");
    }

    let disabled = false;

    Object.defineProperty(markup.removeButton, "disabled", {
      configurable: true,
      get(): boolean {
        return disabled;
      },
      set(value: boolean): void {
        if (value) {
          throw new Error("minimum write failed");
        }

        disabled = value;
      }
    });

    const failed = instance.remove(added.item);

    expect(failed).toMatchObject({
      ok: false,
      reason: "addon-error"
    });
    expect(markup.items.children).toHaveLength(2);
    expect(markup.addButton.disabled).toBe(true);
    expect(
      getRemoveButtons(markup).every((button) => !button.disabled)
    ).toBe(true);

    Reflect.deleteProperty(markup.removeButton, "disabled");

    expect(instance.remove(added.item).ok).toBe(true);
  });

  it("restores author and template control states during destroy", () => {
    const markup = createMarkup();
    markup.addButton.disabled = true;
    markup.removeButton.disabled = true;
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0
    });
    const added = instance.add();

    expect(added.ok).toBe(true);

    if (!added.ok) {
      throw new Error("Expected Add to succeed.");
    }

    const addedRemove =
      added.item.element.querySelector<HTMLButtonElement>(
        SELECTORS.remove
      );

    expect(markup.addButton.hidden).toBe(false);
    expect(markup.addButton.disabled).toBe(false);
    expect(markup.removeButton.hidden).toBe(false);
    expect(markup.removeButton.disabled).toBe(false);
    expect(addedRemove?.hidden).toBe(false);

    instance.destroy();

    expect(markup.addButton.hidden).toBe(true);
    expect(markup.addButton.disabled).toBe(true);
    expect(markup.removeButton.hidden).toBe(true);
    expect(markup.removeButton.disabled).toBe(true);
    expect(addedRemove?.hidden).toBe(true);
    expect(addedRemove?.disabled).toBe(false);
    expect(
      added.item.element.getAttribute(ATTRIBUTES.key)
    ).toBe("item-1");
    expect(added.item.element.parentElement).toBe(markup.items);
  });
});
