# Markup and Accessibility Contract

## Status

This document defines the markup and accessibility contract for
`a11y-repeatable-fieldset`. Option normalization, read-only semantic discovery,
transactional existing-item registration, missing-key assignment, and
lifetime-stable key allocation are implemented alongside duplicate-instance
registration, disconnected inert-template materialization, and owned
visible-position synchronization. Transactional one-item Add, Remove,
Duplicate, and adjacent Move commands are implemented, while native
constraint-state synchronization and successful control reveal are also
implemented. Immutable collection/count/capability queries are implemented as
well. Add/Remove/Duplicate/Move focus resolution, polite structural announcements, and
typed JavaScript message formatters with frozen English defaults are
implemented. Lifecycle events, synchronous addon setup/cleanup, and the
remaining interactive runtime behavior are also implemented.
Non-destructive core destroy and clean reinitialization are implemented for
current resources. The requirements apply to package version 1.0.0 and are
normative unless a later documented contract
change explicitly replaces them.

## Design basis

A11yRepeatableFieldset progressively enhances server-rendered form markup. It
does not create a form, replace existing items, validate user input, or infer a
domain model.

Modern Web Guidance informed this contract:

- `forms` requires native form controls, programmatic labels, meaningful
  `fieldset`/`legend` grouping, stable control names, and a working form when
  JavaScript is unavailable.
- `accessibility` favors native elements over ARIA, natural keyboard order,
  visible focus, deliberate focus movement, and restrained polite live-region
  announcements.
- `html` reinforces `button[type="button"]`, natural DOM order, native form
  APIs, and event listeners instead of inline handlers.
- `css` requires visible `:focus-visible` treatment, non-color state cues,
  forced-colors support, and component-scoped reduced-motion behavior.
- `animate-element-entry-exit` shows that exit animation delays DOM removal.
  The MVP therefore has no structural add/remove animation; focus, cleanup, and
  lifecycle ordering remain synchronous.

The guidance catalog did not contain a directly applicable guide for
tokenized template cloning, restoring dynamic structure on form reset, or
focus after removing the active fieldset. Those behaviors are locked below and
must receive targeted browser and assistive-technology testing.

## Normative markup

```html
<form action="/contacts" method="post">
  <section
    class="a11y-repeatable-fieldset"
    data-a11y-repeatable-fieldset
    data-min-items="1"
    data-max-items="5"
    data-item-label="Contact"
    data-focus-on-add="true"
    data-announce-changes="true"
    aria-labelledby="contacts-heading"
  >
    <h2 id="contacts-heading">Emergency contacts</h2>
    <p id="contacts-limit">Add up to five contacts.</p>

    <div
      class="a11y-repeatable-fieldset__items"
      data-a11y-repeatable-fieldset-items
    >
      <fieldset
        class="a11y-repeatable-fieldset__item"
        data-a11y-repeatable-fieldset-item
        data-a11y-repeatable-fieldset-key="server-42"
      >
        <legend class="a11y-repeatable-fieldset__legend">
          Contact
          <span data-a11y-repeatable-fieldset-position>1</span>
        </legend>

        <label for="contact-server-42-name">Name</label>
        <input
          id="contact-server-42-name"
          name="contacts[server-42][name]"
          autocomplete="name"
        >

        <button
          class="a11y-repeatable-fieldset__remove"
          data-a11y-repeatable-fieldset-remove
          type="button"
          hidden
        >
          Remove contact
          <span data-a11y-repeatable-fieldset-position>1</span>
        </button>
      </fieldset>
    </div>

    <button
      class="a11y-repeatable-fieldset__add"
      data-a11y-repeatable-fieldset-add
      type="button"
      aria-describedby="contacts-limit"
      hidden
    >
      Add another contact
    </button>

    <div
      class="a11y-repeatable-fieldset__status"
      data-a11y-repeatable-fieldset-status
      role="status"
      aria-live="polite"
      aria-atomic="true"
    ></div>

    <template data-a11y-repeatable-fieldset-template>
      <fieldset
        class="a11y-repeatable-fieldset__item"
        data-a11y-repeatable-fieldset-item
        data-a11y-repeatable-fieldset-key="__A11Y_REPEATABLE_KEY__"
      >
        <legend class="a11y-repeatable-fieldset__legend">
          Contact
          <span data-a11y-repeatable-fieldset-position></span>
        </legend>

        <label for="contact-__A11Y_REPEATABLE_KEY__-name">Name</label>
        <input
          id="contact-__A11Y_REPEATABLE_KEY__-name"
          name="contacts[__A11Y_REPEATABLE_KEY__][name]"
          autocomplete="name"
          data-a11y-repeatable-fieldset-focus
        >

        <button
          class="a11y-repeatable-fieldset__remove"
          data-a11y-repeatable-fieldset-remove
          type="button"
          hidden
        >
          Remove contact
          <span data-a11y-repeatable-fieldset-position></span>
        </button>
      </fieldset>
    </template>
  </section>

  <button type="submit">Save contacts</button>
</form>
```

