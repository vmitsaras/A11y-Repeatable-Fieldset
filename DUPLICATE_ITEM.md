# Duplicate Item Contract

## Status

Duplicate Item is implemented as an opt-in addon at
`a11y-repeatable-fieldset/addons/duplicate-item`. It is dependency-free, has
no import-time DOM effects, is absent from the main runtime entry, and is never
enabled automatically. This contract applies to package version 1.0.0.

The prerequisite public `duplicate(target, options)` command is a core
transaction. It materializes the trusted inert template with a fresh key,
runs one constrained synchronous state-copy phase while that candidate is
disconnected, and only then inserts, registers, and runs addon setup. Neither
core nor the addon clones a live fieldset.

## Public API

```ts
import {
  EVENTS,
  createRepeatableFieldset
} from "a11y-repeatable-fieldset";
import {
  createDuplicateItem
} from "a11y-repeatable-fieldset/addons/duplicate-item";

const instance = createRepeatableFieldset(root, {
  addons: [createDuplicateItem({ buttonLabel: "Duplicate contact" })]
});

instance.duplicate("server-42");
root.addEventListener(EVENTS.itemDuplicated, observeCompletedDuplicate);
```

The main entry exports:

- `duplicate(target, options?)` on `RepeatableFieldsetInstance`
- `RepeatableFieldsetDuplicateTarget`
- `RepeatableFieldsetDuplicateOptions`
- `RepeatableFieldsetDuplicateStateContext` and copier type
- `RepeatableFieldsetDuplicateResult` and its success/failure types
- `RepeatableFieldsetItemDuplicatedEventDetail`
- `RepeatableFieldsetDuplicateMessageContext`

The addon subpath exports:

- `createDuplicateItem(options?)`
- `DuplicateItemOptions`
- the frozen `DUPLICATE_ITEM_ATTRIBUTES` object

## Core transaction prerequisite

A successful Duplicate command follows this order:

1. confirm that the instance is active;
2. resolve the current owned source and enforce the maximum;
3. clone only the owned inert template;
4. allocate and reserve a fresh key with key-factory source `"duplicate"`;
5. replace identity tokens and validate IDs/references;
6. invoke the optional synchronous `copyState` callback on the disconnected
   candidate;
7. reject structural, attribute, or default-state mutation by that callback;
8. insert the candidate immediately after the current source and register it
   at the same collection position;
9. run per-item addon setup with the copied current state already present;
10. synchronize positions and native constraint controls;
11. apply requested Add-style focus;
12. write one core duplicate/maximum status message; and
13. dispatch exactly one completed `item-duplicated` event.

The copy callback is synchronous and trusted application/addon code. It may
change only current supported native-control properties such as `value`,
`checked`, and option selectedness. It must not mutate either fieldset's DOM,
attributes, names, IDs, defaults, errors, custom validity, file inputs, or
external state, and it must not re-enter Add, Remove, Duplicate, or Move.
Returning a promise-like value, throwing, re-entering a structural command, or changing
candidate structure produces `copy-error` before insertion.

If addon setup later fails, core cleans the incomplete item, detaches and
unregisters it, restores positions/constraints, keeps its allocated key
reserved, returns `addon-error`, and emits no success message or event.

## Marker and generated-control contract

Every existing item and the template item contains exactly one empty owned
button target:

```html
<div data-a11y-repeatable-fieldset-duplicate-controls></div>
```

The target is an exposed HTML element inside its item, outside the direct
legend and outside live output. The addon creates one visible native
`button[type="button"]` with
`data-a11y-repeatable-fieldset-duplicate`. The default visible label is
`Duplicate item`; `buttonLabel` accepts a trimmed nonempty override. Native
Enter and Space activation are sufficient, so the addon adds no role,
`tabindex`, or custom keyboard model.

Copying is per-control opt-in. A source control and its template counterpart
use the same unique safe slot:

```html
<input
  name="contacts[server-42][name]"
  data-a11y-repeatable-fieldset-duplicate-copy="name"
>
```

```html
<input
  name="contacts[__A11Y_REPEATABLE_KEY__][name]"
  data-a11y-repeatable-fieldset-duplicate-copy="name"
>
```

Slots match `^[A-Za-z0-9][A-Za-z0-9._:-]*$` and are unique within an item.
Unmarked controls retain trusted-template defaults. A marked source without
one matching template control fails the copy transaction. Extra marked
template controls keep their defaults when the source has no matching slot.

## Native-control copy matrix

