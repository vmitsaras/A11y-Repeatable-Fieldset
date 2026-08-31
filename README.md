# A11yRepeatableFieldset

> **Status: implemented, unpublished.** The complete interactive component is
> implemented locally and is not published. This repository contains the contracts,
> package foundation, option normalization, read-only semantic discovery, and
> transactional existing-item registration, lifetime-stable key allocation,
> disconnected inert-template materialization, owned visible-position
> synchronization, duplicate-instance registration, and transactional
> one-item Add, Remove, Duplicate, and adjacent Move commands with native constraint-state controls for
> an eventual release. The documented Add and removal focus decision orders are
> implemented together with managed polite structural announcements and
> typed JavaScript-only message localization.
> Immutable collection and capability queries are also available, together
> with non-destructive core teardown and reinitialization. The concrete opt-in
> Validation Bridge, Legend Sync, Remove Guard, Accessible Reorder, Duplicate Item,
> Undo Remove, and Form Memory Bridge addons are implemented as
> dependency-free explicit subpaths and remain absent from the main runtime
> entry.

A11yRepeatableFieldset is a dependency-free TypeScript plugin for adding,
removing, duplicating, and reordering accessible groups of related form
controls while preserving semantic fieldsets, stable IDs and names, keyboard
focus, server-rendered data, and clear status updates.

Package name: `a11y-repeatable-fieldset`.

## Installation after publication

The package is still private and unpublished. After the remaining manual
accessibility evidence is recorded and the owner authorizes the first public
release, the planned installation commands will be:

```bash
npm install a11y-repeatable-fieldset
pnpm add a11y-repeatable-fieldset
yarn add a11y-repeatable-fieldset
```

The package is ESM-only and never initializes the document on import. Import
the factory and explicitly initialize an owned root:

```ts
import {
  createRepeatableFieldset
} from "a11y-repeatable-fieldset";

const root = document.querySelector<HTMLElement>(
  "[data-a11y-repeatable-fieldset]"
);

if (root) {
  createRepeatableFieldset(root);
}
```

The optional behavior-independent stylesheet will be available through its
separate export:

```ts
import "a11y-repeatable-fieldset/styles.css";
```

These commands document the intended public package contract; they do not
claim that the package is currently available from npm. For a runnable local
example using built `dist` files, see the
[basic repository example](./examples/basic/index.html) and its
[setup notes](./examples/basic/README.md).

## Examples

- [Basic repository example](./examples/basic/index.html) is the minimal,
  server-rendered package example. It imports the built ESM module and optional
  CSS from `dist`, so build the package before serving it locally.
- [Static documentation and demos](./docs/index.html) are the separate future
  GitHub Pages system. They use copied build assets and remain unpublished
  repository documentation.

## What it solves

Blindly cloning a live form group can duplicate IDs, break labels and ARIA
references, merge radio groups, copy user data and validation state, renumber
server fields, lose focus after removal, and leave integrations holding
deleted controls.

The plugin addresses those failures by:

- enhancing server-rendered semantic HTML instead of replacing it
- materializing new items from one inert author-owned `template`
- separating stable item keys from visible item positions
- preserving existing values, keys, names, IDs, errors, and hidden record IDs
- replacing one explicit identity token in documented attributes only
- enforcing minimum and maximum counts in methods and native button states
- applying deterministic Add/Remove/Duplicate/Move focus behavior
- sending one polite structural announcement per operation
- exposing seven typed lifecycle events
- owning addon cleanup and safe duplicate initialization
- preserving every current fieldset and user value during destroy

## Intended uses

The contract is generic enough for:

- additional addresses
- emergency contacts
- household members
- passengers or attendees
- employment or education history
- phone numbers and social-profile links
- product variations
- invoice line details where fieldset semantics remain appropriate
- accessibility audit findings entered through a form

The runtime will not contain domain-specific assumptions such as “contact”,
“address”, or “passenger”.

## Progressive enhancement

The form must remain meaningful and submittable before JavaScript initializes:

- at least the server-rendered items remain usable
- controls keep their labels, names, values, and normal submission behavior
- the template remains inert
- JavaScript-only Add and Remove buttons remain `hidden`

The current component foundation discovers existing items in place,
synchronizes constraints and positions, and reveals enhancement controls only
after successful initialization. Add and Remove are implemented; native
`disabled` states now track the normalized minimum and maximum. The plugin
does not replace the form with application-generated markup.

