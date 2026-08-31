import { ATTRIBUTES, EVENTS, SELECTORS } from "./constants";
import {
  RepeatableFieldsetAddonManager,
  RepeatableFieldsetAddonSetupError
} from "./addon-manager";
import type {
  RepeatableFieldsetRemovalRestoration,
  RepeatableFieldsetRemovePreparation,
  RepeatableFieldsetRemoveRequest
} from "./addons";
import { dispatchRepeatableFieldsetEvent } from "./events";
import {
  RepeatableFieldsetConstraintController,
  type RepeatableFieldsetControlSynchronization
} from "./constraints";
import {
  discoverRepeatableFieldsetMarkup,
  type DiscoveredRepeatableFieldsetMarkup
} from "./discovery";
import { RepeatableFieldsetError } from "./errors";
import {
  focusAddedRepeatableFieldsetItem,
  focusAfterRepeatableFieldsetItemRemoval,
  focusAfterRepeatableFieldsetItemMove,
  planMovedRepeatableFieldsetItemFocus,
  planRemovedRepeatableFieldsetItemFocus,
  restoreFocusAfterFailedRepeatableFieldsetItemRemoval
} from "./focus";
import {
  registerExistingRepeatableFieldsetItems,
  type AddedItemRegistration,
  type ExistingItemRegistry,
  type MovedItemRegistration,
  type RegisteredRepeatableFieldsetItem,
  type RemovedItemRegistration
} from "./items";
import type {
  RepeatableFieldsetAddFailureReason,
  RepeatableFieldsetAddOptions,
  RepeatableFieldsetAddResult,
  RepeatableFieldsetDuplicateFailureReason,
  RepeatableFieldsetDuplicateOptions,
  RepeatableFieldsetDuplicateResult,
  RepeatableFieldsetDuplicateTarget,
  RepeatableFieldsetItem,
  RepeatableFieldsetMoveDirection,
  RepeatableFieldsetMoveResult,
  RepeatableFieldsetMoveTarget,
  RepeatableFieldsetOperationSource,
  RepeatableFieldsetRemoveOptions,
  RepeatableFieldsetRemoveResult,
  RepeatableFieldsetRemoveTarget,
  RepeatableFieldsetRestoreOptions,
  RepeatableFieldsetRestoreResult
} from "./operations";
import type { RepeatableFieldsetKey } from "./keys";
import type { RepeatableFieldsetOptions } from "./options";
import {
  formatAddedStatusMessage,
  formatDuplicatedStatusMessage,
  formatMaximumStatusMessage,
  formatMinimumStatusMessage,
  formatMoveBoundaryStatusMessage,
  formatMovedStatusMessage,
  formatRemovedStatusMessage,
  formatRestoredStatusMessage
} from "./messages";
import {
  synchronizeRepeatableFieldsetPositions,
  type RepeatableFieldsetPositionSynchronization
} from "./positions";
import {
  createRepeatableFieldsetStatusController,
  type RepeatableFieldsetStatusController
} from "./status";
import {
  cloneRepeatableFieldsetTemplate,
  materializeClonedRepeatableFieldsetTemplate
} from "./template";

const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";

type InstanceState =
  | "initializing"
  | "active"
  | "failed"
  | "destroyed";

interface RemovalRestorationRecord {
  readonly key: RepeatableFieldsetKey;
  readonly previousIndex: number;
  readonly previousPosition: number;
  readonly previousKey: RepeatableFieldsetKey | null;
  readonly nextKey: RepeatableFieldsetKey | null;
  state: "pending" | "ready" | "restoring" | "consumed" | "invalid";
}

export interface RepeatableFieldsetInstance {
  init(): this;
  add(
    options?: RepeatableFieldsetAddOptions
  ): RepeatableFieldsetAddResult;
  duplicate(
    target: RepeatableFieldsetDuplicateTarget,
    options?: RepeatableFieldsetDuplicateOptions
  ): RepeatableFieldsetDuplicateResult;
  remove(
    target: RepeatableFieldsetRemoveTarget,
    options?: RepeatableFieldsetRemoveOptions
  ): RepeatableFieldsetRemoveResult;
  move(
    target: RepeatableFieldsetMoveTarget,
    direction: RepeatableFieldsetMoveDirection
  ): RepeatableFieldsetMoveResult;
  getItems(): readonly RepeatableFieldsetItem[];
  getCount(): number;
  canAdd(): boolean;
  canRemove(): boolean;
  destroy(): void;
}

const INACTIVE_ADD_RESULT = Object.freeze({
  ok: false,
  reason: "inactive"
} as const);

const MAXIMUM_ADD_RESULT = Object.freeze({
  ok: false,
  reason: "maximum"
} as const);

const INACTIVE_DUPLICATE_RESULT = Object.freeze({
  ok: false,
  reason: "inactive"
} as const);

const MAXIMUM_DUPLICATE_RESULT = Object.freeze({
  ok: false,
  reason: "maximum"
} as const);

const UNOWNED_DUPLICATE_RESULT = Object.freeze({
  ok: false,
  reason: "unowned-item"
} as const);

const INACTIVE_REMOVE_RESULT = Object.freeze({
  ok: false,
  reason: "inactive"
} as const);

const MINIMUM_REMOVE_RESULT = Object.freeze({
  ok: false,
  reason: "minimum"
} as const);

const UNOWNED_REMOVE_RESULT = Object.freeze({
  ok: false,
  reason: "unowned-item"
} as const);

const INACTIVE_MOVE_RESULT = Object.freeze({
  ok: false,
  reason: "inactive"
} as const);

const UNOWNED_MOVE_RESULT = Object.freeze({
  ok: false,
  reason: "unowned-item"
} as const);

function validateOperationOptions(
  root: HTMLElement,
  operation: "Add" | "Remove",
  options: unknown
): asserts options is
  | RepeatableFieldsetAddOptions
  | RepeatableFieldsetRemoveOptions {
  const keys =
    typeof options === "object" &&
    options !== null &&
    !Array.isArray(options)
      ? Reflect.ownKeys(options)
      : [];

  if (
    typeof options !== "object" ||
    options === null ||
    Array.isArray(options) ||
    keys.some((key) => key !== "focus") ||
    ("focus" in options &&
      typeof options.focus !== "boolean")
  ) {
    throw new RepeatableFieldsetError(
      "invalid-options",
      `${operation} options may contain only a boolean "focus" value.`,
      { root }
    );
  }
}

function validateDuplicateOptions(
  root: HTMLElement,
  options: unknown
): asserts options is RepeatableFieldsetDuplicateOptions {
  const keys =
    typeof options === "object" &&
    options !== null &&
    !Array.isArray(options)
      ? Reflect.ownKeys(options)
      : [];

  if (
    typeof options !== "object" ||
    options === null ||
    Array.isArray(options) ||
    keys.some(
      (key) => key !== "focus" && key !== "copyState"
    ) ||
    ("focus" in options &&
      typeof options.focus !== "boolean") ||
    ("copyState" in options &&
      typeof options.copyState !== "function")
  ) {
    throw new RepeatableFieldsetError(
      "invalid-options",
      'Duplicate options may contain only a boolean "focus" value and a synchronous "copyState" function.',
      { root }
    );
  }
}

