# A11yRepeatableFieldset Implementation Tasks

## How to use this backlog

Tasks are ordered by dependency and are intended to be completed in small,
reviewable changes. Do not combine phases into a repository-wide rewrite.
Planning tasks record the provenance of this planning package and are complete
only when all nine planning and repository-constitution Markdown documents
pass cross-document verification.

The core runtime, test foundation, static documentation shell, copied Pages
assets, executable demo suite, and repository-subpath simulation are
implemented for version 1.0.0. Remaining evidence work includes broader manual browser,
assistive-technology, reflow, and visual-preference verification plus owner-run
Pages deployment checks.

All future work must obey `AGENTS.md`, the normative contract documents, and
the MVP exclusions. A task may update additional closely related files when
necessary for contract synchronization, but it must not silently absorb a
later task.

## Planning

### PLAN-001 — Inspect repository and related plugin conventions

- **Objective:** Establish repository maturity and reusable local package conventions.
- **Affected files:** Planning Markdown files only.
- **Dependencies:** None.
- **Implementation notes:** Record the initial `.gitignore`/MIT-license shell and compare mature sibling form plugins for ESM exports, `WeakMap`, frozen constants, docs metadata, Changesets, and Pages assets.
- **Accessibility considerations:** Prefer conventions that preserve semantic HTML and cleanup rather than copying unrelated widget behavior.
- **Tests required:** Verify observations against tracked files and sibling repositories.
- **Acceptance criteria:** Repository classification and adopted conventions are evidence-backed and do not claim runtime behavior.
- **Non-goals:** Copying sibling source or choosing behavior merely because another plugin uses it.

### PLAN-002 — Run Modern Web Guidance research

- **Objective:** Record current platform constraints for forms, focus, status, HTML, CSS, and motion.
- **Affected files:** `ROADMAP.md`, `MARKUP_AND_ACCESSIBILITY_CONTRACT.md`.
- **Dependencies:** `PLAN-001`.
- **Implementation notes:** Search and retrieve `forms`, `accessibility`, `html`, `css`, and `animate-element-entry-exit`; record uncovered areas honestly.
- **Accessibility considerations:** Separate general guidance from repeatable-fieldset-specific decisions requiring manual evidence.
- **Tests required:** Confirm every cited guide ID came from retrieved guidance and no unsupported quotation or claim was added.
- **Acceptance criteria:** Guide IDs, derived constraints, decisions, and research gaps are documented.
- **Non-goals:** Treating guidance as proof of assistive-technology interoperability.

### PLAN-003 — Finalize markup contract

- **Objective:** Define root, items, template, controls, status, ownership, and no-JavaScript behavior.
- **Affected files:** `MARKUP_AND_ACCESSIBILITY_CONTRACT.md`.
- **Dependencies:** `PLAN-001`, `PLAN-002`.
- **Implementation notes:** Require one owned items container, direct-child item fieldsets, one trusted template, hidden enhancement controls, and nearest-root ownership filtering.
- **Accessibility considerations:** Require real fieldsets, legends, buttons, labels, visible instructions, and working server-rendered submission.
- **Tests required:** Review the normative skeleton against every required and optional attribute.
- **Acceptance criteria:** An implementer can validate markup without inventing selectors or ownership rules.
- **Non-goals:** Runtime implementation, nested repeaters, or generated form schemas.

### PLAN-004 — Finalize identity and naming contract

- **Objective:** Lock stable keys, visible positions, token locations, and name preservation.
- **Affected files:** `MARKUP_AND_ACCESSIBILITY_CONTRACT.md`.
- **Dependencies:** `PLAN-003`.
- **Implementation notes:** Use `__A11Y_REPEATABLE_KEY__`, key grammar `^[A-Za-z0-9][A-Za-z0-9._:-]*$`, lifetime reservation, and documented attribute-only replacement.
- **Accessibility considerations:** Preserve label and ID-reference relationships and isolate radio names per item.
- **Tests required:** Walk through saved items, generated items, earlier-item removal, multiple ID references, radios, and file inputs.
- **Acceptance criteria:** Identity never depends on current position and names are never automatically renumbered.
- **Non-goals:** General templating, sanitizer behavior, or one mandatory backend naming syntax.

### PLAN-005 — Finalize focus and announcement contract

- **Objective:** Define deterministic focus and polite status behavior.
- **Affected files:** `MARKUP_AND_ACCESSIBILITY_CONTRACT.md`.
- **Dependencies:** `PLAN-003`, `PLAN-004`.
- **Implementation notes:** Lock Add and Remove focus fallback orders, user/API differences, one atomic status region, combined boundary messages, and timer cleanup.
- **Accessibility considerations:** Avoid positive `tabindex`, routine alerts, duplicate announcements, and focus on controls that will become disabled.
- **Tests required:** Trace every focus branch and announcement state, including minimum/maximum and destroy.
- **Acceptance criteria:** Focus and status behavior require no implementation-time policy decisions.
- **Non-goals:** Focus traps, structural motion, validation announcements, or universal AT guarantees.

### PLAN-006 — Finalize lifecycle-event contract

- **Objective:** Define the exact public event set, detail, flags, and order.
- **Affected files:** `LIFECYCLE_EVENTS.md`.
- **Dependencies:** `PLAN-003`, `PLAN-004`, `PLAN-005`.
- **Implementation notes:** Keep methods as commands and events as completed observations; the reviewed set is `init`, `item-added`, `item-duplicated`, `item-removed`, `item-restored`, `item-moved`, and `destroy`.
- **Accessibility considerations:** Events must follow focus and status stabilization and must not duplicate announcements.
- **Tests required:** Review dispatch matrices for initialization, control/API operations, blocked commands, rollback, and destroy.
- **Acceptance criteria:** Every event has one trigger, typed detail, exact order, and explicit exclusions.
- **Non-goals:** Cancelable before-events, generic change events, batches, reset, validation, or additional reorder events beyond the separately reviewed completed `item-moved` observation.

### PLAN-007 — Finalize addon contract

- **Objective:** Define opt-in addon setup, context, cleanup, packaging, and priority.
- **Affected files:** `ADDONS.md`.
- **Dependencies:** `PLAN-006`.
- **Implementation notes:** Use synchronous component/per-item hooks returning parent-owned cleanup; reject duplicate IDs; keep addon code out of the main entry.
- **Accessibility considerations:** Addons cannot bypass core limits, fake events, or duplicate status output.
- **Tests required:** Review setup, rollback, remove cleanup, destroy cleanup, and retention risks.
- **Acceptance criteria:** Addon lifecycle is complete without requiring any addon for core correctness.
- **Non-goals:** Implementing addons, async hooks, private method patching, or empty export placeholders.

### PLAN-008 — Finalize GitHub Pages architecture

- **Objective:** Define static publishing from `main` and `/docs`.
- **Affected files:** `GITHUB_PAGES_PLAN.md`.
- **Dependencies:** `PLAN-001`, `PLAN-002`.
- **Implementation notes:** Use flat HTML, copied stable assets, relative URLs, `.nojekyll`, subpath simulation, and synchronization checks.
- **Accessibility considerations:** Plan keyboard, reflow, forced-colors, reduced-motion, semantic, and screen-reader verification for docs.
- **Tests required:** Review every planned path and ensure no asset import escapes `/docs`.
- **Acceptance criteria:** Build, local verification, manual Pages settings, and post-deployment checks are explicit.
- **Non-goals:** Creating pages, changing repository settings, using an SPA, or deploying.

## Package foundation

### FOUND-001 — Create package scaffold

- **Objective:** Create the minimal TypeScript package directory and metadata skeleton.
- **Affected files:** `package.json`, `src/`, `test/`, `.changeset/`, `CHANGELOG.md`.
- **Dependencies:** `PLAN-003` through `PLAN-008`.
- **Implementation notes:** Use npm because no lockfile exists; add only planned dev tooling and no runtime dependencies.
- **Accessibility considerations:** Scaffolding must not add auto-initialization or markup-generating placeholders.
- **Tests required:** Inspect package tree and dependency sections.
- **Acceptance criteria:** The planned package shape exists without claiming runtime functionality.
- **Non-goals:** Core behavior, demos, publication, or Pages content.

### FOUND-002 — Configure strict TypeScript

- **Objective:** Establish strict, DOM-aware ES2022 type checking.
- **Affected files:** `tsconfig.json`.
- **Dependencies:** `FOUND-001`.
- **Implementation notes:** Use `target: ES2022`, `module: ESNext`, `moduleResolution: Bundler`, DOM libs, declarations, source maps, isolated modules, verbatim module syntax, `skipLibCheck`, and `noEmit`.
- **Accessibility considerations:** Export DOM-specific types precisely rather than using `any`.
- **Tests required:** Run the future `typecheck` script.
- **Acceptance criteria:** Strict type checking covers source, tests, and build/test configs.
- **Non-goals:** Relaxing strictness to accommodate incomplete APIs.

### FOUND-003 — Configure build and package exports

