import { describe, expect, it, vi } from "vitest";

import { ATTRIBUTES, SELECTORS } from "../src/constants";
import {
  createRepeatableFieldset,
  RepeatableFieldsetError,
  type RepeatableFieldsetItem,
  type RepeatableFieldsetRemoveOptions,
  type RepeatableFieldsetRemoveResult,
  type RepeatableFieldsetRemoveTarget
} from "../src/index";
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

function getPositions(
  markup: TestRepeatableFieldsetMarkup
): readonly (string | null)[] {
  return getItems(markup).map(
    (item) =>
      item.querySelector(SELECTORS.position)?.textContent ?? null
  );
}

function rekeyMarkup(
  markup: TestRepeatableFieldsetMarkup,
  key: string
): void {
  markup.item.setAttribute(ATTRIBUTES.key, key);
  markup.input.id = `contact-${key}-name`;
  markup.input.name = `contacts[${key}][name]`;

  const label = markup.item.querySelector<HTMLLabelElement>("label");

  if (label !== null) {
    label.htmlFor = markup.input.id;
  }
}

function expectFailure(
  result: RepeatableFieldsetRemoveResult,
  reason: string
): void {
  expect(result).toMatchObject({
    ok: false,
    reason
  });
  expect(Object.isFrozen(result)).toBe(true);
}