The implemented internal discovery foundation remains read-only. It validates
the root and options, nearest-root ownership, required containers and
controls, direct-child item fieldsets, legends, the inert template, focus
markers, status-region emptiness, supplied keys, and duplicate owned IDs.
Initialization now registers existing items in DOM order and assigns stable
`item-N` keys only to fieldsets whose key attribute is absent. This step does
not recreate items, rename controls, change values, reveal controls, or emit
item lifecycle events. It writes one-based decimal text only to owned
`[data-a11y-repeatable-fieldset-position]` markers and produces immutable
internal index/position snapshots without changing identity.

## Semantic HTML

Each component uses:

- a neutral root marked `[data-a11y-repeatable-fieldset]`
- one owned `[data-a11y-repeatable-fieldset-items]` container
- direct-child
  `fieldset[data-a11y-repeatable-fieldset-item]` elements
- a meaningful `legend` in every item
- one trusted
  `template[data-a11y-repeatable-fieldset-template]`
- native `button[type="button"]` Add and Remove controls
- an optional author-provided polite status region

New-item templates use the literal stable-key token:

```text
__A11Y_REPEATABLE_KEY__
```

Example template names may use a backend-compatible form such as:

```html
<input
  id="contact-__A11Y_REPEATABLE_KEY__-email"
  name="contacts[__A11Y_REPEATABLE_KEY__][email]"
  type="email"
>
```

Existing server names are never rewritten, and names are never renumbered
after removal. See
[`MARKUP_AND_ACCESSIBILITY_CONTRACT.md`](./MARKUP_AND_ACCESSIBILITY_CONTRACT.md)
for the normative skeleton and token rules.

The implemented internal materializer clones only the discovered inert
template. It replaces the literal token in approved identity/reference
attributes, validates candidate IDs and tokenized local references, preserves
mixed external references and control defaults, and returns a disconnected
candidate. It never inserts the candidate, rewrites arbitrary text or HTML, or
assigns a file-input value. The Add command stages cloning before key
allocation, inserts the materialized fieldset once, registers it, synchronizes
positions, and rolls back incomplete candidates without reusing their keys.

## Public API

Runtime exports include:

- `A11yRepeatableFieldset`
- `createRepeatableFieldset`
- `initRepeatableFieldsetAll`
- `RepeatableFieldsetOptions`
- `RepeatableFieldsetInstance`
- stable-key, item, operation-result, error, lifecycle-event detail, and addon types
- one frozen `EVENTS` object

The separate `a11y-repeatable-fieldset/addons/validation-bridge`,
`a11y-repeatable-fieldset/addons/legend-sync`,
`a11y-repeatable-fieldset/addons/remove-guard`,
`a11y-repeatable-fieldset/addons/accessible-reorder`,
`a11y-repeatable-fieldset/addons/duplicate-item`,
`a11y-repeatable-fieldset/addons/undo-remove`, and
`a11y-repeatable-fieldset/addons/form-memory-bridge` subpaths export their concrete
factories and types. The main entry does not import or re-export any concrete
addon.

The frozen `EVENTS` object and typed lifecycle-event detail map, the
`RepeatableFieldsetOptions` type, typed error contract, option normalization,
semantic discovery, component class,
creation factory, explicit multi-root initializer, and duplicate-instance
registry are implemented. Existing server-rendered items are also registered
in place, with transactional missing-key assignment and position
synchronization. The one-item Add/Remove/Duplicate/Move commands and their item, target,
option, result, failure, source, and immutable query contracts are public. The
stable-key type, key-factory types, and JavaScript-only `keyFactory` option are
public; the normalizer, discovery, item registry, allocator, disconnected
template materializer, and position synchronizer remain internal component
building blocks.

The current pre-release class supports idempotent `init()`, transactional
`add()`, `remove()`, `duplicate()`, and adjacent `move()`, immutable collection queries, and safe core
`destroy()` cleanup. Destroy removes the root interaction listener, restores
tracked author/template control states, unregisters the root, releases
internal references, and retains every current fieldset, assigned key, name,
ID, position, and user value. Add/Remove/Duplicate/Move focus behavior, managed polite
structural announcements, frozen English message defaults, typed formatter
overrides, lifecycle-event detail types, component-level addon registration,
parent-owned component/per-item teardown, and lifecycle-event dispatch are
implemented.

Current foundation instance methods:

```ts
interface RepeatableFieldsetInstance {
  init(): this;
  add(options?: RepeatableFieldsetAddOptions): RepeatableFieldsetAddResult;
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
```

Every `getItems()` call returns a new frozen array containing new frozen
snapshots. Earlier arrays do not become live views after structural changes.
After destroy, the inactive instance returns an empty frozen array, count `0`,
and `false` from both capability methods.

Destroy does not restore the initial collection structure or resurrect
previously removed items. Reinitializing the preserved root creates a new
instance; the destroyed instance remains permanently inactive.

Current Add results are frozen discriminated values:

