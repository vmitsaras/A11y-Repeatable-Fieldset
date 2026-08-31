# Addon Architecture

## Status

This document defines the addon contract for `a11y-repeatable-fieldset`. The
core and one-item Add/Remove/Duplicate/Move commands are implemented. The public synchronous
addon, context, item-context, cleanup, Remove-request routing, and transactional
removal-preparation types are
implemented. Component and per-item addon registration, setup, reverse-order
cleanup, rollback, duplicate-ID rejection, scope-owned `context.on()`
subscriptions, single-owner `context.onRemoveRequest()` routing, and
independent single-owner `context.onRemovePreparation()` routing are
implemented. The dependency-free Validation Bridge, Legend Sync, Remove Guard,
Accessible Reorder, Duplicate Item, Undo Remove, and Form Memory Bridge are
concrete addons available only from explicit subpaths; all seven
remain absent from the main runtime bundle.
The package is not published. No addon is enabled by default. Add, Remove,
Duplicate, and Restore results use `addon-error` for rollback-safe addon
failures. The core destroy boundary owns current item cleanup before component
cleanup and releases detached item references.

## Principles

Addons are:

- opt-in
- typed
- synchronous in the MVP
- independently importable when implemented
- absent from the main entry and default bundle
- safe across duplicate initialization
- removable without retaining detached items

The core must remain complete and accessible with zero addons.

## Public type contract

The main entry exports:

```ts
export type RepeatableFieldsetCleanup = () => void;

export interface RepeatableFieldsetAddonContext {
  readonly instance: A11yRepeatableFieldset;
  readonly root: HTMLElement;
  on<Name extends keyof RepeatableFieldsetEventMap>(
    name: Name,
    listener: (
      event: RepeatableFieldsetCustomEvent<Name>
    ) => void
  ): RepeatableFieldsetCleanup;
  onRemoveRequest(
    handler: RepeatableFieldsetRemoveRequestHandler
  ): RepeatableFieldsetCleanup;
  onRemovePreparation(
    handler: RepeatableFieldsetRemovePreparationHandler
  ): RepeatableFieldsetCleanup;
}

export interface RepeatableFieldsetItemAddonContext {
  readonly instance: A11yRepeatableFieldset;
  readonly root: HTMLElement;
  on<Name extends keyof RepeatableFieldsetEventMap>(
    name: Name,
    listener: (
      event: RepeatableFieldsetCustomEvent<Name>
    ) => void
  ): RepeatableFieldsetCleanup;
  readonly item: RepeatableFieldsetItem;
  readonly phase: "existing" | "added";
}

export interface RepeatableFieldsetAddon {
  readonly id: string;
  setup?(
    context: RepeatableFieldsetAddonContext
  ): void | RepeatableFieldsetCleanup;
  setupItem?(
    context: RepeatableFieldsetItemAddonContext
  ): void | RepeatableFieldsetCleanup;
}

export interface RepeatableFieldsetRemoveRequest {
  readonly instance: A11yRepeatableFieldset;
  readonly root: HTMLElement;
  readonly item: Readonly<RepeatableFieldsetItem>;
  readonly trigger: HTMLButtonElement;
  remove(): RepeatableFieldsetRemoveResult;
}

export interface RepeatableFieldsetRemovalRestoration {
  restore(
    options?: RepeatableFieldsetRestoreOptions
  ): RepeatableFieldsetRestoreResult;
}

export interface RepeatableFieldsetRemovePreparationContext {
  readonly instance: A11yRepeatableFieldset;
  readonly root: HTMLElement;
  readonly item: Readonly<RepeatableFieldsetItem>;
  readonly restoration: Readonly<RepeatableFieldsetRemovalRestoration>;
}

export interface RepeatableFieldsetRemovePreparation {
  commit(): void;
  rollback(): void;
}
```

The main instance also exposes the generic `duplicate(target, options?)`
transaction and its typed synchronous `copyState` context. This is a core
command rather than an addon hook because approved copying must finish on the
disconnected trusted-template candidate before any `setupItem` hook runs. The
concrete Duplicate Item addon supplies the opt-in native-control copy matrix;
core imports none of its marker or UI code.

Addon IDs are trimmed, non-empty package-style identifiers. Duplicate IDs in
one instance are an `invalid-options` error. Addons do not receive private
state, mutable item arrays, or private class methods.

