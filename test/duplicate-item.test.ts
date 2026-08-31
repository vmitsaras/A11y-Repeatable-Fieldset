import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

import * as mainEntry from "../src";
import {
  DUPLICATE_ITEM_ATTRIBUTES,
  createDuplicateItem,
  type DuplicateItemOptions
} from "../src/addons/duplicate-item";
import { EVENTS, RepeatableFieldsetError, createRepeatableFieldset } from "../src";
import { createTestRepeatableFieldsetMarkup } from "./helpers/create-markup";

function appendTarget(item: HTMLFieldSetElement): HTMLElement {
  const target = item.ownerDocument.createElement("div");
  target.setAttribute(DUPLICATE_ITEM_ATTRIBUTES.controls, "");
  item.append(target);
  return target;
}

function mark(control: Element, slot: string): void {
  control.setAttribute(DUPLICATE_ITEM_ATTRIBUTES.copy, slot);
}

function appendCheckbox(
  item: HTMLFieldSetElement,
  slot: string
): HTMLInputElement {
  const control = item.ownerDocument.createElement("input");
  control.type = "checkbox";
  control.name = `checkbox-${slot}`;
  mark(control, slot);
  item.append(control);
  return control;
}

function appendRadio(
  item: HTMLFieldSetElement,
  slot: string,
  value: string
): HTMLInputElement {
  const control = item.ownerDocument.createElement("input");
  control.type = "radio";
  control.name = `method-${item.getAttribute("data-a11y-repeatable-fieldset-key")}`;
  control.value = value;
  mark(control, slot);
  item.append(control);
  return control;
}

function appendSelect(
  item: HTMLFieldSetElement,
  slot: string,
  multiple: boolean
): HTMLSelectElement {
  const select = item.ownerDocument.createElement("select");
  select.multiple = multiple;
  mark(select, slot);

  for (const value of ["a", "b", "b", "c"]) {
    const option = item.ownerDocument.createElement("option");
    option.value = value;
    option.textContent = value.toUpperCase();
    select.append(option);
  }

  item.append(select);
  return select;
}

function prepareMarkup() {
  const markup = createTestRepeatableFieldsetMarkup(document);
  appendTarget(markup.item);
  appendTarget(markup.templateItem);
  mark(markup.input, "name");
  mark(markup.templateItem.querySelector("input")!, "name");

  const source = {
    checkbox: appendCheckbox(markup.item, "enabled"),
    radioA: appendRadio(markup.item, "method-a", "a"),
    radioB: appendRadio(markup.item, "method-b", "b"),
    single: appendSelect(markup.item, "single", false),
    multiple: appendSelect(markup.item, "multiple", true),
    textarea: document.createElement("textarea")
  };
  mark(source.textarea, "notes");
  markup.item.append(source.textarea);

  appendCheckbox(markup.templateItem, "enabled");
  appendRadio(markup.templateItem, "method-a", "a");
  appendRadio(markup.templateItem, "method-b", "b");
  appendSelect(markup.templateItem, "single", false);
  appendSelect(markup.templateItem, "multiple", true);
  const templateTextarea = document.createElement("textarea");
  templateTextarea.defaultValue = "Template notes";
  mark(templateTextarea, "notes");
  markup.templateItem.append(templateTextarea);

  return { markup, source };
}

function getDuplicateButton(item: HTMLFieldSetElement): HTMLButtonElement {
  const button = item.querySelector<HTMLButtonElement>(
    `[${DUPLICATE_ITEM_ATTRIBUTES.button}]`
  );

  if (button === null) {
    throw new Error("Expected a Duplicate button.");
  }

  return button;
}

