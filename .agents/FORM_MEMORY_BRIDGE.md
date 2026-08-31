# Form Memory Bridge contract

Status: implemented as the optional
`a11y-repeatable-fieldset/addons/form-memory-bridge` subpath.

The bridge coordinates repeatable structure with
[`a11y-form-draft-persistence`](https://github.com/vmitsaras/A11y-Form-Draft-Persistence)
without making that package a runtime dependency. It persists stable item keys
and their order only. The application-owned draft instance continues to own
storage, values, expiry, migration, restore consent, sensitive-field policy,
clearing, status UI, and submission recovery.

## Why initialization is explicit

Draft values can be restored only after their matching controls exist. Core
initialization cannot add missing fieldsets through normal `add()` calls
without producing user-operation events and announcements. The bridge
therefore exposes an explicit two-phase `initialize()` method:

1. validate an available, user-approved draft record
2. materialize missing saved keys from the trusted inert template
3. merge saved order with current server-rendered items
4. initialize core once so every resulting fieldset is discovered as existing
5. let the draft package restore native values into those live controls
6. resume application autosave and synchronize validation

The bridge never initializes on import. Calling `initialize()` is the explicit
enhancement action.

## Package and ownership boundary

The subpath exports `createFormMemoryBridge` and its supporting structural
types. It imports no storage package and is absent from the main runtime entry.
The returned object provides:

- a synchronous addon setup hook injected only by the bridge initializer
- a `draftControlAdapter` structurally compatible with
  `A11yFormDraftPersistence` 1.0.0
- an `initialize()` coordinator that runs before core discovery

The application must create and destroy its draft-persistence instance. The
bridge does not clear drafts, choose storage, render a restore prompt, or
destroy an application-owned persistence object.

The draft-persistence root must contain the repeatable-fieldset root. The
custom-control discovery API scans descendants rather than the persistence
root itself, so using the repeatable root as both roots would not discover the
bridge adapter.

## Structural record

The adapter ID is
`a11y-repeatable-fieldset.form-memory-bridge.v1`. The application supplies a
stable, non-empty `fieldKey` scoped to its form and draft key.

The custom value is JSON-safe and versioned:

```json
{
  "schemaVersion": 1,
  "itemKeys": ["contact-91", "item-3"]
}
```

The snapshot contains no field values, file values, labels, errors, focus,
status text, HTML, or detached DOM. Invalid versions, malformed keys, duplicate
keys, duplicate matching fields, and unexpected snapshot properties return
`{ ok: false, reason: "invalid-snapshot" }` without initializing or mutating
the items container.

## Conservative merge policy

An approved snapshot may reorder saved keyed items and add missing saved items
from the trusted template. It never deletes a current server-rendered or
author-provided item.

Current keyed items absent from the draft and current keyless items are
preserved after the saved-key sequence. Non-item direct children retain their
relative slots. This policy prevents an old client draft from silently
discarding newer server structure or user data.

If saved missing keys would exceed the normalized core maximum,
`initialize()` returns `maximum-exceeded` with `maximum` and `requiredCount`.
No partial structure is inserted. Template or identity failures return
`structure-error`. If later core initialization throws, the bridge restores
the exact original item-container children before rethrowing.

## Integration with A11yFormDraftPersistence 1.0.0

```ts
import {
  createDraftPersistence,
  type DraftPersistenceInstance
} from "a11y-form-draft-persistence";
import { createRepeatableFieldset } from "a11y-repeatable-fieldset";
import {
  createFormMemoryBridge,
  type FormMemoryDraftRecord
} from
  "a11y-repeatable-fieldset/addons/form-memory-bridge";

const form = document.querySelector<HTMLFormElement>("#application-form");
const root = form?.querySelector<HTMLElement>(
  "[data-a11y-repeatable-fieldset]"
);

if (form === null || root === null || root === undefined) {
  throw new Error("The application form markup is incomplete.");
}

let drafts: DraftPersistenceInstance | undefined;

const memory = createFormMemoryBridge({
  root,
  fieldKey: "application:contacts:structure",
  createInstance: createRepeatableFieldset,
  save() {
    return drafts?.save();
  },
  onSaveError(error) {
    applicationDiagnostics.report(error);
  }
});

drafts = createDraftPersistence(form, {
  autoSave: true,
  expiresAfter: 7 * 24 * 60 * 60 * 1000,
  formVersion: 1,
  key: "application:123:v1",
  restoreStrategy: "prompt",
  customControlAdapters: [memory.draftControlAdapter]
});

drafts.pause("repeatable-structure-setup");
const checked = await drafts.check();
let approvedRecord: FormMemoryDraftRecord | undefined;

if (
  checked.status === "available" &&
  await applicationRestorePrompt.confirm(checked.record.updatedAt)
) {
  approvedRecord = checked.record;
}

const initialized = memory.initialize({
  ...(approvedRecord === undefined ? {} : { record: approvedRecord }),
  repeatableFieldsetOptions: {
    minimum: 1,
    maximum: 8
  }
});

if (!initialized.ok) {
  drafts.resume("repeatable-structure-rejected");
  applicationDiagnostics.report(initialized);
  throw new Error("The saved repeatable structure could not be used.");
}

if (approvedRecord !== undefined) {
  await drafts.restore({ force: true });
}

drafts.resume("repeatable-structure-ready");
applicationValidation.refresh();
```

The example uses application façades for the restore decision, diagnostics,
and validation refresh. They are not exports from either package.

The generic `createDraftRestorePrompt()` addon in
`a11y-form-draft-persistence` 1.0.0 calls `restore()` directly. It cannot run
the required pre-initialization structural phase first. Applications that
persist repeatable structure must therefore own or wrap the restore-decision
UI and call `memory.initialize()` before `drafts.restore()`.

## Save behavior

The component addon observes only completed `item-added`, `item-duplicated`,
`item-removed`, `item-restored`, and `item-moved` events. It coalesces changes
within a microtask and calls the supplied `save()` after stable DOM, registry,
addon, focus, status, and event state.

The bridge adds no lifecycle event, structural announcement, focus movement,
timer, or UI. Queued work becomes inert during parent cleanup. A save already
accepted by the application-owned persistence API cannot be canceled because
that API exposes no abort signal; its completion is ignored after bridge
cleanup. Rejected or thrown saves may be observed through `onSaveError`.

## Privacy and security

The bridge itself reads only item key attributes. It never reads form-control
values. Native-field selection and exclusions are enforced by the draft
package and application configuration.

- Never persist file-input values; neither package supports doing so.
- Keep passwords, authentication secrets, payment details, and sensitive
  hidden values excluded unless a separate, high-risk application decision
  explicitly permits them.
- Use a bounded expiry and an accessible clear-saved-data action.
- Treat browser storage as readable by scripts in the same origin and as a
  shared-device disclosure risk.
- Scope draft and field keys to the application, form, user/session policy,
  and schema version.
- Do not infer complete privacy or WCAG conformance from automated tests.

## Failure and recovery

- A missing structural field is not an error. Core initializes current server
  markup and value restore can still handle controls that already exist.
- Corrupt structural data is fail-closed and leaves the unenhanced form usable.
- The application decides whether to clear or retain a corrupted,
  incompatible, expired, or over-maximum draft.
- Failed initialization restores original author children and relies on core
  transactional cleanup for listeners, controls, status UI, and addon state.
- Destroy never removes current fieldsets or destroys the draft instance.
- Reinitialization may reuse the same bridge after parent cleanup.
- A cross-tab structural update is observational while an instance is active;
  applying it requires an application-owned reload/reinitialization policy.
  The bridge does not mutate live structure from external storage events.

## Evidence boundary

Vitest/jsdom covers adapter compatibility, snapshot validation, trusted
template materialization, order merging, maximum handling, rollback, event
coalescing, cleanup, package isolation, and Pages integration. Real-browser
checks are still required for storage denial, autofill, page lifecycle,
cross-tab behavior, restore-decision usability, keyboard flow, screen-reader
output, zoom/reflow, and shared-device privacy copy.