The domain words in this example are illustrative. Runtime behavior must not
assume contacts, people, addresses, passengers, or any other domain.

## Required elements and attributes

### Component root

- The root has `[data-a11y-repeatable-fieldset]`.
- The root is normally a neutral `div` or `section` inside a form. A `section`
  needs an accessible name supplied by normal document markup.
- The root is not required to be a `fieldset`; each repeated item is the
  `fieldset`.
- A root must not be inside another initialized repeatable-fieldset root in the
  MVP. Parent discovery still filters by nearest root to avoid selector
  leakage.

### Owned items container

- Exactly one owned element has
  `[data-a11y-repeatable-fieldset-items]`.
- Every owned item is a direct child of this container.
- The Add control, status region, and `template` are outside the items
  container.
- Generated items are appended to the end of this container.

### Items

- Every item is a
  `fieldset[data-a11y-repeatable-fieldset-item]`.
- Every item contains one non-empty direct-child `legend`. The legend describes
  the kind of information and should include a dedicated visible-position
  marker where position helps distinguish items.
- Every item has exactly one owned
  `[data-a11y-repeatable-fieldset-remove]` button.
- Existing items may contain saved values, hidden record identifiers, server
  errors, validation descriptions, and server-generated names and IDs.
- Existing content is discovered and preserved; it is not recreated.

### Template

- Exactly one owned
  `template[data-a11y-repeatable-fieldset-template]` exists.
- Its content has exactly one top-level element: a fieldset satisfying the item
  contract.
- It contains exactly one Remove button and may contain one explicit focus
  marker.
- The template is trusted author markup. The API does not accept HTML strings
  and is not an HTML sanitizer.
- A live item is never the default cloning source.

### Add and Remove controls

- Exactly one owned `[data-a11y-repeatable-fieldset-add]` exists.
- Add and Remove controls are native `<button type="button">` elements with
  visible, meaningful labels.
- Every enhancement-only Add and Remove control has `hidden` before
  initialization, including the Remove control in the template.
- The plugin removes `hidden` only after successful initialization. A failed
  initialization must never leave a visible non-working control.
- At a limit, native `disabled` is used. The plugin does not add redundant
  `aria-disabled` to a disabled button.
- Destroy restores the author-owned `hidden` and `disabled` states where
  practical. Remove controls in dynamically added items return to their
  template-authored hidden state while their fieldsets and values remain.

## Optional elements and attributes

| Attribute | Element | Meaning |
| --- | --- | --- |
| `data-a11y-repeatable-fieldset-key` | item fieldset | Stable item identity. Required after discovery; the plugin assigns it when absent. |
| `data-a11y-repeatable-fieldset-position` | text container inside an item | Receives the one-based visible position. Multiple markers per item are allowed. |
| `data-a11y-repeatable-fieldset-focus` | focusable descendant of a template item | Preferred focus target after a user-triggered addition. At most one is allowed per item. |
| `data-a11y-repeatable-fieldset-status` | owned empty element outside the items container | Author-provided status region reused for announcements. At most one is allowed. |

The status element must be empty at initialization because the plugin owns its
text while active. If the optional stylesheet is not loaded, a generated
status region may be visible; core behavior must not depend on CSS hiding it.

Concrete addon markers are not core selectors. The opt-in Legend Sync addon
defines dedicated source and legend-value markers in
[`LEGEND_SYNC.md`](./LEGEND_SYNC.md); core ignores them, and the addon may not
replace generic legend text or a position marker.

