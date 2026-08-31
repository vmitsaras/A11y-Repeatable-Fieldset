# A11yRepeatableFieldset Roadmap

## Project status

A11yRepeatableFieldset has an implemented version 1.0.0 core runtime. Semantic
discovery, identity materialization, position synchronization, one-item Add,
Remove, Duplicate, and adjacent Move commands, native constraint-state synchronization, deterministic
Add/Remove/Duplicate/Move focus behavior, managed polite structural announcements, typed JavaScript
message localization with frozen English defaults, immutable
collection/capability queries, lifecycle events, addons, and non-destructive
core teardown are implemented. The structural test suites, static
documentation shell, copied Pages assets, executable demo suite, Validation
Bridge, Legend Sync, Remove Guard, Accessible Reorder, Duplicate Item, Undo
Remove, and Form Memory Bridge addons are
present. Automated and Chromium repository-subpath smoke checks are complete;
broader manual browser, assistive-technology, reflow, and visual-preference
evidence remains pending. The package name is
`a11y-repeatable-fieldset`. It is a framework-agnostic,
TypeScript-first, ESM-only progressive enhancement with no runtime
dependencies, optional minimal CSS, a Baseline 2024 browser target, and static
GitHub Pages documentation intended for `/docs` on `main`.

This roadmap does not authorize package publication, Git tags, pushes,
deployment, or repository-setting changes.

## Locked MVP boundaries

The MVP provides:

- discovery of server-rendered repeated fieldsets
- inert-template materialization
- stable keys distinct from visible positions
- safe token replacement in documented attributes
- Add, Remove, and Duplicate commands with minimum/maximum enforcement, plus
  adjacent Move
- deterministic focus and polite announcements
- seven typed lifecycle events
- parent-owned synchronous addon infrastructure
- optional minimal CSS
- package, behavioral, accessibility, and Pages verification

The MVP excludes:

- nested repeatable fieldsets
- drag-and-drop reordering
- asynchronous template fetching
- MutationObserver auto-initialization
- automatic validation
- autosave
- draft restoration
- built-in core undo; short-lived Undo is an explicit addon
- built-in or automatic confirmation dialogs; the opt-in Remove Guard accepts
  explicit application-owned confirmation
- multiple template types
- automatic or broad copying of item values; Duplicate Item copies only
  explicitly marked supported native-control current state
- field-schema generation
- framework adapters
- SPA documentation
- CMS integration
- automatic publishing
- automatic GitHub Pages configuration
- automatic renumbering of field names

These may be reconsidered only after the core has evidence from real forms.

## Modern Web Guidance research

| Guide ID | Constraint applied | Decision influenced |
| --- | --- | --- |
| `forms` | Use native forms, labels, names, `fieldset`/`legend`, and preserve submission without JavaScript. | Server-rendered fieldsets are discovered; controls and names remain usable before initialization. |
| `accessibility` | Prefer native controls, natural tab order, visible focus, deliberate focus moves, and restrained polite live regions. | Add/Remove are native buttons; focus follows deterministic fallback orders; routine changes use one polite status region. |
| `html` | Use `button[type="button"]`, native form APIs, natural DOM order, and listeners instead of inline handlers. | No simulated buttons, positive `tabindex`, inline handlers, or DOM/CSS order mismatch. |
| `css` | Provide `:focus-visible`, non-color state, forced-colors resilience, logical sizing, and reduced-motion handling. | Optional CSS stays minimal, BEM-scoped, and behavior-independent. |
| `animate-element-entry-exit` | Exit animation requires delaying removal and coordinating completion/fallback. | The MVP has no structural add/remove animation, keeping removal, focus, cleanup, and events synchronous. |

No directly relevant guide was found for tokenized template cloning, dynamic
structure on native form reset, or focus after removing the active fieldset.
The project contracts define those areas explicitly. Automated tests and
manual browser/assistive-technology evidence remain mandatory.

## Phase 0 — Contract and research

### Goal

Lock semantic HTML, identity, public API, event, addon, accessibility, and
publishing contracts before runtime implementation.

