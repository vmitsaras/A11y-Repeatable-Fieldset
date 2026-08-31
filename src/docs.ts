/**
 * Stable package metadata for documentation tooling.
 *
 * The runtime is implemented but unpublished. Installation and usage remain
 * null until release evidence exists.
 */

import {
  DEFAULT_OPTIONS,
  EVENTS,
  SELECTORS,
  TEMPLATE_KEY_TOKEN
} from "./constants";
import { REPEATABLE_FIELDSET_ERROR_CODES } from "./errors";

export interface PluginDocsSelector {
  readonly selector: string;
  readonly description: string;
}

export interface PluginDocsKeyboardEntry {
  readonly key: string;
  readonly description: string;
}

export interface PluginDocsApiEntry {
  readonly name: string;
  readonly type: string;
  readonly description: string;
  readonly status: "implemented" | "planned";
}

export interface PluginDocsDefault {
  readonly name: string;
  readonly value: string;
  readonly description: string;
}

export interface PluginDocsCssCustomProperty {
  readonly name: string;
  readonly defaultValue: string;
  readonly description: string;
}

export interface PluginDocsResult {
  readonly operation: "add" | "duplicate" | "remove" | "restore" | "move";
  readonly failureReasons: readonly string[];
}

export interface PluginDocsEvent {
  readonly key:
    | "init"
    | "itemAdded"
    | "itemDuplicated"
    | "itemRemoved"
    | "itemRestored"
    | "itemMoved"
    | "destroy";
  readonly name: string;
  readonly description: string;
}

export interface PluginDocsExample {
  readonly name: string;
  readonly description: string;
  readonly path: string;
  readonly status: "implemented" | "planned";
}

export interface PluginDocs {
  readonly slug: string;
  readonly name: string;
  readonly packageName: string;
  readonly version: "1.0.0";
  readonly description: string;
  readonly status: "unpublished";
  readonly availabilityNote: string;
  readonly repo: string;
  readonly npm: null;
  readonly install: null;
  readonly usage: null;
  readonly selectors: readonly PluginDocsSelector[];
  readonly keyboard: readonly PluginDocsKeyboardEntry[];
  readonly focus: readonly string[];
  readonly accessibility: readonly string[];
  readonly defaults: readonly PluginDocsDefault[];
  readonly cssCustomProperties: readonly PluginDocsCssCustomProperty[];
  readonly api: readonly PluginDocsApiEntry[];
  readonly results: readonly PluginDocsResult[];
  readonly errorCodes: readonly string[];
  readonly events: readonly PluginDocsEvent[];
  readonly examples: readonly PluginDocsExample[];
  readonly limitations: readonly string[];
}

