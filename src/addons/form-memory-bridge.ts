import type {
  RepeatableFieldsetAddon,
  RepeatableFieldsetAddonContext,
  RepeatableFieldsetCleanup
} from "../addons";
import {
  ATTRIBUTES,
  EVENTS,
  ITEM_KEY_PATTERN,
  SELECTORS
} from "../constants";
import {
  discoverRepeatableFieldsetMarkup,
  type DiscoveredRepeatableFieldsetItem
} from "../discovery";
import type { RepeatableFieldsetOptions } from "../options";
import { materializeDiscoveredRepeatableFieldsetTemplate } from "../template";

const ADDON_ID = "a11y-repeatable-fieldset.form-memory-bridge";
const DRAFT_ADAPTER_ID =
  "a11y-repeatable-fieldset.form-memory-bridge.v1";
const SNAPSHOT_SCHEMA_VERSION = 1;
const ALLOWED_OPTION_KEYS = new Set([
  "root",
  "fieldKey",
  "createInstance",
  "save",
  "onSaveError"
]);

export type FormMemoryJsonPrimitive = boolean | null | number | string;
export type FormMemoryJsonObject = {
  readonly [key: string]: FormMemoryJsonValue;
};
export type FormMemoryJsonValue =
  | FormMemoryJsonPrimitive
  | readonly FormMemoryJsonValue[]
  | FormMemoryJsonObject;

/** Idempotent setup cleanup owned by the initialized core instance. */
export type FormMemoryCleanup = () => void;

/** The structural subset of an A11yFormDraftPersistence draft record. */
export interface FormMemoryDraftRecord {
  readonly fields: readonly FormMemoryDraftFieldRecord[];
}

/** A deliberately structural field type; consumers need no package coupling. */
export interface FormMemoryDraftFieldRecord {
  readonly adapterId?: string;
  readonly fieldKey: string;
  readonly kind: string;
  readonly value?: FormMemoryJsonValue;
}

/** The context shape used by A11yFormDraftPersistence control adapters. */
export interface FormMemoryDraftControlContext {
  readonly element: HTMLElement;
  readonly root: HTMLElement;
}

/**
 * Structurally satisfies A11yFormDraftPersistence's DraftControlAdapter
 * without importing that optional package.
 */
export interface FormMemoryDraftControlAdapter {
  readonly id: string;
  matches(element: HTMLElement): boolean;
  getFieldKey(
    element: HTMLElement,
    context: FormMemoryDraftControlContext
  ): string | null;
  read(
    element: HTMLElement,
    context: FormMemoryDraftControlContext
  ): FormMemoryJsonValue;
  compare(
    current: FormMemoryJsonValue,
    saved: FormMemoryJsonValue,
    context: FormMemoryDraftControlContext
  ): boolean;
  write(
    element: HTMLElement,
    saved: FormMemoryJsonValue,
    context: FormMemoryDraftControlContext
  ): void;
}

/** Minimum structural result contract inferred from the supplied core factory. */
export interface FormMemoryRepeatableInstance {
  destroy(): void;
}

export interface FormMemoryBridgeOptions<
  CoreOptions extends object = Record<string, unknown>,
  Instance extends FormMemoryRepeatableInstance = FormMemoryRepeatableInstance
> {
  /** The exact repeatable-fieldset root represented by this bridge. */
  readonly root: HTMLElement;
  /** Stable custom-field identity within the containing draft form. */
  readonly fieldKey: string;
  /** The public core factory, supplied to avoid bundling a second core copy. */
  readonly createInstance: FormMemoryCreateInstance<CoreOptions, Instance>;
  /** Saves the application-owned draft after a committed structure change. */
  readonly save: () => void | PromiseLike<unknown>;
  /** Observes a thrown or rejected save without adding bridge-owned UI. */
  readonly onSaveError?: (error: unknown) => void;
}

/** The public createRepeatableFieldset factory's structural signature. */
export type FormMemoryCreateInstance<
  CoreOptions extends object = Record<string, unknown>,
  Instance extends FormMemoryRepeatableInstance = FormMemoryRepeatableInstance
> = (
  root: HTMLElement,
  options?: CoreOptions
) => Instance;

export interface FormMemoryBridgeInitializeOptions<
  CoreOptions extends object = Record<string, unknown>
