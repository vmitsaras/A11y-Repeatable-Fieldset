# Validation Bridge Contract

## Status

The opt-in Validation Bridge is implemented at the explicit package subpath
`a11y-repeatable-fieldset/addons/validation-bridge`. It is dependency-free,
has no import-time DOM effects, is absent from the main runtime entry, and is
not enabled automatically. The package remains unpublished.

The bridge coordinates lifecycle only. It does not validate fields, render
messages, create an error summary, move focus after invalid submission, or
import a validation library.

## Public API

```ts
import { createRepeatableFieldset } from "a11y-repeatable-fieldset";
import {
  createValidationBridge,
  type ValidationBridgeItemContext
} from "a11y-repeatable-fieldset/addons/validation-bridge";

const validationAdapter = {
  registerItem({ item, phase }: ValidationBridgeItemContext) {
    return applicationValidator.registerGroup(item.element, { phase });
  }
};

createRepeatableFieldset(root, {
  addons: [
    createValidationBridge({
      id: "application.validation",
      registerItem: validationAdapter.registerItem
    })
  ]
});
```

`applicationValidator.registerGroup()` above is an application façade, not a
method supplied by the repeatable-fieldset package or by every validator.

The subpath exports:

- `createValidationBridge(options)`
- `ValidationBridgeOptions`
- `ValidationBridgeItemContext`
- `ValidationBridgeRegisterItem`

`id` must be a trimmed, non-empty addon ID. The core rejects duplicate IDs in
one repeatable-fieldset instance before registration starts.

`registerItem(context)` runs synchronously once for each item lifecycle. It
receives a frozen context with:

- the public repeatable-fieldset `instance`
- the owning `root`
- a frozen structural `item` snapshot
- `phase`, either `"existing"` or `"added"`

The callback returns `void` or one synchronous cleanup callback. The parent
instance owns that cleanup.

## Adapter ownership

The application adapter owns:

- validator registration for controls inside one item
- validator listeners, observers, timers, pending work, and descendant
  references created for that item
- generated inline validation messages
- validation-only ARIA it adds, including restoration of prior
  `aria-describedby`, `aria-errormessage`, and `aria-invalid` state
- error-summary entries and links for that item
- any validation-specific announcements

The adapter must not remove or rewrite author/server errors while registering
an existing item. It must preserve unrelated ID-reference tokens and must not
interpret the visible item position as stable identity.

Core continues to own Add/Remove focus recovery and the single structural
status region. The bridge creates no structural live region and dispatches no
core lifecycle event.

## Cleanup contract

The cleanup returned by `registerItem` must be idempotent and must not throw.
Before it returns, it must:

1. cancel item-scoped validation work
2. unregister every control in the item
3. remove generated inline errors owned by the adapter
4. restore author/server validation attributes and descriptions
5. remove error-summary entries or links that target the item
6. release references to the fieldset and its descendants

For successful removal, core runs this cleanup while the fieldset is still
attached. Core detaches the item only after every item cleanup succeeds.
Destroy runs cleanup for every current item but preserves the fieldsets and
their author-owned data.

If cleanup throws, core completes the remaining cleanup callbacks, keeps the
fieldset attached, returns an `addon-error` Remove result, and emits no
`item-removed` event. Because arbitrary external registration cannot be
reconstructed safely, the adapter is responsible for making cleanup
non-throwing and internally transactional.

## Failure behavior

- Invalid bridge factory options throw `TypeError` before an addon is created.
- If registration of an existing item throws, initialization rolls back prior
  completed registrations in reverse order and throws
  `RepeatableFieldsetError` with code `invalid-options` and the adapter error as
  its cause.
- If registration of a new item throws, Add removes the incomplete fieldset,
  keeps its key reserved, returns `addon-error`, and emits no success event or
  success announcement.
- A callback that mutates external state and then throws before returning a
  cleanup must roll back that partial mutation itself.

## Interaction state matrix

The bridge is a lifecycle helper, so it adds no visual class or keyboard
pattern of its own.

