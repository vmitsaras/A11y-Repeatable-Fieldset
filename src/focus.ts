import { SELECTORS } from "./constants";

const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const LABELABLE_CONTROL_SELECTOR =
  "button, input, meter, output, progress, select, textarea";

function isHTMLElement(element: Element): element is HTMLElement {
  return element.namespaceURI === HTML_NAMESPACE;
}

function isHiddenOrInertWithin(
  element: HTMLElement,
  boundary: HTMLElement
): boolean {
  let current: Element | null = element;

  while (current !== null) {
    if (
      current.hasAttribute("hidden") ||
      current.hasAttribute("inert")
    ) {
      return true;
    }

    if (current === boundary) {
      return false;
    }

    current = current.parentElement;
  }

  return true;
}

function hasValidTabIndex(element: HTMLElement): boolean {
  const value = element.getAttribute("tabindex");

  return value !== null && /^-?\d+$/.test(value.trim());
}

function isOwnedItemDescendant(
  root: HTMLElement,
  item: HTMLFieldSetElement,
  element: Element
): boolean {
  return (
    element !== item &&
    element.closest(SELECTORS.item) === item &&
    element.closest(SELECTORS.root) === root
  );
}

/**
 * Tests semantic programmatic-focus eligibility without relying on layout
 * measurements, which are unavailable in jsdom and unreliable for inert
 * template content.
 */
export function isPotentialFocusTarget(
  element: Element,
  boundary: HTMLElement
): element is HTMLElement {
  if (
    !isHTMLElement(element) ||
    isHiddenOrInertWithin(element, boundary)
  ) {
    return false;
  }

  if (element.matches(":disabled")) {
    return false;
  }

  if (hasValidTabIndex(element)) {
    return true;
  }

  switch (element.localName) {
    case "a":
    case "area":
      return element.hasAttribute("href");
    case "audio":
    case "video":
      return element.hasAttribute("controls");
    case "button":
    case "select":
    case "textarea":
    case "iframe":
    case "object":
    case "embed":
    case "summary":
      return true;
    case "input":
      return (
        element.getAttribute("type")?.trim().toLowerCase() !== "hidden"
      );
    default: {
      const contentEditable = element
        .getAttribute("contenteditable")
        ?.trim()
        .toLowerCase();

      return (
        contentEditable === "" ||
        contentEditable === "true" ||
        contentEditable === "plaintext-only"
      );
    }
  }
}

function isLabelableControlCandidate(
  root: HTMLElement,
  item: HTMLFieldSetElement,
  element: Element
): element is HTMLElement {
  return (
    isOwnedItemDescendant(root, item, element) &&
    !element.matches(SELECTORS.remove) &&
    isPotentialFocusTarget(element, item)
  );
}

function tryFocus(
  ownerDocument: Document,
  element: HTMLElement
): boolean {
  try {
    element.focus();
  } catch {
    return false;
  }

  return ownerDocument.activeElement === element;
}

/**
 * Applies the locked focus order after an item has been inserted and all
 * native control constraints have reached their final state.
 */
export function focusAddedRepeatableFieldsetItem(
  root: HTMLElement,
  item: HTMLFieldSetElement,
  explicitTarget: HTMLElement | null
): HTMLElement | null {
  if (
    item.ownerDocument !== root.ownerDocument ||
    item.closest(SELECTORS.root) !== root ||
    item.closest(SELECTORS.item) !== item
  ) {
    return null;
  }

  const ownerDocument = root.ownerDocument;

  if (
    explicitTarget !== null &&
    isOwnedItemDescendant(root, item, explicitTarget) &&
    isPotentialFocusTarget(explicitTarget, item) &&
    tryFocus(ownerDocument, explicitTarget)
  ) {
    return explicitTarget;
  }

  const controls = item.querySelectorAll<Element>(
    LABELABLE_CONTROL_SELECTOR
  );

  for (const control of controls) {
    if (
      control !== explicitTarget &&
      isLabelableControlCandidate(root, item, control) &&
      tryFocus(ownerDocument, control)
    ) {
      return control;
    }
  }

  if (
    hasValidTabIndex(item) &&
    isPotentialFocusTarget(item, item) &&
    tryFocus(ownerDocument, item)
  ) {
    return item;
  }

  return null;
}

export interface RepeatableFieldsetRemovalFocusPlan {
  readonly shouldMove: boolean;
  readonly candidates: readonly HTMLElement[];
  readonly rollbackTarget: HTMLElement | null;
}