The opt-in Accessible Reorder addon defines one empty owned controls target per
item through `data-a11y-repeatable-fieldset-reorder-controls`. It creates native
Move up and Move down buttons in that target and delegates every structural
change to the public `move()` command. Core ignores the target marker. The full
addon and operation contract is in
[`ACCESSIBLE_REORDER.md`](./ACCESSIBLE_REORDER.md).

The opt-in Duplicate Item addon defines one empty owned controls target per
item and explicitly marked native controls through
`data-a11y-repeatable-fieldset-duplicate-controls` and
`data-a11y-repeatable-fieldset-duplicate-copy`. Core ignores these markers.
The complete transaction, copy matrix, sensitive-state exclusions, and event
contract are in [`DUPLICATE_ITEM.md`](./DUPLICATE_ITEM.md).

## Dataset options

The root may contain these safe primitive options:

| Attribute | Type | Default | Rule |
| --- | --- | --- | --- |
| `data-min-items` | integer | `1` | Must be zero or greater. |
| `data-max-items` | integer | unbounded | Must be at least the normalized minimum. Omission means no maximum. |
| `data-item-label` | string | `Item` | Trimmed and required to remain non-empty. |
| `data-focus-on-add` | boolean string | `true` | Accepts trimmed `true` or `false`. |
| `data-announce-changes` | boolean string | `true` | Accepts trimmed `true` or `false`. |

JavaScript options take precedence over datasets, which take precedence over
frozen defaults. Missing values use defaults. Supplied malformed numbers,
boolean strings, empty labels, negative minima, or maxima below the minimum
produce an `invalid-options` error. Callbacks, message formatters, key
factories, and addon objects are JavaScript-only.

`messageFormatters` accepts a partial JavaScript-only object with exactly the
`added`, `removed`, `duplicated`, `moved`, `moveBoundary`, `maximum`, and
`minimum` callback keys. Every supplied
value must be a function; invalid containers, unknown keys, and non-function
values produce `invalid-options`. Normalization copies supplied callbacks over
the frozen English defaults and freezes the resulting map.

## Ownership and discovery

An element is owned by an instance only when its nearest ancestor matching
`[data-a11y-repeatable-fieldset]` is that instance's root.

Discovery follows this order:

1. Validate the root and normalized options.
2. Find exactly one owned items container.
3. Find exactly one owned template and one owned Add control.
4. Collect only direct-child item fieldsets from the items container.
5. Validate each item, legend, Remove control, key, and local ID integrity.
6. Preserve valid server keys and allocate keys for keyless existing items.
7. Reserve every discovered or allocated key for the lifetime of the instance.
8. Initialize addons and their existing-item hooks in DOM order.
9. Synchronize positions and control availability.
10. Initialize or reuse the status region, reveal enhanced controls, and
    dispatch `init`.

Unmarked descendant fieldsets are never treated as items. Content belonging to
a nested root is ignored by the parent. Nested repeatable components remain
unsupported and unverified in the MVP.

## Stable keys and visible positions

Identity and display order are separate:

- A stable key is assigned once and never recalculated because another item is
  removed or moved.
- A visible position is one-based and recalculated after initialization,
  Add, Duplicate, Remove, and Move.
- Position markers receive decimal text only. The plugin does not search and
  replace arbitrary legend text.
- Current initialization implements this rule for every owned marker inside
  each registered item. It ignores nested-item and nested-root markers,
  supports multiple or no markers per item, returns fresh immutable
  zero-based-index/one-based-position snapshots internally, and rolls marker
  changes back if initialization fails.
- Existing server keys are trimmed, validated, and preserved.
- Missing keys and new-item keys default to `item-1`, `item-2`, and so on.
  Allocation skips active and previously allocated keys; removed keys are not
  reused during the same instance lifetime.
- Keys must be unique and match
  `^[A-Za-z0-9][A-Za-z0-9._:-]*$`.
- A JavaScript key factory receives a frozen typed context containing:
  - the component `root`
  - `source`, either `"initialization"` for a keyless existing item, `"add"`
    for an ordinary new template item, or `"duplicate"` for a template item
    created by Duplicate
  - `sequence`, a one-based allocation-request number for the instance
    lifetime, including failed factory calls
  - `reservedKeys`, a fresh frozen snapshot of all server and generated keys
    reserved before the call