- **Objective:** Produce readable/minified ESM and declarations with explicit exports.
- **Affected files:** `package.json`, `tsdown.config.ts`, `tsdown.min.config.ts`.
- **Dependencies:** `FOUND-001`, `FOUND-002`.
- **Implementation notes:** Export `.`, `./min`, `./docs`, `./styles.css`, and `./package.json`; target ES2022; never emit CommonJS, UMD, IIFE, or globals.
- **Accessibility considerations:** Importing any entry must remain side-effect free.
- **Tests required:** Build and import every export; inspect source maps and declarations.
- **Acceptance criteria:** `dist/index.js`, `index.min.js`, declarations, docs output, and CSS export paths are coherent.
- **Non-goals:** CDN globals, auto-init bundles, publishing, or runtime dependencies.

### FOUND-004 — Configure tests

- **Objective:** Set up Vitest with jsdom for DOM contract tests.
- **Affected files:** `vitest.config.ts`, `package.json`, initial test helpers.
- **Dependencies:** `FOUND-001`, `FOUND-002`.
- **Implementation notes:** Use deterministic cleanup between tests and owner-document DOM constructors where cross-realm behavior matters.
- **Accessibility considerations:** Treat jsdom as structural evidence only; mark layout, autofill, focus scrolling, and AT speech for manual testing.
- **Tests required:** Run one scaffold test and verify isolation.
- **Acceptance criteria:** Tests can create templates, fieldsets, focusable controls, and CustomEvents reliably.
- **Non-goals:** Claiming browser or screen-reader parity.

### FOUND-005 — Add docs metadata contract

- **Objective:** Define structured metadata for central documentation aggregation.
- **Affected files:** `src/docs.ts`, package `./docs` export.
- **Dependencies:** `FOUND-003`.
- **Implementation notes:** Export `PluginDocs` and named `docs` with planned identity, API, selectors, keyboard, accessibility, limitations, and examples; mark unpublished status until release.
- **Accessibility considerations:** Metadata must describe focus, keyboard, status, and limitations accurately.
- **Tests required:** Typecheck, import the docs subpath, and compare names with README/contracts.
- **Acceptance criteria:** Metadata is structured and does not scrape or contradict README prose.
- **Non-goals:** Publishing installation claims or creating central-site code.

### FOUND-006 — Add optional CSS package export

- **Objective:** Wire minimal optional CSS into build and package metadata.
- **Affected files:** `src/styles.css`, build copy script/config, `package.json`.
- **Dependencies:** `FOUND-003`.
- **Implementation notes:** Copy CSS to `dist/styles.css`, export `./styles.css`, and mark CSS as the only side effect.
- **Accessibility considerations:** Core behavior must remain usable without CSS; CSS must provide visible focus and non-color states.
- **Tests required:** Build, package dry run, and stylesheet export/import verification.
- **Acceptance criteria:** CSS is optional, present in the package, and not imported by runtime JavaScript.
- **Non-goals:** A design system, CSS-driven behavior, or structural animation.

## Core runtime

### CORE-001 — Define frozen constants and defaults

- **Objective:** Centralize component name, selectors, attributes, classes, token, defaults, and events.
- **Affected files:** `src/index.ts` or focused core modules.
- **Dependencies:** `FOUND-002`, `FOUND-003`.
- **Implementation notes:** Export only documented public constants; freeze nested defaults and avoid repeated strings.
- **Accessibility considerations:** Selectors use data attributes while styling uses BEM classes.
- **Tests required:** Assert exact values, freezing, and immutability.
- **Acceptance criteria:** Runtime code imports constants rather than duplicating contract strings.
- **Non-goals:** Implementing operations or exposing private normalized variables.

### CORE-002 — Normalize JavaScript and dataset options

- **Objective:** Produce validated immutable options with explicit precedence.
- **Affected files:** Core option/type/normalization modules.
- **Dependencies:** `CORE-001`.
- **Implementation notes:** JavaScript overrides datasets and defaults; parse integers and exact boolean strings; reject malformed supplied values; keep callbacks/addons JS-only.
- **Accessibility considerations:** Defaults enable user-triggered focus and announcements while allowing explicit opt-out.
- **Tests required:** Valid/invalid numbers, booleans, labels, min/max combinations, precedence, frozen defaults, and input immutability.
- **Acceptance criteria:** Every option has one normalized type and invalid input yields `invalid-options`.
- **Non-goals:** Coercing arbitrary truthy strings or supporting callback datasets.

### CORE-003 — Validate and discover owned markup

- **Objective:** Discover only markup owned by the current root and validate the normative structure.
- **Affected files:** Core discovery/error modules.
- **Dependencies:** `CORE-001`, `CORE-002`.
- **Implementation notes:** Filter by nearest root, require one items container/template/Add control, direct-child item fieldsets, meaningful legends, and one Remove button per item.
- **Accessibility considerations:** Reject fake controls, missing legends, duplicate IDs, and nonempty dedicated status regions.
- **Tests required:** Valid, missing, multiple, malformed, foreign, and nested-root fixtures.
- **Acceptance criteria:** Discovery returns a complete typed structure or throws a precise `RepeatableFieldsetError`.
- **Non-goals:** Repairing malformed markup or auditing unrelated descendant HTML.

### CORE-004 — Implement duplicate-instance protection

- **Objective:** Make construction, factory creation, and `init()` idempotent.
- **Affected files:** Main class and factories.
- **Dependencies:** `CORE-003`.
- **Implementation notes:** Use a static `WeakMap`; constructor/factory return the active instance; failed init removes registration; destroy enables a new instance.
- **Accessibility considerations:** Duplicate calls must not duplicate listeners, status regions, controls, focus changes, or events.
- **Tests required:** Constructor/factory/init duplication, failed rollback, destroy, and clean reinitialization.
- **Acceptance criteria:** One active root has one active instance and one initialization event.
- **Non-goals:** Automatic document scanning on import.

### CORE-005 — Register existing server-rendered items

- **Objective:** Preserve and register valid existing fieldsets in DOM order.
- **Affected files:** Core item registry and initialization.
- **Dependencies:** `CORE-003`, `CORE-004`.
- **Implementation notes:** Preserve values, IDs, names, hidden identifiers, errors, and server keys; assign only missing keys.
- **Accessibility considerations:** Existing label, legend, and ID-reference relationships must remain intact.
- **Tests required:** Saved values, server keys/names/errors, keyless items, zero-item minimum, and no item-added events.
- **Acceptance criteria:** Initialization does not recreate, clear, or rename existing items.
- **Non-goals:** Correcting server validation or normalizing server naming.

### CORE-006 — Generate stable item keys

- **Objective:** Allocate unique lifetime-stable keys for keyless and new items.
- **Affected files:** Core key allocator and public key types.
- **Dependencies:** `CORE-005`.
- **Implementation notes:** Default to monotonic `item-N`, reserve removed keys, support a validated JS key factory, and enforce the documented grammar.
- **Accessibility considerations:** Stable keys protect IDs, labels, descriptions, and radio grouping from position changes.
- **Tests required:** Existing collisions, removed-key non-reuse, custom factories, invalid/duplicate keys, and multiple instances.
- **Acceptance criteria:** Allocation is deterministic, unique per instance, and independent of current position.
- **Non-goals:** Globally unique database IDs or key persistence across page loads.

### CORE-007 — Materialize template tokens safely

- **Objective:** Clone the inert template and replace identity only in supported attributes.
- **Affected files:** Core template/token module.
- **Dependencies:** `CORE-003`, `CORE-006`.
- **Implementation notes:** Tokenize multi-ID values, support hash-only `href`, validate IDs/local references, and reject residual tokens before insertion.
- **Accessibility considerations:** Preserve labels, descriptions, controls, datalists, headers, and radio-group isolation.
- **Tests required:** Every supported attribute, mixed references, duplicate IDs, unresolved tokens, unrelated text, defaults, and file inputs.
- **Acceptance criteria:** A valid clone has unique identity and untouched unsupported content.
- **Non-goals:** `innerHTML` replacement, arbitrary data attributes, remote/untrusted HTML, or live-item cloning.

### CORE-008 — Synchronize visible positions

- **Objective:** Keep one-based display positions accurate without changing identity.
- **Affected files:** Core synchronization module.
- **Dependencies:** `CORE-005`, `CORE-007`.
- **Implementation notes:** Update all owned position markers per item and return fresh index/position snapshots.
- **Accessibility considerations:** Legends and Remove labels remain distinguishable while names and IDs stay stable.
- **Tests required:** Initialization, Add, earlier-item removal, multiple markers, and no-marker items.
- **Acceptance criteria:** Marker text matches DOM order after every structural change.
- **Non-goals:** Rewriting arbitrary legend text or renumbering names.

### CORE-009 — Implement Add command

- **Objective:** Add one valid template item using the locked operation order.
- **Affected files:** Main class, Add result/options types, interaction handler.
- **Dependencies:** `CORE-006`, `CORE-007`, `CORE-008`.
- **Implementation notes:** Distinguish control/API source, insert once, initialize item state, roll back addon failure, and return typed success/failure.
- **Accessibility considerations:** Never copy live values; leave file inputs empty; defer focus/status to accessibility modules.
- **Tests required:** Success, insertion, defaults, maximum, invalid key/template, rollback, control/API source, and single mutation.
- **Acceptance criteria:** Successful Add returns the created snapshot; blocked/failed Add leaves no partial item.
- **Non-goals:** Batch add, duplicate item, template switching, or automatic focus for API calls.

