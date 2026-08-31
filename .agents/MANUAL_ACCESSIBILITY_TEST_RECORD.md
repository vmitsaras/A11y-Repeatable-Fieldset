# Manual Accessibility Test Record

## Status and evidence boundary

This record prepares `A11Y-005 — Verify fieldset and legend output`,
`A11Y-006 — Verify labels and ID references`, `ADDON-007 — Implement Legend
Sync`, `ADDON-008 — Implement Remove Guard`, `ADDON-009 — Implement Accessible
Reorder`, `ADDON-010 — Implement Duplicate Item`, and `A11Y-007 — Verify reduced
motion and forced colors`, plus `ADDON-012 — Implement Form Memory Bridge`. As of
**2026-08-31**, **2 of 6 target environment rows have been exercised**. The
basic Add/Remove flow passed with Chrome reduced-motion emulation on macOS, and
the VoiceOver + Safari row has a partial result with an open interoperability
finding. A user-supplied VoiceOver caption-panel recording captured the Add
message, a missed middle-item Remove message, and stale group context after
legend updates. Follow-up Safari accessibility-tree checks isolated the stale
name to native legend renumbering rather than the Legend Sync addon. Remaining
screen-reader scenarios are still unverified. Supplemental browser-only keyboard checks were completed in
Safari, Chrome, and Firefox on macOS, and a separate 320 CSS-pixel check found
a documentation-shell reflow failure.

**Not run is an evidence gap, not a passing result.** This ledger is the
source of truth for which combinations have actually been exercised. Keep a
separate row for each materially different browser, operating-system,
assistive-technology, or verbosity configuration; do not overwrite an earlier
observation.

The automated structural suite specifies that each owned item is a `fieldset`
with one meaningful direct-child `legend`, synchronizes owned position markers,
and materializes supported tokenized label/ID relationships. It cannot
establish what a screen reader actually announces, how it sequences group and
control information, or whether the resulting wording is clear in a target
browser.

## Scope

The test fixture must contain:

- one server-rendered item with legend text `Contact 1`, an explicitly labelled
  `Name` input, and a native Remove button;
- a trusted template that produces a second fieldset with legend text
  `Contact 2` after Add;
- a template Name control with explicit, local, and external label/description
  relationships plus local datalist, controlled-panel, and table-header IDs;
- the normal focus behavior: a user-triggered Add moves to the new item, and
  removing focused content resolves focus before detachment;
- a minimum of one item and an Add control that remains available.
- the opt-in Legend Sync addon with a deliberately marked Name source, a
  dedicated direct-legend suffix target, committed `change` timing, and no
  addon live region;
- the opt-in Remove Guard addon with explicit meaningful-state policy and an
  application-owned, asynchronously resolved native dialog.
- the opt-in Accessible Reorder addon with native Move up/down buttons, two
  items, one polite core status region, and stable keyed names.
- the opt-in Duplicate Item addon with one native Duplicate button, explicit
  supported-control copy slots, excluded hidden/password/file fields, one
  polite core status region, and a fresh-key template item.
- the opt-in Form Memory Bridge demo with an application-owned restore choice,
  a missing saved item, a current server item, one core status region, an
  application restore outcome, and a clear-saved-draft action.

Use a realistic form page, not a synthetic ARIA replacement. Test both the
server item and an item generated from the inert template in the same session.

## Evidence ledger