- The factory must return an untrimmed string satisfying the same grammar.
  Invalid output or a thrown factory error produces `invalid-key`; a key
  already present in the reserved snapshot produces `duplicate-key`.
  Initialization errors occur before key attributes are assigned. Future Add
  operations map these errors to their corresponding failure results without
  DOM insertion.
- Plugin-assigned keys remain on retained fieldsets after destroy so their
  identity continues to agree with tokenized names and IDs.

## Template token replacement

The only identity token is:

```text
__A11Y_REPEATABLE_KEY__
```

Replacement is allowed only in:

- scalar attributes: `id`, `name`, `for`, `list`
- whitespace-separated ID-reference attributes: `aria-labelledby`,
  `aria-describedby`, `aria-controls`, `headers`
- `href` only when its value is a same-document hash reference beginning with
  `#`
- `data-a11y-repeatable-fieldset-key` on the template item

Rules:

1. Replace the exact literal token; do not run a general template language.
2. Do not replace text nodes, values, placeholders, classes, arbitrary
   `data-*` attributes, styles, URLs, or serialized `innerHTML`.
3. Split multi-ID attributes on ASCII whitespace, replace within each token,
   drop no unrelated references, and serialize with one space between tokens.
4. After replacement, no supported attribute in the new item may retain the
   identity token.
5. Every non-empty `id` in the candidate must be unique within the clone and
   the owner document. This includes generated IDs and untokenized IDs that
   would become live when the clone is inserted.
6. A tokenized local reference must resolve to its corresponding element in
   the new item. Untokenized external references may continue to resolve
   elsewhere in the document.
7. Failure blocks insertion and produces an `invalid-template`,
   `invalid-key`, or `duplicate-key` Add result as appropriate.

Materialization itself returns a disconnected candidate and does not mutate
the template, existing items, or items container. The later Add command owns
insertion and operation-result mapping.

## Names and backend compatibility

Existing `name` attributes are never rewritten. New names come from the
template and should include the stable-key token, for example:

```html
<input name="contacts[__A11Y_REPEATABLE_KEY__][email]">
```

The bracketed shape is an example, not a required backend convention. Authors
choose a naming shape their server understands.

The plugin must never:

- compress keys after removal
- substitute current position for stable identity
- alter saved-item names during initialization
- remove hidden record identifiers
- copy a live fieldset or copy values during ordinary Add; the opt-in
  Duplicate transaction may copy only explicitly approved current native
  control state into a disconnected trusted-template candidate

### Radio groups

Radio buttons that belong to one item share a tokenized name:

```html
<input
  type="radio"
  name="contacts[__A11Y_REPEATABLE_KEY__][method]"
  value="email"
>
```

Replacement gives each fieldset a distinct browser radio group while
preserving shared naming inside that item.

### File inputs

File inputs in new template clones begin empty. The plugin never reads,
copies, retains, restores, or programmatically assigns file values. The
implemented Undo Remove addon preserves this absolute exclusion; future
persistence or reset addons must preserve it as well.

## Add operation

A successful Add operation follows this order:

1. Confirm that the instance is active.
2. Confirm the maximum is not reached.
3. Clone the owned template content.
4. Allocate and reserve a stable key.
5. Replace supported identity tokens.
6. Validate generated IDs and tokenized references.
7. Remove template-only state while retaining item markers and identity.
8. Append the new fieldset to the owned items container.
9. Register the item.
10. Run per-item addon setup.
11. Synchronize visible positions.
12. Synchronize Add and Remove buttons.
13. Apply user-triggered focus behavior when requested.
14. Write one polite announcement when enabled.
15. Dispatch exactly one `item-added` event.

If any pre-insertion step fails, no DOM mutation or event occurs. If addon
setup fails after insertion, the parent runs any registered cleanup, removes
the incomplete item, releases active registration without making the key
reusable, restores controls and positions, and returns `addon-error`.