```ts
type RepeatableFieldsetAddResult =
  | { readonly ok: true; readonly item: RepeatableFieldsetItem }
  | {
      readonly ok: false;
      readonly reason:
        | "inactive"
        | "maximum"
        | "invalid-key"
        | "duplicate-key"
        | "invalid-template"
        | "addon-error";
      readonly error?: unknown;
};
```

Current Duplicate results distinguish normal blocking, pre-insertion copy
failure, and addon rollback:

```ts
type RepeatableFieldsetDuplicateResult =
  | {
      readonly ok: true;
      readonly item: RepeatableFieldsetItem;
      readonly sourceItem: RepeatableFieldsetItem;
    }
  | {
      readonly ok: false;
      readonly reason:
        | "inactive"
        | "maximum"
        | "unowned-item"
        | "invalid-key"
        | "duplicate-key"
        | "invalid-template"
        | "copy-error"
        | "addon-error";
      readonly error?: unknown;
    };
```

`duplicate()` always materializes the trusted template with a fresh key. Its
optional synchronous `copyState` phase runs while the candidate is
disconnected and before insertion or any new-item addon setup. Structural,
attribute, default-state, asynchronous, or thrown copy attempts fail before
live DOM mutation. The concrete Duplicate Item addon supplies the reviewed
native-control allowlist; core never clones the live source fieldset.

Current Remove results are also frozen discriminated values:

```ts
type RepeatableFieldsetRemoveResult =
  | { readonly ok: true; readonly item: RepeatableFieldsetItem }
  | {
      readonly ok: false;
      readonly reason:
        | "inactive"
        | "minimum"
        | "unowned-item"
        | "addon-error";
      readonly error?: unknown;
};
```

Current Move results are frozen and distinguish boundaries from technical
failures:

```ts
type RepeatableFieldsetMoveResult =
  | {
      readonly ok: true;
      readonly item: RepeatableFieldsetItem;
      readonly previousIndex: number;
      readonly previousPosition: number;
      readonly direction: "up" | "down";
    }
  | { readonly ok: false; readonly reason: "inactive" | "unowned-item" }
  | {
      readonly ok: false;
      readonly reason: "boundary";
      readonly boundary: "start" | "end";
      readonly item: RepeatableFieldsetItem;
    }
  | { readonly ok: false; readonly reason: "move-error"; readonly error: unknown };
```

`move(target, direction)` moves the existing owned fieldset by exactly one
adjacent position. It owns DOM and registry order, visible positions, fresh
snapshots, focus, status text, rollback, and the completed event. Stable keys,
names, IDs, values, and addon registrations do not change. A boundary changes
no structure and emits no success event.

`add({ focus: boolean })`, `duplicate(target, { focus: boolean })`, and
`remove(target, { focus: boolean })` accept an
explicit API focus request, while each API default is `false`. Focus movement
after Add now follows the explicit marker, first eligible labelable data
control, intentionally focusable fieldset, and no-movement fallbacks.
Control-triggered Add uses `focusOnAdd`; API Add remains opt-in. Removal focus
now resolves next Remove, previous Remove, Add, and an intentional root
fallback against post-removal constraint state. API removal preserves
unrelated focus by default but cannot suppress recovery from a detached item.
Move preserves the same eligible active element inside the moved item and
leaves unrelated focus unchanged.
The `addon-error` branches cover implemented addon setup/cleanup failures and
rollback-safe technical failures.
Control-driven Add carries the normalized `focusOnAdd` value into the same
operation boundary. Control-driven Remove uses the same root-scoped operation
boundary. Successful initialization reveals enhancement controls. Add is
natively disabled at the maximum, and every active Remove button is natively
disabled at the minimum; no redundant `aria-disabled` is generated.

Construction and factory calls currently return discovery-initialized
instances. Duplicate initialization of one root reuses its active `WeakMap`
instance, while destroying it allows a new instance for the preserved root.
A destroyed instance cannot be revived through `init()`.

The component makes the instance interactively ready before return. Add,
Remove, and Move return typed results rather than treating normal limits,
reorder boundaries, or unknown targets as exceptions.

An owned Remove-button activation is routed through the optional
component-level `context.onRemoveRequest()` owner before it becomes an approved
command. Its frozen, single-use `request.remove()` command preserves the
original control source and trigger while rechecking ownership and the current
minimum. With no owner, core approves immediately. Public `instance.remove()`
calls remain immediate API commands and bypass this request route. No
cancelable or additional lifecycle event is introduced.

Defaults:

- minimum items: `1`
- maximum items: unbounded
- item label: `Item`
- focus user-triggered additions: enabled
- structural announcements: enabled
- structural message formatters: frozen English callbacks

JavaScript options override root datasets, and datasets override the frozen
defaults. The implemented primitive mappings are:

| JavaScript option | Root dataset | Normalized type |
| --- | --- | --- |
| `minimum` | `data-min-items` | non-negative safe integer |
| `maximum` | `data-max-items` | non-negative safe integer or `null` for unbounded |
| `itemLabel` | `data-item-label` | trimmed, non-empty string |
| `focusOnAdd` | `data-focus-on-add` | boolean |
| `announceChanges` | `data-announce-changes` | boolean |
| `keyFactory` | none | JavaScript-only stable-key factory |
| `messageFormatters` | none | JavaScript-only partial formatter map |
| `addons` | none | JavaScript-only readonly addon list |

Dataset booleans accept only trimmed `true` or `false`. The key factory is
implemented as a JavaScript-only callback. Message formatters are also
JavaScript-only; addon values will remain JavaScript-only.
Malformed supplied values throw the exported typed
`RepeatableFieldsetError` with code `invalid-options`; normalization does not
mutate the options object or author attributes.

The key factory receives a frozen context containing the component root,
`"initialization"`, `"add"`, or `"duplicate"` source, a one-based lifetime allocation
sequence, and a frozen snapshot of already reserved keys. Returned keys must
match `^[A-Za-z0-9][A-Za-z0-9._:-]*$` and must not be reserved already.

Read-only discovery reports invalid required markup through the same typed
error class. Once initialization adds mutations, any failure must roll those
mutations back without damaging author DOM.

## Focus and announcements

After a user-triggered addition, focus moves to:

1. an explicit valid focus target
2. the first enabled, non-hidden labelable control
3. an intentionally programmatically focusable new fieldset
4. nowhere else, leaving focus on Add

API additions and duplications do not move focus by default. The Duplicate
Item button requests the same focus order for its new fieldset.

When the active item is removed, focus resolves before detachment to the next
equivalent Remove button, previous equivalent Remove button, Add button, or an
intentional root fallback. Movement occurs after state synchronization, and a
control disabled by the resulting minimum is skipped. Programmatic removal
does not move unrelated focus unless explicitly requested.

After Move, focus remains on the same eligible element inside the moved item,
including an Accessible Reorder button. Focus outside the item is unchanged.

One polite, atomic status region reports completed structural changes. Routine
operations do not use assertive alerts. Successful operations write one
combined structural message and reached-boundary message; blocked API limit
commands write only their boundary. One replaceable timer clears stale text,
and destroy removes only generated status DOM while restoring an author
region.

The main entry exports one frozen `DEFAULT_MESSAGE_FORMATTERS` object and
these formatter types:

```ts
interface RepeatableFieldsetMessageFormatters {
  readonly added: (
    context: Readonly<RepeatableFieldsetItemMessageContext>
  ) => string;
  readonly removed: (
    context: Readonly<RepeatableFieldsetItemMessageContext>
  ) => string;
  readonly restored: (
    context: Readonly<RepeatableFieldsetItemMessageContext>
  ) => string;
  readonly duplicated: (
    context: Readonly<RepeatableFieldsetDuplicateMessageContext>
  ) => string;
  readonly moved: (
    context: Readonly<RepeatableFieldsetMoveMessageContext>
  ) => string;
  readonly moveBoundary: (
    context: Readonly<RepeatableFieldsetMoveBoundaryMessageContext>
  ) => string;
  readonly maximum: (
    context: Readonly<RepeatableFieldsetBoundaryMessageContext>
  ) => string;
  readonly minimum: (
    context: Readonly<RepeatableFieldsetBoundaryMessageContext>
  ) => string;
}
```

Applications can override any subset through the JavaScript-only
`messageFormatters` option. Each callback receives a frozen context containing
only the item label, stable key where applicable, current and previous
positions where applicable, Duplicate source identity, direction, resulting
count, minimum, and maximum.
Added-item position is current; removed-item position is the position before
removal. A blocked Add supplies `null` key and position to
the maximum formatter because no item exists. Formatter output is trimmed.
Thrown, non-string, or blank output falls back to that concept's English
default, preserving the completed structural operation and its announcement.
Control labels remain author-owned; no localization framework or locale pack
is included.

## Lifecycle events

The MVP event set is deliberately small:

- `a11y-repeatable-fieldset:init`
- `a11y-repeatable-fieldset:item-added`
- `a11y-repeatable-fieldset:item-duplicated`
- `a11y-repeatable-fieldset:item-removed`
- `a11y-repeatable-fieldset:item-restored`
- `a11y-repeatable-fieldset:item-moved`
- `a11y-repeatable-fieldset:destroy`

