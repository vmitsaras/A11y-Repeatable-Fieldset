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

function getTemplateInput(
  markup: TestRepeatableFieldsetMarkup
): HTMLInputElement {
  const input = markup.templateItem.querySelector<HTMLInputElement>(
    "input:not([type])"
  );

  if (input === null) {
    throw new Error("The template text input is missing.");
  }

  return input;
}

function removeExplicitFocusMarker(
  markup: TestRepeatableFieldsetMarkup
): HTMLInputElement {
  const input = getTemplateInput(markup);
  input.removeAttribute(ATTRIBUTES.focus);
  return input;
}

interface InvalidFocusCase {
  readonly name: string;
  mutate(markup: TestRepeatableFieldsetMarkup): Element;
}

describe("Add focus", () => {
  it("prioritizes the explicit marker for a control-triggered Add", () => {
    const markup = createMarkup();
    const markedInput = getTemplateInput(markup);
    const earlierInput = document.createElement("input");
    earlierInput.name = "earlier[__A11Y_REPEATABLE_KEY__]";
    markedInput.before(earlierInput);
    createRepeatableFieldset(markup.root);

    markup.addButton.focus();
    markup.addButton.click();

    const addedItem = markup.items.lastElementChild;
    const addedMarkedInput = addedItem?.querySelector<HTMLInputElement>(
      `[${ATTRIBUTES.focus}]`
    );

    expect(addedItem).not.toBe(markup.item);
    expect(addedMarkedInput).toBeNull();
    expect(document.activeElement).toBe(
      addedItem?.querySelector<HTMLInputElement>(
        "#contact-item-1-name"
      )
    );
  });

  it("uses the first eligible labelable control in DOM order", () => {
    const markup = createMarkup();
    const originalInput = removeExplicitFocusMarker(markup);
    originalInput.disabled = true;

    const hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";

    const hiddenContainer = document.createElement("div");
    hiddenContainer.hidden = true;
    hiddenContainer.append(document.createElement("input"));

    const inertContainer = document.createElement("div");
    inertContainer.setAttribute("inert", "");
    inertContainer.append(document.createElement("textarea"));

    const eligibleSelect = document.createElement("select");
    eligibleSelect.name =
      "contacts[__A11Y_REPEATABLE_KEY__][preference]";

    originalInput.after(
      hiddenInput,
      hiddenContainer,
      inertContainer,
      eligibleSelect
    );
    createRepeatableFieldset(markup.root);

    markup.addButton.focus();
    markup.addButton.click();

    const addedSelect =
      markup.items.lastElementChild?.querySelector<HTMLSelectElement>(
        "select"
      );

    expect(addedSelect).not.toBeNull();
    expect(document.activeElement).toBe(addedSelect);
  });

  it("uses an intentionally focusable fieldset when no data control qualifies", () => {
    const markup = createMarkup();
    removeExplicitFocusMarker(markup).remove();
    markup.templateItem.querySelector("label")?.remove();
    markup.templateItem.setAttribute("tabindex", "-1");
    createRepeatableFieldset(markup.root);

    markup.addButton.focus();
    markup.addButton.click();

    const addedItem =
      markup.items.lastElementChild as HTMLFieldSetElement | null;

    expect(addedItem).not.toBe(markup.item);
    expect(addedItem?.getAttribute("tabindex")).toBe("-1");
    expect(document.activeElement).toBe(addedItem);
  });

  it("leaves focus on Add when no new-item target qualifies", () => {
    const markup = createMarkup();
    removeExplicitFocusMarker(markup).remove();
    markup.templateItem.querySelector("label")?.remove();
    createRepeatableFieldset(markup.root);

    markup.addButton.focus();
    markup.addButton.click();

    const addedItem =
      markup.items.lastElementChild as HTMLFieldSetElement | null;

    expect(addedItem).not.toBe(markup.item);
    expect(addedItem?.hasAttribute("tabindex")).toBe(false);
    expect(document.activeElement).toBe(markup.addButton);
  });

  it("does not move focus for an API Add by default", () => {
    const markup = createMarkup();
    const outside = document.createElement("button");
    outside.type = "button";
    outside.textContent = "Outside";
    document.body.prepend(outside);
    const instance = createRepeatableFieldset(markup.root);
    outside.focus();

    const result = instance.add();

    expect(result.ok).toBe(true);
    expect(document.activeElement).toBe(outside);
  });

  it("honors explicit API focus and removes the author marker from live DOM", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root);

    const result = instance.add({ focus: true });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Expected Add to succeed.");
    }

    const input =
      result.item.element.querySelector<HTMLInputElement>("input");

    expect(document.activeElement).toBe(input);
    expect(result.item.element.querySelector(SELECTORS.focus)).toBeNull();
  });

  it("honors a disabled control-focus option without adding tabindex", () => {
    const markup = createMarkup();
    createRepeatableFieldset(markup.root, {
      focusOnAdd: false
    });
    markup.addButton.focus();

    markup.addButton.click();

    const addedItem =
      markup.items.lastElementChild as HTMLFieldSetElement | null;

    expect(document.activeElement).toBe(markup.addButton);
    expect(addedItem?.hasAttribute("tabindex")).toBe(false);
  });

  it.each<InvalidFocusCase>([
    {
      name: "disabled",
      mutate(markup: TestRepeatableFieldsetMarkup): Element {
        const input = getTemplateInput(markup);
        input.disabled = true;
        return input;
      }
    },
    {
      name: "hidden",
      mutate(markup: TestRepeatableFieldsetMarkup): Element {
        const input = getTemplateInput(markup);
        input.hidden = true;
        return input;
      }
    },
    {
      name: "inert",
      mutate(markup: TestRepeatableFieldsetMarkup): Element {
        const input = getTemplateInput(markup);
        const wrapper = document.createElement("div");
        wrapper.setAttribute("inert", "");
        input.replaceWith(wrapper);
        wrapper.append(input);
        return input;
      }
    }
  ])("rejects a $name explicit marker", ({ mutate }) => {
    const markup = createMarkup();
    const invalidTarget = mutate(markup);
    let thrown: unknown;

    try {
      createRepeatableFieldset(markup.root);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(RepeatableFieldsetError);
    expect(thrown).toMatchObject({
      code: "invalid-focus-target",
      element: invalidTarget
    });
  });

  it("rejects a stale invalid marker without inserting an item or moving focus", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root);
    const templateInput = getTemplateInput(markup);
    const outside = document.createElement("button");
    outside.type = "button";
    outside.textContent = "Outside";
    document.body.prepend(outside);
    templateInput.disabled = true;
    outside.focus();

    const result = instance.add({ focus: true });

    expect(result).toMatchObject({
      ok: false,
      reason: "invalid-template"
    });
    expect(markup.items.children).toHaveLength(1);
    expect(document.activeElement).toBe(outside);
  });
});
