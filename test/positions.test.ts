import { describe, expect, it } from "vitest";

import { ATTRIBUTES, SELECTORS } from "../src/constants";
import { discoverRepeatableFieldsetMarkup } from "../src/discovery";
import { RepeatableFieldsetError } from "../src/errors";
import { createRepeatableFieldset } from "../src/index";
import { registerExistingRepeatableFieldsetItems } from "../src/items";
import {
  synchronizeRepeatableFieldsetPositions
} from "../src/positions";
import {
  materializeDiscoveredRepeatableFieldsetTemplate
} from "../src/template";
import {
  createTestRepeatableFieldsetMarkup,
  type TestRepeatableFieldsetMarkup
} from "./helpers/create-markup";

function createMarkup(): TestRepeatableFieldsetMarkup {
  return createTestRepeatableFieldsetMarkup(document);
}

function appendItem(
  markup: TestRepeatableFieldsetMarkup,
  suffix: string,
  key: string | null
): HTMLFieldSetElement {
  const item = markup.item.cloneNode(true) as HTMLFieldSetElement;
  const input = item.querySelector<HTMLInputElement>("input:not([type])");
  const label = item.querySelector<HTMLLabelElement>("label");

  if (input === null || label === null) {
    throw new Error("The test item fixture is incomplete.");
  }

  input.id = `contact-${suffix}-name`;
  input.name = `contacts[${suffix}][name]`;
  label.htmlFor = input.id;

  if (key === null) {
    item.removeAttribute(ATTRIBUTES.key);
  } else {
    item.setAttribute(ATTRIBUTES.key, key);
  }

  markup.items.append(item);
  return item;
}

function getPositionMarkers(
  item: HTMLFieldSetElement
): readonly HTMLElement[] {
  return Array.from(
    item.querySelectorAll<HTMLElement>(SELECTORS.position)
  );
}

function getPositionText(item: HTMLFieldSetElement): string | null {
  return item.querySelector(SELECTORS.position)?.textContent ?? null;
}

function rekeyMarkup(
  markup: TestRepeatableFieldsetMarkup,
  key: string
): void {
  markup.item.setAttribute(ATTRIBUTES.key, key);
  markup.input.id = `contact-${key}-name`;
  markup.input.name = `contacts[${key}][name]`;

  const label = markup.item.querySelector<HTMLLabelElement>("label");

  if (label !== null) {
    label.htmlFor = markup.input.id;
  }
}

