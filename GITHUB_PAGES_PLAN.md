# GitHub Pages Plan

## Status and publishing model

The static documentation site is committed under `/docs` and has not been
deployed. When authorized, GitHub Pages will publish committed files from:

- branch: `main`
- folder: `/docs`

The repository owner must configure this manually in **Settings → Pages →
Deploy from a branch → `main` → `/docs`**. No implementation task may change
repository settings or deploy automatically without explicit permission.

The site will not use a deployment branch, SPA router, framework runtime, or
server-side behavior.

## Folder layout

```text
docs/
├── .nojekyll
├── index.html
├── basic.html
├── existing-items.html
├── limits.html
├── complex-fields.html
├── stable-keys.html
├── lifecycle-events.html
├── localization.html
├── addons.html
├── validation-integration.html
├── form-memory-integration.html
├── api.html
├── no-javascript.html
├── realistic-multi-person.html
├── event-inspector.html
├── transactional-failure-lab.html
├── edge-cases.html
├── duplicate-item.html
├── undo-remove.html
└── assets/
    ├── a11y-repeatable-fieldset.js
    ├── a11y-repeatable-fieldset.min.js
    ├── validation-bridge.js
    ├── legend-sync.js
    ├── remove-guard.js
    ├── accessible-reorder.js
    ├── duplicate-item.js
    ├── undo-remove.js
    ├── form-memory-bridge.js
    ├── a11y-repeatable-fieldset.css
    ├── docs.css
    ├── remove-guard-demo.js
    ├── accessible-reorder-demo.js
    ├── duplicate-item-demo.js
    ├── undo-remove-demo.js
    ├── form-memory-bridge-demo.js
    ├── event-inspector.js
    ├── realistic-multi-person.js
    ├── transactional-failure-lab.js
    ├── favicon.svg
    └── social-preview.png
```

HTML pages remain flat so their navigation and asset URLs share one relative
base. Images or icons are added only when they communicate documentation value
and include appropriate alternatives.

The 1280 × 640 `social-preview.png` is the shared Open Graph and Twitter/X
image for the static site. The matching repository preview is stored at
`.github/social-preview.png`; GitHub repository settings still require a
manual owner upload because the file alone does not configure the remote
preview.

## Page inventory

| Page | Purpose |
| --- | --- |
| `index.html` | Overview, project status, progressive enhancement, and navigation. |
| `basic.html` | One server-rendered fieldset enhanced with Add and Remove. |
| `existing-items.html` | Edit form with saved keys, values, hidden IDs, and server errors. |
| `limits.html` | Minimum, maximum, disabled controls, and visible limit instructions. |
| `complex-fields.html` | Radio groups, checkboxes, selects, textarea, datalist, descriptions, headers references, and file-input limitations. |
| `stable-keys.html` | Key versus position, backend naming examples, and no-renumbering policy. |
| `lifecycle-events.html` | Exact event contract and typed detail. |
| `localization.html` | Item labels and JavaScript-only message formatters. |
| `addons.html` | Addon contract, seven implemented subpaths, priorities, packaging, exclusions, executable asynchronous Remove Guard confirmation, native Accessible Reorder controls, and links to Duplicate Item, Undo Remove, and Form Memory Bridge. |
| `validation-integration.html` | Executable live-validation and error-review demo plus Validation Bridge adapter, synchronized error summary, focus, cleanup, no-submit behavior, and A11y Form Validator compatibility guidance. |
| `form-memory-integration.html` | Executable Form Memory Bridge structure-before-values demo, A11yFormDraftPersistence integration sequence, conservative merge policy, and privacy exclusions. |
| `api.html` | Exports, options, results, errors, methods, and types. |
| `no-javascript.html` | Side-by-side enhanced and unenhanced behavior. |
| `realistic-multi-person.html` | Executable packaged Legend Sync demo with several completed people, committed updates, stable identity, privacy guidance, and manual-test limitations. |
| `event-inspector.html` | Demo that logs the seven public events as bounded ordinary document content without private APIs. |
| `transactional-failure-lab.html` | Malformed-template blocking and addon rollback observed through public results, events, and author-visible DOM counts. |
| `edge-cases.html` | Autofill, reset, file inputs, external ID references, unsupported nesting, and limitations. |
| `duplicate-item.html` | Executable template-first Duplicate Item demo, explicit copy markers, supported native-control state, sensitive-data exclusions, defaults, focus, and event output. |
| `undo-remove.html` | Executable short-lived Undo demo with reserved-key template restoration, explicit state markers, expiry/focus disclosure, file-value exclusion, and restored-event output. |

Every demo uses realistic neutral content and the actual built package output.
No page may copy runtime source into an inline script.

## Asset-copy strategy

Because Pages serves only `/docs`, no HTML file may import `../dist`,
`../src`, or any other sibling path.

The implemented documentation build:

1. build readable and minified ESM runtime output
2. copy `dist/index.js` to
   `docs/assets/a11y-repeatable-fieldset.js`
3. copy `dist/index.min.js` to
   `docs/assets/a11y-repeatable-fieldset.min.js`
4. copy `dist/styles.css` to
   `docs/assets/a11y-repeatable-fieldset.css`
5. copy `dist/addons/validation-bridge.js` to
   `docs/assets/validation-bridge.js`
6. copy `dist/addons/legend-sync.js` to `docs/assets/legend-sync.js`
7. copy `dist/addons/remove-guard.js` to `docs/assets/remove-guard.js`
8. copy `dist/addons/accessible-reorder.js` to
   `docs/assets/accessible-reorder.js`
9. copy `dist/addons/duplicate-item.js` to
   `docs/assets/duplicate-item.js`
