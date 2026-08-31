const TOKEN = "__A11Y_REPEATABLE_KEY__";

export interface TestRepeatableFieldsetMarkup {
  readonly root: HTMLElement;
  readonly items: HTMLElement;
  readonly item: HTMLFieldSetElement;
  readonly input: HTMLInputElement;
  readonly addButton: HTMLButtonElement;
  readonly removeButton: HTMLButtonElement;
  readonly template: HTMLTemplateElement;
  readonly templateItem: HTMLFieldSetElement;
}

function createItem(
  ownerDocument: Document,
  key: string
): {
  readonly item: HTMLFieldSetElement;
  readonly input: HTMLInputElement;
  readonly removeButton: HTMLButtonElement;
} {
  const item = ownerDocument.createElement("fieldset");
  item.dataset["a11yRepeatableFieldsetItem"] = "";
  item.dataset["a11yRepeatableFieldsetKey"] = key;

  const legend = ownerDocument.createElement("legend");
  legend.append("Contact ");

  const position = ownerDocument.createElement("span");
  position.dataset["a11yRepeatableFieldsetPosition"] = "";
  legend.append(position);

  const inputId = `contact-${key}-name`;
  const label = ownerDocument.createElement("label");
  label.htmlFor = inputId;
  label.textContent = "Name";

  const input = ownerDocument.createElement("input");
  input.id = inputId;
  input.name = `contacts[${key}][name]`;

  const removeButton = ownerDocument.createElement("button");
  removeButton.type = "button";
  removeButton.hidden = true;
  removeButton.dataset["a11yRepeatableFieldsetRemove"] = "";
  removeButton.textContent = "Remove contact";

  item.append(legend, label, input, removeButton);

  return {
    item,
    input,
    removeButton
  };
}

export function createTestRepeatableFieldsetMarkup(
  ownerDocument: Document
): TestRepeatableFieldsetMarkup {
  const root = ownerDocument.createElement("section");
  root.dataset["a11yRepeatableFieldset"] = "";

  const items = ownerDocument.createElement("div");
  items.dataset["a11yRepeatableFieldsetItems"] = "";

  const existing = createItem(ownerDocument, "server-42");
  existing.item
    .querySelector<HTMLElement>("[data-a11y-repeatable-fieldset-position]")
    ?.append("1");
  items.append(existing.item);

  const addButton = ownerDocument.createElement("button");
  addButton.type = "button";
  addButton.hidden = true;
  addButton.dataset["a11yRepeatableFieldsetAdd"] = "";
  addButton.textContent = "Add another contact";

  const template = ownerDocument.createElement("template");
  template.dataset["a11yRepeatableFieldsetTemplate"] = "";

  const templateEntry = createItem(ownerDocument, TOKEN);
  templateEntry.input.dataset["a11yRepeatableFieldsetFocus"] = "";
  template.content.append(templateEntry.item);

  root.append(items, addButton, template);
  ownerDocument.body.append(root);

  return {
    root,
    items,
    item: existing.item,
    input: existing.input,
    addButton,
    removeButton: existing.removeButton,
    template,
    templateItem: templateEntry.item
  };
}
