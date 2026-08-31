import {
  ATTRIBUTES,
  ITEM_KEY_PATTERN,
  SELECTORS,
  TEMPLATE_KEY_TOKEN,
  TOKEN_ATTRIBUTES
} from "./constants";
import type {
  DiscoveredRepeatableFieldsetMarkup,
  DiscoveredRepeatableFieldsetTemplate
} from "./discovery";
import {
  RepeatableFieldsetError,
  type RepeatableFieldsetErrorCode
} from "./errors";
import { isPotentialFocusTarget } from "./focus";
import type { RepeatableFieldsetKey } from "./keys";

const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const ASCII_WHITESPACE = /[\u0009\u000a\u000c\u000d\u0020]+/;
const LEADING_ASCII_WHITESPACE =
  /^[\u0009\u000a\u000c\u000d\u0020]+/;
const TRAILING_ASCII_WHITESPACE =
  /[\u0009\u000a\u000c\u000d\u0020]+$/;

type LocalReferenceAttribute =
  | "for"
  | "list"
  | (typeof TOKEN_ATTRIBUTES.idReference)[number]
  | "href";

interface TokenizedLocalReference {
  readonly source: Element;
  readonly attribute: LocalReferenceAttribute;
  readonly id: string;
}

export interface MaterializedRepeatableFieldsetTemplate {
  readonly item: HTMLFieldSetElement;
  readonly key: RepeatableFieldsetKey;
  readonly legend: HTMLLegendElement;
  readonly removeButton: HTMLButtonElement;
  readonly focusTarget: HTMLElement | null;
}