### CORE-010 — Implement Remove command

- **Objective:** Remove one owned item by snapshot, fieldset, or key.
- **Affected files:** Main class, Remove result/options/target types, interaction handler.
- **Dependencies:** `CORE-005`, `CORE-008`.
- **Implementation notes:** Resolve ownership, enforce minimum, capture the previous snapshot, run cleanup before detachment, and keep the key reserved.
- **Accessibility considerations:** Resolve focus before detaching; defer movement/status to accessibility modules.
- **Tests required:** Each target form, foreign/unknown targets, minimum, cleanup failure, DOM order, and API/control source.
- **Acceptance criteria:** Successful Remove detaches one item; failures preserve the fieldset and emit no success event.
- **Non-goals:** Confirmation, undo, soft delete, or returning removed values as serialized data.

### CORE-011 — Enforce minimum and maximum constraints

- **Objective:** Keep command availability and native button states synchronized.
- **Affected files:** Core constraint/synchronization logic.
- **Dependencies:** `CORE-002`, `CORE-009`, `CORE-010`.
- **Implementation notes:** Disable all Remove buttons at minimum and Add at maximum; avoid redundant `aria-disabled`.
- **Accessibility considerations:** Disabled state must have visible non-color presentation and focus resolution must predict post-operation state.
- **Tests required:** Minimum zero/one, finite/unbounded maximum, boundary transitions, blocked results, and disabled attributes.
- **Acceptance criteria:** DOM controls and `canAdd`/`canRemove` always agree.
- **Non-goals:** Hiding unavailable controls or disabling form submission.

### CORE-012 — Implement count and capability methods

- **Objective:** Expose immutable collection snapshots and capability queries.
- **Affected files:** Main class and public instance interface.
- **Dependencies:** `CORE-008`, `CORE-011`.
- **Implementation notes:** Return fresh readonly item arrays; expose count and active-state-aware capability booleans.
- **Accessibility considerations:** Consumers can present accurate limits without reading private DOM state.
- **Tests required:** Snapshot freshness, ordering, position, count, boundary states, and post-destroy behavior.
- **Acceptance criteria:** Callers cannot mutate the internal registry through returned arrays.
- **Non-goals:** Live observable collections or private registry access.

### CORE-013 — Implement safe destroy behavior

- **Objective:** Tear down behavior without discarding current form data.
- **Affected files:** Main class and cleanup utilities.
- **Dependencies:** `CORE-004`, `CORE-009`, `CORE-010`, `CORE-011`.
- **Implementation notes:** Make destroy idempotent; remove listeners/timers/generated status, restore author control/class state, keep fieldsets/keys/positions/values, and delete the `WeakMap` entry.
- **Accessibility considerations:** No delayed focus, status write, or event may occur after destroy; retained enhancement controls return to non-working hidden states.
- **Tests required:** Listener removal, generated/author status behavior, values, dynamic items, classes, keys, repeated destroy, and reinitialization.
- **Acceptance criteria:** Destroy emits once, preserves user data, and permits a clean new instance.
- **Non-goals:** Restoring the initial item structure or removing dynamically added fieldsets.

### CORE-014 — Implement transactional adjacent Move

- **Objective:** Reorder one currently owned item by one adjacent position through a public command.
- **Affected files:** Main instance, operation types, item registry, position/focus/status utilities, exports, and tests.
- **Dependencies:** `CORE-008`, `CORE-012`, `A11Y-003`, `EVENT-004`.
- **Implementation notes:** Accept snapshot/fieldset/key targets and `up`/`down`; keep DOM and registry order synchronized; preserve stable identity and addon registration; return typed boundary/technical results; roll every partial mutation back.
- **Accessibility considerations:** Preserve the same eligible active element inside the moved item, leave unrelated focus unchanged, and announce one completed position or boundary without disabling the active Move control.
- **Tests required:** Both directions/targets, stale snapshots, stable names/IDs/values, boundaries, focus, rollback, destroy, and immutable results.
- **Acceptance criteria:** Successful Move leaves DOM, registry, positions, snapshots, focus, status, and event detail stable; blocked/rolled-back Move emits no success event.
- **Non-goals:** Arbitrary indexes, drag and drop, batch reorder, key/name renumbering, or cancelable events.

### CORE-015 — Implement transactional template-first Duplicate

- **Objective:** Create one fresh-key item from the trusted template and finish approved state copying before insertion-time addon setup.
- **Affected files:** Main instance, operation/key/result types, item registry insertion, messages, events, exports, and tests.
- **Dependencies:** `CORE-009`, `ADDON-003`, `A11Y-003`, `EVENT-006`.
- **Implementation notes:** Resolve a current owned source; materialize while disconnected; run one synchronous constrained copier; reject structural/default mutation; insert immediately after the source; keep failed keys reserved; roll back addon failure.
- **Accessibility considerations:** Reuse Add focus order when requested, use native maximum state, produce one structural message, expose no copied values in event detail, and never read or assign file values.
- **Tests required:** Source forms, insertion, key source, copy-before-addon order, defaults, focus, maximum, structural/async copy rejection, rollback, and immutable results.
- **Acceptance criteria:** Copied current state exists before every new-item addon setup; blocked/failed Duplicate mutates no live structure and emits neither `item-added` nor `item-duplicated`.
- **Non-goals:** Live-item cloning, broad scans, asynchronous copying, file/error/validity copying, custom-control adapters, or batch duplication.

## Accessibility behavior

### A11Y-001 — Resolve focus after addition

- **Objective:** Implement the documented user-triggered Add focus order.
- **Affected files:** Core focus utility and Add integration.
- **Dependencies:** `CORE-009`.
- **Implementation notes:** Check explicit marker, labelable control, intentional fieldset fallback, then retain Add focus; API focus is opt-in.
- **Accessibility considerations:** Exclude disabled, hidden, and inert candidates; never add positive `tabindex` or make every fieldset tabbable.
- **Tests required:** Every fallback, invalid markers, hidden/disabled controls, API defaults, and explicit API focus.
- **Acceptance criteria:** User Add focus is deterministic and API Add does not steal focus by default.
- **Non-goals:** Scrolling animation or focus traps.

### A11Y-002 — Resolve focus after removal

- **Objective:** Recover focus safely when the active item is detached.
- **Affected files:** Core focus utility and Remove integration.
- **Dependencies:** `CORE-010`, `CORE-011`.
- **Implementation notes:** Resolve next Remove, previous Remove, Add, then intentional root fallback before cleanup/detachment; evaluate post-removal disabled state.
- **Accessibility considerations:** Programmatic removal leaves unrelated focus unchanged but cannot suppress recovery from a removed active subtree.
- **Tests required:** Next/previous/Add/root branches, minimum disabling, focus outside target, and forced handling.
- **Acceptance criteria:** Successful removal never strands focus in detached DOM.
- **Non-goals:** Choosing focus based on visual CSS order.

### A11Y-003 — Implement polite status announcements

- **Objective:** Reuse or create one managed polite, atomic status region.
- **Affected files:** Core status utility and operation integration.
- **Dependencies:** `CORE-009`, `CORE-010`, `CORE-013`.
- **Implementation notes:** Write one combined text update, replace stale text, manage one clear timer, and track generated ownership.
- **Accessibility considerations:** Use routine polite status, never alert; avoid duplicate component/addon announcements.
- **Tests required:** Author/generated regions, add/remove/boundary text, blocked API command, stale timer replacement, disabled announcements, and destroy.
- **Acceptance criteria:** At most one structural status update is produced per operation.
- **Non-goals:** Validation messages, visual toast systems, or batch announcements.

### A11Y-004 — Localize structural messages

- **Objective:** Provide frozen English defaults and typed JavaScript message formatters.
- **Affected files:** Option/message types and status formatting.
- **Dependencies:** `CORE-002`, `A11Y-003`.
- **Implementation notes:** Cover added, removed, moved, Move-boundary, maximum, and minimum messages with structural context for label, key, positions, direction, count, min, and max.
- **Accessibility considerations:** Messages describe completed state concisely and avoid leaking field values.
- **Tests required:** Defaults, overrides, empty/invalid formatter output policy, boundary combinations, and input context immutability.
- **Acceptance criteria:** Runtime strings are centralized and custom messages require no localization framework.
- **Non-goals:** Locale packs, pluralization library, or generated control labels.

### A11Y-005 — Verify fieldset and legend output

- **Objective:** Validate real screen-reader presentation of repeated semantic groups.
- **Affected files:** Manual test record and accessibility documentation.
- **Dependencies:** `CORE-008`, `A11Y-001`, `A11Y-002`.
- **Implementation notes:** Exercise server and generated items with current positions across target AT/browser combinations.
- **Accessibility considerations:** Confirm type plus position is understandable without redundant verbosity.
- **Tests required:** NVDA/Firefox, NVDA/Chrome, VoiceOver/Safari, and TalkBack/Chrome where practical.
- **Acceptance criteria:** Observed output and limitations are recorded by environment.
- **Non-goals:** Universal screen-reader conformance claims.

