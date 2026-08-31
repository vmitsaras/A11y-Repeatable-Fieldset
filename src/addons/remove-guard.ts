import type {
  RepeatableFieldsetAddon,
  RepeatableFieldsetRemoveRequest
} from "../addons";

const ADDON_ID = "a11y-repeatable-fieldset.remove-guard";
const ALLOWED_OPTION_KEYS = new Set([
  "shouldConfirm",
  "confirm",
  "onError"
]);

/** Structural-only context supplied to Remove Guard policy callbacks. */
export interface RemoveGuardContext {
  readonly instance: RepeatableFieldsetRemoveRequest["instance"];
  readonly root: HTMLElement;
  readonly item: RepeatableFieldsetRemoveRequest["item"];
  readonly trigger: HTMLButtonElement;
}

/** Decides synchronously whether this control request needs confirmation. */
export type RemoveGuardShouldConfirm = (
  context: Readonly<RemoveGuardContext>
) => boolean;

/**
 * Requests approval through a native dialog or an application-owned custom
 * dialog. Rejection, `false`, or invalid output leaves the item untouched.
 */
export type RemoveGuardConfirm = (
  context: Readonly<RemoveGuardContext>
) => boolean | PromiseLike<boolean>;

/** Receives policy or confirmation failures after removal has been aborted. */
export type RemoveGuardErrorHandler = (
  error: unknown,
  context: Readonly<RemoveGuardContext>
) => void;

/** Explicit application policy for the opt-in Remove Guard addon. */
export interface RemoveGuardOptions {
  /**
   * Inspects only the state the application deliberately chooses to inspect.
   * The addon itself never reads form-control values.
   */
  readonly shouldConfirm: RemoveGuardShouldConfirm;
  /** Requests synchronous or asynchronous approval when policy returns true. */
  readonly confirm: RemoveGuardConfirm;
  /** Optional diagnostic callback. Errors fail closed even when omitted. */
  readonly onError?: RemoveGuardErrorHandler;
}

function invalidOptions(message: string): TypeError {
  return new TypeError(`Remove Guard: ${message}`);
}

function normalizeOptions(
  options: RemoveGuardOptions
): Readonly<RemoveGuardOptions> {
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

  if (typeof options.shouldConfirm !== "function") {
    throw invalidOptions("shouldConfirm must be a function.");
  }

  if (typeof options.confirm !== "function") {
    throw invalidOptions("confirm must be a function.");
  }

  if (options.onError !== undefined && typeof options.onError !== "function") {
    throw invalidOptions("onError must be a function when supplied.");
  }

  return Object.freeze({
    shouldConfirm: options.shouldConfirm,
    confirm: options.confirm,
    ...(options.onError === undefined ? {} : { onError: options.onError })
  });
}

function createContext(
  request: Readonly<RepeatableFieldsetRemoveRequest>
): Readonly<RemoveGuardContext> {
  return Object.freeze({
    instance: request.instance,
    root: request.root,
    item: request.item,
    trigger: request.trigger
  });
}

/**
 * Creates an opt-in control-request guard without changing lifecycle events.
 *
 * Public `instance.remove()` calls are already-approved commands and bypass
 * this addon. A control request is approved through its single-use command,
 * which revalidates ownership and the current minimum when approval arrives.
 */
export function createRemoveGuard(
  options: RemoveGuardOptions
): RepeatableFieldsetAddon {
  const normalized = normalizeOptions(options);

  return Object.freeze({
    id: ADDON_ID,
    setup(context) {
      let active = true;
      const pendingItems = new Set<HTMLFieldSetElement>();
      const reportError = (
        error: unknown,
        guardContext: Readonly<RemoveGuardContext>
      ): void => {
        if (!active || normalized.onError === undefined) {
          return;
        }

        try {
          normalized.onError(error, guardContext);
        } catch {
          // Diagnostics never turn a denied/failed request into removal.
        }
      };
      const settle = (
        decision: unknown,
        request: Readonly<RepeatableFieldsetRemoveRequest>,
        guardContext: Readonly<RemoveGuardContext>
      ): void => {
        pendingItems.delete(request.item.element);

        if (!active) {
          return;
        }

        if (typeof decision !== "boolean") {
          reportError(
            invalidOptions("confirm must return or resolve to a boolean."),
            guardContext
          );
          return;
        }

        if (decision) {
          request.remove();
        }
      };

      context.onRemoveRequest((request) => {
        if (!active || pendingItems.has(request.item.element)) {
          return;
        }

        const guardContext = createContext(request);
        let shouldConfirm: unknown;

        try {
          shouldConfirm = normalized.shouldConfirm(guardContext);
        } catch (error) {
          reportError(error, guardContext);
          return;
        }

        if (typeof shouldConfirm !== "boolean") {
          reportError(
            invalidOptions("shouldConfirm must return a boolean."),
            guardContext
          );
          return;
        }

        if (!shouldConfirm) {
          request.remove();
          return;
        }

        pendingItems.add(request.item.element);
        let confirmation: boolean | PromiseLike<boolean>;

        try {
          confirmation = normalized.confirm(guardContext);
        } catch (error) {
          pendingItems.delete(request.item.element);
          reportError(error, guardContext);
          return;
        }

        if (typeof confirmation === "boolean") {
          settle(confirmation, request, guardContext);
          return;
        }

        void Promise.resolve(confirmation).then(
          (decision) => {
            settle(decision, request, guardContext);
          },
          (error: unknown) => {
            pendingItems.delete(request.item.element);
            reportError(error, guardContext);
          }
        );
      });

      return () => {
        active = false;
        pendingItems.clear();
      };
    }
  } satisfies RepeatableFieldsetAddon);
}