| Control | Copied current state | Deliberately not copied |
| --- | --- | --- |
| Supported text-like `input` | `value` | `defaultValue`, attributes, custom validity, errors |
| `checkbox` | `checked` | `defaultChecked`, `indeterminate`, validation state |
| `radio` | each explicitly marked radio's `checked` state | name/value identity, `defaultChecked` |
| Single `select` | first enabled template option whose value matches the enabled selected source option | `defaultSelected`; template default remains if no enabled match |
| Multiple `select` | enabled selected values as an ordered multiset, matched to enabled template options | disabled-option state and `defaultSelected` |
| `textarea` | `value` | `defaultValue`, text markup, custom validity, errors |
| Disabled or readonly control | unsupported | all state |
| Hidden `input` | unsupported | hidden/server state |
| File `input` | unsupported and never read | file path, `FileList`, value, defaults |
| Password/credential/authentication/payment/transaction field | unsupported even when marked | all sensitive state |
| Custom form-associated control | unsupported | all state; requires a future explicit adapter review |

Supported value inputs are `text`, `search`, `email`, `tel`, `url`, `number`,
`range`, `date`, `month`, `week`, `time`, `datetime-local`, and `color`.
Button-like, image, hidden, file, password, and unsupported input types are
rejected when marked.

Only current state is copied. Native `form.reset()` therefore resets a
duplicated control to the trusted template's default, not to the source value
that happened to be present during duplication.

## Sensitive data, errors, and validation

The addon never performs a broad form scan. The copy marker is the explicit
allowlist, and hard exclusions remain a second boundary:

- hidden record IDs, CSRF values, and server identifiers are unmarked and
  hidden inputs cannot opt in;
- `password` inputs and autocomplete tokens `username`, `current-password`,
  `new-password`, `one-time-code`, and `webauthn` are rejected;
- `cc-*` and `transaction-*` autocomplete fields are rejected;
- file values and `FileList` objects are never read, copied, retained, or
  assigned;
- `aria-invalid`, `aria-errormessage`, server error nodes, custom validity,
  dirty/touched flags, and validator registrations are not copied;
- visible identifiers or personal data remain application-classification
  decisions and must not receive a copy marker unless duplication is expected
  and disclosed.

The trusted template supplies the new item's markup and defaults. Validation
Bridge and other item addons see the already-copied current values during
their normal new-item setup and build fresh registration state rather than
receiving source-item errors.

## Focus, constraints, announcements, and event

The generated button delegates to `instance.duplicate(source, {
focus: true, copyState })`. Focus follows the existing Add order inside the
new item. Public API Duplicate preserves unrelated focus unless `focus: true`
is supplied.

Duplicate availability follows `canAdd()`. Buttons use native `disabled` at
the maximum and never add redundant `aria-disabled`. Add, Remove, and
successful Duplicate events resynchronize every generated button.

Core remains the only structural announcer. Default success is:

```text
Item 1 duplicated as position 2. 2 items total.
```

Reaching the maximum appends the normal maximum message in the same polite
status update. The formatter context contains only label, keys, positions,
count, and limits; it contains no field values or validation content.

The additive lifecycle observation is:

- constant: `EVENTS.itemDuplicated`
- DOM name: `a11y-repeatable-fieldset:item-duplicated`
- target: component root
- flags: `bubbles: true`, `composed: false`, `cancelable: false`
- timing: after copy, insertion, registry, addon setup, positions, controls,
  focus, and status text are stable
- detail: new item/key/index/position, source key/index/position, resulting
  count, and nullable focus target

Duplicate does not emit `item-added`. An ordinary Add materializes template
defaults; Duplicate may copy deliberately selected current state. Keeping the
observations distinct prevents analytics, draft, validation, and privacy
integrations from silently treating those operations as equivalent.

## Result and failure contract

```ts
type RepeatableFieldsetDuplicateResult =
  | {
      readonly ok: true;
      readonly item: Readonly<RepeatableFieldsetItem>;
      readonly sourceItem: Readonly<RepeatableFieldsetItem>;
    }
  | {
      readonly ok: false;
      readonly reason: "inactive" | "maximum" | "unowned-item";
    }
  | {
      readonly ok: false;
      readonly reason:
        | "invalid-key"
        | "duplicate-key"
        | "invalid-template"
        | "copy-error"
        | "addon-error";
      readonly error: unknown;
    };
```

Every result and snapshot is frozen. Blocked, copy-failed, template-failed,
and rolled-back commands emit no `item-duplicated` or `item-added` event and
no success announcement. Failed keys remain reserved.

## Cleanup, packaging, and evidence

Generated buttons/listeners belong to parent-owned per-item cleanup. Cleanup
runs before removal and during destroy, removes only addon-owned buttons,
leaves author targets and copy markers in place, and releases item references.
Reinitialization creates one fresh control per current item.

The concrete addon has a separate build, declaration, package export, and
Pages asset. The main runtime exports only the generic core Duplicate command
and types and never imports or re-exports `createDuplicateItem`.

Automated tests cover transaction ordering, disconnected copying, every copy
category and exclusion, defaults, errors, validation, insertion position,
fresh keys, focus, constraints, status, exact event detail/flags, rollback,
cleanup, reinitialization, package export, and bundle isolation. Manual checks
remain required for native-button focus visibility, screen-reader fieldset and
status timing, zoom/reflow, forced colors, password-manager behavior, and
real-form privacy expectations.