`onRemoveRequest()` is component-setup-only and allows one owner per instance.
A second registration fails transactional initialization. It routes native
Remove-button activation without creating a cancelable DOM event. The frozen
request's single-use `remove()` command revalidates ownership and the minimum
at approval time while preserving the original control source and trigger.
Public `instance.remove()` calls bypass this route as already-approved API
commands.

`onRemovePreparation()` is also component-setup-only and permits one owner,
independently of Remove-request ownership. Core calls it after Remove validation
and focus planning but before per-item cleanup. Its returned `commit()` runs
only after detachment, registry, addons, positions, controls, and focus are
stable; `rollback()` runs if removal cannot commit. The supplied restoration
command contains reserved-key structural coordinates rather than a detached
fieldset and becomes usable only after commit.

Addons are supplied only through the JavaScript `addons` option; datasets
cannot configure them. `ADDON-002` validates trimmed non-empty IDs, rejects
duplicates, and owns component cleanup. `ADDON-003` invokes `setupItem` for
existing items in DOM order and new items after registration, owns per-item
  cleanup, and integrates Add/Remove rollback without importing a concrete addon
into the core entry.

## Lifecycle

### Initialization

1. Normalize options and reject duplicate addon IDs.
2. Validate core markup before invoking addons.
3. Call each addon `setup` once in registration order.
4. Call each addon `setupItem` for each existing item in DOM order, with
   `phase: "existing"`.
5. Store every returned cleanup under the parent instance.
6. If setup fails, run all registered cleanup in reverse registration order,
   roll back core initialization, and throw a typed initialization error whose
   cause retains the addon exception.

Existing-item setup completes before the public `init` event.

### Control Remove request

With no registered request owner, an owned Remove-button activation executes
the core Remove command immediately. With one owner, core supplies a frozen
request and waits for that owner to call its single-use `request.remove()`
command. The owner may decide synchronously or retain the request only while an
application-owned asynchronous confirmation is pending.

No request creates a lifecycle event or success announcement. Denial is silent
at the structural layer. Approval enters the normal Remove operation, which
rechecks active ownership and the current minimum before cleanup or detachment.

### Addition

After a new item is inserted and registered, call each `setupItem` in addon
registration order with `phase: "added"`. Per-item setup completes before
position synchronization, focus, announcement, and `item-added`.

If setup fails:

- run cleanup already registered for the new item in reverse order
- detach and unregister the incomplete item
- preserve the allocated key as reserved
- restore positions and control states
- return an `addon-error` Add result
- emit no `item-added` event and no success announcement

### Removal

Before detaching an item, invoke the optional single removal-preparation owner,
then run every cleanup registered for that item in reverse order. Cleanup must
unregister validation state, listeners, observers, timers, and references to
descendants. Commit the preparation only after the structural removal is
stable. Roll it back if cleanup or later synchronization fails.

If cleanup throws, the parent runs the remaining cleanup callbacks, keeps the
item attached, returns `addon-error`, and emits no successful removal event.
Addon cleanup functions must therefore be idempotent and should not throw.

### Restoration

The one-shot restoration command is not a public instance method. It rechecks
activity, maximum, command state, and key conflicts; materializes the trusted
template with the removed reserved key; runs one synchronous constrained state
restorer while disconnected; and then uses the same registration, addon setup,
position, constraint, focus, status, rollback, and event boundaries as Add.
It never accepts HTML strings or detached fieldsets and never reads or assigns
file values.

### Duplication

Core resolves the owned source, materializes the trusted template with a fresh
key, and invokes the command's synchronous constrained state copier while the
candidate is disconnected. Only after copying succeeds does core insert and
register the candidate and call every `setupItem` hook in registration order
with `phase: "added"`. Addons therefore observe approved copied current state
but receive no source errors, validity, or addon registration state.

Copy, template, key, and addon failures roll back without a success message or
event. A successful operation synchronizes positions, controls, focus, and
status before the single core `item-duplicated` observation. No addon clones a
live item, inserts a duplicate directly, or dispatches that event itself.

### Move

Move does not rerun item setup or cleanup because the same attached fieldset,
stable key, and addon registration remain current. Core alone mutates DOM and
registry order, synchronizes positions, preserves eligible focus, writes the
structural status message, and emits the completed `item-moved` observation.
Addon setup-time item snapshots are point-in-time values; code that needs the
current index must call `instance.getItems()` or use `item-moved` detail.