| Target environment | Version and configuration | Date | Scenario set | Result | Observed output, failures, and limitations |
| --- | --- | --- | --- | --- | --- |
| NVDA + Firefox on Windows | Not captured | — | `A11Y-SR-005-01` to `-03`; `A11Y-SR-006-01`; `A11Y-SR-LS-01` to `-02`; `A11Y-SR-RG-01`; `A11Y-SR-AR-01`; `A11Y-SR-DI-01`; `A11Y-SR-FM-01` | Not run | Requires a Windows tester. |
| NVDA + Chrome on Windows | Not captured | — | `A11Y-SR-005-01` to `-03`; `A11Y-SR-006-01`; `A11Y-SR-LS-01` to `-02`; `A11Y-SR-RG-01`; `A11Y-SR-AR-01`; `A11Y-SR-DI-01`; `A11Y-SR-FM-01` | Not run | Requires a Windows tester. |
| VoiceOver + Safari on macOS | VoiceOver enabled with caption panel; Safari 26.6.2 on macOS 26.6.2 | 2026-08-31 | Basic control-focus subset of `A11Y-SR-005-01` to `-03`; middle/last removal and Legend Sync subsets of `A11Y-SR-LS-01` to `-02` | Partial; open finding `SR-REM-01` | The basic demo exposed the expected Add/Remove status text and focus destinations. In the supplied multi-person recording, Add was captioned as “Person 3 added. 3 items total.” and focus moved to its Full name field. After committing `test`, later control context still used “Person 3 — name not entered.” After adding Person 4 and removing Person 3, focus moved to the remaining Remove button, but its caption combined the new button position with the cached group name: “Remove person 3, button, Person 4 — name not entered.” No completed Remove status appeared in the remaining recording. Follow-up checks found the same stale fieldset-container name after middle removal with Legend Sync enabled and temporarily disabled: the container remained “Person 3 — Priya Shah” while its child legend text was “Person 2 — Priya Shah.” Last-item removal did not renumber a surviving legend and showed no equivalent mismatch. Exact speech for the four automation-driven isolation runs and browse-cursor navigation remain unverified. VoiceOver and the demo script were restored after testing. |
| TalkBack + Chrome on Android | Not captured | — | `A11Y-SR-005-04`; `A11Y-SR-006-01`; `A11Y-SR-LS-01` to `-02`; `A11Y-SR-RG-01`; `A11Y-SR-AR-01`; `A11Y-SR-DI-01`; `A11Y-SR-FM-01` | Not run | Requires an Android TalkBack tester. |
| Desktop browser with reduced motion | Chrome 151.0.7922.175 on macOS 26.6.2; DevTools `prefers-reduced-motion: reduce` emulation | 2026-08-31 | `A11Y-VIS-007-01` | Pass for the basic Add/Remove demo | Add and Remove remained immediate. Add focused Contact 2's Name field; Remove returned focus to Add; the completed-operation status text remained present. Emulation was reset after the check. This is not screen-reader evidence. |
| Windows High Contrast / forced colors | Not captured | — | `A11Y-VIS-007-02` | Not run | Requires a Windows tester. A separate macOS 320 CSS-pixel reflow failure is recorded below and is not forced-colors evidence. |

## Supplemental macOS browser observations

These checks corroborate keyboard and browser accessibility-tree behavior but
do not count as target screen-reader rows and do not establish spoken output.

| Environment | Date | Scenario coverage | Result | Observations and limitations |
| --- | --- | --- | --- | --- |
| Safari 26.6.2 on macOS 26.6.2, VoiceOver off | 2026-08-31 | `A11Y-KBD-005-01`; browser-tree subset of `A11Y-SR-005-01` to `-03` | Partial pass | Contact 1 and Contact 2 were exposed as separately named containers with labelled Name and Phone fields. Keyboard Add focused Contact 2's Name field; Remove returned focus to Add; completed Add/Remove status text was exposed; minimum Remove became disabled. With the current macOS keyboard-navigation preference, plain Tab skipped links and buttons; Safari's Option-Tab override reached them in natural order. Screen-reader speech and visible-focus appearance were not verified. |
| Chrome 151.0.7922.175 on macOS 26.6.2, screen reader off | 2026-08-31 | `A11Y-KBD-005-01`; browser-tree subset of `A11Y-SR-005-01` to `-03` | Partial pass | Plain Tab reached native controls in natural order. Add focused Contact 2's Name field; Remove returned focus to Add; completed status text and the disabled minimum Remove state were exposed. Screen-reader speech and visible-focus appearance were not verified. |
| Firefox 154.0 on macOS 26.6.2, screen reader off | 2026-08-31 | `A11Y-KBD-005-01`; browser-tree subset of `A11Y-SR-005-01` to `-03` | Partial pass | Plain Tab reached native controls in natural order. Add focused Contact 2's Name field; Remove returned focus to Add; completed status text and the disabled minimum Remove state were exposed. Screen-reader speech and visible-focus appearance were not verified. |
| Chrome 151.0.7922.175 headless on macOS 26.6.2; 320 × 900 CSS-pixel viewport | 2026-08-31 | Reflow subset of `A11Y-VIS-007-02` | Fail | The documentation shell clipped the hero heading and supporting text at the right edge. This is a documentation-layout failure; Windows forced colors and 400% browser zoom remain unverified. |
| Vitest 4.1.10 and TypeScript on macOS 26.6.2 | 2026-08-31 | Automated structural suite, typecheck, and build | Pass | All 377 tests in 35 files passed, `tsc --noEmit` passed, and both configured builds completed. Automated results remain structural evidence only. |

## Open interoperability findings

### `SR-REM-01` — Middle removal can lose confirmation and retain stale group context

**Status:** Open. Do not record VoiceOver + Safari middle-item removal as a
pass until a retest captures an understandable completed-operation message and
non-conflicting focus context.

**Observed behavior:** The supplied caption-panel recording contained the Add
message but no completed Remove message after a middle item was removed. Focus
recovery succeeded, yet the surviving item combined its new visible-position
button name with its prior cached fieldset name. Safari accessibility-tree
isolation reproduced the stale fieldset name with Legend Sync both enabled and
disabled.

**Expected equivalent outcome:** After removing Person 3, VoiceOver should
present the completed removal and remaining count, then identify a connected
focus target without conflicting Person 3/Person 4 context. Exact phrase order
may vary, but the outcome and current location must both be understandable.