Events dispatch from the component root, bubble, are not composed, and are not
cancelable. Add/Remove/Duplicate/Restore/Move events occur only after DOM state, registry,
addons, focus, and status text have stabilized. Blocked operations and existing-item discovery
emit no item success event.

The main entry exports readonly base/detail interfaces, an event map, and
`RepeatableFieldsetCustomEvent<Name>` so consumers can type listeners from an
`EVENTS` name. Dispatch uses the root's owner-document `CustomEvent` realm.

See [`LIFECYCLE_EVENTS.md`](./LIFECYCLE_EVENTS.md).

## Addons

The core works correctly with zero addons. The JavaScript-only `addons` option
accepts synchronous component hooks with trimmed, unique IDs. The parent calls
those hooks in registration order, runs returned cleanup in reverse order on
destroy or initialization rollback, and owns listeners returned by each
context's `context.on()` utility. Per-item hooks run for discovered items in
DOM order and for a registered new item before its Add operation stabilizes;
their cleanup runs before detachment. No addon is registered by default.

Validation Bridge is available from the explicit
`a11y-repeatable-fieldset/addons/validation-bridge` subpath. It maps existing
and added items to an application validator through one synchronous
`registerItem` callback. The returned cleanup unregisters controls and removes
adapter-owned errors and summary links before core detaches an item. The bridge
does not import a validator, create a structural live region, move Add/Remove
focus, or clear author/server errors.

The [Validation Bridge demo](./docs/validation-integration.html) validates on
blur, revalidates on debounced input, keeps a non-live error summary
synchronized, reserves summary focus for an explicit error review, and never
submits or simulates a successful form submission.

```ts
import { createRepeatableFieldset } from "a11y-repeatable-fieldset";
import {
  createValidationBridge
} from "a11y-repeatable-fieldset/addons/validation-bridge";

createRepeatableFieldset(root, {
  addons: [
    createValidationBridge({
      id: "application.validation",
      registerItem({ item, phase }) {
        return applicationValidator.registerGroup(item.element, { phase });
      }
    })
  ]
});
```

`applicationValidator.registerGroup()` is an application façade in this
example. A review of A11y Form Validator 1.0.19 found whole-form `refresh()`
and `clearErrors()` methods but no equivalent item-scoped cleanup API, so this
package does not claim a direct zero-configuration adapter or reach into its
private state. See [`VALIDATION_BRIDGE.md`](./VALIDATION_BRIDGE.md) for the
full ownership, state, failure, focus, and compatibility contract.

Legend Sync is available from the explicit
`a11y-repeatable-fieldset/addons/legend-sync` subpath. It reads exactly one
deliberately marked source per item and appends its normalized value to a
dedicated text-only marker inside the existing legend after a committed
`change`. The generic label and position remain intact; the addon creates no
live region, structural message, focus move, or lifecycle event.

```ts
import { createRepeatableFieldset } from "a11y-repeatable-fieldset";
import {
  createLegendSyncAddon
} from "a11y-repeatable-fieldset/addons/legend-sync";

createRepeatableFieldset(root, {
  addons: [
    createLegendSyncAddon({
      source: "[data-a11y-repeatable-fieldset-legend-source]",
      target: "[data-a11y-repeatable-fieldset-legend-value]",
      updateOn: "change",
      emptyText: ""
    })
  ]
});
```

Password, hidden, file, authentication-code, and payment sources are rejected,
but every supported value can still be personal or sensitive. Applying the
source marker is an explicit privacy decision. See
[`LEGEND_SYNC.md`](./LEGEND_SYNC.md) for the marker, empty-state, cleanup,
screen-reader, and manual-test contract, and try the executable
[multi-person example](./docs/realistic-multi-person.html).

Remove Guard is available from the explicit
`a11y-repeatable-fieldset/addons/remove-guard` subpath. It owns the single
control-driven Remove-request route, applies explicit application policy, and
supports synchronous native or asynchronous custom confirmation without
making lifecycle events cancelable.

```ts
import { createRepeatableFieldset } from "a11y-repeatable-fieldset";
import {
  createRemoveGuard
} from "a11y-repeatable-fieldset/addons/remove-guard";

createRepeatableFieldset(root, {
  addons: [
    createRemoveGuard({
      shouldConfirm({ item }) {
        return Array.from(
          item.element.querySelectorAll<HTMLInputElement>(
            "input[data-remove-guard-meaningful]"
          )
        ).some((control) => control.value.trim() !== "");
      },
      confirm({ item }) {
        return openRemoveDialog(item.position);
      }
    })
  ]
});
```

The addon never scans or reads form values itself. Passwords, payments, hidden
server identifiers, files, validation state, and custom controls require an
explicit application allowlist. Repeated activation is coalesced while a
decision is pending; approval revalidates ownership and the minimum; delayed
settlement after destroy is ignored. See [`REMOVE_GUARD.md`](./REMOVE_GUARD.md)
and the executable example on the [addons page](./docs/addons.html).