### Destroy

The parent owns teardown:

1. cancel core pending work
2. clean every current item in reverse DOM order
3. run component cleanup in reverse addon-registration order
4. remove listeners registered through addon utilities
5. finish core teardown
6. dispatch the final `destroy` event

Repeated destroy calls do not invoke cleanup twice.

## Parent-owned cleanup

The parent stores cleanup functions, not the addon. This makes cleanup
deterministic and prevents an addon from deciding whether detached item state
should remain alive.

The `context.on()` utility:

- subscribes to the component root
- uses the typed lifecycle-event map
- returns an idempotent unsubscribe function
- automatically registers that unsubscribe with the applicable component or
  item cleanup scope

The component-only `context.onRemoveRequest()` utility:

- registers at most one control-request owner per instance
- returns an idempotent unsubscribe function
- is automatically released during initialization rollback or destroy
- does not intercept public `instance.remove()` commands
- does not add a DOM event or change lifecycle-event flags

The independent `context.onRemovePreparation()` utility:

- registers at most one removal-snapshot owner per instance
- returns an idempotent unsubscribe function
- participates in core Remove commit/rollback
- provides a single-use, exact-reserved-key restoration command
- does not retain detached author DOM on behalf of the addon

Addons may also attach native listeners directly, but then their returned
cleanup must remove them.

## Allowed responsibilities

Addons may:

- own a control Remove request before its approved command is issued
- snapshot and restore explicitly supported form state
- integrate newly added controls with external validation
- unregister removed controls from validation or error summaries
- coordinate stable keys with draft storage
- add keyboard-operable reorder controls
- synchronize legend text through dedicated markers
- add focused, documented optional UI
- observe narrow lifecycle events

Addons may use only public methods, public types, documented data attributes,
and author-provided or addon-owned DOM.

## Restrictions

Addons must not:

- patch private class methods or read undocumented state
- mutate frozen defaults, constants, or caller option objects
- dispatch fake core lifecycle events
- emit a second announcement for a core operation
- bypass minimum or maximum constraints
- auto-initialize on import
- become required for core accessibility
- silently include or initialize another addon
- retain detached fieldsets, form values, or file objects unnecessarily
- renumber names or replace stable keys with positions
- inject unrestricted or remote HTML
- mutate server errors on existing items without an explicit integration
  contract
- use drag and drop as the only reorder interaction

## Packaging

### Current package boundary

- The main `a11y-repeatable-fieldset` entry exports core runtime and generic
  addon types only. It imports no concrete addon implementation.
- The implemented Validation Bridge, Legend Sync, Remove Guard, Accessible
  Reorder, Duplicate Item, Undo Remove, and Form Memory Bridge addons are
  separately built and exported from
  `a11y-repeatable-fieldset/addons/validation-bridge`,
  `a11y-repeatable-fieldset/addons/legend-sync`,
  `a11y-repeatable-fieldset/addons/remove-guard`,
  `a11y-repeatable-fieldset/addons/accessible-reorder`,
  `a11y-repeatable-fieldset/addons/duplicate-item`,
  `a11y-repeatable-fieldset/addons/undo-remove`, and
  `a11y-repeatable-fieldset/addons/form-memory-bridge`, with their own
  declaration output and copied demo assets.
- The `addons` option accepts application-provided objects that satisfy the
  public contract. Importing the core entry does not import or register any
  concrete addon.
- Core accessibility remains complete with an empty addon list.

### Explicit subpath gate

An implemented addon may receive one explicit, separately built subpath. Its
source and declaration files must be separate tsdown entries, and its
`package.json` export must point only to those generated files. The main entry
must never import, re-export, auto-register, or default-enable that
implementation.

Add a future subpath only when all of the following exist and agree:

1. a concrete, opt-in implementation with no import-time DOM/global effects
2. direct behavior, accessibility, cleanup, and bundle-isolation tests
3. README and structured-docs metadata describing availability and limits
4. a static `/docs` example that imports the explicit built subpath
5. verified tsdown outputs, package exports, and `npm pack --dry-run` contents