**Next validation:** Re-run the basic, addon-disabled middle-removal,
addon-enabled middle-removal, and last-item-removal cases with captions or
audio captured for at least seven seconds after activation. Do not introduce
`role="alert"`, an assertive live region, duplicate focus descriptions, or a
browser-specific timing workaround without comparative assistive-technology
evidence.

For every completed session, record the component commit or build identifier;
screen-reader, browser, and operating-system versions; speech verbosity or
rotor/browse-mode settings that affect group output; exact observed wording or
an accurate paraphrase; failures; fixes; retest outcome; and remaining
limitations. Do not normalize an observed phrase into a claim about every
screen-reader configuration.

## WCAG evidence map

This is a traceability map, not a conformance determination. The listed
criteria are likely relevant to the scenario; a **Manual verification required**
status means the automated suite cannot establish the user-facing outcome.

| Scenario | Likely WCAG relevance | Current evidence | Manual observation needed |
| --- | --- | --- | --- |
| `A11Y-SR-005-01` | 1.3.1 Info and Relationships; 2.4.6 Headings and Labels; 4.1.2 Name, Role, Value | Strong structural DOM tests for fieldset, legend, and labels; manual verification required | Group/legend context and distinct Remove-button context for Contact 1. |
| `A11Y-SR-005-02` | 1.3.1 Info and Relationships; 2.4.3 Focus Order; 4.1.3 Status Messages | Strong DOM tests for template materialization, focus target, and status text; manual verification required | Contact 2 context, focus timing, and whether the polite update conflicts with focus speech. |
| `A11Y-SR-005-03` | 2.1.1 Keyboard; 2.4.3 Focus Order; 4.1.3 Status Messages | Strong DOM tests for removal focus planning, limits, and status text; manual verification required | Focus recovery before detachment, remaining-group context, and minimum-state feedback. |
| `A11Y-SR-005-04` | 1.3.1 Info and Relationships; 1.3.2 Meaningful Sequence; 2.5.1 Pointer Gestures | Native DOM order and button controls are automated evidence; manual verification required | Touch-exploration and swipe order, labels, and post-change reachable context. |
| `A11Y-SR-006-01` | 1.3.1 Info and Relationships; 2.4.6 Headings and Labels; 3.3.2 Labels or Instructions; 4.1.2 Name, Role, Value | Strong DOM assertions for supported tokenized references; manual verification required | Computed name/description sources and platform exposure of `list`, `aria-controls`, and `headers`. |
| `A11Y-SR-LS-01` | 1.3.1 Info and Relationships; 2.4.6 Headings and Labels; 4.1.2 Name, Role, Value | DOM tests verify the dedicated target, preserved generic label/position, and committed timing; manual verification required | Whether and when the updated fieldset name is exposed while focus remains inside the item. |
| `A11Y-SR-LS-02` | 2.4.3 Focus Order; 4.1.2 Name, Role, Value; 4.1.3 Status Messages | DOM tests verify one core status region, one structural message, no source value in status, and no addon focus move; manual verification required | Interaction among Add focus speech, the new legend name, and the one polite core message. |
| `A11Y-SR-RG-01` | 2.1.1 Keyboard; 2.4.3 Focus Order; 2.4.6 Headings and Labels; 3.3.6 Error Prevention (All); 4.1.2 Name, Role, Value; 4.1.3 Status Messages | DOM tests verify request/command separation, denial, asynchronous approval, stale-target and minimum revalidation, coalescing, and one completed lifecycle event; manual verification required | Dialog name and description, initial and restored focus, denial and approval clarity, Escape behavior, and interaction with the one core removal message. |
| `A11Y-SR-AR-01` | 1.3.2 Meaningful Sequence; 2.1.1 Keyboard; 2.4.3 Focus Order; 2.4.6 Headings and Labels; 4.1.3 Status Messages | DOM tests verify native buttons, adjacent DOM/registry order, stable identity, focus preservation, core messages, typed boundaries, and one completed event; manual verification required | Move-button names, preserved focus and group context, new-position speech, understandable start/end feedback, and absence of duplicate output. |
| `A11Y-SR-DI-01` | 1.3.1 Info and Relationships; 2.1.1 Keyboard; 2.4.3 Focus Order; 2.4.6 Headings and Labels; 3.3.2 Labels or Instructions; 4.1.3 Status Messages | DOM tests verify native controls, template-first identity, explicit copied current state, hard exclusions, focus, one status update, and one completed event; manual verification required | Duplicate-button name, new-group context and focus, understandable source/new-position message, excluded-field expectations, and absence of duplicate output. |
| `A11Y-SR-FM-01` | 2.1.1 Keyboard; 2.4.3 Focus Order; 3.3.6 Error Prevention (All); 4.1.3 Status Messages | DOM tests verify explicit decision controls, structure-before-values order, server-item preservation, quiet initialization, one application restore outcome, and clear-without-form-deletion behavior; manual verification required | Restore-choice clarity, keyboard focus after the decision, restored group context, absence of competing output, clear-draft confirmation, and understandable storage/failure recovery. |
| `A11Y-VIS-007-01` | 2.3.3 Animation from Interactions | Basic Add/Remove passed with Chrome 151 reduced-motion emulation on macOS 26.6.2; static stylesheet inspection shows no structural animation or transition | Repeat in additional browsers or user-configured environments if broader evidence is needed. |
| `A11Y-VIS-007-02` | 1.4.1 Use of Color; 1.4.10 Reflow; 1.4.11 Non-text Contrast; 2.4.7 Focus Visible | CSS declares system-color and forced-colors rules; a Chrome 151 headless check at 320 CSS pixels on macOS found right-edge clipping in the documentation shell | Fix and retest 320 CSS-pixel reflow; verify focus, boundaries, disabled state, 400% zoom, and Windows forced colors. |
| `A11Y-KBD-005-01` | 2.1.1 Keyboard; 2.4.3 Focus Order; 2.4.7 Focus Visible | Core Add/Remove order and focus targets passed in Safari 26.6.2, Chrome 151, and Firefox 154 on macOS; Safari required Option-Tab under the current keyboard-navigation preference | Visually verify the rendered focus indicator and repeat with target screen readers. |

