import type {
  RepeatableFieldsetAddon,
  RepeatableFieldsetCleanup,
  RepeatableFieldsetItemAddonContext
} from "../addons";
import { SELECTORS } from "../constants";

const ADDON_ID = "a11y-repeatable-fieldset.legend-sync";
const DEFAULT_SOURCE_SELECTOR =
  "[data-a11y-repeatable-fieldset-legend-source]";
const DEFAULT_TARGET_SELECTOR =
  "[data-a11y-repeatable-fieldset-legend-value]";
const ALLOWED_OPTION_KEYS = new Set([
  "source",
  "target",
  "updateOn",
  "emptyText"
]);
const ALLOWED_INPUT_TYPES = new Set([
  "email",
  "search",
  "tel",
  "text",
  "url"
]);
const SENSITIVE_AUTOCOMPLETE_TOKENS = new Set([
  "current-password",
  "new-password",
  "one-time-code"
]);

/** The committed event supported by Legend Sync. */
export type LegendSyncUpdateEvent = "change";

/** Options for the dependency-free Legend Sync addon. */
export interface LegendSyncOptions {
  /** Explicit selector for one deliberately chosen source in every item. */
  readonly source?: string;
  /** Explicit selector for one dedicated text-only marker in every legend. */
  readonly target?: string;
  /** Legend names update only after the source commits a change. */
  readonly updateOn?: LegendSyncUpdateEvent;
  /** Text shown after the generic label and position when the source is empty. */
  readonly emptyText?: string;
}

interface NormalizedLegendSyncOptions {
  readonly source: string;
  readonly target: string;
  readonly updateOn: LegendSyncUpdateEvent;
  readonly emptyText: string;
}

type LegendSource =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

type OwnerWindow = Window & typeof globalThis;

function invalidOptions(message: string): TypeError {
  return new TypeError(`Legend Sync: ${message}`);
}

