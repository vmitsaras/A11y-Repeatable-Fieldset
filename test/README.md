# Test suite

Vitest uses jsdom for structural DOM tests. The suite verifies fixture
construction, option and semantic discovery contracts, duplicate-instance
protection, and transactional registration of existing server-rendered items,
including preservation and missing-key rollback. Allocator tests cover
monotonic defaults, lifetime reservation, custom factory context and failure,
public key types, and per-instance isolation.

Template tests cover every supported token attribute, mixed external and local
references, labels, datalists, controls, table headers, radios, same-document
hashes, duplicate IDs, unresolved tokens, defaults, file inputs, unsupported
content preservation, and stale-template rejection.

Label-reference integration tests cover a live Add/Remove cycle for explicit
labels, multi-ID names and descriptions, controlled panels, datalists, table
headers, local-ID cleanup, and preservation of author-owned external
references.

Position tests cover initialization, simulated insertion, earlier removal,
multiple and absent markers, immutable index/position snapshots, nested-root
isolation, identity preservation, explicit rollback, and transactional
recovery from a marker-write failure.

Add tests cover clone/allocation/insertion order, immutable success snapshots,
template defaults, file inputs, monotonic keys, maximum blocking, typed
key/template failures, post-insertion rollback, owned control routing,
nested-root isolation, revealed synchronized controls, API focus stability,
destroy cleanup, and operation-option validation.

Add-focus tests cover explicit-marker priority, natural labelable-control
order, hidden/disabled/inert filtering, intentional fieldset fallback,
no-movement behavior, control opt-out, API opt-in/defaults, stale markers, and
absence of generated tab stops.

Remove tests cover snapshot/fieldset/key targets, stale stable-identity
snapshots, immutable pre-removal results, minimum blocking, unknown and
foreign targets, non-reused keys, stable names, position synchronization,
root-owned control routing, nested-root isolation, unrelated-focus stability,
transactional DOM/registry rollback, destroy cleanup, and option validation.

Remove-focus tests cover next/previous equivalent controls, post-minimum
disabling, Add and intentional-root fallbacks, unrelated API focus, forced API
handling, mandatory detached-focus recovery, ineligible-candidate fallthrough,
stable observer-visible state, no generated root tab stop, and focus
restoration after transactional rollback.

Move tests cover snapshot/fieldset/key targets, both adjacent directions,
stable keys/names/IDs/values, fresh immutable order snapshots, typed start/end
boundaries, focus preservation inside the moved item, unrelated-focus
stability, status/event ordering, rollback, and post-destroy inactivity.

Status tests cover generated and author-owned regions, polite/atomic semantics,
disabled announcements, combined Add/Remove boundary text, blocked API limits,
stale timer replacement, template-failure silence, initialization rollback,
destroy-time timer cancellation, author restoration, and clean
reinitialization.

Message tests cover the exported frozen English callbacks, all eight partial
overrides, frozen structural-only contexts, nullable blocked-boundary
identity, output trimming, combined boundaries, and per-concept fallback for
thrown, blank, or non-string formatter output. Option tests reject invalid
formatter containers, unknown keys, and non-function values.

Constraint tests cover minimum zero/one, finite and unbounded maximums, equal
boundaries, Add/Remove transitions, blocked results, native disabled
attributes, absence of generated `aria-disabled`, transactional control-write
rollback, and author/template control-state restoration during destroy.

Query tests cover fresh frozen arrays and item snapshots, non-live historical
views, ordering, zero-based index, one-based position, counts, finite and
unbounded capability boundaries, native-control agreement, blocked commands,
destroyed-instance values, and clean replacement-instance queries.

Destroy tests cover current-structure preservation, removed-item exclusion,
keys, names, IDs, positions, text/hidden/checkbox/textarea values, author and
template control restoration, author classes/status DOM, listener cleanup,
repeated calls, host-cleanup failure, detached roots, inert old instances, and
clean reinitialization.

`helpers/addon-harness.ts` provides runtime-excluded recording addons for
component/item phase, cleanup-order, subscription, rollback, and detached-item
retention tests. It is intentionally test-only and is not a package export.

Validation Bridge tests cover factory validation, frozen item contexts,
existing and added registration exactly once, duplicate initialization,
server-error preservation, setup rollback, error and summary-link cleanup
before detachment, cleanup failure, destroy, duplicate IDs, explicit package
export, and main-bundle isolation.

Legend Sync tests cover factory and marker validation, existing and added
items, committed `change` timing, empty states, selected-option labels,
parent-owned cleanup, destroy, nested-root exclusion, multiple-root isolation,
sensitive-source rejection, Add rollback, absence of duplicate structural
output, explicit package export, and main-bundle isolation.

Accessible Reorder tests cover owner-document native buttons, visible labels,
existing and added targets, both directions and boundaries, delegation to core
Move, focus retention, stable identity, initialization/Add rollback, cleanup,
the executable Pages demo, explicit package export, and main-bundle isolation.

Duplicate Item tests cover explicit current-state slots, supported native
control kinds, template defaults, file/credential/payment/error exclusions,
limits, focus, rollback, cleanup, package export, demo, and bundle isolation.

Undo Remove tests cover exact reserved-key trusted-template restoration,
explicit safe-state markers, absolute file-value exclusion, expiry and focused
button pausing, latest-snapshot replacement, malformed-data rollback,
Remove Guard composition, restoration readiness, owner realm, teardown,
package export, demo, and bundle isolation.

jsdom does not provide evidence for layout visibility, focus scrolling,
autofill, screen-reader speech, zoom/reflow, forced colors, or reduced motion.
Those behaviors require the manual browser and assistive-technology matrix in
`ROADMAP.md`.