### A11Y-006 — Verify labels and ID references

- **Objective:** Prove supported label/description/reference relationships survive materialization and removal.
- **Affected files:** Automated tests and manual accessibility record.
- **Dependencies:** `CORE-007`.
- **Implementation notes:** Cover explicit labels, multiple ARIA IDs, controls, datalists, headers, and external references.
- **Accessibility considerations:** Inspect the browser accessibility tree where automated attributes are insufficient.
- **Tests required:** DOM assertions plus keyboard/AT label and description checks.
- **Acceptance criteria:** Tokenized local references resolve and unrelated external references remain intact.
- **Non-goals:** Auditing unsupported arbitrary attributes.

## Lifecycle events and addon infrastructure

### EVENT-001 — Export frozen lifecycle-event constants

- **Objective:** Implement the exact seven reviewed public event constants.
- **Affected files:** Core constants and main exports.
- **Dependencies:** `CORE-001`, `PLAN-006`.
- **Implementation notes:** Export `EVENTS` with exact documented keys/strings and import it everywhere.
- **Accessibility considerations:** Do not add announcement or validation events that duplicate responsibilities.
- **Tests required:** Exact object equality, `Object.isFrozen`, and no repeated literal strings in runtime modules.
- **Acceptance criteria:** Runtime exposes only the seven documented lifecycle constants.
- **Non-goals:** Private internal signals or cancelable before-events.

### EVENT-002 — Export typed event detail

- **Objective:** Provide base/detail/map/CustomEvent types for all events.
- **Affected files:** Core public types and main exports.
- **Dependencies:** `EVENT-001`, `CORE-012`.
- **Implementation notes:** Use readonly snapshots, normalized source values, nullable trigger/focus targets, and no private state.
- **Accessibility considerations:** Detail reports focus/status-stabilized state and does not contain user field values.
- **Tests required:** Type assertions and runtime detail-shape tests.
- **Acceptance criteria:** Consumers can infer detail from an `EVENTS` key without casts to untyped records.
- **Non-goals:** Serializing DOM items or exposing mutable registries.

### ADDON-001 — Define addon interfaces

- **Objective:** Export synchronous addon, context, item-context, and cleanup types.
- **Affected files:** Core addon types and main exports.
- **Dependencies:** `EVENT-002`, `PLAN-007`.
- **Implementation notes:** Require unique IDs and public-only context; allow setup hooks to return cleanup.
- **Accessibility considerations:** Context cannot bypass limits or generate core announcements.
- **Tests required:** Type tests for valid/invalid addons and context subscriptions.
- **Acceptance criteria:** Addons can integrate without private APIs.
- **Non-goals:** Implemented addons, async hooks, or dependency injection containers.

### ADDON-002 — Implement parent-owned cleanup

- **Objective:** Register and execute component-level cleanup deterministically.
- **Affected files:** Core addon manager and initialization/destroy integration.
- **Dependencies:** `ADDON-001`, `CORE-013`.
- **Implementation notes:** Run setup in registration order and cleanup in reverse; rollback partial initialization and reject duplicate IDs.
- **Accessibility considerations:** Cleanup removes addon listeners/status UI so reinitialization does not duplicate behavior.
- **Tests required:** Setup order, rollback, duplicate IDs, reverse cleanup, repeated destroy, and thrown cleanup.
- **Acceptance criteria:** Every registered component cleanup runs at most once.
- **Non-goals:** Silently swallowing addon failures without a typed cause.

### ADDON-003 — Implement per-item cleanup registry

- **Objective:** Own setup and cleanup separately for each item.
- **Affected files:** Addon manager, item registry, Add/Remove/Move/destroy integration.
- **Dependencies:** `ADDON-002`, `CORE-009`, `CORE-010`.
- **Implementation notes:** Mark existing/added phase, clean before detachment, roll back failed Add setup, and release item references after cleanup.
- **Accessibility considerations:** Validation and description integrations must unregister before controls leave the DOM.
- **Tests required:** Existing/add setup, reverse cleanup, remove abort, Add rollback, destroy order, and reference release.
- **Acceptance criteria:** Detached items are absent from parent addon registries.
- **Non-goals:** Preserving detached addon state for undo.

### EVENT-003 — Implement event ordering

- **Objective:** Dispatch lifecycle events at the locked operation boundaries.
- **Affected files:** Initialization, Add, Remove, Move, destroy, and dispatch helper.
- **Dependencies:** `EVENT-002`, `A11Y-001`, `A11Y-002`, `A11Y-003`, `ADDON-003`.
- **Implementation notes:** Use owner-document `CustomEvent`; dispatch after state/addons/focus/status and never after destroy.
- **Accessibility considerations:** Observers must see final focus and live-region text, not intermediate state.
- **Tests required:** Sequence spies around DOM insertion/removal, addon hooks, focus, status, and events.
- **Acceptance criteria:** Each successful lifecycle boundary dispatches exactly once in documented order.
- **Non-goals:** Awaiting actual screen-reader speech before event dispatch.

### EVENT-004 — Test event target, bubbling, and detail

- **Objective:** Lock the complete event contract with behavioral tests.
- **Affected files:** Event test suite.
- **Dependencies:** `EVENT-003`.
- **Implementation notes:** Cover root target, bubbles, non-composed, non-cancelable, realm, detail, source, blocked operations, and destroy.
- **Accessibility considerations:** Verify existing discovery and rollback do not produce misleading success events.
- **Tests required:** Every dispatch matrix in `LIFECYCLE_EVENTS.md`.
- **Acceptance criteria:** Runtime tests and event documentation agree exactly.
- **Non-goals:** Testing speculative events.

### EVENT-005 — Review and implement completed item Move observation

- **Objective:** Add one narrow non-cancelable event only after the transactional Move contract is stable.
- **Affected files:** Event constants/types/dispatch, `LIFECYCLE_EVENTS.md`, README, docs metadata, inspector, and tests.
- **Dependencies:** `CORE-014`, `EVENT-004`.
- **Implementation notes:** Export `itemMoved`; report stable key, prior/current index and position, direction, count, current snapshot, and nullable preserved focus target after all state stabilizes.
- **Accessibility considerations:** The event observes completed work and contains no values; boundary or rollback emits nothing and addons must not duplicate it.
- **Tests required:** Exact constant/flags/realm/detail/order, addon-triggered public Move, boundary/rollback/destroy suppression, and inspector redaction.
- **Acceptance criteria:** The fifth event is synchronized across runtime, declarations, contracts, demos, and package metadata without adding before/request/generic reorder events.
- **Non-goals:** Cancellation, trigger/source inference, arbitrary reorder, batch events, or addon-private payload.

### EVENT-006 — Review and implement completed item Duplicate observation

- **Objective:** Add one narrow non-cancelable event for template-first duplication without misclassifying it as ordinary Add.
- **Affected files:** Event constants/types/dispatch, lifecycle contract, README, docs metadata, inspector, and tests.
- **Dependencies:** `CORE-015`, `EVENT-004`.
- **Implementation notes:** Export `itemDuplicated`; report new/source identity and positions, count, current snapshot, and nullable focus target after all state stabilizes; never include copied values.
- **Accessibility considerations:** The event observes completed work, creates no second announcement, and is absent for maximum, copy failure, addon rollback, and destroy.
- **Tests required:** Exact constant/flags/realm/detail/order, absence of `item-added`, addon-triggered command, blocked/rollback/destroy suppression, and inspector redaction.
- **Acceptance criteria:** The sixth event is synchronized across runtime, declarations, contracts, demos, and package metadata as an additive minor contract.
- **Non-goals:** Cancellation, before/request events, copy-policy payloads, generic change/count events, or batch duplication.

### ADDON-004 — Document addon packaging

- **Objective:** Synchronize types, restrictions, priorities, and future subpath rules.
- **Affected files:** `ADDONS.md`, README, docs metadata, future Pages addon page.
- **Dependencies:** `ADDON-001`, `ADDON-003`.
- **Implementation notes:** Add subpaths only for real tested addons and keep them out of the main entry.
- **Accessibility considerations:** State clearly that core accessibility requires no addon.
- **Tests required:** Documentation/API comparison and package-export checks when an addon exists.
- **Acceptance criteria:** Documentation contains no placeholder import path for an unimplemented addon.
- **Non-goals:** Committing future addon exports early.

### ADDON-005 — Create addon test harness

- **Objective:** Provide reusable spies/fixtures for addon lifecycle and cleanup.
- **Affected files:** Test helpers and addon tests.
- **Dependencies:** `ADDON-003`.
- **Implementation notes:** Track setup/cleanup order, listener counts, item phases, rollback, retained references, and duplicate initialization.
- **Accessibility considerations:** Include validation-unregister and duplicate-announcement sentinel scenarios.
- **Tests required:** The full required addon matrix in `ADDONS.md`.
- **Acceptance criteria:** Future addons can prove isolation and teardown without duplicating core tests.
- **Non-goals:** Shipping test helpers in the runtime package.

