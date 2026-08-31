import type {
  RepeatableFieldsetAddon,
  RepeatableFieldsetAddonContext,
  RepeatableFieldsetCleanup,
  RepeatableFieldsetItemAddonContext,
  RepeatableFieldsetRemovePreparation,
  RepeatableFieldsetRemovePreparationContext,
  RepeatableFieldsetRemovePreparationHandler,
  RepeatableFieldsetRemoveRequest,
  RepeatableFieldsetRemoveRequestHandler
} from "./addons";
import type {
  RepeatableFieldsetCustomEvent,
  RepeatableFieldsetEventMap
} from "./events";
import type { A11yRepeatableFieldset } from "./instance";
import type { RepeatableFieldsetItem } from "./operations";

const NOOP_CLEANUP: RepeatableFieldsetCleanup = () => {};
const NOOP_REMOVE_PREPARATION: RepeatableFieldsetRemovePreparation =
  Object.freeze({
    commit(): void {},
    rollback(): void {}
  });

/** Internal marker so initialization can retain an addon exception as cause. */
export class RepeatableFieldsetAddonSetupError extends Error {
  public readonly addonCause: unknown;

  public constructor(cause: unknown) {
    super("An addon setup hook failed.");
    this.name = "RepeatableFieldsetAddonSetupError";
    this.addonCause = cause;
  }
}

/** Owns component-level and per-item addon setup, routing, and cleanup. */
export class RepeatableFieldsetAddonManager {
  private readonly componentCleanups: RepeatableFieldsetCleanup[] = [];

  private readonly itemCleanups = new Map<
    HTMLFieldSetElement,
    RepeatableFieldsetCleanup[]
  >();

  private readonly itemPhases = new Map<
    HTMLFieldSetElement,
    RepeatableFieldsetItemAddonContext["phase"]
  >();

  private addons: readonly RepeatableFieldsetAddon[] = Object.freeze([]);

  private removeRequestHandler: RepeatableFieldsetRemoveRequestHandler | null =
    null;

  private removePreparationHandler:
    | RepeatableFieldsetRemovePreparationHandler
    | null = null;

  private active = true;

  public setup(
    addons: readonly RepeatableFieldsetAddon[],
    instance: A11yRepeatableFieldset,
    root: HTMLElement
  ): void {
    this.addons = addons;
    const on = <Name extends keyof RepeatableFieldsetEventMap>(
      name: Name,
      listener: (event: RepeatableFieldsetCustomEvent<Name>) => void
    ): RepeatableFieldsetCleanup =>
      this.subscribe(root, this.componentCleanups, name, listener);
    const onRemoveRequest = (
      handler: RepeatableFieldsetRemoveRequestHandler
    ): RepeatableFieldsetCleanup =>
      this.subscribeRemoveRequest(this.componentCleanups, handler);
    const onRemovePreparation = (
      handler: RepeatableFieldsetRemovePreparationHandler
    ): RepeatableFieldsetCleanup =>
      this.subscribeRemovePreparation(this.componentCleanups, handler);
    const context = this.createComponentContext(
      instance,
      root,
      on,
      onRemoveRequest,
      onRemovePreparation
    );

    try {
      for (const addon of addons) {
        if (addon.setup === undefined) {
          continue;
        }

        this.registerCleanup(
          this.componentCleanups,
          addon.setup(context)
        );
      }
    } catch (error) {
      this.destroy();
      throw new RepeatableFieldsetAddonSetupError(error);
    }
  }

  public setupItem(
    instance: A11yRepeatableFieldset,
    root: HTMLElement,
    item: RepeatableFieldsetItem,
    phase: RepeatableFieldsetItemAddonContext["phase"]
  ): void {
    const cleanups: RepeatableFieldsetCleanup[] = [];
    const on = <Name extends keyof RepeatableFieldsetEventMap>(
      name: Name,
      listener: (event: RepeatableFieldsetCustomEvent<Name>) => void
    ): RepeatableFieldsetCleanup =>
      this.subscribe(root, cleanups, name, listener);
    const context = Object.freeze({
      instance,
      root,
      on,
      item,
      phase
    } satisfies RepeatableFieldsetItemAddonContext);

    try {
      for (const addon of this.addons) {
        if (addon.setupItem === undefined) {
          continue;
        }

        this.registerCleanup(cleanups, addon.setupItem(context));
      }
    } catch (error) {
      this.runCleanups(cleanups);
      throw new RepeatableFieldsetAddonSetupError(error);
    }

    this.itemPhases.set(item.element, phase);

    if (cleanups.length > 0) {
      this.itemCleanups.set(item.element, cleanups);
    }
  }

  /** Runs and releases one item's cleanup callbacks before detachment. */
  public cleanupItem(item: HTMLFieldSetElement): unknown | null {
    const cleanups = this.itemCleanups.get(item);

    if (cleanups === undefined) {
      return null;
    }

    this.itemCleanups.delete(item);
    return this.runCleanups(cleanups);
  }

  /** Re-runs item setup when a failed removal restores the author item. */
  public restoreItem(
    instance: A11yRepeatableFieldset,
    root: HTMLElement,
    item: RepeatableFieldsetItem
  ): void {
    const phase = this.itemPhases.get(item.element);

    if (phase === undefined) {
      return;
    }

    this.setupItem(instance, root, item, phase);
  }

  /** Releases the manager's last reference to a successfully detached item. */
  public releaseItem(item: HTMLFieldSetElement): void {
    this.itemCleanups.delete(item);
    this.itemPhases.delete(item);
  }