### Scope

Repository inspection, related-plugin convention review, Modern Web Guidance,
planning documents, task decomposition, risk identification, and MVP
exclusions.

### Tasks

- Inspect the repository and related form-plugin conventions.
- Record Modern Web Guidance guide IDs, constraints, and uncovered areas.
- Finalize markup, ownership, template, key, name, focus, announcement, event,
  addon, CSS, testing, and Pages contracts.
- Reconcile all nine planning and repository-constitution documents.

### Dependencies

None.

### Risks

- Planning documents may contradict one another.
- An apparently convenient API may compromise server identity or focus.
- Guidance may be overgeneralized beyond its evidence.

### Acceptance criteria

- All required planning Markdown files exist.
- Stable keys and visible positions are separate.
- Name renumbering and live-item cloning are explicitly prohibited.
- Public results, errors, events, focus order, and cleanup order are defined.
- Guide IDs and uncovered research areas are recorded accurately.
- No runtime, package, test, demo, or generated asset exists.

### Out of scope

Dependency installation, runtime code, build configuration, tests, demos,
Pages content, release actions, and repository-setting changes.

## Phase 1 — Package foundation

### Goal

Create a strict, buildable TypeScript package without implementing structural
behavior.

### Scope

Package metadata, TypeScript, tsdown, Vitest/jsdom, Changesets, docs metadata
shape, CSS export plumbing, and package scripts.

### Tasks

- Create `package.json`, strict `tsconfig.json`, readable and minified tsdown
  configurations, and `vitest.config.ts`.
- Add `src/index.ts`, `src/docs.ts`, and `src/styles.css` placeholders that
  expose only implemented foundation contracts.
- Configure ESM exports for `.`, `./min`, `./docs`, `./styles.css`, and
  `./package.json`.
- Add Changesets configuration and the minimal changelog.
- Configure build, typecheck, test, pack-check, and Pages scripts without
  running release commands.

### Dependencies

Phase 0 is complete.

### Risks

- Placeholder exports may imply unimplemented behavior.
- Build and Pages scripts may overwrite committed files unexpectedly.
- CSS side-effect metadata may disagree with the export.

### Acceptance criteria

- Target is ES2022 with ESM-only output and declarations.
- Normal and minified runtime artifacts are planned and build independently.
- Vitest uses jsdom for DOM behavior.
- Runtime dependency count is zero.
- Importing the package has no DOM side effects or auto-initialization.
- Package exports and dry-run expectations are testable.

### Out of scope

Functional initialization, Add/Remove behavior, addons, real demos, publishing,
and GitHub Pages configuration.

## Phase 2 — Semantic markup discovery

### Goal

Initialize against meaningful server-rendered markup without replacing it.

### Scope

Option normalization, root validation, owned-element discovery, existing-item
registration, transaction rollback, duplicate-instance protection, and
enhancement-control reveal.

### Tasks

- Normalize JavaScript options, datasets, and frozen defaults.
- Discover exactly one owned items container, template, and Add control.
- Discover only direct-child owned item fieldsets and their legends/Remove
  buttons.
- Validate required structure, IDs, status region, keys, and nested-root
  ownership.
- Preserve server data and assign only missing keys.
- Implement constructor-ready idempotent initialization and `WeakMap`
  protection.
- Roll back all partial setup on a typed initialization error.

### Dependencies

Phase 1 foundation and Phase 0 markup contract.

### Risks

- Broad selectors may capture nested or unrelated content.
- Initialization may mutate server errors or values.
- Rollback may leave a visible non-working control.

### Acceptance criteria

- Existing values, names, IDs, hidden identifiers, and errors survive.
- Nested-root descendants are excluded from parent discovery.
- Invalid markup throws a typed error and leaves author DOM operational.
- Duplicate creation returns the active instance without duplicate listeners.
- Existing discovery emits one `init` and no `item-added`.

### Out of scope

Adding, removing, reordering, validation, MutationObserver initialization, and
generating missing fieldsets or controls.

## Phase 3 — Item identity and token materialization

### Goal

