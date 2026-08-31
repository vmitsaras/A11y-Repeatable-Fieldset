import { describe, expect, it } from "vitest";

import { ATTRIBUTES, TEMPLATE_KEY_TOKEN } from "../src/constants";
import {
  discoverRepeatableFieldsetMarkup
} from "../src/discovery";
import {
  RepeatableFieldsetError,
  type RepeatableFieldsetErrorCode
} from "../src/errors";
import { DEFAULT_MESSAGE_FORMATTERS } from "../src/messages";
import {
  createTestRepeatableFieldsetMarkup,
  type TestRepeatableFieldsetMarkup
} from "./helpers/create-markup";

function captureDiscoveryError(
  callback: () => unknown
): RepeatableFieldsetError {
  try {
    callback();
  } catch (error) {
    if (error instanceof RepeatableFieldsetError) {
      return error;
    }

    throw error;
  }

  throw new Error("Expected markup discovery to throw.");
}

function expectDiscoveryError(
  callback: () => unknown,
  code: RepeatableFieldsetErrorCode,
  element?: Element
): RepeatableFieldsetError {
  const error = captureDiscoveryError(callback);

  expect(error.code).toBe(code);

  if (element !== undefined) {
    expect(error.element).toBe(element);
  }

  return error;
}

function createMarkup(): TestRepeatableFieldsetMarkup {
  return createTestRepeatableFieldsetMarkup(document);
}

