import {
  ATTRIBUTES,
  ITEM_KEY_PATTERN,
  SELECTORS,
  TEMPLATE_KEY_TOKEN
} from "./constants";
import {
  RepeatableFieldsetError,
  type RepeatableFieldsetErrorCode
} from "./errors";
import { isPotentialFocusTarget } from "./focus";
import {
  normalizeRepeatableFieldsetOptions,
  type NormalizedRepeatableFieldsetOptions,
  type RepeatableFieldsetOptions
} from "./options";

const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const ITEM_MARKER_SELECTOR = `[${ATTRIBUTES.item}]`;
const ITEMS_MARKER_SELECTOR = `[${ATTRIBUTES.items}]`;
const TEMPLATE_MARKER_SELECTOR = `[${ATTRIBUTES.template}]`;
const ADD_MARKER_SELECTOR = `[${ATTRIBUTES.add}]`;
const REMOVE_MARKER_SELECTOR = `[${ATTRIBUTES.remove}]`;
const FOCUS_MARKER_SELECTOR = `[${ATTRIBUTES.focus}]`;
const STATUS_MARKER_SELECTOR = `[${ATTRIBUTES.status}]`;

export interface DiscoveredRepeatableFieldsetItem {
  readonly element: HTMLFieldSetElement;
  readonly legend: HTMLLegendElement;
  readonly removeButton: HTMLButtonElement;
  readonly key: string | null;
}

export interface DiscoveredRepeatableFieldsetTemplate {
  readonly element: HTMLTemplateElement;
  readonly item: HTMLFieldSetElement;
  readonly legend: HTMLLegendElement;
  readonly removeButton: HTMLButtonElement;
  readonly focusTarget: HTMLElement | null;
}

export interface DiscoveredRepeatableFieldsetMarkup {
  readonly root: HTMLElement;
  readonly options: Readonly<NormalizedRepeatableFieldsetOptions>;
  readonly itemsContainer: HTMLElement;
  readonly items: readonly DiscoveredRepeatableFieldsetItem[];
  readonly addButton: HTMLButtonElement;
  readonly template: DiscoveredRepeatableFieldsetTemplate;
  readonly statusRegion: HTMLElement | null;
}

function markupError(
  code: RepeatableFieldsetErrorCode,
  root: HTMLElement,
  message: string,
  element?: Element
): RepeatableFieldsetError {
  return new RepeatableFieldsetError(
    code,
    message,
    element === undefined ? { root } : { root, element }
  );
}

function isHTMLElement(value: unknown): value is HTMLElement {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<HTMLElement>;

  return (
    candidate.nodeType === 1 &&
    candidate.namespaceURI === HTML_NAMESPACE &&
    typeof candidate.matches === "function" &&
    typeof candidate.querySelectorAll === "function" &&
    typeof candidate.hasAttribute === "function" &&
    candidate.ownerDocument !== undefined
  );
}

function isHTMLFieldSetElement(
  element: Element
): element is HTMLFieldSetElement {
  return (
    element.namespaceURI === HTML_NAMESPACE &&
    element.localName === "fieldset"
  );
}

function isHTMLLegendElement(element: Element): element is HTMLLegendElement {
  return (
    element.namespaceURI === HTML_NAMESPACE &&
    element.localName === "legend"
  );
}

function isHTMLButtonElement(element: Element): element is HTMLButtonElement {
  return (
    element.namespaceURI === HTML_NAMESPACE &&
    element.localName === "button"
  );
}

function isHTMLTemplateElement(
  element: Element
): element is HTMLTemplateElement {
  return (
    element.namespaceURI === HTML_NAMESPACE &&
    element.localName === "template"
  );
}

function validateRoot(value: unknown): HTMLElement {
  if (!isHTMLElement(value)) {
    throw new RepeatableFieldsetError(
      "invalid-root",
      "The repeatable-fieldset root must be an HTML element."
    );
  }

  if (!value.matches(SELECTORS.root)) {
    throw markupError(
      "invalid-root",
      value,
      `The root must have the ${ATTRIBUTES.root} attribute.`,
      value
    );
  }

  const ancestorRoot = value.parentElement?.closest(SELECTORS.root);

  if (ancestorRoot !== null && ancestorRoot !== undefined) {
    throw markupError(
      "invalid-root",
      value,
      "Nested repeatable-fieldset roots are not supported.",
      value
    );
  }

  return value;
}

function findOwnedElements(
  root: HTMLElement,
  selector: string
): readonly Element[] {
  const candidates = [
    ...(root.matches(selector) ? [root] : []),
    ...root.querySelectorAll<Element>(selector)
  ];

  return candidates.filter(
    (element) => element.closest(SELECTORS.root) === root
  );
}

