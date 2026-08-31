import { createRepeatableFieldset } from "./a11y-repeatable-fieldset.js";
import { createAccessibleReorder } from "./accessible-reorder.js";

const root = document.querySelector(
  "#accessible-reorder-demo-form [data-a11y-repeatable-fieldset]"
);

if (root instanceof HTMLElement) {
  createRepeatableFieldset(root, {
    addons: [createAccessibleReorder()]
  });
}
