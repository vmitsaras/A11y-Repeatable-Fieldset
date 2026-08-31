# Lifecycle Events

## Status

This document defines the public lifecycle-event contract for
`a11y-repeatable-fieldset`. The frozen event constants, typed event-detail
exports, and duplicate-instance registration are implemented. Existing items
are registered without emitting `item-added`, and the shared stable-key and
item/source types are exported.
The Add, Remove, Duplicate, addon restoration, and Move commands, native constraint-state synchronization,
deterministic focus, managed polite status updates, typed message formatter
overrides, and immutable collection and capability queries are implemented.
Lifecycle dispatch uses the locked root target, owner-document realm, flags,
detail, and ordering; package release remains pending. Safe core teardown
dispatches the final destroy event. Events are
public API and must not be added, renamed, or reordered casually.

## Event constants

The main entry point exports one frozen object:

```ts
export const EVENTS = Object.freeze({
  init: "a11y-repeatable-fieldset:init",
  itemAdded: "a11y-repeatable-fieldset:item-added",
  itemDuplicated: "a11y-repeatable-fieldset:item-duplicated",
  itemRemoved: "a11y-repeatable-fieldset:item-removed",
  itemRestored: "a11y-repeatable-fieldset:item-restored",
  itemMoved: "a11y-repeatable-fieldset:item-moved",
  destroy: "a11y-repeatable-fieldset:destroy"
} as const);
```

Source code, tests, docs metadata, README content, demos, and addons must import
these constants rather than repeat event strings.

## Global event rules

Every public event:

- dispatches from the component root
- uses `bubbles: true`
- uses `composed: false`
- uses `cancelable: false`
- is a `CustomEvent` created from the root's owner-document realm
- includes `instance` and `root` in `detail`
- reports a completed observation and is never required for core correctness

Methods are commands; events are observations. Preventing default on an event
does not cancel an operation. The optional Remove Guard owns a separate typed
control-request route exposed through addon context; it does not cancel a
lifecycle event.

No public event:

- crosses a shadow boundary
- fires after `destroy`
- fires for a blocked or rolled-back operation
- duplicates another event through a generic `change` event

## Shared types

The main entry exports these types:

```ts
export type RepeatableFieldsetKey = string;
export type RepeatableFieldsetOperationSource = "control" | "api";

export interface RepeatableFieldsetItem {
  readonly element: HTMLFieldSetElement;
  readonly key: RepeatableFieldsetKey;
  readonly index: number;
  readonly position: number;
}

export interface RepeatableFieldsetEventBase {
  readonly instance: A11yRepeatableFieldset;
  readonly root: HTMLElement;
}
```

Item arrays and summaries in event detail are new readonly snapshots. They do
not expose the mutable internal collection. DOM elements remain normal DOM
objects and must not be retained unnecessarily.

## Initialization event

### Constant and DOM name

- Constant: `EVENTS.init`
- DOM event: `a11y-repeatable-fieldset:init`

### Trigger

Dispatch exactly once after successful initialization, including construction
through the class, `createRepeatableFieldset`, or
`initRepeatableFieldsetAll`.

Duplicate `init()` calls on the same active instance and factory calls that
reuse a registered instance do not dispatch another initialization event.
Clean reinitialization with a new instance after destroy dispatches a new event.

### Ordering

Before dispatch:

1. required markup and options are validated
2. existing items are discovered
3. server keys are preserved and missing keys are assigned
4. component and existing-item addon setup completes
5. positions and constraints are synchronized
6. the status mechanism is initialized
7. Add and Remove controls are ready and revealed
8. the active instance is registered

Initialization does not emit `item-added` for server-rendered items.

### Detail

```ts
export interface RepeatableFieldsetInitEventDetail
  extends RepeatableFieldsetEventBase {
  readonly count: number;
  readonly minimum: number;
  readonly maximum: number | null;
  readonly items: readonly RepeatableFieldsetItem[];
}
```

`maximum: null` means unbounded. `items` is a frozen or readonly snapshot in
DOM order.

