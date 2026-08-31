# Accessible Reorder Contract

## Status

Accessible Reorder is implemented as an opt-in addon at
`a11y-repeatable-fieldset/addons/accessible-reorder`. It is dependency-free,
has no import-time DOM effects, is absent from the main runtime entry, and is
never enabled automatically. This contract applies to package version 1.0.0.

The prerequisite public `move(target, direction)` command and completed
`item-moved` lifecycle event are core contracts. The addon renders native
adjacent-move buttons and delegates every structural change back to that
command. It never mutates item DOM order, the internal registry, visible
positions, stable keys, names, focus, or status text itself.

## Public API

```ts
import {
  EVENTS,
  createRepeatableFieldset
} from "a11y-repeatable-fieldset";
import {
  createAccessibleReorder
} from "a11y-repeatable-fieldset/addons/accessible-reorder";

const instance = createRepeatableFieldset(root, {
  addons: [
    createAccessibleReorder({
      moveUpLabel: "Move up",
      moveDownLabel: "Move down"
    })
  ]
});

instance.move("server-42", "down");
root.addEventListener(EVENTS.itemMoved, observeCompletedMove);
```

The main entry exports:

- `move(target, direction)` on `RepeatableFieldsetInstance`
- `RepeatableFieldsetMoveTarget`
- `RepeatableFieldsetMoveDirection`
- `RepeatableFieldsetMoveBoundary`
- `RepeatableFieldsetMoveResult` and its success/failure types
- `RepeatableFieldsetItemMovedEventDetail`
- `RepeatableFieldsetMoveMessageContext`
- `RepeatableFieldsetMoveBoundaryMessageContext`

The addon subpath exports:

- `createAccessibleReorder(options?)`
- `AccessibleReorderOptions`
- the frozen `ACCESSIBLE_REORDER_ATTRIBUTES` object

## Core Move command

`move()` accepts the same owned target forms as Remove: a readonly item
snapshot, an owned item fieldset, or a stable key. Direction is exactly
`"up"` or `"down"`; malformed JavaScript input throws the existing typed
`invalid-options` error.

A successful command:

1. confirms the instance is active;
2. resolves the current owned item independently of stale snapshot position;
3. calculates the adjacent destination in current registry order;
4. captures the exact DOM rollback position and focus inside the moving item;
5. updates registry order;
6. moves the existing fieldset in the owned items container;
7. synchronizes visible positions and immutable collection snapshots;
8. restores the same eligible active element when DOM movement displaced it;
9. writes one polite moved message; and
10. dispatches one completed `item-moved` event.

The command never runs per-item cleanup/setup because the item remains owned
and attached. Add/Remove constraint state and reserved keys do not change.
Stable keys, control names, IDs, values, defaults, validation content, server
identifiers, and file inputs remain untouched.

If DOM movement or position synchronization fails, core restores prior DOM
order, registry order, marker contents, immutable snapshots, and owned focus,
returns `move-error`, and writes no success message or event.

## Result contract

```ts
type RepeatableFieldsetMoveResult =
  | {
      readonly ok: true;
      readonly item: Readonly<RepeatableFieldsetItem>;
      readonly previousIndex: number;
      readonly previousPosition: number;
      readonly direction: "up" | "down";
    }
  | { readonly ok: false; readonly reason: "inactive" | "unowned-item" }
  | {
      readonly ok: false;
      readonly reason: "boundary";
      readonly boundary: "start" | "end";
      readonly item: Readonly<RepeatableFieldsetItem>;
    }
  | {
      readonly ok: false;
      readonly reason: "move-error";
      readonly error: unknown;
    };
```

All results and item snapshots are frozen. Moving up from the first position
returns `boundary: "start"`; moving down from the last returns
`boundary: "end"`. Boundary commands do not mutate or dispatch `item-moved`,
but they write one polite application-visible status message when core
announcements are enabled.

## Marker and generated-control contract

Every existing item and the inert template item must contain exactly one owned
empty target:

```html
<div
  class="a11y-repeatable-fieldset__controls"
  data-a11y-repeatable-fieldset-reorder-controls
></div>
```

The target must be an exposed HTML element inside its item, outside the direct
legend, and outside `role="status"`, `role="alert"`, or active `aria-live`
output. Nested-root and other-item targets are ignored by ownership filtering.
Missing, duplicate, nonempty, hidden, inert, or `aria-hidden="true"` targets
fail existing-item initialization transactionally or return `addon-error` for
an invalid newly added item.

The addon creates two visible native `<button type="button">` controls with:

- `data-a11y-repeatable-fieldset-move-up`
- `data-a11y-repeatable-fieldset-move-down`

It adds no role, `tabindex`, keyboard event model, or ARIA state. Native Enter
and Space activation are sufficient. Labels are visible strings normalized
from `moveUpLabel` and `moveDownLabel`; defaults are `Move up` and `Move down`.
The enclosing fieldset and legend provide item context.

## Boundary-control and focus decision

The two Move controls intentionally remain enabled at the first and last
positions. Disabling the currently focused Move button after a successful
move could discard focus or force an addon-specific focus transfer after core
had declared the operation stable. Keeping the controls operable provides a
consistent target: a boundary activation changes nothing and core announces
that the item is already first or last.

On success, focus remains on the same eligible control or other element inside
the moved fieldset. If DOM movement temporarily displaces it, core restores
that exact element after registry and position synchronization. Programmatic
Move leaves unrelated focus untouched. The addon never focuses a fieldset,
adds a tab stop, or chooses focus by CSS order.

## Announcement contract

Core remains the only structural announcer.

- Success default: `Item moved to position 2 of 3.`
- Start boundary default: `Item 1 is already first.`
- End boundary default: `Item 3 is already last.`

`messageFormatters.moved` receives frozen structural metadata including the
stable key, previous/current position, count, limits, and direction.
`messageFormatters.moveBoundary` additionally receives `start` or `end`.
Neither context contains control values, validation errors, or server data.
Invalid custom output falls back to the frozen English formatter.

The addon creates no live region and writes no core status text. One activation
therefore produces at most one core status update.

## Lifecycle-event review

The new event is deliberately additive and reorder-specific:

- constant: `EVENTS.itemMoved`
- DOM name: `a11y-repeatable-fieldset:item-moved`
- target: component root
- flags: `bubbles: true`, `composed: false`, `cancelable: false`
- timing: after DOM order, registry, positions, immutable snapshots, focus,
  and status text are stable
- detail: current item snapshot/key, previous/current index and position,
  count, direction, and nullable focus target

It observes one completed Move. It is not a request, command, before-event, or
cancelation mechanism. Boundary, unknown, inactive, and rolled-back commands
emit no `item-moved`. Add and Remove events are not reused because they mean
creation and detachment, neither of which occurs during reorder.

This is an additive pre-publication contract change recorded as a minor
Changeset. No existing event name, flag, detail, target, or dispatch condition
changes.

## Cleanup and isolation

Each item's generated buttons and listeners belong to its parent-owned addon
cleanup scope. Cleanup runs before removal and during destroy, removes only
the two generated buttons, leaves the author target in place, and releases all
item references. Reinitialization creates one fresh pair per current item.

The concrete addon is a separate build/package/Pages entry. The main runtime
exports only generic core Move types and behavior and never imports or
re-exports `createAccessibleReorder`.

## Required evidence

Automated tests cover target ownership and validation, native button markup,
custom labels, existing/added items, movement and boundaries, DOM/registry/
position rollback, stable keys/names/values, focus preservation, one status
message, exact `item-moved` detail/flags/order, cleanup, reinitialization,
package export, Pages asset copying, and main-bundle isolation.

Manual testing remains required for visible focus after repeated movement,
fieldset reading order, position-change announcement timing, boundary wording,
zoom/reflow, forced colors, touch targets, and target screen-reader/browser
combinations. Drag and drop is not implemented and must never become the only
reorder interaction.