Do not publish empty placeholder modules or wildcard addon exports. Runtime
dependencies remain zero; bridges use peer/application-provided integration
callbacks rather than importing other plugins into the core.

## Prioritized addons

### Implemented Priority 1 — Validation Bridge

Purpose:

- initialize validation behavior for new controls
- unregister controls and related errors before removal
- remove deleted fields from error summaries
- preserve server errors on existing items

The bridge uses an explicit application adapter callback and adds no validator
package to the core or addon bundle. It is implemented at
`a11y-repeatable-fieldset/addons/validation-bridge`; its full adapter,
ownership, focus, failure, A11y Form Validator compatibility, and state-matrix
contract is in [`VALIDATION_BRIDGE.md`](./VALIDATION_BRIDGE.md).

### Implemented Priority 1 — Legend Sync

Purpose:

- append one deliberately selected committed control value to the generic item
  label and visible position
- preserve stable identity and generic legend content as separate concepts
- handle an explicit empty state
- detach item listeners before removal and restore author target text on
  cleanup
- reject hidden, password, file, authentication-code, and payment sources
- create no live region, structural message, focus move, or lifecycle event

The addon updates only a dedicated text-only target inside the direct legend
and listens only for committed `change` events. It is implemented at
`a11y-repeatable-fieldset/addons/legend-sync`; its complete marker, privacy,
accessible-name, timing, failure, cleanup, and manual-testing contract is in
[`LEGEND_SYNC.md`](./LEGEND_SYNC.md).

### Implemented Priority 1 — Remove Guard

Purpose:

- allow immediate removal when explicit application policy finds no meaningful
  state
- let application policy inspect only deliberately selected state
- request synchronous native or asynchronous custom confirmation
- coalesce repeated activation while one item confirmation is pending
- call the request's single-use approved Remove command only after approval
- revalidate ownership, current minimum, and instance activity at approval
  time

It does not make lifecycle events cancelable and does not intercept public API
Remove commands. The addon itself reads no form values; password, payment,
hidden record ID, validation, custom-control, and file-input semantics remain
explicit application policy. It is implemented at
`a11y-repeatable-fieldset/addons/remove-guard`; the complete request/command,
privacy, race, focus, error, cleanup, and testing contract is in
[`REMOVE_GUARD.md`](./REMOVE_GUARD.md).

### Implemented Priority 1 — Undo Remove

Purpose:

- capture a structured snapshot before cleanup
- offer an accessible Undo action
- restore stable identity when still safe
- restore supported values and focus
- announce removal and restoration once each
- expire snapshots and references safely

The addon is implemented at
`a11y-repeatable-fieldset/addons/undo-remove`. It retains one latest
short-lived in-memory data snapshot, restores structure from the trusted
template with the exact reserved key, pauses expiry while its native Undo
button has focus, and relies on the single completed `item-restored` event.
Only explicitly marked supported native-control current state is retained.
File values are never read, retained, or assigned; hidden server identifiers,
passwords, credentials, payments, errors, validity, defaults,
disabled/readonly controls, and custom controls are excluded. The complete
retention, transaction, focus, event, expiry, cleanup, and testing contract is
in [`UNDO_REMOVE.md`](./UNDO_REMOVE.md).

### Implemented Priority 1 — Form Memory Bridge

Purpose:

- store stable item keys
- restore structure before restoring values
- mark additions and removals as form changes
- coordinate structurally with A11yFormDraftPersistence 1.0.0 without
  importing it
- avoid duplicate restore announcements
- version persisted structure

The addon is implemented at
`a11y-repeatable-fieldset/addons/form-memory-bridge`. It exposes a custom
draft-control adapter plus an explicit two-phase initializer. The application
passes the public core factory so the addon bundle does not embed a second
active-instance registry. The bridge persists only a versioned stable-key
order, adds missing saved fieldsets from the trusted inert template before
core discovery, and preserves every current server item absent from an older
draft.

A11yFormDraftPersistence remains application-owned and restores native values
after structure exists. Storage, expiry, migrations, restore consent, clear
UI, shared-device policy, passwords, payment fields, authentication secrets,
hidden sensitive values, and file-input exclusion remain its and the
application's responsibility. The bridge never reads control values and
never deletes current fieldsets. Its complete API, reconciliation, rollback,
privacy, cleanup, compatibility, and evidence contract is in
[`FORM_MEMORY_BRIDGE.md`](./FORM_MEMORY_BRIDGE.md).

