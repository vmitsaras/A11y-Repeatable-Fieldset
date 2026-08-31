import type {
  RepeatableFieldsetAddon,
  RepeatableFieldsetItemAddonContext
} from "../addons";

const ADDON_ID = "a11y-repeatable-fieldset.accessible-reorder";
const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const ALLOWED_OPTION_KEYS = new Set([
  "moveUpLabel",
  "moveDownLabel"
]);

export const ACCESSIBLE_REORDER_ATTRIBUTES = Object.freeze({
  controls: "data-a11y-repeatable-fieldset-reorder-controls",
  moveUp: "data-a11y-repeatable-fieldset-move-up",
  moveDown: "data-a11y-repeatable-fieldset-move-down"
} as const);

export interface AccessibleReorderOptions {
  readonly moveUpLabel?: string;
  readonly moveDownLabel?: string;
}

interface NormalizedAccessibleReorderOptions {
  readonly moveUpLabel: string;
  readonly moveDownLabel: string;
}

function invalidOptions(message: string): TypeError {
  return new TypeError(`Accessible Reorder: ${message}`);
}

function normalizeLabel(
  value: unknown,
  name: keyof AccessibleReorderOptions,
  fallback: string
): string {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value !== "string" || value.trim() === "") {
    throw invalidOptions(`${name} must be a non-empty string.`);
  }

  return value.trim();
}

function normalizeOptions(
  options: AccessibleReorderOptions
): Readonly<NormalizedAccessibleReorderOptions> {
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
    throw invalidOptions(`unknown option \"${String(unknownKey)}\".`);
  }

  return Object.freeze({
    moveUpLabel: normalizeLabel(
      options.moveUpLabel,
      "moveUpLabel",
      "Move up"
    ),
    moveDownLabel: normalizeLabel(
      options.moveDownLabel,
      "moveDownLabel",
      "Move down"
    )
  });
}

function isHTMLElement(element: Element): element is HTMLElement {
  return element.namespaceURI === HTML_NAMESPACE;
}

function isHiddenOrInert(
  element: HTMLElement,
  boundary: HTMLFieldSetElement
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
  boundary: HTMLFieldSetElement
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

function findControlsTarget(
  context: Readonly<RepeatableFieldsetItemAddonContext>
): HTMLElement {
  const selector = `[${ACCESSIBLE_REORDER_ATTRIBUTES.controls}]`;
  const candidates = Array.from(
    context.item.element.querySelectorAll<Element>(selector)
  ).filter(
    (candidate) =>
      candidate.closest("[data-a11y-repeatable-fieldset-item]") ===
        context.item.element &&
      candidate.closest("[data-a11y-repeatable-fieldset]") === context.root
  );

  if (candidates.length !== 1 || !isHTMLElement(candidates[0]!)) {
    throw invalidOptions(
      "every item must contain exactly one owned HTML reorder-controls target."
    );
  }

  const target = candidates[0];

  if (
    target.closest("legend") !== null ||
    isHiddenOrInert(target, context.item.element) ||
    isInsideLiveOutput(target, context.item.element) ||
    target.childNodes.length !== 0
  ) {
    throw invalidOptions(
      "the reorder-controls target must be empty, exposed, outside the legend, and outside live output."
    );
  }

  return target;
}

function createMoveButton(
  context: Readonly<RepeatableFieldsetItemAddonContext>,
  attribute: string,
  label: string,
  direction: "up" | "down"
): HTMLButtonElement {
  const button = context.root.ownerDocument.createElement("button");
  button.type = "button";
  button.setAttribute(attribute, "");
  button.className =
    `a11y-repeatable-fieldset__move a11y-repeatable-fieldset__move--${direction}`;
  button.textContent = label;
  return button;
}

/**
 * Adds native adjacent-move controls while core owns every structural change.
 */
export function createAccessibleReorder(
  options: AccessibleReorderOptions = {}
): RepeatableFieldsetAddon {
  const normalized = normalizeOptions(options);

  return Object.freeze({
    id: ADDON_ID,
    setupItem(context) {
      const target = findControlsTarget(context);
      const moveUp = createMoveButton(
        context,
        ACCESSIBLE_REORDER_ATTRIBUTES.moveUp,
        normalized.moveUpLabel,
        "up"
      );
      const moveDown = createMoveButton(
        context,
        ACCESSIBLE_REORDER_ATTRIBUTES.moveDown,
        normalized.moveDownLabel,
        "down"
      );
      const moveUpItem = (): void => {
        context.instance.move(context.item.element, "up");
      };
      const moveDownItem = (): void => {
        context.instance.move(context.item.element, "down");
      };

      moveUp.addEventListener("click", moveUpItem);
      moveDown.addEventListener("click", moveDownItem);

      try {
        target.append(moveUp, moveDown);
      } catch (error) {
        moveUp.removeEventListener("click", moveUpItem);
        moveDown.removeEventListener("click", moveDownItem);
        moveUp.remove();
        moveDown.remove();
        throw error;
      }

      let active = true;

      return () => {
        if (!active) {
          return;
        }

        active = false;
        moveUp.removeEventListener("click", moveUpItem);
        moveDown.removeEventListener("click", moveDownItem);
        moveUp.remove();
        moveDown.remove();
      };
    }
  } satisfies RepeatableFieldsetAddon);
}
