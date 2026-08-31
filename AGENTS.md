# Repository Constitution for Coding Agents

## Project identity and status

- Project: A11yRepeatableFieldset
- Package: `a11y-repeatable-fieldset`
- Repository: `A11y-Repeatable-Fieldset`
- Pattern: progressively enhanced repeatable form group/fieldset
- Status: implemented locally and unpublished; manual accessibility evidence
  and owner-controlled publication remain pending
- Language: TypeScript
- Module format: ESM only
- Browser target: Baseline 2024, compiled to ES2022
- Runtime dependencies: none
- CSS: minimal, optional, and separately exported
- Documentation publishing: static `/docs` from `main`

Read these files before changing implementation or contracts:

1. `MARKUP_AND_ACCESSIBILITY_CONTRACT.md`
2. `LIFECYCLE_EVENTS.md`
3. `ADDONS.md`
4. `VALIDATION_BRIDGE.md`
5. `LEGEND_SYNC.md`
6. `REMOVE_GUARD.md`
7. `ACCESSIBLE_REORDER.md`
8. `ROADMAP.md`
9. `IMPLEMENTATION_TASKS.md`
10. `GITHUB_PAGES_PLAN.md`
11. `README.md`

If documents conflict, stop and reconcile the public contract explicitly.
Do not silently select the easier interpretation.

## TypeScript-first package rules

- Write runtime source in strict TypeScript.
- Target ES2022 with `module: "ESNext"` and
  `moduleResolution: "Bundler"`.
- Use DOM and DOM.Iterable libraries, declarations, declaration maps, source
  maps, isolated modules, verbatim module syntax, and `noEmit` for typecheck.
- Do not use `any` to bypass DOM, lifecycle-event, addon, result, or error
  contracts.
- Keep main exports plugin-specific and documented.
- Emit ESM only. Do not add CommonJS, UMD, IIFE, or a browser global.
- Never auto-initialize on import. `document` may be read only inside an
  explicitly called initializer or instance behavior.
- Use the root's `ownerDocument` and its realm for created elements and
  `CustomEvent` where cross-document behavior matters.

## Planned package architecture

Foundation work should produce:

```text
src/
├── index.ts
├── docs.ts
└── styles.css
examples/
└── basic/
    ├── index.html
    └── README.md
test/
├── helpers/
└── *.test.ts
.changeset/
└── config.json
CHANGELOG.md
package.json
tsconfig.json
tsdown.config.ts
tsdown.min.config.ts
vitest.config.ts
```

Core modules may be split by responsibility when that improves reviewability,
for example options, discovery, identity, focus, status, events, and addons.
Do not create a framework layer or deep abstraction hierarchy.

Planned package exports:

- `.`
- `./min`
- `./docs`
- `./styles.css`
- `./package.json`

Add an addon subpath only when that addon is implemented, tested, documented,
demonstrated, and package-verified. Do not create placeholder exports.

## Dependencies and package manager

- Use npm unless a future committed lockfile establishes another package
  manager.
- Runtime dependency count must remain zero.
- Development dependencies must be limited to the build, typecheck, test,
  Changesets, and documentation tooling actually used.
- Do not add a framework, sanitizer, localization library, UUID package,
  animation library, state manager, or DOM utility for core behavior.
- Do not switch package managers, regenerate a lockfile with another manager,
  or add a runtime dependency without explicit user permission.

## Semantic HTML requirements

- The root is a neutral owned container, not a required outer `fieldset`.
- Each repeated item is a real `fieldset` with a non-empty `legend`.
- Add and Remove actions are native `<button type="button">` controls.
- Form controls have visible labels and stable `name` attributes.
- Use native `disabled` for unavailable native buttons and do not add redundant
  `aria-disabled`.
- Use ARIA only where native HTML is insufficient.
- Do not generate a fake button, fake fieldset, placeholder-only label, or
  clickable `div`/`span`.
- Do not add positive `tabindex`.

## Progressive enhancement requirements

Before initialization:

- server-rendered controls, values, names, IDs, errors, labels, legends, and
  normal submission remain usable
- the template is inert
- enhancement-only Add and Remove controls are `hidden`
- no visible button may depend on unavailable JavaScript

After successful initialization:

- existing items are discovered rather than recreated
- enhancement controls are revealed and synchronized
- server data remains untouched
- initialization dispatches one `init` and no user-action Add events

Failed initialization is transactional and must leave the author DOM usable.

## DOM ownership boundaries