## Test data

Use these values to make the group boundary and visible position easy to
recognize without disclosing real data:

- server item key: `server-42`; visible legend: `Contact 1`
- generated item key: `item-1`; visible legend: `Contact 2`
- field label: `Name`
- example values: `Ada` and `Grace`
- Legend Sync committed value: `Maria`; explicit empty text: `name not entered`
- Remove Guard meaningful saved value: `Ada Lovelace`; blank generated value:
  empty string
- Accessible Reorder keys: `address-home` and `address-work`; keep their
  tokenized input names unchanged while visible positions swap
- Duplicate Item source key: `server-42`; copied Name: `Ada`; hidden ID `42`,
  password, and file input remain excluded; new key is fresh and not spoken
- Form Memory saved keys: `draft-7`, `server-42`; saved names: `Grace Hopper`,
  `Ada Lovelace`; current server value: `Current server value`

The stable keys are diagnostic data only. They are not required to be spoken,
and the component must not add them to legend text or accessible names.

## Screen-reader scenarios

### Scenario ID: A11Y-SR-005-01 — Enter and understand the server-rendered group

**Area:** Existing item fieldset and legend

**Mode:** Screen reader with keyboard

**Priority:** Critical

**User goal:** Understand which repeated contact group contains the Name field
before editing it.

**Setup:** Load the fixture with one server-rendered item. Start the screen
reader in its normal browse/virtual-cursor mode and then use its form-control
navigation mode where applicable.

**Steps:**

1. Read from immediately before the first contact fieldset into its `Name`
   control.
2. Navigate backward and forward across the fieldset boundary with the
   screen reader's normal reading and form-control commands.
3. Focus the `Name` input and then the item Remove button.

**Expected result:**

- The item is exposed as a native group/fieldset with the meaningful legend
  `Contact 1`; exact phrase order varies by screen reader and verbosity.
- The `Name` control retains its visible label and is understandable as part
  of Contact 1 without adding a redundant `aria-label` or role.
- The Remove control has its authored accessible name and is not confused with
  a control belonging to another item.

**Failure signs:**

- No group or legend context is announced where the platform normally exposes
  fieldset semantics.
- The group is announced as an unnamed or empty region.
- The Name control lacks its label, is associated with a wrong item, or gains
  redundant/conflicting group text.

**Notes / likely files:**

- [MARKUP_AND_ACCESSIBILITY_CONTRACT.md](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/MARKUP_AND_ACCESSIBILITY_CONTRACT.md)
- [src/discovery.ts](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/src/discovery.ts)
- [test/helpers/create-markup.ts](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/test/helpers/create-markup.ts)

### Scenario ID: A11Y-SR-005-02 — Understand a generated group and Add focus

**Area:** Template materialization, legend position, and post-Add focus

**Mode:** Screen reader with keyboard

**Priority:** Critical

**User goal:** Add another contact and immediately understand where input focus
landed.

**Setup:** Begin with the server-rendered Contact 1 item, with the user focus
on the author-owned Add button.

**Steps:**

1. Activate Add with the keyboard.
2. Listen to the next focused item and, if enabled, the one polite structural
   announcement.
3. Use the screen reader's item and form-control navigation to review the new
   fieldset, `Contact 2` legend, Name label, and Remove button.
4. Move between Contact 1 and Contact 2 and confirm their legends remain
   distinct.

**Expected result:**

- A native second fieldset is exposed with the meaningful legend `Contact 2`.
- The focused target is the documented explicit marker or first eligible
  labelable control; focus does not remain in detached template content.
- Group and field labels are comprehensible without speaking the stable key or
  duplicated legend text on every navigation command.
- At most one polite structural update is presented by the core for the Add.

**Failure signs:**