function templateError(
  code: Extract<
    RepeatableFieldsetErrorCode,
    | "invalid-key"
    | "invalid-template"
    | "duplicate-id"
    | "unresolved-template-token"
  >,
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

function isHTMLElement(element: Element): element is HTMLElement {
  return element.namespaceURI === HTML_NAMESPACE;
}

function findScopedCandidates(
  item: HTMLFieldSetElement,
  selector: string
): readonly Element[] {
  return [
    ...(item.matches(selector) ? [item] : []),
    ...item.querySelectorAll<Element>(selector)
  ].filter((element) => element.closest(SELECTORS.item) === item);
}

function getCloneElements(item: HTMLFieldSetElement): readonly Element[] {
  return [item, ...item.querySelectorAll<Element>("*")];
}

function replaceToken(value: string, key: RepeatableFieldsetKey): string {
  return value.split(TEMPLATE_KEY_TOKEN).join(key);
}

function splitASCIIWhitespace(value: string): readonly string[] {
  const trimmed = value
    .replace(LEADING_ASCII_WHITESPACE, "")
    .replace(TRAILING_ASCII_WHITESPACE, "");

  return trimmed === "" ? [] : trimmed.split(ASCII_WHITESPACE);
}

function rewriteScalarAttributes(
  elements: readonly Element[],
  key: RepeatableFieldsetKey,
  references: TokenizedLocalReference[]
): void {
  for (const element of elements) {
    for (const attribute of TOKEN_ATTRIBUTES.scalar) {
      const value = element.getAttribute(attribute);

      if (value === null || !value.includes(TEMPLATE_KEY_TOKEN)) {
        continue;
      }

      const replaced = replaceToken(value, key);
      element.setAttribute(attribute, replaced);

      if (attribute === "for" || attribute === "list") {
        references.push({
          source: element,
          attribute,
          id: replaced
        });
      }
    }
  }
}

function rewriteIDReferenceAttributes(
  elements: readonly Element[],
  key: RepeatableFieldsetKey,
  references: TokenizedLocalReference[]
): void {
  for (const element of elements) {
    for (const attribute of TOKEN_ATTRIBUTES.idReference) {
      const value = element.getAttribute(attribute);

      if (value === null || !value.includes(TEMPLATE_KEY_TOKEN)) {
        continue;
      }

      const replacedTokens = splitASCIIWhitespace(value).map((token) => {
        if (!token.includes(TEMPLATE_KEY_TOKEN)) {
          return token;
        }

        const replaced = replaceToken(token, key);
        references.push({
          source: element,
          attribute,
          id: replaced
        });
        return replaced;
      });

      element.setAttribute(attribute, replacedTokens.join(" "));
    }
  }
}

function rewriteHashReferences(
  elements: readonly Element[],
  key: RepeatableFieldsetKey,
  references: TokenizedLocalReference[]
): void {
  for (const element of elements) {
    const href = element.getAttribute("href");

    if (
      href === null ||
      !href.startsWith("#") ||
      !href.includes(TEMPLATE_KEY_TOKEN)
    ) {
      continue;
    }

    const replaced = replaceToken(href, key);
    element.setAttribute("href", replaced);
    references.push({
      source: element,
      attribute: "href",
      id: replaced.slice(1)
    });
  }
}

function validateNoSupportedResidualTokens(
  root: HTMLElement,
  item: HTMLFieldSetElement,
  elements: readonly Element[]
): void {
  if (
    (item.getAttribute(ATTRIBUTES.key) ?? "").includes(
      TEMPLATE_KEY_TOKEN
    )
  ) {
    throw templateError(
      "unresolved-template-token",
      root,
      "The materialized item key retains the template token.",
      item
    );
  }

  for (const element of elements) {
    for (const attribute of [
      ...TOKEN_ATTRIBUTES.scalar,
      ...TOKEN_ATTRIBUTES.idReference
    ]) {
      if (
        (element.getAttribute(attribute) ?? "").includes(
          TEMPLATE_KEY_TOKEN
        )
      ) {
        throw templateError(
          "unresolved-template-token",
          root,
          `The materialized ${attribute} attribute retains the template token.`,
          element
        );
      }
    }

    const href = element.getAttribute("href");

    if (
      href !== null &&
      href.startsWith("#") &&
      href.includes(TEMPLATE_KEY_TOKEN)
    ) {
      throw templateError(
        "unresolved-template-token",
        root,
        "A materialized same-document href retains the template token.",
        element
      );
    }
  }
}

function collectAndValidateIds(
  root: HTMLElement,
  elements: readonly Element[]
): ReadonlyMap<string, Element> {
  const cloneIds = new Map<string, Element>();

  for (const element of elements) {
    const id = element.getAttribute("id");

    if (id === null || id === "") {
      continue;
    }

    if (cloneIds.has(id)) {
      throw templateError(
        "duplicate-id",
        root,
        `The materialized item contains the duplicate id "${id}".`,
        element
      );
    }

    cloneIds.set(id, element);
  }

  const documentElements =
    root.ownerDocument.querySelectorAll<Element>("[id]");

  for (const [id, element] of cloneIds) {
    if (
      Array.from(documentElements).some(
        (documentElement) => documentElement.id === id
      )
    ) {
      throw templateError(
        "duplicate-id",
        root,
        `The materialized id "${id}" collides with the owner document.`,
        element
      );
    }
  }

  return cloneIds;
}

function validateLocalReferences(
  root: HTMLElement,
  references: readonly TokenizedLocalReference[],
  cloneIds: ReadonlyMap<string, Element>
): void {
  for (const reference of references) {
    if (reference.id === "" || !cloneIds.has(reference.id)) {
      throw templateError(
        "invalid-template",
        root,
        `The tokenized ${reference.attribute} reference "${reference.id}" does not resolve inside the materialized item.`,
        reference.source
      );
    }
  }
}

function findCloneStructure(
  root: HTMLElement,
  item: HTMLFieldSetElement
): Omit<
  MaterializedRepeatableFieldsetTemplate,
  "item" | "key"
> {
  if (
    item.namespaceURI !== HTML_NAMESPACE ||
    item.localName !== "fieldset" ||
    !item.matches(SELECTORS.item)
  ) {
    throw templateError(
      "invalid-template",
      root,
      "The materialized template root must remain a marked fieldset.",
      item
    );
  }

  const nestedItem = item.querySelector(SELECTORS.item);

  if (nestedItem !== null) {
    throw templateError(
      "invalid-template",
      root,
      "The materialized item must not contain a nested marked item.",
      nestedItem
    );
  }

  const nestedRoot = item.querySelector(SELECTORS.root);

  if (nestedRoot !== null) {
    throw templateError(
      "invalid-template",
      root,
      "The materialized item must not contain a nested component root.",
      nestedRoot
    );
  }

  const legends = Array.from(item.children).filter(
    (element): element is HTMLLegendElement =>
      element.namespaceURI === HTML_NAMESPACE &&
      element.localName === "legend"
  );
  const legend = legends[0];

  if (
    legends.length !== 1 ||
    legend === undefined ||
    (legend.textContent ?? "").trim() === ""
  ) {
    throw templateError(
      "invalid-template",
      root,
      "The materialized item must contain one meaningful direct legend.",
      legend ?? item
    );
  }

  const removeCandidates = findScopedCandidates(
    item,
    SELECTORS.remove
  );
  const removeCandidate = removeCandidates[0];

  if (
    removeCandidates.length !== 1 ||
    removeCandidate === undefined ||
    removeCandidate.namespaceURI !== HTML_NAMESPACE ||
    removeCandidate.localName !== "button" ||
    removeCandidate.getAttribute("type")?.trim().toLowerCase() !==
      "button" ||
    !removeCandidate.hasAttribute("hidden") ||
    (removeCandidate.textContent ?? "").trim() === ""
  ) {
    throw templateError(
      "invalid-template",
      root,
      "The materialized item must retain one hidden button-type Remove control.",
      removeCandidate ?? item
    );
  }

  const removeButton = removeCandidate as HTMLButtonElement;
  const focusCandidates = findScopedCandidates(
    item,
    SELECTORS.focus
  );

  if (focusCandidates.length > 1) {
    throw templateError(
      "invalid-template",
      root,
      "The materialized item must not contain multiple focus markers.",
      focusCandidates[1]
    );
  }

  const focusCandidate = focusCandidates[0];

  if (
    focusCandidate !== undefined &&
    (
      focusCandidate === item ||
      !isHTMLElement(focusCandidate) ||
      !isPotentialFocusTarget(focusCandidate, item)
    )
  ) {
    throw templateError(
      "invalid-template",
      root,
      "The materialized focus marker must remain on an enabled, non-hidden, programmatically focusable HTML descendant.",
      focusCandidate
    );
  }

  return Object.freeze({
    legend,
    removeButton,
    focusTarget: focusCandidate ?? null
  });
}

/**
 * Clones the trusted inert template before key allocation. The returned
 * fieldset remains disconnected and no token replacement has occurred.
 */
export function cloneRepeatableFieldsetTemplate(
  root: HTMLElement,
  template: Readonly<DiscoveredRepeatableFieldsetTemplate>
): HTMLFieldSetElement {
  if (template.element.ownerDocument !== root.ownerDocument) {
    throw templateError(
      "invalid-template",
      root,
      "The template must belong to the component root's document.",
      template.element
    );
  }

  const clone = template.item.cloneNode(true) as HTMLFieldSetElement;
  return root.ownerDocument.adoptNode(clone);
}

/**
 * Applies one already-reserved stable key to a disconnected clone and
 * validates every supported identity relationship before insertion.
 */
export function materializeClonedRepeatableFieldsetTemplate(
  root: HTMLElement,
  item: HTMLFieldSetElement,
  key: RepeatableFieldsetKey
): Readonly<MaterializedRepeatableFieldsetTemplate> {
  if (typeof key !== "string" || !ITEM_KEY_PATTERN.test(key)) {
    throw templateError(
      "invalid-key",
      root,
      `A materialized item key must match ${ITEM_KEY_PATTERN.source}.`,
      item
    );
  }

  if (item.ownerDocument !== root.ownerDocument || item.isConnected) {
    throw templateError(
      "invalid-template",
      root,
      "Template materialization requires a disconnected clone in the root's document.",
      item
    );
  }

  const structure = findCloneStructure(root, item);
  const templateItemKey = item.getAttribute(ATTRIBUTES.key);

  if (
    templateItemKey !== null &&
    templateItemKey !== TEMPLATE_KEY_TOKEN
  ) {
    throw templateError(
      "invalid-template",
      root,
      `The template item key must use ${TEMPLATE_KEY_TOKEN}.`,
      item
    );
  }

  item.setAttribute(ATTRIBUTES.key, key);

  const elements = getCloneElements(item);
  const references: TokenizedLocalReference[] = [];

  rewriteScalarAttributes(elements, key, references);
  rewriteIDReferenceAttributes(elements, key, references);
  rewriteHashReferences(elements, key, references);
  validateNoSupportedResidualTokens(root, item, elements);

  const cloneIds = collectAndValidateIds(root, elements);
  validateLocalReferences(root, references, cloneIds);

  return Object.freeze({
    item,
    key,
    ...structure
  });
}

/**
 * Convenience wrapper for callers that do not need the Add command's
 * clone-before-allocation staging.
 */
export function materializeRepeatableFieldsetTemplate(
  root: HTMLElement,
  template: Readonly<DiscoveredRepeatableFieldsetTemplate>,
  key: RepeatableFieldsetKey
): Readonly<MaterializedRepeatableFieldsetTemplate> {
  return materializeClonedRepeatableFieldsetTemplate(
    root,
    cloneRepeatableFieldsetTemplate(root, template),
    key
  );
}

export function materializeDiscoveredRepeatableFieldsetTemplate(
  markup: Readonly<DiscoveredRepeatableFieldsetMarkup>,
  key: RepeatableFieldsetKey
): Readonly<MaterializedRepeatableFieldsetTemplate> {
  return materializeRepeatableFieldsetTemplate(
    markup.root,
    markup.template,
    key
  );
}