> {
  /** An available, user-approved record returned by drafts.check(). */
  readonly record?: FormMemoryDraftRecord;
  /** The same core options that would be passed to createRepeatableFieldset. */
  readonly repeatableFieldsetOptions?: CoreOptions;
}

export interface FormMemoryBridgeInitializeSuccess<
  Instance extends FormMemoryRepeatableInstance = FormMemoryRepeatableInstance
> {
  readonly ok: true;
  readonly instance: Instance;
  readonly structure: "not-found" | "restored";
  readonly addedKeys: readonly string[];
  readonly preservedItemCount: number;
  readonly reordered: boolean;
}

export type FormMemoryBridgeInitializeFailure =
  | {
      readonly ok: false;
      readonly reason: "invalid-snapshot";
    }
  | {
      readonly ok: false;
      readonly reason: "maximum-exceeded";
      readonly maximum: number;
      readonly requiredCount: number;
    }
  | {
      readonly ok: false;
      readonly reason: "structure-error";
      readonly error: unknown;
    };

export type FormMemoryBridgeInitializeResult<
  Instance extends FormMemoryRepeatableInstance = FormMemoryRepeatableInstance
> =
  | FormMemoryBridgeInitializeSuccess<Instance>
  | FormMemoryBridgeInitializeFailure;

/** Public structural setup context; bridge.initialize() owns its invocation. */
export interface FormMemoryBridgeAddonContext {
  readonly root: HTMLElement;
  on(
    name: string,
    listener: (event: Event) => void
  ): FormMemoryCleanup;
}

export interface FormMemoryBridge<
  CoreOptions extends object = Record<string, unknown>,
  Instance extends FormMemoryRepeatableInstance = FormMemoryRepeatableInstance
> {
  readonly id: string;
  setup(
    context: FormMemoryBridgeAddonContext
  ): FormMemoryCleanup;
  readonly setupItem?: undefined;
  /** Pass this adapter to A11yFormDraftPersistence customControlAdapters. */
  readonly draftControlAdapter: FormMemoryDraftControlAdapter;
  /**
   * Restores approved structure before core initialization and includes this
   * addon in the new instance. No draft values are read or written here.
   */
  initialize(
    options?: FormMemoryBridgeInitializeOptions<CoreOptions>
  ): FormMemoryBridgeInitializeResult<Instance>;
}

interface StructureSnapshot extends FormMemoryJsonObject {
  readonly schemaVersion: 1;
  readonly itemKeys: readonly string[];
}

type SnapshotExtraction =
  | { readonly status: "not-found" }
  | { readonly status: "invalid" }
  | {
      readonly status: "valid";
      readonly snapshot: Readonly<StructureSnapshot>;
    };

function invalidOptions(message: string): TypeError {
  return new TypeError(`Form Memory Bridge: ${message}`);
}

function isHTMLElement(value: unknown): value is HTMLElement {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<HTMLElement>;

  return (
    candidate.nodeType === 1 &&
    candidate.namespaceURI === "http://www.w3.org/1999/xhtml" &&
    typeof candidate.matches === "function" &&
    typeof candidate.querySelectorAll === "function"
  );
}

function normalizeOptions<
  CoreOptions extends object,
  Instance extends FormMemoryRepeatableInstance