Create safe new item candidates with stable identity and valid relationships.

### Scope

Key allocation, token replacement, ID/reference validation, template default
state, radio isolation, and visible-position synchronization.

### Tasks

- Reserve existing and generated keys for the instance lifetime.
- Implement monotonic `item-N` allocation and JavaScript key factories.
- Replace `__A11Y_REPEATABLE_KEY__` only in documented attributes.
- Parse multi-ID attributes without losing unrelated references.
- Validate generated IDs, local references, and residual tokens.
- Preserve template defaults while ensuring file inputs remain empty.
- Update only dedicated position markers.

### Dependencies

Phase 2 discovery and registry.

### Risks

- Backend naming conventions may not match examples.
- Tokenized IDs may collide with document IDs.
- Radio groups may leak across items.
- Multiple ID references may be corrupted.
- Browser autofill may interpret repeated fields unpredictably.

### Acceptance criteria

- Generated keys and IDs are unique.
- Labels and supported ARIA/HTML references resolve correctly.
- Radio groups are isolated by stable-key names.
- Existing names stay unchanged.
- Removing an earlier item cannot alter later names.
- Arbitrary text and unsupported attributes are untouched.

### Out of scope

General string templating, sanitization, remote templates, live-item cloning,
automatic name renumbering, schema generation, and autofill guarantees.

## Phase 4 — Add and Remove operations

### Goal

Implement predictable structural commands with typed outcomes.

### Scope

Public methods, delegated button handling, ownership resolution, minimum and
maximum enforcement, registry updates, position/control synchronization, and
rollback.

### Tasks

- Implement typed Add and Remove results and options.
- Add one delegated Add handler and one root-scoped Remove handler.
- Implement the locked add/remove operation order.
- Accept Remove targets by item snapshot, fieldset, or stable key.
- Keep removed keys reserved.
- Implement `getItems`, `getCount`, `canAdd`, and `canRemove`.
- Preserve dynamically added fieldsets during destroy.

### Dependencies

Phases 2 and 3.

### Risks

- Blocked commands may partially mutate DOM.
- Addon errors may leave inconsistent registration.
- Removing active controls before focus resolution may lose focus.
- Destroy may accidentally discard user-created data.

### Acceptance criteria

- A successful command performs one structural change.
- Blocked or failed commands perform none and emit no success event.
- Native disabled states match limits.
- Unknown or foreign removal targets are rejected.
- Ordinary Add never copies values from another live item; Duplicate copies
  only explicitly approved current native-control state into a disconnected
  trusted-template candidate.
- Destroy preserves every current fieldset and value.

### Out of scope

Batch operations, built-in core undo, arbitrary reorder, asynchronous operations, and
destructive reset.

## Phase 5 — Focus and announcements

### Goal

Make structural changes understandable and keyboard-safe.

### Scope

Add focus targets, removal recovery, API/control distinction, one polite status
region, configurable messages, boundary announcements, and timer cleanup.

### Tasks

- Resolve user-triggered Add focus in the documented order.
- Resolve post-removal focus before detachment and against post-limit state.
- Prevent API additions from stealing focus by default.
- Move API removal focus only when required or explicitly requested.
- Reuse or generate one polite atomic region.
- Format one message per operation and cancel stale work.
- Normalize a partial typed formatter map over frozen English defaults.
- Pass frozen structural-only context and fall back safely for invalid output.
- Document and test screen-reader timing limitations.

### Dependencies

Phase 4 commands and Phase 2 status discovery.

### Risks

- Focus may move to a control about to become disabled.
- Status speech may collide with newly focused control output.
- Multiple component instances may create noisy live regions.
- Timers may write after destroy.

### Acceptance criteria

- Focus never disappears when the active item is removed.
- Unrelated programmatic updates do not steal focus.
- One operation writes at most one structural announcement.
- Routine updates never use assertive announcements.
- Destroy cancels delayed status changes.
- Formatter context exposes no field values, and invalid formatter output
  cannot invalidate a completed structural command.

### Out of scope

Focus traps, scroll animation, structural entry/exit motion, batch
announcements, validation-error announcements, and universal AT claims.

