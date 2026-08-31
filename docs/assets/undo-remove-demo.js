import {
  EVENTS,
  createRepeatableFieldset
} from "./a11y-repeatable-fieldset.js";
import { createUndoRemove } from "./undo-remove.js";

const form = document.querySelector("#undo-remove-demo-form");
const root = form?.querySelector("[data-a11y-repeatable-fieldset]");
const eventOutput = document.querySelector("#undo-remove-event-output");

if (
  form instanceof HTMLFormElement &&
  root instanceof HTMLElement
) {
  createRepeatableFieldset(root, {
    addons: [
      createUndoRemove({
        buttonLabel: "Undo last removal",
        expiryMs: 30_000
      })
    ]
  });

  root.addEventListener(EVENTS.itemRestored, (event) => {
    if (
      !(event instanceof CustomEvent) ||
      !(eventOutput instanceof HTMLElement)
    ) {
      return;
    }

    const {
      key,
      previousPosition,
      position,
      count
    } = event.detail;
    eventOutput.textContent = JSON.stringify(
      { key, previousPosition, position, count },
      null,
      2
    );
  });
}