describe("visible position synchronization", () => {
  it("synchronizes one-based markers during initialization only", () => {
    const markup = createMarkup();
    const second = appendItem(markup, "server-84", "server-84");
    const firstMarker = getPositionMarkers(markup.item)[0];
    const secondMarker = getPositionMarkers(second)[0];
    const beforeIdentity = [
      markup.input.id,
      markup.input.name,
      second.querySelector<HTMLInputElement>("input")?.id,
      second.querySelector<HTMLInputElement>("input")?.name
    ];

    firstMarker?.replaceChildren("19");
    secondMarker?.replaceChildren("4");

    const instance = createRepeatableFieldset(markup.root);

    expect([
      getPositionText(markup.item),
      getPositionText(second)
    ]).toEqual(["1", "2"]);
    expect([
      markup.input.id,
      markup.input.name,
      second.querySelector<HTMLInputElement>("input")?.id,
      second.querySelector<HTMLInputElement>("input")?.name
    ]).toEqual(beforeIdentity);

    instance.destroy();
    expect([
      getPositionText(markup.item),
      getPositionText(second)
    ]).toEqual(["1", "2"]);
  });

  it("returns fresh frozen index and position snapshots", () => {
    const markup = createMarkup();
    const second = appendItem(markup, "server-84", "server-84");
    const discovered = discoverRepeatableFieldsetMarkup(markup.root);
    const { registry } =
      registerExistingRepeatableFieldsetItems(discovered);

    const first =
      synchronizeRepeatableFieldsetPositions(
        markup.root,
        registry.items
      );
    const secondPass =
      synchronizeRepeatableFieldsetPositions(
        markup.root,
        registry.items
      );

    expect(first.snapshots).not.toBe(secondPass.snapshots);
    expect(Object.isFrozen(first.snapshots)).toBe(true);
    expect(
      first.snapshots.every((snapshot) => Object.isFrozen(snapshot))
    ).toBe(true);
    expect(first.snapshots).toEqual([
      {
        element: markup.item,
        key: "server-42",
        index: 0,
        position: 1
      },
      {
        element: second,
        key: "server-84",
        index: 1,
        position: 2
      }
    ]);
  });

  it("updates multiple owned markers and permits an item with no marker", () => {
    const markup = createMarkup();
    const second = appendItem(markup, "server-84", "server-84");
    const extraMarker = document.createElement("span");
    extraMarker.setAttribute(ATTRIBUTES.position, "");
    extraMarker.textContent = "old";
    markup.item.querySelector("legend")?.append(" of ", extraMarker);
    second.querySelector(SELECTORS.position)?.remove();

    const discovered = discoverRepeatableFieldsetMarkup(markup.root);
    const { registry } =
      registerExistingRepeatableFieldsetItems(discovered);
    const synchronization =
      synchronizeRepeatableFieldsetPositions(
        markup.root,
        registry.items
      );

    expect(
      getPositionMarkers(markup.item).map(({ textContent }) => textContent)
    ).toEqual(["1", "1"]);
    expect(getPositionMarkers(second)).toHaveLength(0);
    expect(synchronization.snapshots[1]).toMatchObject({
      element: second,
      position: 2
    });
  });

  it("synchronizes a disconnected template candidate after insertion", () => {
    const markup = createMarkup();
    const discovered = discoverRepeatableFieldsetMarkup(markup.root);
    const { registry } =
      registerExistingRepeatableFieldsetItems(discovered);
    const key = registry.allocateKey("add");
    const materialized =
      materializeDiscoveredRepeatableFieldsetTemplate(
        discovered,
        key
      );
    const input =
      materialized.item.querySelector<HTMLInputElement>("input");

    markup.items.append(materialized.item);
    const synchronization =
      synchronizeRepeatableFieldsetPositions(markup.root, [
        ...registry.items,
        {
          element: materialized.item,
          key: materialized.key
        }
      ]);

    expect(getPositionText(markup.item)).toBe("1");
    expect(getPositionText(materialized.item)).toBe("2");
    expect(input?.id).toBe(`contact-${key}-name`);
    expect(input?.name).toBe(`contacts[${key}][name]`);
    expect(synchronization.snapshots[1]).toMatchObject({
      element: materialized.item,
      key,
      index: 1,
      position: 2
    });
  });

  it("closes position gaps after an earlier item is removed", () => {
    const markup = createMarkup();
    const second = appendItem(markup, "server-84", "server-84");
    const third = appendItem(markup, "server-126", "server-126");
    const discovered = discoverRepeatableFieldsetMarkup(markup.root);
    const { registry } =
      registerExistingRepeatableFieldsetItems(discovered);
    const retainedIdentity = registry.items.slice(1).map(({ element, key }) => ({
      key,
      id: element.querySelector<HTMLInputElement>("input")?.id,
      name: element.querySelector<HTMLInputElement>("input")?.name
    }));

    markup.item.remove();
    synchronizeRepeatableFieldsetPositions(
      markup.root,
      registry.items.slice(1)
    );

    expect([getPositionText(second), getPositionText(third)]).toEqual([
      "1",
      "2"
    ]);
    expect(
      registry.items.slice(1).map(({ element, key }) => ({
        key,
        id: element.querySelector<HTMLInputElement>("input")?.id,
        name: element.querySelector<HTMLInputElement>("input")?.name
      }))
    ).toEqual(retainedIdentity);
  });

  it("does not update position markers owned by a nested root", () => {
    const parent = createMarkup();
    const nested = createMarkup();
    rekeyMarkup(nested, "nested-1");
    const parentMarker = getPositionMarkers(parent.item)[0];
    const nestedMarker = getPositionMarkers(nested.item)[0];

    parentMarker?.replaceChildren("Parent old");
    nestedMarker?.replaceChildren("Nested old");
    parent.item.append(nested.root);

    createRepeatableFieldset(parent.root);

    expect(parentMarker?.textContent).toBe("1");
    expect(nestedMarker?.textContent).toBe("Nested old");
  });

  it("restores the original marker nodes when synchronization is rolled back", () => {
    const markup = createMarkup();
    const marker = getPositionMarkers(markup.item)[0];

    if (marker === undefined) {
      throw new Error("The test item has no position marker.");
    }

    const emphasis = document.createElement("strong");
    emphasis.textContent = "Original";
    marker.replaceChildren(emphasis, " position");
    const discovered = discoverRepeatableFieldsetMarkup(markup.root);
    const { registry } =
      registerExistingRepeatableFieldsetItems(discovered);
    const synchronization =
      synchronizeRepeatableFieldsetPositions(
        markup.root,
        registry.items
      );

    expect(marker.textContent).toBe("1");

    synchronization.rollback();
    synchronization.rollback();

    expect(marker.firstChild).toBe(emphasis);
    expect(marker.textContent).toBe("Original position");
  });

  it("rolls back positions and assigned keys after a marker write fails", () => {
    const markup = createMarkup();
    markup.item.removeAttribute(ATTRIBUTES.key);
    const second = appendItem(markup, "second", null);
    const firstMarker = getPositionMarkers(markup.item)[0];
    const secondMarker = getPositionMarkers(second)[0];

    if (firstMarker === undefined || secondMarker === undefined) {
      throw new Error("The test items require position markers.");
    }

    firstMarker.replaceChildren("First original");
    secondMarker.replaceChildren("Second original");
    const failure = new Error("Position write failed.");
    Object.defineProperty(secondMarker, "textContent", {
      configurable: true,
      get() {
        return "Second original";
      },
      set() {
        throw failure;
      }
    });
    let thrown: unknown;

    try {
      createRepeatableFieldset(markup.root);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(RepeatableFieldsetError);
    expect(thrown).toMatchObject({
      code: "invalid-item",
      root: markup.root,
      element: secondMarker,
      cause: failure
    });
    expect(firstMarker.textContent).toBe("First original");
    expect(secondMarker.innerHTML).toBe("Second original");
    expect(markup.item.hasAttribute(ATTRIBUTES.key)).toBe(false);
    expect(second.hasAttribute(ATTRIBUTES.key)).toBe(false);

    Reflect.deleteProperty(secondMarker, "textContent");
    const recovered = createRepeatableFieldset(markup.root);

    expect(recovered).toBeDefined();
    expect([
      markup.item.getAttribute(ATTRIBUTES.key),
      second.getAttribute(ATTRIBUTES.key)
    ]).toEqual(["item-1", "item-2"]);
    expect([
      firstMarker.textContent,
      secondMarker.textContent
    ]).toEqual(["1", "2"]);
  });
});
