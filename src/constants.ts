import { DEFAULT_MESSAGE_FORMATTERS } from "./messages";

export const COMPONENT_NAME = "a11y-repeatable-fieldset" as const;

export const TEMPLATE_KEY_TOKEN = "__A11Y_REPEATABLE_KEY__" as const;

export const GENERATED_KEY_PREFIX = "item-" as const;

export const ITEM_KEY_PATTERN = Object.freeze(
  /^[A-Za-z0-9][A-Za-z0-9._:-]*$/
);

export const ATTRIBUTES = Object.freeze({
  root: "data-a11y-repeatable-fieldset",
  items: "data-a11y-repeatable-fieldset-items",
  item: "data-a11y-repeatable-fieldset-item",
  template: "data-a11y-repeatable-fieldset-template",
  add: "data-a11y-repeatable-fieldset-add",
  remove: "data-a11y-repeatable-fieldset-remove",
  key: "data-a11y-repeatable-fieldset-key",
  position: "data-a11y-repeatable-fieldset-position",
  focus: "data-a11y-repeatable-fieldset-focus",
  status: "data-a11y-repeatable-fieldset-status",
  minimum: "data-min-items",
  maximum: "data-max-items",
  itemLabel: "data-item-label",
  focusOnAdd: "data-focus-on-add",
  announceChanges: "data-announce-changes"
} as const);

export const SELECTORS = Object.freeze({
  root: `[${ATTRIBUTES.root}]`,
  items: `[${ATTRIBUTES.items}]`,
  item: `fieldset[${ATTRIBUTES.item}]`,
  template: `template[${ATTRIBUTES.template}]`,
  add: `[${ATTRIBUTES.add}]`,
  remove: `[${ATTRIBUTES.remove}]`,
  key: `[${ATTRIBUTES.key}]`,
  position: `[${ATTRIBUTES.position}]`,
  focus: `[${ATTRIBUTES.focus}]`,
  status: `[${ATTRIBUTES.status}]`,
  legend: "legend"
} as const);

/** Style-only BEM hooks. Runtime behavior must use ATTRIBUTES and SELECTORS. */
export const CLASSES = Object.freeze({
  root: "a11y-repeatable-fieldset",
  items: "a11y-repeatable-fieldset__items",
  item: "a11y-repeatable-fieldset__item",
  legend: "a11y-repeatable-fieldset__legend",
  controls: "a11y-repeatable-fieldset__controls",
  add: "a11y-repeatable-fieldset__add",
  remove: "a11y-repeatable-fieldset__remove",
  position: "a11y-repeatable-fieldset__position",
  limit: "a11y-repeatable-fieldset__limit",
  status: "a11y-repeatable-fieldset__status"
} as const);

export const DEFAULT_OPTIONS = Object.freeze({
  minimum: 1,
  maximum: null,
  itemLabel: "Item",
  focusOnAdd: true,
  announceChanges: true,
  messageFormatters: DEFAULT_MESSAGE_FORMATTERS
} as const);

export const TOKEN_ATTRIBUTES = Object.freeze({
  scalar: Object.freeze(["id", "name", "for", "list"] as const),
  idReference: Object.freeze([
    "aria-labelledby",
    "aria-describedby",
    "aria-controls",
    "headers"
  ] as const),
  hashOnly: Object.freeze(["href"] as const)
});

export const EVENT_DISPATCH_OPTIONS = Object.freeze({
  bubbles: true,
  composed: false,
  cancelable: false
} as const);

export const EVENTS = Object.freeze({
  init: `${COMPONENT_NAME}:init`,
  itemAdded: `${COMPONENT_NAME}:item-added`,
  itemDuplicated: `${COMPONENT_NAME}:item-duplicated`,
  itemRemoved: `${COMPONENT_NAME}:item-removed`,
  itemRestored: `${COMPONENT_NAME}:item-restored`,
  itemMoved: `${COMPONENT_NAME}:item-moved`,
  destroy: `${COMPONENT_NAME}:destroy`
} as const);

export type RepeatableFieldsetEventKey = keyof typeof EVENTS;

export type RepeatableFieldsetEventName =
  (typeof EVENTS)[RepeatableFieldsetEventKey];