function validateRestoreOptions(
  root: HTMLElement,
  options: unknown
): asserts options is RepeatableFieldsetRestoreOptions {
  const keys =
    typeof options === "object" &&
    options !== null &&
    !Array.isArray(options)
      ? Reflect.ownKeys(options)
      : [];

  if (
    typeof options !== "object" ||
    options === null ||
    Array.isArray(options) ||
    keys.some(
      (key) => key !== "focus" && key !== "restoreState"
    ) ||
    ("focus" in options && typeof options.focus !== "boolean") ||
    ("restoreState" in options &&
      typeof options.restoreState !== "function")
  ) {
    throw new RepeatableFieldsetError(
      "invalid-options",
      'Restore options may contain only a boolean "focus" value and a synchronous "restoreState" function.',
      { root }
    );
  }
}

function isPromiseLike(value: unknown): boolean {
  if (
    (typeof value !== "object" || value === null) &&
    typeof value !== "function"
  ) {
    return false;
  }

  return typeof (value as { readonly then?: unknown }).then === "function";
}

function isHTMLFieldSetElement(
  value: unknown
): value is HTMLFieldSetElement {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<Element>;

  return (
    candidate.nodeType === 1 &&
    candidate.namespaceURI === HTML_NAMESPACE &&
    candidate.localName === "fieldset"
  );
}

function resolveItemTarget(
  registry: ExistingItemRegistry,
  target:
    | RepeatableFieldsetRemoveTarget
    | RegisteredRepeatableFieldsetItem
): RegisteredRepeatableFieldsetItem | null {
  if (typeof target === "string") {
    return registry.getByKey(target);
  }

  if (isHTMLFieldSetElement(target)) {
    return registry.getByElement(target);
  }

  if (typeof target !== "object" || target === null) {
    return null;
  }

  const candidate = target as Partial<
    Pick<RepeatableFieldsetItem, "element" | "key">
  >;

  if (
    !isHTMLFieldSetElement(candidate.element) ||
    typeof candidate.key !== "string"
  ) {
    return null;
  }

  const item = registry.getByElement(candidate.element);

  return item !== null && item.key === candidate.key
    ? item
    : null;
}

function validateMoveDirection(
  root: HTMLElement,
  direction: unknown
): asserts direction is RepeatableFieldsetMoveDirection {
  if (direction !== "up" && direction !== "down") {
    throw new RepeatableFieldsetError(
      "invalid-options",
      'Move direction must be either "up" or "down".',
      { root }
    );
  }
}

function mapAddFailureReason(
  error: unknown
): Exclude<
  RepeatableFieldsetAddFailureReason,
  "inactive" | "maximum" | "addon-error"
> {
  if (error instanceof RepeatableFieldsetError) {
    if (error.code === "invalid-key") {
      return "invalid-key";
    }

    if (error.code === "duplicate-key") {
      return "duplicate-key";
    }
  }

  return "invalid-template";
}

/**
 * Discovery-initialized component with one-item Add/Remove/Duplicate/Move support.
 *
 * Structural focus and polite status UI are integrated. Lifecycle events,
 * addons, and their teardown hooks are added by dependency-ordered tasks.
 */