### Dispatch matrix

| Context | Fires? |
| --- | --- |
| First successful initialization | Yes, once |
| Duplicate factory or `init()` call | No |
| Failed initialization | No |
| Existing-item discovery | Only the single `init`; no item events |
| Programmatic construction/factory | Yes |
| Batch initialization across roots | One `init` per successfully initialized root |

## Item-added event

### Constant and DOM name

- Constant: `EVENTS.itemAdded`
- DOM event: `a11y-repeatable-fieldset:item-added`

### Trigger

Dispatch exactly once after one new fieldset has been created from the owned
template and fully integrated.

### Ordering

Before dispatch:

1. maximum enforcement succeeds
2. the template is cloned and token replacement validates
3. the fieldset is inserted and registered
4. per-item addon setup completes
5. positions and controls are synchronized
6. requested focus handling completes
7. enabled status text is written

The event therefore observes stable post-operation DOM and state. Assistive
technology may speak the polite live-region text asynchronously; the contract
only guarantees that the text has been written before dispatch.

### Detail

```ts
export interface RepeatableFieldsetItemAddedEventDetail
  extends RepeatableFieldsetEventBase {
  readonly item: RepeatableFieldsetItem;
  readonly key: RepeatableFieldsetKey;
  readonly index: number;
  readonly position: number;
  readonly count: number;
  readonly trigger: HTMLElement | null;
  readonly source: RepeatableFieldsetOperationSource;
}
```

- `item.element` is the attached fieldset.
- `index` is the current zero-based index.
- `position` is the current one-based visible position.
- `trigger` is the activating Add button for control-driven operations and
  `null` for the public API.
- `source` is `control` or `api`; public callers cannot spoof it.

### Dispatch matrix

| Context | Fires? |
| --- | --- |
| Add button succeeds | Yes, once; `source: "control"` |
| Public `add()` succeeds | Yes, once; `source: "api"` |
| Maximum blocks addition | No |
| Key/template validation fails | No |
| Addon setup fails and rolls back | No |
| Initialization discovers existing items | No |
| Future batch operation | Not supported in the MVP |

## Item-duplicated event

### Constant and DOM name

- Constant: `EVENTS.itemDuplicated`
- DOM event: `a11y-repeatable-fieldset:item-duplicated`

### Trigger

Dispatch exactly once after `duplicate()` has materialized one fresh-key item
from the trusted template, copied any explicitly approved current native
control state while disconnected, and fully integrated the new fieldset.

Duplicate does not dispatch `item-added`. Ordinary Add preserves template
defaults; Duplicate may copy selected live state. A distinct observation keeps
validation, form-memory, analytics, and privacy integrations from treating
those operations as equivalent.

### Ordering

Before dispatch:

1. activity, source ownership, maximum, template, and key validation succeed
2. approved state copying completes on the disconnected candidate
3. the candidate is inserted immediately after its source and registered
4. per-item addon setup completes with copied state already present
5. positions and controls are synchronized
6. requested Add-style focus completes
7. enabled duplicate/maximum status text is written

### Detail

```ts
export interface RepeatableFieldsetItemDuplicatedEventDetail
  extends RepeatableFieldsetEventBase {
  readonly item: RepeatableFieldsetItem;
  readonly key: RepeatableFieldsetKey;
  readonly index: number;
  readonly position: number;
  readonly sourceKey: RepeatableFieldsetKey;
  readonly sourceIndex: number;
  readonly sourcePosition: number;
  readonly count: number;
  readonly focusTarget: HTMLElement | null;
}
```

The detail contains structural identity and positions only. It does not expose
copied values, errors, validity, copy-marker slots, trigger inference, or
addon-private state. The source remains attached; the new item is attached at
`sourceIndex + 1` when listeners run.

### Dispatch matrix

| Context | Fires? |
| --- | --- |
| Public `duplicate()` succeeds | Yes, once |
| Duplicate Item button succeeds through public `duplicate()` | Yes, once |
| Maximum, inactive, or unowned source blocks Duplicate | No |
| Key/template/copy validation fails before insertion | No |
| Addon setup fails and rolls back | No |
| Ordinary Add | `item-added` only; no `item-duplicated` |
| Initialization discovers existing items | No |

