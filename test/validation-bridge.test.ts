import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

import * as mainEntry from "../src";
import {
  createValidationBridge,
  type ValidationBridgeItemContext,
  type ValidationBridgeOptions
} from "../src/addons/validation-bridge";
import {
  EVENTS,
  RepeatableFieldsetError,
  createRepeatableFieldset
} from "../src/index";
import { createTestRepeatableFieldsetMarkup } from "./helpers/create-markup";

function appendSecondExistingItem(
  first: HTMLFieldSetElement,
  items: HTMLElement
): HTMLFieldSetElement {
  const second = first.cloneNode(true) as HTMLFieldSetElement;
  second.dataset["a11yRepeatableFieldsetKey"] = "server-84";

  const input = second.querySelector<HTMLInputElement>("input");
  const label = second.querySelector<HTMLLabelElement>("label");

  if (input === null || label === null) {
    throw new Error("The cloned test item is missing its labelled input.");
  }

  input.id = "contact-server-84-name";
  input.name = "contacts[server-84][name]";
  label.htmlFor = input.id;
  items.append(second);

  return second;
}

describe("Validation Bridge addon", () => {
  it("creates a frozen, dependency-free addon with validated options", () => {
    const registerItem = vi.fn();
    const options = {
      id: "application.validation",
      registerItem
    } satisfies ValidationBridgeOptions;
    const bridge = createValidationBridge(options);

    expect(bridge.id).toBe("application.validation");
    expect(bridge.setup).toBeUndefined();
    expect(bridge.setupItem).toBeTypeOf("function");
    expect(Object.isFrozen(bridge)).toBe(true);
    expect(options).toEqual({
      id: "application.validation",
      registerItem
    });

    expect(() =>
      createValidationBridge(
        null as unknown as ValidationBridgeOptions
      )
    ).toThrowError("Validation Bridge: options must be an object.");
    expect(() =>
      createValidationBridge({
        id: " application.validation ",
        registerItem
      })
    ).toThrowError("Validation Bridge: id must be a trimmed, non-empty string.");
    expect(() =>
      createValidationBridge({
        id: "application.validation",
        registerItem: null as unknown as ValidationBridgeOptions["registerItem"]
      })
    ).toThrowError("Validation Bridge: registerItem must be a function.");
  });

  it("registers existing and added items exactly once with frozen contexts", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const calls: string[] = [];
    const activeItems = new Set<HTMLFieldSetElement>();
    const bridge = createValidationBridge({
      id: "application.validation",
      registerItem(context) {
        expect(Object.isFrozen(context)).toBe(true);
        expect(Object.isFrozen(context.item)).toBe(true);
        expect(context.root).toBe(markup.root);
        expect(context.instance).toBeDefined();
        calls.push(`register:${context.phase}:${context.item.key}`);
        activeItems.add(context.item.element);

        return () => {
          calls.push(
            `cleanup:${context.item.key}:${String(context.item.element.isConnected)}`
          );
          activeItems.delete(context.item.element);
        };
      }
    });
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0,
      addons: [bridge]
    });
    const duplicate = createRepeatableFieldset(markup.root, {
      minimum: 0,
      addons: [bridge]
    });
    const added = instance.add();

    expect(duplicate).toBe(instance);
    expect(added.ok).toBe(true);
    expect(calls).toEqual([
      "register:existing:server-42",
      "register:added:item-1"
    ]);
    expect(activeItems.size).toBe(2);

    if (!added.ok) {
      throw new Error("Expected Validation Bridge-backed Add to succeed.");
    }

    expect(instance.remove(added.item)).toMatchObject({ ok: true });
    expect(calls).toContain("cleanup:item-1:true");
    expect(activeItems).toEqual(new Set([markup.item]));

    instance.destroy();
    expect(calls).toContain("cleanup:server-42:true");
    expect(activeItems.size).toBe(0);

    const reinitialized = createRepeatableFieldset(markup.root, {
      minimum: 0,
      addons: [bridge]
    });
    expect(
      calls.filter((call) => call === "register:existing:server-42")
    ).toHaveLength(2);
    expect(activeItems).toEqual(new Set([markup.item]));
    reinitialized.destroy();
    expect(activeItems.size).toBe(0);
  });

  it("preserves author and server validation state during existing-item registration", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const serverError = document.createElement("p");
    serverError.id = "contact-server-42-name-error";
    serverError.textContent = "Server message: enter a contact name.";
    markup.input.setAttribute("aria-invalid", "true");
    markup.input.setAttribute("aria-describedby", serverError.id);
    markup.item.insertBefore(serverError, markup.removeButton);
    const registerItem = vi.fn((_context: ValidationBridgeItemContext) => {
      return undefined;
    });

    const instance = createRepeatableFieldset(markup.root, {
      addons: [
        createValidationBridge({
          id: "application.validation",
          registerItem
        })
      ]
    });

    expect(registerItem).toHaveBeenCalledTimes(1);
    expect(markup.input.getAttribute("aria-invalid")).toBe("true");
    expect(markup.input.getAttribute("aria-describedby")).toBe(serverError.id);
    expect(document.getElementById(serverError.id)).toBe(serverError);
    expect(serverError.textContent).toContain("Server message");

    instance.destroy();
  });

  it("rolls back completed registrations when later existing-item setup fails", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    appendSecondExistingItem(markup.item, markup.items);
    const calls: string[] = [];
    const cause = new Error("validator registration failed");

    expect(() =>
      createRepeatableFieldset(markup.root, {
        addons: [
          createValidationBridge({
            id: "application.validation",
            registerItem({ item }) {
              calls.push(`register:${item.key}`);

              if (item.key === "server-84") {
                throw cause;
              }

              return () => {
                calls.push(`cleanup:${item.key}`);
              };
            }
          })
        ]
      })
    ).toThrowError(RepeatableFieldsetError);

    expect(calls).toEqual([
      "register:server-42",
      "register:server-84",
      "cleanup:server-42"
    ]);
    expect(markup.addButton.hidden).toBe(true);
    expect(markup.items.children).toHaveLength(2);

    const recovered = createRepeatableFieldset(markup.root);
    expect(recovered.getCount()).toBe(2);
    recovered.destroy();
  });

  it("rolls back an added item when validator registration fails", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const cause = new Error("new controls were rejected");
    const instance = createRepeatableFieldset(markup.root, {
      addons: [
        createValidationBridge({
          id: "application.validation",
          registerItem({ phase }) {
            if (phase === "added") {
              throw cause;
            }
          }
        })
      ]
    });
    const addedEvents = vi.fn();
    markup.root.addEventListener(EVENTS.itemAdded, addedEvents);

    expect(instance.add()).toMatchObject({
      ok: false,
      reason: "addon-error"
    });
    expect(instance.getCount()).toBe(1);
    expect(markup.items.children).toHaveLength(1);
    expect(addedEvents).not.toHaveBeenCalled();

    instance.destroy();
  });

  it("removes adapter errors and summary links before item detachment", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const summary = document.createElement("section");
    summary.setAttribute("aria-label", "Validation errors");
    markup.root.before(summary);
    const registeredControls = new Set<Element>();
    const cleanupStates: boolean[] = [];
    const bridge = createValidationBridge({
      id: "application.validation",
      registerItem({ item, phase }) {
        const input = item.element.querySelector<HTMLInputElement>("input");

        if (input === null) {
          throw new Error("Expected the item to contain a validation control.");
        }

        registeredControls.add(input);

        if (phase === "existing") {
          return () => {
            cleanupStates.push(item.element.isConnected);
            registeredControls.delete(input);
          };
        }

        const initialDescribedBy = input.getAttribute("aria-describedby");
        const error = document.createElement("p");
        error.id = `${input.id}-validation-error`;
        error.textContent = "Enter a contact name.";
        const link = document.createElement("a");
        link.href = `#${input.id}`;
        link.dataset["validationItemKey"] = item.key;
        link.textContent = "Contact name: Enter a contact name.";
        input.setAttribute("aria-invalid", "true");
        input.setAttribute(
          "aria-describedby",
          [initialDescribedBy, error.id].filter(Boolean).join(" ")
        );
        item.element.insertBefore(error, item.element.lastElementChild);
        summary.append(link);

        return () => {
          cleanupStates.push(item.element.isConnected);
          registeredControls.delete(input);
          link.remove();
          error.remove();
          input.removeAttribute("aria-invalid");

          if (initialDescribedBy === null) {
            input.removeAttribute("aria-describedby");
          } else {
            input.setAttribute("aria-describedby", initialDescribedBy);
          }
        };
      }
    });
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0,
      addons: [bridge]
    });
    const added = instance.add();

    expect(added.ok).toBe(true);

    if (!added.ok) {
      throw new Error("Expected Validation Bridge-backed Add to succeed.");
    }

    const addedInput = added.item.element.querySelector<HTMLInputElement>(
      "input"
    );
    const removedEventChecks: boolean[] = [];
    markup.root.addEventListener(EVENTS.itemRemoved, () => {
      removedEventChecks.push(
        !added.item.element.isConnected,
        summary.querySelector(`[data-validation-item-key="${added.item.key}"]`) ===
          null,
        added.item.element.querySelector("[id$='-validation-error']") === null
      );
    });

    expect(addedInput?.getAttribute("aria-invalid")).toBe("true");
    expect(summary.querySelectorAll("a")).toHaveLength(1);
    expect(instance.remove(added.item)).toMatchObject({ ok: true });
    expect(cleanupStates[0]).toBe(true);
    expect(registeredControls.has(addedInput!)).toBe(false);
    expect(summary.querySelectorAll("a")).toHaveLength(0);
    expect(removedEventChecks).toEqual([true, true, true]);

    instance.destroy();
    summary.remove();
  });

  it("aborts removal when validator cleanup fails", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const cause = new Error("validator cleanup failed");
    const removedEvents = vi.fn();
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0,
      addons: [
        createValidationBridge({
          id: "application.validation",
          registerItem() {
            return () => {
              throw cause;
            };
          }
        })
      ]
    });
    markup.root.addEventListener(EVENTS.itemRemoved, removedEvents);

    expect(instance.remove(markup.item)).toMatchObject({
      ok: false,
      reason: "addon-error",
      error: cause
    });
    expect(markup.item.parentElement).toBe(markup.items);
    expect(removedEvents).not.toHaveBeenCalled();

    expect(() => instance.destroy()).not.toThrow();
  });

  it("rejects duplicate bridge IDs before registering an item", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const registerItem = vi.fn();
    const first = createValidationBridge({
      id: "application.validation",
      registerItem
    });
    const second = createValidationBridge({
      id: "application.validation",
      registerItem
    });

    expect(() =>
      createRepeatableFieldset(markup.root, {
        addons: [first, second]
      })
    ).toThrowError(RepeatableFieldsetError);
    expect(registerItem).not.toHaveBeenCalled();
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
      resolve(
        process.cwd(),
        "docs/assets/a11y-repeatable-fieldset.js"
      ),
      "utf8"
    );
    const addonBundle = readFileSync(
      resolve(process.cwd(), "docs/assets/validation-bridge.js"),
      "utf8"
    );

    expect(mainEntry).not.toHaveProperty("createValidationBridge");
    expect(mainSource).not.toContain("validation-bridge");
    expect(coreBundle).not.toContain("createValidationBridge");
    expect(addonBundle).toContain("createValidationBridge");
    expect(packageJson.exports).toHaveProperty(
      "./addons/validation-bridge"
    );
    expect(packageJson.dependencies).toEqual({});
  });
});