Accessible Reorder is available from the explicit
`a11y-repeatable-fieldset/addons/accessible-reorder` subpath. It creates native
Move up and Move down buttons in one empty owned marker per item and delegates
every activation to public `instance.move()`. The addon never mutates DOM or
registry order, writes a structural announcement, or dispatches an event.

```ts
import { createRepeatableFieldset } from "a11y-repeatable-fieldset";
import {
  createAccessibleReorder
} from "a11y-repeatable-fieldset/addons/accessible-reorder";

createRepeatableFieldset(root, {
  addons: [createAccessibleReorder()]
});
```

Each existing and template item supplies an empty
`data-a11y-repeatable-fieldset-reorder-controls` target. Stable keys, names,
IDs, values, and addon registrations stay with the moved fieldset. Boundary
buttons deliberately remain enabled: activation keeps focus valid and core
writes one polite already-first or already-last message without emitting
`item-moved`. See [`ACCESSIBLE_REORDER.md`](./ACCESSIBLE_REORDER.md) and the
executable example on the [addons page](./docs/addons.html).

Duplicate Item is available from the explicit
`a11y-repeatable-fieldset/addons/duplicate-item` subpath. It creates one native
Duplicate button per item and delegates structure, fresh identity, insertion,
rollback, focus, status, and the completed event to public
`instance.duplicate()`.

```ts
import { createRepeatableFieldset } from "a11y-repeatable-fieldset";
import {
  createDuplicateItem
} from "a11y-repeatable-fieldset/addons/duplicate-item";

createRepeatableFieldset(root, {
  addons: [createDuplicateItem()]
});
```

Copying is opt-in per native control through matching
`data-a11y-repeatable-fieldset-duplicate-copy="slot"` markers in the source
and trusted template. Supported current text, checkbox, radio, select, and
textarea state is copied while disconnected, before every new-item addon
setup. Template defaults remain defaults. Hidden/file/password/credential/
payment/disabled/readonly/custom controls plus errors and validity state are
excluded. See [`DUPLICATE_ITEM.md`](./DUPLICATE_ITEM.md) and the executable
[Duplicate Item demo](./docs/duplicate-item.html).

Undo Remove is available from the explicit
`a11y-repeatable-fieldset/addons/undo-remove` subpath. It creates one
short-lived native Undo button per root. Core restores structure from the
trusted template with the removed reserved key; the addon retains only current
state from explicitly marked, supported native controls.

```ts
import { createRepeatableFieldset } from "a11y-repeatable-fieldset";
import {
  createUndoRemove
} from "a11y-repeatable-fieldset/addons/undo-remove";

createRepeatableFieldset(root, {
  addons: [createUndoRemove({ expiryMs: 30_000 })]
});
```

Provide one empty
`data-a11y-repeatable-fieldset-undo-controls` target per root. Apply matching
`data-a11y-repeatable-fieldset-undo-state="slot"` markers only to values the
form may retain briefly. Files are never read, retained, or restored; hidden
server values, passwords, credentials, payments, errors, validity, defaults,
disabled/readonly controls, and custom controls are excluded. Expiry pauses
while the Undo button has focus. See
[`UNDO_REMOVE.md`](./UNDO_REMOVE.md) and the executable
[Undo Remove demo](./docs/undo-remove.html).

Form Memory Bridge is available from the explicit
`a11y-repeatable-fieldset/addons/form-memory-bridge` subpath. It coordinates
with an application-owned `a11y-form-draft-persistence` instance without
importing that package or adding a runtime dependency. The custom adapter
stores a versioned list of stable keys and order only; ordinary values,
storage, expiry, restore consent, sensitive-field rules, and clearing remain
outside this package.

```ts
import {
  createDraftPersistence,
  type DraftPersistenceInstance
} from "a11y-form-draft-persistence";
import { createRepeatableFieldset } from "a11y-repeatable-fieldset";
import {
  createFormMemoryBridge
} from "a11y-repeatable-fieldset/addons/form-memory-bridge";

let drafts: DraftPersistenceInstance | undefined;

const memory = createFormMemoryBridge({
  root,
  fieldKey: "application:contacts:structure",
  createInstance: createRepeatableFieldset,
  save: () => drafts?.save()
});

drafts = createDraftPersistence(form, {
  formVersion: 1,
  key: "application:123:v1",
  expiresAfter: 604_800_000,
  customControlAdapters: [memory.draftControlAdapter]
});

drafts.pause("repeatable-structure-setup");
const checked = await drafts.check();
const record = checked.status === "available" && userApproved
  ? checked.record
  : undefined;
const initialized = memory.initialize({
  ...(record === undefined ? {} : { record }),
  repeatableFieldsetOptions: { maximum: 8 }
});

if (initialized.ok && record !== undefined) {
  await drafts.restore({ force: true });
}

drafts.resume("repeatable-structure-ready");
```

