import { describe, expect, it, vi } from "vitest";

import { EVENTS, createRepeatableFieldset } from "../src/index";
import { createAddonHarness } from "./helpers/addon-harness";
import { createTestRepeatableFieldsetMarkup } from "./helpers/create-markup";

describe("addon test harness", () => {
  it("records phases, scoped subscriptions, cleanup order, and retained items", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const harness = createAddonHarness();
    const eventListener = vi.fn();
    const addon = harness.createAddon("example.harness", {
      subscribeTo: EVENTS.itemAdded,
      onEvent: eventListener
    });
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0,
      addons: [addon]
    });
    const added = instance.add();

    expect(added.ok).toBe(true);

    if (!added.ok) {
      throw new Error("Expected Add to succeed.");
    }

    expect(harness.getSubscriptionCount()).toBe(1);
    expect(eventListener).toHaveBeenCalledTimes(1);
    expect(harness.retainedItems).toEqual(
      new Set([markup.item, added.item.element])
    );

    expect(instance.remove(added.item)).toMatchObject({ ok: true });
    expect(harness.retainedItems).toEqual(new Set([markup.item]));

    instance.destroy();

    expect(harness.getSubscriptionCount()).toBe(0);
    expect(harness.retainedItems).toEqual(new Set());
    expect(harness.records).toEqual([
      {
        kind: "component-setup",
        addonId: "example.harness",
        key: null,
        phase: null
      },
      {
        kind: "item-setup",
        addonId: "example.harness",
        key: "server-42",
        phase: "existing"
      },
      {
        kind: "item-setup",
        addonId: "example.harness",
        key: "item-1",
        phase: "added"
      },
      {
        kind: "item-cleanup",
        addonId: "example.harness",
        key: "item-1",
        phase: "added"
      },
      {
        kind: "item-cleanup",
        addonId: "example.harness",
        key: "server-42",
        phase: "existing"
      },
      {
        kind: "component-cleanup",
        addonId: "example.harness",
        key: null,
        phase: null
      }
    ]);
  });

  it("does not duplicate component or existing-item setup for a reused instance", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const harness = createAddonHarness();
    const addon = harness.createAddon("example.duplicate-init");
    const first = createRepeatableFieldset(markup.root, { addons: [addon] });
    const second = createRepeatableFieldset(markup.root, { addons: [addon] });

    expect(second).toBe(first);
    expect(harness.records).toEqual([
      {
        kind: "component-setup",
        addonId: "example.duplicate-init",
        key: null,
        phase: null
      },
      {
        kind: "item-setup",
        addonId: "example.duplicate-init",
        key: "server-42",
        phase: "existing"
      }
    ]);
  });
});
