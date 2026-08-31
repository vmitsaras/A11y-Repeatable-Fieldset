import { describe, expect, it } from "vitest";

import { RepeatableFieldsetError } from "../src/errors";
import {
  StableKeyAllocator,
  type RepeatableFieldsetKey,
  type RepeatableFieldsetKeyFactory,
  type RepeatableFieldsetKeyFactoryContext,
  type RepeatableFieldsetKeySource
} from "../src/keys";
import type {
  RepeatableFieldsetKey as PublicRepeatableFieldsetKey,
  RepeatableFieldsetKeyFactory as PublicRepeatableFieldsetKeyFactory,
  RepeatableFieldsetKeyFactoryContext as PublicRepeatableFieldsetKeyFactoryContext,
  RepeatableFieldsetKeySource as PublicRepeatableFieldsetKeySource
} from "../src/index";

function createRoot(): HTMLElement {
  const root = document.createElement("section");
  root.setAttribute("data-a11y-repeatable-fieldset", "");
  return root;
}

function captureError(operation: () => unknown): RepeatableFieldsetError {
  try {
    operation();
  } catch (error) {
    if (error instanceof RepeatableFieldsetError) {
      return error;
    }

    throw error;
  }

  throw new Error("Expected a RepeatableFieldsetError.");
}

describe("StableKeyAllocator", () => {
  it("allocates monotonic default keys while skipping every reserved key", () => {
    const allocator = new StableKeyAllocator(createRoot(), [
      "item-1",
      "item-3",
      "server-42"
    ]);

    expect(allocator.allocate("initialization")).toBe("item-2");
    expect(allocator.allocate("add")).toBe("item-4");
    expect(allocator.allocate("add")).toBe("item-5");
    expect(allocator.getReservedKeys()).toEqual([
      "item-1",
      "item-3",
      "server-42",
      "item-2",
      "item-4",
      "item-5"
    ]);
  });

  it("has no release path and never reuses a previously allocated key", () => {
    const allocator = new StableKeyAllocator(createRoot());
    const removedItemKey = allocator.allocate("add");

    expect(removedItemKey).toBe("item-1");
    expect(allocator.has(removedItemKey)).toBe(true);
    expect(allocator.allocate("add")).toBe("item-2");
    expect(
      captureError(() => allocator.reserve(removedItemKey)).code
    ).toBe("duplicate-key");
  });

  it("passes frozen, stable context snapshots to a custom factory", () => {
    const root = createRoot();
    const contexts: Readonly<RepeatableFieldsetKeyFactoryContext>[] = [];
    const keyFactory: RepeatableFieldsetKeyFactory = (context) => {
      contexts.push(context);
      return `custom-${context.sequence}`;
    };
    const allocator = new StableKeyAllocator(
      root,
      ["server-42"],
      keyFactory
    );

    expect(allocator.allocate("initialization")).toBe("custom-1");
    expect(allocator.allocate("add")).toBe("custom-2");
    expect(contexts).toHaveLength(2);
    const firstContext = contexts[0];
    const secondContext = contexts[1];

    if (firstContext === undefined || secondContext === undefined) {
      throw new Error("The key factory did not receive both contexts.");
    }

    expect(firstContext).toMatchObject({
      root,
      source: "initialization",
      sequence: 1,
      reservedKeys: ["server-42"]
    });
    expect(secondContext).toMatchObject({
      root,
      source: "add",
      sequence: 2,
      reservedKeys: ["server-42", "custom-1"]
    });
    expect(contexts.every((context) => Object.isFrozen(context))).toBe(
      true
    );
    expect(Object.isFrozen(firstContext.reservedKeys)).toBe(true);
    expect(Object.isFrozen(secondContext.reservedKeys)).toBe(true);
  });

  it.each([
    "",
    " ",
    "-leading",
    "trailing ",
    "contains space",
    42,
    null,
    undefined
  ])("rejects invalid generated keys: %j", (candidate) => {
    const keyFactory = (() =>
      candidate) as unknown as RepeatableFieldsetKeyFactory;
    const allocator = new StableKeyAllocator(
      createRoot(),
      [],
      keyFactory
    );
    const error = captureError(() => allocator.allocate("add"));

    expect(error.code).toBe("invalid-key");
  });

  it("rejects a duplicate custom key without reserving a replacement", () => {
    const root = createRoot();
    const item = document.createElement("fieldset");
    const allocator = new StableKeyAllocator(
      root,
      ["server-42"],
      () => "server-42"
    );
    const error = captureError(() =>
      allocator.allocate("initialization", item)
    );

    expect(error).toMatchObject({
      code: "duplicate-key",
      root,
      element: item
    });
    expect(allocator.getReservedKeys()).toEqual(["server-42"]);
  });

  it("wraps key-factory exceptions with typed context and cause", () => {
    const root = createRoot();
    const item = document.createElement("fieldset");
    const cause = new Error("factory failure");
    const allocator = new StableKeyAllocator(root, [], () => {
      throw cause;
    });
    const error = captureError(() =>
      allocator.allocate("initialization", item)
    );

    expect(error).toMatchObject({
      code: "invalid-key",
      root,
      element: item,
      cause
    });
    expect(allocator.getReservedKeys()).toEqual([]);
  });

  it("keeps allocation state isolated between component instances", () => {
    const first = new StableKeyAllocator(createRoot());
    const second = new StableKeyAllocator(createRoot());

    expect(first.allocate("initialization")).toBe("item-1");
    expect(first.allocate("add")).toBe("item-2");
    expect(second.allocate("initialization")).toBe("item-1");
  });

  it("returns a new frozen reservation snapshot", () => {
    const allocator = new StableKeyAllocator(createRoot(), ["server-42"]);
    const first = allocator.getReservedKeys();
    const second = allocator.getReservedKeys();

    expect(first).toEqual(["server-42"]);
    expect(first).not.toBe(second);
    expect(Object.isFrozen(first)).toBe(true);
  });

  it("keeps internal and main-entry public key types compatible", () => {
    const key: RepeatableFieldsetKey = "server-42";
    const publicKey: PublicRepeatableFieldsetKey = key;
    const source: RepeatableFieldsetKeySource = "add";
    const publicSource: PublicRepeatableFieldsetKeySource = source;
    const factory: PublicRepeatableFieldsetKeyFactory = (context) => {
      const publicContext: PublicRepeatableFieldsetKeyFactoryContext =
        context;
      return `${publicContext.source}-${publicContext.sequence}`;
    };

    expect(publicKey).toBe("server-42");
    expect(publicSource).toBe("add");
    expect(typeof factory).toBe("function");
  });
});
