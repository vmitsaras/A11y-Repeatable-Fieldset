import { describe, expect, it } from "vitest";

import { SELECTORS } from "../src/constants";
import {
  createRepeatableFieldset,
  type RepeatableFieldsetInstance,
  type RepeatableFieldsetItem
} from "../src/index";
import {
  createTestRepeatableFieldsetMarkup,
  type TestRepeatableFieldsetMarkup
} from "./helpers/create-markup";

function createMarkup(): TestRepeatableFieldsetMarkup {
  return createTestRepeatableFieldsetMarkup(document);
}

function addItem(
  instance: RepeatableFieldsetInstance
): Readonly<RepeatableFieldsetItem> {
  const result = instance.add();

  if (!result.ok) {
    throw new Error("Expected Add to succeed.");
  }

  return result.item;
}

function getRemoveButton(
  item: HTMLFieldSetElement
): HTMLButtonElement {
  const button = item.querySelector<HTMLButtonElement>(
    SELECTORS.remove
  );

  if (button === null) {
    throw new Error("The item Remove button is missing.");
  }

  return button;
}

describe("Remove focus", () => {
  it("moves from a removed control to the equivalent next Remove button", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root);
    const target = addItem(instance);
    const next = addItem(instance);
    const targetRemove = getRemoveButton(target.element);
    const nextRemove = getRemoveButton(next.element);
    targetRemove.focus();

    targetRemove.click();

    expect(target.element.isConnected).toBe(false);
    expect(nextRemove.disabled).toBe(false);
    expect(document.activeElement).toBe(nextRemove);
  });

  it("exposes finalized collection state to focus observers", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root);
    const target = addItem(instance);
    const next = addItem(instance);
    const targetRemove = getRemoveButton(target.element);
    const nextRemove = getRemoveButton(next.element);
    let observedItems: readonly Readonly<RepeatableFieldsetItem>[] = [];

    nextRemove.addEventListener("focus", () => {
      observedItems = instance.getItems();
    });
    targetRemove.focus();

    targetRemove.click();

    expect(observedItems).toHaveLength(2);
    expect(
      observedItems.some((item) => item.element === target.element)
    ).toBe(false);
    expect(observedItems[1]).toMatchObject({
      element: next.element,
      index: 1,
      position: 2
    });
  });

  it("uses the equivalent previous Remove button when no next item remains", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root);
    const previous = addItem(instance);
    const target = addItem(instance);
    const previousRemove = getRemoveButton(previous.element);
    const targetRemove = getRemoveButton(target.element);
    targetRemove.focus();

    targetRemove.click();

    expect(target.element.isConnected).toBe(false);
    expect(document.activeElement).toBe(previousRemove);
  });

  it("skips Remove buttons that become disabled at the minimum", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root);
    const target = addItem(instance);
    const targetRemove = getRemoveButton(target.element);
    targetRemove.focus();

    targetRemove.click();

    expect(target.element.isConnected).toBe(false);
    expect(markup.removeButton.disabled).toBe(true);
    expect(document.activeElement).toBe(markup.addButton);
  });

  it("falls back to an intentionally focusable root when Add is unavailable", () => {
    const markup = createMarkup();
    markup.root.setAttribute("tabindex", "-1");
    const instance = createRepeatableFieldset(markup.root);
    const target = addItem(instance);
    const targetRemove = getRemoveButton(target.element);
    markup.addButton.setAttribute("inert", "");
    targetRemove.focus();

    targetRemove.click();

    expect(target.element.isConnected).toBe(false);
    expect(markup.root.getAttribute("tabindex")).toBe("-1");
    expect(document.activeElement).toBe(markup.root);
  });

  it("keeps unrelated focus for a default API removal", () => {
    const markup = createMarkup();
    const outside = document.createElement("button");
    outside.type = "button";
    outside.textContent = "Outside";
    document.body.prepend(outside);
    const instance = createRepeatableFieldset(markup.root);
    const target = addItem(instance);
    outside.focus();

    const result = instance.remove(target);

    expect(result.ok).toBe(true);
    expect(document.activeElement).toBe(outside);
  });

  it("honors forced API handling when focus is outside the target", () => {
    const markup = createMarkup();
    const outside = document.createElement("button");
    outside.type = "button";
    outside.textContent = "Outside";
    document.body.prepend(outside);
    const instance = createRepeatableFieldset(markup.root);
    const target = addItem(instance);
    const next = addItem(instance);
    const nextRemove = getRemoveButton(next.element);
    outside.focus();

    const result = instance.remove(target, { focus: true });

    expect(result.ok).toBe(true);
    expect(document.activeElement).toBe(nextRemove);
  });

  it("recovers focus inside the target even when API focus is false", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root);
    const target = addItem(instance);
    const targetInput =
      target.element.querySelector<HTMLInputElement>("input");

    if (targetInput === null) {
      throw new Error("The target input is missing.");
    }

    targetInput.focus();
    const result = instance.remove(target, { focus: false });

    expect(result.ok).toBe(true);
    expect(document.activeElement).toBe(markup.addButton);
  });

  it("falls through an ineligible next candidate to the previous Remove button", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root);
    const previous = addItem(instance);
    const target = addItem(instance);
    const next = addItem(instance);
    const previousRemove = getRemoveButton(previous.element);
    const nextRemove = getRemoveButton(next.element);
    const targetInput =
      target.element.querySelector<HTMLInputElement>("input");

    if (targetInput === null) {
      throw new Error("The target input is missing.");
    }

    nextRemove.setAttribute("inert", "");
    targetInput.focus();

    const result = instance.remove(target);

    expect(result.ok).toBe(true);
    expect(document.activeElement).toBe(previousRemove);
  });

  it("never leaves active focus inside a detached item when no fallback qualifies", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root);
    const target = addItem(instance);
    const targetInput =
      target.element.querySelector<HTMLInputElement>("input");

    if (targetInput === null) {
      throw new Error("The target input is missing.");
    }

    markup.addButton.setAttribute("inert", "");
    targetInput.focus();

    const result = instance.remove(target);

    expect(result.ok).toBe(true);
    expect(target.element.isConnected).toBe(false);
    expect(
      document.activeElement === target.element ||
      (
        document.activeElement !== null &&
        target.element.contains(document.activeElement)
      )
    ).toBe(false);
    expect(markup.root.hasAttribute("tabindex")).toBe(false);
  });

  it("restores pre-command focus when a failed removal restores the item", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root);
    const target = addItem(instance);
    const targetInput =
      target.element.querySelector<HTMLInputElement>("input");
    const existingMarker = markup.item.querySelector(SELECTORS.position);

    if (targetInput === null || existingMarker === null) {
      throw new Error("The focus target or position marker is missing.");
    }

    Object.defineProperty(existingMarker, "textContent", {
      configurable: true,
      set(): never {
        throw new Error("position write failed");
      }
    });
    targetInput.focus();

    const result = instance.remove(target);

    expect(result).toMatchObject({
      ok: false,
      reason: "addon-error"
    });
    expect(target.element.parentElement).toBe(markup.items);
    expect(document.activeElement).toBe(targetInput);
    Reflect.deleteProperty(existingMarker, "textContent");
  });
});