### ADDON-006 — Implement Validation Bridge

- **Objective:** Map existing, added, removed, destroyed, and reinitialized item lifecycles to an application-owned validator without adding a runtime dependency.
- **Affected files:** `src/addons/validation-bridge.ts`, explicit package/build export, tests, docs metadata, `VALIDATION_BRIDGE.md`, and the validation demo.
- **Dependencies:** `ADDON-003`, `ADDON-004`, `ADDON-005`, `TEST-008`.
- **Implementation notes:** Accept a synchronous item registration callback that returns cleanup; keep the concrete addon absent from the main entry; run cleanup before detachment through the parent addon manager.
- **Accessibility considerations:** Preserve server errors and existing ID references, leave Add/Remove and invalid-submission focus in their respective owners, remove target error-summary links before detach, and create no duplicate structural live region.
- **Tests required:** Existing/added registration, duplicate initialization, setup rollback, cleanup-before-detach, server-error preservation, summary-link cleanup, cleanup failure, destroy/re-init, package export, and bundle isolation.
- **Acceptance criteria:** Each item registers once per instance phase, cleanup completes while attached, failures use existing transactional outcomes, and importing core includes no Validation Bridge code.
- **Non-goals:** A validation engine, private A11y Form Validator integration, async hooks, or whole-form error clearing as item cleanup.

### ADDON-007 — Implement Legend Sync

- **Objective:** Append one deliberately selected committed value to each generic item legend without conflating identity, position, or structural announcements.
- **Affected files:** `src/addons/legend-sync.ts`, explicit package/build export, tests, docs metadata, `LEGEND_SYNC.md`, and the addon demo.
- **Dependencies:** `ADDON-003`, `ADDON-004`, `ADDON-005`, `TEST-008`.
- **Implementation notes:** Require exactly one owned source and dedicated direct-legend target per item; update on `change`; restore author target text during parent-owned cleanup; keep the addon absent from the main entry.
- **Accessibility considerations:** Preserve the generic label and position, create no live region or focus change, reject high-risk source types and autocomplete tokens, and document accessible-name churn and privacy limits.
- **Tests required:** Existing/added items, committed timing, empty values, selected-option labels, rollback, cleanup, destroy/re-init, nested-root exclusion, multiple roots, sensitive-source rejection, no duplicate structural message, package export, and bundle isolation.
- **Acceptance criteria:** Each item has one scoped listener, only the dedicated suffix changes, cleanup restores author text, structural output never contains the selected value, and automated/manual evidence boundaries are explicit.
- **Non-goals:** Per-keystroke updates, automatic privacy classification, truncating values, replacing generic legend content, or forcing screen-reader speech.

### ADDON-008 — Implement Remove Guard

- **Objective:** Route owned Remove-button requests through one opt-in guard while keeping lifecycle events observational and public API removal immediate.
- **Affected files:** Core addon request types/manager, control routing, `src/addons/remove-guard.ts`, explicit package/build export, tests, docs metadata, `REMOVE_GUARD.md`, and the addon demo.
- **Dependencies:** `ADDON-003`, `ADDON-004`, `ADDON-005`, `TEST-004`, `TEST-008`.
- **Implementation notes:** Permit one component-level `onRemoveRequest` owner; expose a frozen single-use approved command; preserve control source/trigger; revalidate ownership and minimum after async approval; coalesce repeated activation; ignore settlement after cleanup; keep the concrete addon absent from the main entry.
- **Accessibility considerations:** Application confirmation owns dialog labelling, focus, cancellation, and errors; core owns successful Remove focus/status; denial emits no structural message or lifecycle event; field inspection is explicit application policy and file values are never read.
- **Tests required:** Immediate policy, denial, sync/async approval, repeat activation, API bypass, stale ownership, changed minimum, destroy race, policy errors, single-owner rollback, event/focus/status behavior, package export, and bundle isolation.
- **Acceptance criteria:** No request bypasses constraints, no approved request operates twice, delayed work is inert after destroy, and core imports no concrete Remove Guard code.
- **Non-goals:** Cancelable lifecycle events, automatic dirty-state detection, built-in dialog UI, API-command interception, undo, or serialized snapshots.

### ADDON-009 — Implement Accessible Reorder

- **Objective:** Provide opt-in native adjacent Move controls without giving an addon structural ownership.
- **Affected files:** `src/addons/accessible-reorder.ts`, explicit package/build export, tests, docs metadata, `ACCESSIBLE_REORDER.md`, and the addon demo.
- **Dependencies:** `CORE-014`, `EVENT-005`, `ADDON-003`, `ADDON-004`, `ADDON-005`.
- **Implementation notes:** Require one empty owned controls target per item; create owner-document Move up/down buttons; delegate only to `instance.move()`; remove only addon-owned buttons/listeners during cleanup; keep the addon absent from the main entry.
- **Accessibility considerations:** Use visible native-button labels and natural keyboard operation; keep boundary buttons enabled to preserve focus and rely on one core polite boundary message; create no live region or event.
- **Tests required:** Existing/added items, both directions and boundaries, focus, stable identity, malformed targets and rollback, cleanup/destroy/re-init, owner realm/root isolation, package export, demo, and bundle isolation.
- **Acceptance criteria:** The addon never mutates DOM/registry order directly, duplicates core output, or changes keys/names/values; core performs every successful transaction.
- **Non-goals:** Drag and drop, arbitrary-index controls, disabled boundary buttons, roving tabindex, private registry access, or addon-specific reorder events.

### ADDON-010 — Implement Duplicate Item

- **Objective:** Add an opt-in native Duplicate button and explicit native-control copy allowlist while core owns every structural transaction.
- **Affected files:** `src/addons/duplicate-item.ts`, explicit package/build export, tests, docs metadata, `DUPLICATE_ITEM.md`, and the addon demo.
- **Dependencies:** `CORE-015`, `EVENT-006`, `ADDON-003`, `ADDON-004`, `ADDON-005`.
- **Implementation notes:** Require one empty controls target and unique copy slots; match source/template controls by slot; copy supported current state only; synchronize native disabled buttons through public capability/events; clean generated controls through parent scopes.
- **Accessibility considerations:** Use a visible native button and Add focus order; hard-reject hidden/file/password/credential/payment/disabled/readonly/custom controls; preserve template defaults; create no addon live region or event.
- **Tests required:** Complete control matrix, exclusions, missing/duplicate slots, copied-before-addon order, defaults/reset, validation/error exclusion, limits, focus, cleanup/reinit, owner realm, package export, demo, and bundle isolation.
- **Acceptance criteria:** No unmarked or unsupported state is copied, no live fieldset is cloned, core performs the transaction, and the main bundle contains no concrete addon implementation.
- **Non-goals:** Automatic field discovery, file/server/error/validity copying, credential/payment opt-ins, custom-control adapters, or asynchronous copying.

### EVENT-007 — Review and implement completed item restoration observation

- **Objective:** Add one narrow completed event for exact-key trusted-template restoration.
- **Affected files:** Runtime constants, event detail/map, tests, contracts, README, structured docs, and demos.
- **Dependencies:** `EVENT-004`, `CORE-010`, `ADDON-003`.
- **Implementation notes:** Detail contains prior/current structural coordinates and resolved focus only; no retained values, detached DOM, or addon state.
- **Accessibility considerations:** Dispatch only after addon setup, focus, and polite restored status text are stable.
- **Tests required:** Owner-realm flags/detail/order plus blocked, stale, conflict, malformed-template, and addon rollback absence.
- **Acceptance criteria:** `item-restored` is synchronized across runtime, declarations, docs, demos, and package metadata as an additive minor contract.
- **Non-goals:** Before-events, generic change/count events, persistence events, or reset events.

### ADDON-011 — Implement Undo Remove

- **Objective:** Offer one accessible, expiring Undo action for the latest committed removal.
- **Affected files:** Generic removal preparation/restoration boundary, `src/addons/undo-remove.ts`, tests, `UNDO_REMOVE.md`, README, structured docs, Pages demo/assets, package export, and changeset.
- **Dependencies:** `CORE-010`, `CORE-011`, `A11Y-001`, `A11Y-003`, `EVENT-007`, `ADDON-003`, `ADDON-004`, `ADDON-005`.
- **Implementation notes:** Core retains only reserved-key structural coordinates and restores from the trusted template. The addon retains one data-only snapshot from explicitly marked supported controls, replaces older snapshots, and drops data on expiry or destroy.
- **Accessibility considerations:** Use one native button, pause expiry while it is focused, request Add-style focus after restore, create no second live region, and announce removal/restoration once each through core.
- **Tests required:** Exact key/order, supported state, file-value non-access, unsafe markers, expiry/focus pause, replacement, maximum/conflict/stale data, rollback, Remove Guard composition, owner realm, cleanup, package isolation, demo assets.
- **Acceptance criteria:** The explicit subpath restores safe marked state transactionally without retaining detached fieldsets or reading/assigning file values.
- **Non-goals:** Persistent Form Memory, reset policy, unrestricted serialization, hidden/server/error/validity restoration, or multiple Undo history.

