import type {
  RepeatableFieldsetCustomEvent,
  RepeatableFieldsetEventMap
} from "./events";
import type { A11yRepeatableFieldset } from "./instance";
import type {
  RepeatableFieldsetItem,
  RepeatableFieldsetRemoveResult,
  RepeatableFieldsetRestoreOptions,
  RepeatableFieldsetRestoreResult
} from "./operations";

/** An idempotent resource-release callback owned by the parent instance. */
export type RepeatableFieldsetCleanup = () => void;

/**
 * One owned Remove-button activation routed to an opt-in request handler.
 *
 * Calling `remove()` approves this request exactly once. The command
 * revalidates active ownership and the current minimum at call time while
 * preserving the original control trigger and operation source.
 */
export interface RepeatableFieldsetRemoveRequest {
  readonly instance: A11yRepeatableFieldset;
  readonly root: HTMLElement;
  readonly item: Readonly<RepeatableFieldsetItem>;
  readonly trigger: HTMLButtonElement;
  remove(): RepeatableFieldsetRemoveResult;
}

/** Owns one control-driven Remove request without creating a DOM event. */
export type RepeatableFieldsetRemoveRequestHandler = (
  request: Readonly<RepeatableFieldsetRemoveRequest>
) => void;

/** Single-use core command made ready only after a removal commits. */
export interface RepeatableFieldsetRemovalRestoration {
  restore(
    options?: RepeatableFieldsetRestoreOptions
  ): RepeatableFieldsetRestoreResult;
}

/** Pre-detachment context for the single removal-snapshot owner. */
export interface RepeatableFieldsetRemovePreparationContext {
  readonly instance: A11yRepeatableFieldset;
  readonly root: HTMLElement;
  readonly item: Readonly<RepeatableFieldsetItem>;
  readonly restoration: Readonly<RepeatableFieldsetRemovalRestoration>;
}

/** Lets the core commit or roll back addon state with the removal. */
export interface RepeatableFieldsetRemovePreparation {
  commit(): void;
  rollback(): void;
}

export type RepeatableFieldsetRemovePreparationHandler = (
  context: Readonly<RepeatableFieldsetRemovePreparationContext>
) => RepeatableFieldsetRemovePreparation;

/**
 * Public-only component context supplied to an opt-in synchronous addon.
 */
export interface RepeatableFieldsetAddonContext {
  readonly instance: A11yRepeatableFieldset;
  readonly root: HTMLElement;
  on<Name extends keyof RepeatableFieldsetEventMap>(
    name: Name,
    listener: (event: RepeatableFieldsetCustomEvent<Name>) => void
  ): RepeatableFieldsetCleanup;
  /**
   * Registers the instance's single control-driven Remove-request owner.
   * Public `remove()` calls remain immediate approved commands and bypass this
   * route.
   */
  onRemoveRequest(
    handler: RepeatableFieldsetRemoveRequestHandler
  ): RepeatableFieldsetCleanup;
  /**
   * Registers the instance's single pre-detachment snapshot owner. It is
   * independent from control-driven Remove-request ownership.
   */
  onRemovePreparation(
    handler: RepeatableFieldsetRemovePreparationHandler
  ): RepeatableFieldsetCleanup;
}

/** Public-only context for an existing or newly added item. */
export interface RepeatableFieldsetItemAddonContext {
  readonly instance: A11yRepeatableFieldset;
  readonly root: HTMLElement;
  on<Name extends keyof RepeatableFieldsetEventMap>(
    name: Name,
    listener: (event: RepeatableFieldsetCustomEvent<Name>) => void
  ): RepeatableFieldsetCleanup;
  readonly item: RepeatableFieldsetItem;
  readonly phase: "existing" | "added";
}

/**
 * A synchronous, opt-in extension contract. Concrete addon values remain out
 * of the main runtime bundle and are not registered by the core on import.
 */
export interface RepeatableFieldsetAddon {
  readonly id: string;
  setup?(
    context: RepeatableFieldsetAddonContext
  ): void | RepeatableFieldsetCleanup;
  setupItem?(
    context: RepeatableFieldsetItemAddonContext
  ): void | RepeatableFieldsetCleanup;
}