The bridge adds missing saved items from the trusted template before the one
core initialization, orders saved keys, and preserves current server items
that are absent from an older draft. It never deletes current fieldsets or
reads form values. Invalid, duplicate, unknown-version, over-maximum, and
template-failure results are fail-closed and transactional. The application
must own the restore decision because the draft package's generic prompt calls
value restore directly and cannot insert the pre-initialization structure
phase. See [`FORM_MEMORY_BRIDGE.md`](./FORM_MEMORY_BRIDGE.md) and the
executable [Form Memory Bridge demo](./docs/form-memory-integration.html).

Addon order and status:

1. Validation Bridge — implemented
2. Legend Sync — implemented
3. Remove Guard — implemented
4. Accessible Reorder Controls — implemented
5. Undo Remove — implemented
6. Form Memory Bridge — implemented
7. Duplicate Item — implemented
8. Reset Structure
9. Template Switcher

The [transactional failure lab](./docs/transactional-failure-lab.html) shows
malformed-template blocking and addon rollback through public results, events,
and author-visible DOM counts.

See [`ADDONS.md`](./ADDONS.md) for the shared contract, restrictions, and
explicitly rejected ideas.

## Optional CSS

The package foundation includes separately exported, behavior-independent
minimal CSS for:

- spacing and item boundaries
- usable Add/Remove and opt-in Move, Duplicate, and Undo controls
- visible focus
- clear disabled states
- responsive wrapping
- a status-region utility
- forced-colors resilience

The stylesheet uses the `a11y-repeatable-fieldset` BEM block and public custom
properties prefixed `--a11y-repeatable-fieldset-`. It is copied to
`dist/styles.css` during the build and is never imported by runtime
JavaScript. Core behavior does not depend on it, and it contains no structural
insertion or removal animation. It declares no animation or transition
properties, so the optional CSS has no motion to suppress under a reduced-motion
preference.

The class contract is style-only: the block is
`a11y-repeatable-fieldset`; its supported elements are `__items`, `__item`,
`__legend`, `__controls`, `__add`, `__remove`, `__position`, `__limit`, and
`__status`. Behavior always uses the documented data attributes, never these
classes. The MVP defines no BEM modifiers or `is-*` state classes because
native `hidden` and `disabled` states remain the source of truth.

Public properties are scoped to the block—never `:root`—and may be overridden
on an individual component root:

| Property | Default |
| --- | --- |
| `--a11y-repeatable-fieldset-item-gap` | `1rem` |
| `--a11y-repeatable-fieldset-item-padding` | `1rem` |
| `--a11y-repeatable-fieldset-item-border-color` | `currentColor` |
| `--a11y-repeatable-fieldset-item-border-width` | `0.125rem` |
| `--a11y-repeatable-fieldset-item-border-radius` | `0` |
| `--a11y-repeatable-fieldset-control-gap` | `0.75rem` |
| `--a11y-repeatable-fieldset-action-color` | `LinkText` |
| `--a11y-repeatable-fieldset-muted-color` | `GrayText` |
| `--a11y-repeatable-fieldset-focus-ring-color` | `Highlight` |
| `--a11y-repeatable-fieldset-focus-ring-width` | `0.1875rem` |
| `--a11y-repeatable-fieldset-focus-ring-offset` | `0.1875rem` |

Avoid overriding focus or muted colors with values that make keyboard focus,
disabled controls, or structural boundaries hard to perceive.

After implementation and publication, the planned optional import will be:

```ts
import "a11y-repeatable-fieldset/styles.css";
```

This import is a future public contract, not a claim that the package is
currently available.

## Accessibility goals

The plugin is designed to support:

- native fieldset/legend grouping
- explicit form-control labels and descriptions
- stable keyboard order
- visible focus and deterministic focus recovery
- polite structural status announcements
- native disabled semantics
- high zoom and reflow
- forced colors and reduced motion
- non-destructive cleanup

Automated tests will not be treated as proof of full WCAG conformance.
Screen-reader, keyboard, browser, autofill, zoom, forced-colors, and
reduced-motion findings must be recorded against real environments.