### ADDON-012 — Implement Form Memory Bridge

- **Objective:** Coordinate versioned repeatable structure with an application-owned A11yFormDraftPersistence 1.0.0 instance without adding a runtime dependency or restoring values inside the addon.
- **Affected files:** `src/addons/form-memory-bridge.ts`, tests, `FORM_MEMORY_BRIDGE.md`, README, structured docs, Pages demo/assets, package export, and changelog.
- **Dependencies:** `CORE-001`, `CORE-003`, `CORE-004`, `CORE-005`, `ADDON-003`, `ADDON-004`, `ADDON-005`, and all completed structural lifecycle events.
- **Implementation notes:** Expose a structurally compatible custom-control adapter plus an explicit two-phase initializer; accept the public core factory from the application to avoid a duplicate bundled registry; persist stable keys/order only; materialize missing saved keys before core discovery; preserve current server items absent from the draft; coalesce committed structural events into an application save callback.
- **Accessibility considerations:** Require application-owned restore consent and clear UI; create no bridge UI, focus movement, event, timer, or duplicate structural announcement; leave validation refresh until structure and values stabilize; keep file values absolutely outside the contract.
- **Tests required:** Exact adapter identity and shape, missing/invalid/duplicate/unknown-version records, trusted-template materialization, saved order, current-item preservation, maximum, identity/template failure, core-init rollback, quiet init, structural event coalescing, rejected saves, destroy/re-init, package export, bundle isolation, demo, Pages assets, and documentation synchronization.
- **Acceptance criteria:** The main entry and package dependencies remain unchanged, the addon bundle contains no second core factory, value restore runs only after structural initialization, no current fieldset is deleted, failures are transactional, and the application retains storage/privacy lifecycle ownership.
- **Non-goals:** A storage adapter, value serializer, restore-prompt UI, automatic initialization, file restore, server-item deletion, schema migration engine, cross-tab policy, submission recovery, or replacement of A11yFormDraftPersistence.

## CSS

### CSS-001 — Define BEM class contract

- **Objective:** Centralize minimal style classes without using them as JS selectors.
- **Affected files:** Core class constants, `src/styles.css`, README.
- **Dependencies:** `CORE-001`, `FOUND-006`.
- **Implementation notes:** Use `a11y-repeatable-fieldset`, `__items`, `__item`, `__legend`, `__controls`, `__add`, `__remove`, `__position`, `__limit`, `__status`, modifiers, and `is-*` states.
- **Accessibility considerations:** Data attributes drive behavior; classes only present layout and state.
- **Tests required:** Class contract snapshot and selector audit.
- **Acceptance criteria:** CSS and runtime class constants agree without behavioral class queries.
- **Non-goals:** Styling arbitrary author form controls globally.

### CSS-002 — Define public custom properties

- **Objective:** Expose stable component-prefixed theming hooks.
- **Affected files:** `src/styles.css`, README, docs metadata.
- **Dependencies:** `CSS-001`.
- **Implementation notes:** Define item gap/padding/border/radius, control gap, action color, muted text color, and focus-ring properties on the block.
- **Accessibility considerations:** Defaults meet perceivability needs and consumers are warned not to reduce required contrast.
- **Tests required:** Static prefix/scope audit and visual theme smoke test.
- **Acceptance criteria:** Every documented public property uses `--a11y-repeatable-fieldset-`.
- **Non-goals:** Global design tokens or a complete theme system.

### CSS-003 — Normalize private `--_` properties

- **Objective:** Keep derived CSS values private and component-scoped.
- **Affected files:** `src/styles.css`.
- **Dependencies:** `CSS-002`.
- **Implementation notes:** Map public tokens to `--_` normalized values inside the block; never define private values on `:root`.
- **Accessibility considerations:** Private normalization must not suppress user color/contrast modes.
- **Tests required:** Static scan for `--_` outside the block or in documentation.
- **Acceptance criteria:** Private properties are scoped, undocumented, and unnecessary for consumer customization.
- **Non-goals:** Exposing implementation variables as public API.

### CSS-004 — Add visible focus and state styles

- **Objective:** Provide readable spacing, item boundaries, controls, disabled states, and focus.
- **Affected files:** `src/styles.css`, demo-only CSS where needed.
- **Dependencies:** `CSS-001`, `CSS-002`, `CSS-003`.
- **Implementation notes:** Use logical properties, responsive wrapping, native controls, and `:focus-visible`.
- **Accessibility considerations:** Do not remove native outlines without a high-contrast replacement or rely on color alone.
- **Tests required:** Keyboard visual check, contrast review, zoom/reflow, and coarse-pointer sizing.
- **Acceptance criteria:** Optional CSS improves presentation without being necessary for function.
- **Non-goals:** Restyling the entire form or hiding unavailable instructions.

### CSS-005 — Add reduced-motion behavior

- **Objective:** Ensure any optional transition respects motion preferences.
- **Affected files:** `src/styles.css`.
- **Dependencies:** `CSS-004`.
- **Implementation notes:** Keep structural Add/Remove/Duplicate/Move static; limit any transition to subtle nonessential visual properties and disable/dampen it per component under reduced motion.
- **Accessibility considerations:** Do not use a global near-zero-duration reset.
- **Tests required:** Emulated reduced-motion comparison and static scan for unguarded animation/transition.
- **Acceptance criteria:** No required information or operation depends on motion.
- **Non-goals:** Exit animation, View Transitions, or JavaScript animation fallbacks.

### CSS-006 — Test forced-colors presentation

- **Objective:** Verify boundaries, focus, buttons, and disabled states in forced colors.
- **Affected files:** `src/styles.css`, manual test record.
- **Dependencies:** `CSS-004`.
- **Implementation notes:** Prefer borders/outlines and system colors; avoid unnecessary `forced-color-adjust: none`.
- **Accessibility considerations:** Item and control presence must remain perceivable without shadows or authored colors.
- **Tests required:** Windows forced-colors/high-contrast manual scenarios and screenshot notes.
- **Acceptance criteria:** Focus and disabled state remain distinguishable in forced colors.
- **Non-goals:** Preserving decorative brand colors.

## Accessibility verification and evidence

### A11Y-007 — Verify reduced motion and forced colors

- **Objective:** Confirm optional CSS remains perceivable under user display preferences.
- **Affected files:** `src/styles.css`, docs/demo styles, manual test record.
- **Dependencies:** `FOUND-006`, `CSS-004`, `CSS-005`, `CSS-006`.
- **Implementation notes:** Verify no structural motion, focus visibility, disabled states, borders, and wrapping.
- **Accessibility considerations:** Do not rely on shadows/background images or color alone for boundaries and state.
- **Tests required:** Reduced-motion emulation, Windows forced colors, high contrast, zoom, and reflow.
- **Acceptance criteria:** Controls and item boundaries remain operable and perceivable.
- **Non-goals:** Pixel-identical presentation across modes.

### A11Y-008 — Document limitations and manual test results

- **Objective:** Publish honest accessibility evidence and unresolved risks.
- **Affected files:** README, docs accessibility/limitations pages, docs metadata.
- **Dependencies:** `A11Y-005`, `A11Y-006`, `A11Y-007`.
- **Implementation notes:** Record environments, dates, scenarios, findings, fixes, and remaining limitations.
- **Accessibility considerations:** Use “designed to support” language and separate automated from manual evidence.
- **Tests required:** Cross-check claims against actual records and implemented behavior.
- **Acceptance criteria:** Documentation contains no unsupported WCAG or universal-AT claim.
- **Non-goals:** Certification or replacing testing with a score.

## Test suites

### TEST-001 — Initialization and duplicate-instance tests

- **Objective:** Verify valid initialization, ownership, rollback, and idempotency.
- **Affected files:** Initialization test suite.
- **Dependencies:** `CORE-004`, `CORE-005`.
- **Implementation notes:** Cover zero items when minimum is zero, server keys, malformed/multiple elements, nested roots, and clean reinitialization.
- **Accessibility considerations:** Prove no user-action item event or duplicate enhanced control appears during discovery.
- **Tests required:** All initialization cases listed in the planning brief.
- **Acceptance criteria:** Initialization either produces one ready instance or leaves author DOM unchanged with a typed error.
- **Non-goals:** Add/Remove interaction assertions owned by later suites.

### TEST-002 — Identity and token tests

- **Objective:** Exercise stable keys, IDs, names, and every supported token location.
- **Affected files:** Identity/template test suite.
- **Dependencies:** `CORE-006`, `CORE-007`, `CORE-008`.
- **Implementation notes:** Include multi-ID attributes, hash references, radios, datalists, headers, external IDs, key collisions, and removal stability.
- **Accessibility considerations:** Assert label/description/reference validity, not only string replacement.
- **Tests required:** Every identity case in the markup contract.
- **Acceptance criteria:** Generated identity is unique and later names remain unchanged after earlier removal.
- **Non-goals:** Unsupported attribute templating.

