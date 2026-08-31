# Legend Sync Addon Contract

## Status

Legend Sync is implemented as an opt-in Priority 1 addon at the explicit
package subpath `a11y-repeatable-fieldset/addons/legend-sync`. It is
dependency-free, has no import-time DOM effects, is absent from the main
runtime entry, and is never enabled automatically. The package remains
unpublished.

Legend Sync appends one deliberately selected, committed control value to an
item's existing generic legend and visible position. It does not replace the
generic item label, replace the position marker, change stable identity, move
focus, create a live region, or dispatch a lifecycle event.

## Public API

```ts
import { createRepeatableFieldset } from "a11y-repeatable-fieldset";
import { createLegendSyncAddon } from
  "a11y-repeatable-fieldset/addons/legend-sync";

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

The subpath exports:

- `createLegendSyncAddon(options?)`
- `LegendSyncOptions`
- `LegendSyncUpdateEvent`

`createLegendSyncAddon()` returns a frozen addon with the fixed ID
`a11y-repeatable-fieldset.legend-sync`. One instance therefore accepts one
Legend Sync configuration. The core rejects a duplicate Legend Sync addon ID
before item setup begins.

The defaults match the API example. `updateOn` accepts only `"change"`; input
updates on every keystroke are intentionally excluded from this version.
Options are copied and normalized without mutating the caller's object.

## Marker contract

Every existing item and the inert template item must contain exactly one owned
source and one owned target for the configured selectors:

```html
<fieldset
  data-a11y-repeatable-fieldset-item
  data-a11y-repeatable-fieldset-key="server-42"
>
  <legend>
    Contact
    <span data-a11y-repeatable-fieldset-position>3</span><span
      data-a11y-repeatable-fieldset-legend-value
    ></span>
  </legend>

  <label for="contact-server-42-name">Name</label>
  <input
    id="contact-server-42-name"
    name="contacts[server-42][name]"
    autocomplete="name"
    data-a11y-repeatable-fieldset-legend-source
  >
</fieldset>
```

Ownership uses both the nearest repeatable-fieldset root and nearest item.
Markers belonging to another or nested root are ignored. Missing or duplicate
owned markers fail existing-item initialization transactionally. The same
problem in an added template item returns the core `addon-error` result and
rolls back insertion.

The target must be a dedicated text-only HTML element inside the item's
direct-child legend. It must stay outside the visible-position marker, remain
exposed, contain no child elements, and not be within `role="status"`,
`role="alert"`, or an active `aria-live` region. These rules prevent the addon
from replacing author legend structure or creating a second announcement
path.

The source must remain outside the legend and be one of:

- an `input` whose normalized type is `text`, `search`, `email`, `tel`, or
  `url`;
- a single-value `select`; or
- a `textarea`.

Hidden, inert, or `aria-hidden` sources are rejected. Password, hidden, file,
checkbox, radio, payment-card, one-time-code, and password-autocomplete
sources are rejected even when they carry the source marker. A single-select
uses the selected option's visible label when its submitted value is nonempty;
an empty submitted value enters the configured empty state.

## Text behavior

On setup, and then after each committed `change`, the addon:

1. reads only the configured source;
2. trims and collapses whitespace to one line;
3. uses `emptyText` when the result is empty; and
4. writes an additive suffix of ` — value`, or an empty string when both the
   source and `emptyText` are empty.

For example, a legend whose author content is `Contact 3` becomes
`Contact 3 — Maria`. The generic text and position remain separate DOM nodes.
The addon does not write the source value to a dataset, lifecycle event,
status message, or another item.

Long values are not truncated because silent truncation could make two items
indistinguishable or misrepresent author data. Authors must deliberately pick
a concise source and enforce an appropriate input length for their domain.

## Privacy and sensitive data

Putting a control value in a legend changes the fieldset's accessible name and
makes that value more prominent in visual and assistive-technology navigation.
The source marker is therefore an explicit data-selection decision, not a
generic selector convenience. Do not mark passwords, authentication codes,
payment values, government identifiers, health details, private notes, or any
field whose repetition in a legend would be surprising.

Email, telephone, URL, free-text, textarea, and select labels can still be
personal or sensitive even though their control types are supported. Built-in
exclusions are a backstop, not a privacy classification system. Applications
remain responsible for consent, disclosure, screenshots, shoulder-surfing,
support recordings, analytics, and retention policy.

## Focus, announcements, and events

Legend Sync installs no keyboard command and never moves focus. It creates no
live region and writes no core status text. Core remains the only owner of
structural Add and Remove announcements. Legend updates dispatch no public or
private lifecycle event.

Changing a legend can still change what a screen reader exposes as the
fieldset's accessible name. Whether that new name is spoken immediately while
focus remains inside the group varies by browser, screen reader, navigation
mode, and verbosity. The addon does not move focus or add live output to force
speech.

| User action | Visual result | Expected screen-reader information | Automated evidence | Remaining risk |
| --- | --- | --- | --- | --- |
| Initialize an existing value | `Contact 3 — Maria` is present before the core `init` event | The fieldset name includes generic label, position, and chosen value when next encountered | DOM order, text, and event ordering | Immediate speech varies and is not promised |
| Type without committing | Legend remains unchanged | Stable group name while editing | `input` does not update the target | Browser-specific commit behavior |
| Commit a nonempty change | Suffix changes once | Updated group name when the platform next exposes it | `change` updates only the dedicated target | Some AT may speak a name change immediately; others may not |
| Commit an empty change | Suffix clears or uses `emptyText` | Generic label and position remain available | Empty-state DOM tests | Blank versus fallback wording needs product review |
| Add an item | Core adds the item; addon prepares its suffix before the one core Add message | Structural message remains core-owned and contains no source value | One status region, one item event, no addon message | Focus speech and polite status timing need manual verification |
| Remove or destroy | Listener is removed and author target text is restored | No addon announcement | Cleanup and detached-listener tests | AT virtual-buffer refresh timing varies |

Likely WCAG relevance includes 1.3.1 Info and Relationships, 2.4.6 Headings
and Labels, and 4.1.2 Name, Role, Value. This mapping is not a conformance
claim.

## Cleanup and failure behavior

Each item listener and original target text belong to the parent-managed item
cleanup scope. Cleanup runs before successful detachment and during destroy,
is idempotent, removes the `change` listener, restores the original target
text, and releases item descendants. Initialization rollback restores every
target already synchronized by earlier item setup.

The addon creates no component-level registry, timer, observer, generated DOM,
or cross-item reference. Duplicate initialization reuses the active core
instance and does not add another listener.

## Evidence and limitations

Vitest/jsdom verifies marker ownership, existing and added items, committed
timing, empty states, selected-option labels, rollback, cleanup, multiple
roots, nested-root exclusion, sensitive-source rejection, bundle isolation,
and absence of duplicate live/status output. Those tests do not establish
screen-reader speech or virtual-buffer refresh behavior.

The Legend Sync scenarios in `MANUAL_ACCESSIBILITY_TEST_RECORD.md` remain
**Not run** as of 2026-08-03. Manual checks should cover at least VoiceOver +
Safari on macOS and NVDA + Firefox or Chrome on Windows before release, with
the exact observed result recorded rather than generalized.
