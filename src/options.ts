import { ATTRIBUTES, DEFAULT_OPTIONS } from "./constants";
import type { RepeatableFieldsetAddon } from "./addons";
import { RepeatableFieldsetError } from "./errors";
import type { RepeatableFieldsetKeyFactory } from "./keys";
import type {
  RepeatableFieldsetMessageFormatters
} from "./messages";

export interface RepeatableFieldsetOptions {
  readonly minimum?: number;
  readonly maximum?: number | null;
  readonly itemLabel?: string;
  readonly focusOnAdd?: boolean;
  readonly announceChanges?: boolean;
  readonly keyFactory?: RepeatableFieldsetKeyFactory;
  readonly messageFormatters?: Partial<RepeatableFieldsetMessageFormatters>;
  /** JavaScript-only opt-in addon values; datasets cannot configure addons. */
  readonly addons?: readonly RepeatableFieldsetAddon[];
}

export interface NormalizedRepeatableFieldsetOptions {
  readonly minimum: number;
  readonly maximum: number | null;
  readonly itemLabel: string;
  readonly focusOnAdd: boolean;
  readonly announceChanges: boolean;
  readonly keyFactory?: RepeatableFieldsetKeyFactory;
  readonly messageFormatters: Readonly<RepeatableFieldsetMessageFormatters>;
  readonly addons?: readonly RepeatableFieldsetAddon[];
}

type OptionName = keyof RepeatableFieldsetOptions;

function invalidOptions(
  root: HTMLElement,
  message: string
): RepeatableFieldsetError {
  return new RepeatableFieldsetError("invalid-options", message, { root });
}

function hasJavaScriptValue(
  options: RepeatableFieldsetOptions,
  name: OptionName
): boolean {
  return options[name] !== undefined;
}

function readDatasetValue(
  root: HTMLElement,
  attribute: string
): string | undefined {
  return root.hasAttribute(attribute)
    ? (root.getAttribute(attribute) ?? "")
    : undefined;
}

function parseJavaScriptInteger(
  root: HTMLElement,
  name: "minimum" | "maximum",
  value: unknown
): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 0
  ) {
    throw invalidOptions(
      root,
      `The JavaScript option "${name}" must be a non-negative safe integer.`
    );
  }

  return value;
}

function parseDatasetInteger(
  root: HTMLElement,
  attribute: string,
  value: string
): number {
  const trimmed = value.trim();

  if (!/^\d+$/.test(trimmed)) {
    throw invalidOptions(
      root,
      `The ${attribute} attribute must be a non-negative integer.`
    );
  }

  const parsed = Number(trimmed);

  if (!Number.isSafeInteger(parsed)) {
    throw invalidOptions(
      root,
      `The ${attribute} attribute must be a safe integer.`
    );
  }

  return parsed;
}

function parseJavaScriptBoolean(
  root: HTMLElement,
  name: "focusOnAdd" | "announceChanges",
  value: unknown
): boolean {
  if (typeof value !== "boolean") {
    throw invalidOptions(
      root,
      `The JavaScript option "${name}" must be a boolean.`
    );
  }

  return value;
}

function parseDatasetBoolean(
  root: HTMLElement,
  attribute: string,
  value: string
): boolean {
  const trimmed = value.trim();

  if (trimmed === "true") {
    return true;
  }

  if (trimmed === "false") {
    return false;
  }

  throw invalidOptions(
    root,
    `The ${attribute} attribute must be the string "true" or "false".`
  );
}

function parseItemLabel(
  root: HTMLElement,
  source: string,
  value: unknown
): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw invalidOptions(root, `${source} must be a non-empty string.`);
  }

  return value.trim();
}

function normalizeMinimum(
  root: HTMLElement,
  options: RepeatableFieldsetOptions
): number {
  if (hasJavaScriptValue(options, "minimum")) {
    return parseJavaScriptInteger(root, "minimum", options.minimum);
  }

  const datasetValue = readDatasetValue(root, ATTRIBUTES.minimum);

  return datasetValue === undefined
    ? DEFAULT_OPTIONS.minimum
    : parseDatasetInteger(root, ATTRIBUTES.minimum, datasetValue);
}

