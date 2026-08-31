import { describe, expect, it, vi } from "vitest";

import { ATTRIBUTES, SELECTORS } from "../src/constants";
import {
  createRepeatableFieldset,
  RepeatableFieldsetError,
  type RepeatableFieldsetAddResult
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

function getPosition(
  item: HTMLFieldSetElement
): string | null {
  return item.querySelector(SELECTORS.position)?.textContent ?? null;
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
  result: RepeatableFieldsetAddResult,
  reason: string
): void {
  expect(result).toMatchObject({
    ok: false,
    reason
  });
  expect(Object.isFrozen(result)).toBe(true);
}

describe("Add command", () => {
  it("appends and returns one frozen materialized item snapshot", () => {
    const markup = createMarkup();
    const templateBefore = markup.template.innerHTML;
    const existingInput = markup.input;
    const existingName = markup.input.name;
    const existingId = markup.input.id;
    const instance = createRepeatableFieldset(markup.root);
    const result = instance.add();

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Expected Add to succeed.");
    }

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.item)).toBe(true);
    expect(result.item).toMatchObject({
      key: "item-1",
      index: 1,
      position: 2
    });
    expect(result.item.element.parentElement).toBe(markup.items);
    expect(result.item.element).toBe(markup.items.lastElementChild);
    expect(result.item.element.ownerDocument).toBe(
      markup.root.ownerDocument
    );
    expect(result.item.element.getAttribute(ATTRIBUTES.key)).toBe(
      "item-1"
    );
    expect(
      result.item.element.querySelector<HTMLInputElement>("input")?.id
    ).toBe("contact-item-1-name");
    expect(
      result.item.element.querySelector<HTMLInputElement>("input")
        ?.name
    ).toBe("contacts[item-1][name]");
    expect(
      result.item.element.querySelector(SELECTORS.focus)
    ).toBeNull();
    expect(getPosition(markup.item)).toBe("1");
    expect(getPosition(result.item.element)).toBe("2");
    expect(markup.template.innerHTML).toBe(templateBefore);
    expect(markup.item.querySelector("input")).toBe(existingInput);
    expect(markup.input.name).toBe(existingName);
    expect(markup.input.id).toBe(existingId);
  });

  it("preserves template defaults and leaves file inputs empty", () => {
    const markup = createMarkup();
    const textInput =
      markup.templateItem.querySelector<HTMLInputElement>(
        "input:not([type])"
      );

    if (textInput === null) {
      throw new Error("The template text input is missing.");
    }

    textInput.defaultValue = "Template default";
    textInput.value = "Template default";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "enabled[item]";
    checkbox.defaultChecked = true;

    const textarea = document.createElement("textarea");
    textarea.name = "notes[item]";
    textarea.defaultValue = "Default note";
    textarea.value = "Default note";

    const select = document.createElement("select");
    select.name = "kind[item]";
    const firstOption = document.createElement("option");
    firstOption.value = "first";
    firstOption.textContent = "First";
    const secondOption = document.createElement("option");
    secondOption.value = "second";
    secondOption.textContent = "Second";
    secondOption.defaultSelected = true;
    select.append(firstOption, secondOption);

    const file = document.createElement("input");
    file.type = "file";
    file.name = "attachment[item]";

    markup.templateItem.insertBefore(
      checkbox,
      markup.templateItem.lastElementChild
    );
    markup.templateItem.insertBefore(
      textarea,
      markup.templateItem.lastElementChild
    );
    markup.templateItem.insertBefore(
      select,
      markup.templateItem.lastElementChild
    );
    markup.templateItem.insertBefore(
      file,
      markup.templateItem.lastElementChild
    );

    const result = createRepeatableFieldset(markup.root).add();

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Expected Add to succeed.");
    }

    const added = result.item.element;
    expect(
      added.querySelector<HTMLInputElement>("input:not([type])")?.value
    ).toBe("Template default");
    expect(
      added.querySelector<HTMLInputElement>('input[type="checkbox"]')
        ?.checked
    ).toBe(true);
    expect(added.querySelector("textarea")?.value).toBe("Default note");
    expect(added.querySelector("select")?.value).toBe("second");
    expect(
      added.querySelector<HTMLInputElement>('input[type="file"]')?.value
    ).toBe("");
  });

  it("allocates monotonically and appends exactly once per call", () => {
    const markup = createMarkup();
    const append = vi.spyOn(markup.items, "append");
    const instance = createRepeatableFieldset(markup.root);
    const first = instance.add();
    const second = instance.add();

    expect(append).toHaveBeenCalledTimes(2);
    expect(getItems(markup)).toHaveLength(3);
    expect(first).toMatchObject({
      ok: true,
      item: {
        key: "item-1",
        index: 1,
        position: 2
      }
    });
    expect(second).toMatchObject({
      ok: true,
      item: {
        key: "item-2",
        index: 2,
        position: 3
      }
    });
    expect(getItems(markup).map(getPosition)).toEqual(["1", "2", "3"]);
  });

  it("clones before allocating and inserts only after materialization", () => {
    const markup = createMarkup();
    const order: string[] = [];
    const nativeClone =
      markup.templateItem.cloneNode.bind(markup.templateItem);
    vi.spyOn(markup.templateItem, "cloneNode").mockImplementation(
      (deep?: boolean) => {
        order.push("clone");
        return nativeClone(deep);
      }
    );
    const nativeAppend = markup.items.append.bind(markup.items);
    vi.spyOn(markup.items, "append").mockImplementation(
      (...nodes: (Node | string)[]) => {
        const candidate = nodes[0];
        order.push(
          candidate instanceof HTMLFieldSetElement &&
            candidate.getAttribute(ATTRIBUTES.key) === "ordered-key"
            ? "append-materialized"
            : "append-invalid"
        );
        nativeAppend(...nodes);
      }
    );
    const instance = createRepeatableFieldset(markup.root, {
      keyFactory: () => {
        order.push("allocate");
        return "ordered-key";
      }
    });

    const result = instance.add();

    expect(result.ok).toBe(true);
    expect(order).toEqual([
      "clone",
      "allocate",
      "append-materialized"
    ]);
  });

  it("blocks at maximum before cloning or allocating", () => {
    const markup = createMarkup();
    const keyFactory = vi.fn(() => "unused-key");
    markup.root.setAttribute(ATTRIBUTES.maximum, "1");
    const templateBefore = markup.template.innerHTML;
    const instance = createRepeatableFieldset(markup.root, {
      keyFactory
    });
    const result = instance.add();

    expectFailure(result, "maximum");
    expect(getItems(markup)).toEqual([markup.item]);
    expect(markup.template.innerHTML).toBe(templateBefore);
    expect(keyFactory).not.toHaveBeenCalled();

    markup.addButton.click();
    expect(getItems(markup)).toEqual([markup.item]);
    expect(keyFactory).not.toHaveBeenCalled();
  });

  it("maps invalid and duplicate generated keys without insertion", () => {
    const invalidMarkup = createMarkup();
    const invalid = createRepeatableFieldset(invalidMarkup.root, {
      keyFactory: () => "-invalid"
    }).add();

    expectFailure(invalid, "invalid-key");
    expect(getItems(invalidMarkup)).toEqual([invalidMarkup.item]);

    const duplicateMarkup = createMarkup();
    rekeyMarkup(duplicateMarkup, "server-84");
    const duplicate = createRepeatableFieldset(duplicateMarkup.root, {
      keyFactory: () => "server-84"
    }).add();

    expectFailure(duplicate, "duplicate-key");
    expect(getItems(duplicateMarkup)).toEqual([
      duplicateMarkup.item
    ]);
  });

  it("maps stale template failures and never reuses their allocated keys", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root);
    const legend = markup.templateItem.querySelector("legend");

    if (legend === null) {
      throw new Error("The template legend is missing.");
    }

    legend.remove();
    const failed = instance.add();

    expectFailure(failed, "invalid-template");
    expect(getItems(markup)).toEqual([markup.item]);

    markup.templateItem.prepend(legend);
    const recovered = instance.add();

    expect(recovered).toMatchObject({
      ok: true,
      item: {
        key: "item-2",
        index: 1,
        position: 2
      }
    });
  });

  it("rolls back registry, DOM, and positions after insertion failure", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root);
    const existingMarker =
      markup.item.querySelector<HTMLElement>(SELECTORS.position);

    if (existingMarker === null) {
      throw new Error("The existing position marker is missing.");
    }

    existingMarker.textContent = "Existing original";
    const nativeAppend = markup.items.append.bind(markup.items);
    const failure = new Error("Position write failed.");
    const append = vi
      .spyOn(markup.items, "append")
      .mockImplementation((...nodes: (Node | string)[]) => {
        const candidate = nodes[0];

        if (
          candidate instanceof HTMLFieldSetElement
        ) {
          const marker =
            candidate.querySelector<HTMLElement>(SELECTORS.position);

          if (marker !== null) {
            Object.defineProperty(marker, "textContent", {
              configurable: true,
              get() {
                return "";
              },
              set() {
                throw failure;
              }
            });
          }
        }

        nativeAppend(...nodes);
      });

    const failed = instance.add();

    expectFailure(failed, "invalid-template");
    expect(failed).toMatchObject({
      error: {
        code: "invalid-item",
        cause: failure
      }
    });
    expect(getItems(markup)).toEqual([markup.item]);
    expect(existingMarker.textContent).toBe("Existing original");

    append.mockRestore();
    const recovered = instance.add();

    expect(recovered).toMatchObject({
      ok: true,
      item: {
        key: "item-2",
        index: 1,
        position: 2
      }
    });
  });

  it("rolls back when append mutates and then throws", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root);
    const nativeAppend = markup.items.append.bind(markup.items);
    vi.spyOn(markup.items, "append").mockImplementation(
      (...nodes: (Node | string)[]) => {
        nativeAppend(...nodes);
        throw new Error("Append failed after mutation.");
      }
    );

    const result = instance.add();

    expectFailure(result, "invalid-template");
    expect(getItems(markup)).toEqual([markup.item]);
    expect(getPosition(markup.item)).toBe("1");
  });

  it("routes owned Add-button activation but ignores nested-root controls", () => {
    const parent = createMarkup();
    const nested = createMarkup();
    rekeyMarkup(nested, "nested-1");
    parent.item.append(nested.root);
    const instance = createRepeatableFieldset(parent.root);

    nested.addButton.click();
    expect(getItems(parent)).toEqual([parent.item]);

    parent.addButton.click();
    expect(getItems(parent)).toHaveLength(2);

    const apiResult = instance.add();
    expect(apiResult.ok).toBe(true);
    expect(getItems(parent)).toHaveLength(3);
  });

  it("does not duplicate the Add listener when an instance is reused", () => {
    const markup = createMarkup();
    const first = createRepeatableFieldset(markup.root);
    const second = createRepeatableFieldset(markup.root);

    expect(second).toBe(first);

    markup.addButton.click();
    expect(getItems(markup)).toHaveLength(2);
  });

  it("handles an owned control in a document without a window realm", () => {
    const ownerDocument =
      document.implementation.createHTMLDocument("Detached");
    const markup =
      createTestRepeatableFieldsetMarkup(ownerDocument);
    const instance = createRepeatableFieldset(markup.root);

    expect(ownerDocument.defaultView).toBeNull();

    markup.addButton.click();
    expect(getItems(markup)).toHaveLength(2);
    expect(instance.add()).toMatchObject({
      ok: true,
      item: {
        index: 2,
        position: 3
      }
    });
  });

  it("reveals and synchronizes enhancement controls", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root);
    const result = instance.add();

    expect(markup.addButton.hidden).toBe(false);
    expect(markup.addButton.disabled).toBe(false);
    expect(markup.removeButton.hidden).toBe(false);
    expect(markup.removeButton.disabled).toBe(false);
    expect(result.ok).toBe(true);

    if (result.ok) {
      const removeButton =
        result.item.element.querySelector<HTMLButtonElement>(
          SELECTORS.remove
        );

      expect(removeButton?.hidden).toBe(false);
      expect(removeButton?.disabled).toBe(false);
    }
  });

  it("does not move unrelated focus for an API addition", () => {
    const markup = createMarkup();
    const outside = document.createElement("button");
    outside.type = "button";
    outside.textContent = "Outside";
    document.body.prepend(outside);
    outside.focus();

    const result = createRepeatableFieldset(markup.root).add();

    expect(result.ok).toBe(true);
    expect(document.activeElement).toBe(outside);
  });

  it("returns inactive and removes its control listener after destroy", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root);
    instance.destroy();

    const result = instance.add();
    expectFailure(result, "inactive");

    markup.addButton.click();
    expect(getItems(markup)).toEqual([markup.item]);
  });

  it("preserves added values for clean reinitialization", () => {
    const markup = createMarkup();
    const first = createRepeatableFieldset(markup.root);
    const added = first.add();

    if (!added.ok) {
      throw new Error("Expected Add to succeed.");
    }

    const input =
      added.item.element.querySelector<HTMLInputElement>("input");

    if (input === null) {
      throw new Error("The added text input is missing.");
    }

    input.value = "User-entered value";
    first.destroy();

    const replacement = createRepeatableFieldset(markup.root);

    expect(replacement).not.toBe(first);
    expect(getItems(markup)).toHaveLength(2);
    expect(input.value).toBe("User-entered value");
    expect(added.item.element.getAttribute(ATTRIBUTES.key)).toBe(
      "item-1"
    );
    expect(replacement.add()).toMatchObject({
      ok: true,
      item: {
        key: "item-2",
        index: 2,
        position: 3
      }
    });
  });

  it("rejects undocumented operation settings with a typed error", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root);
    let thrown: unknown;

    try {
      instance.add({
        unsupported: true
      } as never);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(RepeatableFieldsetError);
    expect(thrown).toMatchObject({
      code: "invalid-options",
      root: markup.root
    });
    expect(getItems(markup)).toEqual([markup.item]);
  });
});