>(
  options: FormMemoryBridgeOptions<CoreOptions, Instance>
): Readonly<FormMemoryBridgeOptions<CoreOptions, Instance>> {
  if (
    typeof options !== "object" ||
    options === null ||
    Array.isArray(options)
  ) {
    throw invalidOptions("options must be an object.");
  }

  const unknownKey = Object.keys(options).find(
    (key) => !ALLOWED_OPTION_KEYS.has(key)
  );

  if (unknownKey !== undefined) {
    throw invalidOptions(`unknown option \"${unknownKey}\".`);
  }

  if (!isHTMLElement(options.root)) {
    throw invalidOptions("root must be an HTML element.");
  }

  if (
    typeof options.fieldKey !== "string" ||
    options.fieldKey.trim() === "" ||
    options.fieldKey !== options.fieldKey.trim()
  ) {
    throw invalidOptions("fieldKey must be a trimmed, non-empty string.");
  }

  if (typeof options.save !== "function") {
    throw invalidOptions("save must be a function.");
  }

  if (typeof options.createInstance !== "function") {
    throw invalidOptions("createInstance must be a function.");
  }

  if (
    options.onSaveError !== undefined &&
    typeof options.onSaveError !== "function"
  ) {
    throw invalidOptions("onSaveError must be a function when supplied.");
  }

  return Object.freeze({ ...options });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSnapshot(value: unknown): Readonly<StructureSnapshot> | null {
  if (!isRecord(value)) {
    return null;
  }

  const keys = Object.keys(value);

  if (
    keys.length !== 2 ||
    !keys.includes("schemaVersion") ||
    !keys.includes("itemKeys") ||
    value["schemaVersion"] !== SNAPSHOT_SCHEMA_VERSION ||
    !Array.isArray(value["itemKeys"])
  ) {
    return null;
  }

  const itemKeys = value["itemKeys"];
  const uniqueKeys = new Set<string>();

  for (const key of itemKeys) {
    if (
      typeof key !== "string" ||
      !ITEM_KEY_PATTERN.test(key) ||
      uniqueKeys.has(key)
    ) {
      return null;
    }

    uniqueKeys.add(key);
  }

  return Object.freeze({
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    itemKeys: Object.freeze([...uniqueKeys])
  });
}

function snapshotSignature(snapshot: Readonly<StructureSnapshot>): string {
  return JSON.stringify(snapshot);
}

function extractSnapshot(
  record: FormMemoryDraftRecord | undefined,
  fieldKey: string
): SnapshotExtraction {
  if (record === undefined) {
    return Object.freeze({ status: "not-found" });
  }

  if (
    typeof record !== "object" ||
    record === null ||
    !Array.isArray(record.fields)
  ) {
    return Object.freeze({ status: "invalid" });
  }

  const matchingFields = record.fields.filter(
    (field) =>
      typeof field === "object" &&
      field !== null &&
      field.fieldKey === fieldKey
  );

  if (matchingFields.length === 0) {
    return Object.freeze({ status: "not-found" });
  }

  const field = matchingFields[0];

  if (
    matchingFields.length !== 1 ||
    field === undefined ||
    field.kind !== "custom" ||
    field.adapterId !== DRAFT_ADAPTER_ID
  ) {
    return Object.freeze({ status: "invalid" });
  }

  const snapshot = parseSnapshot(field.value);

  return snapshot === null
    ? Object.freeze({ status: "invalid" })
    : Object.freeze({ status: "valid", snapshot });
}

function getKey(
  item: HTMLFieldSetElement,
  allowMissing: boolean
): string | null {
  if (!item.hasAttribute(ATTRIBUTES.key)) {
    return allowMissing ? null : invalidItemKey(item);
  }

  const key = (item.getAttribute(ATTRIBUTES.key) ?? "").trim();

  return ITEM_KEY_PATTERN.test(key) ? key : invalidItemKey(item);
}

function invalidItemKey(item: HTMLFieldSetElement): never {
  throw new TypeError(
    `Form Memory Bridge: item key on ${item.localName} must match ${ITEM_KEY_PATTERN.source}.`
  );
}

function getCurrentOwnedItems(root: HTMLElement): readonly HTMLFieldSetElement[] {
  return Object.freeze(
    Array.from(root.querySelectorAll<HTMLFieldSetElement>(SELECTORS.item)).filter(
      (item) =>
        item.closest(SELECTORS.root) === root &&
        item.parentElement?.matches(SELECTORS.items) === true &&
        item.parentElement?.closest(SELECTORS.root) === root
    )
  );
}

function readCurrentSnapshot(root: HTMLElement): Readonly<StructureSnapshot> {
  const itemKeys: string[] = [];
  const usedKeys = new Set<string>();

  for (const item of getCurrentOwnedItems(root)) {
    const key = getKey(item, true);

    if (key === null) {
      continue;
    }

    if (usedKeys.has(key)) {
      throw new TypeError(
        `Form Memory Bridge: item key \"${key}\" is duplicated.`
      );
    }

    usedKeys.add(key);
    itemKeys.push(key);
  }

  return Object.freeze({
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    itemKeys: Object.freeze(itemKeys)
  });
}

function createDesiredItemOrder(
  currentItems: readonly DiscoveredRepeatableFieldsetItem[],
  restoredItems: ReadonlyMap<string, HTMLFieldSetElement>,
  snapshot: Readonly<StructureSnapshot>
): {
  readonly items: readonly HTMLFieldSetElement[];
  readonly preservedItemCount: number;
} {
  const snapshotKeys = new Set(snapshot.itemKeys);
  const desired = snapshot.itemKeys.map((key) => {
    const item = restoredItems.get(key);

    if (item === undefined) {
      throw new TypeError(
        `Form Memory Bridge: no fieldset was prepared for key \"${key}\".`
      );
    }

    return item;
  });
  const preserved = currentItems
    .filter(({ key }) => key === null || !snapshotKeys.has(key))
    .map(({ element }) => element);

  return Object.freeze({
    items: Object.freeze([...desired, ...preserved]),
    preservedItemCount: preserved.length
  });
}

function validatePreparedItemIds(
  items: readonly HTMLFieldSetElement[]
): void {
  const ids = new Set<string>();

  for (const item of items) {
    const elements = [item, ...item.querySelectorAll<Element>("[id]")];

    for (const element of elements) {
      const id = element.getAttribute("id");

      if (id === null || id === "") {
        continue;
      }

      if (ids.has(id)) {
        throw new TypeError(
          `Form Memory Bridge: prepared items duplicate the id \"${id}\".`
        );
      }

      ids.add(id);
    }
  }
}

function mergeItemsIntoAuthorChildren(
  originalChildren: readonly Element[],
  currentItems: readonly DiscoveredRepeatableFieldsetItem[],
  desiredItems: readonly HTMLFieldSetElement[]
): readonly Element[] {
  if (currentItems.length === 0) {
    return Object.freeze([...originalChildren, ...desiredItems]);
  }

  const currentElements = new Set(
    currentItems.map(({ element }) => element)
  );
  const lastCurrent = currentItems.at(-1)?.element;
  const finalChildren: Element[] = [];
  let desiredIndex = 0;

  for (const child of originalChildren) {
    if (!currentElements.has(child as HTMLFieldSetElement)) {
      finalChildren.push(child);
      continue;
    }

    const desired = desiredItems[desiredIndex];

    if (desired !== undefined) {
      finalChildren.push(desired);
      desiredIndex += 1;
    }

    if (child === lastCurrent) {
      finalChildren.push(...desiredItems.slice(desiredIndex));
      desiredIndex = desiredItems.length;
    }
  }

  return Object.freeze(finalChildren);
}

function sameElementOrder(
  left: readonly Element[],
  right: readonly Element[]
): boolean {
  return (
    left.length === right.length &&
    left.every((element, index) => element === right[index])
  );
}

function normalizeInitializeOptions<CoreOptions extends object>(
  options: FormMemoryBridgeInitializeOptions<CoreOptions> | undefined
): Readonly<FormMemoryBridgeInitializeOptions<CoreOptions>> {
  if (options === undefined) {
    return Object.freeze({});
  }

  if (
    typeof options !== "object" ||
    options === null ||
    Array.isArray(options)
  ) {
    throw invalidOptions("initialize options must be an object.");
  }

  const unknownKey = Object.keys(options).find(
    (key) => key !== "record" && key !== "repeatableFieldsetOptions"
  );

  if (unknownKey !== undefined) {
    throw invalidOptions(
      `unknown initialize option \"${unknownKey}\".`
    );
  }

  return options;
}

/**
 * Creates a two-phase, opt-in integration for A11yFormDraftPersistence.
 *
 * The bridge persists stable keys and order only. Its explicit initialize()
 * method restores that structure from the trusted template before the core
 * discovers items; A11yFormDraftPersistence remains responsible for values,
 * expiry, storage, user consent, sensitive-field exclusions, and clearing.
 */
export function createFormMemoryBridge<
  CoreOptions extends object,
  Instance extends FormMemoryRepeatableInstance
>(
  suppliedOptions: FormMemoryBridgeOptions<CoreOptions, Instance>
): FormMemoryBridge<CoreOptions, Instance> {
  const options = normalizeOptions(suppliedOptions);
  const root = options.root;
  const fieldKey = options.fieldKey;
  let addonActive = false;
  let acceptedRestoreSignature: string | null = null;
  let saveQueued = false;
  let saveRunning = false;
  let saveGeneration = 0;

  const queue = (callback: () => void): void => {
    const ownerWindow = root.ownerDocument.defaultView;

    if (ownerWindow !== null) {
      ownerWindow.queueMicrotask(callback);
    } else {
      globalThis.queueMicrotask(callback);
    }
  };

  const reportSaveError = (error: unknown): void => {
    try {
      options.onSaveError?.(error);
    } catch {
      // Error observers cannot destabilize component lifecycle.
    }
  };

  const flushSave = (generation: number): void => {
    if (
      !addonActive ||
      generation !== saveGeneration ||
      saveRunning ||
      !saveQueued
    ) {
      return;
    }

    saveQueued = false;
    saveRunning = true;
    let result: void | PromiseLike<unknown>;

    try {
      result = options.save();
    } catch (error) {
      saveRunning = false;
      reportSaveError(error);

      if (saveQueued) {
        queue(() => flushSave(generation));
      }

      return;
    }

    Promise.resolve(result).then(
      () => {
        if (generation !== saveGeneration) {
          return;
        }

        saveRunning = false;

        if (saveQueued) {
          queue(() => flushSave(generation));
        }
      },
      (error: unknown) => {
        if (generation !== saveGeneration) {
          return;
        }

        saveRunning = false;
        reportSaveError(error);

        if (saveQueued) {
          queue(() => flushSave(generation));
        }
      }
    );
  };

  const requestSave = (): void => {
    if (!addonActive) {
      return;
    }

    acceptedRestoreSignature = snapshotSignature(
      readCurrentSnapshot(root)
    );
    saveQueued = true;
    const generation = saveGeneration;
    queue(() => flushSave(generation));
  };

  const draftControlAdapter = Object.freeze({
    id: DRAFT_ADAPTER_ID,
    matches(element: HTMLElement): boolean {
      return element === root;
    },
    getFieldKey(
      element: HTMLElement,
      _context: FormMemoryDraftControlContext
    ): string | null {
      return element === root ? fieldKey : null;
    },
    read(
      element: HTMLElement,
      _context: FormMemoryDraftControlContext
    ): FormMemoryJsonValue {
      if (element !== root) {
        throw new TypeError(
          "Form Memory Bridge: the draft adapter received an unowned element."
        );
      }

      return readCurrentSnapshot(root);
    },
    compare(
      current: FormMemoryJsonValue,
      saved: FormMemoryJsonValue,
      _context: FormMemoryDraftControlContext
    ): boolean {
      const currentSnapshot = parseSnapshot(current);
      const savedSnapshot = parseSnapshot(saved);

      return (
        currentSnapshot !== null &&
        savedSnapshot !== null &&
        snapshotSignature(currentSnapshot) ===
          snapshotSignature(savedSnapshot)
      );
    },
    write(
      element: HTMLElement,
      saved: FormMemoryJsonValue,
      _context: FormMemoryDraftControlContext
    ): void {
      const snapshot = parseSnapshot(saved);

      if (
        element !== root ||
        !addonActive ||
        snapshot === null ||
        acceptedRestoreSignature !== snapshotSignature(snapshot)
      ) {
        throw new TypeError(
          "Form Memory Bridge: restore structure was not prepared for this snapshot."
        );
      }
    }
  } satisfies FormMemoryDraftControlAdapter);

  const addon = {
    id: ADDON_ID,
    draftControlAdapter,
    setup(context: RepeatableFieldsetAddonContext): RepeatableFieldsetCleanup {
      if (context.root !== root) {
        throw invalidOptions(
          "one bridge instance cannot be reused for a different root."
        );
      }

      addonActive = true;
      saveGeneration += 1;
      const cleanups: RepeatableFieldsetCleanup[] = [];

      try {
        cleanups.push(
          context.on(EVENTS.itemAdded, requestSave),
          context.on(EVENTS.itemDuplicated, requestSave),
          context.on(EVENTS.itemRemoved, requestSave),
          context.on(EVENTS.itemRestored, requestSave),
          context.on(EVENTS.itemMoved, requestSave)
        );
      } catch (error) {
        addonActive = false;
        saveGeneration += 1;

        for (const cleanup of [...cleanups].reverse()) {
          cleanup();
        }

        throw error;
      }

      return () => {
        addonActive = false;
        acceptedRestoreSignature = null;
        saveQueued = false;
        saveRunning = false;
        saveGeneration += 1;

        for (const cleanup of [...cleanups].reverse()) {
          cleanup();
        }
      };
    },
    initialize(
      suppliedInitializeOptions?: FormMemoryBridgeInitializeOptions<CoreOptions>
    ): FormMemoryBridgeInitializeResult<Instance> {
      if (addonActive) {
        throw invalidOptions("the bridge root is already initialized.");
      }

      const initializeOptions = normalizeInitializeOptions(
        suppliedInitializeOptions
      );
      const coreOptions = (
        initializeOptions.repeatableFieldsetOptions ?? {}
      ) as RepeatableFieldsetOptions;
      const extracted = extractSnapshot(
        initializeOptions.record,
        fieldKey
      );

      if (extracted.status === "invalid") {
        return Object.freeze({
          ok: false,
          reason: "invalid-snapshot"
        });
      }

      const markup = discoverRepeatableFieldsetMarkup(root, coreOptions);
      const originalChildren = Object.freeze(
        Array.from(markup.itemsContainer.children)
      );
      let finalChildren = originalChildren;
      let addedKeys: readonly string[] = Object.freeze([]);
      let preservedItemCount = markup.items.length;
      let reordered = false;

      if (extracted.status === "valid") {
        const existingByKey = new Map<string, HTMLFieldSetElement>();

        for (const item of markup.items) {
          if (item.key !== null) {
            existingByKey.set(item.key, item.element);
          }
        }

        const missingKeys = extracted.snapshot.itemKeys.filter(
          (key) => !existingByKey.has(key)
        );
        const requiredCount = markup.items.length + missingKeys.length;

        if (
          markup.options.maximum !== null &&
          requiredCount > markup.options.maximum
        ) {
          return Object.freeze({
            ok: false,
            reason: "maximum-exceeded",
            maximum: markup.options.maximum,
            requiredCount
          });
        }

        const restoredItems = new Map(existingByKey);
        const preparedItems: HTMLFieldSetElement[] = [];

        try {
          for (const key of missingKeys) {
            const materialized =
              materializeDiscoveredRepeatableFieldsetTemplate(
                markup,
                key
              );
            restoredItems.set(key, materialized.item);
            preparedItems.push(materialized.item);
          }

          validatePreparedItemIds(preparedItems);

          const desired = createDesiredItemOrder(
            markup.items,
            restoredItems,
            extracted.snapshot
          );
          finalChildren = mergeItemsIntoAuthorChildren(
            originalChildren,
            markup.items,
            desired.items
          );
          addedKeys = Object.freeze([...missingKeys]);
          preservedItemCount = desired.preservedItemCount;
          reordered = !sameElementOrder(originalChildren, finalChildren);
          acceptedRestoreSignature = snapshotSignature(extracted.snapshot);
        } catch (error) {
          acceptedRestoreSignature = null;
          return Object.freeze({
            ok: false,
            reason: "structure-error" as const,
            error
          });
        }
      } else {
        acceptedRestoreSignature = null;
      }

      if (reordered) {
        markup.itemsContainer.replaceChildren(...finalChildren);
      }

      try {
        const instance = options.createInstance(
          root,
          {
            ...coreOptions,
            addons: Object.freeze([
              ...(coreOptions.addons ?? []),
              addon
            ])
          } as CoreOptions
        );

        if (!addonActive) {
          throw invalidOptions(
            "createInstance must initialize the supplied root with the supplied addon options."
          );
        }

        return Object.freeze({
          ok: true,
          instance,
          structure:
            extracted.status === "valid" ? "restored" : "not-found",
          addedKeys,
          preservedItemCount,
          reordered
        });
      } catch (error) {
        acceptedRestoreSignature = null;

        if (reordered) {
          markup.itemsContainer.replaceChildren(...originalChildren);
        }

        throw error;
      }
    }
  } satisfies RepeatableFieldsetAddon & {
    readonly draftControlAdapter: FormMemoryDraftControlAdapter;
    initialize(
      options?: FormMemoryBridgeInitializeOptions<CoreOptions>
    ): FormMemoryBridgeInitializeResult<Instance>;
  };

  return Object.freeze(addon) as unknown as FormMemoryBridge<
    CoreOptions,
    Instance
  >;
}