[`MANUAL_ACCESSIBILITY_TEST_RECORD.md`](./MANUAL_ACCESSIBILITY_TEST_RECORD.md)
contains executable fieldset/legend, Legend Sync, Remove Guard, Accessible
Reorder, Duplicate Item, Form Memory Bridge, label/ID-reference,
reduced-motion, and forced-colors scenarios with an environment-specific
evidence ledger. As of 2026-08-31, it records **2 of 6 target environments
exercised**: the basic Add/Remove flow passed with Chrome reduced-motion
emulation on macOS, and VoiceOver + Safari produced a partial result with an
open middle-removal interoperability finding. A caption-panel recording
captured the Add announcement, a missing Remove confirmation, and stale group
context after legend updates; follow-up isolation reproduced the stale native
fieldset name with Legend Sync enabled and disabled. The remaining
screen-reader scenarios are still unverified.
Supplemental keyboard checks passed for the core flow in Safari, Chrome, and
Firefox, while a 320 CSS-pixel check found right-edge clipping in the
documentation shell. “Not run” remains an evidence gap, not a passing result.
The record maps each scenario to its likely WCAG relevance without claiming
conformance.

Modern Web Guidance guide IDs used by the plan are `forms`, `accessibility`,
`html`, `css`, and `animate-element-entry-exit`. The catalog had no directly
applicable guide for tokenized clone identity, dynamic structural reset, or
focus after removing the active item; those areas have explicit project
contracts and require targeted evidence.

## GitHub Pages

The static documentation site lives in [`docs`](./docs) for future GitHub
Pages publishing from `main` and `/docs`. It uses normal HTML documents,
relative URLs, and synchronized copied build assets. Executable demos cover
the basic progressive-enhancement path, saved items, finite limits, complex
fields, no-JavaScript behavior, a realistic multi-person form, lifecycle
events, native adjacent reorder, opt-in template-first duplication,
malformed-template failure, addon rollback, and transactional
recovery.
No SPA router is used. Each page includes unique search metadata plus planned
absolute canonical, Open Graph, and Twitter/X tags for the expected
`vmitsaras.github.io/A11y-Repeatable-Fieldset` URL. The shared Pages image is
`docs/assets/social-preview.png`, with the repository-upload copy at
`.github/social-preview.png`. Each page also includes one page-specific
`WebPage` and `SoftwareSourceCode` JSON-LD graph generated from local page and
package metadata; the graph omits an npm URL while the package is private and
unpublished. Configuration and repository-preview upload remain manual
repository-owner actions.

See [`GITHUB_PAGES_PLAN.md`](./GITHUB_PAGES_PLAN.md).

## Structured docs metadata

[`src/docs.ts`](./src/docs.ts) exports typed, side-effect-free metadata for
documentation aggregation. It deliberately reports `unpublished`
status and provides no installation or runtime-usage command.

After implementation and publication, the planned package subpath will be:

```ts
import { docs } from "a11y-repeatable-fieldset/docs";
```

This import is a future public contract, not a claim that the package is
currently available.

## MVP exclusions

The core runtime will not include nested repeaters, drag-and-drop reorder,
arbitrary-index or batch reorder,
remote templates, MutationObserver auto-initialization, automatic validation,
autosave,
draft restoration, built-in core undo, built-in confirmation UI, multiple templates,
automatic or broad value copying, schema generation, framework adapters, SPA docs, CMS integration,
automatic publication, automatic Pages configuration, or automatic field-name
renumbering.

Native form reset resets values of controls still in the DOM; it does not
restore the collection's initial structure.

## Planning documents

- [`ROADMAP.md`](./ROADMAP.md)
- [`IMPLEMENTATION_TASKS.md`](./IMPLEMENTATION_TASKS.md)
- [`MARKUP_AND_ACCESSIBILITY_CONTRACT.md`](./MARKUP_AND_ACCESSIBILITY_CONTRACT.md)
- [`LIFECYCLE_EVENTS.md`](./LIFECYCLE_EVENTS.md)
- [`ADDONS.md`](./ADDONS.md)
- [`VALIDATION_BRIDGE.md`](./VALIDATION_BRIDGE.md)
- [`LEGEND_SYNC.md`](./LEGEND_SYNC.md)
- [`REMOVE_GUARD.md`](./REMOVE_GUARD.md)
- [`UNDO_REMOVE.md`](./UNDO_REMOVE.md)
- [`ACCESSIBLE_REORDER.md`](./ACCESSIBLE_REORDER.md)
- [`DUPLICATE_ITEM.md`](./DUPLICATE_ITEM.md)
- [`GITHUB_PAGES_PLAN.md`](./GITHUB_PAGES_PLAN.md)
- [`AGENTS.md`](./AGENTS.md)

Repository-subpath simulation and a Chromium demo smoke check pass locally.
The remaining documentation evidence work is broader manual browser,
assistive-technology, reflow, forced-colors, and reduced-motion verification
before any owner-authorized Pages deployment.
