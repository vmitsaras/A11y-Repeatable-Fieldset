import { describe, expect, it, vi } from "vitest";

import { ATTRIBUTES, EVENTS } from "../src/constants";
import { discoverRepeatableFieldsetMarkup } from "../src/discovery";
import {
  createRepeatableFieldset,
  RepeatableFieldsetError
} from "../src/index";
import { registerExistingRepeatableFieldsetItems } from "../src/items";
import {
  createTestRepeatableFieldsetMarkup,
  type TestRepeatableFieldsetMarkup
} from "./helpers/create-markup";

function createMarkup(): TestRepeatableFieldsetMarkup {
  return createTestRepeatableFieldsetMarkup(document);
}

function appendItem(
  markup: TestRepeatableFieldsetMarkup,
  suffix: string,
  key: string | null
): HTMLFieldSetElement {
  const item = markup.item.cloneNode(true) as HTMLFieldSetElement;
  const input = item.querySelector<HTMLInputElement>("input:not([type])");
  const label = item.querySelector<HTMLLabelElement>("label");

  if (input === null || label === null) {
    throw new Error("The test item fixture is incomplete.");
  }

  input.id = `contact-${suffix}-name`;
  input.name = `contacts[${suffix}][name]`;
  label.htmlFor = input.id;

  if (key === null) {
    item.removeAttribute(ATTRIBUTES.key);
  } else {
    item.setAttribute(ATTRIBUTES.key, key);
  }

  markup.items.append(item);
  return item;
}

