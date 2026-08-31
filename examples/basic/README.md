# Basic example

This example demonstrates one server-rendered fieldset enhanced explicitly
with Add and Remove controls. It imports the readable ESM build and optional
stylesheet from `../../dist`; it does not use a framework, CDN, or browser
global.

## Run locally

From the repository root:

```bash
npm run build
python3 -m http.server 4173
```

Then open
`http://127.0.0.1:4173/examples/basic/index.html`.

The static form action is illustrative and no server-side submission handler
is included.

## Progressive enhancement

Before JavaScript initializes, the existing contact, label, value, name, and
submit button remain usable. The template is inert, and enhancement-only Add
and Remove buttons are hidden. After successful initialization, the plugin
discovers the existing fieldset in place, reveals the native buttons, and
synchronizes their disabled states with the one-to-three item limits.

## Keyboard and focus

- Use Tab and Shift+Tab to move through native controls in DOM order.
- Use Enter or Space to activate a focused Add or Remove button.
- Add moves focus to the marked Name input in the new fieldset.
- Removing the focused item uses the documented next, previous, Add, and
  intentional-root fallback order.

## Evidence boundary

The repository's automated tests cover structure, identity, focus targets,
status text, events, and cleanup. They do not prove screen-reader speech,
focus scrolling, zoom/reflow, forced-colors presentation, touch behavior, or
browser autofill. Those outcomes remain part of the manual accessibility
record and must not be inferred from this example alone.