- The generated group has no legend, repeats `Contact 1`, or exposes a stale
  template token.
- Focus is lost, lands on an unrelated control, or cannot be identified by the
  screen reader.
- Repeated or assertive announcements obscure the focused form control.

**Notes / likely files:**

- [src/template.ts](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/src/template.ts)
- [src/positions.ts](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/src/positions.ts)
- [src/focus.ts](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/src/focus.ts)
- [src/status.ts](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/src/status.ts)

### Scenario ID: A11Y-SR-005-03 — Remove focused Contact 2 and recover context

**Area:** Legend/position synchronization and post-Remove focus

**Mode:** Screen reader with keyboard

**Priority:** Critical

**User goal:** Remove the active second contact without losing context or
keyboard focus.

**Setup:** Create Contact 2, then focus a control or its Remove button inside
Contact 2.

**Steps:**

1. Activate Contact 2's Remove button.
2. Listen to the resulting focus target and the status message, if enabled.
3. Navigate through the remaining Contact 1 group and its controls.
4. Attempt another removal at the minimum to confirm the disabled native
button does not act as an available command.

**Expected result:**

- Focus resolves to the documented next/previous Remove, Add, or intentional
  root fallback before the active item becomes unavailable.
- The removed Contact 2 group is no longer exposed after successful removal.
- The remaining group keeps its correct `Contact 1` legend and associated
  controls; stable names/keys are not renumbered or announced as positions.
- The minimum boundary is understandable through native disabled semantics and
  one polite completed-operation message where applicable.

**Failure signs:**

- Virtual cursor or focus remains in a detached group.
- The remaining Contact 1 group is unnamed, renumbered incorrectly, or loses
  the Name label.
- A disabled Remove button can still activate or routine feedback uses an
  assertive alert.

**Notes / likely files:**

- [src/instance.ts](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/src/instance.ts)
- [src/focus.ts](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/src/focus.ts)
- [src/constraints.ts](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/src/constraints.ts)

### Scenario ID: A11Y-SR-005-04 — Complete the same flow with TalkBack touch navigation

**Area:** Native fieldset/legend grouping on mobile

**Mode:** TalkBack + Chrome, touch exploration and swipe navigation

**Priority:** High

**User goal:** Identify, add, edit, and remove repeated contacts without a
keyboard.

**Setup:** Android device with TalkBack and Chrome. Use the same server item
and template data, preferably at a narrow viewport.

**Steps:**

1. Swipe through Contact 1's legend, Name control, and Remove button.
2. Double-tap Add, then swipe through the generated Contact 2 controls.
3. Double-tap Contact 2 Remove and confirm the next reachable focus/context.

**Expected result:**

- Touch exploration and swipe order follow natural DOM order.
- Group/legend context, control labels, and button names remain
  understandable for both existing and generated items.
- The same Add/Remove flow remains operable without drag-only interactions.

**Failure signs:**

- Contact identity or field labels are lost after a structural change.
- Touch navigation reaches hidden template or disabled controls as if they are
  active commands.
- The component requires a keyboard-only interaction to complete the flow.

**Notes / likely files:** Same semantic and focus modules as the desktop
scenarios; no mobile-specific ARIA is expected.

### Scenario ID: A11Y-SR-006-01 — Inspect generated control labels and descriptions

**Area:** Tokenized `for`, `aria-labelledby`, `aria-describedby`,
`aria-controls`, `list`, and `headers` references

**Mode:** Screen reader and browser accessibility tree inspection

**Priority:** Critical

**User goal:** Understand the Name control's visible label and its local and
external descriptions after the item is generated, without losing those
relationships after another item is removed.

**Setup:** Use a fixture whose template includes one explicit `<label>` and a
tokenized local label, description, controlled panel, datalist, and table
header. Include an author-owned external label and description outside the
template. Add Contact 2 before inspecting it.

**Steps:**

1. Inspect the generated Name control in the browser accessibility tree and
   note its computed name and description sources.
2. Read the same control with the screen reader's form-control navigation.
3. Confirm the explicit label and both the external and local descriptive
   sources are available without duplicating the stable key in spoken text.
4. Inspect the generated datalist relationship, controlled panel reference,
   and table-cell header association where the browser exposes them.
5. Remove Contact 2, then confirm its local IDs are gone while the external
   author-owned label and description remain available to the server item.

**Expected result:**

- Generated attributes reference the `item-1` local IDs, while unrelated
  external IDs remain unchanged.
- The visible Name label continues to name the generated control. Local and
  external description text is exposed according to the browser/AT's normal
  naming and description computation; exact spoken concatenation varies.
- `list`, `aria-controls`, and `headers` retain their intended generated local
  references when exposed by the platform.
- Removing the generated fieldset removes only its local IDs and never
  rewrites, removes, or steals the author-owned external references.

**Failure signs:**

- A generated `for` or ID-reference still contains
  `__A11Y_REPEATABLE_KEY__`, points to Contact 1, or resolves to no local
  element.