function normalizeMaximum(
  root: HTMLElement,
  options: RepeatableFieldsetOptions
): number | null {
  if (hasJavaScriptValue(options, "maximum")) {
    return options.maximum === null
      ? null
      : parseJavaScriptInteger(root, "maximum", options.maximum);
  }

  const datasetValue = readDatasetValue(root, ATTRIBUTES.maximum);

  return datasetValue === undefined
    ? DEFAULT_OPTIONS.maximum
    : parseDatasetInteger(root, ATTRIBUTES.maximum, datasetValue);
}

function normalizeItemLabel(
  root: HTMLElement,
  options: RepeatableFieldsetOptions
): string {
  if (hasJavaScriptValue(options, "itemLabel")) {
    return parseItemLabel(
      root,
      'The JavaScript option "itemLabel"',
      options.itemLabel
    );
  }

  const datasetValue = readDatasetValue(root, ATTRIBUTES.itemLabel);

  return datasetValue === undefined
    ? DEFAULT_OPTIONS.itemLabel
    : parseItemLabel(
        root,
        `The ${ATTRIBUTES.itemLabel} attribute`,
        datasetValue
      );
}

function normalizeBoolean(
  root: HTMLElement,
  options: RepeatableFieldsetOptions,
  name: "focusOnAdd" | "announceChanges",
  attribute: string,
  fallback: boolean
): boolean {
  if (hasJavaScriptValue(options, name)) {
    return parseJavaScriptBoolean(root, name, options[name]);
  }

  const datasetValue = readDatasetValue(root, attribute);

  return datasetValue === undefined
    ? fallback
    : parseDatasetBoolean(root, attribute, datasetValue);
}

function normalizeKeyFactory(
  root: HTMLElement,
  options: RepeatableFieldsetOptions
): RepeatableFieldsetKeyFactory | undefined {
  if (options.keyFactory === undefined) {
    return undefined;
  }

  if (typeof options.keyFactory !== "function") {
    throw invalidOptions(
      root,
      'The JavaScript option "keyFactory" must be a function.'
    );
  }

  return options.keyFactory;
}

function normalizeAddons(
  root: HTMLElement,
  options: RepeatableFieldsetOptions
): readonly RepeatableFieldsetAddon[] | undefined {
  const supplied = options.addons;

  if (supplied === undefined) {
    return undefined;
  }

  if (!Array.isArray(supplied)) {
    throw invalidOptions(
      root,
      'The JavaScript option "addons" must be an array.'
    );
  }

  const ids = new Set<string>();

  for (const candidate of supplied) {
    if (
      candidate === null ||
      typeof candidate !== "object" ||
      Array.isArray(candidate)
    ) {
      throw invalidOptions(
        root,
        'Every JavaScript addon must be an object.'
      );
    }

    const addon = candidate as Partial<RepeatableFieldsetAddon>;

    if (
      typeof addon.id !== "string" ||
      addon.id.trim() === "" ||
      addon.id !== addon.id.trim()
    ) {
      throw invalidOptions(
        root,
        'Every JavaScript addon must have a trimmed, non-empty id.'
      );
    }

    if (
      addon.setup !== undefined &&
      typeof addon.setup !== "function"
    ) {
      throw invalidOptions(
        root,
        `The addon "${addon.id}" setup hook must be a function.`
      );
    }

    if (
      addon.setupItem !== undefined &&
      typeof addon.setupItem !== "function"
    ) {
      throw invalidOptions(
        root,
        `The addon "${addon.id}" item setup hook must be a function.`
      );
    }

    if (ids.has(addon.id)) {
      throw invalidOptions(
        root,
        `The JavaScript option "addons" contains duplicate id "${addon.id}".`
      );
    }

    ids.add(addon.id);
  }

  return Object.freeze([...supplied]);
}

const MESSAGE_FORMATTER_NAMES = Object.freeze([
  "added",
  "removed",
  "restored",
  "duplicated",
  "moved",
  "moveBoundary",
  "maximum",
  "minimum"
] as const);

type MessageFormatterName =
  (typeof MESSAGE_FORMATTER_NAMES)[number];

function resolveMessageFormatter<
  Formatter extends (...arguments_: never[]) => string