## Item-removed event

### Constant and DOM name

- Constant: `EVENTS.itemRemoved`
- DOM event: `a11y-repeatable-fieldset:item-removed`

### Trigger

Dispatch exactly once after one owned fieldset has been removed and collection
state has stabilized.

### Ordering

Before dispatch:

1. ownership and minimum enforcement succeed
2. the post-removal focus destination is resolved
3. per-item addon cleanup completes
4. the item snapshot is captured
5. the fieldset is detached and unregistered
6. positions and controls are synchronized
7. required focus recovery completes
8. enabled status text is written

### Detail

```ts
export interface RepeatableFieldsetItemRemovedEventDetail
  extends RepeatableFieldsetEventBase {
  readonly item: RepeatableFieldsetItem;
  readonly key: RepeatableFieldsetKey;
  readonly previousIndex: number;
  readonly previousPosition: number;
  readonly count: number;
  readonly focusTarget: HTMLElement | null;
  readonly trigger: HTMLElement | null;
  readonly source: RepeatableFieldsetOperationSource;
}
```

- `item.element` is detached when listeners receive the event.
- `previousIndex` and `previousPosition` describe the item before removal.
- `count` is the resulting count.
- `focusTarget` is the resolved element, including the element actually
  focused when movement was required, or `null`.
- `trigger` is the activating Remove button for control-driven operations and
  `null` for the public API.

Consumers may use the detached item synchronously for cleanup, but should not
retain it. Retention can keep a large subtree, user data, and addon state alive.
The Validation Bridge must unregister controls before detachment through its
per-item cleanup rather than relying only on this event.

### Dispatch matrix

| Context | Fires? |
| --- | --- |
| Remove button succeeds | Yes, once; `source: "control"` |
| Public `remove()` succeeds | Yes, once; `source: "api"` |
| Minimum blocks removal | No |
| Target is unknown or belongs to another root | No |
| Addon cleanup fails and removal is aborted | No |
| Programmatic removal with focus elsewhere | Yes; no focus movement |
| Programmatic removal containing active focus | Yes after required recovery |
| Future batch operation | Not supported in the MVP |

## Item-restored event

### Constant and DOM name

- Constant: `EVENTS.itemRestored`
- DOM event: `a11y-repeatable-fieldset:item-restored`

### Trigger

Dispatch exactly once after a removal restoration command has recreated one
item from the trusted template with the removed reserved key and fully
integrated it. Undo Remove owns the short-lived snapshot and control; core owns
the structural transaction and event.

Restore does not dispatch `item-added`. This distinction lets validation,
memory, analytics, and privacy integrations identify restoration without
inspecting addon-private state.

### Ordering

Before dispatch:

1. activity, command state, maximum, and key-conflict checks succeed
2. the trusted template is materialized with the reserved removed key
3. approved state restoration completes on the disconnected candidate
4. the candidate is inserted at its neighbor-safe prior location and registered
5. per-item addon setup completes
6. positions and native controls are synchronized
7. requested Add-style focus completes
8. enabled restored/maximum status text is written

### Detail

```ts
export interface RepeatableFieldsetItemRestoredEventDetail
  extends RepeatableFieldsetEventBase {
  readonly item: RepeatableFieldsetItem;
  readonly key: RepeatableFieldsetKey;
  readonly previousIndex: number;
  readonly previousPosition: number;
  readonly index: number;
  readonly position: number;
  readonly count: number;
  readonly focusTarget: HTMLElement | null;
}
```

The restored `item.element` is attached template-derived DOM, not the removed
fieldset. The key is the exact reserved removed key. Previous coordinates
describe the item before removal; current coordinates account for intervening
structural work. Detail contains no retained values, marker slots, detached
DOM, timer, or addon-private state.

### Dispatch matrix