| State | Trigger / entry condition | Visual UI | DOM / semantic state | Keyboard and focus | Likely screen-reader behavior | Event | Test evidence | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Uninitialized | Bridge imported but no root initialized | No change | No DOM read or mutation | No change | No change | None | Import/bundle isolation | Accidental side effect |
| Existing registration | Successful component initialization | Author/server errors stay visible | Adapter registers item with `phase: "existing"`; author relationships remain | No bridge focus | Existing errors remain exposed according to application markup | Only core `init` after all setup | Existing registration and server-error preservation | Destructive rescan |
| Added registration | New fieldset is inserted and registered | Validator may later render validation UI | Adapter registers item with `phase: "added"` before core stabilization | Core alone handles Add focus | No structural message from bridge | Core `item-added` only after setup succeeds | Added registration exactly once | Duplicate registration |
| Duplicate initialization | Factory called again for an active root | No duplicate UI | Existing instance is reused | No change | No duplicate announcement | No second `init` | Duplicate-init test | Duplicate listeners |
| Setup failure | Adapter throws during registration | No incomplete item remains | Parent rolls back completed cleanup; server DOM remains usable | No focus competition | No success announcement | No success event | Initialization and Add rollback tests | Partial external setup |
| Removal cleanup | Remove is allowed | Target validation errors and summary links disappear before detach | Adapter unregisters controls and releases references while attached | Core alone recovers focus | Structural announcement remains the core message; application may update validation output | `item-removed` observes detached, cleaned item | Cleanup-before-detach test | Stale summary links |
| Cleanup failure | Adapter cleanup throws | Item remains visible | Core aborts detachment after attempting remaining cleanup | Focus remains/restores through core failure handling | No removal success message | No `item-removed` | Removal-abort test | Partially cleaned external state |
| Destroyed | Core instance is destroyed | Author fieldsets and server errors remain | Every current item cleanup runs; generated adapter UI is removed by the adapter | No bridge focus | No delayed bridge output should occur | Core `destroy` is final | Destroy/re-init tests | Detached-reference retention |
| Reinitialized | Preserved root is initialized after destroy | Current author DOM is enhanced again | Current items register once for the new instance | Core rules apply | No duplicate bridge output | New instance emits one `init` | Re-init test | Old registration leak |

Manual browser and screen-reader verification is still required for the
integrated validator's invalid-submission focus, summary navigation, live
messages, and async validation behavior.

## Live validation and error-summary policy

The executable validation demo models one application policy; the bridge does
not impose it. Each registered item validates a control when focus leaves it,
then debounces input revalidation after that control has been validated or the
user has explicitly reviewed current validation errors.

- A new or changed inline error is the only polite live validation message.
- An identical invalid result reuses its current error node instead of
  producing a duplicate announcement.
- The error summary is synchronized after every validation pass but is not a
  live region and does not receive focus during blur or input validation.
- During an invalid explicit review, inline errors become non-live before the
  application focuses the summary, and the blur caused by that focus move does
  not restart live validation, so the focused summary owns that validation
  response.
- The demo cancels all native form submissions and does not simulate a
  successful submission response.
- Item cleanup removes blur/input listeners, cancels pending revalidation,
  restores initial validation attributes, removes generated errors and summary
  entries, and releases the item registration before core detaches it.

Applications may choose a different validation trigger or focus policy, but
must preserve the same structural-focus, announcement, server-error, and
cleanup ownership boundaries.

## A11y Form Validator integration boundary

[A11y Form Validator](https://github.com/vmitsaras/A11y-Form-Validator)
was reviewed at package version `1.0.19`, commit
`fcd61de18640e4ae1681be9e3b5e11ca5e57eb0d`, on 2026-08-03. Its public
instance API exposes whole-form `refresh()`, `clearErrors()`, `getErrors()`,
and `destroy()`. It does not currently expose the item-scoped
`registerGroup()` / cleanup contract shown above.

Calling `refresh()` can discover a newly inserted control, but it does not by
itself satisfy cleanup-before-detach. Calling whole-form `clearErrors()` during
item cleanup can also erase unrelated or server-provided errors. This package
therefore does not claim a direct zero-configuration A11y Form Validator
adapter and does not reach into its private state.

An application can use A11y Form Validator with this bridge only when its
application façade can guarantee item-scoped registration, target-only error
and summary cleanup before detachment, cancellation of pending work, and
reference release. A future upstream item-registration API could implement
that façade without changing the Validation Bridge contract.

## Limitations

- Hooks are synchronous in the MVP.
- The bridge cannot verify that an opaque external validator released every
  descendant reference; adapters need their own retention tests.
- Validation focus after submission belongs to the application and must not
  run during structural Add/Remove cleanup.
- Async rules must cancel or ignore stale results before cleanup completes.
- No automated DOM test proves screen-reader speech, focus scrolling, or
  third-party validator behavior in a real browser.