The CORE-009 implementation completes steps 1–9 and 11, including
maximum enforcement, API/owned-control source routing, immutable success
snapshots, and rollback after an insertion-stage failure. The implemented
addon lifecycle uses `addon-error` for rollback-safe hook failures. CORE-011
now completes step 12
and transactionally rolls control state back after a failed Add. A11Y-001 now
completes step 13 with the locked focus order. Control-triggered Add uses the
normalized `focusOnAdd` setting, while API Add remains opt-in through its
boolean `focus` option. A11Y-003 completes step 14 with one managed combined
status update. Addon setup and lifecycle dispatch complete the remaining
operation steps.

## Duplicate operation

`duplicate(target, options?)` is a public, already-approved command. It
resolves the same current owned target forms as Remove, enforces the Add
maximum, materializes the trusted template with a newly reserved key, and
inserts the new fieldset immediately after the source. It never clones the
source fieldset.

The optional synchronous `copyState` callback receives the current source
snapshot and disconnected materialized candidate. It may change only
explicitly approved current native-control properties. Core rejects
promise-like results and changes to candidate structure, attributes, or
defaults as `copy-error`. File values, errors, validation state, names, IDs,
and defaults are outside the callback contract. The callback must not mutate
the source or re-enter Add, Remove, Duplicate, or Move; core blocks structural
command reentry during this synchronous phase.

A successful Duplicate operation follows this order:

1. Confirm activity, source ownership, and maximum availability.
2. Clone the owned template, allocate a `"duplicate"` key, replace tokens,
   and validate the candidate.
3. Copy approved current state while the candidate remains disconnected.
4. Remove template-only focus state and insert immediately after the source.
5. Register at the same DOM/registry index and run per-item addon setup.
6. Synchronize positions and Add/Remove availability.
7. Apply Add-style focus when requested.
8. Write one duplicate/maximum announcement when enabled.
9. Dispatch exactly one `item-duplicated` event and no `item-added` event.

Pre-insertion and copy failures mutate no live structure. Addon failure rolls
back the incomplete insertion and registration while keeping the allocated
key reserved. The complete built-in copier matrix and privacy policy are in
[`DUPLICATE_ITEM.md`](./DUPLICATE_ITEM.md).

## Remove operation

### Control request routing

An owned Remove-button activation is a request before it becomes a Remove
operation. With no registered request owner, core approves the request
immediately. One addon may register `context.onRemoveRequest()` during
component setup. Core then supplies a frozen structural request containing the
original button and a single-use `request.remove()` command.

The request route is not a DOM event and does not change lifecycle-event flags.
The approved command revalidates instance activity, target ownership, and the
current minimum, preserves the original control source and trigger, and then
enters the operation order below. Public `instance.remove()` calls are
already-approved API commands and bypass the request route.

A denied or failed request changes no structure, focus, core status text, or
lifecycle event. Asynchronous request owners must coalesce repeated activation,
ignore delayed work after cleanup, and avoid retaining item DOM longer than the
pending decision requires.

A successful Remove operation follows this order:

1. Confirm that the instance is active.
2. Resolve an item snapshot, owned fieldset, or stable key.
3. Confirm the item is owned and removal respects the minimum.
4. Resolve a valid focus destination before detachment.
5. Let the optional single removal-snapshot owner capture data and a
   core-issued one-shot restoration command.
6. Run all per-item addon cleanup.
7. Preserve the event snapshot and detached item reference.
8. Detach and unregister the item without making its key reusable.
9. Synchronize visible positions.
10. Synchronize Add and Remove buttons.
11. Move focus when focus was inside the removed item or explicit handling was
    requested.
12. Commit any removal snapshot owner.
13. Write one polite announcement when enabled.
14. Dispatch exactly one `item-removed` event.

Blocked or failed removals leave the fieldset attached and emit no successful
event.

The CORE-010 implementation completes steps 1–3 and 7–9. It accepts
owned snapshots, fieldsets, and stable keys; returns the pre-removal immutable
snapshot; preserves removed keys as reserved; and transactionally restores
DOM order, registration, and positions after a technical failure. It captures
the pre-detachment focus state for later integration. CORE-011 now completes
step 10 and includes control state in removal rollback. A11Y-002 completes
steps 4 and 11: it resolves the candidate plan before detachment, evaluates
actual eligibility after post-removal control synchronization, and restores
pre-command focus if a technical failure restores the item. A11Y-003
completes step 13 with one managed combined status update. Removal preparation,
addon cleanup, and lifecycle dispatch complete the remaining operation steps.
The `addon-error`
result covers rollback-safe addon lifecycle failures.