10. copy `dist/addons/undo-remove.js` to
    `docs/assets/undo-remove.js`
11. copy `dist/addons/form-memory-bridge.js` to
    `docs/assets/form-memory-bridge.js`
12. copy or preserve documentation-only CSS and scripts separately
13. validate every local URL and module import
14. fail if a path resolves outside `/docs`

Stable asset names are preferred. Hashing is unnecessary for the small static
site unless caching demonstrates a real problem.

Implemented scripts:

- `docs:jsonld` — regenerate one page-specific JSON-LD graph per hand-authored HTML page from local package and page metadata
- `build:dist` — build package output only
- `pages:sync` — run `build:dist`, then copy package assets into `/docs/assets`
- `pages:check` — build fresh output without modifying committed docs assets,
  byte-compare expected assets, validate the static site, and fetch every page
  and asset through a temporary repository-subpath server
- `pages:build` — run `pages:sync` and the same static/subpath checks

Package `prepack` should build package output, not rewrite committed Pages
files unexpectedly.

## URL rules

All navigation, stylesheet, script, form-action, favicon, and other runtime
asset URLs must:

- be relative, such as `./assets/docs.css` or `./basic.html`
- work below `/A11y-Repeatable-Fieldset/`
- avoid root-relative forms such as `/assets/docs.css`
- preserve filename case exactly
- avoid source paths unavailable to Pages
- avoid `<base>` unless a demonstrated need outweighs its link-resolution risk

Canonical and social metadata are deliberate exceptions because search and
sharing consumers require absolute URLs. The planned production base is
`https://vmitsaras.github.io/A11y-Repeatable-Fieldset/`, derived from the
repository owner and name. Each public page uses its own absolute canonical
and matching `og:url`; every page uses the absolute
`https://vmitsaras.github.io/A11y-Repeatable-Fieldset/assets/social-preview.png`
image URL for Open Graph and Twitter/X metadata. These values prepare the
static output but do not claim that Pages is already deployed.

Navigation uses normal links and distinct HTML documents. Direct navigation
and browser refresh must work for every page without router fallback.

## Local verification

Verify both document-root and repository-subpath behavior.

### Direct `/docs` serving

Serve `/docs` as a static root and verify:

- every page loads directly
- runtime modules and CSS return successful responses
- navigation links resolve
- no console 404 or module MIME errors occur

### Repository-subpath simulation

In a temporary directory:

1. create an `A11y-Repeatable-Fieldset` folder
2. copy the current `/docs` output into it
3. serve the temporary parent directory
4. open `/A11y-Repeatable-Fieldset/`
5. navigate directly to every HTML page

The verification script must use a temporary directory and never rewrite the
repository to simulate hosting.

## Synchronization checks

Checks must fail when:

- a fresh `dist/index.js`, `dist/index.min.js`, or `dist/styles.css` differs
  byte-for-byte from its committed Pages copy
- any local URL is missing, case-mismatched, root-relative, or escapes `/docs`
- any page is missing a unique title, unique description, planned absolute
  canonical, matching Open Graph URL, or complete large-image social metadata
- any page is missing its one valid page-specific `WebPage` plus
  `SoftwareSourceCode` JSON-LD graph, or its structured data omits the public
  package URL after publication
- the shared social image is missing, is not 1280 × 640 PNG, or reaches the
  platform size limit
- an event in the frozen runtime constants is absent from lifecycle docs or
  structured docs metadata
- a documented option, method, result reason, or error code is absent from the
  public TypeScript contract
- a demo imports a private API or source file
- README links do not match real Pages paths
- package and displayed documentation versions differ
- `.nojekyll` is missing

`src/docs.ts` should provide structured metadata for API and central docs
aggregation. It is not a replacement for contract tests against README,
lifecycle documentation, and demos.

A future GitHub Actions workflow may run build and synchronization checks.
Pages deployment remains branch-based from `main` and `/docs`.

## Accessibility requirements

Every page and demo must provide:

- valid document language, viewport metadata, and unique title
- one clear page heading and logical heading hierarchy
- landmark-based page structure and a visible-on-focus skip link
- native form controls, explicit labels, fieldsets, and legends
- visible keyboard focus and logical source order
- no keyboard trap or positive `tabindex`
- status updates that do not duplicate core announcements
- text or shape in addition to color for state
- reflow at 400% zoom without two-dimensional page scrolling
- touch-friendly controls and responsive wrapping
- forced-colors-resilient boundaries and focus indicators
- no structural motion by default; any optional transition respects
  `prefers-reduced-motion`
- examples that remain meaningful before their module initializes

Manual checks should cover keyboard-only use, NVDA with Firefox and Chrome,
VoiceOver with Safari, and TalkBack with Chrome where practical. Automated
audits supplement but do not replace manual testing.

## Deployment verification

After the owner enables Pages:

1. confirm the published URL uses the repository subpath
2. open every page directly, not only through navigation
3. check module and stylesheet responses in the network panel
4. confirm no console errors or 404s
5. exercise Add, Remove, limits, focus, status, and event inspector demos
6. verify mobile layout, 400% reflow, forced colors, and reduced motion
7. compare displayed package version and copied assets with the release
8. record manual accessibility findings without claiming universal WCAG
   conformance

## Limitations of `/docs` publishing

- Only committed files under `/docs` are public.
- Pages cannot import runtime files directly from `/dist`.
- Branch-based deployment does not build the package on the Pages server.
- Asset synchronization must happen before merge to `main`.
- Server-side form processing, headers, redirects, and dynamic routes are not
  available.
- A stale committed asset can be published even when source is newer unless
  synchronization checks are required in CI or review.
- Configuring Pages is an owner action and is outside package implementation.
