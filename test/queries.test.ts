import { describe, expect, it } from "vitest";

import { ATTRIBUTES } from "../src/constants";
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

function expectCapabilitiesMatchControls(
  instance: RepeatableFieldsetInstance,
  markup: TestRepeatableFieldsetMarkup
): void {
  expect(instance.canAdd()).toBe(!markup.addButton.disabled);

  for (const removeButton of markup.items.querySelectorAll<HTMLButtonElement>(
    "[data-a11y-repeatable-fieldset-remove]"
  )) {
    expect(instance.canRemove()).toBe(!removeButton.disabled);
  }
}

describe("collection and capability queries", () => {
  it("returns fresh frozen arrays containing fresh frozen snapshots", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root);
    const first = instance.getItems();
    const second = instance.getItems();

    expect(first).not.toBe(second);
    expect(first[0]).not.toBe(second[0]);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(second)).toBe(true);
    expect(Object.isFrozen(first[0])).toBe(true);
    expect(first).toEqual([
      {
        element: markup.item,
        key: "server-42",
        index: 0,
        position: 1
      }
    ]);
    expect(
      Reflect.set(
        first as unknown as Record<string, unknown>,
        "0",
        null
      )
    ).toBe(false);
    expect(
      Reflect.set(
        first[0] as unknown as Record<string, unknown>,
        "index",
        99
      )
    ).toBe(false);
    expect(instance.getItems()[0]?.index).toBe(0);
  });

  it("keeps earlier query snapshots detached from later collection state", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0
    });
    const beforeAdd = instance.getItems();
    const firstAdded = instance.add();
    const secondAdded = instance.add();

    expect(firstAdded.ok).toBe(true);
    expect(secondAdded.ok).toBe(true);
    expect(beforeAdd).toHaveLength(1);
    expect(beforeAdd[0]).toMatchObject({
      key: "server-42",
      index: 0,
      position: 1
    });

    const beforeRemove = instance.getItems();

    expect(instance.remove(markup.item).ok).toBe(true);
    expect(beforeRemove.map(({ key }) => key)).toEqual([
      "server-42",
      "item-1",
      "item-2"
    ]);
    expect(instance.getItems()).toMatchObject([
      {
        key: "item-1",
        index: 0,
        position: 1
      },
      {
        key: "item-2",
        index: 1,
        position: 2
      }
    ]);
  });

  it("reports count across successful Add and Remove transitions", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0
    });

    expect(instance.getCount()).toBe(1);

    const added = instance.add();

    expect(added.ok).toBe(true);
    expect(instance.getCount()).toBe(2);

    if (!added.ok) {
      throw new Error("Expected Add to succeed.");
    }

    expect(instance.remove(added.item).ok).toBe(true);
    expect(instance.getCount()).toBe(1);
    expect(instance.remove(markup.item).ok).toBe(true);
    expect(instance.getCount()).toBe(0);
    expect(instance.getItems()).toEqual([]);
  });

  it("keeps finite-boundary capabilities aligned with native controls", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 1,
      maximum: 2
    });

    expect(instance.canAdd()).toBe(true);
    expect(instance.canRemove()).toBe(false);
    expectCapabilitiesMatchControls(instance, markup);

    const added = instance.add();

    expect(added.ok).toBe(true);
    expect(instance.canAdd()).toBe(false);
    expect(instance.canRemove()).toBe(true);
    expectCapabilitiesMatchControls(instance, markup);

    if (!added.ok) {
      throw new Error("Expected Add to succeed.");
    }

    expect(instance.remove(added.item).ok).toBe(true);
    expect(instance.canAdd()).toBe(true);
    expect(instance.canRemove()).toBe(false);
    expectCapabilitiesMatchControls(instance, markup);
  });

  it("reports zero-minimum and unbounded-maximum capabilities", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0,
      maximum: null
    });

    expect(instance.canAdd()).toBe(true);
    expect(instance.canRemove()).toBe(true);

    expect(instance.remove(markup.item).ok).toBe(true);
    expect(instance.getCount()).toBe(0);
    expect(instance.canAdd()).toBe(true);
    expect(instance.canRemove()).toBe(false);
  });

  it("reports both capabilities false for an empty zero-maximum collection", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0,
      maximum: 0
    });

    expect(instance.canAdd()).toBe(false);
    expect(instance.canRemove()).toBe(true);
    expect(instance.remove(markup.item).ok).toBe(true);
    expect(instance.getCount()).toBe(0);
    expect(instance.canAdd()).toBe(false);
    expect(instance.canRemove()).toBe(false);
  });

  it("does not change query state after blocked commands", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 1,
      maximum: 1
    });
    const before = instance.getItems();

    expect(instance.add()).toMatchObject({
      ok: false,
      reason: "maximum"
    });
    expect(instance.remove(markup.item)).toMatchObject({
      ok: false,
      reason: "minimum"
    });
    expect(instance.getCount()).toBe(1);
    expect(instance.getItems()).toEqual(before);
    expect(instance.canAdd()).toBe(false);
    expect(instance.canRemove()).toBe(false);
  });

  it("returns inactive query values after destroy without changing DOM", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0
    });
    const added = instance.add();

    expect(added.ok).toBe(true);

    if (!added.ok) {
      throw new Error("Expected Add to succeed.");
    }

    instance.destroy();

    const first = instance.getItems();
    const second = instance.getItems();

    expect(first).toEqual([]);
    expect(second).toEqual([]);
    expect(first).not.toBe(second);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(second)).toBe(true);
    expect(instance.getCount()).toBe(0);
    expect(instance.canAdd()).toBe(false);
    expect(instance.canRemove()).toBe(false);
    expect(markup.items.children).toHaveLength(2);
    expect(
      added.item.element.getAttribute(ATTRIBUTES.key)
    ).toBe("item-1");
  });

  it("lets a replacement instance query the structure preserved by destroy", () => {
    const markup = createMarkup();
    const first = createRepeatableFieldset(markup.root);
    const added = first.add();

    expect(added.ok).toBe(true);
    first.destroy();

    const replacement = createRepeatableFieldset(markup.root);

    expect(first.getCount()).toBe(0);
    expect(replacement.getCount()).toBe(2);
    expect(replacement.getItems().map(({ key }) => key)).toEqual([
      "server-42",
      "item-1"
    ]);
    expect(replacement.canAdd()).toBe(true);
    expect(replacement.canRemove()).toBe(true);
  });

  it("exposes the complete query surface through the instance type", () => {
    const markup = createMarkup();
    const instance: RepeatableFieldsetInstance =
      createRepeatableFieldset(markup.root);
    const item: RepeatableFieldsetItem | undefined =
      instance.getItems()[0];

    expect(item?.element).toBe(markup.item);
    expect(instance.getCount()).toBe(1);
    expect(typeof instance.canAdd()).toBe("boolean");
    expect(typeof instance.canRemove()).toBe("boolean");
  });
});