## Removal restoration operation

Removal restoration is a generic, single-use core transaction exposed only to
the one addon that owns `context.onRemovePreparation()`. It is not a public
instance method, persistent serializer, HTML replacement API, or native-reset
policy.

A successful restoration:

1. rechecks activity, command readiness, maximum, and stable-key conflict
2. clones the trusted inert template
3. materializes it with the removed already-reserved key
4. permits one synchronous current-state callback while disconnected
5. rejects structural, attribute, default, validity, error, asynchronous, and
   file-value changes
6. inserts beside a surviving prior neighbor, otherwise at the bounded old index
7. registers the new fieldset and runs added-item addon setup
8. synchronizes positions, native constraints, immutable snapshots, and focus
9. writes one restored structural message
10. dispatches one completed `item-restored` event and consumes the command

The command retains structural coordinates, not the detached author fieldset.
Malformed, stale, conflicting, or addon-failed data leaves the current author
DOM usable. Partial candidates are rolled back and no success event is emitted.
Exact key restoration preserves tokenized names, IDs, labels, and local
references; visible position may change after intervening structural work.

## Move operation

`move(target, direction)` is a public, already-approved command. It accepts a
current immutable item snapshot, owned fieldset, or stable key, and exactly one
adjacent direction: `"up"` or `"down"`. Stable keys, names, IDs, values, and
addon registrations remain attached to the same fieldset.

A successful Move operation follows this order:

1. Confirm that the instance is active.
2. Resolve the target and confirm current ownership.
3. Resolve the adjacent destination and block at the start or end boundary.
4. Capture current registry order, DOM position, snapshots, and focus state.
5. Move the existing fieldset in the owned items container.
6. Synchronize registry order and visible positions.
7. Refresh immutable item snapshots without changing stable identity.
8. Preserve the same eligible active element when focus was inside the moved
   item; leave unrelated focus unchanged.
9. Write one polite moved announcement when enabled.
10. Dispatch exactly one `item-moved` event.

The frozen success result includes the new item snapshot, prior index and
position, and direction. A boundary returns a frozen typed failure with
`reason: "boundary"`, `boundary: "start" | "end"`, and the current snapshot;
it changes no structure and emits no lifecycle event. Boundary activation may
write one polite already-first/already-last message. Inactive, unowned, and
technical failures use `inactive`, `unowned-item`, and `move-error` results.
A technical failure rolls DOM order, registry order, positions, snapshots, and
focus back and emits no success event or status message.

Accessible Reorder deliberately keeps its native Move buttons enabled at a
boundary. Activation therefore produces understandable boundary feedback and
never invalidates focus by disabling the active control. The buttons do not
carry `aria-disabled`; their availability is communicated by the core status
message after activation.

## Focus contract

### User-triggered addition

When `focusOnAdd` is enabled, resolve focus in this order:

1. the enabled, non-hidden, non-inert element marked
   `[data-a11y-repeatable-fieldset-focus]`
2. the first enabled, non-hidden, non-inert labelable form control in natural
   DOM order
3. the new fieldset only when the template deliberately makes it
   programmatically focusable, normally with `tabindex="-1"`
4. no movement, leaving focus on the Add button

The plugin does not add `tabindex="0"` to every fieldset and does not use
positive `tabindex`. API additions do not move focus unless their call options
explicitly request it.

The A11Y-001 implementation applies this order only after insertion, visible
position synchronization, and final native constraint state. It removes the
template-only focus marker from live DOM, excludes the structural Remove
button from the data-control fallback, and leaves an otherwise focused Add
button undisturbed. Automated DOM tests can verify target selection but are
not evidence for focus scrolling or assistive-technology timing.

### Removal

If focus is inside the item being removed, resolve in this order:

1. the equivalent enabled Remove button in the next item
2. the equivalent enabled Remove button in the previous item
3. the Add button
4. an intentionally focusable root fallback

The candidate is evaluated against the post-removal limit state. A Remove
button that will become disabled at the minimum is not selected. Programmatic
removal leaves unrelated focus untouched; it cannot suppress required focus
recovery when the active element is being detached.