| Context | Fires? |
| --- | --- |
| Undo Remove successfully restores | Yes, once |
| Maximum blocks restoration | No |
| Command is pending, consumed, inactive, or conflicting | No |
| Template/state/addon setup fails and rolls back | No |
| Ordinary Add | `item-added` only |
| Duplicate | `item-duplicated` only |
| Native form reset | No structural event |

## Item-moved event

### Constant and DOM name

- Constant: `EVENTS.itemMoved`
- DOM event: `a11y-repeatable-fieldset:item-moved`

### Trigger

Dispatch exactly once after `move()` has moved one currently owned fieldset by
one adjacent position and collection state has stabilized. The opt-in
Accessible Reorder addon invokes the same public command; it does not dispatch
an event itself.

### Ordering

Before dispatch:

1. instance activity, ownership, direction, and the adjacent destination are
   validated
2. the existing fieldset is moved in the owned items container
3. registry order and visible positions are synchronized
4. immutable snapshots reflect the new order
5. focus on the same eligible element inside the moved item is preserved, and
   unrelated focus remains unchanged
6. enabled status text is written

The event therefore observes stable post-operation DOM, registry, focus, and
announcement state. Stable keys, names, IDs, values, and addon registrations
are unchanged.

### Detail

```ts
export interface RepeatableFieldsetItemMovedEventDetail
  extends RepeatableFieldsetEventBase {
  readonly item: RepeatableFieldsetItem;
  readonly key: RepeatableFieldsetKey;
  readonly previousIndex: number;
  readonly previousPosition: number;
  readonly index: number;
  readonly position: number;
  readonly count: number;
  readonly direction: RepeatableFieldsetMoveDirection;
  readonly focusTarget: HTMLElement | null;
}
```

- `item.element` remains attached and is the same fieldset as before Move.
- Previous and current indexes are zero-based; positions are one-based.
- `direction` is the approved adjacent command, `"up"` or `"down"`.
- `focusTarget` is the preserved eligible active element inside the moved item,
  or `null` when focus was outside it or could not be preserved.
- Detail contains no form values, trigger, source label, or addon-private state.
  Every Move enters through the same public command regardless of who calls it.

### Dispatch matrix

| Context | Fires? |
| --- | --- |
| Public `move()` succeeds | Yes, once |
| Accessible Reorder button succeeds | Yes, once, through public `move()` |
| Target is already first/last in the requested direction | No |
| Target is unknown or belongs to another root | No |
| DOM or registry synchronization fails and rolls back | No |
| Move is attempted after destroy | No |
| Arbitrary-index or batch reorder | Not supported |

## Destroy event

### Constant and DOM name

- Constant: `EVENTS.destroy`
- DOM event: `a11y-repeatable-fieldset:destroy`

### Trigger

Dispatch exactly once after successful teardown. Repeated `destroy()` calls are
safe and silent.

### Ordering

Before dispatch:

1. pending announcements and asynchronous callbacks are canceled
2. every current per-item addon cleanup runs
3. component-level addon cleanup runs
4. core and addon-managed listeners are removed
5. plugin-generated status UI is removed
6. author control states and initialization classes are restored
7. current fieldsets, keys, names, IDs, and values are preserved
8. the root is removed from the instance `WeakMap`

The event is the final public lifecycle event from that instance. Its dispatch
does not make the destroyed instance reusable. A listener may create a new
instance for the now-unregistered root, but the old instance remains inactive.

### Detail

```ts
export interface RepeatableFieldsetDestroyEventDetail
  extends RepeatableFieldsetEventBase {
  readonly count: number;
}
```

`count` is the number of preserved fieldsets at teardown.

### Dispatch matrix

| Context | Fires? |
| --- | --- |
| First `destroy()` | Yes, once |
| Repeated `destroy()` | No |
| Failed initialization rollback | No |
| New instance after prior destroy | Its own lifecycle begins with `init` |
| Any delayed work from old instance | No events permitted |

## Typed event map

The main entry exports an event map and `CustomEvent` helper type:

```ts
export type RepeatableFieldsetEventMap = {
  [EVENTS.init]: RepeatableFieldsetInitEventDetail;
  [EVENTS.itemAdded]: RepeatableFieldsetItemAddedEventDetail;
  [EVENTS.itemDuplicated]: RepeatableFieldsetItemDuplicatedEventDetail;
  [EVENTS.itemRemoved]: RepeatableFieldsetItemRemovedEventDetail;
  [EVENTS.itemRestored]: RepeatableFieldsetItemRestoredEventDetail;
  [EVENTS.itemMoved]: RepeatableFieldsetItemMovedEventDetail;
  [EVENTS.destroy]: RepeatableFieldsetDestroyEventDetail;
};

export type RepeatableFieldsetCustomEvent<
  Name extends keyof RepeatableFieldsetEventMap
> = CustomEvent<RepeatableFieldsetEventMap[Name]>;
```

No private mutable registry, cleanup callback, timer, or addon-internal state
appears in public detail.

The runtime creates owner-realm events with these detail shapes after each
operation has stabilized. No lifecycle event is emitted for a blocked or
rolled-back command, failed initialization, or repeated destroy.

## Addon and integration consumption

Intended consumers include:

- validation and error-summary bridges
- form-memory and dirty-form bridges
- analytics that record structural actions without field values
- accessible reorder and undo integrations
- documentation event inspectors
- application code that synchronizes server-side draft structure

The implemented `context.onRemoveRequest()` route is not part of the event map.
It hands one owned Remove-button request to at most one addon before an approved
command exists. Calling its single-use `request.remove()` command later enters
the normal Remove operation, and only a successful completed operation emits
`item-removed`.

The independent `context.onRemovePreparation()` route is also not a DOM
event. It lets one addon capture data before cleanup and participate in Remove
commit/rollback. Its single-use restoration command emits
`item-restored` only after core restoration succeeds.

Duplicate Item delegates to public `duplicate()`. Its copier runs before any
new-item addon setup, creates no event itself, and relies on the single core
`item-duplicated` observation after the transaction stabilizes.

Consumers should subscribe to the narrowest event they need and remove
listeners during their own teardown. Addons should prefer the parent-provided
subscription utility, which registers cleanup automatically.

## Events intentionally excluded from the MVP

The initial contract does not include:

- `before-add`
- `before-remove`
- `add-request`
- `remove-request` DOM events
- generic `change`
- `count-change`
- validation events
- dirty-state events
- additional reorder events such as `before-move`, `move-request`, generic
  `reorder`, or batch-reordered events
- reset events
- announcement events
- batch events

Before-events would imply cancellation, generic events duplicate item events,
and validation, dirty state, reset, and announcements belong to other
responsibilities. The narrow completed `item-moved` observation was added only
with the implemented transactional `move()` contract; it is not cancelable and
does not authorize a second reorder event family. Removal confirmation uses the
typed addon request/command route rather than adding a cancelable or observable
DOM event.

The narrow completed `item-duplicated` observation was added with the
template-first Duplicate contract. It is distinct from `item-added` because
ordinary Add preserves template defaults while Duplicate can copy explicitly
selected current state. This is an additive pre-publication minor contract
change, not a before/request/generic change event.

## Required tests

For every event, tests must verify:

- exported frozen constant and exact string
- root dispatch target
- bubbling
- `composed: false`
- `cancelable: false`
- owner-document CustomEvent realm
- exact typed detail
- ordering relative to DOM, addons, focus, and status text
- single dispatch
- programmatic and control-driven source values where the event exposes them
- absence during blocked operations and failed rollback
- absence after destroy

Initialization tests must prove that existing server items do not produce
`item-added`. Move tests must prove stable identity, prior/current positions,
focus preservation, boundary suppression, and rollback suppression. Destroy
tests must prove delayed status work cannot dispatch or rewrite DOM after the
final event.

Duplicate tests must prove disconnected copy-before-addon ordering, exact
source/new identity and positions, focus/status stabilization, absence of
`item-added`, and suppression for maximum, unknown target, copy failure,
addon rollback, and destroyed instances.