>(
  root: HTMLElement,
  supplied: Partial<RepeatableFieldsetMessageFormatters>,
  name: MessageFormatterName,
  fallback: Formatter
): Formatter {
  if (!Object.prototype.hasOwnProperty.call(supplied, name)) {
    return fallback;
  }

  const formatter: unknown = supplied[name];

  if (typeof formatter !== "function") {
    throw invalidOptions(
      root,
      `The JavaScript message formatter "${name}" must be a function.`
    );
  }

  return formatter as Formatter;
}

function normalizeMessageFormatters(
  root: HTMLElement,
  options: RepeatableFieldsetOptions
): Readonly<RepeatableFieldsetMessageFormatters> {
  const supplied = options.messageFormatters;

  if (supplied === undefined) {
    return DEFAULT_OPTIONS.messageFormatters;
  }

  if (
    supplied === null ||
    typeof supplied !== "object" ||
    Array.isArray(supplied)
  ) {
    throw invalidOptions(
      root,
      'The JavaScript option "messageFormatters" must be an object.'
    );
  }

  const suppliedKeys = Reflect.ownKeys(supplied);

  if (
    suppliedKeys.some(
      (key) =>
        typeof key !== "string" ||
        !MESSAGE_FORMATTER_NAMES.includes(
          key as MessageFormatterName
        )
    )
  ) {
    throw invalidOptions(
      root,
      'The JavaScript option "messageFormatters" contains an unknown formatter.'
    );
  }

  return Object.freeze({
    added: resolveMessageFormatter(
      root,
      supplied,
      "added",
      DEFAULT_OPTIONS.messageFormatters.added
    ),
    removed: resolveMessageFormatter(
      root,
      supplied,
      "removed",
      DEFAULT_OPTIONS.messageFormatters.removed
    ),
    restored: resolveMessageFormatter(
      root,
      supplied,
      "restored",
      DEFAULT_OPTIONS.messageFormatters.restored
    ),
    duplicated: resolveMessageFormatter(
      root,
      supplied,
      "duplicated",
      DEFAULT_OPTIONS.messageFormatters.duplicated
    ),
    moved: resolveMessageFormatter(
      root,
      supplied,
      "moved",
      DEFAULT_OPTIONS.messageFormatters.moved
    ),
    moveBoundary: resolveMessageFormatter(
      root,
      supplied,
      "moveBoundary",
      DEFAULT_OPTIONS.messageFormatters.moveBoundary
    ),
    maximum: resolveMessageFormatter(
      root,
      supplied,
      "maximum",
      DEFAULT_OPTIONS.messageFormatters.maximum
    ),
    minimum: resolveMessageFormatter(
      root,
      supplied,
      "minimum",
      DEFAULT_OPTIONS.messageFormatters.minimum
    )
  });
}

/**
 * Normalizes safe primitive datasets and JavaScript-only callback options
 * without changing the root or caller input.
 */
export function normalizeRepeatableFieldsetOptions(
  root: HTMLElement,
  options: RepeatableFieldsetOptions = {}
): Readonly<NormalizedRepeatableFieldsetOptions> {
  if (
    options === null ||
    typeof options !== "object" ||
    Array.isArray(options)
  ) {
    throw invalidOptions(root, "JavaScript options must be an object.");
  }

  const minimum = normalizeMinimum(root, options);
  const maximum = normalizeMaximum(root, options);

  if (maximum !== null && maximum < minimum) {
    throw invalidOptions(
      root,
      'The normalized "maximum" option must be greater than or equal to "minimum".'
    );
  }

  const normalized = {
    minimum,
    maximum,
    itemLabel: normalizeItemLabel(root, options),
    focusOnAdd: normalizeBoolean(
      root,
      options,
      "focusOnAdd",
      ATTRIBUTES.focusOnAdd,
      DEFAULT_OPTIONS.focusOnAdd
    ),
    announceChanges: normalizeBoolean(
      root,
      options,
      "announceChanges",
      ATTRIBUTES.announceChanges,
      DEFAULT_OPTIONS.announceChanges
    ),
    messageFormatters: normalizeMessageFormatters(root, options)
  };
  const keyFactory = normalizeKeyFactory(root, options);
  const addons = normalizeAddons(root, options);

  return Object.freeze({
    ...normalized,
    ...(keyFactory === undefined ? {} : { keyFactory }),
    ...(addons === undefined ? {} : { addons })
  });
}