function requireSingleOwnedElement(
  root: HTMLElement,
  selector: string,
  missingCode: RepeatableFieldsetErrorCode,
  multipleCode: RepeatableFieldsetErrorCode,
  description: string
): Element {
  const matches = findOwnedElements(root, selector);

  if (matches.length === 0) {
    throw markupError(
      missingCode,
      root,
      `The root must contain one owned ${description}.`
    );
  }

  if (matches.length > 1) {
    throw markupError(
      multipleCode,
      root,
      `The root must not contain more than one owned ${description}.`,
      matches[1]
    );
  }

  const match = matches[0];

  if (match === undefined) {
    throw markupError(
      missingCode,
      root,
      `The root must contain one owned ${description}.`
    );
  }

  return match;
}

function hasMeaningfulText(element: Element): boolean {
  return (element.textContent ?? "").trim() !== "";
}

function validateEnhancementButton(
  root: HTMLElement,
  element: Element,
  errorCode: "missing-add-control" | "missing-remove-control",
  description: string
): HTMLButtonElement {
  if (!isHTMLButtonElement(element)) {
    throw markupError(
      errorCode,
      root,
      `The ${description} must be a native button element.`,
      element
    );
  }

  if (element.getAttribute("type")?.trim().toLowerCase() !== "button") {
    throw markupError(
      errorCode,
      root,
      `The ${description} must explicitly use type="button".`,
      element
    );
  }

  if (!element.hasAttribute("hidden")) {
    throw markupError(
      errorCode,
      root,
      `The ${description} must be hidden before initialization.`,
      element
    );
  }

  if (!hasMeaningfulText(element)) {
    throw markupError(
      errorCode,
      root,
      `The ${description} must have a visible text label.`,
      element
    );
  }

  return element;
}

function findDirectLegend(
  root: HTMLElement,
  item: HTMLFieldSetElement,
  malformedCode: "invalid-item" | "invalid-template"
): HTMLLegendElement {
  const legends = Array.from(item.children).filter(isHTMLLegendElement);

  if (legends.length === 0) {
    throw markupError(
      "missing-legend",
      root,
      "Every repeatable item must have a direct-child legend.",
      item
    );
  }

  if (legends.length > 1) {
    throw markupError(
      malformedCode,
      root,
      "A repeatable item must not contain multiple direct-child legends.",
      legends[1]
    );
  }

  const legend = legends[0];

  if (legend === undefined || !hasMeaningfulText(legend)) {
    throw markupError(
      "missing-legend",
      root,
      "Every repeatable item must have a meaningful non-empty legend.",
      legend ?? item
    );
  }

  return legend;
}

function findScopedElements(
  item: HTMLFieldSetElement,
  selector: string,
  root?: HTMLElement
): readonly Element[] {
  const candidates = [
    ...(item.matches(selector) ? [item] : []),
    ...item.querySelectorAll<Element>(selector)
  ];

  return candidates.filter((element) => {
    if (element.closest(ITEM_MARKER_SELECTOR) !== item) {
      return false;
    }

    return root === undefined || element.closest(SELECTORS.root) === root;
  });
}

function findFocusTarget(
  root: HTMLElement,
  item: HTMLFieldSetElement,
  malformedCode: "invalid-item" | "invalid-template",
  ownedRoot?: HTMLElement
): HTMLElement | null {
  const markers = findScopedElements(
    item,
    FOCUS_MARKER_SELECTOR,
    ownedRoot
  );

  if (markers.length > 1) {
    throw markupError(
      "invalid-focus-target",
      root,
      "A repeatable item must not contain multiple focus markers.",
      markers[1]
    );
  }

  const marker = markers[0];

  if (marker === undefined) {
    return null;
  }

  if (marker === item || !isPotentialFocusTarget(marker, item)) {
    throw markupError(
      "invalid-focus-target",
      root,
      `The focus marker in the ${malformedCode === "invalid-template" ? "template" : "item"} must identify an enabled, non-hidden, programmatically focusable descendant.`,
      marker
    );
  }

  return marker;
}

function findRemoveButton(
  root: HTMLElement,
  item: HTMLFieldSetElement,
  ownedRoot?: HTMLElement
): HTMLButtonElement {
  const matches = findScopedElements(
    item,
    REMOVE_MARKER_SELECTOR,
    ownedRoot
  );

  if (matches.length === 0) {
    throw markupError(
      "missing-remove-control",
      root,
      "Every repeatable item must contain one owned Remove button.",
      item
    );
  }

  if (matches.length > 1) {
    throw markupError(
      "multiple-remove-controls",
      root,
      "A repeatable item must not contain multiple owned Remove buttons.",
      matches[1]
    );
  }

  const match = matches[0];

  if (match === undefined) {
    throw markupError(
      "missing-remove-control",
      root,
      "Every repeatable item must contain one owned Remove button.",
      item
    );
  }

  return validateEnhancementButton(
    root,
    match,
    "missing-remove-control",
    "Remove control"
  );
}

