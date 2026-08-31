# Undo Remove addon

## Status and package boundary

Undo Remove is an implemented, opt-in addon exported only from
`a11y-repeatable-fieldset/addons/undo-remove`. It is synchronous,
dependency-free, disabled by default, and absent from the main runtime bundle.
The package remains unpublished.

Undo is deliberately distinct from persistent Form Memory and native-reset
structure policy. It keeps one short-lived in-memory record for the latest
successful removal. It never writes storage, listens for form reset, or
serializes author HTML.

## Author markup

Each root using the addon must contain exactly one empty, exposed, owned target:

```html
<div data-a11y-repeatable-fieldset-undo-controls></div>
```

The target must be outside repeated items, templates, legends, and live output.
The addon creates one native `button[type="button"]` in the target. The button
is hidden until a removal commits and is removed on destroy.

Current control state is retained only when the author marks matching source
and trusted-template controls:

```html
<input
  name="contacts[server-42][name]"
  data-a11y-repeatable-fieldset-undo-state="name"
>

<template data-a11y-repeatable-fieldset-template>
  <fieldset
    data-a11y-repeatable-fieldset-item
    data-a11y-repeatable-fieldset-key="__A11Y_REPEATABLE_KEY__"
  >
    <input
      name="contacts[__A11Y_REPEATABLE_KEY__][name]"
      data-a11y-repeatable-fieldset-undo-state="name"
    >
  </fieldset>
</template>
```

Marker values use the stable-key grammar
`^[A-Za-z0-9][A-Za-z0-9._:-]*$`, must be unique within one item, and must
identify the same native-control kind in the trusted template. A marker is an
explicit retention decision; unmarked controls restore their template defaults.

## API

```ts
import { createRepeatableFieldset } from "a11y-repeatable-fieldset";
import {
  createUndoRemove,
  UNDO_REMOVE_ATTRIBUTES,
  type UndoRemoveOptions
} from "a11y-repeatable-fieldset/addons/undo-remove";

createRepeatableFieldset(root, {
  addons: [
    createUndoRemove({
      buttonLabel: "Undo last removal",
      expiryMs: 30_000
    })
  ]
});
```

`buttonLabel` must be non-empty. `expiryMs` must be a safe integer from
1,000 through 600,000 milliseconds; its default is 30,000. Unknown options are
rejected. The exported attributes object and returned addon are frozen.

## Retention and privacy matrix

The addon can retain only current state for explicitly marked:

| Native control | Retained current state |
| --- | --- |
| text-like inputs: text, search, email, tel, URL, number, range, date, month, week, time, datetime-local, color | `value` |
| checkbox and radio | `checked` |
| select-one and select-multiple | selected enabled option values |
| textarea | `value` |

The addon rejects a state marker on:

- file, password, or hidden inputs
- credential, authentication-code, payment, or transaction autocomplete fields
- disabled, readonly, hidden, inert, or `aria-hidden` controls
- custom form-associated controls or non-form elements
- unsupported native input types

Unmarked hidden server identifiers, validation errors, custom validity,
default values/default checkedness, dirty flags, selection ranges, and
application-owned metadata are not retained. Every retained text value may
still be personal or sensitive; authors must disclose the temporary retention
where their context requires it.

File inputs are absolute exclusions. The addon does not read their `value`,
`files`, or `File` objects, does not place them in its snapshot, and does not
assign a value during restore. The restored trusted-template file input is
empty.

## Transaction and identity

Core owns the restoration transaction. Before per-item addon cleanup, it gives
the single removal-snapshot owner:

- the current structural item snapshot
- a one-shot restoration command
- commit and rollback participation in the Remove transaction

The command retains only the removed stable key, previous index and position,
and adjacent stable keys. It does not retain the detached fieldset.

For a successful Undo, core:

1. rechecks instance activity, command state, maximum, and key conflict
2. clones the trusted inert template
3. materializes it with the removed already-reserved key
4. invokes the addon's synchronous state restorer while disconnected
5. rejects structural, attribute, default, or asynchronous callback changes
6. inserts beside a surviving previous/next key, otherwise at the bounded old index
7. registers the item and runs every new-item addon setup
8. synchronizes positions and native Add/Remove states
9. applies Add-style focus when requested
10. writes one restored structural status message
11. dispatches one completed `item-restored` event
12. consumes the restoration command

Malformed, stale, conflicting, maximum-blocked, state-restorer, or addon data
never replaces the current author DOM wholesale. Partial candidates are
detached and unregistered, synchronization is rolled back, and no success event
is emitted. A blocked maximum can remain retryable; malformed, conflicted, or
otherwise unusable addon snapshots are discarded by the concrete Undo UI.

The restored fieldset is new template-derived DOM, not the removed fieldset.
Its stable key—and therefore tokenized names, IDs, labels, and local
references—is restored exactly. Visible position may differ if other
structural work occurred while Undo was available.

## Accessible interaction

- The generated control is a native button with no custom keyboard behavior.
- It appears only while one usable snapshot exists.
- Native `disabled` reflects the current core maximum; no redundant
  `aria-disabled` is added.
- Activating Undo requests the normal Add focus decision order inside the
  restored item.
- Expiry pauses while the Undo button itself has focus, so a focused control
  never disappears. The remaining time resumes on blur.
- The addon creates no live region. Core announces removal once and successful
  restoration once through the root's existing polite, atomic status region.
- Expiry itself is silent.

The default restoration message is:

```text
Item restored at position 2. 3 items total.
```

Applications can override the `restored` concept through the same
JavaScript-only `messageFormatters` option used by other core structural
messages.

## Lifecycle event

Successful restoration dispatches
`a11y-repeatable-fieldset:item-restored` from the root with the standard
bubbling, non-composed, non-cancelable flags:

```ts
interface RepeatableFieldsetItemRestoredEventDetail {
  readonly instance: A11yRepeatableFieldset;
  readonly root: HTMLElement;
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

The detail contains structure and focus only. It never exposes retained field
values or addon marker slots.

## Replacement, expiry, and cleanup

Only the latest committed removal is undoable. A later successful removal
replaces the earlier snapshot. A blocked or rolled-back removal does not
replace it. Expiry drops the state record and command, hides the button, and
releases the timer.

Destroy cancels the timer, drops retained data and commands, removes listeners,
and removes the generated button. Reinitialization starts with no pending
snapshot. The addon never retains detached fieldsets.

## Addon composition

`context.onRemovePreparation()` has one owner per instance and is independent
from `context.onRemoveRequest()`. Undo Remove can therefore compose with
Remove Guard: the guard decides whether a control request becomes an approved
Remove command, then Undo captures state only if that removal actually starts.

A second removal-snapshot owner is rejected during transactional
initialization. Form Memory must not silently register through this
short-lived Undo channel; its persistent/versioned adapter, consent,
migrations, TTL, corruption recovery, and ownership remain a separate future
contract.

The possible shared structure serialization utility described in
`ADDONS.md` remains experimental and is not a package export. Undo's generic
core restore boundary is narrow and synchronous; it is not unrestricted HTML
serialization or a committed persistence API.

## Manual verification limits

Automated jsdom tests cover structure, identity, state exclusions, rollback,
events, timer behavior, focus targets, cleanup, and package isolation. Before
publication, manual testing still needs to verify:

- screen-reader announcement timing for Remove followed by Undo
- keyboard discovery and activation of the temporarily available button
- focus behavior and scrolling in supported browsers
- expiry pause while focus remains on the button
- zoom/reflow, forced colors, and high-contrast presentation
- real browser file inputs remain empty without access attempts

These tests support the component contract; they do not by themselves claim
complete WCAG conformance.
