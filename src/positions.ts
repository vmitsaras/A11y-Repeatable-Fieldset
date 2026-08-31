import { SELECTORS } from "./constants";
import { RepeatableFieldsetError } from "./errors";
import type { RepeatableFieldsetKey } from "./keys";
import type { RepeatableFieldsetItem } from "./operations";

export interface PositionableRepeatableFieldsetItem {
  readonly element: HTMLFieldSetElement;
  readonly key: RepeatableFieldsetKey;
}

export type RepeatableFieldsetPositionSnapshot =
  RepeatableFieldsetItem;

export interface RepeatableFieldsetPositionSynchronization {
  readonly snapshots: readonly RepeatableFieldsetPositionSnapshot[];
  rollback(): void;
}

interface PlannedPositionWrite {
  readonly marker: Element;
  readonly text: string;
}

interface OriginalMarkerContent {
  readonly marker: Element;
  readonly childNodes: readonly Node[];
}

function findOwnedPositionMarkers(
  root: HTMLElement,
  item: HTMLFieldSetElement
): readonly Element[] {
  if (item.matches(SELECTORS.position)) {
    throw new RepeatableFieldsetError(
      "invalid-item",
      "A position marker must be a dedicated descendant of its item fieldset.",
      {
        root,
        element: item
      }
    );
  }

  return Array.from(
    item.querySelectorAll<Element>(SELECTORS.position)
  ).filter(
    (marker) =>
      marker.closest(SELECTORS.item) === item &&
      marker.closest(SELECTORS.root) === root
  );
}

function restoreMarkerContents(
  originalContents: readonly OriginalMarkerContent[]
): void {
  for (
    let index = originalContents.length - 1;
    index >= 0;
    index -= 1
  ) {
    const original = originalContents[index];

    if (original !== undefined) {
      original.marker.replaceChildren(...original.childNodes);
    }
  }
}

/**
 * Updates dedicated owned position markers and returns fresh immutable
 * zero-based-index/one-based-position snapshots.
 */
export function synchronizeRepeatableFieldsetPositions(
  root: HTMLElement,
  items: readonly PositionableRepeatableFieldsetItem[]
): RepeatableFieldsetPositionSynchronization {
  const snapshots = Object.freeze(
    items.map((item, index) =>
      Object.freeze({
        element: item.element,
        key: item.key,
        index,
        position: index + 1
      })
    )
  );
  const plannedWrites = snapshots.flatMap(({ element, position }) =>
    findOwnedPositionMarkers(root, element).map((marker) => ({
      marker,
      text: String(position)
    }))
  );
  const originalContents: OriginalMarkerContent[] = [];
  let currentMarker: Element | null = null;

  try {
    for (const write of plannedWrites) {
      currentMarker = write.marker;
      originalContents.push({
        marker: write.marker,
        childNodes: Object.freeze(Array.from(write.marker.childNodes))
      });
      write.marker.textContent = write.text;
    }
  } catch (cause) {
    restoreMarkerContents(originalContents);

    throw new RepeatableFieldsetError(
      "invalid-item",
      "The component could not synchronize an item position marker.",
      {
        root,
        ...(currentMarker === null ? {} : { element: currentMarker }),
        cause
      }
    );
  }

  let rolledBack = false;

  return Object.freeze({
    snapshots,
    rollback(): void {
      if (rolledBack) {
        return;
      }

      rolledBack = true;
      restoreMarkerContents(originalContents);
    }
  });
}