function readExistingKey(
  root: HTMLElement,
  item: HTMLFieldSetElement,
  usedKeys: Set<string>
): string | null {
  if (!item.hasAttribute(ATTRIBUTES.key)) {
    return null;
  }

  const key = (item.getAttribute(ATTRIBUTES.key) ?? "").trim();

  if (!ITEM_KEY_PATTERN.test(key)) {
    throw markupError(
      "invalid-key",
      root,
      `Existing item keys must match ${ITEM_KEY_PATTERN.source}.`,
      item
    );
  }

  if (usedKeys.has(key)) {
    throw markupError(
      "duplicate-key",
      root,
      `The existing item key "${key}" is duplicated.`,
      item
    );
  }

  usedKeys.add(key);
  return key;
}

function validateExistingItem(
  root: HTMLElement,
  item: HTMLFieldSetElement,
  usedKeys: Set<string>
): DiscoveredRepeatableFieldsetItem {
  return Object.freeze({
    element: item,
    legend: findDirectLegend(root, item, "invalid-item"),
    removeButton: findRemoveButton(root, item, root),
    key: readExistingKey(root, item, usedKeys)
  });
}

function hasOnlyOneTopLevelTemplateElement(
  template: HTMLTemplateElement
): boolean {
  if (template.content.children.length !== 1) {
    return false;
  }

  return Array.from(template.content.childNodes).every(
    (node) =>
      node.nodeType === node.ELEMENT_NODE ||
      node.nodeType === node.COMMENT_NODE ||
      (node.nodeType === node.TEXT_NODE &&
        (node.textContent ?? "").trim() === "")
  );
}

function validateTemplateIds(
  root: HTMLElement,
  template: HTMLTemplateElement
): void {
  const ids = new Set<string>();

  for (const element of template.content.querySelectorAll<Element>("[id]")) {
    if (element.id === "") {
      continue;
    }

    if (ids.has(element.id)) {
      throw markupError(
        "duplicate-id",
        root,
        `The template contains the duplicate id "${element.id}".`,
        element
      );
    }

    ids.add(element.id);
  }
}

function validateTemplate(
  root: HTMLElement,
  element: Element,
  itemsContainer: HTMLElement
): DiscoveredRepeatableFieldsetTemplate {
  if (!isHTMLTemplateElement(element)) {
    throw markupError(
      "invalid-template",
      root,
      "The template marker must be placed on an HTML template element.",
      element
    );
  }

  if (itemsContainer.contains(element)) {
    throw markupError(
      "invalid-template",
      root,
      "The owned template must be outside the items container.",
      element
    );
  }

  if (!hasOnlyOneTopLevelTemplateElement(element)) {
    throw markupError(
      "invalid-template",
      root,
      "The template must contain exactly one top-level element and no non-whitespace top-level text.",
      element
    );
  }

  const item = element.content.firstElementChild;

  if (
    item === null ||
    !isHTMLFieldSetElement(item) ||
    !item.matches(ITEM_MARKER_SELECTOR)
  ) {
    throw markupError(
      "invalid-template",
      root,
      "The template top-level element must be a marked item fieldset.",
      item ?? element
    );
  }

  if (
    element.content.querySelectorAll(ITEM_MARKER_SELECTOR).length !== 1
  ) {
    throw markupError(
      "invalid-template",
      root,
      "The template must not contain nested marked repeatable items.",
      item
    );
  }

  const nestedRoot = item.querySelector(SELECTORS.root);

  if (nestedRoot !== null) {
    throw markupError(
      "invalid-template",
      root,
      "The template must not contain a nested repeatable-fieldset root.",
      nestedRoot
    );
  }

  if (item.hasAttribute(ATTRIBUTES.key)) {
    const templateKey = item.getAttribute(ATTRIBUTES.key) ?? "";

    if (templateKey !== TEMPLATE_KEY_TOKEN) {
      throw markupError(
        "invalid-template",
        root,
        `A template item key must use the literal token ${TEMPLATE_KEY_TOKEN}.`,
        item
      );
    }
  }

  validateTemplateIds(root, element);

  return Object.freeze({
    element,
    item,
    legend: findDirectLegend(root, item, "invalid-template"),
    removeButton: findRemoveButton(root, item),
    focusTarget: findFocusTarget(root, item, "invalid-template")
  });
}