### TEST-003 — Add-operation tests

- **Objective:** Verify one-item Add behavior and typed outcomes.
- **Affected files:** Add test suite.
- **Dependencies:** `CORE-009`, `CORE-011`, `A11Y-001`, `A11Y-003`, `EVENT-003`.
- **Implementation notes:** Cover template defaults for text, textarea, select, checkbox, radio, and file controls.
- **Accessibility considerations:** Verify control-triggered focus, API no-focus default, one announcement, and one event.
- **Tests required:** Success, expected insertion, maximum, invalid template/key, addon rollback, and blocked silence.
- **Acceptance criteria:** Each successful Add yields one integrated item and each failure yields no partial mutation.
- **Non-goals:** Duplicate-item addon behavior.

### TEST-004 — Remove-operation tests

- **Objective:** Verify owned-item removal, minimum enforcement, cleanup, and typed outcomes.
- **Affected files:** Remove test suite.
- **Dependencies:** `CORE-010`, `CORE-011`, `A11Y-002`, `A11Y-003`, `EVENT-003`, `ADDON-003`.
- **Implementation notes:** Cover snapshot/fieldset/key targets, unknown/foreign items, key reservation, and cleanup order.
- **Accessibility considerations:** Exercise next, previous, Add, root, unrelated-focus, one-announcement, and one-event cases.
- **Tests required:** Every Remove case in the planning brief and markup contract.
- **Acceptance criteria:** Successful Remove stabilizes DOM/focus/state before its event; blocked Remove changes nothing.
- **Non-goals:** Confirmation or undo.

### TEST-005 — Focus tests

- **Objective:** Lock every Add and Remove focus branch independently.
- **Affected files:** Focus test suite.
- **Dependencies:** `A11Y-001`, `A11Y-002`.
- **Implementation notes:** Use programmatic focus and semantic hidden/disabled/inert filters; leave layout visibility for browser tests.
- **Accessibility considerations:** Confirm no positive `tabindex`, no forced fieldset tab stop, and no detached active element.
- **Tests required:** Complete focus decision tables for control/API operations.
- **Acceptance criteria:** Focus outcomes match the normative contract.
- **Non-goals:** Proving scroll position in jsdom.

### TEST-006 — Announcement tests

- **Objective:** Verify status-region ownership, text, timing, and cleanup.
- **Affected files:** Status test suite.
- **Dependencies:** `A11Y-003`, `A11Y-004`.
- **Implementation notes:** Use fake timers for stale clear/cancel behavior and test boundary-message combination.
- **Accessibility considerations:** Assert polite/atomic semantics, one region, no alert, and disabled-announcement behavior.
- **Tests required:** Add, Remove, min/max, blocked API command, author/generated status, repeated updates, and destroy.
- **Acceptance criteria:** One operation produces no more than one managed text update.
- **Non-goals:** Asserting actual screen-reader speech.

### TEST-007 — Lifecycle-event tests

- **Objective:** Enforce exact public event API and ordering.
- **Affected files:** Event test suite.
- **Dependencies:** `EVENT-004`.
- **Implementation notes:** Test constants, flags, owner-document realm, typed detail, source, sequence, single dispatch, and absence rules.
- **Accessibility considerations:** Confirm events observe finalized focus/status and existing items produce no Add event.
- **Tests required:** Every event dispatch matrix.
- **Acceptance criteria:** Runtime and `LIFECYCLE_EVENTS.md` agree.
- **Non-goals:** Private instrumentation events.

### TEST-008 — Addon cleanup tests

- **Objective:** Prove parent-owned cleanup and rollback.
- **Affected files:** Addon test suite and harness.
- **Dependencies:** `ADDON-005`.
- **Implementation notes:** Track component/item setup, reverse cleanup, auto-unsubscribe, failures, duplicate IDs, destroy, and reference release.
- **Accessibility considerations:** Include validation unregister-before-detach and duplicate-announcement guards.
- **Tests required:** Full addon matrix from `ADDONS.md`.
- **Acceptance criteria:** No detached item remains in parent registries and every cleanup runs at most once.
- **Non-goals:** Tests for unimplemented optional addons.

### TEST-009 — Destroy and reinitialization tests

- **Objective:** Verify non-destructive teardown and clean reuse of the root.
- **Affected files:** Destroy test suite.
- **Dependencies:** `CORE-013`, `A11Y-003`, `ADDON-003`, `EVENT-003`.
- **Implementation notes:** Cover author/generated status, listeners, timers, addons, classes, control state, keys, values, dynamic items, event finality, and repeated destroy.
- **Accessibility considerations:** Ensure no delayed announcement/focus and hidden non-working enhancement controls after teardown.
- **Tests required:** Every destroy case in the planning brief.
- **Acceptance criteria:** A new instance can initialize the preserved current structure without old behavior leaking.
- **Non-goals:** Restoring the original server structure.

### TEST-010 — Package and docs metadata tests

- **Objective:** Verify exports, build output, package contents, and structured docs contract.
- **Affected files:** Package/docs tests and package scripts.
- **Dependencies:** `FOUND-003`, `FOUND-005`, `FOUND-006`.
- **Implementation notes:** Import class/factories/types/docs metadata, inspect exports, build artifacts, CSS, and dry-run file list.
- **Accessibility considerations:** Metadata must expose keyboard/focus/status/limitations accurately and avoid unsupported claims.
- **Tests required:** Normal/min/docs/styles/package exports, declarations, side effects, docs fields, and pack dry run.
- **Acceptance criteria:** The published-shape simulation contains exactly the intended usable artifacts.
- **Non-goals:** Publishing the package.

## Documentation and Pages

### DOCS-001 — Create documentation information architecture

- **Objective:** Build the flat static page shell and consistent navigation.
- **Affected files:** `/docs/*.html`, `/docs/assets/docs.css`, docs metadata.
- **Dependencies:** `FOUND-005`, `GITHUB_PAGES_PLAN.md`.
- **Implementation notes:** Implement the exact page inventory with shared semantic shell patterns and relative URLs.
- **Accessibility considerations:** Include language, unique titles, headings, landmarks, skip links, visible focus, and responsive navigation.
- **Tests required:** Link/heading/landmark validation and keyboard navigation.
- **Acceptance criteria:** Every planned page exists and is reachable without a router.
- **Non-goals:** Writing every demo in the same task.

### DOCS-002 — Create basic progressive-enhancement demo

- **Objective:** Demonstrate one server-rendered item before and after initialization.
- **Affected files:** `docs/basic.html`, demo metadata/content.
- **Dependencies:** `DOCS-001`, `CORE-013`, `TEST-003`, `TEST-004`.
- **Implementation notes:** Use actual copied build output, hidden enhancement controls, normal form action/method, and realistic neutral content.
- **Accessibility considerations:** Preserve labels, legend, keyboard order, focus, status, and a meaningful no-JavaScript state.
- **Tests required:** JS on/off, keyboard, Add/Remove, submit payload inspection, and console checks.
- **Acceptance criteria:** The demo visibly explains progressive enhancement and uses no private API.
- **Non-goals:** Validation or persistence integration.

### DOCS-003 — Create server-rendered edit-form demo

- **Objective:** Demonstrate saved items with stable server identity and errors.
- **Affected files:** `docs/existing-items.html`.
- **Dependencies:** `DOCS-001`, `CORE-005`, `TEST-001`.
- **Implementation notes:** Include multiple saved keys, hidden IDs, values, names, descriptions, and server validation messages.
- **Accessibility considerations:** Initialization must preserve all associations and errors and emit no item-added event.
- **Tests required:** Before/after DOM comparison, submit names/values, keyboard, and event inspector check.
- **Acceptance criteria:** Existing identity and data remain unchanged through initialization.
- **Non-goals:** Implementing validation correction logic.

### DOCS-004 — Create limits demo

- **Objective:** Demonstrate minimum, maximum, disabled controls, and visible instructions.
- **Affected files:** `docs/limits.html`.
- **Dependencies:** `DOCS-001`, `CORE-011`, `A11Y-004`.
- **Implementation notes:** Show finite limits and a separate zero-minimum example only if the final UI remains clear.
- **Accessibility considerations:** State cannot rely on color; status and disabled behavior must not duplicate.
- **Tests required:** Boundary keyboard behavior, focus after reaching minimum, announcements, and reflow.
- **Acceptance criteria:** Users can understand limits before encountering disabled controls.
- **Non-goals:** Custom quota validation.

### DOCS-005 — Create field-type coverage demo

- **Objective:** Exercise all supported identity/reference and form-control categories.
- **Affected files:** `docs/complex-fields.html`.
- **Dependencies:** `DOCS-001`, `TEST-002`.
- **Implementation notes:** Include radio, checkbox, select, textarea, datalist, multiple ARIA IDs, table headers where appropriate, and file input.
- **Accessibility considerations:** Explain radio isolation and file-input limitations without using a table fieldset where semantics are inappropriate.
- **Tests required:** Relationships, submission, defaults, keyboard, and screen-reader labels/descriptions.
- **Acceptance criteria:** The demo proves supported token locations with realistic markup.
- **Non-goals:** Claiming support for arbitrary attributes or file restoration.

