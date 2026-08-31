import { describe, expect, it } from "vitest";

import {
  createRepeatableFieldset,
  type RepeatableFieldsetAddResult
} from "../src/index";
import { TEMPLATE_KEY_TOKEN } from "../src/constants";
import {
  createTestRepeatableFieldsetMarkup,
  type TestRepeatableFieldsetMarkup
} from "./helpers/create-markup";

function createMarkup(): TestRepeatableFieldsetMarkup {
  return createTestRepeatableFieldsetMarkup(document);
}

function addReferenceFixture(
  markup: TestRepeatableFieldsetMarkup
): void {
  const input =
    markup.templateItem.querySelector<HTMLInputElement>(
      "input:not([type])"
    );

  if (input === null) {
    throw new Error("The template text input is missing.");
  }

  const externalLabel = document.createElement("span");
  externalLabel.id = "external-contact-label";
  externalLabel.textContent = "Contact details";

  const externalDescription = document.createElement("p");
  externalDescription.id = "external-contact-description";
  externalDescription.textContent = "Use a person who can be contacted.";

  const localLabel = document.createElement("span");
  localLabel.id = `contact-label-${TEMPLATE_KEY_TOKEN}`;
  localLabel.textContent = "Primary contact";

  const localDescription = document.createElement("p");
  localDescription.id = `contact-description-${TEMPLATE_KEY_TOKEN}`;
  localDescription.textContent = "Enter the contact's full name.";

  const panel = document.createElement("div");
  panel.id = `contact-panel-${TEMPLATE_KEY_TOKEN}`;
  panel.textContent = "Additional contact settings";

  const datalist = document.createElement("datalist");
  datalist.id = `contact-names-${TEMPLATE_KEY_TOKEN}`;
  const option = document.createElement("option");
  option.value = "Ada";
  datalist.append(option);

  const table = document.createElement("table");
  const row = document.createElement("tr");
  const header = document.createElement("th");
  header.id = `contact-header-${TEMPLATE_KEY_TOKEN}`;
  header.textContent = "Preferred contact";
  const cell = document.createElement("td");
  cell.setAttribute("headers", `contact-header-${TEMPLATE_KEY_TOKEN}`);
  cell.textContent = "Email";
  row.append(header, cell);
  table.append(row);

  input.setAttribute(
    "aria-labelledby",
    `external-contact-label contact-label-${TEMPLATE_KEY_TOKEN}`
  );
  input.setAttribute(
    "aria-describedby",
    `external-contact-description contact-description-${TEMPLATE_KEY_TOKEN}`
  );
  input.setAttribute(
    "aria-controls",
    `contact-panel-${TEMPLATE_KEY_TOKEN}`
  );
  input.setAttribute("list", `contact-names-${TEMPLATE_KEY_TOKEN}`);

  markup.templateItem.append(
    localLabel,
    localDescription,
    panel,
    datalist,
    table
  );
  document.body.prepend(externalLabel, externalDescription);
}

function expectAddSuccess(
  result: RepeatableFieldsetAddResult
): asserts result is Extract<RepeatableFieldsetAddResult, { ok: true }> {
  if (!result.ok) {
    throw new Error(`Expected Add to succeed, received ${result.reason}.`);
  }
}

