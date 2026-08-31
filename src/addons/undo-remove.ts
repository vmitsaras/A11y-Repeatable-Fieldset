import type {
  RepeatableFieldsetAddon,
  RepeatableFieldsetRemovalRestoration
} from "../addons";
import { EVENTS } from "../constants";
import type {
  RepeatableFieldsetRestoreStateContext
} from "../operations";

const ADDON_ID = "a11y-repeatable-fieldset.undo-remove";
const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const SLOT_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const DEFAULT_EXPIRY_MS = 30_000;
const MINIMUM_EXPIRY_MS = 1_000;
const MAXIMUM_EXPIRY_MS = 600_000;
const ALLOWED_OPTION_KEYS = new Set(["buttonLabel", "expiryMs"]);
const SUPPORTED_VALUE_INPUT_TYPES = new Set([
  "text",
  "search",
  "email",
  "tel",
  "url",
  "number",
  "range",
  "date",
  "month",
  "week",
  "time",
  "datetime-local",
  "color"
]);
const SENSITIVE_AUTOCOMPLETE_TOKENS = new Set([
  "username",
  "current-password",
  "new-password",
  "one-time-code",
  "webauthn"
]);

export const UNDO_REMOVE_ATTRIBUTES = Object.freeze({
  controls: "data-a11y-repeatable-fieldset-undo-controls",
  button: "data-a11y-repeatable-fieldset-undo",
  state: "data-a11y-repeatable-fieldset-undo-state"
} as const);

export interface UndoRemoveOptions {
  readonly buttonLabel?: string;
  readonly expiryMs?: number;
}

type StateControl =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

type ControlState =
  | Readonly<{
      slot: string;
      kind: string;
      value: string;
    }>
  | Readonly<{
      slot: string;
      kind: string;
      checked: boolean;
    }>
  | Readonly<{
      slot: string;
      kind: string;
      values: readonly string[];
    }>;

interface PendingUndo {
  readonly restoration: Readonly<RepeatableFieldsetRemovalRestoration>;
  readonly states: readonly ControlState[];
  expiresAt: number;
  remainingMs: number;
}

function invalidOptions(message: string): TypeError {
  return new TypeError(`Undo Remove: ${message}`);
}

function normalizeOptions(
  options: UndoRemoveOptions
): Readonly<Required<UndoRemoveOptions>> {
  if (
    typeof options !== "object" ||
    options === null ||
    Array.isArray(options)
  ) {
    throw invalidOptions("options must be an object.");
  }

  const unknownKey = Reflect.ownKeys(options).find(
    (key) => typeof key !== "string" || !ALLOWED_OPTION_KEYS.has(key)
  );

  if (unknownKey !== undefined) {
    throw invalidOptions(`unknown option "${String(unknownKey)}".`);
  }

  if (
    options.buttonLabel !== undefined &&
    (typeof options.buttonLabel !== "string" ||
      options.buttonLabel.trim() === "")
  ) {
    throw invalidOptions("buttonLabel must be a non-empty string.");
  }

  if (
    options.expiryMs !== undefined &&
    (!Number.isSafeInteger(options.expiryMs) ||
      options.expiryMs < MINIMUM_EXPIRY_MS ||
      options.expiryMs > MAXIMUM_EXPIRY_MS)
  ) {
    throw invalidOptions(
      `expiryMs must be a safe integer from ${MINIMUM_EXPIRY_MS} through ${MAXIMUM_EXPIRY_MS}.`
    );
  }

  return Object.freeze({
    buttonLabel: options.buttonLabel?.trim() ?? "Undo last removal",
    expiryMs: options.expiryMs ?? DEFAULT_EXPIRY_MS
  });
}

function isHTMLElement(element: Element): element is HTMLElement {
  return element.namespaceURI === HTML_NAMESPACE;
}