function isOwnedRemovalCandidate(
  root: HTMLElement,
  removedItem: HTMLFieldSetElement,
  candidate: HTMLElement
): boolean {
  return (
    candidate.ownerDocument === root.ownerDocument &&
    candidate.closest(SELECTORS.root) === root &&
    !removedItem.contains(candidate)
  );
}

/**
 * Resolves the post-removal candidate order while the target is still
 * attached. Native disabled state is intentionally checked later, after the
 * collection constraints have been synchronized for the resulting count.
 */
export function planRemovedRepeatableFieldsetItemFocus(
  root: HTMLElement,
  removedItem: HTMLFieldSetElement,
  nextRemoveButton: HTMLButtonElement | null,
  previousRemoveButton: HTMLButtonElement | null,
  addButton: HTMLButtonElement,
  canRemoveAfter: boolean,
  activeElement: Element | null,
  focusRequested: boolean
): Readonly<RepeatableFieldsetRemovalFocusPlan> {
  const focusWasInside =
    activeElement !== null &&
    (
      activeElement === removedItem ||
      removedItem.contains(activeElement)
    );
  const candidates: HTMLElement[] = [];

  if (canRemoveAfter) {
    for (const removeButton of [
      nextRemoveButton,
      previousRemoveButton
    ]) {
      if (
        removeButton !== null &&
        isOwnedRemovalCandidate(root, removedItem, removeButton)
      ) {
        candidates.push(removeButton);
      }
    }
  }

  if (isOwnedRemovalCandidate(root, removedItem, addButton)) {
    candidates.push(addButton);
  }

  if (hasValidTabIndex(root)) {
    candidates.push(root);
  }

  return Object.freeze({
    shouldMove: focusRequested || focusWasInside,
    candidates: Object.freeze(candidates),
    rollbackTarget:
      focusWasInside &&
      activeElement !== null &&
      isHTMLElement(activeElement)
        ? activeElement
        : null
  });
}

/**
 * Moves focus only after the removed item is detached and positions,
 * constraints, and public collection snapshots are stable.
 */
export function focusAfterRepeatableFieldsetItemRemoval(
  root: HTMLElement,
  plan: Readonly<RepeatableFieldsetRemovalFocusPlan>
): HTMLElement | null {
  if (!plan.shouldMove) {
    return null;
  }

  for (const candidate of plan.candidates) {
    if (
      candidate.ownerDocument !== root.ownerDocument ||
      (
        candidate !== root &&
        candidate.closest(SELECTORS.root) !== root
      ) ||
      !isPotentialFocusTarget(candidate, root)
    ) {
      continue;
    }

    if (tryFocus(root.ownerDocument, candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Restores the pre-command focus when a technical failure rolls the removed
 * item back into the owned collection.
 */
export function restoreFocusAfterFailedRepeatableFieldsetItemRemoval(
  root: HTMLElement,
  restoredItem: HTMLFieldSetElement,
  plan: Readonly<RepeatableFieldsetRemovalFocusPlan>
): void {
  const target = plan.rollbackTarget;

  if (
    target === null ||
    (
      target !== restoredItem &&
      !restoredItem.contains(target)
    ) ||
    restoredItem.closest(SELECTORS.root) !== root
  ) {
    return;
  }

  tryFocus(root.ownerDocument, target);
}

export interface RepeatableFieldsetMoveFocusPlan {
  readonly target: HTMLElement | null;
}

/** Captures focus only when it belongs to the item about to move. */
export function planMovedRepeatableFieldsetItemFocus(
  root: HTMLElement,
  item: HTMLFieldSetElement,
  activeElement: Element | null
): Readonly<RepeatableFieldsetMoveFocusPlan> {
  const target =
    activeElement !== null &&
    isHTMLElement(activeElement) &&
    activeElement.closest(SELECTORS.root) === root &&
    (activeElement === item || item.contains(activeElement))
      ? activeElement
      : null;

  return Object.freeze({ target });
}

/** Restores the same owned active element after its item changes DOM order. */
export function focusAfterRepeatableFieldsetItemMove(
  root: HTMLElement,
  item: HTMLFieldSetElement,
  plan: Readonly<RepeatableFieldsetMoveFocusPlan>
): HTMLElement | null {
  const target = plan.target;

  if (
    target === null ||
    item.closest(SELECTORS.root) !== root ||
    (target !== item && !item.contains(target)) ||
    !isPotentialFocusTarget(target, item)
  ) {
    return null;
  }

  if (root.ownerDocument.activeElement === target) {
    return target;
  }

  return tryFocus(root.ownerDocument, target) ? target : null;
}