### Implemented Priority 2 — Accessible Reorder Controls

Purpose:

- add Move up and Move down buttons
- support full native-button keyboard operation
- preserve stable keys and names
- update visible positions
- keep focus on the moved item/control
- announce the new position once
- observe the documented completed `item-moved` event without creating an
  addon event

The addon renders two native `button[type="button"]` controls into exactly one
empty owned marker target per item. It never mutates DOM order itself: each
activation delegates to public `instance.move()`, which owns registry and DOM
order, positions, snapshots, focus, announcements, rollback, typed boundaries,
and lifecycle dispatch. Boundary buttons deliberately remain enabled so the
focused control is not invalidated; core supplies one polite already-first or
already-last message on activation. Drag and drop may be an optional future
enhancement but never the only interaction.

It is implemented at
`a11y-repeatable-fieldset/addons/accessible-reorder`; its complete marker,
focus, boundary, event, rollback, cleanup, packaging, and manual-testing
contract is in [`ACCESSIBLE_REORDER.md`](./ACCESSIBLE_REORDER.md).

### Implemented Priority 2 — Duplicate Item

Purpose:

- create one native Duplicate button per item
- delegate structure to public transactional `duplicate()`
- materialize the trusted template and allocate a fresh key before copying
- copy only explicitly marked supported native-control current state
- complete copying before any new-item addon setup
- exclude files, hidden/server state, credentials, payments, errors, validity,
  disabled/readonly controls, and custom controls by default
- preserve template defaults so native reset does not silently adopt source
  values as defaults

The addon is implemented at
`a11y-repeatable-fieldset/addons/duplicate-item`. Its complete marker, copy
matrix, privacy, defaults, transaction, focus, announcement, event, cleanup,
and testing contract is in [`DUPLICATE_ITEM.md`](./DUPLICATE_ITEM.md). It is
separate from ordinary Add, which always materializes template defaults and
emits only `item-added`.

### Priority 3 — Reset Structure

Purpose:

- define an opt-in response to native form reset
- choose whether to restore initial count, server values, removed existing
  items, newly added items, order, and keys

The addon must not silently discard data. Its full restoration contract is a
prerequisite to implementation.

### Priority 3 — Template Switcher

Purpose:

- let an author choose among multiple trusted templates
- support domain variants without putting domain knowledge in the core

Examples include domestic/international address or person/organization. This
is a substantial extension; the MVP continues to require exactly one template.

## Experimental candidates

Experimental work may investigate:

- an event-inspector/debug addon for development only
- a setup validator that presents human-readable contract errors in demos
- controlled structure serialization utilities that might eventually be
  shared by Undo, Form Memory, and Reset Structure

These are not package commitments and must not expand the MVP. The implemented
Undo restoration boundary is not a public serializer and does not commit the
experimental utility as package API.

## Addons explicitly rejected

Do not plan or build these as initial addons:

- drag-only reordering
- nested repeaters
- remote HTML template loading
- automatic MutationObserver initialization
- a complete form validation engine
- a visual form builder
- framework-specific wrappers
- automatic AI-generated fieldsets
- unrestricted HTML-string insertion
- background autosubmission
- automatic name renumbering
- silent cloning of the current item's values

## Required addon tests

The addon harness must verify:

- component setup and cleanup order
- existing-item and added-item setup phases
- reverse-order per-item cleanup before detachment
- duplicate ID rejection
- automatic listener cleanup through `context.on`
- rollback after component or per-item setup failure
- removal abort after cleanup failure
- cleanup on destroy for all current items
- duplicate initialization does not duplicate addon setup
- detached items are not retained by parent registries
- no fake core event or duplicate announcement is emitted
- Move preserves addon registration and exposes current order through fresh
  snapshots and the single core `item-moved` event
- Duplicate copies before new-item setup and exposes completed structure only
  through the single core `item-duplicated` event

`test/helpers/addon-harness.ts` provides test-only recording addons for setup
and cleanup order, component/item subscriptions, existing/added phases, and
retained-fieldset assertions. It is not exported from the package and must not
be used as a concrete addon implementation.

Each implemented addon also requires behavior, accessibility, packaging,
documentation, demo, and bundle-isolation tests.