export class A11yRepeatableFieldset
  implements RepeatableFieldsetInstance
{
  private static readonly activeInstances = new WeakMap<
    HTMLElement,
    A11yRepeatableFieldset
  >();

  private state: InstanceState = "initializing";

  private root: HTMLElement | null = null;

  private markup: Readonly<DiscoveredRepeatableFieldsetMarkup> | null = null;

  private itemRegistry: ExistingItemRegistry | null = null;

  private itemSnapshots:
    | readonly RepeatableFieldsetItem[]
    | null = null;

  private constraintController:
    | RepeatableFieldsetConstraintController
    | null = null;

  private statusController:
    | RepeatableFieldsetStatusController
    | null = null;

  private addonManager: RepeatableFieldsetAddonManager | null = null;

  private rootClickListenerInstalled = false;

  private disconnectedStatePhaseActive = false;

  private readonly handleRootClick = (event: Event): void => {
    const root = this.root;
    const markup = this.markup;

    if (
      this.state !== "active" ||
      this.disconnectedStatePhaseActive ||
      root === null ||
      markup === null
    ) {
      return;
    }

    const target = event.target as Partial<Element> | null;

    if (
      target === null ||
      target.nodeType !== 1 ||
      typeof target.closest !== "function"
    ) {
      return;
    }

    const addControl = target.closest(SELECTORS.add);

    if (
      addControl === markup.addButton &&
      addControl.closest(SELECTORS.root) === root
    ) {
      this.performAdd(
        "control",
        markup.addButton,
        markup.options.focusOnAdd
      );
      return;
    }

    const removeControl = target.closest(SELECTORS.remove);
    const itemElement = removeControl?.closest(SELECTORS.item);
    const registry = this.itemRegistry;

    if (
      removeControl === null ||
      itemElement === null ||
      itemElement === undefined ||
      removeControl.closest(SELECTORS.root) !== root ||
      itemElement.closest(SELECTORS.root) !== root ||
      !isHTMLFieldSetElement(itemElement) ||
      registry === null
    ) {
      return;
    }

    const item = registry.getByElement(itemElement);

    if (
      item === null ||
      item.removeButton !== removeControl
    ) {
      return;
    }

    const index = registry.items.indexOf(item);

    if (index === -1) {
      return;
    }

    let approvedResult: RepeatableFieldsetRemoveResult | null = null;
    const request = Object.freeze({
      instance: this,
      root,
      item: Object.freeze({
        element: item.element,
        key: item.key,
        index,
        position: index + 1
      }),
      trigger: item.removeButton,
      remove: (): RepeatableFieldsetRemoveResult => {
        approvedResult ??= this.performRemove(
          "control",
          item,
          item.removeButton,
          true
        );
        return approvedResult;
      }
    } satisfies RepeatableFieldsetRemoveRequest);

    if (this.addonManager?.routeRemoveRequest(request) === true) {
      return;
    }

    request.remove();
  };

  public constructor(
    root: HTMLElement,
    options: RepeatableFieldsetOptions = {}
  ) {
    const existing =
      A11yRepeatableFieldset.activeInstances.get(root);

    if (existing !== undefined) {
      return existing;
    }

    const markup = discoverRepeatableFieldsetMarkup(root, options);
    const registration =
      registerExistingRepeatableFieldsetItems(markup);
    const constraintController =
      new RepeatableFieldsetConstraintController(
        markup.root,
        markup.options
      );
    let positionSynchronization:
      | RepeatableFieldsetPositionSynchronization
      | null = null;
    let controlSynchronization:
      | RepeatableFieldsetControlSynchronization
      | null = null;
    let statusController: RepeatableFieldsetStatusController | null =
      null;
    const addonManager = new RepeatableFieldsetAddonManager();

    try {
      positionSynchronization =
        synchronizeRepeatableFieldsetPositions(
          markup.root,
          registration.registry.items
        );
      controlSynchronization = constraintController.synchronize(
        markup.addButton,
        registration.registry.items
      );
      statusController = createRepeatableFieldsetStatusController(
        markup.root,
        markup.statusRegion,
        markup.options.announceChanges
      );
      this.root = markup.root;
      this.markup = markup;
      this.itemRegistry = registration.registry;
      this.itemSnapshots = positionSynchronization.snapshots;
      this.constraintController = constraintController;
      this.statusController = statusController;
      addonManager.setup(
        markup.options.addons ?? Object.freeze([]),
        this,
        markup.root
      );
      for (const item of this.itemSnapshots) {
        addonManager.setupItem(
          this,
          markup.root,
          item,
          "existing"
        );
      }
      this.addonManager = addonManager;
      markup.root.addEventListener("click", this.handleRootClick);
      this.rootClickListenerInstalled = true;
      A11yRepeatableFieldset.activeInstances.set(markup.root, this);
      this.state = "active";
      dispatchRepeatableFieldsetEvent(markup.root, EVENTS.init, Object.freeze({
        instance: this,
        root: markup.root,
        count: this.itemSnapshots.length,
        minimum: markup.options.minimum,
        maximum: markup.options.maximum,
        items: this.getItems()
      }));
    } catch (error) {
      this.state = "failed";

      if (this.rootClickListenerInstalled) {
        markup.root.removeEventListener(
          "click",
          this.handleRootClick
        );
        this.rootClickListenerInstalled = false;
      }

      this.root = null;
      this.markup = null;
      this.itemRegistry = null;
      this.itemSnapshots = null;
      this.constraintController = null;
      this.statusController = null;
      this.addonManager = null;
      const addonSetupFailure = addonManager.destroy();
      statusController?.destroy();
      controlSynchronization?.rollback();
      positionSynchronization?.rollback();
      registration.rollback();

      if (
        A11yRepeatableFieldset.activeInstances.get(markup.root) === this
      ) {
        A11yRepeatableFieldset.activeInstances.delete(markup.root);
      }

      if (error instanceof RepeatableFieldsetError) {
        throw error;
      }

      throw new RepeatableFieldsetError(
        "invalid-options",
        "An addon setup hook failed during initialization.",
        {
          root: markup.root,
          cause:
            error instanceof RepeatableFieldsetAddonSetupError
              ? error.addonCause
              : addonSetupFailure ?? error
        }
      );
    }
  }

  public init(): this {
    // Construction performs initialization. Active and destroyed calls are
    // intentionally idempotent; a destroyed instance cannot be revived.
    return this;
  }

  public add(
    options: RepeatableFieldsetAddOptions = {}
  ): RepeatableFieldsetAddResult {
    if (
      this.state !== "active" ||
      this.root === null
    ) {
      return INACTIVE_ADD_RESULT;
    }

    this.assertNoDisconnectedStateReentry();

    validateOperationOptions(this.root, "Add", options);
    return this.performAdd(
      "api",
      null,
      options.focus ?? false
    );
  }

  public remove(
    target: RepeatableFieldsetRemoveTarget,
    options: RepeatableFieldsetRemoveOptions = {}
  ): RepeatableFieldsetRemoveResult {
    if (
      this.state !== "active" ||
      this.root === null
    ) {
      return INACTIVE_REMOVE_RESULT;
    }

    this.assertNoDisconnectedStateReentry();

    validateOperationOptions(this.root, "Remove", options);
    return this.performRemove(
      "api",
      target,
      null,
      options.focus ?? false
    );
  }

  public duplicate(
    target: RepeatableFieldsetDuplicateTarget,
    options: RepeatableFieldsetDuplicateOptions = {}
  ): RepeatableFieldsetDuplicateResult {
    if (
      this.state !== "active" ||
      this.root === null
    ) {
      return INACTIVE_DUPLICATE_RESULT;
    }

    this.assertNoDisconnectedStateReentry();

    validateDuplicateOptions(this.root, options);
    return this.performDuplicate(
      target,
      options.focus ?? false,
      options.copyState
    );
  }

  public move(
    target: RepeatableFieldsetMoveTarget,
    direction: RepeatableFieldsetMoveDirection
  ): RepeatableFieldsetMoveResult {
    if (
      this.state !== "active" ||
      this.root === null
    ) {
      return INACTIVE_MOVE_RESULT;
    }

    this.assertNoDisconnectedStateReentry();

    validateMoveDirection(this.root, direction);
    return this.performMove(target, direction);
  }

  public getItems(): readonly RepeatableFieldsetItem[] {
    if (
      this.state !== "active" ||
      this.itemSnapshots === null
    ) {
      return Object.freeze([]);
    }

    return Object.freeze(
      this.itemSnapshots.map((item) =>
        Object.freeze({
          element: item.element,
          key: item.key,
          index: item.index,
          position: item.position
        })
      )
    );
  }

  public getCount(): number {
    return this.state === "active" &&
      this.itemSnapshots !== null
      ? this.itemSnapshots.length
      : 0;
  }

  public canAdd(): boolean {
    return this.getCapability("canAdd");
  }

  public canRemove(): boolean {
    return this.getCapability("canRemove");
  }

  public destroy(): void {
    if (this.state !== "active" || this.root === null) {
      return;
    }

    const root = this.root;
    const markup = this.markup;
    const registry = this.itemRegistry;
    const constraintController = this.constraintController;
    const statusController = this.statusController;
    const addonManager = this.addonManager;
    const destroyedCount = registry?.items.length ?? 0;
    this.state = "destroyed";

    const addonCleanupFailure = addonManager?.destroy() ?? null;

    if (this.rootClickListenerInstalled) {
      try {
        root.removeEventListener("click", this.handleRootClick);
      } catch {
        // State is already inactive, so a host cleanup failure cannot leave
        // an operational old listener or block the remaining teardown.
      } finally {
        this.rootClickListenerInstalled = false;
      }
    }

    statusController?.destroy();

    if (
      markup !== null &&
      registry !== null &&
      constraintController !== null
    ) {
      try {
        constraintController.restoreAuthorStates(
          markup.addButton,
          registry.items
        );
      } catch {
        // Continue releasing the instance when author controls were replaced
        // or made non-writable after successful initialization.
      }
    }

    if (A11yRepeatableFieldset.activeInstances.get(root) === this) {
      A11yRepeatableFieldset.activeInstances.delete(root);
    }

    this.root = null;
    this.markup = null;
    this.itemRegistry = null;
    this.itemSnapshots = null;
    this.constraintController = null;
    this.statusController = null;
    this.addonManager = null;

    dispatchRepeatableFieldsetEvent(root, EVENTS.destroy, Object.freeze({
      instance: this,
      root,
      count: destroyedCount
    }));

    if (addonCleanupFailure !== null) {
      throw new RepeatableFieldsetError(
        "invalid-options",
        "An addon cleanup hook failed during destroy.",
        { root, cause: addonCleanupFailure }
      );
    }
  }

  private performAdd(
    source: RepeatableFieldsetOperationSource,
    trigger: HTMLElement | null,
    focusRequested: boolean
  ): RepeatableFieldsetAddResult {
    const root = this.root;
    const markup = this.markup;
    const registry = this.itemRegistry;
    const constraintController = this.constraintController;
    const statusController = this.statusController;
    const addonManager = this.addonManager;

    if (
      this.state !== "active" ||
      root === null ||
      markup === null ||
      registry === null ||
      constraintController === null ||
      statusController === null ||
      addonManager === null
    ) {
      return INACTIVE_ADD_RESULT;
    }

    const items = registry.items;

    if (!constraintController.getState(items.length).canAdd) {
      if (source === "api" && markup.options.maximum !== null) {
        statusController.write(
          formatMaximumStatusMessage(
            markup.options.messageFormatters,
            {
              itemLabel: markup.options.itemLabel,
              key: null,
              position: null,
              count: items.length,
              minimum: markup.options.minimum,
              maximum: markup.options.maximum
            }
          )
        );
      }

      return MAXIMUM_ADD_RESULT;
    }

    let candidate: HTMLFieldSetElement | null = null;
    let addedRegistration: AddedItemRegistration | null = null;
    let positionSynchronization:
      | RepeatableFieldsetPositionSynchronization
      | null = null;
    let controlSynchronization:
      | RepeatableFieldsetControlSynchronization
      | null = null;
    const previousItemSnapshots = this.itemSnapshots;

    try {
      candidate = cloneRepeatableFieldsetTemplate(
        root,
        markup.template
      );
      const key = registry.allocateKey("add", candidate);
      const materialized =
        materializeClonedRepeatableFieldsetTemplate(
          root,
          candidate,
          key
        );

      materialized.focusTarget?.removeAttribute(ATTRIBUTES.focus);
      markup.itemsContainer.append(materialized.item);
      addedRegistration = registry.registerAddedItem({
        element: materialized.item,
        legend: materialized.legend,
        removeButton: materialized.removeButton,
        key: materialized.key
      });
      addonManager.setupItem(
        this,
        root,
        Object.freeze({
          element: materialized.item,
          key: materialized.key,
          index: registry.items.length - 1,
          position: registry.items.length
        }),
        "added"
      );
      positionSynchronization =
        synchronizeRepeatableFieldsetPositions(
          root,
          registry.items
        );
      controlSynchronization = constraintController.synchronize(
        markup.addButton,
        registry.items
      );

      const item =
        positionSynchronization.snapshots[
          positionSynchronization.snapshots.length - 1
        ];

      if (
        item === undefined ||
        item.element !== materialized.item
      ) {
        throw new RepeatableFieldsetError(
          "invalid-template",
          "The added item could not be represented in collection order.",
          {
            root,
            element: materialized.item
          }
        );
      }

      this.itemSnapshots = positionSynchronization.snapshots;
      const focusTarget = focusRequested
        ? focusAddedRepeatableFieldsetItem(
            root,
            materialized.item,
            materialized.focusTarget
          )
        : null;
      statusController.write(
        formatAddedStatusMessage(
          markup.options.messageFormatters,
          {
            itemLabel: markup.options.itemLabel,
            key: item.key,
            position: item.position,
            count: positionSynchronization.snapshots.length,
            minimum: markup.options.minimum,
            maximum: markup.options.maximum
          }
        )
      );

      // The invocation data and resolved focus target become observable when
      // lifecycle events integrate with this stable operation boundary.
      void source;
      void trigger;
      void focusTarget;

      dispatchRepeatableFieldsetEvent(root, EVENTS.itemAdded, Object.freeze({
        instance: this,
        root,
        item: Object.freeze({
          element: item.element,
          key: item.key,
          index: item.index,
          position: item.position
        }),
        key: item.key,
        index: item.index,
        position: item.position,
        count: positionSynchronization.snapshots.length,
        trigger,
        source
      }));

      const result = Object.freeze({
        ok: true,
        item
      });

      return result;
    } catch (error) {
      const addonCleanupFailure =
        candidate === null
          ? null
          : addonManager.cleanupItem(candidate);
      if (candidate !== null) {
        addonManager.releaseItem(candidate);
      }
      this.itemSnapshots = previousItemSnapshots;
      controlSynchronization?.rollback();
      positionSynchronization?.rollback();
      addedRegistration?.rollback();

      if (
        candidate !== null &&
        candidate.parentElement === markup.itemsContainer
      ) {
        candidate.remove();
      }

      const failureReason: Exclude<
        RepeatableFieldsetAddFailureReason,
        "inactive" | "maximum"
      > =
        error instanceof RepeatableFieldsetAddonSetupError ||
        addonCleanupFailure !== null
          ? "addon-error"
          : mapAddFailureReason(error);

      return Object.freeze({
        ok: false,
        reason: failureReason,
        error: addonCleanupFailure ?? error
      });
    }
  }

  private performDuplicate(
    target: RepeatableFieldsetDuplicateTarget,
    focusRequested: boolean,
    copyState: RepeatableFieldsetDuplicateOptions["copyState"]
  ): RepeatableFieldsetDuplicateResult {
    const root = this.root;
    const markup = this.markup;
    const registry = this.itemRegistry;
    const constraintController = this.constraintController;
    const statusController = this.statusController;
    const addonManager = this.addonManager;

    if (
      this.state !== "active" ||
      root === null ||
      markup === null ||
      registry === null ||
      constraintController === null ||
      statusController === null ||
      addonManager === null
    ) {
      return INACTIVE_DUPLICATE_RESULT;
    }

    const source = resolveItemTarget(registry, target);

    if (source === null) {
      return UNOWNED_DUPLICATE_RESULT;
    }

    const items = registry.items;
    const sourceIndex = items.indexOf(source);

    if (sourceIndex === -1) {
      return UNOWNED_DUPLICATE_RESULT;
    }

    if (!constraintController.getState(items.length).canAdd) {
      if (markup.options.maximum !== null) {
        statusController.write(
          formatMaximumStatusMessage(
            markup.options.messageFormatters,
            {
              itemLabel: markup.options.itemLabel,
              key: source.key,
              position: sourceIndex + 1,
              count: items.length,
              minimum: markup.options.minimum,
              maximum: markup.options.maximum
            }
          )
        );
      }

      return MAXIMUM_DUPLICATE_RESULT;
    }

    const sourceSnapshot = Object.freeze({
      element: source.element,
      key: source.key,
      index: sourceIndex,
      position: sourceIndex + 1
    });
    const insertionIndex = sourceIndex + 1;
    let candidate: HTMLFieldSetElement | null = null;
    let addedRegistration: AddedItemRegistration | null = null;
    let positionSynchronization:
      | RepeatableFieldsetPositionSynchronization
      | null = null;
    let controlSynchronization:
      | RepeatableFieldsetControlSynchronization
      | null = null;
    const previousItemSnapshots = this.itemSnapshots;
    let copyFailed = false;
    let copyError: unknown;

    try {
      candidate = cloneRepeatableFieldsetTemplate(
        root,
        markup.template
      );
      const key = registry.allocateKey("duplicate", candidate);
      const materialized =
        materializeClonedRepeatableFieldsetTemplate(
          root,
          candidate,
          key
        );

      if (copyState !== undefined) {
        const structuralBaseline = materialized.item.cloneNode(true);

        try {
          this.disconnectedStatePhaseActive = true;
          let returnValue: unknown;

          try {
            returnValue = copyState(
              Object.freeze({
                sourceItem: sourceSnapshot,
                candidate: materialized.item
              })
            );
          } finally {
            this.disconnectedStatePhaseActive = false;
          }

          if (isPromiseLike(returnValue)) {
            throw new TypeError(
              "Duplicate copyState must complete synchronously."
            );
          }

          if (!materialized.item.isEqualNode(structuralBaseline)) {
            throw new TypeError(
              "Duplicate copyState may change only current control state, not candidate structure, attributes, or defaults."
            );
          }

        } catch (error) {
          copyFailed = true;
          copyError = error;
          throw error;
        }
      }

      materialized.focusTarget?.removeAttribute(ATTRIBUTES.focus);
      const nextItem = registry.items[insertionIndex] ?? null;
      markup.itemsContainer.insertBefore(
        materialized.item,
        nextItem?.element ?? null
      );
      addedRegistration = registry.registerAddedItem(
        {
          element: materialized.item,
          legend: materialized.legend,
          removeButton: materialized.removeButton,
          key: materialized.key
        },
        insertionIndex
      );
      addonManager.setupItem(
        this,
        root,
        Object.freeze({
          element: materialized.item,
          key: materialized.key,
          index: insertionIndex,
          position: insertionIndex + 1
        }),
        "added"
      );
      positionSynchronization =
        synchronizeRepeatableFieldsetPositions(root, registry.items);
      controlSynchronization = constraintController.synchronize(
        markup.addButton,
        registry.items
      );

      const item =
        positionSynchronization.snapshots[insertionIndex];

      if (
        item === undefined ||
        item.element !== materialized.item ||
        item.key !== materialized.key
      ) {
        throw new RepeatableFieldsetError(
          "invalid-template",
          "The duplicated item could not be represented in collection order.",
          {
            root,
            element: materialized.item
          }
        );
      }

      this.itemSnapshots = positionSynchronization.snapshots;
      const focusTarget = focusRequested
        ? focusAddedRepeatableFieldsetItem(
            root,
            materialized.item,
            materialized.focusTarget
          )
        : null;

      statusController.write(
        formatDuplicatedStatusMessage(
          markup.options.messageFormatters,
          {
            itemLabel: markup.options.itemLabel,
            key: item.key,
            position: item.position,
            sourceKey: sourceSnapshot.key,
            sourcePosition: sourceSnapshot.position,
            count: positionSynchronization.snapshots.length,
            minimum: markup.options.minimum,
            maximum: markup.options.maximum
          }
        )
      );

      dispatchRepeatableFieldsetEvent(
        root,
        EVENTS.itemDuplicated,
        Object.freeze({
          instance: this,
          root,
          item: Object.freeze({
            element: item.element,
            key: item.key,
            index: item.index,
            position: item.position
          }),
          key: item.key,
          index: item.index,
          position: item.position,
          sourceKey: sourceSnapshot.key,
          sourceIndex: sourceSnapshot.index,
          sourcePosition: sourceSnapshot.position,
          count: positionSynchronization.snapshots.length,
          focusTarget
        })
      );

      return Object.freeze({
        ok: true,
        item,
        sourceItem: sourceSnapshot
      });
    } catch (error) {
      const addonCleanupFailure =
        candidate === null
          ? null
          : addonManager.cleanupItem(candidate);
      if (candidate !== null) {
        addonManager.releaseItem(candidate);
      }
      this.disconnectedStatePhaseActive = false;
      this.itemSnapshots = previousItemSnapshots;
      controlSynchronization?.rollback();
      positionSynchronization?.rollback();
      addedRegistration?.rollback();

      if (
        candidate !== null &&
        candidate.parentElement === markup.itemsContainer
      ) {
        candidate.remove();
      }

      let failureReason: Exclude<
        RepeatableFieldsetDuplicateFailureReason,
        "inactive" | "maximum" | "unowned-item"
      >;

      if (copyFailed) {
        failureReason = "copy-error";
      } else if (
        error instanceof RepeatableFieldsetAddonSetupError ||
        addonCleanupFailure !== null
      ) {
        failureReason = "addon-error";
      } else {
        failureReason = mapAddFailureReason(error);
      }

      return Object.freeze({
        ok: false,
        reason: failureReason,
        error: copyFailed
          ? copyError
          : (addonCleanupFailure ?? error)
      });
    }
  }

  private performRemove(
    source: RepeatableFieldsetOperationSource,
    target:
      | RepeatableFieldsetRemoveTarget
      | RegisteredRepeatableFieldsetItem,
    trigger: HTMLElement | null,
    focusRequested: boolean
  ): RepeatableFieldsetRemoveResult {
    const root = this.root;
    const markup = this.markup;
    const registry = this.itemRegistry;
    const constraintController = this.constraintController;
    const statusController = this.statusController;
    const addonManager = this.addonManager;

    if (
      this.state !== "active" ||
      root === null ||
      markup === null ||
      registry === null ||
      constraintController === null ||
      statusController === null ||
      addonManager === null
    ) {
      return INACTIVE_REMOVE_RESULT;
    }

    const item = resolveItemTarget(registry, target);

    if (item === null) {
      return UNOWNED_REMOVE_RESULT;
    }

    const items = registry.items;
    const index = items.indexOf(item);

    if (index === -1) {
      return UNOWNED_REMOVE_RESULT;
    }

    if (!constraintController.getState(items.length).canRemove) {
      if (source === "api") {
        statusController.write(
          formatMinimumStatusMessage(
            markup.options.messageFormatters,
            {
              itemLabel: markup.options.itemLabel,
              key: item.key,
              position: index + 1,
              count: items.length,
              minimum: markup.options.minimum,
              maximum: markup.options.maximum
            }
          )
        );
      }

      return MINIMUM_REMOVE_RESULT;
    }

    const removedSnapshot = Object.freeze({
      element: item.element,
      key: item.key,
      index,
      position: index + 1
    });
    const resultingConstraintState =
      constraintController.getState(items.length - 1);
    const focusPlan = planRemovedRepeatableFieldsetItemFocus(
      root,
      item.element,
      items[index + 1]?.removeButton ?? null,
      items[index - 1]?.removeButton ?? null,
      markup.addButton,
      resultingConstraintState.canRemove,
      root.ownerDocument.activeElement,
      focusRequested
    );
    const nextSibling = item.element.nextSibling;
    const previousItemSnapshots = this.itemSnapshots;
    const restorationRecord: RemovalRestorationRecord = {
      key: item.key,
      previousIndex: index,
      previousPosition: index + 1,
      previousKey: items[index - 1]?.key ?? null,
      nextKey: items[index + 1]?.key ?? null,
      state: "pending"
    };
    const restoration = Object.freeze({
      restore: (
        options: RepeatableFieldsetRestoreOptions = {}
      ): RepeatableFieldsetRestoreResult => {
        if (this.root !== null) {
          validateRestoreOptions(this.root, options);
        }
        this.assertNoDisconnectedStateReentry();
        return this.performRestore(
          restorationRecord,
          options.focus ?? false,
          options.restoreState
        );
      }
    } satisfies RepeatableFieldsetRemovalRestoration);
    let removedRegistration: RemovedItemRegistration | null = null;
    let positionSynchronization:
      | RepeatableFieldsetPositionSynchronization
      | null = null;
    let controlSynchronization:
      | RepeatableFieldsetControlSynchronization
      | null = null;
    let preparation: RepeatableFieldsetRemovePreparation;

    try {
      preparation = addonManager.prepareItemRemoval(Object.freeze({
        instance: this,
        root,
        item: removedSnapshot,
        restoration
      }));
    } catch (error) {
      restorationRecord.state = "invalid";
      return Object.freeze({
        ok: false,
        reason: "addon-error" as const,
        error
      });
    }

    const addonCleanupFailure = addonManager.cleanupItem(item.element);

    if (addonCleanupFailure !== null) {
      restorationRecord.state = "invalid";
      try {
        preparation.rollback();
      } catch {
        // Preserve the cleanup failure as the operation diagnostic.
      }
      return Object.freeze({
        ok: false,
        reason: "addon-error" as const,
        error: addonCleanupFailure
      });
    }

    try {
      item.element.remove();

      if (item.element.parentNode !== null) {
        throw new RepeatableFieldsetError(
          "invalid-item",
          "The owned item could not be detached.",
          {
            root,
            element: item.element
          }
        );
      }

      removedRegistration = registry.unregisterItem(item);
      positionSynchronization =
        synchronizeRepeatableFieldsetPositions(
          root,
          registry.items
        );
      controlSynchronization = constraintController.synchronize(
        markup.addButton,
        registry.items
      );

      this.itemSnapshots = positionSynchronization.snapshots;
      const focusTarget =
        focusAfterRepeatableFieldsetItemRemoval(root, focusPlan);
      preparation.commit();
      restorationRecord.state = "ready";
      statusController.write(
        formatRemovedStatusMessage(
          markup.options.messageFormatters,
          {
            itemLabel: markup.options.itemLabel,
            key: removedSnapshot.key,
            position: removedSnapshot.position,
            count: positionSynchronization.snapshots.length,
            minimum: markup.options.minimum,
            maximum: markup.options.maximum
          }
        )
      );

      // The invocation data and resolved focus target become observable when
      // lifecycle events integrate with this stable operation boundary.
      void source;
      void trigger;
      void focusTarget;

      dispatchRepeatableFieldsetEvent(root, EVENTS.itemRemoved, Object.freeze({
        instance: this,
        root,
        item: removedSnapshot,
        key: removedSnapshot.key,
        previousIndex: removedSnapshot.index,
        previousPosition: removedSnapshot.position,
        count: positionSynchronization.snapshots.length,
        focusTarget,
        trigger,
        source
      }));

      addonManager.releaseItem(item.element);

      const result = Object.freeze({
        ok: true,
        item: removedSnapshot
      });

      return result;
    } catch (error) {
      restorationRecord.state = "invalid";
      try {
        preparation.rollback();
      } catch {
        // Continue restoring the author-owned item.
      }
      this.itemSnapshots = previousItemSnapshots;
      controlSynchronization?.rollback();
      positionSynchronization?.rollback();

      if (item.element.parentNode !== markup.itemsContainer) {
        const originalNextSibling =
          nextSibling?.parentNode === markup.itemsContainer
            ? nextSibling
            : markup.itemsContainer.children.item(index);

        markup.itemsContainer.insertBefore(
          item.element,
          originalNextSibling
        );
      }

      removedRegistration?.rollback();
      try {
        addonManager.restoreItem(this, root, removedSnapshot);
      } catch {
        // The author fieldset remains usable even if addon setup cannot be
        // recreated after rollback.
      }
      restoreFocusAfterFailedRepeatableFieldsetItemRemoval(
        root,
        item.element,
        focusPlan
      );

      return Object.freeze({
        ok: false,
        reason: "addon-error" as const,
        error
      });
    }
  }

  private performRestore(
    record: RemovalRestorationRecord,
    focusRequested: boolean,
    restoreState: RepeatableFieldsetRestoreOptions["restoreState"]
  ): RepeatableFieldsetRestoreResult {
    const root = this.root;
    const markup = this.markup;
    const registry = this.itemRegistry;
    const constraintController = this.constraintController;
    const statusController = this.statusController;
    const addonManager = this.addonManager;

    if (
      this.state !== "active" ||
      root === null ||
      markup === null ||
      registry === null ||
      constraintController === null ||
      statusController === null ||
      addonManager === null
    ) {
      return Object.freeze({ ok: false, reason: "inactive" as const });
    }

    if (record.state === "consumed") {
      return Object.freeze({ ok: false, reason: "consumed" as const });
    }

    if (record.state !== "ready") {
      return Object.freeze({ ok: false, reason: "not-ready" as const });
    }

    if (registry.getByKey(record.key) !== null) {
      return Object.freeze({ ok: false, reason: "conflict" as const });
    }

    if (!constraintController.getState(registry.items.length).canAdd) {
      if (markup.options.maximum !== null) {
        statusController.write(
          formatMaximumStatusMessage(
            markup.options.messageFormatters,
            {
              itemLabel: markup.options.itemLabel,
              key: record.key,
              position: record.previousPosition,
              count: registry.items.length,
              minimum: markup.options.minimum,
              maximum: markup.options.maximum
            }
          )
        );
      }

      return Object.freeze({ ok: false, reason: "maximum" as const });
    }

    record.state = "restoring";
    let candidate: HTMLFieldSetElement | null = null;
    let addedRegistration: AddedItemRegistration | null = null;
    let positionSynchronization:
      | RepeatableFieldsetPositionSynchronization
      | null = null;
    let controlSynchronization:
      | RepeatableFieldsetControlSynchronization
      | null = null;
    const previousItemSnapshots = this.itemSnapshots;
    let restoreFailed = false;
    let restoreError: unknown;

    try {
      candidate = cloneRepeatableFieldsetTemplate(root, markup.template);
      const materialized = materializeClonedRepeatableFieldsetTemplate(
        root,
        candidate,
        record.key
      );

      if (restoreState !== undefined) {
        const structuralBaseline = materialized.item.cloneNode(true);

        try {
          this.disconnectedStatePhaseActive = true;
          let returnValue: unknown;

          try {
            returnValue = restoreState(Object.freeze({
              candidate: materialized.item
            }));
          } finally {
            this.disconnectedStatePhaseActive = false;
          }

          if (isPromiseLike(returnValue)) {
            throw new TypeError(
              "Restore restoreState must complete synchronously."
            );
          }

          if (!materialized.item.isEqualNode(structuralBaseline)) {
            throw new TypeError(
              "Restore restoreState may change only current control state, not candidate structure, attributes, defaults, validity, errors, or file inputs."
            );
          }
        } catch (error) {
          restoreFailed = true;
          restoreError = error;
          throw error;
        }
      }

      materialized.focusTarget?.removeAttribute(ATTRIBUTES.focus);
      const nextItem =
        record.nextKey === null
          ? null
          : registry.getByKey(record.nextKey);
      const previousItem =
        record.previousKey === null
          ? null
          : registry.getByKey(record.previousKey);
      const insertionIndex =
        nextItem !== null
          ? registry.items.indexOf(nextItem)
          : previousItem !== null
            ? registry.items.indexOf(previousItem) + 1
            : Math.min(record.previousIndex, registry.items.length);
      const reference = registry.items[insertionIndex] ?? null;

      markup.itemsContainer.insertBefore(
        materialized.item,
        reference?.element ?? null
      );
      addedRegistration = registry.registerAddedItem(
        {
          element: materialized.item,
          legend: materialized.legend,
          removeButton: materialized.removeButton,
          key: materialized.key
        },
        insertionIndex
      );
      addonManager.setupItem(
        this,
        root,
        Object.freeze({
          element: materialized.item,
          key: materialized.key,
          index: insertionIndex,
          position: insertionIndex + 1
        }),
        "added"
      );
      positionSynchronization = synchronizeRepeatableFieldsetPositions(
        root,
        registry.items
      );
      controlSynchronization = constraintController.synchronize(
        markup.addButton,
        registry.items
      );
      const item = positionSynchronization.snapshots[insertionIndex];

      if (
        item === undefined ||
        item.element !== materialized.item ||
        item.key !== record.key
      ) {
        throw new RepeatableFieldsetError(
          "invalid-template",
          "The restored item could not be represented in collection order.",
          { root, element: materialized.item }
        );
      }

      this.itemSnapshots = positionSynchronization.snapshots;
      const focusTarget = focusRequested
        ? focusAddedRepeatableFieldsetItem(
            root,
            materialized.item,
            materialized.focusTarget
          )
        : null;

      statusController.write(
        formatRestoredStatusMessage(
          markup.options.messageFormatters,
          {
            itemLabel: markup.options.itemLabel,
            key: item.key,
            position: item.position,
            count: positionSynchronization.snapshots.length,
            minimum: markup.options.minimum,
            maximum: markup.options.maximum
          }
        )
      );

      dispatchRepeatableFieldsetEvent(
        root,
        EVENTS.itemRestored,
        Object.freeze({
          instance: this,
          root,
          item: Object.freeze({
            element: item.element,
            key: item.key,
            index: item.index,
            position: item.position
          }),
          key: item.key,
          previousIndex: record.previousIndex,
          previousPosition: record.previousPosition,
          index: item.index,
          position: item.position,
          count: positionSynchronization.snapshots.length,
          focusTarget
        })
      );

      record.state = "consumed";
      return Object.freeze({
        ok: true,
        item,
        previousIndex: record.previousIndex,
        previousPosition: record.previousPosition
      });
    } catch (error) {
      this.disconnectedStatePhaseActive = false;
      this.itemSnapshots = previousItemSnapshots;
      controlSynchronization?.rollback();
      positionSynchronization?.rollback();
      addedRegistration?.rollback();

      const addonCleanupFailure =
        candidate === null
          ? null
          : addonManager.cleanupItem(candidate);

      if (candidate !== null) {
        addonManager.releaseItem(candidate);

        if (candidate.parentElement === markup.itemsContainer) {
          candidate.remove();
        }
      }

      record.state = "ready";
      const reason:
        | "restore-error"
        | "addon-error"
        | "invalid-template" = restoreFailed
        ? "restore-error"
        : error instanceof RepeatableFieldsetAddonSetupError ||
            addonCleanupFailure !== null
          ? "addon-error"
          : "invalid-template";

      return Object.freeze({
        ok: false,
        reason,
        error: restoreFailed
          ? restoreError
          : (addonCleanupFailure ?? error)
      });
    }
  }

  private performMove(
    target: RepeatableFieldsetMoveTarget,
    direction: RepeatableFieldsetMoveDirection
  ): RepeatableFieldsetMoveResult {
    const root = this.root;
    const markup = this.markup;
    const registry = this.itemRegistry;
    const statusController = this.statusController;

    if (
      this.state !== "active" ||
      root === null ||
      markup === null ||
      registry === null ||
      statusController === null
    ) {
      return INACTIVE_MOVE_RESULT;
    }

    const item = resolveItemTarget(registry, target);

    if (item === null) {
      return UNOWNED_MOVE_RESULT;
    }

    const items = registry.items;
    const previousIndex = items.indexOf(item);

    if (previousIndex === -1) {
      return UNOWNED_MOVE_RESULT;
    }

    const previousSnapshot = Object.freeze({
      element: item.element,
      key: item.key,
      index: previousIndex,
      position: previousIndex + 1
    });
    const index =
      direction === "up"
        ? previousIndex - 1
        : previousIndex + 1;

    if (index < 0 || index >= items.length) {
      const boundary = direction === "up" ? "start" : "end";

      statusController.write(
        formatMoveBoundaryStatusMessage(
          markup.options.messageFormatters,
          {
            itemLabel: markup.options.itemLabel,
            key: previousSnapshot.key,
            position: previousSnapshot.position,
            count: items.length,
            minimum: markup.options.minimum,
            maximum: markup.options.maximum,
            direction,
            boundary
          }
        )
      );

      return Object.freeze({
        ok: false,
        reason: "boundary" as const,
        boundary,
        item: previousSnapshot
      });
    }

    const focusPlan = planMovedRepeatableFieldsetItemFocus(
      root,
      item.element,
      root.ownerDocument.activeElement
    );
    const originalNextSibling = item.element.nextSibling;
    const previousItemSnapshots = this.itemSnapshots;
    let movedRegistration: MovedItemRegistration | null = null;
    let positionSynchronization:
      | RepeatableFieldsetPositionSynchronization
      | null = null;

    try {
      movedRegistration = registry.moveItem(item, index);
      const followingItem = registry.items[index + 1] ?? null;

      markup.itemsContainer.insertBefore(
        item.element,
        followingItem?.element ?? null
      );

      if (item.element.parentElement !== markup.itemsContainer) {
        throw new RepeatableFieldsetError(
          "invalid-item",
          "The moved item could not be placed in the owned items container.",
          {
            root,
            element: item.element
          }
        );
      }

      positionSynchronization =
        synchronizeRepeatableFieldsetPositions(root, registry.items);
      const movedSnapshot = positionSynchronization.snapshots[index];

      if (
        movedSnapshot === undefined ||
        movedSnapshot.element !== item.element ||
        movedSnapshot.key !== item.key
      ) {
        throw new RepeatableFieldsetError(
          "invalid-item",
          "The moved item could not be represented in collection order.",
          {
            root,
            element: item.element
          }
        );
      }

      this.itemSnapshots = positionSynchronization.snapshots;
      const focusTarget = focusAfterRepeatableFieldsetItemMove(
        root,
        item.element,
        focusPlan
      );

      statusController.write(
        formatMovedStatusMessage(
          markup.options.messageFormatters,
          {
            itemLabel: markup.options.itemLabel,
            key: movedSnapshot.key,
            position: movedSnapshot.position,
            previousPosition: previousSnapshot.position,
            count: positionSynchronization.snapshots.length,
            minimum: markup.options.minimum,
            maximum: markup.options.maximum,
            direction
          }
        )
      );

      dispatchRepeatableFieldsetEvent(root, EVENTS.itemMoved, Object.freeze({
        instance: this,
        root,
        item: Object.freeze({
          element: movedSnapshot.element,
          key: movedSnapshot.key,
          index: movedSnapshot.index,
          position: movedSnapshot.position
        }),
        key: movedSnapshot.key,
        previousIndex: previousSnapshot.index,
        previousPosition: previousSnapshot.position,
        index: movedSnapshot.index,
        position: movedSnapshot.position,
        count: positionSynchronization.snapshots.length,
        direction,
        focusTarget
      }));

      return Object.freeze({
        ok: true,
        item: movedSnapshot,
        previousIndex: previousSnapshot.index,
        previousPosition: previousSnapshot.position,
        direction
      });
    } catch (error) {
      this.itemSnapshots = previousItemSnapshots;
      positionSynchronization?.rollback();

      try {
        const rollbackReference =
          originalNextSibling?.parentNode === markup.itemsContainer
            ? originalNextSibling
            : markup.itemsContainer.children.item(previousIndex);

        markup.itemsContainer.insertBefore(
          item.element,
          rollbackReference
        );
      } catch {
        // Registry rollback and the typed failure still proceed. A hostile
        // author mutation may prevent exact DOM recovery.
      }

      try {
        movedRegistration?.rollback();
      } catch {
        // Preserve the original move failure as the public diagnostic.
      }

      focusAfterRepeatableFieldsetItemMove(
        root,
        item.element,
        focusPlan
      );

      return Object.freeze({
        ok: false,
        reason: "move-error" as const,
        error
      });
    }
  }

  private getCapability(
    capability: "canAdd" | "canRemove"
  ): boolean {
    if (
      this.state !== "active" ||
      this.itemSnapshots === null ||
      this.constraintController === null
    ) {
      return false;
    }

    return this.constraintController.getState(
      this.itemSnapshots.length
    )[capability];
  }

  private assertNoDisconnectedStateReentry(): void {
    if (!this.disconnectedStatePhaseActive || this.root === null) {
      return;
    }

    throw new RepeatableFieldsetError(
      "invalid-options",
      "Structural commands cannot run from a disconnected state callback.",
      { root: this.root }
    );
  }
}