export const docs: PluginDocs = Object.freeze({
  slug: "a11y-repeatable-fieldset",
  name: "A11yRepeatableFieldset",
  packageName: "a11y-repeatable-fieldset",
  version: "1.0.0",
  description:
    "Add, remove, duplicate, and reorder accessible form fieldsets with a dependency-free TypeScript plugin that preserves stable IDs and keyboard focus.",
  status: "unpublished",
  availabilityNote:
    "Option normalization, error contracts, semantic discovery, transactional existing-item registration, stable-key allocation, disconnected template materialization, visible-position synchronization, duplicate-instance registration, one-item Add/Remove/Duplicate/Move commands, exact-key addon restoration, native constraint-state synchronization, deterministic structural focus behavior, managed polite structural announcements, typed message localization, immutable collection/capability queries, non-destructive core teardown, seven typed lifecycle events, component/per-item addon registration and cleanup, independent single-owner Remove-request and removal-preparation routing, and the separately exported dependency-free Validation Bridge, Legend Sync, Remove Guard, Accessible Reorder, Duplicate Item, Undo Remove, and Form Memory Bridge addons are implemented. The canonical built-artifact repository example, static documentation shell, copied Pages assets, executable core and addon demos, no-JavaScript comparison, deterministic recovery example, and repository-subpath simulation exist; broader manual browser, assistive-technology, reflow, and visual-preference evidence plus Pages deployment remain pending; the package is unpublished.",
  repo: "https://github.com/vmitsaras/A11y-Repeatable-Fieldset",
  npm: null,
  install: null,
  usage: null,
  selectors: [
    {
      selector: SELECTORS.root,
      description: "Neutral component root."
    },
    {
      selector: SELECTORS.items,
      description: "Owned container for direct-child item fieldsets."
    },
    {
      selector: SELECTORS.item,
      description: "Semantic repeated item with a meaningful legend."
    },
    {
      selector: SELECTORS.template,
      description: "Trusted inert source for one new item."
    },
    {
      selector: SELECTORS.add,
      description: "Author-owned native Add button."
    },
    {
      selector: SELECTORS.remove,
      description: "Author-owned native Remove button for one item."
    },
    {
      selector: SELECTORS.key,
      description: "Stable item identity, distinct from visible position."
    },
    {
      selector: SELECTORS.position,
      description: "One-based visible-position text marker."
    },
    {
      selector: SELECTORS.focus,
      description: "Optional preferred focus target in a template item."
    },
    {
      selector: SELECTORS.status,
      description: "Optional empty author-provided polite status region."
    }
  ],
  keyboard: [
    {
      key: "Tab and Shift+Tab",
      description:
        "Move through native form controls and enabled Add or Remove buttons in natural DOM order."
    },
    {
      key: "Enter or Space",
      description:
        "Activate a focused native Add or Remove button using browser behavior."
    }
  ],
  focus: [
    "A user-triggered Add resolves an explicit focus marker, the first eligible labelable control, an intentional fieldset fallback, then leaves focus on Add.",
    "API additions do not move focus by default.",
    "Removal resolves the next Remove button, previous Remove button, Add button, then an intentional root fallback before detachment.",
    "Post-removal candidates that will become disabled at the minimum are skipped.",
    "Move preserves the same eligible active element inside the moved item and leaves unrelated focus unchanged."
  ],
  accessibility: [
    "Server-rendered fieldsets, legends, labels, names, values, errors, and submission remain usable before initialization.",
    "Read-only discovery filters by nearest-root ownership and validates semantic item, control, template, status, key, and ID structure before later initialization work.",
    "Initialization registers existing fieldsets in DOM order, preserves supplied server keys, and assigns missing fieldset keys without recreating items or renaming controls.",
    "Per-instance key allocation reserves server and generated keys for the lifetime, remains independent of visible position, and validates JavaScript key-factory output.",
    "Initialization writes one-based text only to owned position markers, returns immutable internal index/position snapshots, excludes nested ownership, and rolls marker changes back on failure.",
    "Internal template materialization returns a disconnected clone, rewrites only approved token attributes, validates local references and IDs, preserves defaults, and leaves file inputs empty.",
    "Add clones only the trusted template, reserves a stable key, inserts once, returns an immutable item snapshot, and rolls back an incomplete candidate without reusing its key.",
    "Successful initialization reveals native button-type Add and Remove controls only after their minimum/maximum disabled state is synchronized.",
    "Routine structural changes use at most one managed polite, atomic status region; blocked API limits use boundary-only text and destroy cancels pending clears.",
    "Message formatters receive frozen structural-only context, use frozen English defaults, and fall back per concept for thrown, blank, or non-string custom output.",
    "Native disabled semantics communicate minimum and maximum boundaries without redundant aria-disabled.",
    "The optional Validation Bridge registers existing and added items through an application adapter, runs target error and summary cleanup before detachment, creates no structural live region, and remains absent from the main runtime entry.",
    "The optional Legend Sync addon updates only a dedicated direct-legend suffix after a deliberately selected source commits a change; it preserves generic label and position text, creates no live region, rejects high-risk sources, and remains absent from the main runtime entry.",
    "The optional Remove Guard owns one typed control-request route, supports synchronous or asynchronous explicit application confirmation, revalidates ownership and minimum at approval time, reads no form values itself, creates no lifecycle event or structural message, and remains absent from the main runtime entry.",
    "The optional Accessible Reorder addon creates native Move buttons and delegates structural work to public move(); core owns order, positions, focus, status, rollback, and the completed item-moved event.",
    "The optional Undo Remove addon keeps one expiring data-only snapshot, restores trusted-template structure with the removed reserved key, pauses expiry while its native button has focus, never accesses file values, and remains absent from the main runtime entry.",
    "The optional Form Memory Bridge persists stable keys and order only, prepares approved missing trusted-template items before core discovery, preserves newer server items, delegates value/storage/privacy lifecycle to application-owned draft persistence, and remains absent from the main runtime entry.",
    "Optional CSS must provide visible focus, forced-colors resilience, responsive wrapping, and reduced-motion-safe presentation.",
    "Automated tests are structural evidence and do not establish WCAG conformance or screen-reader interoperability."
  ],
  defaults: [
    {
      name: "minimum",
      value: String(DEFAULT_OPTIONS.minimum),
      description: "Minimum number of retained items."
    },
    {
      name: "maximum",
      value:
        DEFAULT_OPTIONS.maximum === null
          ? "unbounded"
          : String(DEFAULT_OPTIONS.maximum),
      description: "No maximum unless explicitly configured."
    },
    {
      name: "itemLabel",
      value: DEFAULT_OPTIONS.itemLabel,
      description: "Default generic item label."
    },
    {
      name: "focusOnAdd",
      value: String(DEFAULT_OPTIONS.focusOnAdd),
      description: "Focus user-triggered additions by default."
    },
    {
      name: "announceChanges",
      value: String(DEFAULT_OPTIONS.announceChanges),
      description: "Enable structural announcements by default."
    },
    {
      name: "messageFormatters",
      value: "frozen English callbacks",
      description:
        "Default added, removed, restored, duplicated, moved, Move-boundary, maximum, and minimum status text."
    },
    {
      name: "templateToken",
      value: TEMPLATE_KEY_TOKEN,
      description: "Only supported stable-key template token."
    }
  ],
  cssCustomProperties: [
    { name: "--a11y-repeatable-fieldset-item-gap", defaultValue: "1rem", description: "Gap between repeated fieldsets." },
    { name: "--a11y-repeatable-fieldset-item-padding", defaultValue: "1rem", description: "Inset space inside each repeated fieldset." },
    { name: "--a11y-repeatable-fieldset-item-border-color", defaultValue: "currentColor", description: "Fieldset boundary color." },
    { name: "--a11y-repeatable-fieldset-item-border-width", defaultValue: "0.125rem", description: "Fieldset boundary width." },
    { name: "--a11y-repeatable-fieldset-item-border-radius", defaultValue: "0", description: "Fieldset boundary corner radius." },
    { name: "--a11y-repeatable-fieldset-control-gap", defaultValue: "0.75rem", description: "Gap between optional control-group children." },
    { name: "--a11y-repeatable-fieldset-action-color", defaultValue: "LinkText", description: "Native Add and Remove action foreground color." },
    { name: "--a11y-repeatable-fieldset-muted-color", defaultValue: "GrayText", description: "Muted limit and disabled-action foreground color." },
    { name: "--a11y-repeatable-fieldset-focus-ring-color", defaultValue: "Highlight", description: "Visible keyboard-focus outline color." },
    { name: "--a11y-repeatable-fieldset-focus-ring-width", defaultValue: "0.1875rem", description: "Visible keyboard-focus outline width." },
    { name: "--a11y-repeatable-fieldset-focus-ring-offset", defaultValue: "0.1875rem", description: "Space between a control and its focus outline." }
  ],
  api: [
    {
      name: "new A11yRepeatableFieldset(root, options)",
      type:
        "(root: HTMLElement, options?: RepeatableFieldsetOptions) => A11yRepeatableFieldset",
      description:
        "Discovers and registers existing items in place, synchronizes owned position markers, then reuses the active instance for the same root.",
      status: "implemented"
    },
    {
      name: "createRepeatableFieldset(root, options)",
      type:
        "(root: HTMLElement, options?: RepeatableFieldsetOptions) => RepeatableFieldsetInstance",
      description:
        "Creates or reuses one registered, position-synchronized foundation instance.",
      status: "implemented"
    },
    {
      name: "initRepeatableFieldsetAll(scope, options)",
      type:
        "(scope?: ParentNode, options?: RepeatableFieldsetOptions) => readonly RepeatableFieldsetInstance[]",
      description:
        "Explicitly initializes each top-level root in a scope without running on import.",
      status: "implemented"
    },
    {
      name: "init()",
      type: "() => this",
      description:
        "Idempotently returns the constructor-initialized instance and never revives a destroyed instance.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetInstance",
      type:
        "{ init(): this; add(options?: RepeatableFieldsetAddOptions): RepeatableFieldsetAddResult; duplicate(target: RepeatableFieldsetDuplicateTarget, options?: RepeatableFieldsetDuplicateOptions): RepeatableFieldsetDuplicateResult; remove(target: RepeatableFieldsetRemoveTarget, options?: RepeatableFieldsetRemoveOptions): RepeatableFieldsetRemoveResult; move(target: RepeatableFieldsetMoveTarget, direction: RepeatableFieldsetMoveDirection): RepeatableFieldsetMoveResult; getItems(): readonly RepeatableFieldsetItem[]; getCount(): number; canAdd(): boolean; canRemove(): boolean; destroy(): void }",
      description:
        "Current foundation instance surface with transactional one-item Add/Remove/Duplicate/Move and immutable collection/capability queries.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetKey",
      type: "string",
      description:
        "Stable item identity that remains separate from visible position.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetKeySource",
      type: '"initialization" | "add" | "duplicate"',
      description:
        "Identifies why the component is requesting a generated key.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetKeyFactoryContext",
      type:
        "{ root: HTMLElement; source: RepeatableFieldsetKeySource; sequence: number; reservedKeys: readonly RepeatableFieldsetKey[] }",
      description:
        "Frozen per-call key-factory context with a frozen reservation snapshot.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetKeyFactory",
      type:
        "(context: Readonly<RepeatableFieldsetKeyFactoryContext>) => RepeatableFieldsetKey",
      description:
        "Optional JavaScript-only factory whose output is grammar and uniqueness validated.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetItem",
      type:
        "{ element: HTMLFieldSetElement; key: RepeatableFieldsetKey; index: number; position: number }",
      description:
        "Immutable collection snapshot separating zero-based index, one-based position, and stable identity.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetOperationSource",
      type: '"control" | "api"',
      description:
        "Shared operation-source vocabulary that public callers cannot spoof.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetAddOptions",
      type: "{ focus?: boolean }",
      description:
        "Accepts an explicit API request for the implemented Add-focus decision order; the API default preserves current focus.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetAddResult",
      type:
        "{ ok: true; item: RepeatableFieldsetItem } | { ok: false; reason: RepeatableFieldsetAddFailureReason; error?: unknown }",
      description:
        "Frozen discriminated result for one successful item or a documented boundary or technical failure.",
      status: "implemented"
    },
    {
      name: "add(options)",
      type:
        "(options?: RepeatableFieldsetAddOptions) => RepeatableFieldsetAddResult",
      description:
        "Adds one trusted template item transactionally, runs opt-in item setup, applies requested focus, writes one enabled status update, dispatches its completed observation, and returns a frozen result.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetDuplicateTarget",
      type:
        "Readonly<RepeatableFieldsetItem> | HTMLFieldSetElement | RepeatableFieldsetKey",
      description:
        "Resolves the current owned source by stable snapshot identity, fieldset, or key.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetDuplicateOptions",
      type:
        "{ focus?: boolean; copyState?: RepeatableFieldsetDuplicateStateCopier }",
      description:
        "Requests Add-style focus and optionally copies constrained current state while the trusted-template candidate remains disconnected.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetDuplicateResult",
      type:
        "{ ok: true; item: RepeatableFieldsetItem; sourceItem: RepeatableFieldsetItem } | { ok: false; reason: RepeatableFieldsetDuplicateFailureReason; error?: unknown }",
      description:
        "Frozen result for one template-first duplicate or a documented boundary, copy, template, key, or addon failure.",
      status: "implemented"
    },
    {
      name: "duplicate(target, options)",
      type:
        "(target: RepeatableFieldsetDuplicateTarget, options?: RepeatableFieldsetDuplicateOptions) => RepeatableFieldsetDuplicateResult",
      description:
        "Materializes one fresh-key trusted-template item, completes approved state copying before insertion and addon setup, then stabilizes positions, constraints, focus, status, and item-duplicated.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetRemoveTarget",
      type:
        "Readonly<RepeatableFieldsetItem> | HTMLFieldSetElement | RepeatableFieldsetKey",
      description:
        "Resolves an active item by stable snapshot identity, owned fieldset, or key.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetRemoveOptions",
      type: "{ focus?: boolean }",
      description:
        "Accepts an explicit API focus request; focus inside the removed item is recovered regardless, while unrelated API focus is preserved by default.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetRemoveResult",
      type:
        "{ ok: true; item: RepeatableFieldsetItem } | { ok: false; reason: RepeatableFieldsetRemoveFailureReason; error?: unknown }",
      description:
        "Frozen discriminated result containing the pre-removal snapshot or a documented boundary or technical failure.",
      status: "implemented"
    },
    {
      name: "remove(target, options)",
      type:
        "(target: RepeatableFieldsetRemoveTarget, options?: RepeatableFieldsetRemoveOptions) => RepeatableFieldsetRemoveResult",
      description:
        "Removes one owned item transactionally by snapshot, fieldset, or stable key, runs item cleanup before detachment, applies focus recovery, writes one enabled status update, and dispatches its completed observation.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetRestoreOptions",
      type:
        "{ focus?: boolean; restoreState?: RepeatableFieldsetRestoreState }",
      description:
        "Internal-addon command options for Add-style focus and synchronous constrained current-state restoration on a disconnected candidate.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetRestoreResult",
      type:
        "{ ok: true; item: RepeatableFieldsetItem; previousIndex: number; previousPosition: number } | { ok: false; reason: RepeatableFieldsetRestoreFailureReason; error?: unknown }",
      description:
        "Frozen one-shot restoration result covering inactive, readiness, consumption, maximum, conflict, template, state, and addon outcomes.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetMoveTarget",
      type:
        "Readonly<RepeatableFieldsetItem> | HTMLFieldSetElement | RepeatableFieldsetKey",
      description:
        "Resolves a currently owned item by stable snapshot identity, fieldset, or key.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetMoveDirection",
      type: '"up" | "down"',
      description: "The two supported adjacent Move directions.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetMoveBoundary",
      type: '"start" | "end"',
      description: "The typed collection boundary reached by a blocked Move.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetMoveResult",
      type:
        "{ ok: true; item: RepeatableFieldsetItem; previousIndex: number; previousPosition: number; direction: RepeatableFieldsetMoveDirection } | { ok: false; reason: RepeatableFieldsetMoveFailureReason; boundary?: RepeatableFieldsetMoveBoundary; item?: RepeatableFieldsetItem; error?: unknown }",
      description:
        "Frozen discriminated result containing current/prior positions or a typed inactive, ownership, boundary, or rollback failure.",
      status: "implemented"
    },
    {
      name: "move(target, direction)",
      type:
        "(target: RepeatableFieldsetMoveTarget, direction: RepeatableFieldsetMoveDirection) => RepeatableFieldsetMoveResult",
      description:
        "Moves one existing item by one adjacent position while core owns DOM and registry order, positions, snapshots, focus, status, rollback, and completed dispatch.",
      status: "implemented"
    },
    {
      name: "getItems()",
      type: "() => readonly RepeatableFieldsetItem[]",
      description:
        "Returns a new frozen array of new frozen active-item snapshots, or a frozen empty array when inactive.",
      status: "implemented"
    },
    {
      name: "getCount()",
      type: "() => number",
      description:
        "Returns the active item count without mutation, or zero when inactive.",
      status: "implemented"
    },
    {
      name: "canAdd()",
      type: "() => boolean",
      description:
        "Reports whether an active Add operation can respect the maximum.",
      status: "implemented"
    },
    {
      name: "canRemove()",
      type: "() => boolean",
      description:
        "Reports whether an active Remove operation can currently respect the minimum.",
      status: "implemented"
    },
    {
      name: "destroy()",
      type: "() => void",
      description:
        "Idempotently removes current core behavior, restores tracked control states, unregisters and releases the instance, and retains current fieldsets, identities, positions, and values.",
      status: "implemented"
    },
    {
      name: "DEFAULT_MESSAGE_FORMATTERS",
      type: "Readonly<RepeatableFieldsetMessageFormatters>",
      description:
        "Frozen English callbacks for added, removed, duplicated, moved, Move-boundary, maximum, and minimum structural messages.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetMessageContext",
      type:
        "{ readonly itemLabel: string; readonly count: number; readonly minimum: number; readonly maximum: number | null }",
      description:
        "Structural-only base context shared by all message callbacks.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetItemMessageContext",
      type:
        "RepeatableFieldsetMessageContext & { readonly key: RepeatableFieldsetKey; readonly position: number }",
      description:
        "Frozen Add/Remove message context with current or previous item position.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetBoundaryMessageContext",
      type:
        "RepeatableFieldsetMessageContext & { readonly key: RepeatableFieldsetKey | null; readonly position: number | null }",
      description:
        "Frozen limit context with nullable identity for a blocked Add.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetDuplicateMessageContext",
      type:
        "RepeatableFieldsetItemMessageContext & { readonly sourceKey: RepeatableFieldsetKey; readonly sourcePosition: number }",
      description:
        "Frozen Duplicate message context with structural source and new-item identity only.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetMoveMessageContext",
      type:
        "RepeatableFieldsetItemMessageContext & { readonly previousPosition: number; readonly direction: RepeatableFieldsetMoveDirection }",
      description:
        "Frozen structural context for a completed adjacent Move.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetMoveBoundaryMessageContext",
      type:
        "RepeatableFieldsetItemMessageContext & { readonly direction: RepeatableFieldsetMoveDirection; readonly boundary: RepeatableFieldsetMoveBoundary }",
      description:
        "Frozen structural context for already-first or already-last feedback.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetMessageFormatter",
      type:
        "<Context extends RepeatableFieldsetMessageContext>(context: Readonly<Context>) => string",
      description:
        "Typed JavaScript-only callback for one structural message concept.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetMessageFormatters",
      type:
        "{ readonly added: formatter; readonly removed: formatter; readonly moved: formatter; readonly moveBoundary: formatter; readonly maximum: formatter; readonly minimum: formatter }",
      description:
        "Complete formatter map used by the frozen defaults and normalized options.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetOptions",
      type:
        "{ minimum?: number; maximum?: number | null; itemLabel?: string; focusOnAdd?: boolean; announceChanges?: boolean; keyFactory?: RepeatableFieldsetKeyFactory; messageFormatters?: Partial<RepeatableFieldsetMessageFormatters>; addons?: readonly RepeatableFieldsetAddon[] }",
      description:
        "Public options normalized over safe primitive datasets, frozen defaults, and validated JavaScript-only key, message, and component-addon values.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetError",
      type:
        "Error & { code: RepeatableFieldsetErrorCode; root: HTMLElement | null; element: Element | null }",
      description:
        "Typed contract error with safe root, offending-element, and cause context.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetEventBase",
      type: "{ readonly instance: A11yRepeatableFieldset; readonly root: HTMLElement }",
      description:
        "Readonly common detail for every lifecycle observation.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetInitEventDetail",
      type:
        "RepeatableFieldsetEventBase & { readonly count: number; readonly minimum: number; readonly maximum: number | null; readonly items: readonly RepeatableFieldsetItem[] }",
      description:
        "Readonly initialization summary with an immutable item-snapshot array.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetItemAddedEventDetail",
      type:
        "RepeatableFieldsetEventBase & { readonly item: RepeatableFieldsetItem; readonly key: RepeatableFieldsetKey; readonly index: number; readonly position: number; readonly count: number; readonly trigger: HTMLElement | null; readonly source: RepeatableFieldsetOperationSource }",
      description:
        "Readonly completed-Add detail without form values or private state.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetItemDuplicatedEventDetail",
      type:
        "RepeatableFieldsetEventBase & { readonly item: RepeatableFieldsetItem; readonly key: RepeatableFieldsetKey; readonly index: number; readonly position: number; readonly sourceKey: RepeatableFieldsetKey; readonly sourceIndex: number; readonly sourcePosition: number; readonly count: number; readonly focusTarget: HTMLElement | null }",
      description:
        "Completed template-first Duplicate detail with structural source/new identity and no copied form values.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetItemRemovedEventDetail",
      type:
        "RepeatableFieldsetEventBase & { readonly item: RepeatableFieldsetItem; readonly key: RepeatableFieldsetKey; readonly previousIndex: number; readonly previousPosition: number; readonly count: number; readonly focusTarget: HTMLElement | null; readonly trigger: HTMLElement | null; readonly source: RepeatableFieldsetOperationSource }",
      description:
        "Readonly completed-Remove detail whose item fieldset is detached at eventual dispatch.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetItemRestoredEventDetail",
      type:
        "RepeatableFieldsetEventBase & { readonly item: RepeatableFieldsetItem; readonly key: RepeatableFieldsetKey; readonly previousIndex: number; readonly previousPosition: number; readonly index: number; readonly position: number; readonly count: number; readonly focusTarget: HTMLElement | null }",
      description:
        "Readonly completed-Restore detail with exact reserved identity, prior/current order, and no retained form values.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetItemMovedEventDetail",
      type:
        "RepeatableFieldsetEventBase & { readonly item: RepeatableFieldsetItem; readonly key: RepeatableFieldsetKey; readonly previousIndex: number; readonly previousPosition: number; readonly index: number; readonly position: number; readonly count: number; readonly direction: RepeatableFieldsetMoveDirection; readonly focusTarget: HTMLElement | null }",
      description:
        "Readonly completed-Move detail with stable identity and prior/current order, without form values or addon-private state.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetDestroyEventDetail",
      type: "RepeatableFieldsetEventBase & { readonly count: number }",
      description:
        "Readonly teardown summary that preserves only the resulting fieldset count.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetCleanup",
      type: "() => void",
      description:
        "Idempotent parent-owned cleanup callback returned by a component addon hook or subscription.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetRemoveRequest",
      type:
        "{ readonly instance: A11yRepeatableFieldset; readonly root: HTMLElement; readonly item: Readonly<RepeatableFieldsetItem>; readonly trigger: HTMLButtonElement; remove(): RepeatableFieldsetRemoveResult }",
      description:
        "Frozen control request whose single-use approved command preserves source/trigger and revalidates active ownership and minimum.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetRemoveRequestHandler",
      type:
        "(request: Readonly<RepeatableFieldsetRemoveRequest>) => void",
      description:
        "Component-level owner for one control-driven Remove request; it is not a DOM event listener.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetRemovalRestoration",
      type:
        "{ restore(options?: RepeatableFieldsetRestoreOptions): RepeatableFieldsetRestoreResult }",
      description:
        "Single-use core-issued exact-key trusted-template restoration command supplied only to the removal-snapshot owner.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetRemovePreparationContext",
      type:
        "{ readonly instance: A11yRepeatableFieldset; readonly root: HTMLElement; readonly item: Readonly<RepeatableFieldsetItem>; readonly restoration: Readonly<RepeatableFieldsetRemovalRestoration> }",
      description:
        "Pre-cleanup structural context with no serialized HTML or retained detached fieldset.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetRemovePreparation",
      type: "{ commit(): void; rollback(): void }",
      description:
        "Synchronous addon participation in the core Remove transaction.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetAddonContext",
      type:
        "{ readonly instance: A11yRepeatableFieldset; readonly root: HTMLElement; on<Name extends keyof RepeatableFieldsetEventMap>(name: Name, listener: (event: RepeatableFieldsetCustomEvent<Name>) => void): RepeatableFieldsetCleanup; onRemoveRequest(handler: RepeatableFieldsetRemoveRequestHandler): RepeatableFieldsetCleanup; onRemovePreparation(handler: RepeatableFieldsetRemovePreparationHandler): RepeatableFieldsetCleanup }",
      description:
        "Public-only component context with parent-owned lifecycle subscription plus independent single-owner Remove-request and removal-preparation routing.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetItemAddonContext",
      type:
        "{ readonly instance: A11yRepeatableFieldset; readonly root: HTMLElement; on<Name extends keyof RepeatableFieldsetEventMap>(name: Name, listener: typed): RepeatableFieldsetCleanup; readonly item: RepeatableFieldsetItem; readonly phase: \"existing\" | \"added\" }",
      description:
        "Public-only item context distinguishing discovered items from template additions.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetAddon",
      type:
        "{ readonly id: string; setup?(context: RepeatableFieldsetAddonContext): void | RepeatableFieldsetCleanup; setupItem?(context: RepeatableFieldsetItemAddonContext): void | RepeatableFieldsetCleanup }",
      description:
        "Synchronous opt-in addon contract; no concrete addon is imported or registered by the core entry.",
      status: "implemented"
    },
    {
      name: "createValidationBridge(options)",
      type:
        "(options: ValidationBridgeOptions) => RepeatableFieldsetAddon",
      description:
        "Available only from ./addons/validation-bridge. Maps each existing or added item to an application validator and returns parent-owned cleanup without importing a validation library.",
      status: "implemented"
    },
    {
      name: "ValidationBridgeOptions",
      type:
        "{ readonly id: string; readonly registerItem: ValidationBridgeRegisterItem }",
      description:
        "Dependency-free adapter options with an application-scoped unique addon ID.",
      status: "implemented"
    },
    {
      name: "ValidationBridgeItemContext",
      type:
        "{ readonly instance: A11yRepeatableFieldset; readonly root: HTMLElement; readonly item: RepeatableFieldsetItem; readonly phase: \"existing\" | \"added\" }",
      description:
        "Frozen structural-only registration context; it exposes no field values or validation messages.",
      status: "implemented"
    },
    {
      name: "ValidationBridgeRegisterItem",
      type:
        "(context: Readonly<ValidationBridgeItemContext>) => void | RepeatableFieldsetCleanup",
      description:
        "Registers one item and may return cleanup that unregisters controls and removes adapter-owned errors and summary links before detachment.",
      status: "implemented"
    },
    {
      name: "createLegendSyncAddon(options)",
      type: "(options?: LegendSyncOptions) => RepeatableFieldsetAddon",
      description:
        "Available only from ./addons/legend-sync. Synchronizes a dedicated legend suffix on committed source changes without adding live output or focus movement.",
      status: "implemented"
    },
    {
      name: "LegendSyncOptions",
      type:
        "{ readonly source?: string; readonly target?: string; readonly updateOn?: \"change\"; readonly emptyText?: string }",
      description:
        "Explicit marker selectors, committed update timing, and empty-state text for the opt-in Legend Sync addon.",
      status: "implemented"
    },
    {
      name: "LegendSyncUpdateEvent",
      type: '"change"',
      description:
        "The only supported update event; per-keystroke legend rewriting is intentionally excluded.",
      status: "implemented"
    },
    {
      name: "createRemoveGuard(options)",
      type: "(options: RemoveGuardOptions) => RepeatableFieldsetAddon",
      description:
        "Available only from ./addons/remove-guard. Routes control requests through explicit synchronous policy and synchronous or asynchronous confirmation.",
      status: "implemented"
    },
    {
      name: "RemoveGuardOptions",
      type:
        "{ readonly shouldConfirm: RemoveGuardShouldConfirm; readonly confirm: RemoveGuardConfirm; readonly onError?: RemoveGuardErrorHandler }",
      description:
        "Explicit application-owned inspection, confirmation, and fail-closed diagnostic policy.",
      status: "implemented"
    },
    {
      name: "RemoveGuardContext",
      type:
        "{ readonly instance: A11yRepeatableFieldset; readonly root: HTMLElement; readonly item: Readonly<RepeatableFieldsetItem>; readonly trigger: HTMLButtonElement }",
      description:
        "Frozen structural callback context; the addon does not add or read field values.",
      status: "implemented"
    },
    {
      name: "RemoveGuardShouldConfirm",
      type: "(context: Readonly<RemoveGuardContext>) => boolean",
      description:
        "Synchronous explicit application policy that chooses immediate approval or confirmation.",
      status: "implemented"
    },
    {
      name: "RemoveGuardConfirm",
      type:
        "(context: Readonly<RemoveGuardContext>) => boolean | PromiseLike<boolean>",
      description:
        "Native or application-dialog approval callback; denial, rejection, or invalid output leaves structure untouched.",
      status: "implemented"
    },
    {
      name: "RemoveGuardErrorHandler",
      type:
        "(error: unknown, context: Readonly<RemoveGuardContext>) => void",
      description:
        "Optional diagnostics for a failed-closed inspection or confirmation.",
      status: "implemented"
    },
    {
      name: "createAccessibleReorder(options)",
      type: "(options?: AccessibleReorderOptions) => RepeatableFieldsetAddon",
      description:
        "Available only from ./addons/accessible-reorder. Renders native adjacent Move buttons and delegates every structural command to public move().",
      status: "implemented"
    },
    {
      name: "AccessibleReorderOptions",
      type:
        "{ readonly moveUpLabel?: string; readonly moveDownLabel?: string }",
      description:
        "Optional non-empty visible labels for the generated native buttons.",
      status: "implemented"
    },
    {
      name: "ACCESSIBLE_REORDER_ATTRIBUTES",
      type:
        "Readonly<{ controls: string; moveUp: string; moveDown: string }>",
      description:
        "Frozen addon-owned target and generated-control attribute names.",
      status: "implemented"
    },
    {
      name: "createDuplicateItem(options)",
      type: "(options?: DuplicateItemOptions) => RepeatableFieldsetAddon",
      description:
        "Available only from ./addons/duplicate-item. Renders one native Duplicate button and supplies the explicit native-control copier to public duplicate().",
      status: "implemented"
    },
    {
      name: "DuplicateItemOptions",
      type: "{ readonly buttonLabel?: string }",
      description:
        "Optional non-empty visible label for each generated native Duplicate button.",
      status: "implemented"
    },
    {
      name: "DUPLICATE_ITEM_ATTRIBUTES",
      type:
        "Readonly<{ controls: string; button: string; copy: string }>",
      description:
        "Frozen addon-owned target, generated-button, and explicit copy-slot attribute names.",
      status: "implemented"
    },
    {
      name: "createUndoRemove(options)",
      type: "(options?: UndoRemoveOptions) => RepeatableFieldsetAddon",
      description:
        "Available only from ./addons/undo-remove. Renders one expiring native Undo button and retains only explicitly marked supported state while core owns exact-key restoration.",
      status: "implemented"
    },
    {
      name: "UndoRemoveOptions",
      type:
        "{ readonly buttonLabel?: string; readonly expiryMs?: number }",
      description:
        "Optional visible button label and bounded in-memory expiry from 1,000 through 600,000 milliseconds.",
      status: "implemented"
    },
    {
      name: "UNDO_REMOVE_ATTRIBUTES",
      type:
        "Readonly<{ controls: string; button: string; state: string }>",
      description:
        "Frozen root target, generated-button, and explicit retained-state marker names.",
      status: "implemented"
    },
    {
      name: "createFormMemoryBridge(options)",
      type: "(options: FormMemoryBridgeOptions) => FormMemoryBridge",
      description:
        "Available only from ./addons/form-memory-bridge. Creates a structural draft adapter and explicit pre-initialization coordinator without importing a persistence package.",
      status: "implemented"
    },
    {
      name: "FormMemoryBridgeOptions",
      type:
        "{ readonly root: HTMLElement; readonly fieldKey: string; readonly createInstance: FormMemoryCreateInstance; readonly save: () => void | PromiseLike<unknown>; readonly onSaveError?: (error: unknown) => void }",
      description:
        "Application-owned root, draft identity, public core factory, structural-save callback, and optional rejected-save diagnostics.",
      status: "implemented"
    },
    {
      name: "FormMemoryDraftControlAdapter",
      type:
        "{ readonly id: string; matches(element): boolean; getFieldKey(element, context): string | null; read(element, context): FormMemoryJsonValue; compare(current, saved, context): boolean; write(element, saved, context): void }",
      description:
        "Structurally compatible A11yFormDraftPersistence custom-control adapter that stores schemaVersion 1 stable-key order only.",
      status: "implemented"
    },
    {
      name: "FormMemoryBridgeInitializeResult",
      type:
        "{ ok: true; instance; structure; addedKeys; preservedItemCount; reordered } | { ok: false; reason: invalid-snapshot | maximum-exceeded | structure-error; ...context }",
      description:
        "Frozen outcome for conservative structure preparation before one core initialization; current server items are never deleted.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetEventMap",
      type: "{ [EVENTS.init]: RepeatableFieldsetInitEventDetail; [EVENTS.itemAdded]: RepeatableFieldsetItemAddedEventDetail; [EVENTS.itemDuplicated]: RepeatableFieldsetItemDuplicatedEventDetail; [EVENTS.itemRemoved]: RepeatableFieldsetItemRemovedEventDetail; [EVENTS.itemRestored]: RepeatableFieldsetItemRestoredEventDetail; [EVENTS.itemMoved]: RepeatableFieldsetItemMovedEventDetail; [EVENTS.destroy]: RepeatableFieldsetDestroyEventDetail }",
      description:
        "Maps each exact frozen event name to its readonly public detail type.",
      status: "implemented"
    },
    {
      name: "RepeatableFieldsetCustomEvent<Name>",
      type:
        "CustomEvent<RepeatableFieldsetEventMap[Name]>, where Name extends keyof RepeatableFieldsetEventMap",
      description:
        "Infers a lifecycle CustomEvent detail from one exact EVENTS value.",
      status: "implemented"
    },
    {
      name: "EVENTS",
      type:
        "Readonly<{ init: string; itemAdded: string; itemDuplicated: string; itemRemoved: string; itemRestored: string; itemMoved: string; destroy: string }>",
      description: "Frozen constants for the seven lifecycle events.",
      status: "implemented"
    }
  ],
  results: [
    {
      operation: "add",
      failureReasons: [
        "inactive",
        "maximum",
        "invalid-key",
        "duplicate-key",
        "invalid-template",
        "addon-error"
      ]
    },
    {
      operation: "duplicate",
      failureReasons: [
        "inactive",
        "maximum",
        "unowned-item",
        "invalid-key",
        "duplicate-key",
        "invalid-template",
        "copy-error",
        "addon-error"
      ]
    },
    {
      operation: "remove",
      failureReasons: [
        "inactive",
        "minimum",
        "unowned-item",
        "addon-error"
      ]
    },
    {
      operation: "restore",
      failureReasons: [
        "inactive",
        "not-ready",
        "consumed",
        "maximum",
        "conflict",
        "invalid-template",
        "restore-error",
        "addon-error"
      ]
    },
    {
      operation: "move",
      failureReasons: [
        "inactive",
        "unowned-item",
        "boundary",
        "move-error"
      ]
    }
  ],
  errorCodes: REPEATABLE_FIELDSET_ERROR_CODES,
  events: [
    {
      key: "init",
      name: EVENTS.init,
      description: "Observes completed successful initialization."
    },
    {
      key: "itemAdded",
      name: EVENTS.itemAdded,
      description: "Observes one fully integrated added item."
    },
    {
      key: "itemDuplicated",
      name: EVENTS.itemDuplicated,
      description:
        "Observes one template-first duplicate after copy, addon setup, focus, and status stabilize."
    },
    {
      key: "itemRemoved",
      name: EVENTS.itemRemoved,
      description: "Observes one completed item removal."
    },
    {
      key: "itemRestored",
      name: EVENTS.itemRestored,
      description:
        "Observes one exact-key trusted-template restoration after state, addon setup, focus, and status stabilize."
    },
    {
      key: "itemMoved",
      name: EVENTS.itemMoved,
      description: "Observes one completed adjacent item Move."
    },
    {
      key: "destroy",
      name: EVENTS.destroy,
      description: "Observes final instance teardown."
    }
  ],
  examples: [
    {
      name: "Basic progressive enhancement",
      description: "One server-rendered item enhanced with Add and Remove.",
      path: "docs/basic.html",
      status: "implemented"
    },
    {
      name: "Basic repository example",
      description:
        "Minimal server-rendered form that imports the built ESM module and optional CSS from dist.",
      path: "examples/basic/index.html",
      status: "implemented"
    },
    {
      name: "Existing server items",
      description:
        "Saved keys, values, hidden identifiers, and server errors.",
      path: "docs/existing-items.html",
      status: "implemented"
    },
    {
      name: "Minimum and maximum limits",
      description:
        "Visible range instructions, native disabled controls, focus recovery, and boundary announcements.",
      path: "docs/limits.html",
      status: "implemented"
    },
    {
      name: "Complex fields",
      description:
        "Radios, multiple ID references, datalists, headers, and file-input limitations.",
      path: "docs/complex-fields.html",
      status: "implemented"
    },
    {
      name: "No JavaScript",
      description: "Meaningful form behavior before enhancement.",
      path: "docs/no-javascript.html",
      status: "implemented"
    },
    {
      name: "Lifecycle event inspector",
      description:
        "The seven stabilized public lifecycle observations in a bounded, non-live document log.",
      path: "docs/event-inspector.html",
      status: "implemented"
    },
    {
      name: "Realistic multi-person form",
      description:
        "Several completed people using the packaged Legend Sync addon for committed name updates, stable identity, focus, and privacy review.",
      path: "docs/realistic-multi-person.html",
      status: "implemented"
    },
    {
      name: "Transactional failure lab",
      description:
        "Malformed-template blocking and addon rollback observed through public results, events, and DOM counts.",
      path: "docs/transactional-failure-lab.html",
      status: "implemented"
    },
    {
      name: "Initialization failure and recovery",
      description:
        "Typed invalid-options failure, transactional preservation, correction, and clean retry.",
      path: "docs/edge-cases.html",
      status: "implemented"
    },
    {
      name: "Remove Guard confirmation",
      description:
        "Explicit meaningful-state policy, immediate empty-item removal, and an application-owned asynchronous native dialog.",
      path: "docs/addons.html",
      status: "implemented"
    },
    {
      name: "Accessible Reorder controls",
      description:
        "Native Move buttons delegating to the transactional public command with focus, announcement, boundary, and event behavior.",
      path: "docs/addons.html",
      status: "implemented"
    },
    {
      name: "Duplicate Item",
      description:
        "Template-first fresh-key duplication with explicit native-control copy slots, focus, privacy exclusions, defaults, and completed event output.",
      path: "docs/duplicate-item.html",
      status: "implemented"
    },
    {
      name: "Undo Remove",
      description:
        "Short-lived exact-key trusted-template restoration with explicit supported-state markers, expiry/focus behavior, file-value exclusion, and completed event output.",
      path: "docs/undo-remove.html",
      status: "implemented"
    },
    {
      name: "Validation Bridge live validation and error review",
      description:
        "Item-scoped live validation, a synchronized silent summary, explicit error-review focus, no-submit behavior, cleanup-before-detach, and focus-ownership boundaries.",
      path: "docs/validation-integration.html",
      status: "implemented"
    },
    {
      name: "Form Memory Bridge",
      description:
        "Executable approved-structure preparation plus a production integration outline for restoring A11yFormDraftPersistence values only after trusted-template fieldsets exist.",
      path: "docs/form-memory-integration.html",
      status: "implemented"
    }
  ],
  limitations: [
    "Package publication and GitHub Pages deployment remain pending.",
    "Nested repeatable-fieldset roots are outside the MVP.",
    "Native form reset changes values but does not restore collection structure.",
    "Browser autofill behavior requires later real-browser evidence.",
    "Screen-reader announcement timing and focus behavior require later browser and assistive-technology verification.",
    "MANUAL_ACCESSIBILITY_TEST_RECORD.md records 2 of 6 target environments exercised as of 2026-08-31: the basic Add/Remove flow passed with Chrome reduced-motion emulation on macOS, VoiceOver + Safari produced a partial result with open middle-removal and stale-group-context evidence, and a supplemental 320 CSS-pixel check found documentation-shell clipping.",
    "New file inputs remain empty; file values are never copied, assigned, or restored.",
    "Untokenized external ID references are preserved, but tokenized local references must resolve within the cloned item.",
    "Validation Bridge, Legend Sync, Remove Guard, Accessible Reorder, Duplicate Item, Undo Remove, and Form Memory Bridge are the implemented concrete addons; all are optional, separately exported, dependency-free, and absent from the main runtime entry.",
    "Remove Guard reads no form values itself; sensitive-state classification and custom-dialog accessibility remain application responsibilities, and manual confirmation-dialog evidence is pending.",
    "Legend Sync changes a fieldset's accessible name and can expose personal data; VoiceOver + Safari produced a partial result with stale group context, high-risk sources are rejected, and authors must deliberately choose concise, appropriate values.",
    "Accessible Reorder supports adjacent native-button movement only; drag-and-drop, arbitrary-index moves, batch reorder, and manual screen-reader announcement evidence remain outside the implemented contract.",
    "Duplicate Item copies only explicitly marked supported native-control current state; files, hidden/server state, credentials, payments, errors, validity, disabled/readonly controls, and custom controls are excluded, and manual privacy/screen-reader evidence remains pending.",
    "Undo Remove retains one latest in-memory snapshot for a bounded expiry, pauses expiry while its native button has focus, restores only explicitly marked supported state, never reads or assigns file values, and still needs manual browser/screen-reader evidence.",
    "Form Memory Bridge stores keys and order only; applications own restore consent, storage, values, expiry, migrations, clearing, cross-tab behavior, sensitive-field policy, and manual shared-device/browser/assistive-technology evidence.",
    "The MVP has no structural Add, Remove, Duplicate, or Move animation."
  ]
} satisfies PluginDocs);