## Phase 6 — Lifecycle events

### Goal

Implement the seven reviewed, typed observation events.

### Scope

Frozen constants, typed detail and map, owner-document dispatch, exact order,
single dispatch, and documentation synchronization.

### Tasks

- Export the frozen `EVENTS` object and detail/map/helper types.
- Dispatch from the root with locked flags.
- Populate immutable item snapshots and normalized source values.
- Enforce ordering after state, addons, focus, and status text.
- Prevent item events during discovery or blocked/rolled-back commands.
- Make destroy the final event.

### Dependencies

Phases 4 and 5, plus the lifecycle contract.

### Risks

- Runtime and documentation may drift.
- Detached item detail may encourage memory retention.
- Addons may incorrectly use events as commands.

### Acceptance criteria

- Only `init`, `item-added`, `item-duplicated`, `item-removed`,
  `item-restored`, `item-moved`, and `destroy` are public.
- Exact strings, flags, detail, and ordering pass tests.
- Programmatic and control sources are distinguishable.
- No event fires after destroy.
- Demos and docs import constants rather than repeat strings.

### Out of scope

Cancelable before-events, generic change/count events, validation events,
reset, additional reorder, dirty state, announcement events, and batch events.

## Phase 7 — Addon architecture

### Goal

Provide opt-in extension points without bloating or weakening the core.

### Scope

Addon types, synchronous setup, component/per-item cleanup registries,
subscription utilities, duplicate protection, rollback, and a test harness.

### Tasks

- Define addon ID, context, item context, and cleanup types.
- Run setup and cleanup in documented order.
- Store parent-owned component and item cleanup callbacks.
- Provide automatically cleaned typed event subscriptions.
- Reject duplicate addon IDs.
- Roll back failed setup and abort failed cleanup safely.
- Document packaging and priority order.

### Dependencies

Phases 2, 4, and 6.

### Risks

- Detached items may remain referenced.
- Cleanup failures may leave partially disconnected integrations.
- Addons may duplicate status announcements or bypass constraints.
- Accidental main-entry imports may increase bundle size.

### Acceptance criteria

- Core behavior and accessibility work with zero addons.
- Item cleanup completes before successful detachment.
- Destroy cleans every item and component hook exactly once.
- Duplicate initialization does not repeat setup.
- Addon code is absent from the main bundle unless explicitly imported.

### Out of scope

Implementing optional addons, async hooks, addon dependency injection,
framework wrappers, or allowing addons to patch private methods.

## Phase 8 — Testing and accessibility verification

### Goal

Validate behavior, packaging, cleanup, and real accessibility rather than API
existence alone.

### Scope

Vitest/jsdom, package/export tests, DOM interaction and contract tests,
documentation checks, browser checks, and manual assistive-technology scripts.

### Tasks

- Test initialization, ownership, identity, token replacement, Add/Remove,
  limits, focus, announcements, events, addons, destroy, and reinitialization.
- Test file, radio, datalist, multi-ID, `headers`, and server-name cases.
- Test build output, declarations, docs metadata, CSS export, and package dry
  run.
- Run keyboard, zoom/reflow, forced-colors, reduced-motion, and screen-reader
  scenarios.
- Record findings and limitations without unsupported conformance claims.
- Maintain `MANUAL_ACCESSIBILITY_TEST_RECORD.md` as the environment-specific
  evidence ledger; do not treat its unrun scenarios as results.

### Dependencies

Phases 1–7.

### Risks

- jsdom cannot prove layout, visibility, screen-reader speech, autofill, or
  focus scrolling.
- Automated accessibility scores may hide usability defects.
- Cross-browser form behavior may differ.

### Acceptance criteria

- Build, typecheck, tests, and package dry run pass.
- Every public behavior and event has direct tests.
- Manual test results identify browser/AT combinations and observed outcomes.
- Known limitations remain visible in docs.
- No claim equates automated success with WCAG conformance.

### Out of scope

Guaranteeing every browser/AT combination, production analytics, performance
telemetry, and publishing.