### DOCS-006 — Create lifecycle-event inspector

- **Objective:** Show the seven public events and stabilized detail safely.
- **Affected files:** `docs/event-inspector.html`, `docs/assets/event-inspector.js`.
- **Dependencies:** `DOCS-001`, `EVENT-004`.
- **Implementation notes:** Import `EVENTS`, redact form values, render text safely, and avoid retaining detached item DOM.
- **Accessibility considerations:** Inspector updates must not create a competing live region or steal focus.
- **Tests required:** Exact event set/order, keyboard use, safe text rendering, and cleanup.
- **Acceptance criteria:** The inspector demonstrates public API only and logs no blocked success event.
- **Non-goals:** Debug access to private state.

### DOCS-007 — Document stable keys and server naming

- **Objective:** Explain identity versus position and backend-controlled name shapes.
- **Affected files:** `docs/stable-keys.html`, README, docs metadata.
- **Dependencies:** `TEST-002`.
- **Implementation notes:** Show bracketed names as examples, preserved server names, monotonic generated keys, radio isolation, and no renumbering.
- **Accessibility considerations:** Connect stable identity to labels and ID references, not merely backend convenience.
- **Tests required:** Code-example contract check against selectors/token and submit payload examples.
- **Acceptance criteria:** No example treats visible position as persistent identity.
- **Non-goals:** Mandating a framework or server parser.

### DOCS-008 — Document addons and integrations

- **Objective:** Publish addon lifecycle, priorities, restrictions, and integration sequences.
- **Affected files:** `docs/addons.html`, `docs/validation-integration.html`, `docs/form-memory-integration.html`, README.
- **Dependencies:** `ADDON-004`.
- **Implementation notes:** Clearly label unimplemented addons and show public contracts without placeholder imports.
- **Accessibility considerations:** Emphasize unregister-before-detach, one announcer, data exclusions, and parent-owned cleanup.
- **Tests required:** Cross-check against `ADDONS.md` and package exports.
- **Acceptance criteria:** Documentation cannot be mistaken for an available addon API.
- **Non-goals:** Shipping addon code.

### DOCS-009 — Create `/docs` asset-copy process

- **Objective:** Copy fresh built runtime/CSS into stable Pages asset names.
- **Affected files:** Future copy script, package scripts, `/docs/assets`.
- **Dependencies:** `FOUND-003`, `FOUND-006`, `DOCS-001`.
- **Implementation notes:** Copy readable/minified ESM and CSS; keep docs-only assets separate; fail on missing build artifacts.
- **Accessibility considerations:** Demos must execute the same code and CSS evaluated for release.
- **Tests required:** Fresh copy, missing source, byte comparison, and no path escape.
- **Acceptance criteria:** `/docs` is self-contained and reproducible.
- **Non-goals:** Hashing, CDN upload, or deployment.

### DOCS-010 — Verify repository-subpath URLs

- **Objective:** Prove every docs URL works below the repository path.
- **Affected files:** Pages check script and all docs links/imports.
- **Dependencies:** `DOCS-009`.
- **Implementation notes:** Simulate `/A11y-Repeatable-Fieldset/` in a temporary directory and reject root-relative, escaped, missing, or case-mismatched URLs.
- **Accessibility considerations:** Direct-page navigation must preserve skip links, landmarks, and keyboard access.
- **Tests required:** Static link/import scan plus browser network/console verification.
- **Acceptance criteria:** Every page and asset loads through direct repository-subpath URLs.
- **Non-goals:** Custom-domain behavior.

### DOCS-011 — Add `.nojekyll`

- **Objective:** Ensure Pages serves committed static assets without Jekyll processing.
- **Affected files:** `docs/.nojekyll`.
- **Dependencies:** `DOCS-001`.
- **Implementation notes:** Add an empty tracked file and include it in synchronization checks.
- **Accessibility considerations:** None beyond ensuring assets required by accessible demos are served.
- **Tests required:** File-presence check in local and packaged docs output.
- **Acceptance criteria:** `.nojekyll` is present at `/docs` root.
- **Non-goals:** Jekyll configuration.

### DOCS-012 — Document GitHub Pages settings

- **Objective:** Give the owner exact manual configuration and verification steps.
- **Affected files:** `GITHUB_PAGES_PLAN.md`, future docs contributor guidance.
- **Dependencies:** `DOCS-009`, `DOCS-010`, `DOCS-011`.
- **Implementation notes:** Specify Settings → Pages → branch `main` → folder `/docs`, then direct-page, console, asset, accessibility, and version checks.
- **Accessibility considerations:** Deployment verification includes keyboard, reflow, forced colors, reduced motion, and AT scenarios.
- **Tests required:** Review instructions against current GitHub Pages UI when configuration is authorized.
- **Acceptance criteria:** An owner can configure Pages without an automated setting mutation.
- **Non-goals:** Changing settings or deploying on the owner's behalf.

## Release readiness

### RELEASE-001 — Run build

- **Objective:** Produce all planned distributable and docs build artifacts.
- **Affected files:** Generated `dist` and synchronized docs assets only.
- **Dependencies:** All implementation tasks required for the intended release.
- **Implementation notes:** Run the defined build script, not a release script; inspect readable/minified ESM, declarations, docs output, and CSS.
- **Accessibility considerations:** Build must not strip semantic behavior or import optional CSS automatically.
- **Tests required:** Successful command and artifact inventory.
- **Acceptance criteria:** Expected artifacts exist with no unexpected runtime dependency or format.
- **Non-goals:** Publishing, tagging, pushing, or deployment.

### RELEASE-002 — Run typecheck

- **Objective:** Verify strict public and internal TypeScript contracts.
- **Affected files:** None when successful.
- **Dependencies:** `RELEASE-001`.
- **Implementation notes:** Run the defined typecheck script and resolve errors without weakening strictness.
- **Accessibility considerations:** Typed DOM/event/addon contracts prevent ambiguous integration behavior.
- **Tests required:** Successful typecheck.
- **Acceptance criteria:** TypeScript exits successfully with the locked public API.
- **Non-goals:** Suppressing errors with broad casts or `any`.

### RELEASE-003 — Run tests

- **Objective:** Execute all unit, interaction, contract, and documentation tests.
- **Affected files:** None when successful, except intentional snapshots reviewed in scope.
- **Dependencies:** `RELEASE-002`, `TEST-001` through `TEST-010`.
- **Implementation notes:** Run Vitest once in deterministic CI mode and investigate every failure.
- **Accessibility considerations:** Automated passing results do not replace recorded manual checks.
- **Tests required:** Entire test suite.
- **Acceptance criteria:** All tests pass without skipped required cases.
- **Non-goals:** Claiming WCAG conformance from Vitest.

### RELEASE-004 — Run package dry run

- **Objective:** Inspect exactly what npm would package without publishing.
- **Affected files:** Temporary pack output/cache only.
- **Dependencies:** `RELEASE-001`, `RELEASE-002`, `RELEASE-003`.
- **Implementation notes:** Run the defined dry-run script and verify readable/minified runtime, types, docs metadata, CSS, README, changelog, and license.
- **Accessibility considerations:** Required CSS and docs metadata must not be accidentally omitted.
- **Tests required:** File-list and export import checks against dry-run contents.
- **Acceptance criteria:** Package includes only intended artifacts and has zero runtime dependencies.
- **Non-goals:** `npm publish` or Changesets publication.

### RELEASE-005 — Verify GitHub Pages output

- **Objective:** Validate committed static docs and copied assets before any owner deployment.
- **Affected files:** None when synchronized.
- **Dependencies:** `DOCS-012`, `RELEASE-001`, `RELEASE-003`.
- **Implementation notes:** Run Pages checks, subpath serving, direct navigation, console/network checks, and accessibility scenarios.
- **Accessibility considerations:** Record manual browser/AT outcomes separately from automated checks.
- **Tests required:** Full local and repository-subpath verification in `GITHUB_PAGES_PLAN.md`.
- **Acceptance criteria:** `/docs` is self-contained, synchronized, accessible, and free of missing URLs.
- **Non-goals:** Enabling Pages or changing repository settings.

### RELEASE-006 — Audit README, runtime, docs, and events for drift

- **Objective:** Perform the final cross-artifact release-readiness comparison.
- **Affected files:** Only stale artifacts identified by the audit.
- **Dependencies:** `RELEASE-004`, `RELEASE-005`, `A11Y-008`.
- **Implementation notes:** Compare names, exports, defaults, selectors, token, result reasons, errors, event strings/detail/order, addon availability, examples, versions, and limitations.
- **Accessibility considerations:** Remove unsupported claims and ensure focus/status/manual-test evidence matches runtime.
- **Tests required:** Contract synchronization tests plus focused human review.
- **Acceptance criteria:** No known drift remains and outstanding limitations are explicit.
- **Non-goals:** Automatic publish, push, tag, release, or Pages configuration.
