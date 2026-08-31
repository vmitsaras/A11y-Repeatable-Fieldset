# Remove Guard Contract

## Status

The opt-in Remove Guard is implemented at the explicit package subpath
`a11y-repeatable-fieldset/addons/remove-guard`. It is dependency-free, has no
import-time DOM effects, is absent from the main runtime entry, and is never
enabled automatically. The package remains unpublished.

The implementation adds one narrow core command-routing capability. An owned
Remove-button activation is a request when one addon registers
`context.onRemoveRequest()`. Completed lifecycle events remain non-cancelable
observations. Public `instance.remove()` calls remain immediate, already-approved
commands and do not pass through the guard.

## Public API

```ts
import { createRepeatableFieldset } from "a11y-repeatable-fieldset";
import {
  createRemoveGuard
} from "a11y-repeatable-fieldset/addons/remove-guard";

createRepeatableFieldset(root, {
  addons: [
    createRemoveGuard({
      shouldConfirm({ item }) {
        return Array.from(item.element.elements).some((control) =>
          control instanceof HTMLInputElement &&
          control.dataset.removeGuardMeaningful === "" &&
          control.value.trim() !== ""
        );
      },
      confirm({ item }) {
        return openApplicationConfirmationDialog(item.position);
      },
      onError(error) {
        applicationLogger.report(error);
      }
    })
  ]
});
```

The subpath exports:

- `createRemoveGuard(options)`
- `RemoveGuardOptions`
- `RemoveGuardContext`
- `RemoveGuardShouldConfirm`
- `RemoveGuardConfirm`
- `RemoveGuardErrorHandler`

The main entry exports the generic routing types:

- `RepeatableFieldsetRemoveRequest`
- `RepeatableFieldsetRemoveRequestHandler`
- `RepeatableFieldsetAddonContext.onRemoveRequest(handler)`

## Request and command boundary

The distinction is normative:

- Activating an owned enabled Remove button creates a control request.
- With no registered request owner, core approves and executes that request
  immediately, preserving existing behavior.
- `context.onRemoveRequest(handler)` registers the one request owner permitted
  for an instance. A second registration fails transactional initialization.
- The handler receives one frozen request with structural item metadata, the
  original Remove button, and a single-use `request.remove()` command.
- `request.remove()` preserves `source: "control"` and the original trigger,
  requests the normal control-driven focus behavior, and revalidates the active
  instance, item ownership, and current minimum when it is called.
- Repeated `request.remove()` calls return the first frozen command result and
  cannot produce a second operation.
- Public `instance.remove()` is an immediate approved API command. It bypasses
  the request owner and retains `source: "api"` and `trigger: null`.

This route is not a DOM event, before-event, cancelable lifecycle event, or
private-method patch. Remove Guard does not change the lifecycle-event set or
any event flags.

## Remove Guard policy

`shouldConfirm(context)` is synchronous and must return a boolean:

- `false` immediately calls the approved request command
- `true` invokes `confirm(context)`
- a throw or non-boolean result fails closed and leaves the item attached

`confirm(context)` may return a boolean or a promise-like boolean:

- `true` calls the approved request command
- `false` denies the request without changing structure, focus, status text, or
  lifecycle events
- rejection, a throw, or non-boolean resolution fails closed

`onError(error, context)` is optional diagnostic handling. It runs only while
the instance is active. A missing or throwing error handler never converts a
failed request into removal.

The addon never reads a control value, validity state, dirty flag, file, server
identifier, error, or autocomplete token. `shouldConfirm` owns that application
policy explicitly. Its context is structural but includes the normal item
fieldset so the application can inspect only deliberately selected state.

## Sensitive-state policy

Applications must use an allowlist rather than assuming every non-empty
control is meaningful or safe to inspect.

- Password, payment, authentication-code, security-answer, hidden record-ID,
  anti-CSRF, and file controls need explicit exclusion or application policy.
- File values must never be read, copied, serialized, restored, or assigned by
  this addon.
