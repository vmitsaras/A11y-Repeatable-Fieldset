import { describe, expect, it, vi } from "vitest";

import {
  EVENTS,
  createRepeatableFieldset,
  type RepeatableFieldsetAddon
} from "../src";
import { createTestRepeatableFieldsetMarkup } from "./helpers/create-markup";

describe("Duplicate command", () => {
  it("copies while disconnected before addon setup and stabilizes a distinct event", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    markup.input.value = "Current source value";
    markup.templateItem.querySelector<HTMLInputElement>("input")!.defaultValue =
      "Template default";
    const sequence: string[] = [];
    const itemAdded = vi.fn();
    const itemDuplicated = vi.fn();
    const observer = Object.freeze({
      id: "test.observe-duplicate",
      setupItem({ item, phase }) {
        if (phase === "added") {
          sequence.push(
            `setup:${item.element.querySelector<HTMLInputElement>("input")?.value}`
          );
        }
      }
    } satisfies RepeatableFieldsetAddon);
    markup.root.addEventListener(EVENTS.itemAdded, itemAdded);
    markup.root.addEventListener(EVENTS.itemDuplicated, (event) => {
      sequence.push(
        `event:${(event as CustomEvent).detail.item.element.querySelector("input").value}`
      );
      itemDuplicated(event);
    });
    const instance = createRepeatableFieldset(markup.root, {
      itemLabel: "Contact",
      addons: [observer]
    });
    const result = instance.duplicate(markup.item, {
      focus: true,
      copyState({ sourceItem, candidate }) {
        sequence.push(`copy:${candidate.isConnected}`);
        candidate.querySelector<HTMLInputElement>("input")!.value =
          sourceItem.element.querySelector<HTMLInputElement>("input")!.value;
      }
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Expected Duplicate to succeed.");
    }

    const input = result.item.element.querySelector<HTMLInputElement>("input")!;
    expect(sequence).toEqual([
      "copy:false",
      "setup:Current source value",
      "event:Current source value"
    ]);
    expect(input.value).toBe("Current source value");
    expect(input.defaultValue).toBe("Template default");
    expect(document.activeElement).toBe(input);
    expect(instance.getItems().map(({ key }) => key)).toEqual([
      "server-42",
      "item-1"
    ]);
    expect(itemAdded).not.toHaveBeenCalled();
    expect(itemDuplicated).toHaveBeenCalledTimes(1);
    const event = itemDuplicated.mock.calls[0]?.[0] as CustomEvent;
    expect(event.target).toBe(markup.root);
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(false);
    expect(event.cancelable).toBe(false);
    expect(event.detail).toMatchObject({
      key: "item-1",
      index: 1,
      position: 2,
      sourceKey: "server-42",
      sourceIndex: 0,
      sourcePosition: 1,
      count: 2,
      focusTarget: input
    });
    expect(markup.root.querySelector("[role=status]")?.textContent).toBe(
      "Contact 1 duplicated as position 2. 2 items total."
    );
  });

  it("inserts immediately after the current source without changing stable identity", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const instance = createRepeatableFieldset(markup.root);
    const later = instance.add();

    if (!later.ok) {
      throw new Error("Expected Add to succeed.");
    }

    const result = instance.duplicate("server-42");

    expect(result.ok).toBe(true);
    expect(instance.getItems().map(({ key }) => key)).toEqual([
      "server-42",
      "item-2",
      "item-1"
    ]);
    expect(markup.input.name).toBe("contacts[server-42][name]");
    expect(later.item.element.querySelector("input")?.getAttribute("name")).toBe(
      "contacts[item-1][name]"
    );
  });

  it("uses template defaults when no copier is supplied and does not move unrelated focus", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    markup.input.value = "Live value";
    markup.templateItem.querySelector<HTMLInputElement>("input")!.defaultValue =
      "Template value";
    markup.addButton.focus();
    const result = createRepeatableFieldset(markup.root).duplicate(markup.item);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Expected Duplicate to succeed.");
    }

    expect(result.item.element.querySelector<HTMLInputElement>("input")?.value).toBe(
      "Template value"
    );
    expect(document.activeElement).toBe(markup.addButton);
  });

  it("rejects structural mutation and asynchronous copying transactionally", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const duplicated = vi.fn();
    markup.root.addEventListener(EVENTS.itemDuplicated, duplicated);
    const instance = createRepeatableFieldset(markup.root);

    expect(
      instance.duplicate(markup.item, {
        copyState({ candidate }) {
          candidate.setAttribute("data-invalid-mutation", "");
        }
      })
    ).toMatchObject({ ok: false, reason: "copy-error" });
    expect(instance.getCount()).toBe(1);
    expect(duplicated).not.toHaveBeenCalled();

    expect(
      instance.duplicate(markup.item, {
        copyState: (async () => undefined) as () => void
      })
    ).toMatchObject({ ok: false, reason: "copy-error" });

    const recovered = instance.duplicate(markup.item);
    expect(recovered).toMatchObject({
      ok: true,
      item: { key: "item-3" }
    });
  });

  it("blocks structural-command reentry during copying", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const instance = createRepeatableFieldset(markup.root);

    expect(
      instance.duplicate(markup.item, {
        copyState() {
          instance.add();
        }
      })
    ).toMatchObject({ ok: false, reason: "copy-error" });
    expect(instance.getCount()).toBe(1);
  });

  it("returns typed blocked results and validates its public options", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const instance = createRepeatableFieldset(markup.root, { maximum: 1 });
    const foreign = document.createElement("fieldset");

    expect(instance.duplicate(foreign)).toEqual({
      ok: false,
      reason: "unowned-item"
    });
    expect(instance.duplicate(markup.item)).toEqual({
      ok: false,
      reason: "maximum"
    });
    expect(() =>
      instance.duplicate(markup.item, { focus: "yes" } as never)
    ).toThrowError(/Duplicate options/);
    expect(() =>
      instance.duplicate(markup.item, { copyState: true } as never)
    ).toThrowError(/Duplicate options/);

    instance.destroy();
    expect(instance.duplicate("server-42")).toEqual({
      ok: false,
      reason: "inactive"
    });
  });

  it("reports addon setup failure after copied state and rolls the item back", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    let copiedValue = "";
    const failingAddon = Object.freeze({
      id: "test.fail-duplicate-setup",
      setupItem({ item, phase }) {
        if (phase === "added") {
          copiedValue = item.element.querySelector<HTMLInputElement>("input")!.value;
          throw new Error("setup failed");
        }
      }
    } satisfies RepeatableFieldsetAddon);
    const instance = createRepeatableFieldset(markup.root, {
      addons: [failingAddon]
    });

    expect(
      instance.duplicate(markup.item, {
        copyState({ candidate }) {
          candidate.querySelector<HTMLInputElement>("input")!.value = "copied";
        }
      })
    ).toMatchObject({ ok: false, reason: "addon-error" });
    expect(copiedValue).toBe("copied");
    expect(instance.getCount()).toBe(1);
    expect(markup.items.children).toHaveLength(1);
  });

  it("identifies duplicate allocation requests for custom key factories", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const sources: string[] = [];
    const instance = createRepeatableFieldset(markup.root, {
      keyFactory(context) {
        sources.push(context.source);
        return `generated-${context.sequence}`;
      }
    });

    expect(instance.duplicate(markup.item)).toMatchObject({
      ok: true,
      item: { key: "generated-1" }
    });
    expect(sources).toEqual(["duplicate"]);
  });
});