- Use data attributes for behavior selectors and BEM classes for styling.
- An element is owned only when its nearest
  `[data-a11y-repeatable-fieldset]` ancestor is the current root.
- Require one owned items container and direct-child item fieldsets.
- Do not select every descendant `fieldset`, button, template, or form control.
- Ignore content belonging to another root.
- Nested repeaters are outside the MVP. Keep selectors isolated so future
  design is not made impossible.

Author-owned DOM includes fieldsets, legends, controls, values, keys, names,
IDs, server errors, template, and Add/Remove buttons. Plugin-owned resources
include listeners, timers, generated status UI, active registration, and
addon cleanup registries.

Destroy must not remove author-owned or dynamically added fieldsets or discard
user data.

## Identity, ID, and name invariants

- Stable key and visible position are different concepts.
- Preserve valid server keys and allocate only missing keys.
- Default generated keys are monotonic `item-N` values and are not reused
  during one instance lifetime.
- Enforce the key grammar
  `^[A-Za-z0-9][A-Za-z0-9._:-]*$`.
- The only template token is `__A11Y_REPEATABLE_KEY__`.
- Replace it only in contract-approved attributes.
- Parse multi-ID attributes as token lists; preserve unrelated references.
- Validate generated IDs and tokenized local references before insertion.
- Update visible numbers only through
  `[data-a11y-repeatable-fieldset-position]`.
- Never renumber names after removal or reorder.
- Never replace current position into stable names or IDs.
- Tokenize radio names so groups are isolated per item.
- Never copy, restore, or assign file-input values.

## Add, Remove, and Move rules

Follow the exact operation order in
`MARKUP_AND_ACCESSIBILITY_CONTRACT.md`.

- Clone only the trusted inert template.
- Never clone a live item for core Add.
- Never accept unrestricted HTML strings.
- Return typed discriminated results for success, blocked operations, invalid
  key/template, unknown target, inactive instance, or addon failure.
- Blocked or rolled-back commands emit no success lifecycle event.
- Resolve post-removal focus before detaching an active item.
- Keep removed keys reserved.
- Preserve current fieldsets and values on destroy.
- Route reorder through the public transactional `move()` command; addons must
  never mutate owned DOM or registry order directly.
- Move changes only DOM/registry order and visible positions. Stable keys,
  names, IDs, values, and file inputs remain untouched.

## Focus management

After a user-triggered Add:

1. explicit valid focus marker
2. first enabled/non-hidden/non-inert labelable control
3. intentionally programmatically focusable fieldset
4. retain focus on Add

API Add does not focus by default.

When removing the active item:

1. equivalent next enabled Remove button
2. equivalent previous enabled Remove button
3. Add button
4. intentional root fallback

Evaluate candidates against post-removal minimum state. Programmatic removal
does not move unrelated focus but must recover focus that would otherwise be
detached.

Do not use CSS visual order as keyboard order, force `tabindex="0"` onto every
fieldset, or hide focused content.

After Move, preserve the same eligible active element inside the moved item.
Programmatic Move leaves unrelated focus untouched.

## Announcement rules

- Use at most one polite, atomic status region per root.
- Reuse an empty author-provided region or create one only when enabled.
- Announce completed structural changes, not activation or every sync step.
- Write one combined message per operation, including a boundary message when
  appropriate.
- Keep the exported English message formatters frozen. Custom formatters are
  JavaScript-only, receive frozen structural metadata without field values,
  and fall back per concept when they throw or return blank/non-string output.
- Do not use `role="alert"` for routine Add/Remove/Move.
- Do not let addons duplicate core announcements.
- Cancel timers and pending writes during destroy.
- Remove only status DOM generated by the plugin.

## Lifecycle-event rules

The only MVP events are:

- `a11y-repeatable-fieldset:init`
- `a11y-repeatable-fieldset:item-added`
- `a11y-repeatable-fieldset:item-duplicated`
- `a11y-repeatable-fieldset:item-removed`
- `a11y-repeatable-fieldset:item-restored`
- `a11y-repeatable-fieldset:item-moved`
- `a11y-repeatable-fieldset:destroy`

Use one frozen exported `EVENTS` object. Events dispatch from the root with:

- `bubbles: true`
- `composed: false`
- `cancelable: false`

Events observe completed work. They are not commands and are never required
for core correctness. Dispatch Add/Remove/Duplicate/Restore/Move events after
DOM, registry, addons, positions, controls, focus, and status text are stable.
Do not emit item events for initialization, blocked commands, or rollback. No
event may fire after the final destroy event.