- A hidden server identifier must not by itself force confirmation unless the
  application deliberately defines that behavior.
- Validation errors and server messages are not user-entered values and should
  not be treated as dirty content automatically.
- Custom form controls require an application-owned adapter or explicit marker.

The package supplies no automatic dirty-form heuristic because a generic scan
would either miss meaningful domain state or inspect sensitive data without a
clear policy.

## Asynchronous confirmation and races

The addon tracks pending requests by item fieldset:

- repeated activation for the same item while confirmation is pending is
  coalesced and does not open another confirmation
- different items may have independent pending confirmations
- denial or settlement releases the pending marker
- destroy marks the addon inactive and clears its pending registry
- a promise that settles after destroy is ignored and cannot remove an item,
  dispatch an event, move focus, or write status text

Approval always revalidates current state:

- if another command already removed the target, the approved command resolves
  as `unowned-item` and makes no change
- if another command reduced the collection to the minimum, it resolves as
  `minimum`, leaves the item attached, and current native disabled states remain
  authoritative
- if the instance was destroyed, it resolves as `inactive` or is ignored by the
  cleaned guard
- addon cleanup failure still uses the existing `addon-error` Remove result and
  transactional core behavior

The confirming application owns its dialog focus, labelling, dismissal, and
error presentation. After approval, core owns the normal Remove focus recovery
and the one structural announcement. The guard creates no live region and
announces neither activation nor cancellation.

## Interaction state matrix

| State | Trigger | Structural result | Focus and announcement | Event |
| --- | --- | --- | --- | --- |
| No request owner | Remove-button activation | Core removes immediately | Existing control Remove behavior | One `item-removed` on success |
| Policy says no confirmation | `shouldConfirm` returns `false` | Guard immediately approves | Core owns focus and one status update | One `item-removed` on success |
| Confirmation pending | Promise-like confirmation | Item remains attached; repeated activation is coalesced | Application dialog owns temporary focus | None |
| Denied | Confirmation resolves `false` | No mutation | Application restores/retains suitable focus; core is silent | None |
| Approved and current | Confirmation resolves `true` | Core removes transactionally | Core focus recovery and one status update | One `item-removed`, `source: "control"` |
| Approved but stale | Target removed, minimum reached, or instance inactive | Typed core failure; no second mutation | No success message or event | None |
| Policy/confirmation failure | Throw, rejection, or invalid return | Fail closed | Optional application diagnostics only | None |
| Destroyed while pending | Parent cleanup runs | Delayed settlement is ignored | No delayed focus or status work | `destroy` remains final |

## Cleanup and retention

The parent owns the request-route subscription and invokes the guard cleanup
during initialization rollback or destroy. Cleanup is idempotent. The guard
stores only pending fieldset identities for the active instance and clears that
set during teardown.

JavaScript promises cannot be forcibly canceled. An application confirmation
promise and its reaction may retain their closure until settlement. Dialog
integrations should settle promptly, release their own DOM references, and
cancel external work where their API permits it.

## Required verification

Automated tests cover:

- factory option validation, freezing, and import-time isolation
- the single request-owner gate and transactional duplicate rejection
- request/context freezing and single-use approval
- immediate empty-state policy, denial, and synchronous approval
- asynchronous approval and repeated-activation coalescing
- API-command bypass
- stale ownership, changed minimum, and destroy-before-settlement races
- thrown/rejected/invalid policy output and fail-closed diagnostics
- preserved control source, trigger, focus, announcement, and lifecycle event
- proof that the addon itself does not read form values
- package export, separate build output, main-bundle absence, and Pages asset

Manual testing must cover the application confirmation UI with keyboard and
target assistive technologies. A native `window.confirm()` integration depends
on browser UI. A custom dialog must have an accessible name, predictable initial
focus, Escape/cancel behavior, explicit destructive wording, and reliable focus
return after denial. Automated DOM tests do not prove those outcomes.
