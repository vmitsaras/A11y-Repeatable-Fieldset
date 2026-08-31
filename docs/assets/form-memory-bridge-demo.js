import { createRepeatableFieldset } from "./a11y-repeatable-fieldset.js";
import { createFormMemoryBridge } from "./form-memory-bridge.js";

const form = document.querySelector("#form-memory-demo-form");
const root = document.querySelector("#form-memory-demo-root");
const setup = document.querySelector("#form-memory-demo-setup");
const unavailable = document.querySelector("#form-memory-demo-unavailable");
const actions = document.querySelector("#form-memory-demo-actions");
const restoreButton = document.querySelector("#form-memory-demo-restore");
const currentButton = document.querySelector("#form-memory-demo-current");
const clearButton = document.querySelector("#form-memory-demo-clear");
const outcome = document.querySelector("#form-memory-demo-outcome");
const snapshotOutput = document.querySelector("#form-memory-demo-snapshot");

if (
  !(form instanceof HTMLFormElement) ||
  !(root instanceof HTMLElement) ||
  !(setup instanceof HTMLElement) ||
  !(unavailable instanceof HTMLElement) ||
  !(actions instanceof HTMLElement) ||
  !(restoreButton instanceof HTMLButtonElement) ||
  !(currentButton instanceof HTMLButtonElement) ||
  !(clearButton instanceof HTMLButtonElement) ||
  !(outcome instanceof HTMLElement) ||
  !(snapshotOutput instanceof HTMLElement)
) {
  throw new Error("The Form Memory Bridge demo markup is incomplete.");
}

const fieldKey = "demo:contacts:structure";
const adapterId = "a11y-repeatable-fieldset.form-memory-bridge.v1";
const savedNames = new Map([
  ["draft-7", "Grace Hopper"],
  ["server-42", "Ada Lovelace"]
]);
let sampleRecord = {
  fields: [
    {
      adapterId,
      fieldKey,
      kind: "custom",
      value: {
        schemaVersion: 1,
        itemKeys: ["draft-7", "server-42"]
      }
    }
  ]
};
let bridge;

function renderSnapshot(message) {
  snapshotOutput.textContent = sampleRecord === undefined
    ? "No in-memory sample draft."
    : JSON.stringify(sampleRecord.fields[0]?.value ?? null, null, 2);

  if (message !== undefined) {
    outcome.textContent = message;
  }
}

bridge = createFormMemoryBridge({
  root,
  fieldKey,
  createInstance: createRepeatableFieldset,
  save() {
    const value = bridge.draftControlAdapter.read(root, {
      element: root,
      root: form
    });
    sampleRecord = {
      fields: [
        {
          adapterId,
          fieldKey,
          kind: "custom",
          value
        }
      ]
    };
    renderSnapshot();
  },
  onSaveError() {
    outcome.textContent = "The in-memory structural snapshot could not be updated.";
  }
});

function initialize(restoreSample) {
  const record = restoreSample ? sampleRecord : undefined;
  const result = bridge.initialize({
    ...(record === undefined ? {} : { record }),
    repeatableFieldsetOptions: {
      minimum: 0,
      maximum: 4,
      itemLabel: "Contact"
    }
  });

  if (!result.ok) {
    outcome.textContent = `The sample structure was not used (${result.reason}).`;
    return;
  }

  if (restoreSample && record !== undefined) {
    const customField = record.fields[0];

    if (customField?.value !== undefined) {
      bridge.draftControlAdapter.write(root, customField.value, {
        element: root,
        root: form
      });
    }

    for (const item of result.instance.getItems()) {
      const input = item.element.querySelector("input");
      const savedName = savedNames.get(item.key);

      if (input instanceof HTMLInputElement && savedName !== undefined) {
        input.value = savedName;
      }
    }
  }

  setup.hidden = true;
  clearButton.hidden = false;
  renderSnapshot(
    restoreSample
      ? `Sample draft restored. ${result.addedKeys.length} missing fieldset was prepared before initialization.`
      : "Current server form kept. No sample draft values were restored."
  );
}

restoreButton.addEventListener("click", () => initialize(true), { once: true });
currentButton.addEventListener("click", () => initialize(false), { once: true });
clearButton.addEventListener("click", () => {
  sampleRecord = undefined;
  savedNames.clear();
  renderSnapshot("The in-memory sample draft was cleared. Current form fields were kept.");
});

unavailable.remove();
actions.hidden = false;
renderSnapshot();