export function createRepeatableFieldset(
  root: HTMLElement,
  options: RepeatableFieldsetOptions = {}
): A11yRepeatableFieldset {
  return new A11yRepeatableFieldset(root, options);
}

function isParentNode(value: unknown): value is ParentNode {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<ParentNode>;
  return typeof candidate.querySelectorAll === "function";
}

function asHTMLRoot(value: ParentNode): HTMLElement | null {
  const candidate = value as ParentNode & Partial<HTMLElement>;

  if (
    candidate.nodeType !== 1 ||
    typeof candidate.matches !== "function"
  ) {
    return null;
  }

  if (!candidate.matches(SELECTORS.root)) {
    return null;
  }

  if (candidate.namespaceURI !== HTML_NAMESPACE) {
    throw new RepeatableFieldsetError(
      "invalid-root",
      "Every repeatable-fieldset root must be an HTML element.",
      { element: candidate as Element }
    );
  }

  return candidate as HTMLElement;
}

function collectRoots(scope: ParentNode): readonly HTMLElement[] {
  const roots: HTMLElement[] = [];
  const scopeRoot = asHTMLRoot(scope);

  if (scopeRoot !== null) {
    roots.push(scopeRoot);
  }

  for (const element of scope.querySelectorAll<Element>(SELECTORS.root)) {
    if (element.namespaceURI !== HTML_NAMESPACE) {
      throw new RepeatableFieldsetError(
        "invalid-root",
        "Every repeatable-fieldset root must be an HTML element.",
        { element }
      );
    }

    const root = element as HTMLElement;
    const ancestorRoot = root.parentElement?.closest(SELECTORS.root);

    if (ancestorRoot !== null && ancestorRoot !== undefined) {
      continue;
    }

    roots.push(root);
  }

  return roots;
}

export function initRepeatableFieldsetAll(
  scope?: ParentNode,
  options: RepeatableFieldsetOptions = {}
): readonly A11yRepeatableFieldset[] {
  const resolvedScope =
    scope ??
    (typeof document === "undefined" ? undefined : document);

  if (resolvedScope === undefined || !isParentNode(resolvedScope)) {
    throw new RepeatableFieldsetError(
      "invalid-root",
      "initRepeatableFieldsetAll requires a document or parent-node scope."
    );
  }

  return Object.freeze(
    collectRoots(resolvedScope).map((root) =>
      createRepeatableFieldset(root, options)
    )
  );
}
