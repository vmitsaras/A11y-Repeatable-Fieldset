import { describe, expect, it, vi } from "vitest";

import { EVENTS, RepeatableFieldsetError, createRepeatableFieldset } from "../src";
import { SELECTORS } from "../src/constants";
import { createTestRepeatableFieldsetMarkup } from "./helpers/create-markup";

function getKeys(root: HTMLElement): readonly string[] {
  return Array.from(
    root.querySelectorAll<HTMLFieldSetElement>(SELECTORS.item)
  ).map((item) => item.dataset["a11yRepeatableFieldsetKey"] ?? "");
}

function getPositions(root: HTMLElement): readonly string[] {
  return Array.from(
    root.querySelectorAll<HTMLFieldSetElement>(SELECTORS.item)
  ).map(
    (item) => item.querySelector(SELECTORS.position)?.textContent ?? ""
  );
}

function getStatus(root: HTMLElement): string {
  return root.querySelector(SELECTORS.status)?.textContent ?? "";
}

describe("transactional Move command", () => {
  it("moves one owned item while preserving stable identity and stale snapshots", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const instance = createRepeatableFieldset(markup.root, {
      itemLabel: "Contact"
    });
    const firstAdded = instance.add();
    const secondAdded = instance.add();

    if (!firstAdded.ok || !secondAdded.ok) {
      throw new Error("Expected three items for the Move test.");
    }

    const oldSnapshots = instance.getItems();
    const movedInput = secondAdded.item.element.querySelector<HTMLInputElement>(
      "input"
    );
    const identities = instance.getItems().map(({ key, element }) => ({
      key,
      id: element.querySelector<HTMLInputElement>("input")?.id,
      name: element.querySelector<HTMLInputElement>("input")?.name
    }));
    movedInput!.value = "Private value";

    const result = instance.move(secondAdded.item, "up");

    expect(result).toEqual({
      ok: true,
      item: {
        element: secondAdded.item.element,
        key: "item-2",
        index: 1,
        position: 2
      },
      previousIndex: 2,
      previousPosition: 3,
      direction: "up"
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(result.ok && Object.isFrozen(result.item)).toBe(true);
    expect(getKeys(markup.root)).toEqual(["server-42", "item-2", "item-1"]);
    expect(getPositions(markup.root)).toEqual(["1", "2", "3"]);
    expect(instance.getItems().map(({ key }) => key)).toEqual([
      "server-42",
      "item-2",
      "item-1"
    ]);
    expect(oldSnapshots.map(({ key, index, position }) => ({ key, index, position }))).toEqual([
      { key: "server-42", index: 0, position: 1 },
      { key: "item-1", index: 1, position: 2 },
      { key: "item-2", index: 2, position: 3 }
    ]);
    expect(movedInput?.value).toBe("Private value");
    expect(
      instance.getItems().map(({ key, element }) => ({
        key,
        id: element.querySelector<HTMLInputElement>("input")?.id,
        name: element.querySelector<HTMLInputElement>("input")?.name
      })).sort((first, second) => first.key.localeCompare(second.key))
    ).toEqual([...identities].sort((first, second) => first.key.localeCompare(second.key)));
    expect(getStatus(markup.root)).toBe(
      "Contact moved to position 2 of 3."
    );
  });

  it("accepts a stable key or owned fieldset and resolves current order", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const instance = createRepeatableFieldset(markup.root);
    const added = instance.add();

    if (!added.ok) {
      throw new Error("Expected a second item.");
    }

    expect(instance.move("item-1", "up")).toMatchObject({
      ok: true,
      previousIndex: 1,
      item: { index: 0 }
    });
    expect(instance.move(added.item.element, "down")).toMatchObject({
      ok: true,
      previousIndex: 0,
      item: { index: 1 }
    });
  });

  it("returns frozen start/end boundary results and emits no success event", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const moved = vi.fn();
    markup.root.addEventListener(EVENTS.itemMoved, moved);
    const instance = createRepeatableFieldset(markup.root, {
      itemLabel: "Contact"
    });
    const added = instance.add();

    if (!added.ok) {
      throw new Error("Expected a second item.");
    }

    const start = instance.move(markup.item, "up");
    expect(start).toMatchObject({
      ok: false,
      reason: "boundary",
      boundary: "start",
      item: { key: "server-42", index: 0, position: 1 }
    });
    expect(Object.isFrozen(start)).toBe(true);
    expect(!start.ok && start.reason === "boundary" && Object.isFrozen(start.item)).toBe(true);
    expect(getStatus(markup.root)).toBe("Contact 1 is already first.");

    const end = instance.move(added.item, "down");
    expect(end).toMatchObject({
      ok: false,
      reason: "boundary",
      boundary: "end",
      item: { key: "item-1", index: 1, position: 2 }
    });
    expect(getStatus(markup.root)).toBe("Contact 2 is already last.");
    expect(moved).not.toHaveBeenCalled();
    expect(getKeys(markup.root)).toEqual(["server-42", "item-1"]);
  });

  it("rejects unknown targets, invalid directions, and destroyed instances", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const instance = createRepeatableFieldset(markup.root);
    const foreign = createTestRepeatableFieldsetMarkup(document);

    expect(instance.move(foreign.item, "up")).toEqual({
      ok: false,
      reason: "unowned-item"
    });
    expect(() =>
      instance.move(markup.item, "sideways" as "up")
    ).toThrowError(RepeatableFieldsetError);

    instance.destroy();
    expect(instance.move(markup.item, "up")).toEqual({
      ok: false,
      reason: "inactive"
    });
  });

  it("preserves focus inside the moved item and leaves unrelated focus alone", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const outside = document.createElement("button");
    outside.type = "button";
    document.body.append(outside);
    const instance = createRepeatableFieldset(markup.root);
    const added = instance.add();

    if (!added.ok) {
      throw new Error("Expected a second item.");
    }

    const addedInput = added.item.element.querySelector<HTMLInputElement>("input");
    addedInput!.focus();
    expect(instance.move(added.item, "up")).toMatchObject({ ok: true });
    expect(document.activeElement).toBe(addedInput);

    outside.focus();
    expect(instance.move(added.item, "down")).toMatchObject({ ok: true });
    expect(document.activeElement).toBe(outside);
  });

  it("rolls registry, DOM, positions, focus, status, and events back on failure", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const moved = vi.fn();
    markup.root.addEventListener(EVENTS.itemMoved, moved);
    const instance = createRepeatableFieldset(markup.root);
    const added = instance.add();

    if (!added.ok) {
      throw new Error("Expected a second item.");
    }

    const input = added.item.element.querySelector<HTMLInputElement>("input");
    const status = markup.root.querySelector<HTMLElement>(SELECTORS.status);
    status!.textContent = "";
    input!.focus();
    vi.spyOn(markup.items, "insertBefore").mockImplementationOnce(() => {
      throw new Error("DOM move failed");
    });

    const result = instance.move(added.item, "up");

    expect(result).toMatchObject({ ok: false, reason: "move-error" });
    expect(getKeys(markup.root)).toEqual(["server-42", "item-1"]);
    expect(getPositions(markup.root)).toEqual(["1", "2"]);
    expect(instance.getItems().map(({ key }) => key)).toEqual([
      "server-42",
      "item-1"
    ]);
    expect(document.activeElement).toBe(input);
    expect(getStatus(markup.root)).toBe("");
    expect(moved).not.toHaveBeenCalled();
  });
});
