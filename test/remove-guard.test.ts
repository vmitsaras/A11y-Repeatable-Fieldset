import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

import * as mainEntry from "../src";
import {
  createRemoveGuard,
  type RemoveGuardOptions
} from "../src/addons/remove-guard";
import {
  EVENTS,
  RepeatableFieldsetError,
  createRepeatableFieldset,
  type RepeatableFieldsetRemoveRequest
} from "../src/index";
import { createTestRepeatableFieldsetMarkup } from "./helpers/create-markup";

interface Deferred<Value> {
  readonly promise: Promise<Value>;
  resolve(value: Value): void;
  reject(error: unknown): void;
}

function createDeferred<Value>(): Deferred<Value> {
  let resolvePromise!: (value: Value) => void;
  let rejectPromise!: (error: unknown) => void;
  const promise = new Promise<Value>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  return {
    promise,
    resolve: resolvePromise,
    reject: rejectPromise
  };
}

async function flushConfirmation(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe("Remove-request routing", () => {
  it("routes a control request once while public remove remains immediate", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    let request: Readonly<RepeatableFieldsetRemoveRequest> | null = null;
    const removed = vi.fn();
    markup.root.addEventListener(EVENTS.itemRemoved, removed);
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0,
      addons: [
        {
          id: "example.request-owner",
          setup(context) {
            context.onRemoveRequest((nextRequest) => {
              request = nextRequest;
            });
          }
        }
      ]
    });

    markup.removeButton.click();

    expect(instance.getCount()).toBe(1);
    expect(request).not.toBeNull();
    expect(Object.isFrozen(request)).toBe(true);
    expect(Object.isFrozen(request!.item)).toBe(true);
    expect(request!.trigger).toBe(markup.removeButton);

    const first = request!.remove();
    const repeated = request!.remove();

    expect(first).toMatchObject({ ok: true });
    expect(repeated).toBe(first);
    expect(removed).toHaveBeenCalledTimes(1);
    expect(removed.mock.calls[0]?.[0]).toMatchObject({
      detail: {
        source: "control",
        trigger: markup.removeButton
      }
    });
  });

  it("rejects multiple control-request owners transactionally", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const before = markup.root.cloneNode(true);

    expect(() =>
      createRepeatableFieldset(markup.root, {
        addons: [
          {
            id: "example.first-request-owner",
            setup(context) {
              context.onRemoveRequest(() => {});
            }
          },
          {
            id: "example.second-request-owner",
            setup(context) {
              context.onRemoveRequest(() => {});
            }
          }
        ]
      })
    ).toThrowError(RepeatableFieldsetError);

    expect(markup.root.isEqualNode(before)).toBe(true);
    expect(markup.addButton.hidden).toBe(true);
  });
});