- The Name input loses its visible label, has a duplicated/incorrect name, or
  exposes description text from another item.
- Removing Contact 2 removes an external author element or damages Contact 1's
  IDs, names, labels, or descriptions.

**Notes / likely files:**

- [src/template.ts](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/src/template.ts)
- [test/label-references.test.ts](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/test/label-references.test.ts)
- [MARKUP_AND_ACCESSIBILITY_CONTRACT.md](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/MARKUP_AND_ACCESSIBILITY_CONTRACT.md)

### Scenario ID: A11Y-SR-LS-01 — Commit a name and revisit the fieldset

**Area:** Legend Sync accessible-name update timing

**Mode:** Screen reader with keyboard

**Priority:** High

**User goal:** Rename one contact and distinguish that fieldset later without
hearing unstable legend changes on every keystroke.

**Setup:** Use the packaged Legend Sync addon with the Name input as the
explicit source, the dedicated direct-legend suffix as target,
`updateOn: "change"`, and `emptyText: ""`. Begin with `Contact 3` and focus the
Name input.

**Steps:**

1. Type `Maria` without moving focus and note whether the legend stays
   `Contact 3`.
2. Move focus to the next control to commit the change.
3. Navigate away from and back into the fieldset using the screen reader's
   normal group and form-control commands.
4. Clear the Name value, commit again, and revisit the fieldset.

**Expected result:**

- Typing does not rewrite the legend on every keystroke.
- After committed change, the visible legend is `Contact 3 — Maria`; the
  generic label and position remain present and stable.
- After committing the empty value, the dedicated suffix is empty and the
  legend remains `Contact 3`.
- Focus is never moved to force speech, and no live-region announcement is
  created by Legend Sync.
- Exact immediate speech is recorded as observed, not assumed. It is
  acceptable for the new name to be exposed only when the group is next
  encountered if the interaction remains understandable.

**Failure signs:** The position or generic label disappears; the name changes
on every keystroke; focus moves unexpectedly; the value is announced through
a second live region; or a different item's legend changes.

### Scenario ID: A11Y-SR-LS-02 — Add a named item without duplicate structural output

**Area:** Legend Sync with core Add focus and status timing

**Mode:** Screen reader with keyboard

**Priority:** High

**User goal:** Add a contact, enter a distinguishing name, and understand the
new group without duplicate structural announcements.

**Setup:** Use the same addon with core structural announcements enabled and
the template empty state `name not entered`.

**Steps:**

1. Activate Add and record focus output and the core polite structural message.
2. Confirm the new fieldset is `Contact 4 — name not entered`.
3. Enter `Maria`, commit the change, and review the legend.
4. Inspect the page for live regions and repeat the change once.

**Expected result:**

- Add produces at most the one core structural status message and the normal
  focus output; the status message contains no selected Name value.
- Legend Sync creates no second status or alert region and moves no focus.
- The committed legend becomes `Contact 4 — Maria` once, while the stable key,
  control names, and visible position remain separate.

**Failure signs:** Two live updates describe the Add; `Maria` appears in core
status text; focus moves on legend change; an assertive alert appears; or the
stable key/name changes with the visible legend.

**Notes / likely files:**

- [LEGEND_SYNC.md](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/LEGEND_SYNC.md)
- [src/addons/legend-sync.ts](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/src/addons/legend-sync.ts)
- [test/legend-sync.test.ts](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/test/legend-sync.test.ts)
- [docs/realistic-multi-person.html](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/docs/realistic-multi-person.html)

### Scenario ID: A11Y-SR-RG-01 — Confirm or deny a meaningful removal

**Area:** Remove Guard application-dialog accessibility and core focus handoff

**Mode:** Screen reader with keyboard or touch navigation

**Priority:** Critical

**User goal:** Avoid accidentally removing a saved contact, then deliberately
approve the removal and remain oriented in the form.

**Setup:** Use the Remove Guard demo with saved value `Ada Lovelace`, minimum
zero, core structural announcements enabled, and the application-owned native
dialog. The explicit policy inspects only the deliberately marked Name input.

**Steps:**

1. Activate Remove for the saved contact and inspect the dialog's name,
   description, controls, and initial focus.
2. Choose Keep contact. Repeat the request and dismiss it with Escape when the
   platform supports that native-dialog action.
3. Confirm that the saved item and its value remain present after both denials.
4. Request removal again and choose Remove contact.
5. Record focus after detachment and the core polite structural message.
6. Add a blank contact and activate its Remove button.

**Expected result:**

- The dialog is exposed as a modal dialog with the visible title and
  description, and initial focus lands on the non-destructive Keep contact
  action.
- Keep contact and Escape deny the request without cleanup, detachment, a
  success lifecycle event, or a core structural announcement. Focus returns
  to a sensible connected control; record the exact platform behavior.
- Approval removes the still-owned item once. Core removal focus recovery and
  one completed structural message occur only after approval.
