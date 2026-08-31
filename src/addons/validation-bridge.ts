import type {
  RepeatableFieldsetAddon,
  RepeatableFieldsetCleanup,
  RepeatableFieldsetItemAddonContext
} from "../addons";

/**
 * Item-scoped context passed to an application's validation adapter.
 *
 * The item snapshot contains structural identity only. Validation state,
 * error content, field values, and summary ownership remain outside the
 * repeatable-fieldset package.
 */
export interface ValidationBridgeItemContext {
  readonly instance: RepeatableFieldsetItemAddonContext["instance"];
  readonly root: HTMLElement;
  readonly item: RepeatableFieldsetItemAddonContext["item"];
  readonly phase: RepeatableFieldsetItemAddonContext["phase"];
}

/** Registers one existing or newly added item with an application validator. */
export type ValidationBridgeRegisterItem = (
  context: Readonly<ValidationBridgeItemContext>
) => void | RepeatableFieldsetCleanup;

/** Options for the dependency-free validation adapter bridge. */
export interface ValidationBridgeOptions {
  /**
   * Application-scoped addon ID. The core rejects duplicate IDs within one
   * repeatable-fieldset instance.
   */
  readonly id: string;
  /**
   * Registers one item exactly once for its phase. A returned cleanup must
   * unregister controls and remove adapter-owned errors and summary links.
   */
  readonly registerItem: ValidationBridgeRegisterItem;
}

function invalidOptions(message: string): TypeError {
  return new TypeError(`Validation Bridge: ${message}`);
}

/**
 * Creates an opt-in addon that maps repeatable-item lifecycle to a validator.
 *
 * The bridge imports no validation library and has no import-time DOM side
 * effects. The parent repeatable-fieldset instance owns every cleanup returned
 * by `registerItem`, runs it before item detachment, and runs it for retained
 * items during destroy.
 */
export function createValidationBridge(
  options: ValidationBridgeOptions
): RepeatableFieldsetAddon {
  if (
    typeof options !== "object" ||
    options === null ||
    Array.isArray(options)
  ) {
    throw invalidOptions("options must be an object.");
  }

  if (
    typeof options.id !== "string" ||
    options.id.trim() === "" ||
    options.id !== options.id.trim()
  ) {
    throw invalidOptions("id must be a trimmed, non-empty string.");
  }

  if (typeof options.registerItem !== "function") {
    throw invalidOptions("registerItem must be a function.");
  }

  const id = options.id;
  const registerItem = options.registerItem;

  return Object.freeze({
    id,
    setupItem(context): void | RepeatableFieldsetCleanup {
      const bridgeContext = Object.freeze({
        instance: context.instance,
        root: context.root,
        item: context.item,
        phase: context.phase
      } satisfies ValidationBridgeItemContext);

      return registerItem(bridgeContext);
    }
  } satisfies RepeatableFieldsetAddon);
}
