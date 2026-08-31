import {
  EVENTS,
  createRepeatableFieldset
} from "./a11y-repeatable-fieldset.js";
import { createDuplicateItem } from "./duplicate-item.js";

const form = document.querySelector("#duplicate-item-demo-form");
const root = form?.querySelector("[data-a11y-repeatable-fieldset]");
const eventOutput = document.querySelector("#duplicate-item-event-output");

if (
  form instanceof HTMLFormElement &&
  root instanceof HTMLElement
) {
  createRepeatableFieldset(root, {
    addons: [
      createDuplicateItem({
        buttonLabel: "Duplicate contact"
      })
    ]
  });

  root.addEventListener(EVENTS.itemDuplicated, (event) => {
    if (!(event instanceof CustomEvent) || !(eventOutput instanceof HTMLElement)) {
      return;
    }

    const { key, position, sourceKey, sourcePosition, count } = event.detail;
    eventOutput.textContent = JSON.stringify(
      { key, position, sourceKey, sourcePosition, count },
      null,
      2
    );
  });
}
