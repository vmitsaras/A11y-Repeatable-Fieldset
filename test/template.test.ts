import { describe, expect, it } from "vitest";

import {
  ATTRIBUTES,
  TEMPLATE_KEY_TOKEN
} from "../src/constants";
import { discoverRepeatableFieldsetMarkup } from "../src/discovery";
import { RepeatableFieldsetError } from "../src/errors";
import {
  materializeDiscoveredRepeatableFieldsetTemplate,
  materializeRepeatableFieldsetTemplate
} from "../src/template";
import {
  createTestRepeatableFieldsetMarkup,
  type TestRepeatableFieldsetMarkup
} from "./helpers/create-markup";

function createMarkup(): TestRepeatableFieldsetMarkup {
  return createTestRepeatableFieldsetMarkup(document);
}

function findById(item: HTMLFieldSetElement, id: string): Element | null {
  return [item, ...item.querySelectorAll<Element>("*")].find(
    (element) => element.id === id
  ) ?? null;
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

function addComplexReferences(
  markup: TestRepeatableFieldsetMarkup
): void {
  const templateItem = markup.templateItem;
  const input =
    templateItem.querySelector<HTMLInputElement>("input:not([type])");

  if (input === null) {
    throw new Error("The template fixture has no text input.");
  }

  const externalLabel = document.createElement("span");
  externalLabel.id = "external-label";
  externalLabel.textContent = "External label";
  document.body.prepend(externalLabel);

  const localLabel = document.createElement("span");
  localLabel.id = `label-${TEMPLATE_KEY_TOKEN}`;
  localLabel.textContent = "Local label";

  const description = document.createElement("p");
  description.id = `description-${TEMPLATE_KEY_TOKEN}`;
  description.textContent = "Local description";

  const panel = document.createElement("div");
  panel.id = `panel-${TEMPLATE_KEY_TOKEN}`;
  panel.textContent = "Controlled panel";

  const datalist = document.createElement("datalist");
  datalist.id = `cities-${TEMPLATE_KEY_TOKEN}`;
  const option = document.createElement("option");
  option.value = "Athens";
  datalist.append(option);

  input.setAttribute(
    "aria-labelledby",
    ` external-label\tlabel-${TEMPLATE_KEY_TOKEN} `
  );
  input.setAttribute(
    "aria-describedby",
    `external-description\n description-${TEMPLATE_KEY_TOKEN}`
  );
  input.setAttribute(
    "aria-controls",
    `panel-${TEMPLATE_KEY_TOKEN}`
  );
  input.setAttribute("list", `cities-${TEMPLATE_KEY_TOKEN}`);

  const anchor = document.createElement("a");
  anchor.href = `#panel-${TEMPLATE_KEY_TOKEN}`;
  anchor.textContent = "Jump to panel";

  const table = document.createElement("table");
  const row = document.createElement("tr");
  const header = document.createElement("th");
  const cell = document.createElement("td");
  header.id = `header-${TEMPLATE_KEY_TOKEN}`;
  header.textContent = "Preference";
  cell.setAttribute("headers", `header-${TEMPLATE_KEY_TOKEN}`);
  cell.textContent = "Email";
  row.append(header, cell);
  table.append(row);

  const firstRadio = document.createElement("input");
  firstRadio.type = "radio";
  firstRadio.name =
    `contacts[${TEMPLATE_KEY_TOKEN}][preferred-method]`;
  firstRadio.value = "email";
  firstRadio.defaultChecked = true;

  const secondRadio = document.createElement("input");
  secondRadio.type = "radio";
  secondRadio.name =
    `contacts[${TEMPLATE_KEY_TOKEN}][preferred-method]`;
  secondRadio.value = "phone";

  templateItem.insertBefore(localLabel, markup.templateItem.lastChild);
  templateItem.insertBefore(description, markup.templateItem.lastChild);
  templateItem.insertBefore(panel, markup.templateItem.lastChild);
  templateItem.insertBefore(datalist, markup.templateItem.lastChild);
  templateItem.insertBefore(anchor, markup.templateItem.lastChild);
  templateItem.insertBefore(table, markup.templateItem.lastChild);
  templateItem.insertBefore(firstRadio, markup.templateItem.lastChild);
  templateItem.insertBefore(secondRadio, markup.templateItem.lastChild);
}

describe("template token materialization", () => {
  it("replaces every supported attribute and preserves relationships", () => {
    const markup = createMarkup();
    addComplexReferences(markup);
    const rootBefore = markup.root.outerHTML;
    const templateBefore = markup.template.innerHTML;
    const discovered = discoverRepeatableFieldsetMarkup(markup.root);
    const materialized =
      materializeDiscoveredRepeatableFieldsetTemplate(
        discovered,
        "item-7"
      );
    const item = materialized.item;
    const input = item.querySelector<HTMLInputElement>("input:not([type])");
    const label = item.querySelector<HTMLLabelElement>("label");
    const radios = item.querySelectorAll<HTMLInputElement>(
      'input[type="radio"]'
    );
    const cell = item.querySelector<HTMLTableCellElement>("td");
    const anchor = item.querySelector<HTMLAnchorElement>("a");

    expect(item.isConnected).toBe(false);
    expect(item.ownerDocument).toBe(document);
    expect(item.getAttribute(ATTRIBUTES.key)).toBe("item-7");
    expect(materialized.key).toBe("item-7");
    expect(materialized.legend.parentElement).toBe(item);
    expect(materialized.removeButton.hidden).toBe(true);
    expect(materialized.focusTarget).toBe(input);

    expect(input?.id).toBe("contact-item-7-name");
    expect(input?.name).toBe("contacts[item-7][name]");
    expect(label?.htmlFor).toBe("contact-item-7-name");
    expect(input?.getAttribute("list")).toBe("cities-item-7");
    expect(input?.getAttribute("aria-labelledby")).toBe(
      "external-label label-item-7"
    );
    expect(input?.getAttribute("aria-describedby")).toBe(
      "external-description description-item-7"
    );
    expect(input?.getAttribute("aria-controls")).toBe("panel-item-7");
    expect(findById(item, "label-item-7")).not.toBeNull();
    expect(findById(item, "description-item-7")).not.toBeNull();
    expect(findById(item, "panel-item-7")).not.toBeNull();
    expect(findById(item, "cities-item-7")).not.toBeNull();
    expect(cell?.getAttribute("headers")).toBe("header-item-7");
    expect(findById(item, "header-item-7")).not.toBeNull();
    expect(anchor?.getAttribute("href")).toBe("#panel-item-7");

    expect(Array.from(radios, ({ name }) => name)).toEqual([
      "contacts[item-7][preferred-method]",
      "contacts[item-7][preferred-method]"
    ]);
    expect(radios[0]?.value).toBe("email");
    expect(radios[0]?.defaultChecked).toBe(true);
    expect(radios[1]?.value).toBe("phone");

    expect(markup.root.outerHTML).toBe(rootBefore);
    expect(markup.template.innerHTML).toBe(templateBefore);
    expect(markup.templateItem.isConnected).toBe(false);
  });

  it("assigns the materialized key when the template item omits it", () => {
    const markup = createMarkup();
    markup.templateItem.removeAttribute(ATTRIBUTES.key);
    const discovered = discoverRepeatableFieldsetMarkup(markup.root);
    const materialized =
      materializeDiscoveredRepeatableFieldsetTemplate(
        discovered,
        "item-12"
      );

    expect(materialized.item.getAttribute(ATTRIBUTES.key)).toBe(
      "item-12"
    );
    expect(markup.templateItem.hasAttribute(ATTRIBUTES.key)).toBe(false);
  });

  it("leaves text and unsupported attributes completely untouched", () => {
    const markup = createMarkup();
    const input =
      markup.templateItem.querySelector<HTMLInputElement>(
        "input:not([type])"
      );
    const unsupported = document.createElement("div");
    const remoteAnchor = document.createElement("a");

    if (input === null) {
      throw new Error("The template fixture has no text input.");
    }

    unsupported.textContent = `Text ${TEMPLATE_KEY_TOKEN}`;
    unsupported.className = `class-${TEMPLATE_KEY_TOKEN}`;
    unsupported.setAttribute(
      "data-example",
      `data-${TEMPLATE_KEY_TOKEN}`
    );
    unsupported.setAttribute(
      "aria-label",
      `label-${TEMPLATE_KEY_TOKEN}`
    );
    unsupported.setAttribute(
      "style",
      `--example: "${TEMPLATE_KEY_TOKEN}"`
    );
    input.placeholder = `Placeholder ${TEMPLATE_KEY_TOKEN}`;
    input.defaultValue = `Value ${TEMPLATE_KEY_TOKEN}`;
    remoteAnchor.setAttribute(
      "href",
      `/another-page#${TEMPLATE_KEY_TOKEN}`
    );
    remoteAnchor.textContent = `Remote ${TEMPLATE_KEY_TOKEN}`;
    markup.templateItem.insertBefore(
      unsupported,
      markup.templateItem.lastChild
    );
    markup.templateItem.insertBefore(
      remoteAnchor,
      markup.templateItem.lastChild
    );

    const materialized =
      materializeDiscoveredRepeatableFieldsetTemplate(
        discoverRepeatableFieldsetMarkup(markup.root),
        "item-3"
      );
    const clonedUnsupported =
      materialized.item.querySelector<HTMLDivElement>("[data-example]");
    const clonedInput =
      materialized.item.querySelector<HTMLInputElement>(
        "input:not([type])"
      );
    const clonedRemoteAnchor =
      materialized.item.querySelector<HTMLAnchorElement>("a");

    expect(clonedUnsupported?.textContent).toBe(
      `Text ${TEMPLATE_KEY_TOKEN}`
    );
    expect(clonedUnsupported?.className).toBe(
      `class-${TEMPLATE_KEY_TOKEN}`
    );
    expect(clonedUnsupported?.getAttribute("data-example")).toBe(
      `data-${TEMPLATE_KEY_TOKEN}`
    );
    expect(clonedUnsupported?.getAttribute("aria-label")).toBe(
      `label-${TEMPLATE_KEY_TOKEN}`
    );
    expect(clonedUnsupported?.getAttribute("style")).toContain(
      TEMPLATE_KEY_TOKEN
    );
    expect(clonedInput?.placeholder).toBe(
      `Placeholder ${TEMPLATE_KEY_TOKEN}`
    );
    expect(clonedInput?.defaultValue).toBe(
      `Value ${TEMPLATE_KEY_TOKEN}`
    );
    expect(clonedRemoteAnchor?.getAttribute("href")).toBe(
      `/another-page#${TEMPLATE_KEY_TOKEN}`
    );
    expect(clonedRemoteAnchor?.textContent).toBe(
      `Remote ${TEMPLATE_KEY_TOKEN}`
    );
  });

  it("preserves template defaults and never copies a live item", () => {
    const markup = createMarkup();
    const templateText =
      markup.templateItem.querySelector<HTMLInputElement>(
        "input:not([type])"
      );

    if (templateText === null) {
      throw new Error("The template fixture has no text input.");
    }

    markup.input.value = "Live user secret";
    templateText.defaultValue = "Template default";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = `enabled[${TEMPLATE_KEY_TOKEN}]`;
    checkbox.defaultChecked = true;

    const textarea = document.createElement("textarea");
    textarea.name = `notes[${TEMPLATE_KEY_TOKEN}]`;
    textarea.defaultValue = "Default notes";

    const select = document.createElement("select");
    select.name = `kind[${TEMPLATE_KEY_TOKEN}]`;
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
    file.name = `attachment[${TEMPLATE_KEY_TOKEN}]`;

    markup.templateItem.insertBefore(
      checkbox,
      markup.templateItem.lastChild
    );
    markup.templateItem.insertBefore(
      textarea,
      markup.templateItem.lastChild
    );
    markup.templateItem.insertBefore(
      select,
      markup.templateItem.lastChild
    );
    markup.templateItem.insertBefore(file, markup.templateItem.lastChild);

    const materialized =
      materializeDiscoveredRepeatableFieldsetTemplate(
        discoverRepeatableFieldsetMarkup(markup.root),
        "item-4"
      );
    const clonedText =
      materialized.item.querySelector<HTMLInputElement>(
        "input:not([type])"
      );
    const clonedCheckbox =
      materialized.item.querySelector<HTMLInputElement>(
        'input[type="checkbox"]'
      );
    const clonedTextarea =
      materialized.item.querySelector<HTMLTextAreaElement>("textarea");
    const clonedSelect =
      materialized.item.querySelector<HTMLSelectElement>("select");
    const clonedFile =
      materialized.item.querySelector<HTMLInputElement>(
        'input[type="file"]'
      );

    expect(clonedText?.value).toBe("Template default");
    expect(clonedText?.value).not.toBe(markup.input.value);
    expect(clonedCheckbox?.checked).toBe(true);
    expect(clonedCheckbox?.defaultChecked).toBe(true);
    expect(clonedCheckbox?.name).toBe("enabled[item-4]");
    expect(clonedTextarea?.value).toBe("Default notes");
    expect(clonedTextarea?.name).toBe("notes[item-4]");
    expect(clonedSelect?.value).toBe("second");
    expect(clonedSelect?.name).toBe("kind[item-4]");
    expect(clonedFile?.value).toBe("");
    expect(clonedFile?.name).toBe("attachment[item-4]");
  });

  it("rejects IDs that converge after replacement", () => {
    const markup = createMarkup();
    const collision = document.createElement("div");
    collision.id = "contact-item-9-name";
    markup.templateItem.insertBefore(
      collision,
      markup.templateItem.lastChild
    );
    const discovered = discoverRepeatableFieldsetMarkup(markup.root);
    const error = captureError(() =>
      materializeDiscoveredRepeatableFieldsetTemplate(
        discovered,
        "item-9"
      )
    );

    expect(error).toMatchObject({
      code: "duplicate-id",
      root: markup.root
    });
    expect(collision.isConnected).toBe(false);
  });

  it("rejects generated IDs that collide with the owner document", () => {
    const markup = createMarkup();
    const collision = document.createElement("div");
    collision.id = "contact-item-9-name";
    document.body.prepend(collision);
    const discovered = discoverRepeatableFieldsetMarkup(markup.root);
    const error = captureError(() =>
      materializeDiscoveredRepeatableFieldsetTemplate(
        discovered,
        "item-9"
      )
    );

    expect(error).toMatchObject({
      code: "duplicate-id",
      root: markup.root
    });
    expect(markup.items.children).toHaveLength(1);
  });

  it("requires every tokenized local reference to resolve in the clone", () => {
    const markup = createMarkup();
    const input =
      markup.templateItem.querySelector<HTMLInputElement>(
        "input:not([type])"
      );

    input?.setAttribute(
      "aria-describedby",
      `external-description missing-${TEMPLATE_KEY_TOKEN}`
    );
    const discovered = discoverRepeatableFieldsetMarkup(markup.root);
    const error = captureError(() =>
      materializeDiscoveredRepeatableFieldsetTemplate(
        discovered,
        "item-2"
      )
    );

    expect(error).toMatchObject({
      code: "invalid-template",
      root: markup.root
    });
    expect(input?.getAttribute("aria-describedby")).toContain(
      TEMPLATE_KEY_TOKEN
    );
  });

  it("allows unresolved untokenized external references", () => {
    const markup = createMarkup();
    const input =
      markup.templateItem.querySelector<HTMLInputElement>(
        "input:not([type])"
      );
    const description = document.createElement("p");
    description.id = `description-${TEMPLATE_KEY_TOKEN}`;
    description.textContent = "Description";
    input?.setAttribute(
      "aria-describedby",
      `external-missing description-${TEMPLATE_KEY_TOKEN}`
    );
    markup.templateItem.insertBefore(
      description,
      markup.templateItem.lastChild
    );

    const materialized =
      materializeDiscoveredRepeatableFieldsetTemplate(
        discoverRepeatableFieldsetMarkup(markup.root),
        "item-6"
      );
    const clonedInput =
      materialized.item.querySelector<HTMLInputElement>(
        "input:not([type])"
      );

    expect(clonedInput?.getAttribute("aria-describedby")).toBe(
      "external-missing description-item-6"
    );
  });

  it("rejects invalid keys and supported residual tokens", () => {
    const invalid = createMarkup();
    const invalidDiscovered =
      discoverRepeatableFieldsetMarkup(invalid.root);

    expect(
      captureError(() =>
        materializeDiscoveredRepeatableFieldsetTemplate(
          invalidDiscovered,
          "-invalid"
        )
      )
    ).toMatchObject({
      code: "invalid-key",
      root: invalid.root,
      element: invalid.templateItem
    });

    document.body.replaceChildren();
    const residual = createMarkup();
    const residualDiscovered =
      discoverRepeatableFieldsetMarkup(residual.root);
    const error = captureError(() =>
      materializeDiscoveredRepeatableFieldsetTemplate(
        residualDiscovered,
        `item-${TEMPLATE_KEY_TOKEN}`
      )
    );

    expect(error).toMatchObject({
      code: "unresolved-template-token",
      root: residual.root
    });
  });

  it("revalidates stale template structure before returning a candidate", () => {
    const markup = createMarkup();
    const discovered = discoverRepeatableFieldsetMarkup(markup.root);
    markup.templateItem.querySelector("legend")?.remove();

    const error = captureError(() =>
      materializeRepeatableFieldsetTemplate(
        markup.root,
        discovered.template,
        "item-5"
      )
    );

    expect(error).toMatchObject({
      code: "invalid-template",
      root: markup.root
    });
    expect(markup.items.children).toHaveLength(1);
  });
});