function validateStatusRegion(
  root: HTMLElement,
  itemsContainer: HTMLElement
): HTMLElement | null {
  const matches = findOwnedElements(root, STATUS_MARKER_SELECTOR);

  if (matches.length > 1) {
    throw markupError(
      "multiple-status-regions",
      root,
      "The root must not contain multiple owned status regions.",
      matches[1]
    );
  }

  const match = matches[0];

  if (match === undefined) {
    return null;
  }

  if (!isHTMLElement(match)) {
    throw markupError(
      "nonempty-status-region",
      root,
      "The author-provided status region must be an HTML element.",
      match
    );
  }

  if (itemsContainer.contains(match)) {
    throw markupError(
      "invalid-item",
      root,
      "The author-provided status region must be outside the items container.",
      match
    );
  }

  if (match.childNodes.length !== 0) {
    throw markupError(
      "nonempty-status-region",
      root,
      "The author-provided status region must be empty at initialization.",
      match
    );
  }

  return match;
}

function validateOwnedIds(root: HTMLElement): void {
  const ownedElements = findOwnedElements(root, "[id]");
  const ownedIds = new Set<string>();

  for (const element of ownedElements) {
    if (element.id === "") {
      continue;
    }

    if (ownedIds.has(element.id)) {
      throw markupError(
        "duplicate-id",
        root,
        `The owned id "${element.id}" is duplicated.`,
        element
      );
    }

    ownedIds.add(element.id);
  }

  const documentElements = root.ownerDocument.querySelectorAll<Element>(
    "[id]"
  );

  for (const element of ownedElements) {
    if (element.id === "") {
      continue;
    }

    const collision = Array.from(documentElements).find(
      (candidate) =>
        candidate !== element && candidate.id === element.id
    );

    if (collision !== undefined) {
      throw markupError(
        "duplicate-id",
        root,
        `The owned id "${element.id}" collides with another element in the owner document.`,
        element
      );
    }
  }
}

/**
 * Validates and returns the author-owned semantic structure without changing
 * author markup or allocating identity.
 */
export function discoverRepeatableFieldsetMarkup(
  rootValue: unknown,
  options: RepeatableFieldsetOptions = {}
): Readonly<DiscoveredRepeatableFieldsetMarkup> {
  const root = validateRoot(rootValue);
  const normalizedOptions = normalizeRepeatableFieldsetOptions(root, options);

  const itemsElement = requireSingleOwnedElement(
    root,
    ITEMS_MARKER_SELECTOR,
    "missing-items-container",
    "multiple-items-containers",
    "items container"
  );

  if (!isHTMLElement(itemsElement)) {
    throw markupError(
      "missing-items-container",
      root,
      "The owned items container must be an HTML element.",
      itemsElement
    );
  }

  const templateElement = requireSingleOwnedElement(
    root,
    TEMPLATE_MARKER_SELECTOR,
    "missing-template",
    "multiple-templates",
    "template"
  );
  const addElement = requireSingleOwnedElement(
    root,
    ADD_MARKER_SELECTOR,
    "missing-add-control",
    "multiple-add-controls",
    "Add control"
  );

  if (itemsElement.contains(addElement)) {
    throw markupError(
      "invalid-item",
      root,
      "The owned Add control must be outside the items container.",
      addElement
    );
  }

  const addButton = validateEnhancementButton(
    root,
    addElement,
    "missing-add-control",
    "Add control"
  );
  const template = validateTemplate(
    root,
    templateElement,
    itemsElement
  );

  const markedItems = findOwnedElements(root, ITEM_MARKER_SELECTOR);

  for (const markedItem of markedItems) {
    if (
      !isHTMLFieldSetElement(markedItem) ||
      markedItem.parentElement !== itemsElement
    ) {
      throw markupError(
        "invalid-item",
        root,
        "Every owned marked item must be a direct-child fieldset of the items container.",
        markedItem
      );
    }
  }

  const usedKeys = new Set<string>();
  const items = Object.freeze(
    Array.from(itemsElement.children)
      .filter(
        (element): element is HTMLFieldSetElement =>
          isHTMLFieldSetElement(element) &&
          element.matches(ITEM_MARKER_SELECTOR) &&
          element.closest(SELECTORS.root) === root
      )
      .map((item) => validateExistingItem(root, item, usedKeys))
  );
  const statusRegion = validateStatusRegion(root, itemsElement);

  validateOwnedIds(root);

  return Object.freeze({
    root,
    options: normalizedOptions,
    itemsContainer: itemsElement,
    items,
    addButton,
    template,
    statusRegion
  });
}
