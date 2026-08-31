import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_MESSAGE_FORMATTERS,
  createRepeatableFieldset,
  type RepeatableFieldsetBoundaryMessageContext,
  type RepeatableFieldsetDuplicateMessageContext,
  type RepeatableFieldsetItemMessageContext,
  type RepeatableFieldsetMoveBoundaryMessageContext,
  type RepeatableFieldsetMoveMessageContext,
  type RepeatableFieldsetMessageFormatters
} from "../src/index";
import { SELECTORS } from "../src/constants";
import {
  createTestRepeatableFieldsetMarkup,
  type TestRepeatableFieldsetMarkup
} from "./helpers/create-markup";

function createMarkup(): TestRepeatableFieldsetMarkup {
  return createTestRepeatableFieldsetMarkup(document);
}

function getStatus(root: HTMLElement): HTMLElement {
  const status = root.querySelector<HTMLElement>(SELECTORS.status);

  if (status === null) {
    throw new Error("The managed status region is missing.");
  }

  return status;
}

describe("localized structural messages", () => {
  it("exports frozen English formatter defaults", () => {
    const itemContext = Object.freeze({
      itemLabel: "Contact",
      key: "item-2",
      position: 2,
      count: 2,
      minimum: 1,
      maximum: 2
    }) satisfies RepeatableFieldsetItemMessageContext;
    const boundaryContext = itemContext satisfies
      RepeatableFieldsetBoundaryMessageContext;
    const moveContext = Object.freeze({
      ...itemContext,
      previousPosition: 1,
      direction: "down" as const
    }) satisfies RepeatableFieldsetMoveMessageContext;
    const duplicateContext = Object.freeze({
      ...itemContext,
      sourceKey: "server-42",
      sourcePosition: 1
    }) satisfies RepeatableFieldsetDuplicateMessageContext;
    const moveBoundaryContext = Object.freeze({
      ...itemContext,
      direction: "up" as const,
      boundary: "start" as const
    }) satisfies RepeatableFieldsetMoveBoundaryMessageContext;

    expect(Object.isFrozen(DEFAULT_MESSAGE_FORMATTERS)).toBe(true);
    expect(DEFAULT_MESSAGE_FORMATTERS.added(itemContext)).toBe(
      "Contact 2 added. 2 items total."
    );
    expect(DEFAULT_MESSAGE_FORMATTERS.removed(itemContext)).toBe(
      "Contact 2 removed. 2 items remaining."
    );
    expect(DEFAULT_MESSAGE_FORMATTERS.duplicated(duplicateContext)).toBe(
      "Contact 1 duplicated as position 2. 2 items total."
    );
    expect(DEFAULT_MESSAGE_FORMATTERS.moved(moveContext)).toBe(
      "Contact moved to position 2 of 2."
    );
    expect(DEFAULT_MESSAGE_FORMATTERS.moveBoundary(moveBoundaryContext)).toBe(
      "Contact 2 is already first."
    );
    expect(DEFAULT_MESSAGE_FORMATTERS.maximum(boundaryContext)).toBe(
      "Maximum of 2 items reached."
    );
    expect(DEFAULT_MESSAGE_FORMATTERS.minimum(boundaryContext)).toBe(
      "Minimum of 1 item reached."
    );
  });

  it("uses operation overrides with frozen, value-free context", () => {
    const markup = createMarkup();
    markup.input.value = "Private field value";
    const added = vi.fn(
      (context: Readonly<RepeatableFieldsetItemMessageContext>) =>
        `Added ${context.key} at ${context.position}; count ${context.count}.`
    );
    const removed = vi.fn(
      (context: Readonly<RepeatableFieldsetItemMessageContext>) =>
        `Removed ${context.key} from ${context.position}; count ${context.count}.`
    );
    const moved = vi.fn(
      (context: Readonly<RepeatableFieldsetMoveMessageContext>) =>
        `Moved ${context.key} from ${context.previousPosition} to ${context.position}.`
    );
    const moveBoundary = vi.fn(
      (context: Readonly<RepeatableFieldsetMoveBoundaryMessageContext>) =>
        `Move boundary ${context.boundary}.`
    );
    const maximum = vi.fn(
      (context: Readonly<RepeatableFieldsetBoundaryMessageContext>) =>
        `Maximum ${context.maximum}.`
    );
    const minimum = vi.fn(
      (context: Readonly<RepeatableFieldsetBoundaryMessageContext>) =>
        `Minimum ${context.minimum}.`
    );
    const instance = createRepeatableFieldset(markup.root, {
      itemLabel: "Contact",
      minimum: 1,
      maximum: 2,
      messageFormatters: {
        added,
        removed,
        moved,
        moveBoundary,
        maximum,
        minimum
      }
    });
    const addResult = instance.add();

    if (!addResult.ok) {
      throw new Error("Expected Add to succeed.");
    }

    expect(getStatus(markup.root).textContent).toBe(
      "Added item-1 at 2; count 2. Maximum 2."
    );
    expect(Object.isFrozen(added.mock.calls[0]?.[0])).toBe(true);
    expect(added.mock.calls[0]?.[0]).toEqual({
      itemLabel: "Contact",
      key: "item-1",
      position: 2,
      count: 2,
      minimum: 1,
      maximum: 2
    });
    expect(JSON.stringify(added.mock.calls[0]?.[0])).not.toContain(
      "Private field value"
    );

    expect(instance.move(addResult.item, "up")).toMatchObject({ ok: true });
    expect(getStatus(markup.root).textContent).toBe(
      "Moved item-1 from 2 to 1."
    );
    expect(Object.isFrozen(moved.mock.calls[0]?.[0])).toBe(true);
    expect(JSON.stringify(moved.mock.calls[0]?.[0])).not.toContain(
      "Private field value"
    );

    expect(instance.move(addResult.item, "up")).toMatchObject({
      ok: false,
      reason: "boundary"
    });
    expect(getStatus(markup.root).textContent).toBe(
      "Move boundary start."
    );
    expect(Object.isFrozen(moveBoundary.mock.calls[0]?.[0])).toBe(true);

    expect(instance.move(addResult.item, "down")).toMatchObject({ ok: true });

    expect(instance.remove(addResult.item).ok).toBe(true);
    expect(getStatus(markup.root).textContent).toBe(
      "Removed item-1 from 2; count 1. Minimum 1."
    );
    expect(Object.isFrozen(removed.mock.calls[0]?.[0])).toBe(true);
    expect(maximum).toHaveBeenCalledTimes(1);
    expect(minimum).toHaveBeenCalledTimes(1);
    expect(moved).toHaveBeenCalledTimes(2);
    expect(moveBoundary).toHaveBeenCalledTimes(1);
  });

  it("localizes Duplicate with frozen source/new structural context", () => {
    const markup = createMarkup();
    markup.input.value = "Private source value";
    const duplicated = vi.fn(
      (context: Readonly<RepeatableFieldsetDuplicateMessageContext>) =>
        `Copied ${context.sourceKey} at ${context.sourcePosition} to ${context.key} at ${context.position}.`
    );
    const instance = createRepeatableFieldset(markup.root, {
      messageFormatters: { duplicated }
    });

    expect(instance.duplicate(markup.item)).toMatchObject({ ok: true });
    expect(getStatus(markup.root).textContent).toBe(
      "Copied server-42 at 1 to item-1 at 2."
    );
    expect(Object.isFrozen(duplicated.mock.calls[0]?.[0])).toBe(true);
    expect(JSON.stringify(duplicated.mock.calls[0]?.[0])).not.toContain(
      "Private source value"
    );
  });

  it("provides nullable item identity for blocked boundary commands", () => {
    const markup = createMarkup();
    const maximumContexts: RepeatableFieldsetBoundaryMessageContext[] =
      [];
    const minimumContexts: RepeatableFieldsetBoundaryMessageContext[] =
      [];
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 1,
      maximum: 1,
      messageFormatters: {
        maximum(context) {
          maximumContexts.push(context);
          return "Add boundary.";
        },
        minimum(context) {
          minimumContexts.push(context);
          return "Remove boundary.";
        }
      }
    });

    expect(instance.add()).toMatchObject({
      ok: false,
      reason: "maximum"
    });
    expect(maximumContexts).toEqual([
      {
        itemLabel: "Item",
        key: null,
        position: null,
        count: 1,
        minimum: 1,
        maximum: 1
      }
    ]);
    expect(Object.isFrozen(maximumContexts[0])).toBe(true);

    expect(instance.remove(markup.item)).toMatchObject({
      ok: false,
      reason: "minimum"
    });
    expect(minimumContexts).toEqual([
      {
        itemLabel: "Item",
        key: "server-42",
        position: 1,
        count: 1,
        minimum: 1,
        maximum: 1
      }
    ]);
    expect(Object.isFrozen(minimumContexts[0])).toBe(true);
  });

  it("falls back per concept for thrown, blank, or non-string output", () => {
    const markup = createMarkup();
    const invalidFormatters = {
      added: () => "   ",
      removed: () => {
        throw new Error("Localization failure");
      },
      maximum: () => 42,
      minimum: () => ""
    } as unknown as RepeatableFieldsetMessageFormatters;
    const instance = createRepeatableFieldset(markup.root, {
      itemLabel: "Contact",
      maximum: 2,
      messageFormatters: invalidFormatters
    });
    const added = instance.add();

    if (!added.ok) {
      throw new Error("Expected Add to succeed.");
    }

    expect(getStatus(markup.root).textContent).toBe(
      "Contact 2 added. 2 items total. Maximum of 2 items reached."
    );

    expect(instance.remove(added.item).ok).toBe(true);
    expect(getStatus(markup.root).textContent).toBe(
      "Contact 2 removed. 1 item remaining. Minimum of 1 item reached."
    );
  });

  it("trims valid custom output before combining it", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root, {
      maximum: 2,
      messageFormatters: {
        added: () => "  Added.  ",
        maximum: () => "  Limit reached.  "
      }
    });

    expect(instance.add().ok).toBe(true);
    expect(getStatus(markup.root).textContent).toBe(
      "Added. Limit reached."
    );
  });
});