describe("existing server-rendered item registration", () => {
  it("builds immutable lookup records in DOM order", () => {
    const markup = createMarkup();
    const secondItem = appendItem(markup, "server-84", "server-84");
    const discovered = discoverRepeatableFieldsetMarkup(markup.root);
    const { registry } =
      registerExistingRepeatableFieldsetItems(discovered);

    expect(registry.items.map(({ element }) => element)).toEqual([
      markup.item,
      secondItem
    ]);
    expect(registry.items.map(({ key }) => key)).toEqual([
      "server-42",
      "server-84"
    ]);
    expect(Object.isFrozen(registry.items)).toBe(true);
    expect(registry.items.every((item) => Object.isFrozen(item))).toBe(
      true
    );
    expect(registry.getByElement(secondItem)).toBe(registry.items[1]);
    expect(registry.getByKey("server-42")).toBe(registry.items[0]);
    expect(registry.getByKey("unknown")).toBeNull();
    expect(registry.hasReservedKey("server-84")).toBe(true);
    expect(registry.hasReservedKey("unknown")).toBe(false);
  });

  it("preserves server markup, current values, identity, and errors", () => {
    const markup = createMarkup();
    const label = markup.item.querySelector("label");
    const hiddenId = document.createElement("input");
    const error = document.createElement("p");

    hiddenId.type = "hidden";
    hiddenId.name = "contacts[server-42][id]";
    hiddenId.value = "984";
    error.id = "contact-server-42-name-error";
    error.textContent = "Enter the saved contact name.";
    markup.input.defaultValue = "Saved name";
    markup.input.value = "Edited name";
    markup.input.setAttribute("aria-describedby", error.id);
    markup.item.insertBefore(hiddenId, markup.removeButton);
    markup.item.insertBefore(error, markup.removeButton);

    const itemAdded = vi.fn();
    markup.root.addEventListener(EVENTS.itemAdded, itemAdded);

    createRepeatableFieldset(markup.root);

    expect(markup.items.firstElementChild).toBe(markup.item);
    expect(markup.input.value).toBe("Edited name");
    expect(markup.input.defaultValue).toBe("Saved name");
    expect(markup.input.name).toBe(
      "contacts[server-42][name]"
    );
    expect(markup.input.id).toBe("contact-server-42-name");
    expect(label?.htmlFor).toBe(markup.input.id);
    expect(markup.input.getAttribute("aria-describedby")).toBe(error.id);
    expect(hiddenId.name).toBe("contacts[server-42][id]");
    expect(hiddenId.value).toBe("984");
    expect(error.textContent).toBe("Enter the saved contact name.");
    expect(itemAdded).not.toHaveBeenCalled();
  });

  it("assigns a key only to a keyless fieldset", () => {
    const markup = createMarkup();
    markup.item.removeAttribute(ATTRIBUTES.key);

    const beforeInput = {
      id: markup.input.id,
      name: markup.input.name,
      value: markup.input.value
    };
    const instance = createRepeatableFieldset(markup.root);

    expect(markup.item.getAttribute(ATTRIBUTES.key)).toBe("item-1");
    expect({
      id: markup.input.id,
      name: markup.input.name,
      value: markup.input.value
    }).toEqual(beforeInput);

    instance.destroy();
    expect(markup.item.getAttribute(ATTRIBUTES.key)).toBe("item-1");
  });

  it("reserves all server keys before assigning missing keys in DOM order", () => {
    const markup = createMarkup();
    markup.item.removeAttribute(ATTRIBUTES.key);
    const serverItem = appendItem(markup, "server-item-1", "item-1");
    const thirdItem = appendItem(markup, "new-third", null);

    createRepeatableFieldset(markup.root);

    expect(
      Array.from(markup.items.children, (item) =>
        item.getAttribute(ATTRIBUTES.key)
      )
    ).toEqual(["item-2", "item-1", "item-3"]);
    expect(serverItem.getAttribute(ATTRIBUTES.key)).toBe("item-1");
    expect(thirdItem.getAttribute(ATTRIBUTES.key)).toBe("item-3");
  });

  it("uses the configured key factory for keyless existing items", () => {
    const markup = createMarkup();
    markup.item.removeAttribute(ATTRIBUTES.key);
    const serverItem = appendItem(markup, "saved", "server-84");
    const contexts: unknown[] = [];

    createRepeatableFieldset(markup.root, {
      keyFactory(context) {
        contexts.push(context);
        return `record-${context.sequence}`;
      }
    });

    expect(markup.item.getAttribute(ATTRIBUTES.key)).toBe("record-1");
    expect(serverItem.getAttribute(ATTRIBUTES.key)).toBe("server-84");
    expect(contexts).toEqual([
      expect.objectContaining({
        root: markup.root,
        source: "initialization",
        sequence: 1,
        reservedKeys: ["server-84"]
      })
    ]);
  });

  it("rejects invalid factory output before assigning any item key", () => {
    const markup = createMarkup();
    markup.item.removeAttribute(ATTRIBUTES.key);
    appendItem(markup, "second", null);
    const before = markup.root.outerHTML;
    let thrown: unknown;

    try {
      createRepeatableFieldset(markup.root, {
        keyFactory({ sequence }) {
          return sequence === 1 ? "valid-1" : "-invalid";
        }
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(RepeatableFieldsetError);
    expect(thrown).toMatchObject({
      code: "invalid-key",
      root: markup.root
    });
    expect(markup.root.outerHTML).toBe(before);
  });

  it("supports zero existing items only when the minimum is zero", () => {
    const markup = createMarkup();
    markup.items.replaceChildren();
    const itemAdded = vi.fn();
    markup.root.addEventListener(EVENTS.itemAdded, itemAdded);

    expect(() => createRepeatableFieldset(markup.root)).toThrowError(
      RepeatableFieldsetError
    );

    markup.root.setAttribute(ATTRIBUTES.minimum, "0");
    const instance = createRepeatableFieldset(markup.root);

    expect(instance).toBeDefined();
    expect(markup.items.children).toHaveLength(0);
    expect(itemAdded).not.toHaveBeenCalled();
  });

  it("reports the zero-item minimum failure without changing author DOM", () => {
    const markup = createMarkup();
    markup.items.replaceChildren();
    const before = markup.root.outerHTML;
    let thrown: unknown;

    try {
      createRepeatableFieldset(markup.root);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(RepeatableFieldsetError);
    expect(thrown).toMatchObject({
      code: "invalid-options",
      root: markup.root,
      element: markup.items
    });
    expect(markup.root.outerHTML).toBe(before);
  });

  it("rolls back every assigned key when a later assignment fails", () => {
    const markup = createMarkup();
    markup.item.removeAttribute(ATTRIBUTES.key);
    const secondItem = appendItem(markup, "second", null);
    const originalSetAttribute = secondItem.setAttribute;
    const assignmentFailure = new Error("key assignment failed");

    secondItem.setAttribute = function setAttribute(
      qualifiedName: string,
      value: string
    ): void {
      if (qualifiedName === ATTRIBUTES.key) {
        throw assignmentFailure;
      }

      originalSetAttribute.call(this, qualifiedName, value);
    };

    let thrown: unknown;

    try {
      createRepeatableFieldset(markup.root);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(RepeatableFieldsetError);
    expect(thrown).toMatchObject({
      code: "invalid-key",
      root: markup.root,
      element: secondItem,
      cause: assignmentFailure
    });
    expect(markup.item.hasAttribute(ATTRIBUTES.key)).toBe(false);
    expect(secondItem.hasAttribute(ATTRIBUTES.key)).toBe(false);

    secondItem.setAttribute = originalSetAttribute;
    expect(() => createRepeatableFieldset(markup.root)).not.toThrow();
    expect(markup.item.getAttribute(ATTRIBUTES.key)).toBe("item-1");
    expect(secondItem.getAttribute(ATTRIBUTES.key)).toBe("item-2");
  });
});
