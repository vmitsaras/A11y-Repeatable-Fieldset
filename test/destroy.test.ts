import { describe, expect, it, vi } from "vitest";

import { ATTRIBUTES, SELECTORS } from "../src/constants";
import { createRepeatableFieldset } from "../src/index";
import {
  createTestRepeatableFieldsetMarkup,
  type TestRepeatableFieldsetMarkup
} from "./helpers/create-markup";

function createMarkup(): TestRepeatableFieldsetMarkup {
  return createTestRepeatableFieldsetMarkup(document);
}

function getItems(
  markup: TestRepeatableFieldsetMarkup
): readonly HTMLFieldSetElement[] {
  return Array.from(
    markup.items.children,
    (element) => element as HTMLFieldSetElement
  );
}

function getRemoveButtons(
  markup: TestRepeatableFieldsetMarkup
): readonly HTMLButtonElement[] {
  return Array.from(
    markup.items.querySelectorAll<HTMLButtonElement>(SELECTORS.remove)
  );
}

describe("safe core destroy", () => {
  it("preserves every current fieldset, identity, position, and user value", () => {
    const markup = createMarkup();
    markup.input.value = "Edited server value";
    const hiddenId = document.createElement("input");
    hiddenId.type = "hidden";
    hiddenId.name = "contacts[server-42][id]";
    hiddenId.value = "984";
    markup.item.insertBefore(hiddenId, markup.removeButton);

    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0
    });
    const added = instance.add();

    expect(added.ok).toBe(true);

    if (!added.ok) {
      throw new Error("Expected Add to succeed.");
    }

    const addedInput =
      added.item.element.querySelector<HTMLInputElement>("input");
    const checkbox = document.createElement("input");
    const textarea = document.createElement("textarea");

    if (addedInput === null) {
      throw new Error("Expected the added text input.");
    }

    addedInput.value = "New user value";
    checkbox.type = "checkbox";
    checkbox.name = "contacts[item-1][primary]";
    checkbox.checked = true;
    textarea.name = "contacts[item-1][notes]";
    textarea.value = "Unsaved notes";
    added.item.element.insertBefore(
      checkbox,
      added.item.element.lastElementChild
    );
    added.item.element.insertBefore(
      textarea,
      added.item.element.lastElementChild
    );

    const itemsBefore = getItems(markup);
    const identityBefore = itemsBefore.map((item) => ({
      item,
      key: item.getAttribute(ATTRIBUTES.key),
      position:
        item.querySelector(SELECTORS.position)?.textContent ?? null,
      names: Array.from(
        item.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
          "input[name], textarea[name]"
        ),
        ({ name }) => name
      ),
      ids: Array.from(
        item.querySelectorAll<HTMLElement>("[id]"),
        ({ id }) => id
      )
    }));

    instance.destroy();

    expect(getItems(markup)).toEqual(itemsBefore);
    expect(
      getItems(markup).map((item) => ({
        item,
        key: item.getAttribute(ATTRIBUTES.key),
        position:
          item.querySelector(SELECTORS.position)?.textContent ?? null,
        names: Array.from(
          item.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
            "input[name], textarea[name]"
          ),
          ({ name }) => name
        ),
        ids: Array.from(
          item.querySelectorAll<HTMLElement>("[id]"),
          ({ id }) => id
        )
      }))
    ).toEqual(identityBefore);
    expect(markup.input.value).toBe("Edited server value");
    expect(hiddenId.value).toBe("984");
    expect(addedInput.value).toBe("New user value");
    expect(checkbox.checked).toBe(true);
    expect(textarea.value).toBe("Unsaved notes");
  });

  it("preserves the current structure without restoring removed items", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0
    });
    const firstAdded = instance.add();
    const secondAdded = instance.add();

    expect(firstAdded.ok).toBe(true);
    expect(secondAdded.ok).toBe(true);

    if (!firstAdded.ok || !secondAdded.ok) {
      throw new Error("Expected both additions to succeed.");
    }

    expect(instance.remove(firstAdded.item).ok).toBe(true);
    const currentBefore = getItems(markup);

    instance.destroy();

    expect(firstAdded.item.element.parentNode).toBeNull();
    expect(getItems(markup)).toEqual(currentBefore);
    expect(getItems(markup)).toEqual([
      markup.item,
      secondAdded.item.element
    ]);
    expect(
      getItems(markup).map((item) =>
        item.getAttribute(ATTRIBUTES.key)
      )
    ).toEqual(["server-42", "item-2"]);
  });

  it("restores all current enhancement controls to non-working author states", () => {
    const markup = createMarkup();
    markup.addButton.disabled = true;
    markup.removeButton.disabled = true;
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0
    });
    const added = instance.add();

    expect(added.ok).toBe(true);
    expect(markup.addButton.hidden).toBe(false);
    expect(
      getRemoveButtons(markup).every((button) => !button.hidden)
    ).toBe(true);

    instance.destroy();

    expect(markup.addButton.hidden).toBe(true);
    expect(markup.addButton.disabled).toBe(true);
    expect(markup.removeButton.hidden).toBe(true);
    expect(markup.removeButton.disabled).toBe(true);

    const addedRemove = getRemoveButtons(markup)[1];

    expect(addedRemove?.hidden).toBe(true);
    expect(addedRemove?.disabled).toBe(false);
  });

  it("preserves author classes and an author-owned status region", () => {
    const markup = createMarkup();
    markup.root.className = "author-layout is-server-rendered";
    const status = document.createElement("div");
    status.setAttribute(ATTRIBUTES.status, "");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.setAttribute("aria-atomic", "true");
    markup.root.append(status);
    const before = status.cloneNode(true);
    const instance = createRepeatableFieldset(markup.root);

    instance.destroy();

    expect(markup.root.className).toBe(
      "author-layout is-server-rendered"
    );
    expect(status.parentElement).toBe(markup.root);
    expect(status.isEqualNode(before)).toBe(true);
    expect(
      markup.root.querySelectorAll(SELECTORS.status)
    ).toHaveLength(1);
  });

  it("removes its listener exactly once and makes repeated destroy silent", () => {
    const markup = createMarkup();
    const removeEventListener = vi.spyOn(
      markup.root,
      "removeEventListener"
    );
    const instance = createRepeatableFieldset(markup.root);

    instance.destroy();
    instance.destroy();
    instance.destroy();

    expect(removeEventListener).toHaveBeenCalledTimes(1);
    expect(removeEventListener).toHaveBeenCalledWith(
      "click",
      expect.any(Function)
    );

    markup.addButton.click();
    markup.removeButton.click();
    expect(getItems(markup)).toEqual([markup.item]);
  });

  it("finishes teardown if host listener removal throws after cleanup", () => {
    const markup = createMarkup();
    const nativeRemoveEventListener =
      markup.root.removeEventListener.bind(markup.root);
    vi.spyOn(
      markup.root,
      "removeEventListener"
    ).mockImplementation((type, callback, options) => {
      nativeRemoveEventListener(type, callback, options);
      throw new Error("host cleanup failed");
    });
    const instance = createRepeatableFieldset(markup.root);

    expect(() => instance.destroy()).not.toThrow();
    expect(instance.getCount()).toBe(0);
    expect(instance.canAdd()).toBe(false);
    expect(instance.canRemove()).toBe(false);
    expect(markup.addButton.hidden).toBe(true);
    expect(markup.removeButton.hidden).toBe(true);

    const replacement = createRepeatableFieldset(markup.root);

    expect(replacement).not.toBe(instance);
    expect(replacement.getCount()).toBe(1);
  });

  it("supports teardown after the author detaches the root", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root);

    markup.root.remove();

    expect(() => instance.destroy()).not.toThrow();
    expect(markup.root.isConnected).toBe(false);
    expect(markup.item.parentElement).toBe(markup.items);
    expect(markup.addButton.hidden).toBe(true);
    expect(markup.removeButton.hidden).toBe(true);
  });

  it("allows clean reinitialization while the old instance stays inert", () => {
    const markup = createMarkup();
    const first = createRepeatableFieldset(markup.root);
    const added = first.add();

    expect(added.ok).toBe(true);

    if (!added.ok) {
      throw new Error("Expected Add to succeed.");
    }

    first.destroy();
    const replacement = createRepeatableFieldset(markup.root);

    expect(replacement).not.toBe(first);
    expect(replacement.getCount()).toBe(2);
    expect(first.add()).toMatchObject({
      ok: false,
      reason: "inactive"
    });
    expect(first.remove(added.item)).toMatchObject({
      ok: false,
      reason: "inactive"
    });

    first.destroy();
    markup.addButton.click();

    expect(replacement.getCount()).toBe(3);
  });
});