function normalizeDisplayText(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

function normalizeSelector(
  value: unknown,
  name: "source" | "target",
  fallback: string
): string {
  if (value === undefined) {
    return fallback;
  }

  if (
    typeof value !== "string" ||
    value.trim() === "" ||
    value !== value.trim()
  ) {
    throw invalidOptions(`${name} must be a trimmed, non-empty selector.`);
  }

  return value;
}

function normalizeOptions(
  options: LegendSyncOptions | undefined
): Readonly<NormalizedLegendSyncOptions> {
  if (options === undefined) {
    return Object.freeze({
      source: DEFAULT_SOURCE_SELECTOR,
      target: DEFAULT_TARGET_SELECTOR,
      updateOn: "change",
      emptyText: ""
    });
  }

  if (
    typeof options !== "object" ||
    options === null ||
    Array.isArray(options)
  ) {
    throw invalidOptions("options must be an object.");
  }

  const unknownKey = Object.keys(options).find(
    (key) => !ALLOWED_OPTION_KEYS.has(key)
  );

  if (unknownKey !== undefined) {
    throw invalidOptions(`unknown option \"${unknownKey}\".`);
  }

  if (options.updateOn !== undefined && options.updateOn !== "change") {
    throw invalidOptions('updateOn must be "change".');
  }

  if (
    options.emptyText !== undefined &&
    typeof options.emptyText !== "string"
  ) {
    throw invalidOptions("emptyText must be a string.");
  }

  const source = normalizeSelector(
    options.source,
    "source",
    DEFAULT_SOURCE_SELECTOR
  );
  const target = normalizeSelector(
    options.target,
    "target",
    DEFAULT_TARGET_SELECTOR
  );

  if (source === target) {
    throw invalidOptions("source and target must use different selectors.");
  }

  return Object.freeze({
    source,
    target,
    updateOn: "change",
    emptyText: normalizeDisplayText(options.emptyText ?? "")
  });
}

function getOwnedMatches(
  item: HTMLFieldSetElement,
  root: HTMLElement,
  selector: string,
  label: "source" | "target"
): Element[] {
  let matches: Element[];

  try {
    matches = Array.from(item.querySelectorAll(selector));
  } catch {
    throw invalidOptions(`${label} must be a valid selector.`);
  }

  return matches.filter(
    (element) =>
      element.closest(SELECTORS.root) === root &&
      element.closest(SELECTORS.item) === item
  );
}

function getOnlyOwnedMatch(
  context: RepeatableFieldsetItemAddonContext,
  selector: string,
  label: "source" | "target"
): Element {
  const matches = getOwnedMatches(
    context.item.element,
    context.root,
    selector,
    label
  );

  if (matches.length !== 1) {
    throw invalidOptions(
      `item \"${context.item.key}\" must contain exactly one owned ${label}.`
    );
  }

  const match = matches[0];

  if (match === undefined) {
    throw invalidOptions(
      `item \"${context.item.key}\" must contain exactly one owned ${label}.`
    );
  }

  return match;
}

function isStructurallyHidden(
  element: HTMLElement,
  item: HTMLFieldSetElement
): boolean {
  let current: HTMLElement | null = element;

  while (current !== null) {
    if (
      current.hidden ||
      current.hasAttribute("inert") ||
      current.getAttribute("aria-hidden") === "true"
    ) {
      return true;
    }

    if (current === item) {
      return false;
    }

    current = current.parentElement;
  }

  return false;
}

function hasLiveRegionSemantics(
  element: HTMLElement,
  legend: HTMLLegendElement
): boolean {
  let current: HTMLElement | null = element;

  while (current !== null) {
    const role = current.getAttribute("role");
    const live = current.getAttribute("aria-live");

    if (
      role === "status" ||
      role === "alert" ||
      (live !== null && live !== "off")
    ) {
      return true;
    }

    if (current === legend) {
      return false;
    }

    current = current.parentElement;
  }

  return false;
}

function getDirectLegend(
  item: HTMLFieldSetElement,
  view: OwnerWindow
): HTMLLegendElement {
  const legend = Array.from(item.children).find(
    (element): element is HTMLLegendElement =>
      element instanceof view.HTMLLegendElement
  );

  if (legend === undefined) {
    throw invalidOptions("an owned item is missing its direct legend.");
  }

  return legend;
}

function validateTarget(
  target: Element,
  item: HTMLFieldSetElement,
  view: OwnerWindow
): HTMLElement {
  const legend = getDirectLegend(item, view);

  if (!(target instanceof view.HTMLElement) || !legend.contains(target)) {
    throw invalidOptions(
      "target must be an HTML element inside the item's direct legend."
    );
  }

  if (
    target.matches(SELECTORS.position) ||
    target.closest(SELECTORS.position) !== null ||
    target.querySelector(SELECTORS.position) !== null
  ) {
    throw invalidOptions("target must not replace a visible position marker.");
  }

  if (target.children.length > 0) {
    throw invalidOptions("target must be a dedicated text-only element.");
  }

  if (isStructurallyHidden(target, item)) {
    throw invalidOptions("target must remain exposed and visible.");
  }

  if (hasLiveRegionSemantics(target, legend)) {
    throw invalidOptions("target must not be inside a live region.");
  }

  return target;
}

function hasSensitiveAutocompleteToken(source: LegendSource): boolean {
  const autocomplete = source.getAttribute("autocomplete");

  if (autocomplete === null) {
    return false;
  }

  return autocomplete
    .toLowerCase()
    .split(/\s+/u)
    .filter(Boolean)
    .some(
      (token) =>
        token.startsWith("cc-") ||
        SENSITIVE_AUTOCOMPLETE_TOKENS.has(token)
    );
}

function validateSource(
  source: Element,
  item: HTMLFieldSetElement,
  legend: HTMLLegendElement,
  view: OwnerWindow
): LegendSource {
  const isInput = source instanceof view.HTMLInputElement;
  const isSelect = source instanceof view.HTMLSelectElement;
  const isTextArea = source instanceof view.HTMLTextAreaElement;

  if (!isInput && !isSelect && !isTextArea) {
    throw invalidOptions(
      "source must be a supported input, single-select, or textarea."
    );
  }

  if (legend.contains(source)) {
    throw invalidOptions("source must remain outside the item's legend.");
  }

  if (isStructurallyHidden(source, item)) {
    throw invalidOptions("source must not be hidden, inert, or aria-hidden.");
  }

  if (isInput && !ALLOWED_INPUT_TYPES.has(source.type)) {
    throw invalidOptions(
      "source input type must be text, search, email, tel, or url."
    );
  }

  if (isSelect && source.multiple) {
    throw invalidOptions("source select must not allow multiple values.");
  }

  if (hasSensitiveAutocompleteToken(source)) {
    throw invalidOptions(
      "source must not expose password, one-time-code, or payment autocomplete data."
    );
  }

  return source;
}

function readSourceValue(source: LegendSource): string {
  if (source instanceof source.ownerDocument.defaultView!.HTMLSelectElement) {
    if (normalizeDisplayText(source.value) === "") {
      return "";
    }

    return normalizeDisplayText(
      source.selectedOptions.item(0)?.label ?? ""
    );
  }

  return normalizeDisplayText(source.value);
}

function createLegendSuffix(value: string, emptyText: string): string {
  const displayValue = value === "" ? emptyText : value;

  return displayValue === "" ? "" : ` — ${displayValue}`;
}

/**
 * Creates an opt-in addon that appends one committed, deliberately selected
 * control value to each item's generic legend and visible position.
 *
 * It creates no DOM, live region, lifecycle event, or import-time behavior.
 * The parent instance owns listener cleanup and restores the author target
 * text during removal, destroy, and transactional rollback.
 */
export function createLegendSyncAddon(
  options?: LegendSyncOptions
): RepeatableFieldsetAddon {
  const normalized = normalizeOptions(options);

  return Object.freeze({
    id: ADDON_ID,
    setupItem(context): RepeatableFieldsetCleanup {
      const view = context.root.ownerDocument.defaultView;

      if (view === null) {
        throw invalidOptions("the owning document must have a window.");
      }

      const item = context.item.element;
      const legend = getDirectLegend(item, view);
      const source = validateSource(
        getOnlyOwnedMatch(context, normalized.source, "source"),
        item,
        legend,
        view
      );
      const target = validateTarget(
        getOnlyOwnedMatch(context, normalized.target, "target"),
        item,
        view
      );
      const initialText = target.textContent ?? "";
      let active = true;
      const update = (): void => {
        target.textContent = createLegendSuffix(
          readSourceValue(source),
          normalized.emptyText
        );
      };

      source.addEventListener(normalized.updateOn, update);

      try {
        update();
      } catch (error) {
        source.removeEventListener(normalized.updateOn, update);

        try {
          target.textContent = initialText;
        } catch {
          // Preserve the original setup failure; the listener is already gone.
        }

        throw error;
      }

      return () => {
        if (!active) {
          return;
        }

        active = false;
        source.removeEventListener(normalized.updateOn, update);
        target.textContent = initialText;
      };
    }
  } satisfies RepeatableFieldsetAddon);
}