describe("Remove command", () => {
  it("removes by immutable item snapshot and never reuses its key", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root);
    const added = instance.add();

    expect(added.ok).toBe(true);

    if (!added.ok) {
      throw new Error("Expected Add to succeed.");
    }

    const result = instance.remove(added.item);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Expected Remove to succeed.");
    }

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.item)).toBe(true);
    expect(result.item).toEqual(added.item);
    expect(result.item.element.parentNode).toBeNull();
    expect(getItems(markup)).toEqual([markup.item]);
    expect(getPositions(markup)).toEqual(["1"]);

    const next = instance.add();

    expect(next).toMatchObject({
      ok: true,
      item: {
        key: "item-2"
      }
    });
  });

  it("removes an owned fieldset and returns its pre-removal snapshot", () => {
    const markup = createMarkup();
    markup.root.setAttribute(ATTRIBUTES.minimum, "0");
    markup.input.value = "Preserved while detached";
    const instance = createRepeatableFieldset(markup.root);
    const result = instance.remove(markup.item);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Expected Remove to succeed.");
    }

    expect(result.item).toMatchObject({
      element: markup.item,
      key: "server-42",
      index: 0,
      position: 1
    });
    expect(result.item.element.parentNode).toBeNull();
    expect(
      result.item.element.querySelector<HTMLInputElement>("input")
        ?.value
    ).toBe("Preserved while detached");
    expect(getItems(markup)).toHaveLength(0);
  });

  it("removes by stable key without renaming later controls", () => {
    const markup = createMarkup();
    markup.root.setAttribute(ATTRIBUTES.minimum, "0");
    const instance = createRepeatableFieldset(markup.root);
    const firstAdded = instance.add();
    const secondAdded = instance.add();

    expect(firstAdded.ok).toBe(true);
    expect(secondAdded.ok).toBe(true);

    if (!firstAdded.ok || !secondAdded.ok) {
      throw new Error("Expected both additions to succeed.");
    }

    const laterInput =
      secondAdded.item.element.querySelector<HTMLInputElement>("input");
    const laterName = laterInput?.name;
    const laterId = laterInput?.id;
    const result = instance.remove(firstAdded.item.key);

    expect(result).toMatchObject({
      ok: true,
      item: {
        key: "item-1",
        index: 1,
        position: 2
      }
    });
    expect(getItems(markup)).toEqual([
      markup.item,
      secondAdded.item.element
    ]);
    expect(getPositions(markup)).toEqual(["1", "2"]);
    expect(laterInput?.name).toBe(laterName);
    expect(laterInput?.id).toBe(laterId);
    expect(
      secondAdded.item.element.getAttribute(ATTRIBUTES.key)
    ).toBe("item-2");
  });

  it("resolves a stale snapshot by stable element/key identity", () => {
    const markup = createMarkup();
    markup.root.setAttribute(ATTRIBUTES.minimum, "0");
    const instance = createRepeatableFieldset(markup.root);
    const added = instance.add();

    expect(added.ok).toBe(true);

    if (!added.ok) {
      throw new Error("Expected Add to succeed.");
    }

    expect(instance.remove(markup.item).ok).toBe(true);
    const result = instance.remove(added.item);

    expect(result).toMatchObject({
      ok: true,
      item: {
        element: added.item.element,
        key: added.item.key,
        index: 0,
        position: 1
      }
    });
  });

  it("rejects unknown, foreign, removed, and mismatched targets", () => {
    const markup = createMarkup();
    markup.root.setAttribute(ATTRIBUTES.minimum, "0");
    const foreignItem = document.createElement("fieldset");
    const instance = createRepeatableFieldset(markup.root);
    const added = instance.add();

    expect(added.ok).toBe(true);

    if (!added.ok) {
      throw new Error("Expected Add to succeed.");
    }

    expectFailure(instance.remove("missing-key"), "unowned-item");
    expectFailure(
      instance.remove(foreignItem),
      "unowned-item"
    );
    expectFailure(
      instance.remove({
        ...added.item,
        key: "different-key"
      }),
      "unowned-item"
    );

    expect(instance.remove(added.item).ok).toBe(true);
    expectFailure(instance.remove(added.item), "unowned-item");
    expect(getItems(markup)).toEqual([markup.item]);
  });

  it("blocks at minimum without detaching or changing positions", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root);
    const before = markup.item.outerHTML;
    const result = instance.remove("server-42");

    expectFailure(result, "minimum");
    expect(markup.item.parentElement).toBe(markup.items);
    expect(markup.item.outerHTML).toBe(before);
    expect(getPositions(markup)).toEqual(["1"]);
  });

  it("supports minimum zero and removal of the final item", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0
    });

    expect(instance.remove(markup.item).ok).toBe(true);
    expect(getItems(markup)).toHaveLength(0);
    expectFailure(instance.remove("server-42"), "unowned-item");
  });

  it("routes only the owned Remove control through the root listener", () => {
    const outer = createMarkup();
    const nested = createMarkup();
    rekeyMarkup(nested, "nested-server-42");
    nested.root.setAttribute(ATTRIBUTES.minimum, "0");
    createRepeatableFieldset(nested.root);
    outer.item.append(nested.root);
    const outerInstance = createRepeatableFieldset(outer.root);
    const added = outerInstance.add();

    expect(added.ok).toBe(true);

    if (!added.ok) {
      throw new Error("Expected Add to succeed.");
    }

    nested.removeButton.click();

    expect(getItems(nested)).toHaveLength(0);
    expect(getItems(outer)).toHaveLength(2);

    const removeButton =
      added.item.element.querySelector<HTMLButtonElement>(
        SELECTORS.remove
      );
    removeButton?.click();

    expect(getItems(outer)).toEqual([outer.item]);
  });

  it("keeps revealed enhancement controls synchronized after Add", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root);
    const added = instance.add();

    expect(added.ok).toBe(true);

    if (!added.ok) {
      throw new Error("Expected Add to succeed.");
    }

    expect(markup.addButton.hidden).toBe(false);
    expect(markup.addButton.disabled).toBe(false);
    expect(markup.removeButton.hidden).toBe(false);
    expect(markup.removeButton.disabled).toBe(false);
    expect(
      added.item.element.querySelector<HTMLButtonElement>(
        SELECTORS.remove
      )?.hidden
    ).toBe(false);
  });

  it("does not move unrelated focus for a default API removal", () => {
    const markup = createMarkup();
    const unrelated = document.createElement("button");
    unrelated.type = "button";
    document.body.append(unrelated);
    const instance = createRepeatableFieldset(markup.root);
    const added = instance.add();

    expect(added.ok).toBe(true);

    if (!added.ok) {
      throw new Error("Expected Add to succeed.");
    }

    unrelated.focus();
    const result = instance.remove(added.item);

    expect(result.ok).toBe(true);
    expect(document.activeElement).toBe(unrelated);
  });

  it("rolls back DOM order and registration after position failure", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root);
    const added = instance.add();

    expect(added.ok).toBe(true);

    if (!added.ok) {
      throw new Error("Expected Add to succeed.");
    }

    const marker = markup.item.querySelector(SELECTORS.position);

    if (marker === null) {
      throw new Error("Expected an existing position marker.");
    }

    Object.defineProperty(marker, "textContent", {
      configurable: true,
      set(): never {
        throw new Error("position write failed");
      }
    });

    const result = instance.remove(added.item);

    expectFailure(result, "addon-error");
    expect(getItems(markup)).toEqual([
      markup.item,
      added.item.element
    ]);
    expect(added.item.element.parentElement).toBe(markup.items);

    Reflect.deleteProperty(marker, "textContent");

    expect(instance.remove(added.item).ok).toBe(true);
  });

  it("restores the fieldset when detachment throws after mutation", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root);
    const added = instance.add();

    expect(added.ok).toBe(true);

    if (!added.ok) {
      throw new Error("Expected Add to succeed.");
    }

    const nativeRemove = added.item.element.remove.bind(
      added.item.element
    );
    vi.spyOn(added.item.element, "remove").mockImplementation(() => {
      nativeRemove();
      throw new Error("detachment failed");
    });

    const result = instance.remove(added.item);

    expectFailure(result, "addon-error");
    expect(getItems(markup)).toEqual([
      markup.item,
      added.item.element
    ]);
  });

  it("validates API options and returns inactive after destroy", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root);
    const added = instance.add();

    expect(added.ok).toBe(true);

    if (!added.ok) {
      throw new Error("Expected Add to succeed.");
    }

    expect(() =>
      instance.remove(added.item, {
        focus: "yes"
      } as unknown as { focus: boolean })
    ).toThrowError(RepeatableFieldsetError);
    expect(() =>
      instance.remove(added.item, {
        unexpected: true
      } as unknown as { focus?: boolean })
    ).toThrowError(RepeatableFieldsetError);

    instance.destroy();

    expectFailure(instance.remove(added.item), "inactive");
    const removeButton =
      added.item.element.querySelector<HTMLButtonElement>(
        SELECTORS.remove
      );
    removeButton?.click();
    expect(added.item.element.parentElement).toBe(markup.items);
  });

  it("exports the public Remove target, options, and result types", () => {
    const target: RepeatableFieldsetRemoveTarget = "server-42";
    const options: RepeatableFieldsetRemoveOptions = {
      focus: true
    };
    const snapshot: RepeatableFieldsetItem | null = null;

    expect(target).toBe("server-42");
    expect(options.focus).toBe(true);
    expect(snapshot).toBeNull();
  });
});
