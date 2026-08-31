import { createRepeatableFieldset } from "./a11y-repeatable-fieldset.js";
import { createLegendSyncAddon } from "./legend-sync.js";

const root = document.querySelector("#people-root");

if (root instanceof HTMLElement) {
  createRepeatableFieldset(root, {
    addons: [
      createLegendSyncAddon({
        source: "[data-a11y-repeatable-fieldset-legend-source]",
        target: "[data-a11y-repeatable-fieldset-legend-value]",
        updateOn: "change",
        emptyText: "name not entered"
      })
    ]
  });
}