The A11Y-002 implementation resolves next and previous candidates from the
owned registry rather than broad descendant selectors. Control-driven removal
requests focus handling. API removal is opt-in when focus is elsewhere but
always recovers focus that would otherwise be detached. The root fallback is
used only when the author deliberately supplied a valid `tabindex`; the
plugin adds no tab stop. Automated DOM tests do not prove focus scrolling or
assistive-technology announcement timing.

### Move

Moving an item preserves focus on the same eligible active element inside that
fieldset, including an Accessible Reorder button. Focus outside the moved item
is not moved. Core never shifts focus according to visual CSS order, adds a tab
stop, or focuses the fieldset merely because its position changed. If a
technical failure rolls the transaction back, the pre-command focus target is
restored when it remains eligible.

### Restoration

An accessible Undo control requests the normal Add focus order for the newly
restored template-derived fieldset. The short-lived Undo button remains
available while focused: expiry pauses on focus and resumes with the remaining
time on blur. A blocked restoration does not detach or hide focused author
content.

## Announcements

- Reuse one empty author status region when present.
- Otherwise create one region only when announcements are enabled.
- The region uses `role="status"`, `aria-live="polite"`, and
  `aria-atomic="true"`.
- Announce completed structural changes, not button activation or internal
  synchronization.
- Write one combined message. When an operation reaches a limit, combine the
  item message and boundary message in the same text update.
- A blocked programmatic command may announce the relevant boundary once when
  announcements are enabled; it still emits no success event.
- Clear or replace stale text with one managed timer. Destroy cancels the timer
  and removes only plugin-generated status DOM.
- Routine operations never use `role="alert"` or assertive announcements.
- Batch operations are outside the MVP. A future batch API must produce one
  aggregate announcement.

The frozen `DEFAULT_MESSAGE_FORMATTERS` object centralizes eight default
English concepts configurable through the JavaScript-only
`messageFormatters` option:

- item added
- item removed
- item restored
- item duplicated
- item moved
- Move boundary reached
- maximum reached
- minimum reached

The exported `RepeatableFieldsetMessageContext` base includes item label,
resulting count, minimum, and maximum.
`RepeatableFieldsetItemMessageContext` adds a stable key and position: current
position for Add and Restore, and previous position for Remove.
`RepeatableFieldsetBoundaryMessageContext` uses nullable key and position
because a blocked Add has no candidate item; reached boundaries and blocked
Remove operations include the relevant item identity.
`RepeatableFieldsetMoveMessageContext` adds the previous position and
direction to the moved item's current identity and position.
`RepeatableFieldsetDuplicateMessageContext` adds the source key and source
position to the new item's current identity and position.
`RepeatableFieldsetMoveBoundaryMessageContext` adds direction and the reached
`start` or `end` boundary. Each callback receives
a fresh frozen context containing no form-control values, validation content,
or server errors. Control labels remain author-owned in the MVP; the core does
not generate Add or Remove button text.

The A11Y-003 implementation creates or reuses the region transactionally,
normalizes its active semantics to polite and atomic, writes synchronously
after focus and collection state stabilize, and owns one replaceable clear
timer. Successful operations combine their structural and reached-boundary
messages. Blocked API limit commands write only the relevant boundary.
Destroy cancels pending work, removes generated status DOM, and clears and
restores an author region. A11Y-004 exports the frozen English callbacks,
typed context and formatter contracts, and partial override option. Valid
custom output is trimmed. A thrown formatter or non-string, empty, or
whitespace-only result falls back to the corresponding English default rather
than rolling back a completed structural operation. Formatter failures do not
introduce a new result reason or lifecycle event.

## Minimum and maximum behavior

- At the minimum, every owned Remove button is natively disabled.
- At the maximum, the Add button is natively disabled.
- State is visible without relying on color alone.
- Nearby visible instructions should disclose meaningful limits before users
  encounter them.
- A blocked command returns a typed result and dispatches no item event.
- Zero items are supported only when the normalized minimum is `0`; the
  template and Add button still remain required.

CORE-011 implements these native control states through one internal
capability calculation shared by commands and synchronization. Successful
initialization reveals Add and Remove controls only after their disabled state
is ready. Synchronization runs after every successful structural command and
is rolled back with positions, registration, and DOM structure if a write
fails. No `aria-disabled` attribute is generated. CORE-012 exposes the same
internal state through `canAdd()` and `canRemove()`, alongside `getCount()` and
fresh frozen `getItems()` snapshots. Inactive destroyed instances report no
owned items or available structural commands.