- The blank item removes immediately because explicit application policy says
  confirmation is unnecessary; the addon never infers sensitive state.
- Exact speech and timing are recorded as observations rather than generalized
  to other browser and assistive-technology combinations.

**Failure signs:** An ambiguous or unnamed dialog; initial focus on the
destructive action; focus behind the modal; denial removes or cleans up the
item; approval removes twice; the dialog and core both announce the structural
change; focus is lost after approved removal; or a blank item is treated as if
the addon had inspected unspecified fields.

**Notes / likely files:**

- [REMOVE_GUARD.md](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/REMOVE_GUARD.md)
- [src/addons/remove-guard.ts](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/src/addons/remove-guard.ts)
- [test/remove-guard.test.ts](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/test/remove-guard.test.ts)
- [docs/addons.html](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/docs/addons.html)

### Scenario ID: A11Y-SR-AR-01 — Move an item and confirm stable context

**Area:** Native adjacent reorder controls, focus, sequence, and status

**Mode:** Screen reader browse/forms mode plus keyboard; repeat with touch
navigation where available

**Priority:** High

**User goal:** Change address order without losing the active control, item
identity, or an understandable report of the result.

**Setup:** Use the Accessible Reorder demo with `address-home` followed by
`address-work`. Confirm one core polite status region and no addon live region.

**Steps:**

1. Focus Address 2’s Move up button and activate it.
2. Confirm focus remains on that same button and revisit the fieldset legend
   and input.
3. Confirm the new position message and inspect that the stable key/input name
   did not change.
4. Activate Move up again at the start boundary.
5. Confirm understandable boundary feedback, no position change, and no lost
   focus or duplicate announcement.

**Expected result:** Native button names communicate direction; DOM reading
order and visible positions agree; focus remains valid; one polite core message
reports completion or boundary; the boundary emits no completed Move event;
stable identity and entered values remain unchanged.

**Failure signs:** Focus jumps or disappears, a button becomes disabled while
focused, names or keys are renumbered, DOM and spoken order disagree, values
move to another identity, or addon/core produce competing messages.

**Notes / likely files:**

- [ACCESSIBLE_REORDER.md](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/ACCESSIBLE_REORDER.md)
- [src/addons/accessible-reorder.ts](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/src/addons/accessible-reorder.ts)
- [test/accessible-reorder.test.ts](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/test/accessible-reorder.test.ts)
- [docs/addons.html](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/docs/addons.html)

### Scenario ID: A11Y-SR-DI-01 — Duplicate selected state into a fresh item

**Area:** Native Duplicate control, new-group focus, privacy exclusions, and
status timing

**Mode:** Screen reader browse/forms mode plus keyboard; repeat with touch
navigation where available

**Priority:** High

**User goal:** Reuse deliberately selected contact information without
copying server identity, credentials, files, or validation errors, and remain
oriented in the newly created group.

**Setup:** Use `duplicate-item.html` with the saved `server-42` contact. Confirm
one core polite status region, explicit copy labels, and no addon live region.

**Steps:**

1. Change the marked Name, preferred-contact, checkbox, and Notes controls.
2. Leave the hidden ID, password, and file controls present but unmarked.
3. Focus and activate Duplicate contact.
4. Record focus output, fieldset/legend context, and the one polite structural
   message.
5. Inspect the new item: compare copied controls, excluded controls, names,
   fresh key, and visible position.
6. Reset the form and confirm copied controls return to trusted-template
   defaults rather than source-time values.

**Expected result:** The native button has an understandable visible name;
focus moves through the documented Add order into the new fieldset; one polite
message identifies source and new positions without values; marked supported
current state is present before validation/addon setup; hidden ID, password,
file, server errors, and validity state are absent; stable names use the new
key; reset uses template defaults; one `item-duplicated` and no `item-added`
event describes the action.

**Failure signs:** A live fieldset or server key is cloned; file/password/
hidden/error state appears in the duplicate; focus stays on a newly disabled
button, disappears, or enters the source; names/IDs collide; two structural
messages occur; event output includes values; or reset adopts copied values as
defaults.

**Notes / likely files:**

- [DUPLICATE_ITEM.md](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/DUPLICATE_ITEM.md)
- [src/addons/duplicate-item.ts](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/src/addons/duplicate-item.ts)
- [test/duplicate-item.test.ts](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/test/duplicate-item.test.ts)
- [docs/duplicate-item.html](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/docs/duplicate-item.html)

### Scenario ID: A11Y-SR-FM-01 — Decide whether to restore a saved repeatable structure

**Area:** Restore consent, structure-before-values ordering, focus, status, and
clear-saved-data recovery

**Mode:** Screen reader with keyboard or touch navigation

**Priority:** Critical

**User goal:** Understand that a saved draft exists, choose whether to restore
it, find the restored contact groups, and clear the saved draft without
deleting current form entries.

**Setup:** Use `form-memory-integration.html` with its page-local sample record.
Begin before enhancement with the server-rendered item still usable.