Do not add before-events, request events, generic change/count events,
validation, dirty-state, reset, additional reorder, announcement, or batch
events without a separate contract review.

## Addon cleanup rules

- Addons are opt-in and absent from the main runtime bundle.
- Hooks are synchronous in the MVP.
- Addons return cleanup callbacks; the parent owns and stores them.
- Reject duplicate addon IDs.
- Run component/item setup in registration order and cleanup in reverse.
- Run per-item cleanup before detachment.
- Run every current item cleanup and then component cleanup during destroy.
- Roll back partial setup.
- Release detached item references from parent registries.
- Subscription utilities must return idempotent cleanup.

Addons must not patch private methods, fake core events, bypass limits, mutate
frozen defaults, auto-initialize, retain detached items unnecessarily, include
other addons silently, or become required for core accessibility.

## CSS rules

- CSS is optional and behavior-independent.
- Use the `a11y-repeatable-fieldset` BEM block, `__` elements, `--` modifiers,
  and `is-*` states.
- Public properties use the complete
  `--a11y-repeatable-fieldset-` prefix.
- Private normalized properties use `--_`, stay scoped to the block, and are
  not documented.
- Do not put component tokens on `:root`.
- Provide readable spacing, boundaries, wrapping, disabled states, and visible
  `:focus-visible` styles.
- Do not rely on color, shadows, background images, or motion alone.
- Support forced colors and high contrast.
- The MVP has no structural Add/Remove animation.
- Any nonessential transition is component-scoped and respects
  `prefers-reduced-motion`.

## Testing expectations

Use Vitest with jsdom for structural DOM tests. Cover:

- exports, initialization, errors, duplicate instances, and rollback
- ownership, existing-item preservation, and nested-root exclusion
- keys, IDs, labels, multi-ID references, names, radios, datalists, headers,
  and file inputs
- Add/Remove/Move success and every blocked/failure result
- minimum/maximum controls and immutable snapshots
- focus, announcements, all seven events, addon cleanup, destroy, and
  reinitialization
- build output, declarations, package exports, docs metadata, CSS, and dry run
- Pages asset and contract synchronization

jsdom is not evidence for screen-reader speech, layout visibility, autofill,
focus scrolling, zoom/reflow, forced colors, or reduced motion. Run the manual
matrix in the roadmap and document observed environments and limitations.

Never claim complete WCAG conformance from automated tests or scores.

## GitHub Pages constraints

- Pages publishes committed `/docs` files from `main`.
- Keep HTML pages static and links relative.
- Do not use a JavaScript router or SPA fallback.
- Do not import from `/src`, `/dist`, or paths outside `/docs`.
- Demos use actual copied build output from `/docs/assets`.
- Keep `.nojekyll`.
- Verify repository-subpath URLs, direct navigation, missing assets, console
  errors, keyboard use, reflow, forced colors, and reduced motion.
- Treat Pages configuration and deployment as owner actions.

## Anti-patterns

Do not:

- auto-run an initializer on import
- clone a live item for ordinary Add
- renumber names after removal
- use visible position as stable identity
- perform unrestricted serialized HTML replacement
- accept untrusted HTML strings
- capture descendant fieldsets or controls with unscoped selectors
- use MutationObserver auto-initialization
- use a fake button or unnecessary ARIA
- hide focus outlines without a replacement
- make drag and drop the only reorder mechanism
- announce every internal update
- remove dynamic fieldsets during destroy
- silently restore or discard structure on native reset
- publish placeholder addon exports
- add framework wrappers or runtime dependencies to the MVP
- make unsupported accessibility, browser, or publication claims

## Commands and actions requiring explicit permission

Never run or perform these without explicit user permission:

- `npm publish`, `pnpm publish`, or `yarn publish`
- `npm run release` or any Changesets publish command
- `git push`
- `git tag` or tag deletion
- destructive Git commands such as `git reset --hard`, `git clean`, or
  checkout/restore that discards user changes
- dependency installation, dependency upgrades, or package-manager changes
- adding a runtime dependency
- changing GitHub repository or Pages settings
- creating or changing a deployment workflow for automatic publication
- deploying GitHub Pages or another site
- deleting user-authored form data, docs, or generated assets outside a
  clearly authorized scoped task

Build, typecheck, tests, and package dry runs are allowed when relevant and
their scripts exist. Never convert a dry run into a publish action.