## Phase 9 — Documentation and GitHub Pages

### Goal

Publish static, accessible, synchronized documentation from `/docs` on `main`.

### Scope

README, structured docs metadata, static Pages shell, implemented demos, copied
assets, relative URLs, synchronization checks, and owner setup instructions.

### Tasks

- Implement the page inventory in `GITHUB_PAGES_PLAN.md`.
- Build all demos from semantic server-rendered HTML.
- Copy actual built runtime and CSS into `/docs/assets`.
- Add `.nojekyll`, relative navigation, and subpath verification.
- Cross-check runtime, types, README, lifecycle docs, metadata, and demos.
- Document manual Pages setup and post-deployment checks.

### Dependencies

Phases 1–8.

### Risks

- Committed Pages assets may lag behind source.
- Root-relative or case-mismatched paths may work locally and fail on Pages.
- Demos may use private APIs or source files.
- Branch publishing may expose stale files after merge.

### Acceptance criteria

- Every page works under `/A11y-Repeatable-Fieldset/` and by direct URL.
- No import or link escapes `/docs`.
- Demos use copied build output and produce no console 404 errors.
- Asset byte comparison and contract synchronization checks pass.
- Documentation is keyboard accessible and responsive.
- Pages configuration remains a documented owner action.

### Out of scope

SPA routing, a deployment branch, server rendering, CMS integration, automatic
Pages configuration, custom domains, and automatic deployment changes.

## Phase 10 — Optional enhancements

### Goal

Add separately packaged enhancements only after the core contract is stable
and tested in real forms.

### Scope

Evaluation and possible implementation of addons in this order:

1. Validation Bridge — implemented as an explicit dependency-free subpath
2. Legend Sync — implemented as an explicit dependency-free subpath
3. Remove Guard — implemented as an explicit dependency-free subpath
4. Accessible Reorder Controls — implemented as an explicit dependency-free subpath
5. Undo Remove — implemented as an explicit dependency-free subpath
6. Form Memory Bridge — implemented as an explicit dependency-free subpath
7. Duplicate Item — implemented as an explicit dependency-free subpath
8. Reset Structure
9. Template Switcher

### Tasks

- Evaluate one addon at a time against core boundaries. The Validation Bridge,
  Legend Sync, Remove Guard, Accessible Reorder, Duplicate Item, Undo Remove,
  and Form Memory Bridge evaluations and implementations are complete; later
  addons remain pending.
- Define its public API, privacy/data policy, focus, announcement, event, and
  cleanup behavior.
- Add an explicit subpath only with implementation, tests, docs, demo, and
  package verification.
- Measure bundle isolation and confirm zero impact when not imported.

### Dependencies

Phases 1–9 are stable, with real-form evidence relevant to the addon.

### Risks

- Undo and memory features may retain sensitive data. Undo therefore uses
  explicit state markers, one in-memory latest snapshot, bounded expiry, and
  absolute file-value exclusion. Form Memory Bridge itself retains keys and
  order only; application-owned draft persistence controls values, expiry,
  consent, clearing, and sensitive-field exclusions.
- Validation integrations may hold detached controls.
- Reorder may confuse identity with position.
- Template switching may pressure the core toward domain-specific behavior.

### Acceptance criteria

- Each addon has an independent contract and acceptance gate.
- Core API changes occur only when evidence shows the extension cannot be
  implemented through supported boundaries.
- No addon becomes required for core accessibility.
- Optional code remains absent from the default bundle.

### Out of scope

The explicitly rejected addons in `ADDONS.md`, silent MVP expansion, bundling
all addons together, and implementing multiple addons in one unreviewable
change.

## Cross-phase release gates

Progression does not imply publication. Before any release decision:

- build, typecheck, tests, and pack dry run pass
- manual accessibility findings are recorded
- runtime, event docs, README, structured docs metadata, demos, and Pages
  assets agree
- package contents contain no placeholders or unintended files
- no runtime dependency has been introduced without explicit review
- the owner explicitly authorizes publishing, tagging, pushing, and any Pages
  setting or deployment action