function isHiddenOrInert(
  element: HTMLElement,
  boundary: HTMLElement
): boolean {
  let current: Element | null = element;

  while (current !== null) {
    if (
      current.hasAttribute("hidden") ||
      current.hasAttribute("inert") ||
      current.getAttribute("aria-hidden")?.trim().toLowerCase() === "true"
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

function isInsideLiveOutput(
  element: HTMLElement,
  boundary: HTMLElement
): boolean {
  let current: Element | null = element;

  while (current !== null && current !== boundary) {
    const role = current.getAttribute("role")?.trim().toLowerCase();
    const live = current.getAttribute("aria-live")?.trim().toLowerCase();

    if (
      role === "status" ||
      role === "alert" ||
      (live !== undefined && live !== "" && live !== "off")
    ) {
      return true;
    }

    current = current.parentElement;
  }

  return false;
}

function findControlsTarget(root: HTMLElement): HTMLElement {
  const selector = `[${UNDO_REMOVE_ATTRIBUTES.controls}]`;
  const candidates = Array.from(
    root.querySelectorAll<Element>(selector)
  ).filter(
    (candidate) =>
      candidate.closest("[data-a11y-repeatable-fieldset]") === root
  );

  if (candidates.length !== 1 || !isHTMLElement(candidates[0]!)) {
    throw invalidOptions(
      "the root must contain exactly one owned HTML undo-controls target."
    );
  }

  const target = candidates[0];

  if (
    target.closest("[data-a11y-repeatable-fieldset-item]") !== null ||
    target.closest("template") !== null ||
    isHiddenOrInert(target, root) ||
    isInsideLiveOutput(target, root) ||
    target.childNodes.length !== 0
  ) {
    throw invalidOptions(
      "the undo-controls target must be empty, exposed, outside items, templates, and live output."
    );
  }

  return target;
}

function autocompleteTokens(control: StateControl): readonly string[] {
  return Object.freeze(
    (control.getAttribute("autocomplete") ?? "")
      .trim()
      .toLowerCase()
      .split(/[\t\n\f\r ]+/)
      .filter(Boolean)
  );
}

function hasSensitiveAutocomplete(control: StateControl): boolean {
  return autocompleteTokens(control).some(
    (token) =>
      SENSITIVE_AUTOCOMPLETE_TOKENS.has(token) ||
      token.startsWith("cc-") ||
      token.startsWith("transaction-")
  );
}

function asStateControl(
  element: Element,
  item: HTMLFieldSetElement
): StateControl {
  if (
    !isHTMLElement(element) ||
    (element.localName !== "input" &&
      element.localName !== "select" &&
      element.localName !== "textarea")
  ) {
    throw invalidOptions(
      "state markers are supported only on native HTML input, select, and textarea controls."
    );
  }

  const control = element as StateControl;

  if (
    isHiddenOrInert(control, item) ||
    control.matches(":disabled") ||
    control.hasAttribute("disabled")
  ) {
    throw invalidOptions(
      "hidden, inert, aria-hidden, and disabled controls cannot be retained."
    );
  }

  if (
    (control.localName === "input" || control.localName === "textarea") &&
    control.hasAttribute("readonly")
  ) {
    throw invalidOptions("readonly controls cannot be retained.");
  }

  if (hasSensitiveAutocomplete(control)) {
    throw invalidOptions(
      "credential, authentication-code, payment, and transaction fields cannot be retained."
    );
  }

  if (control.localName === "input") {
    const input = control as HTMLInputElement;

    if (input.type === "file") {
      throw invalidOptions("file controls can never be retained or restored.");
    }

    if (input.type === "password" || input.type === "hidden") {
      throw invalidOptions(
        `input type "${input.type}" cannot be retained.`
      );
    }

    if (
      input.type !== "checkbox" &&
      input.type !== "radio" &&
      !SUPPORTED_VALUE_INPUT_TYPES.has(input.type)
    ) {
      throw invalidOptions(
        `input type "${input.type}" cannot be retained.`
      );
    }
  }

  return control;
}

function controlKind(control: StateControl): string {
  if (control.localName === "input") {
    return `input:${(control as HTMLInputElement).type}`;
  }

  if (control.localName === "select") {
    return (control as HTMLSelectElement).multiple
      ? "select:multiple"
      : "select:single";
  }

  return "textarea";
}

function collectMarkedControls(
  item: HTMLFieldSetElement,
  root: HTMLElement | null
): ReadonlyMap<string, StateControl> {
  const selector = `[${UNDO_REMOVE_ATTRIBUTES.state}]`;
  const controls = new Map<string, StateControl>();
  const candidates = Array.from(item.querySelectorAll<Element>(selector))
    .filter(
      (candidate) =>
        candidate.closest("[data-a11y-repeatable-fieldset-item]") === item &&
        (root === null ||
          candidate.closest("[data-a11y-repeatable-fieldset]") === root)
    );

  for (const candidate of candidates) {
    const rawSlot = candidate.getAttribute(UNDO_REMOVE_ATTRIBUTES.state);
    const slot = rawSlot?.trim() ?? "";

    if (rawSlot !== slot || !SLOT_PATTERN.test(slot)) {
      throw invalidOptions(
        `state marker values must match ${SLOT_PATTERN.source}.`
      );
    }

    if (controls.has(slot)) {
      throw invalidOptions(
        `state marker "${slot}" must be unique within one item.`
      );
    }

    controls.set(slot, asStateControl(candidate, item));
  }

  return controls;
}

function isOptionDisabled(option: HTMLOptionElement): boolean {
  return option.disabled || option.closest("optgroup")?.disabled === true;
}

function captureStates(
  controls: ReadonlyMap<string, StateControl>
): readonly ControlState[] {
  const states: ControlState[] = [];

  for (const [slot, control] of controls) {
    const kind = controlKind(control);

    if (control.localName === "input") {
      const input = control as HTMLInputElement;

      states.push(Object.freeze(
        input.type === "checkbox" || input.type === "radio"
          ? { slot, kind, checked: input.checked }
          : { slot, kind, value: input.value }
      ));
      continue;
    }

    if (control.localName === "textarea") {
      states.push(Object.freeze({
        slot,
        kind,
        value: (control as HTMLTextAreaElement).value
      }));
      continue;
    }

    const values = Array.from(
      (control as HTMLSelectElement).selectedOptions
    )
      .filter((option) => !isOptionDisabled(option))
      .map((option) => option.value);
    states.push(Object.freeze({
      slot,
      kind,
      values: Object.freeze(values)
    }));
  }

  return Object.freeze(states);
}

function restoreSelectState(
  select: HTMLSelectElement,
  values: readonly string[]
): void {
  if (!select.multiple) {
    const value = values[0];

    if (value === undefined) {
      return;
    }

    const match = Array.from(select.options).find(
      (option) =>
        !isOptionDisabled(option) && option.value === value
    );

    if (match !== undefined) {
      match.selected = true;
    }

    return;
  }

  const remaining = new Map<string, number>();

  for (const value of values) {
    remaining.set(value, (remaining.get(value) ?? 0) + 1);
  }

  for (const option of select.options) {
    if (isOptionDisabled(option)) {
      continue;
    }

    const count = remaining.get(option.value) ?? 0;
    option.selected = count > 0;

    if (count > 0) {
      remaining.set(option.value, count - 1);
    }
  }
}

function restoreStates(
  states: readonly ControlState[],
  context: Readonly<RepeatableFieldsetRestoreStateContext>
): void {
  const controls = collectMarkedControls(context.candidate, null);

  for (const state of states) {
    const control = controls.get(state.slot);

    if (
      control === undefined ||
      controlKind(control) !== state.kind
    ) {
      throw invalidOptions(
        `the trusted template does not provide a matching state marker "${state.slot}".`
      );
    }

    if ("checked" in state) {
      (control as HTMLInputElement).checked = state.checked;
    } else if ("values" in state) {
      restoreSelectState(control as HTMLSelectElement, state.values);
    } else if (control.localName === "textarea") {
      (control as HTMLTextAreaElement).value = state.value;
    } else {
      (control as HTMLInputElement).value = state.value;
    }
  }
}

function findTemplateItem(root: HTMLElement): HTMLFieldSetElement {
  const template = Array.from(
    root.querySelectorAll<HTMLTemplateElement>(
      "template[data-a11y-repeatable-fieldset-template]"
    )
  ).find(
    (candidate) =>
      candidate.closest("[data-a11y-repeatable-fieldset]") === root
  );
  const candidates = template === undefined
    ? []
    : Array.from(
        template.content.querySelectorAll<HTMLFieldSetElement>(
          "fieldset[data-a11y-repeatable-fieldset-item]"
        )
      );

  if (candidates.length !== 1) {
    throw invalidOptions(
      "the trusted template must contain one item for state restoration."
    );
  }

  return candidates[0]!;
}

/**
 * Adds one short-lived native Undo button per root. Structure is restored by
 * the core from the trusted template with the removed reserved key; the addon
 * retains only explicitly marked, nonsensitive current control state.
 */
export function createUndoRemove(
  options: UndoRemoveOptions = {}
): RepeatableFieldsetAddon {
  const normalized = normalizeOptions(options);

  return Object.freeze({
    id: ADDON_ID,
    setup(context) {
      const target = findControlsTarget(context.root);
      collectMarkedControls(findTemplateItem(context.root), null);
      const button = context.root.ownerDocument.createElement("button");
      const ownerWindow = context.root.ownerDocument.defaultView;
      let pending: PendingUndo | null = null;
      let timer: number | null = null;

      button.type = "button";
      button.hidden = true;
      button.className = "a11y-repeatable-fieldset__undo";
      button.setAttribute(UNDO_REMOVE_ATTRIBUTES.button, "");
      button.textContent = normalized.buttonLabel;

      const cancelTimer = (): void => {
        if (timer !== null) {
          ownerWindow?.clearTimeout(timer);
          timer = null;
        }
      };
      const clearPending = (): void => {
        cancelTimer();
        pending = null;
        button.hidden = true;
        button.disabled = false;
      };
      const expire = (): void => {
        if (context.root.ownerDocument.activeElement === button) {
          return;
        }
        clearPending();
      };
      const schedule = (delay: number): void => {
        cancelTimer();

        if (pending === null) {
          return;
        }

        pending.remainingMs = delay;
        pending.expiresAt = Date.now() + delay;
        timer = ownerWindow?.setTimeout(expire, delay) ?? null;
      };
      const installPending = (
        value: PendingUndo,
        delay: number
      ): void => {
        pending = value;
        button.hidden = false;
        button.disabled = !context.instance.canAdd();
        button.removeAttribute("aria-disabled");

        if (context.root.ownerDocument.activeElement !== button) {
          schedule(delay);
        }
      };
      const synchronize = (): void => {
        if (pending !== null) {
          button.disabled = !context.instance.canAdd();
          button.removeAttribute("aria-disabled");
        }
      };
      const pauseExpiry = (): void => {
        if (pending === null) {
          return;
        }

        pending.remainingMs = Math.max(
          1,
          pending.expiresAt - Date.now()
        );
        cancelTimer();
      };
      const resumeExpiry = (): void => {
        if (pending !== null) {
          schedule(pending.remainingMs);
        }
      };
      const undo = (): void => {
        const current = pending;

        if (current === null) {
          return;
        }

        const result = current.restoration.restore({
          focus: true,
          restoreState: (restoreContext) => {
            restoreStates(current.states, restoreContext);
          }
        });

        if (result.ok) {
          clearPending();
          return;
        }

        if (result.reason === "maximum") {
          synchronize();
          return;
        }

        clearPending();
      };

      context.on(EVENTS.init, synchronize);
      context.on(EVENTS.itemAdded, synchronize);
      context.on(EVENTS.itemDuplicated, synchronize);
      context.on(EVENTS.itemRemoved, synchronize);
      context.on(EVENTS.itemRestored, synchronize);
      context.onRemovePreparation((preparationContext) => {
        const controls = collectMarkedControls(
          preparationContext.item.element,
          context.root
        );
        const states = captureStates(controls);
        let previous: PendingUndo | null = null;
        let committed = false;

        return Object.freeze({
          commit(): void {
            previous = pending;
            cancelTimer();
            committed = true;
            installPending(
              {
                restoration: preparationContext.restoration,
                states,
                expiresAt: Date.now() + normalized.expiryMs,
                remainingMs: normalized.expiryMs
              },
              normalized.expiryMs
            );
          },
          rollback(): void {
            if (!committed) {
              return;
            }

            clearPending();

            if (previous !== null) {
              const remaining = Math.max(
                1,
                previous.expiresAt - Date.now()
              );
              installPending(previous, remaining);
            }
          }
        });
      });

      button.addEventListener("click", undo);
      button.addEventListener("focus", pauseExpiry);
      button.addEventListener("blur", resumeExpiry);

      try {
        target.append(button);
      } catch (error) {
        clearPending();
        button.removeEventListener("click", undo);
        button.removeEventListener("focus", pauseExpiry);
        button.removeEventListener("blur", resumeExpiry);
        button.remove();
        throw error;
      }

      return () => {
        clearPending();
        button.removeEventListener("click", undo);
        button.removeEventListener("focus", pauseExpiry);
        button.removeEventListener("blur", resumeExpiry);
        button.remove();
      };
    },
    setupItem(context) {
      const templateControls = collectMarkedControls(
        findTemplateItem(context.root),
        null
      );
      const itemControls = collectMarkedControls(
        context.item.element,
        context.root
      );

      for (const [slot, control] of itemControls) {
        const templateControl = templateControls.get(slot);

        if (
          templateControl === undefined ||
          controlKind(templateControl) !== controlKind(control)
        ) {
          throw invalidOptions(
            `state marker "${slot}" must have a matching control kind in the trusted template.`
          );
        }
      }
    }
  } satisfies RepeatableFieldsetAddon);
}
