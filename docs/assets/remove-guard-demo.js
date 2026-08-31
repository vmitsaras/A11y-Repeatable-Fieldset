import { createRepeatableFieldset } from "./a11y-repeatable-fieldset.js";
import { createRemoveGuard } from "./remove-guard.js";

const root = document.querySelector(
  "#remove-guard-demo-form [data-a11y-repeatable-fieldset]"
);
const dialog = document.querySelector("#remove-guard-dialog");
const cancelButton = document.querySelector("#remove-guard-cancel");
const errorOutput = document.querySelector("#remove-guard-demo-error");

if (
  !(root instanceof HTMLElement) ||
  !(dialog instanceof HTMLDialogElement) ||
  !(cancelButton instanceof HTMLButtonElement) ||
  !(errorOutput instanceof HTMLElement)
) {
  throw new Error("The Remove Guard demo markup is incomplete.");
}

function hasMeaningfulName(item) {
  const input = item.element.querySelector(
    "input[data-remove-guard-meaningful]"
  );

  return input instanceof HTMLInputElement && input.value.trim() !== "";
}

function confirmRemoval() {
  return new Promise((resolve, reject) => {
    const settle = () => {
      dialog.removeEventListener("close", settle);
      resolve(dialog.returnValue === "remove");
    };

    dialog.addEventListener("close", settle);

    try {
      dialog.showModal();
      cancelButton.focus();
    } catch (error) {
      dialog.removeEventListener("close", settle);
      reject(error);
    }
  });
}

createRepeatableFieldset(root, {
  addons: [
    createRemoveGuard({
      shouldConfirm({ item }) {
        return hasMeaningfulName(item);
      },
      confirm() {
        return confirmRemoval();
      },
      onError(error) {
        errorOutput.hidden = false;
        errorOutput.textContent =
          error instanceof Error
            ? `Removal was not attempted: ${error.message}`
            : "Removal was not attempted because confirmation failed.";
      }
    })
  ]
});