## Initialization errors

Initialization throws `RepeatableFieldsetError` with one of these planned
codes:

- `invalid-root`
- `invalid-options`
- `missing-items-container`
- `multiple-items-containers`
- `missing-template`
- `multiple-templates`
- `invalid-template`
- `missing-add-control`
- `multiple-add-controls`
- `invalid-item`
- `missing-legend`
- `missing-remove-control`
- `multiple-remove-controls`
- `invalid-focus-target`
- `multiple-status-regions`
- `nonempty-status-region`
- `invalid-key`
- `duplicate-key`
- `duplicate-id`
- `unresolved-template-token`

Errors identify the root and offending element where safe. Initialization is
transactional: no listener, generated UI, class, changed button state, addon
registration, or `WeakMap` entry survives failure.

## Form reset

Native `form.reset()` resets each control currently in the DOM to its default
value. It does not:

- remove dynamically added fieldsets
- restore removed server-rendered fieldsets
- restore the initial item count or order
- allocate new stable keys
- emit a repeatable-fieldset lifecycle event

The core does not override native reset. A future Reset Structure addon may
offer explicit structural semantics after a separate design review.

## Destroy and DOM ownership

The author owns:

- the root, items container, template, fieldsets, legends, form controls, Add
  and Remove buttons, saved values, keys, names, IDs, and server content
- an optional status-region element

The plugin owns:

- listeners and timers it installs
- the active Remove-request route and pending addon cleanup registration
- active registration and reserved-key state
- generated status-region DOM
- text written into the dedicated status region while active
- initialized/state classes and control-state changes it applies
- addon cleanup registrations

Destroy removes plugin-owned behavior and generated UI but preserves every
current fieldset and user value. It keeps assigned keys and current position
text because retained names and visible structure must remain coherent.

CORE-013 implements teardown for every resource currently owned by the core:
the delegated root listener, active `WeakMap` registration, constraint-control
state, and internal references. It restores current Add/Remove controls to
their author or template `hidden`/`disabled` states, keeps author classes and
status DOM untouched, preserves the current collection and form data, and
allows a clean new instance. Repeated calls are inert. A11Y-003 adds
destroy-time status timer cancellation, generated-region removal, and author
region restoration. Addon cleanup and the final destroy event remain
dependency-ordered integrations because those resources are not implemented
yet.

## No-JavaScript behavior

Before JavaScript:

- server-rendered fieldsets, legends, labels, controls, values, errors, and
  submit buttons remain usable
- the form submits its existing controls normally
- the template is inert
- Add and Remove buttons are hidden and cannot misrepresent unavailable
  behavior

Sites needing no-JavaScript structural editing may provide a separate
server-side link or submit action outside this plugin contract.

## Limitations and required evidence

- Nested repeaters are unsupported.
- Browser autofill and password-manager behavior for repeated stable-key names
  is not guaranteed and requires realistic browser testing.
- External untokenized ID references remain the author's responsibility.
- The plugin validates its structural contract but is not a full HTML,
  accessibility, or form-validity auditor.
- Screen-reader phrasing for fieldsets, focus changes, and polite
  announcements must be tested with NVDA/Firefox, NVDA/Chrome,
  VoiceOver/Safari, and TalkBack/Chrome where practical.
- `MANUAL_ACCESSIBILITY_TEST_RECORD.md` defines the fieldset/legend and
  tokenized label/ID-reference scenarios and environment ledger. A planned
  scenario is not evidence until its observed result is recorded.
- Complex `headers` and multi-ID references require automated and manual
  verification.
- Validation engines, error summaries, draft storage, built-in core undo, and reset
  restoration require addons or integrations. Adjacent reordering is available
  through public `move()` and the opt-in Accessible Reorder addon; drag and
  drop, arbitrary-index moves, and bulk reorder remain outside the contract.
  Confirmation is available only through the opt-in Remove Guard and explicit
  application policy. Short-lived Undo is available only through the opt-in
  Undo Remove addon and its explicit retention markers.