describe("discoverRepeatableFieldsetMarkup", () => {
  it("returns a frozen typed structure without changing author markup", () => {
    const markup = createMarkup();
    const before = markup.root.outerHTML;
    const discovered = discoverRepeatableFieldsetMarkup(markup.root);

    expect(discovered.root).toBe(markup.root);
    expect(discovered.itemsContainer).toBe(markup.items);
    expect(discovered.addButton).toBe(markup.addButton);
    expect(discovered.statusRegion).toBeNull();
    expect(discovered.options).toEqual({
      minimum: 1,
      maximum: null,
      itemLabel: "Item",
      focusOnAdd: true,
      announceChanges: true,
      messageFormatters: DEFAULT_MESSAGE_FORMATTERS
    });
    expect(discovered.items).toHaveLength(1);
    expect(discovered.items[0]).toMatchObject({
      element: markup.item,
      removeButton: markup.removeButton,
      key: "server-42"
    });
    expect(discovered.template).toMatchObject({
      element: markup.template,
      item: markup.templateItem
    });
    expect(discovered.template.focusTarget).toBe(
      markup.templateItem.querySelector(
        "[data-a11y-repeatable-fieldset-focus]"
      )
    );
    expect(Object.isFrozen(discovered)).toBe(true);
    expect(Object.isFrozen(discovered.items)).toBe(true);
    expect(Object.isFrozen(discovered.items[0])).toBe(true);
    expect(Object.isFrozen(discovered.template)).toBe(true);
    expect(markup.root.outerHTML).toBe(before);
  });

  it("normalizes JavaScript and dataset options before discovery", () => {
    const markup = createMarkup();
    markup.root.setAttribute("data-min-items", "0");
    markup.root.setAttribute("data-item-label", " Contact ");

    const discovered = discoverRepeatableFieldsetMarkup(markup.root, {
      maximum: 4,
      focusOnAdd: false
    });

    expect(discovered.options).toEqual({
      minimum: 0,
      maximum: 4,
      itemLabel: "Contact",
      focusOnAdd: false,
      announceChanges: true,
      messageFormatters: DEFAULT_MESSAGE_FORMATTERS
    });
  });

  it("returns an empty author-provided status region", () => {
    const markup = createMarkup();
    const status = document.createElement("div");
    status.setAttribute(ATTRIBUTES.status, "");
    status.setAttribute("role", "status");
    markup.root.insertBefore(status, markup.template);

    expect(
      discoverRepeatableFieldsetMarkup(markup.root).statusRegion
    ).toBe(status);
  });

  it("accepts keyless existing items without assigning a key", () => {
    const markup = createMarkup();
    markup.item.removeAttribute(ATTRIBUTES.key);
    const before = markup.item.outerHTML;

    const [item] = discoverRepeatableFieldsetMarkup(markup.root).items;

    expect(item?.key).toBeNull();
    expect(markup.item.outerHTML).toBe(before);
  });

  it("normalizes supplied key text in the result without rewriting it", () => {
    const markup = createMarkup();
    markup.item.setAttribute(ATTRIBUTES.key, " server-42 ");
    const before = markup.item.getAttribute(ATTRIBUTES.key);

    expect(
      discoverRepeatableFieldsetMarkup(markup.root).items[0]?.key
    ).toBe("server-42");
    expect(markup.item.getAttribute(ATTRIBUTES.key)).toBe(before);
  });

  it("rejects non-HTML, unmarked, and nested roots", () => {
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(null),
      "invalid-root"
    );

    const unmarked = document.createElement("section");
    document.body.append(unmarked);
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(unmarked),
      "invalid-root",
      unmarked
    );

    const svg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    svg.setAttribute(ATTRIBUTES.root, "");
    document.body.append(svg);
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(svg),
      "invalid-root"
    );

    const parent = createMarkup();
    const nested = createMarkup();
    parent.item.append(nested.root);
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(nested.root),
      "invalid-root",
      nested.root
    );
  });

  it("requires exactly one owned HTML items container", () => {
    const missing = createMarkup();
    missing.items.removeAttribute(ATTRIBUTES.items);
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(missing.root),
      "missing-items-container"
    );

    document.body.replaceChildren();
    const multiple = createMarkup();
    const second = document.createElement("div");
    second.setAttribute(ATTRIBUTES.items, "");
    multiple.root.append(second);
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(multiple.root),
      "multiple-items-containers",
      second
    );

    document.body.replaceChildren();
    const nonHtml = createMarkup();
    const svg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    svg.setAttribute(ATTRIBUTES.items, "");
    nonHtml.items.replaceWith(svg);
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(nonHtml.root),
      "missing-items-container",
      svg
    );
  });

  it("requires exactly one owned template and Add control", () => {
    const missingTemplate = createMarkup();
    missingTemplate.template.remove();
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(missingTemplate.root),
      "missing-template"
    );

    document.body.replaceChildren();
    const multipleTemplates = createMarkup();
    const secondTemplate = multipleTemplates.template.cloneNode(
      true
    ) as HTMLTemplateElement;
    multipleTemplates.root.append(secondTemplate);
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(multipleTemplates.root),
      "multiple-templates",
      secondTemplate
    );

    document.body.replaceChildren();
    const missingAdd = createMarkup();
    missingAdd.addButton.remove();
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(missingAdd.root),
      "missing-add-control"
    );

    document.body.replaceChildren();
    const multipleAdds = createMarkup();
    const secondAdd = multipleAdds.addButton.cloneNode(
      true
    ) as HTMLButtonElement;
    multipleAdds.root.append(secondAdd);
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(multipleAdds.root),
      "multiple-add-controls",
      secondAdd
    );
  });

  it("rejects fake, submitting, visible, or textless Add controls", () => {
    const fake = createMarkup();
    const fakeAdd = document.createElement("div");
    fakeAdd.setAttribute(ATTRIBUTES.add, "");
    fakeAdd.setAttribute("hidden", "");
    fakeAdd.textContent = "Add";
    fake.addButton.replaceWith(fakeAdd);
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(fake.root),
      "missing-add-control",
      fakeAdd
    );

    document.body.replaceChildren();
    const submit = createMarkup();
    submit.addButton.type = "submit";
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(submit.root),
      "missing-add-control",
      submit.addButton
    );

    document.body.replaceChildren();
    const visible = createMarkup();
    visible.addButton.hidden = false;
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(visible.root),
      "missing-add-control",
      visible.addButton
    );

    document.body.replaceChildren();
    const textless = createMarkup();
    textless.addButton.textContent = " ";
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(textless.root),
      "missing-add-control",
      textless.addButton
    );
  });

  it("requires the Add control and template outside the items container", () => {
    const add = createMarkup();
    add.items.append(add.addButton);
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(add.root),
      "invalid-item",
      add.addButton
    );

    document.body.replaceChildren();
    const template = createMarkup();
    template.items.append(template.template);
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(template.root),
      "invalid-template",
      template.template
    );
  });

  it("requires marked items to be direct-child fieldsets", () => {
    const fake = createMarkup();
    const fakeItem = document.createElement("div");
    fakeItem.setAttribute(ATTRIBUTES.item, "");
    fake.items.append(fakeItem);
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(fake.root),
      "invalid-item",
      fakeItem
    );

    document.body.replaceChildren();
    const indirect = createMarkup();
    const wrapper = document.createElement("div");
    indirect.items.append(wrapper);
    wrapper.append(indirect.item);
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(indirect.root),
      "invalid-item",
      indirect.item
    );

    document.body.replaceChildren();
    const unmarked = createMarkup();
    const unrelatedFieldset = document.createElement("fieldset");
    const unrelatedLegend = document.createElement("legend");
    unrelatedLegend.textContent = "Unrelated group";
    unrelatedFieldset.append(unrelatedLegend);
    unmarked.items.append(unrelatedFieldset);

    expect(
      discoverRepeatableFieldsetMarkup(unmarked.root).items
    ).toHaveLength(1);
  });

  it("requires one meaningful direct-child legend per item", () => {
    const missing = createMarkup();
    missing.item.querySelector("legend")?.remove();
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(missing.root),
      "missing-legend",
      missing.item
    );

    document.body.replaceChildren();
    const empty = createMarkup();
    const legend = empty.item.querySelector("legend");
    legend?.replaceChildren();
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(empty.root),
      "missing-legend",
      legend ?? empty.item
    );

    document.body.replaceChildren();
    const multiple = createMarkup();
    const secondLegend = document.createElement("legend");
    secondLegend.textContent = "Another legend";
    multiple.item.prepend(secondLegend);
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(multiple.root),
      "invalid-item"
    );
  });

  it("requires exactly one valid hidden Remove button per item", () => {
    const missing = createMarkup();
    missing.removeButton.remove();
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(missing.root),
      "missing-remove-control",
      missing.item
    );

    document.body.replaceChildren();
    const multiple = createMarkup();
    const secondRemove = multiple.removeButton.cloneNode(
      true
    ) as HTMLButtonElement;
    multiple.item.append(secondRemove);
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(multiple.root),
      "multiple-remove-controls",
      secondRemove
    );

    document.body.replaceChildren();
    const wrongType = createMarkup();
    wrongType.removeButton.type = "submit";
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(wrongType.root),
      "missing-remove-control",
      wrongType.removeButton
    );

    document.body.replaceChildren();
    const visible = createMarkup();
    visible.removeButton.hidden = false;
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(visible.root),
      "missing-remove-control",
      visible.removeButton
    );

    document.body.replaceChildren();
    const fake = createMarkup();
    const fakeRemove = document.createElement("div");
    fakeRemove.setAttribute(ATTRIBUTES.remove, "");
    fakeRemove.setAttribute("hidden", "");
    fakeRemove.textContent = "Remove";
    fake.removeButton.replaceWith(fakeRemove);
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(fake.root),
      "missing-remove-control",
      fakeRemove
    );
  });

  it("validates the inert template structure without changing it", () => {
    const empty = createMarkup();
    empty.template.content.replaceChildren();
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(empty.root),
      "invalid-template",
      empty.template
    );

    document.body.replaceChildren();
    const multiple = createMarkup();
    multiple.template.content.append(document.createElement("fieldset"));
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(multiple.root),
      "invalid-template",
      multiple.template
    );

    document.body.replaceChildren();
    const text = createMarkup();
    text.template.content.append("Unexpected top-level text");
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(text.root),
      "invalid-template",
      text.template
    );

    document.body.replaceChildren();
    const fake = createMarkup();
    const fakeItem = document.createElement("div");
    fakeItem.setAttribute(ATTRIBUTES.item, "");
    fake.template.content.replaceChildren(fakeItem);
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(fake.root),
      "invalid-template",
      fakeItem
    );

    document.body.replaceChildren();
    const fixedKey = createMarkup();
    fixedKey.templateItem.setAttribute(ATTRIBUTES.key, "fixed-key");
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(fixedKey.root),
      "invalid-template",
      fixedKey.templateItem
    );

    document.body.replaceChildren();
    const paddedToken = createMarkup();
    paddedToken.templateItem.setAttribute(
      ATTRIBUTES.key,
      ` ${TEMPLATE_KEY_TOKEN} `
    );
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(paddedToken.root),
      "invalid-template",
      paddedToken.templateItem
    );

    document.body.replaceChildren();
    const nestedRoot = createMarkup();
    const nested = document.createElement("section");
    nested.setAttribute(ATTRIBUTES.root, "");
    nestedRoot.templateItem.append(nested);
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(nestedRoot.root),
      "invalid-template",
      nested
    );
  });

  it("validates template legends, Remove controls, and focus markers", () => {
    const legend = createMarkup();
    legend.templateItem.querySelector("legend")?.remove();
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(legend.root),
      "missing-legend",
      legend.templateItem
    );

    document.body.replaceChildren();
    const remove = createMarkup();
    const templateRemove =
      remove.templateItem.querySelector<HTMLButtonElement>(
        "[data-a11y-repeatable-fieldset-remove]"
      );
    templateRemove?.removeAttribute("hidden");
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(remove.root),
      "missing-remove-control",
      templateRemove ?? remove.templateItem
    );

    document.body.replaceChildren();
    const multipleFocus = createMarkup();
    const secondFocus = document.createElement("input");
    secondFocus.setAttribute(ATTRIBUTES.focus, "");
    multipleFocus.templateItem.append(secondFocus);
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(multipleFocus.root),
      "invalid-focus-target",
      secondFocus
    );

    document.body.replaceChildren();
    const invalidFocus = createMarkup();
    const originalFocus =
      invalidFocus.templateItem.querySelector<HTMLElement>(
        "[data-a11y-repeatable-fieldset-focus]"
      );
    originalFocus?.removeAttribute(ATTRIBUTES.focus);
    const span = document.createElement("span");
    span.setAttribute(ATTRIBUTES.focus, "");
    span.textContent = "Not focusable";
    invalidFocus.templateItem.append(span);
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(invalidFocus.root),
      "invalid-focus-target",
      span
    );
  });

  it("requires zero or one owned empty status region outside the items", () => {
    const multiple = createMarkup();
    const first = document.createElement("div");
    const second = document.createElement("div");
    first.setAttribute(ATTRIBUTES.status, "");
    second.setAttribute(ATTRIBUTES.status, "");
    multiple.root.append(first, second);
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(multiple.root),
      "multiple-status-regions",
      second
    );

    document.body.replaceChildren();
    const nonempty = createMarkup();
    const status = document.createElement("div");
    status.setAttribute(ATTRIBUTES.status, "");
    status.textContent = "Existing message";
    nonempty.root.append(status);
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(nonempty.root),
      "nonempty-status-region",
      status
    );

    document.body.replaceChildren();
    const misplaced = createMarkup();
    const nestedStatus = document.createElement("div");
    nestedStatus.setAttribute(ATTRIBUTES.status, "");
    misplaced.items.append(nestedStatus);
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(misplaced.root),
      "invalid-item",
      nestedStatus
    );
  });

  it("validates supplied existing keys without assigning missing keys", () => {
    const invalid = createMarkup();
    invalid.item.setAttribute(ATTRIBUTES.key, "-invalid");
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(invalid.root),
      "invalid-key",
      invalid.item
    );

    document.body.replaceChildren();
    const duplicate = createMarkup();
    const secondItem = duplicate.item.cloneNode(
      true
    ) as HTMLFieldSetElement;
    duplicate.items.append(secondItem);
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(duplicate.root),
      "duplicate-key",
      secondItem
    );
  });

  it("rejects duplicate owned IDs and owner-document collisions", () => {
    const internal = createMarkup();
    const duplicateInput = document.createElement("input");
    duplicateInput.id = internal.input.id;
    internal.item.append(duplicateInput);
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(internal.root),
      "duplicate-id",
      duplicateInput
    );

    document.body.replaceChildren();
    const external = createMarkup();
    const collision = document.createElement("div");
    collision.id = external.input.id;
    document.body.prepend(collision);
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(external.root),
      "duplicate-id",
      external.input
    );

    document.body.replaceChildren();
    const template = createMarkup();
    const duplicateTemplateInput = document.createElement("input");
    duplicateTemplateInput.id =
      template.templateItem.querySelector<HTMLInputElement>("[id]")?.id ??
      "";
    template.templateItem.append(duplicateTemplateInput);
    expectDiscoveryError(
      () => discoverRepeatableFieldsetMarkup(template.root),
      "duplicate-id",
      duplicateTemplateInput
    );
  });

  it("excludes structural markers belonging to a nested root", () => {
    const parent = createMarkup();
    const nested = createMarkup();
    nested.item.setAttribute(ATTRIBUTES.key, "nested-1");
    nested.input.id = "nested-1-name";
    nested.input.name = "contacts[nested-1][name]";
    const nestedLabel = nested.item.querySelector("label");

    if (nestedLabel !== null) {
      nestedLabel.htmlFor = nested.input.id;
    }

    parent.item.append(nested.root);

    const discovered = discoverRepeatableFieldsetMarkup(parent.root);

    expect(discovered.items).toHaveLength(1);
    expect(discovered.items[0]?.element).toBe(parent.item);
    expect(discovered.items[0]?.removeButton).toBe(parent.removeButton);
    expect(discovered.items[0]?.key).toBe("server-42");
  });

  it("ignores foreign markers outside the root", () => {
    const markup = createMarkup();
    const foreign = document.createElement("button");
    foreign.type = "button";
    foreign.hidden = true;
    foreign.textContent = "Foreign Add";
    foreign.setAttribute(ATTRIBUTES.add, "");
    document.body.append(foreign);

    expect(
      discoverRepeatableFieldsetMarkup(markup.root).addButton
    ).toBe(markup.addButton);
  });

  it("accepts the exact literal template key token", () => {
    const markup = createMarkup();

    expect(
      discoverRepeatableFieldsetMarkup(markup.root).template.item.getAttribute(
        ATTRIBUTES.key
      )
    ).toBe(TEMPLATE_KEY_TOKEN);
  });
});