describe("Remove Guard addon", () => {
  it("creates a frozen addon with explicit, validated policy callbacks", () => {
    const shouldConfirm = vi.fn(() => true);
    const confirm = vi.fn(() => false);
    const addon = createRemoveGuard({ shouldConfirm, confirm });

    expect(addon.id).toBe("a11y-repeatable-fieldset.remove-guard");
    expect(addon.setup).toBeTypeOf("function");
    expect(addon.setupItem).toBeUndefined();
    expect(Object.isFrozen(addon)).toBe(true);

    expect(() =>
      createRemoveGuard(null as unknown as RemoveGuardOptions)
    ).toThrowError("Remove Guard: options must be an object.");
    expect(() =>
      createRemoveGuard({
        shouldConfirm: null as unknown as RemoveGuardOptions["shouldConfirm"],
        confirm
      })
    ).toThrowError("Remove Guard: shouldConfirm must be a function.");
    expect(() =>
      createRemoveGuard({
        shouldConfirm,
        confirm: null as unknown as RemoveGuardOptions["confirm"]
      })
    ).toThrowError("Remove Guard: confirm must be a function.");
    expect(() =>
      createRemoveGuard({
        shouldConfirm,
        confirm,
        unexpected: true
      } as unknown as RemoveGuardOptions)
    ).toThrowError('Remove Guard: unknown option "unexpected".');
  });

  it("removes immediately when application policy finds no meaningful state", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const shouldConfirm = vi.fn(() => false);
    const confirm = vi.fn(() => false);
    const removed = vi.fn();
    markup.root.addEventListener(EVENTS.itemRemoved, removed);
    createRepeatableFieldset(markup.root, {
      minimum: 0,
      addons: [createRemoveGuard({ shouldConfirm, confirm })]
    });

    markup.removeButton.click();

    expect(shouldConfirm).toHaveBeenCalledTimes(1);
    expect(confirm).not.toHaveBeenCalled();
    expect(markup.item.isConnected).toBe(false);
    expect(removed).toHaveBeenCalledTimes(1);
    expect(removed.mock.calls[0]?.[0]).toMatchObject({
      detail: {
        source: "control",
        trigger: markup.removeButton
      }
    });
  });

  it("keeps a denied item and removes it after later synchronous approval", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const confirm = vi
      .fn<RemoveGuardOptions["confirm"]>()
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    const removed = vi.fn();
    markup.root.addEventListener(EVENTS.itemRemoved, removed);
    createRepeatableFieldset(markup.root, {
      minimum: 0,
      addons: [
        createRemoveGuard({
          shouldConfirm: () => true,
          confirm
        })
      ]
    });

    markup.removeButton.click();
    expect(markup.item.isConnected).toBe(true);
    expect(removed).not.toHaveBeenCalled();

    markup.removeButton.click();
    expect(markup.item.isConnected).toBe(false);
    expect(removed).toHaveBeenCalledTimes(1);
    expect(confirm).toHaveBeenCalledTimes(2);
  });

  it("coalesces repeated activation while asynchronous confirmation is pending", async () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const deferred = createDeferred<boolean>();
    const confirm = vi.fn(() => deferred.promise);
    const shouldConfirm = vi.fn(() => true);
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0,
      addons: [createRemoveGuard({ shouldConfirm, confirm })]
    });

    markup.removeButton.click();
    markup.removeButton.click();
    markup.removeButton.dispatchEvent(
      new MouseEvent("click", { bubbles: true })
    );

    expect(confirm).toHaveBeenCalledTimes(1);
    expect(shouldConfirm).toHaveBeenCalledTimes(1);
    expect(instance.getCount()).toBe(1);

    deferred.resolve(true);
    await flushConfirmation();

    expect(instance.getCount()).toBe(0);
  });

  it("revalidates stale ownership before delayed approval", async () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const deferred = createDeferred<boolean>();
    const removed = vi.fn();
    markup.root.addEventListener(EVENTS.itemRemoved, removed);
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0,
      addons: [
        createRemoveGuard({
          shouldConfirm: () => true,
          confirm: () => deferred.promise
        })
      ]
    });

    markup.removeButton.click();
    expect(instance.remove(markup.item)).toMatchObject({ ok: true });

    deferred.resolve(true);
    await flushConfirmation();

    expect(instance.getCount()).toBe(0);
    expect(removed).toHaveBeenCalledTimes(1);
    expect(removed.mock.calls[0]?.[0]).toMatchObject({
      detail: { source: "api", trigger: null }
    });
  });

  it("revalidates the current minimum before delayed approval", async () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const deferred = createDeferred<boolean>();
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 1,
      addons: [
        createRemoveGuard({
          shouldConfirm: () => true,
          confirm: () => deferred.promise
        })
      ]
    });
    const added = instance.add();

    expect(added.ok).toBe(true);

    if (!added.ok) {
      throw new Error("Expected a second item for the minimum race test.");
    }

    markup.removeButton.click();
    expect(instance.remove(added.item)).toMatchObject({ ok: true });
    expect(instance.getCount()).toBe(1);

    deferred.resolve(true);
    await flushConfirmation();

    expect(instance.getCount()).toBe(1);
    expect(markup.item.isConnected).toBe(true);
    expect(markup.removeButton.disabled).toBe(true);
  });

  it("ignores delayed approval after destroy", async () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const deferred = createDeferred<boolean>();
    const removed = vi.fn();
    markup.root.addEventListener(EVENTS.itemRemoved, removed);
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0,
      addons: [
        createRemoveGuard({
          shouldConfirm: () => true,
          confirm: () => deferred.promise
        })
      ]
    });

    markup.removeButton.click();
    instance.destroy();
    deferred.resolve(true);
    await flushConfirmation();

    expect(markup.item.isConnected).toBe(true);
    expect(removed).not.toHaveBeenCalled();
  });

  it("keeps API removal immediate because it is already an approved command", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const shouldConfirm = vi.fn(() => true);
    const confirm = vi.fn(() => false);
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0,
      addons: [createRemoveGuard({ shouldConfirm, confirm })]
    });

    expect(instance.remove(markup.item)).toMatchObject({ ok: true });
    expect(shouldConfirm).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
  });

  it("fails closed and reports invalid policy or rejected confirmation", async () => {
    const first = createTestRepeatableFieldsetMarkup(document);
    const firstError = new Error("inspection failed");
    const onError = vi.fn();
    const firstInstance = createRepeatableFieldset(first.root, {
      minimum: 0,
      addons: [
        createRemoveGuard({
          shouldConfirm() {
            throw firstError;
          },
          confirm: () => true,
          onError
        })
      ]
    });

    first.removeButton.click();
    expect(first.item.isConnected).toBe(true);
    expect(onError).toHaveBeenCalledWith(
      firstError,
      expect.objectContaining({ item: expect.objectContaining({ key: "server-42" }) })
    );
    firstInstance.destroy();
    first.root.remove();

    const second = createTestRepeatableFieldsetMarkup(document);
    const rejection = new Error("dialog failed");
    const rejected = createDeferred<boolean>();
    const secondError = vi.fn();
    createRepeatableFieldset(second.root, {
      minimum: 0,
      addons: [
        createRemoveGuard({
          shouldConfirm: () => true,
          confirm: () => rejected.promise,
          onError: secondError
        })
      ]
    });

    second.removeButton.click();
    rejected.reject(rejection);
    await flushConfirmation();

    expect(second.item.isConnected).toBe(true);
    expect(secondError).toHaveBeenCalledWith(
      rejection,
      expect.objectContaining({ root: second.root })
    );
  });

  it("fails closed for non-boolean policy and confirmation output", async () => {
    const invalidPolicy = createTestRepeatableFieldsetMarkup(document);
    const policyError = vi.fn(() => {
      throw new Error("diagnostic handler failure");
    });
    const policyInstance = createRepeatableFieldset(invalidPolicy.root, {
      minimum: 0,
      addons: [
        createRemoveGuard({
          shouldConfirm: (() => "yes") as unknown as RemoveGuardOptions["shouldConfirm"],
          confirm: () => true,
          onError: policyError
        })
      ]
    });

    expect(() => invalidPolicy.removeButton.click()).not.toThrow();
    expect(invalidPolicy.item.isConnected).toBe(true);
    expect(policyError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Remove Guard: shouldConfirm must return a boolean."
      }),
      expect.objectContaining({ item: expect.objectContaining({ key: "server-42" }) })
    );
    policyInstance.destroy();
    invalidPolicy.root.remove();

    const invalidConfirmation = createTestRepeatableFieldsetMarkup(document);
    const confirmationError = vi.fn();
    createRepeatableFieldset(invalidConfirmation.root, {
      minimum: 0,
      addons: [
        createRemoveGuard({
          shouldConfirm: () => true,
          confirm: (() =>
            Promise.resolve("yes")) as unknown as RemoveGuardOptions["confirm"],
          onError: confirmationError
        })
      ]
    });

    invalidConfirmation.removeButton.click();
    await flushConfirmation();

    expect(invalidConfirmation.item.isConnected).toBe(true);
    expect(confirmationError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Remove Guard: confirm must return or resolve to a boolean."
      }),
      expect.objectContaining({ root: invalidConfirmation.root })
    );
  });

  it("does not inspect form values unless application policy does so", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const valueGetter = vi.spyOn(markup.input, "value", "get");
    createRepeatableFieldset(markup.root, {
      minimum: 0,
      addons: [
        createRemoveGuard({
          shouldConfirm: () => false,
          confirm: () => true
        })
      ]
    });

    markup.removeButton.click();

    expect(valueGetter).not.toHaveBeenCalled();
  });

  it("keeps the concrete addon out of the main runtime entry", () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), "package.json"), "utf8")
    ) as {
      exports: Record<string, unknown>;
      dependencies: Record<string, unknown>;
    };
    const mainSource = readFileSync(
      resolve(process.cwd(), "src/index.ts"),
      "utf8"
    );
    const coreBundle = readFileSync(
      resolve(process.cwd(), "docs/assets/a11y-repeatable-fieldset.js"),
      "utf8"
    );
    const addonBundle = readFileSync(
      resolve(process.cwd(), "docs/assets/remove-guard.js"),
      "utf8"
    );

    expect(mainEntry).not.toHaveProperty("createRemoveGuard");
    expect(mainSource).not.toContain("addons/remove-guard");
    expect(coreBundle).not.toContain("createRemoveGuard");
    expect(addonBundle).toContain("createRemoveGuard");
    expect(packageJson.exports).toHaveProperty("./addons/remove-guard");
    expect(packageJson.dependencies).toEqual({});
  });
});
