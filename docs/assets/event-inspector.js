import {
  EVENTS,
  createRepeatableFieldset
} from "./a11y-repeatable-fieldset.js";

const root = document.querySelector("#event-demo-root");
const log = document.querySelector("#event-log");
const apiAddButton = document.querySelector("#event-api-add");
const apiDuplicateButton = document.querySelector("#event-api-duplicate");
const apiMoveButton = document.querySelector("#event-api-move");
const destroyButton = document.querySelector("#event-destroy");
const clearButton = document.querySelector("#event-clear-log");
const commandResult = document.querySelector("#event-command-result");
const maximumEntries = 20;

function describeElement(element) {
  if (!(element instanceof Element)) {
    return null;
  }

  const label =
    element instanceof HTMLButtonElement
      ? element.textContent?.trim() ?? ""
      : "";

  return {
    tag: element.localName,
    id: element.id || null,
    label: label || null
  };
}

function structuralPayload(name, detail) {
  if (name === EVENTS.init) {
    return {
      count: detail.count,
      minimum: detail.minimum,
      maximum: detail.maximum,
      items: detail.items.map(({ key, index, position }) => ({
        key,
        index,
        position
      }))
    };
  }

  if (name === EVENTS.itemAdded) {
    return {
      key: detail.key,
      index: detail.index,
      position: detail.position,
      count: detail.count,
      source: detail.source,
      trigger: describeElement(detail.trigger)
    };
  }

  if (name === EVENTS.itemDuplicated) {
    return {
      key: detail.key,
      index: detail.index,
      position: detail.position,
      sourceKey: detail.sourceKey,
      sourceIndex: detail.sourceIndex,
      sourcePosition: detail.sourcePosition,
      count: detail.count,
      focusTarget: describeElement(detail.focusTarget)
    };
  }

  if (name === EVENTS.itemRemoved) {
    return {
      key: detail.key,
      previousIndex: detail.previousIndex,
      previousPosition: detail.previousPosition,
      count: detail.count,
      source: detail.source,
      trigger: describeElement(detail.trigger),
      focusTarget: describeElement(detail.focusTarget)
    };
  }

  if (name === EVENTS.itemRestored) {
    return {
      key: detail.key,
      previousIndex: detail.previousIndex,
      previousPosition: detail.previousPosition,
      index: detail.index,
      position: detail.position,
      count: detail.count,
      focusTarget: describeElement(detail.focusTarget)
    };
  }

  if (name === EVENTS.itemMoved) {
    return {
      key: detail.key,
      previousIndex: detail.previousIndex,
      previousPosition: detail.previousPosition,
      index: detail.index,
      position: detail.position,
      count: detail.count,
      direction: detail.direction,
      focusTarget: describeElement(detail.focusTarget)
    };
  }

  return { count: detail.count };
}

function appendEntry(name, detail) {
  if (!(log instanceof HTMLOListElement)) {
    return;
  }

  const item = document.createElement("li");
  const eventName = document.createElement("strong");
  const payload = document.createElement("code");

  eventName.textContent = name;
  payload.textContent = ` ${JSON.stringify(structuralPayload(name, detail))}`;
  item.append(eventName, payload);
  log.append(item);

  while (log.children.length > maximumEntries) {
    log.firstElementChild?.remove();
  }
}

if (
  root instanceof HTMLElement &&
  log instanceof HTMLOListElement &&
  apiAddButton instanceof HTMLButtonElement &&
  apiDuplicateButton instanceof HTMLButtonElement &&
  apiMoveButton instanceof HTMLButtonElement &&
  destroyButton instanceof HTMLButtonElement &&
  clearButton instanceof HTMLButtonElement &&
  commandResult instanceof HTMLElement
) {
  for (const name of Object.values(EVENTS)) {
    root.addEventListener(name, (event) => {
      if (event instanceof CustomEvent) {
        appendEntry(name, event.detail);
      }
    });
  }

  const instance = createRepeatableFieldset(root);

  apiAddButton.addEventListener("click", () => {
    const result = instance.add();
    commandResult.textContent = result.ok
      ? `add() succeeded with key ${result.item.key}.`
      : `add() was blocked or failed with reason ${result.reason}; no item-added event was dispatched.`;
  });

  apiDuplicateButton.addEventListener("click", () => {
    const source = instance.getItems()[0];
    const result = source === undefined
      ? { ok: false, reason: "inactive" }
      : instance.duplicate(source);

    commandResult.textContent = result.ok
      ? `duplicate() created key ${result.item.key} after source ${result.sourceItem.key}.`
      : `duplicate() was blocked or failed with reason ${result.reason}; no item-duplicated event was dispatched.`;
  });

  apiMoveButton.addEventListener("click", () => {
    const items = instance.getItems();
    const target = items.at(-1);
    const direction = items.length > 1 ? "up" : "down";
    const result = target === undefined
      ? { ok: false, reason: "inactive" }
      : instance.move(target, direction);

    commandResult.textContent = result.ok
      ? `move() kept key ${result.item.key} and changed its position from ${result.previousPosition} to ${result.item.position}.`
      : `move() was blocked or failed with reason ${result.reason}; no item-moved event was dispatched.`;
  });

  destroyButton.addEventListener("click", () => {
    instance.destroy();
    apiAddButton.disabled = true;
    apiDuplicateButton.disabled = true;
    apiMoveButton.disabled = true;
    destroyButton.disabled = true;
    commandResult.textContent =
      "The instance was destroyed. Its final lifecycle event is shown in the log.";
  });

  clearButton.addEventListener("click", () => {
    log.replaceChildren();
  });
}