describe("label and ID-reference integration", () => {
  it("keeps local and external relationships correct through Add and Remove", () => {
    const markup = createMarkup();
    addReferenceFixture(markup);
    const originalInputId = markup.input.id;
    const originalInputName = markup.input.name;
    const originalLabel = markup.item.querySelector("label");
    const instance = createRepeatableFieldset(markup.root);
    const first = instance.add();

    expectAddSuccess(first);

    const firstInput = first.item.element.querySelector<HTMLInputElement>(
      "input:not([type])"
    );
    const firstLabel = first.item.element.querySelector<HTMLLabelElement>(
      "label"
    );
    const firstCell = first.item.element.querySelector<HTMLTableCellElement>(
      "td"
    );

    expect(firstLabel?.htmlFor).toBe("contact-item-1-name");
    expect(firstInput?.id).toBe("contact-item-1-name");
    expect(firstInput?.name).toBe("contacts[item-1][name]");
    expect(firstInput?.getAttribute("aria-labelledby")).toBe(
      "external-contact-label contact-label-item-1"
    );
    expect(firstInput?.getAttribute("aria-describedby")).toBe(
      "external-contact-description contact-description-item-1"
    );
    expect(firstInput?.getAttribute("aria-controls")).toBe(
      "contact-panel-item-1"
    );
    expect(firstInput?.getAttribute("list")).toBe("contact-names-item-1");
    expect(firstCell?.getAttribute("headers")).toBe("contact-header-item-1");
    expect(document.getElementById("external-contact-label")).not.toBeNull();
    expect(
      document.getElementById("external-contact-description")
    ).not.toBeNull();
    expect(
      first.item.element.querySelector("#contact-label-item-1")
    ).not.toBeNull();
    expect(
      first.item.element.querySelector("#contact-description-item-1")
    ).not.toBeNull();
    expect(
      first.item.element.querySelector("#contact-panel-item-1")
    ).not.toBeNull();
    expect(
      first.item.element.querySelector("#contact-names-item-1")
    ).not.toBeNull();
    expect(
      first.item.element.querySelector("#contact-header-item-1")
    ).not.toBeNull();

    expect(instance.remove(first.item).ok).toBe(true);
    expect(first.item.element.isConnected).toBe(false);
    expect(document.getElementById("contact-label-item-1")).toBeNull();
    expect(document.getElementById("contact-description-item-1")).toBeNull();
    expect(document.getElementById("contact-panel-item-1")).toBeNull();
    expect(document.getElementById("contact-names-item-1")).toBeNull();
    expect(document.getElementById("contact-header-item-1")).toBeNull();
    expect(document.getElementById("external-contact-label")).not.toBeNull();
    expect(
      document.getElementById("external-contact-description")
    ).not.toBeNull();
    expect(markup.input.id).toBe(originalInputId);
    expect(markup.input.name).toBe(originalInputName);
    expect(markup.item.querySelector("label")).toBe(originalLabel);

    const second = instance.add();
    expectAddSuccess(second);

    const secondInput = second.item.element.querySelector<HTMLInputElement>(
      "input:not([type])"
    );
    const secondLabel = second.item.element.querySelector<HTMLLabelElement>(
      "label"
    );
    const secondCell = second.item.element.querySelector<HTMLTableCellElement>(
      "td"
    );

    expect(second.item.key).toBe("item-2");
    expect(secondLabel?.htmlFor).toBe("contact-item-2-name");
    expect(secondInput?.getAttribute("aria-labelledby")).toBe(
      "external-contact-label contact-label-item-2"
    );
    expect(secondInput?.getAttribute("aria-describedby")).toBe(
      "external-contact-description contact-description-item-2"
    );
    expect(secondInput?.getAttribute("aria-controls")).toBe(
      "contact-panel-item-2"
    );
    expect(secondInput?.getAttribute("list")).toBe("contact-names-item-2");
    expect(secondCell?.getAttribute("headers")).toBe("contact-header-item-2");
  });

  it("blocks Add when a tokenized local reference cannot resolve", () => {
    const markup = createMarkup();
    const input =
      markup.templateItem.querySelector<HTMLInputElement>(
        "input:not([type])"
      );

    if (input === null) {
      throw new Error("The template text input is missing.");
    }

    input.setAttribute(
      "aria-describedby",
      `external-contact-description missing-${TEMPLATE_KEY_TOKEN}`
    );
    const externalDescription = document.createElement("p");
    externalDescription.id = "external-contact-description";
    externalDescription.textContent = "Author-owned description";
    document.body.prepend(externalDescription);
    const instance = createRepeatableFieldset(markup.root);
    const result = instance.add();

    expect(result).toMatchObject({
      ok: false,
      reason: "invalid-template"
    });
    expect(markup.items.children).toHaveLength(1);
    expect(input.getAttribute("aria-describedby")).toBe(
      `external-contact-description missing-${TEMPLATE_KEY_TOKEN}`
    );
    expect(document.getElementById("external-contact-description")).toBe(
      externalDescription
    );
  });
});
