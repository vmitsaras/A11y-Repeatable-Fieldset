import {
  EVENTS,
  createRepeatableFieldset
} from "./a11y-repeatable-fieldset.js";

function textNumber(target, value) {
  if (target instanceof HTMLElement) {
    target.textContent = String(value);
  }
}

const templateRoot = document.querySelector("#template-failure-root");
const templateButton = document.querySelector("#template-attempt");
const templateResult = document.querySelector("#template-result");
const templateItemCount = document.querySelector("#template-item-count");
const templateEventCount = document.querySelector("#template-event-count");

if (
  templateRoot instanceof HTMLElement &&
  templateButton instanceof HTMLButtonElement &&
  templateResult instanceof HTMLElement
) {
  let addedEvents = 0;
  let instance;

  templateRoot.addEventListener(EVENTS.itemAdded, () => {
    addedEvents += 1;
  });

  templateButton.addEventListener("click", (event) => {
    event.stopPropagation();

    if (instance === undefined) {
      return;
    }

    const result = instance.add();
    templateResult.textContent = result.ok
      ? `Unexpected success: ${result.item.key} was added.`
      : `Add returned ${result.reason}. No candidate fieldset was inserted.`;
    textNumber(templateItemCount, instance.getCount());
    textNumber(templateEventCount, addedEvents);
  });

  instance = createRepeatableFieldset(templateRoot);
  textNumber(templateItemCount, instance.getCount());
}

const addonRoot = document.querySelector("#addon-failure-root");
const addonButton = document.querySelector("#addon-attempt");
const addonShouldFail = document.querySelector("#addon-should-fail");
const addonResult = document.querySelector("#addon-result");
const addonItemCount = document.querySelector("#addon-item-count");
const addonMarkerCount = document.querySelector("#addon-marker-count");
const addonEventCount = document.querySelector("#addon-event-count");

if (
  addonRoot instanceof HTMLElement &&
  addonButton instanceof HTMLButtonElement &&
  addonShouldFail instanceof HTMLInputElement &&
  addonResult instanceof HTMLElement
) {
  let addedEvents = 0;
  let instance;

  const auditMarkerAddon = Object.freeze({
    id: "demo.audit-marker",
    setupItem({ item }) {
      const marker = item.element.ownerDocument.createElement("p");
      marker.dataset.demoAddonMarker = "";
      marker.className = "docs-site__badge";
      marker.textContent = "Demo audit marker active for this item.";
      item.element.append(marker);
      let active = true;

      return () => {
        if (!active) {
          return;
        }

        active = false;
        marker.remove();
      };
    }
  });

  const intentionalFailureAddon = Object.freeze({
    id: "demo.intentional-failure",
    setupItem({ phase }) {
      if (phase === "added" && addonShouldFail.checked) {
        throw new Error("Intentional demo addon failure.");
      }
    }
  });

  const updateMetrics = () => {
    textNumber(addonItemCount, instance?.getCount() ?? 0);
    textNumber(
      addonMarkerCount,
      addonRoot.querySelectorAll("[data-demo-addon-marker]").length
    );
    textNumber(addonEventCount, addedEvents);
  };

  addonRoot.addEventListener(EVENTS.itemAdded, () => {
    addedEvents += 1;
  });

  addonButton.addEventListener("click", (event) => {
    event.stopPropagation();

    if (instance === undefined) {
      return;
    }

    const result = instance.add();
    addonResult.textContent = result.ok
      ? `Add succeeded with ${result.item.key}; completed addon work remains attached.`
      : `Add returned ${result.reason}; completed addon work and the candidate fieldset were rolled back.`;
    updateMetrics();
  });

  instance = createRepeatableFieldset(addonRoot, {
    addons: [auditMarkerAddon, intentionalFailureAddon]
  });
  updateMetrics();
}