**Steps:**

1. Navigate to the restore decision and review both native button names.
2. Choose Restore sample draft and record focus, status output, and the order
   of the restored `draft-7` and current `server-42` fieldsets.
3. Review both legends, Name labels, and restored values; add one item and
   confirm only core reports the structural Add.
4. Activate Clear in-memory sample draft and confirm current fieldsets and
   values remain present.
5. Reload and repeat with Keep current form, then review the server value and
   absence of the missing saved item.

**Expected result:** Both choices are keyboard and touch operable; preparation
initializes quietly without an item-added announcement; the application
reports the completed restore decision once; restored values appear only after
their matching fieldsets exist; normal Add uses one core status message; clear
reports the storage decision without removing form data; and focus remains on
a connected, understandable control throughout.

**Failure signs:** The choice is unnamed or unavailable without a pointer;
focus is lost when setup controls disappear; a missing field value is skipped
because structure was late; initialization is announced as a user Add; clear
removes current form fields; core and application produce competing structural
messages; or storage/privacy failure leaves no recovery path.

**Notes / likely files:**

- [FORM_MEMORY_BRIDGE.md](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/FORM_MEMORY_BRIDGE.md)
- [src/addons/form-memory-bridge.ts](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/src/addons/form-memory-bridge.ts)
- [test/form-memory-bridge.test.ts](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/test/form-memory-bridge.test.ts)
- [docs/form-memory-integration.html](/Users/vasilis/Documents/GitHub/A11y-Repeatable-Fieldset/docs/form-memory-integration.html)

## Visual-preference scenarios

### Scenario ID: A11Y-VIS-007-01 — Reduced-motion structural changes

**Area:** Optional CSS motion behavior

**Mode:** Desktop browser with `prefers-reduced-motion: reduce` enabled

**Steps:**

1. Load the enhanced form with the preference enabled.
2. Activate Add and Remove with native keyboard controls.
3. Repeat with the preference disabled.

**Expected result:** Add and Remove remain immediate structural changes in both
modes. No required information, focus movement, or announcement depends on
motion; the current stylesheet declares no animation or transition properties.

### Scenario ID: A11Y-VIS-007-02 — Forced colors, focus, and reflow

**Area:** Optional CSS boundaries and native controls

**Mode:** Windows forced colors/high contrast, then 400% browser zoom or a
320 CSS-pixel viewport

**Steps:**

1. Tab to Add and Remove controls and inspect the visible focus outline.
2. Check fieldset boundaries, disabled Remove state at the minimum, and status
   text utility behavior.
3. Narrow or zoom the viewport and verify controls wrap without horizontal
   clipping.

**Expected result:** Borders, focus outlines, and disabled state stay
distinguishable without relying on authored colors alone. Controls remain
operable, readable, and wrapped within the component width.

## Keyboard corroboration

### Scenario ID: A11Y-KBD-005-01 — Verify fieldset order and visible focus without a screen reader

**Area:** Existing/generated fieldsets and native controls

**Mode:** Keyboard

**Priority:** High

**User goal:** Traverse repeated form groups in natural DOM order.

**Setup:** Any supported desktop browser with a visible focus indicator.

**Steps:**

1. Tab through Contact 1, Add, and the generated Contact 2 controls.
2. Activate Add and Remove with Enter and Space.
3. Check that disabled Remove buttons at the minimum are skipped by normal Tab
   navigation and that focus remains visible after removal.

**Expected result:** Native controls follow DOM order; no extra fieldset tab
stops or positive `tabindex` values appear; focus never remains in detached
content.

**Failure signs:** Unexpected focus stops, hidden template controls in the tab
order, a lost focus indicator, or focus in removed DOM.

## Completion criteria for A11Y-005

- [ ] Record at least one observed server-item result for every available
  target environment.
- [ ] Record one generated-item Add result and one focused-item Remove result
  for every available desktop target.
- [ ] Record one generated-control accessible-name/description inspection for
  every available target, including what the platform exposes for local and
  external references.
- [ ] Record committed nonempty and empty Legend Sync results, including
  whether the changed fieldset name is spoken immediately or only when
  revisited.
- [ ] Record Add focus plus core status behavior with Legend Sync enabled and
  confirm whether any duplicate output occurs.
- [ ] Record Remove Guard dialog naming, description, initial focus, denial,
  Escape, approval, post-removal focus, and interaction with the one core
  structural message.
- [ ] Preserve exact observed wording or an accurate paraphrase, along with
  environment versions and relevant verbosity settings.
- [ ] Record failures, fixes, retest outcomes, and unresolved limitations.
- [ ] Update public documentation only with claims directly supported by the
  completed ledger.

## Current limitation

This record is a reproducible execution plan, not a completed accessibility
assessment. The package remains without recorded NVDA, VoiceOver, or TalkBack
evidence; it makes no universal fieldset/legend or WCAG conformance claim.
