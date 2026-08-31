import { ATTRIBUTES, CLASSES } from "./constants";
import { RepeatableFieldsetError } from "./errors";

export const STATUS_CLEAR_DELAY_MS = 5000;

const MANAGED_ATTRIBUTES = Object.freeze([
  "role",
  "aria-live",
  "aria-atomic"
] as const);

interface ManagedAttributeState {
  readonly name: (typeof MANAGED_ATTRIBUTES)[number];
  readonly value: string | null;
}

export interface RepeatableFieldsetStatusController {
  readonly region: HTMLElement | null;
  write(message: string): void;
  destroy(): void;
}

function restoreManagedAttributes(
  region: HTMLElement,
  states: readonly ManagedAttributeState[]
): void {
  for (const state of states) {
    try {
      if (state.value === null) {
        region.removeAttribute(state.name);
      } else {
        region.setAttribute(state.name, state.value);
      }
    } catch {
      // Continue restoring each independent author-owned attribute.
    }
  }
}

function statusError(
  root: HTMLElement,
  region: HTMLElement | null,
  cause: unknown
): RepeatableFieldsetError {
  return new RepeatableFieldsetError(
    "invalid-item",
    "The component could not initialize its polite status region.",
    {
      root,
      ...(region === null ? {} : { element: region }),
      cause
    }
  );
}

export function createRepeatableFieldsetStatusController(
  root: HTMLElement,
  authorRegion: HTMLElement | null,
  enabled: boolean
): RepeatableFieldsetStatusController {
  if (!enabled) {
    return Object.freeze({
      region: null,
      write(): void {},
      destroy(): void {}
    });
  }

  const generated = authorRegion === null;
  let region: HTMLElement | null = authorRegion;
  const attributeStates: ManagedAttributeState[] = [];

  try {
    if (region === null) {
      region = root.ownerDocument.createElement("div");
      region.setAttribute(ATTRIBUTES.status, "");
      region.className = CLASSES.status;
    } else {
      for (const name of MANAGED_ATTRIBUTES) {
        attributeStates.push({
          name,
          value: region.getAttribute(name)
        });
      }
    }

    region.setAttribute("role", "status");
    region.setAttribute("aria-live", "polite");
    region.setAttribute("aria-atomic", "true");

    if (generated) {
      root.append(region);
    }
  } catch (cause) {
    if (region !== null) {
      if (generated) {
        try {
          region.remove();
        } catch {
          // Preserve the typed initialization failure as the primary error.
        }
      } else {
        restoreManagedAttributes(region, attributeStates);
      }
    }

    throw statusError(root, region, cause);
  }

  if (region === null) {
    throw statusError(
      root,
      null,
      new Error("No status region was created.")
    );
  }

  const managedRegion = region;
  let active = true;
  let clearTimer: number | null = null;
  const timerWindow = root.ownerDocument.defaultView;

  function cancelClearTimer(): void {
    if (clearTimer === null) {
      return;
    }

    try {
      if (timerWindow !== null) {
        timerWindow.clearTimeout(clearTimer);
      }
    } catch {
      // Cleanup continues if a host replaces its timer functions.
    } finally {
      clearTimer = null;
    }
  }

  function scheduleClear(message: string): void {
    const clear = (): void => {
      clearTimer = null;

      try {
        if (
          active &&
          managedRegion.textContent === message
        ) {
          managedRegion.textContent = "";
        }
      } catch {
        // A host mutation must not surface as an asynchronous exception.
      }
    };

    if (timerWindow !== null) {
      clearTimer = timerWindow.setTimeout(
        clear,
        STATUS_CLEAR_DELAY_MS
      );
    }
  }

  return Object.freeze({
    region: managedRegion,
    write(message: string): void {
      if (!active) {
        return;
      }

      cancelClearTimer();

      try {
        managedRegion.textContent = message;
        scheduleClear(message);
      } catch {
        cancelClearTimer();
      }
    },
    destroy(): void {
      if (!active) {
        return;
      }

      active = false;
      cancelClearTimer();

      if (generated) {
        try {
          managedRegion.remove();
        } catch {
          // Destroy remains best-effort for host-mutated generated DOM.
        }
        return;
      }

      try {
        managedRegion.textContent = "";
      } catch {
        // Continue restoring author-owned semantics where practical.
      }

      restoreManagedAttributes(managedRegion, attributeStates);
    }
  });
}