  /** Captures addon state before item cleanup, without exposing private DOM. */
  public prepareItemRemoval(
    context: Readonly<RepeatableFieldsetRemovePreparationContext>
  ): RepeatableFieldsetRemovePreparation {
    if (!this.active || this.removePreparationHandler === null) {
      return NOOP_REMOVE_PREPARATION;
    }

    const preparation = this.removePreparationHandler(context);

    if (
      typeof preparation !== "object" ||
      preparation === null ||
      typeof preparation.commit !== "function" ||
      typeof preparation.rollback !== "function"
    ) {
      throw new TypeError(
        "An addon removal-preparation handler must return commit and rollback functions."
      );
    }

    return preparation;
  }

  /** Routes an owned control activation to the optional single request owner. */
  public routeRemoveRequest(
    request: Readonly<RepeatableFieldsetRemoveRequest>
  ): boolean {
    if (!this.active || this.removeRequestHandler === null) {
      return false;
    }

    this.removeRequestHandler(request);
    return true;
  }

  /**
   * Invokes all registered cleanups exactly once in reverse registration
   * order. It returns the first failure only after attempting every cleanup.
   */
  public destroy(): unknown | null {
    if (!this.active) {
      return null;
    }

    this.active = false;
    let firstFailure: unknown | null = null;

    const itemCleanupEntries = Array.from(this.itemCleanups.entries()).reverse();

    for (const [item, cleanups] of itemCleanupEntries) {
      this.itemCleanups.delete(item);
      firstFailure ??= this.runCleanups(cleanups);
    }

    firstFailure ??= this.runCleanups(this.componentCleanups);
    this.itemPhases.clear();

    return firstFailure;
  }

  private createComponentContext(
    instance: A11yRepeatableFieldset,
    root: HTMLElement,
    on: RepeatableFieldsetAddonContext["on"],
    onRemoveRequest: RepeatableFieldsetAddonContext["onRemoveRequest"],
    onRemovePreparation:
      RepeatableFieldsetAddonContext["onRemovePreparation"]
  ): RepeatableFieldsetAddonContext {
    return Object.freeze({
      instance,
      root,
      on,
      onRemoveRequest,
      onRemovePreparation
    });
  }

  private subscribeRemovePreparation(
    cleanups: RepeatableFieldsetCleanup[],
    handler: RepeatableFieldsetRemovePreparationHandler
  ): RepeatableFieldsetCleanup {
    if (!this.active) {
      return NOOP_CLEANUP;
    }

    if (typeof handler !== "function") {
      throw new TypeError(
        "An addon removal-preparation handler must be a function."
      );
    }

    if (this.removePreparationHandler !== null) {
      throw new TypeError(
        "Only one addon may own removal snapshots in an instance."
      );
    }

    this.removePreparationHandler = handler;
    let subscribed = true;
    const unsubscribe: RepeatableFieldsetCleanup = () => {
      if (!subscribed) {
        return;
      }

      subscribed = false;

      if (this.removePreparationHandler === handler) {
        this.removePreparationHandler = null;
      }
    };

    cleanups.push(unsubscribe);
    return unsubscribe;
  }

  private subscribeRemoveRequest(
    cleanups: RepeatableFieldsetCleanup[],
    handler: RepeatableFieldsetRemoveRequestHandler
  ): RepeatableFieldsetCleanup {
    if (!this.active) {
      return NOOP_CLEANUP;
    }

    if (typeof handler !== "function") {
      throw new TypeError("An addon Remove-request handler must be a function.");
    }

    if (this.removeRequestHandler !== null) {
      throw new TypeError(
        "Only one addon may own control-driven Remove requests in an instance."
      );
    }

    this.removeRequestHandler = handler;
    let subscribed = true;
    const unsubscribe: RepeatableFieldsetCleanup = () => {
      if (!subscribed) {
        return;
      }

      subscribed = false;

      if (this.removeRequestHandler === handler) {
        this.removeRequestHandler = null;
      }
    };

    cleanups.push(unsubscribe);
    return unsubscribe;
  }

  private registerCleanup(
    cleanups: RepeatableFieldsetCleanup[],
    result: void | RepeatableFieldsetCleanup
  ): void {
    if (result === undefined) {
      return;
    }

    if (typeof result !== "function") {
      throw new TypeError("An addon setup hook must return a cleanup function.");
    }

    cleanups.push(result);
  }

  private subscribe<Name extends keyof RepeatableFieldsetEventMap>(
    root: HTMLElement,
    cleanups: RepeatableFieldsetCleanup[],
    name: Name,
    listener: (event: RepeatableFieldsetCustomEvent<Name>) => void
  ): RepeatableFieldsetCleanup {
    if (!this.active) {
      return NOOP_CLEANUP;
    }

    if (typeof listener !== "function") {
      throw new TypeError("An addon event listener must be a function.");
    }

    const eventListener: EventListener = (event) => {
      listener(event as RepeatableFieldsetCustomEvent<Name>);
    };
    let subscribed = true;
    const unsubscribe: RepeatableFieldsetCleanup = () => {
      if (!subscribed) {
        return;
      }

      subscribed = false;
      root.removeEventListener(name, eventListener);
    };

    root.addEventListener(name, eventListener);
    cleanups.push(unsubscribe);

    return unsubscribe;
  }

  private runCleanups(
    cleanups: RepeatableFieldsetCleanup[]
  ): unknown | null {
    let firstFailure: unknown | null = null;

    while (cleanups.length > 0) {
      const cleanup = cleanups.pop();

      if (cleanup === undefined) {
        continue;
      }

      try {
        cleanup();
      } catch (error) {
        firstFailure ??= error;
      }
    }

    return firstFailure;
  }
}