describe("Duplicate Item addon", () => {
  it("copies explicitly marked current native-control state only", () => {
    const { markup, source } = prepareMarkup();
    markup.input.value = "Ada";
    markup.input.defaultValue = "Server name";
    markup.input.setAttribute("aria-invalid", "true");
    markup.input.setAttribute("aria-errormessage", "server-error");
    markup.input.setCustomValidity("Server validation state");
    source.checkbox.checked = true;
    source.checkbox.indeterminate = true;
    source.radioB.checked = true;
    source.single.value = "c";
    source.multiple.options[0]!.selected = true;
    source.multiple.options[2]!.selected = true;
    source.textarea.value = "Current notes";

    const hidden = document.createElement("input");
    hidden.type = "hidden";
    hidden.name = "server-id";
    hidden.value = "server-42";
    markup.item.append(hidden);
    const templateHidden = document.createElement("input");
    templateHidden.type = "hidden";
    templateHidden.name = "server-id";
    templateHidden.value = "";
    markup.templateItem.append(templateHidden);

    const duplicated = vi.fn();
    markup.root.addEventListener(EVENTS.itemDuplicated, duplicated);
    const instance = createRepeatableFieldset(markup.root, {
      addons: [createDuplicateItem()]
    });
    getDuplicateButton(markup.item).click();

    expect(instance.getCount()).toBe(2);
    expect(duplicated).toHaveBeenCalledTimes(1);
    const candidate = instance.getItems()[1]!.element;
    const controls = new Map(
      Array.from(
        candidate.querySelectorAll<Element>(
          `[${DUPLICATE_ITEM_ATTRIBUTES.copy}]`
        )
      ).map((control) => [
        control.getAttribute(DUPLICATE_ITEM_ATTRIBUTES.copy),
        control
      ])
    );
    const name = controls.get("name") as HTMLInputElement;
    const checkbox = controls.get("enabled") as HTMLInputElement;
    const radioA = controls.get("method-a") as HTMLInputElement;
    const radioB = controls.get("method-b") as HTMLInputElement;
    const single = controls.get("single") as HTMLSelectElement;
    const multiple = controls.get("multiple") as HTMLSelectElement;
    const textarea = controls.get("notes") as HTMLTextAreaElement;

    expect(name.value).toBe("Ada");
    expect(name.defaultValue).toBe("");
    expect(name.hasAttribute("aria-invalid")).toBe(false);
    expect(name.hasAttribute("aria-errormessage")).toBe(false);
    expect(name.validationMessage).toBe("");
    expect(checkbox.checked).toBe(true);
    expect(checkbox.indeterminate).toBe(false);
    expect(radioA.checked).toBe(false);
    expect(radioB.checked).toBe(true);
    expect(source.radioB.checked).toBe(true);
    expect(radioB.name).not.toBe(source.radioB.name);
    expect(single.value).toBe("c");
    expect(
      Array.from(multiple.options)
        .filter(({ selected }) => selected)
        .map(({ value }) => value)
    ).toEqual(["a", "b"]);
    expect(textarea.value).toBe("Current notes");
    expect(textarea.defaultValue).toBe("Template notes");
    expect(candidate.querySelector<HTMLInputElement>('input[type="hidden"]')?.value).toBe("");
    expect(document.activeElement).toBe(name);
  });

  it("keeps unmarked values at template defaults", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    appendTarget(markup.item);
    appendTarget(markup.templateItem);
    markup.input.value = "Live source";
    markup.templateItem.querySelector<HTMLInputElement>("input")!.defaultValue =
      "Trusted default";
    const instance = createRepeatableFieldset(markup.root, {
      addons: [createDuplicateItem()]
    });

    getDuplicateButton(markup.item).click();

    expect(instance.getItems()[1]?.element.querySelector<HTMLInputElement>("input")?.value).toBe(
      "Trusted default"
    );
  });

  it("synchronizes native disabled state with the core maximum", () => {
    const { markup } = prepareMarkup();
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 0,
      maximum: 2,
      addons: [createDuplicateItem()]
    });
    const sourceButton = getDuplicateButton(markup.item);

    expect(sourceButton.disabled).toBe(false);
    sourceButton.click();
    const duplicated = instance.getItems()[1]!;
    expect(sourceButton.disabled).toBe(true);
    expect(getDuplicateButton(duplicated.element).disabled).toBe(true);
    expect(sourceButton.hasAttribute("aria-disabled")).toBe(false);

    instance.remove(duplicated);
    expect(sourceButton.disabled).toBe(false);
  });

  it("rejects sensitive, disabled, readonly, hidden, file, and custom controls", () => {
    const variants = [
      "hidden",
      "file",
      "password",
      "payment",
      "disabled",
      "readonly",
      "custom"
    ] as const;

    for (const variant of variants) {
      const markup = createTestRepeatableFieldsetMarkup(document);
      appendTarget(markup.item);
      appendTarget(markup.templateItem);
      let control: HTMLElement;

      if (variant === "custom") {
        control = document.createElement("x-account-control");
      } else {
        const input = document.createElement("input");
        input.type = variant === "payment" || variant === "disabled" || variant === "readonly"
          ? "text"
          : variant;

        if (variant === "payment") {
          input.autocomplete = "cc-number";
        } else if (variant === "disabled") {
          input.disabled = true;
        } else if (variant === "readonly") {
          input.readOnly = true;
        }

        control = input;
      }

      mark(control, "unsafe");
      markup.item.append(control);

      expect(() =>
        createRepeatableFieldset(markup.root, {
          addons: [createDuplicateItem()]
        })
      ).toThrowError(RepeatableFieldsetError);
      markup.root.remove();
    }
  });

  it("fails transactionally when a marked source has no template match", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    appendTarget(markup.item);
    appendTarget(markup.templateItem);
    mark(markup.input, "missing-template-slot");
    const duplicated = vi.fn();
    markup.root.addEventListener(EVENTS.itemDuplicated, duplicated);
    const instance = createRepeatableFieldset(markup.root, {
      addons: [createDuplicateItem()]
    });

    getDuplicateButton(markup.item).click();

    expect(instance.getCount()).toBe(1);
    expect(duplicated).not.toHaveBeenCalled();
  });

  it("cleans generated controls on removal, destroy, and reinitialization", () => {
    const { markup } = prepareMarkup();
    const target = markup.item.querySelector<HTMLElement>(
      `[${DUPLICATE_ITEM_ATTRIBUTES.controls}]`
    )!;
    const first = createRepeatableFieldset(markup.root, {
      minimum: 0,
      addons: [createDuplicateItem()]
    });
    getDuplicateButton(markup.item).click();
    const duplicated = first.getItems()[1]!;
    const duplicatedTarget = duplicated.element.querySelector<HTMLElement>(
      `[${DUPLICATE_ITEM_ATTRIBUTES.controls}]`
    )!;

    first.remove(duplicated);
    expect(duplicatedTarget.childElementCount).toBe(0);
    first.destroy();
    expect(target.childElementCount).toBe(0);

    const second = createRepeatableFieldset(markup.root, {
      addons: [createDuplicateItem()]
    });
    expect(getDuplicateButton(markup.item)).toBeInstanceOf(HTMLButtonElement);
    second.destroy();
  });

  it("validates owned control targets and copy-slot uniqueness transactionally", () => {
    const variants = ["missing", "hidden", "nonempty", "legend", "live", "duplicate"] as const;

    for (const variant of variants) {
      const markup = createTestRepeatableFieldsetMarkup(document);
      const target = variant === "missing" ? null : appendTarget(markup.item);
      appendTarget(markup.templateItem);

      if (variant === "hidden") {
        target!.hidden = true;
      } else if (variant === "nonempty") {
        target!.textContent = "Author content";
      } else if (variant === "legend") {
        markup.item.querySelector("legend")?.append(target!);
      } else if (variant === "live") {
        const live = document.createElement("div");
        live.setAttribute("role", "status");
        target!.before(live);
        live.append(target!);
      } else if (variant === "duplicate") {
        appendTarget(markup.item);
      }

      expect(() =>
        createRepeatableFieldset(markup.root, {
          addons: [createDuplicateItem()]
        })
      ).toThrowError(RepeatableFieldsetError);
      markup.root.remove();
    }

    const duplicateSlot = createTestRepeatableFieldsetMarkup(document);
    appendTarget(duplicateSlot.item);
    appendTarget(duplicateSlot.templateItem);
    mark(duplicateSlot.input, "same");
    const second = document.createElement("textarea");
    mark(second, "same");
    duplicateSlot.item.append(second);

    expect(() =>
      createRepeatableFieldset(duplicateSlot.root, {
        addons: [createDuplicateItem()]
      })
    ).toThrowError(RepeatableFieldsetError);
  });

  it("creates its native control in the owning document realm", () => {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const frameDocument = frame.contentDocument;

    if (frameDocument === null) {
      throw new Error("Expected an iframe document for the realm test.");
    }

    const markup = createTestRepeatableFieldsetMarkup(frameDocument);
    appendTarget(markup.item);
    appendTarget(markup.templateItem);
    createRepeatableFieldset(markup.root, {
      addons: [createDuplicateItem()]
    });
    const button = getDuplicateButton(markup.item);

    expect(button.ownerDocument).toBe(frameDocument);
    expect(button.constructor).toBe(
      frameDocument.createElement("button").constructor
    );
    expect(button.type).toBe("button");
    expect(button.hasAttribute("tabindex")).toBe(false);
    frame.remove();
  });

  it("validates factory options and keeps the addon out of the main entry", () => {
    expect(() =>
      createDuplicateItem(null as unknown as DuplicateItemOptions)
    ).toThrowError("Duplicate Item: options must be an object.");
    expect(() =>
      createDuplicateItem({ buttonLabel: " " })
    ).toThrowError("Duplicate Item: buttonLabel must be a non-empty string.");
    expect(() =>
      createDuplicateItem({ unexpected: true } as unknown as DuplicateItemOptions)
    ).toThrowError('Duplicate Item: unknown option "unexpected".');

    const addon = createDuplicateItem({ buttonLabel: "Copy this contact" });
    const markup = createTestRepeatableFieldsetMarkup(document);
    appendTarget(markup.item);
    appendTarget(markup.templateItem);
    createRepeatableFieldset(markup.root, { addons: [addon] });
    expect(Object.isFrozen(addon)).toBe(true);
    expect(Object.isFrozen(DUPLICATE_ITEM_ATTRIBUTES)).toBe(true);
    expect(getDuplicateButton(markup.item).textContent).toBe("Copy this contact");

    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), "package.json"), "utf8")
    ) as { exports: Record<string, unknown>; dependencies: Record<string, unknown> };
    const mainSource = readFileSync(resolve(process.cwd(), "src/index.ts"), "utf8");
    const coreBundle = readFileSync(
      resolve(process.cwd(), "docs/assets/a11y-repeatable-fieldset.js"),
      "utf8"
    );
    const addonBundle = readFileSync(
      resolve(process.cwd(), "docs/assets/duplicate-item.js"),
      "utf8"
    );
    expect(mainEntry).not.toHaveProperty("createDuplicateItem");
    expect(mainSource).not.toContain("addons/duplicate-item");
    expect(coreBundle).not.toContain("createDuplicateItem");
    expect(addonBundle).toContain("createDuplicateItem");
    expect(packageJson.exports).toHaveProperty("./addons/duplicate-item");
    expect(packageJson.dependencies).toEqual({});
  });
});
