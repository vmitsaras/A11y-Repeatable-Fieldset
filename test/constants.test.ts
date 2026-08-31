import { describe, expect, it } from "vitest";

import * as publicApi from "../src/index";
import {
  ATTRIBUTES,
  CLASSES,
  COMPONENT_NAME,
  DEFAULT_OPTIONS,
  EVENT_DISPATCH_OPTIONS,
  EVENTS,
  GENERATED_KEY_PREFIX,
  ITEM_KEY_PATTERN,
  SELECTORS,
  TEMPLATE_KEY_TOKEN,
  TOKEN_ATTRIBUTES
} from "../src/constants";
import { DEFAULT_MESSAGE_FORMATTERS } from "../src/messages";

describe("runtime constants", () => {
  it("exports only documented runtime values from the main entry", () => {
    expect(Object.keys(publicApi).sort()).toEqual([
      "A11yRepeatableFieldset",
      "DEFAULT_MESSAGE_FORMATTERS",
      "EVENTS",
      "RepeatableFieldsetError",
      "createRepeatableFieldset",
      "initRepeatableFieldsetAll"
    ]);
    expect(publicApi.EVENTS).toBe(EVENTS);
    expect(publicApi.DEFAULT_MESSAGE_FORMATTERS).toBe(
      DEFAULT_MESSAGE_FORMATTERS
    );
  });

  it("freezes the exact lifecycle event contract", () => {
    expect(EVENTS).toEqual({
      init: "a11y-repeatable-fieldset:init",
      itemAdded: "a11y-repeatable-fieldset:item-added",
      itemDuplicated: "a11y-repeatable-fieldset:item-duplicated",
      itemRemoved: "a11y-repeatable-fieldset:item-removed",
      itemRestored: "a11y-repeatable-fieldset:item-restored",
      itemMoved: "a11y-repeatable-fieldset:item-moved",
      destroy: "a11y-repeatable-fieldset:destroy"
    });
    expect(Object.isFrozen(EVENTS)).toBe(true);
    expect(EVENT_DISPATCH_OPTIONS).toEqual({
      bubbles: true,
      composed: false,
      cancelable: false
    });
    expect(Object.isFrozen(EVENT_DISPATCH_OPTIONS)).toBe(true);
  });

  it("freezes the exact defaults without exposing mutable state", () => {
    expect(DEFAULT_OPTIONS).toEqual({
      minimum: 1,
      maximum: null,
      itemLabel: "Item",
      focusOnAdd: true,
      announceChanges: true,
      messageFormatters: DEFAULT_MESSAGE_FORMATTERS
    });
    expect(Object.isFrozen(DEFAULT_OPTIONS)).toBe(true);
    expect(Object.isFrozen(DEFAULT_MESSAGE_FORMATTERS)).toBe(true);
    expect(Reflect.set(DEFAULT_OPTIONS, "minimum", 0)).toBe(false);
    expect(DEFAULT_OPTIONS.minimum).toBe(1);
  });

  it("centralizes selectors, attributes, and BEM classes", () => {
    expect(COMPONENT_NAME).toBe("a11y-repeatable-fieldset");
    expect(Object.isFrozen(ATTRIBUTES)).toBe(true);
    expect(Object.isFrozen(SELECTORS)).toBe(true);
    expect(Object.isFrozen(CLASSES)).toBe(true);
    expect(SELECTORS.root).toBe("[data-a11y-repeatable-fieldset]");
    expect(SELECTORS.item).toBe(
      "fieldset[data-a11y-repeatable-fieldset-item]"
    );
    expect(SELECTORS.template).toBe(
      "template[data-a11y-repeatable-fieldset-template]"
    );
    expect(CLASSES.root).toBe("a11y-repeatable-fieldset");
    expect(CLASSES.status).toBe("a11y-repeatable-fieldset__status");
    expect(Object.values(CLASSES)).toEqual([
      "a11y-repeatable-fieldset",
      "a11y-repeatable-fieldset__items",
      "a11y-repeatable-fieldset__item",
      "a11y-repeatable-fieldset__legend",
      "a11y-repeatable-fieldset__controls",
      "a11y-repeatable-fieldset__add",
      "a11y-repeatable-fieldset__remove",
      "a11y-repeatable-fieldset__position",
      "a11y-repeatable-fieldset__limit",
      "a11y-repeatable-fieldset__status"
    ]);
    expect(
      Object.values(SELECTORS).every((selector) => !selector.includes("."))
    ).toBe(true);
  });

  it("locks stable-key and token replacement constants", () => {
    expect(TEMPLATE_KEY_TOKEN).toBe("__A11Y_REPEATABLE_KEY__");
    expect(GENERATED_KEY_PREFIX).toBe("item-");
    expect(ITEM_KEY_PATTERN.source).toBe(
      "^[A-Za-z0-9][A-Za-z0-9._:-]*$"
    );
    expect(ITEM_KEY_PATTERN.test("server-42")).toBe(true);
    expect(ITEM_KEY_PATTERN.test("-invalid")).toBe(false);
    expect(TOKEN_ATTRIBUTES).toEqual({
      scalar: ["id", "name", "for", "list"],
      idReference: [
        "aria-labelledby",
        "aria-describedby",
        "aria-controls",
        "headers"
      ],
      hashOnly: ["href"]
    });
    expect(Object.isFrozen(TOKEN_ATTRIBUTES)).toBe(true);
    expect(Object.isFrozen(TOKEN_ATTRIBUTES.scalar)).toBe(true);
    expect(Object.isFrozen(TOKEN_ATTRIBUTES.idReference)).toBe(true);
    expect(Object.isFrozen(TOKEN_ATTRIBUTES.hashOnly)).toBe(true);
  });
});
