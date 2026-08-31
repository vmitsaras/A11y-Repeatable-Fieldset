import { describe, expect, it, vi } from "vitest";

import { EVENTS } from "../src/constants";
import {
  createRepeatableFieldset,
  RepeatableFieldsetError,
  type RepeatableFieldsetAddon
} from "../src/index";
import { createTestRepeatableFieldsetMarkup } from "./helpers/create-markup";

describe("component addon registration and cleanup", () => {
  it("sets up in registration order and cleans up in reverse order", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const calls: string[] = [];
    const first: RepeatableFieldsetAddon = {
      id: "example.first",
      setup() {
        calls.push("setup:first");
        return () => {
          calls.push("cleanup:first");
        };
      }
    };
    const second: RepeatableFieldsetAddon = {
      id: "example.second",
      setup() {
        calls.push("setup:second");
        return () => {
          calls.push("cleanup:second");
        };
      }
    };

    const instance = createRepeatableFieldset(markup.root, {
      addons: [first, second]
    });

    expect(calls).toEqual(["setup:first", "setup:second"]);

    instance.destroy();

    expect(calls).toEqual([
      "setup:first",
      "setup:second",
      "cleanup:second",
      "cleanup:first"
    ]);
  });

  it("sets up existing and added items, then cleans an item before removal", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const calls: string[] = [];
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0,
      addons: [
        {
          id: "example.items",
          setupItem(context) {
            calls.push(`setup:${context.phase}:${context.item.key}`);
            return () => {
              calls.push(`cleanup:${context.item.key}`);
            };
          }
        }
      ]
    });

    const added = instance.add();

    expect(added.ok).toBe(true);
    expect(calls).toEqual([
      "setup:existing:server-42",
      "setup:added:item-1"
    ]);

    if (!added.ok) {
      throw new Error("Expected addon-backed Add to succeed.");
    }

    expect(instance.remove(added.item)).toMatchObject({ ok: true });
    expect(calls).toEqual([
      "setup:existing:server-42",
      "setup:added:item-1",
      "cleanup:item-1"
    ]);
  });

  it("rolls back a failed added-item setup without retaining the candidate", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const cleanup = vi.fn();
    const instance = createRepeatableFieldset(markup.root, {
      addons: [
        {
          id: "example.first",
          setupItem(context) {
            if (context.phase === "added") {
              return cleanup;
            }

            return undefined;
          }
        },
        {
          id: "example.second",
          setupItem(context) {
            if (context.phase === "added") {
              throw new Error("added item setup failed");
            }
          }
        }
      ]
    });

    const result = instance.add();

    expect(result).toMatchObject({ ok: false, reason: "addon-error" });
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(instance.getCount()).toBe(1);
    expect(markup.items.children).toHaveLength(1);
  });

  it("aborts removal when item cleanup fails while keeping the item attached", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const cause = new Error("item cleanup failed");
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0,
      addons: [
        {
          id: "example.failing-item-cleanup",
          setupItem() {
            return () => {
              throw cause;
            };
          }
        }
      ]
    });

    expect(instance.remove(markup.item)).toMatchObject({
      ok: false,
      reason: "addon-error",
      error: cause
    });
    expect(markup.item.parentElement).toBe(markup.items);
    expect(instance.getCount()).toBe(1);
  });

  it("rolls back prior component cleanup and preserves author markup after setup fails", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const before = markup.root.cloneNode(true);
    const cause = new Error("second addon failed");
    const cleanup = vi.fn();

    let thrown: unknown;

    try {
      createRepeatableFieldset(markup.root, {
        addons: [
          {
            id: "example.first",
            setup() {
              return cleanup;
            }
          },
          {
            id: "example.second",
            setup() {
              throw cause;
            }
          }
        ]
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(RepeatableFieldsetError);
    expect(thrown).toMatchObject({ cause });
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(markup.root.isEqualNode(before)).toBe(true);

    const recovered = createRepeatableFieldset(markup.root);
    expect(recovered.getCount()).toBe(1);
  });

  it("rejects duplicate addon IDs before any setup runs", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const setup = vi.fn();
    const before = markup.root.outerHTML;

    expect(() =>
      createRepeatableFieldset(markup.root, {
        addons: [
          { id: "example.duplicate", setup },
          { id: "example.duplicate", setup }
        ]
      })
    ).toThrowError(RepeatableFieldsetError);

    expect(setup).not.toHaveBeenCalled();
    expect(markup.root.outerHTML).toBe(before);
  });

  it("owns and idempotently removes component event subscriptions", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const listener = vi.fn();
    const instance = createRepeatableFieldset(markup.root, {
      addons: [
        {
          id: "example.subscription",
          setup(context) {
            return context.on(EVENTS.init, listener);
          }
        }
      ]
    });
    const CustomEventConstructor = document.defaultView?.CustomEvent;

    if (CustomEventConstructor === undefined) {
      throw new Error("The test document has no CustomEvent constructor.");
    }

    listener.mockClear();
    markup.root.dispatchEvent(new CustomEventConstructor(EVENTS.init));
    expect(listener).toHaveBeenCalledTimes(1);

    instance.destroy();
    markup.root.dispatchEvent(new CustomEventConstructor(EVENTS.init));

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("finishes core teardown and surfaces a component cleanup failure once", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const secondCleanup = vi.fn();
    const cause = new Error("first cleanup failed");
    const instance = createRepeatableFieldset(markup.root, {
      addons: [
        {
          id: "example.first",
          setup() {
            return () => {
              throw cause;
            };
          }
        },
        {
          id: "example.second",
          setup() {
            return secondCleanup;
          }
        }
      ]
    });

    expect(() => instance.destroy()).toThrowError(RepeatableFieldsetError);
    expect(secondCleanup).toHaveBeenCalledTimes(1);
    expect(instance.getCount()).toBe(0);
    expect(markup.addButton.hidden).toBe(true);
    expect(markup.removeButton.hidden).toBe(true);
    expect(() => instance.destroy()).not.toThrow();
  });

  it("cleans current items before component resources during destroy", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const calls: string[] = [];
    const instance = createRepeatableFieldset(markup.root, {
      addons: [
        {
          id: "example.destroy-order",
          setup() {
            return () => {
              calls.push("component");
            };
          },
          setupItem(context) {
            calls.push(`setup:${context.item.key}`);
            return () => {
              calls.push(`item:${context.item.key}`);
            };
          }
        }
      ]
    });
    const added = instance.add();

    expect(added.ok).toBe(true);
    instance.destroy();

    expect(calls).toEqual([
      "setup:server-42",
      "setup:item-1",
      "item:item-1",
      "item:server-42",
      "component"
    ]);
  });
});
