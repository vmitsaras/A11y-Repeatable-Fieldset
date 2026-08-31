import { ATTRIBUTES } from "./constants";
import type {
  DiscoveredRepeatableFieldsetItem,
  DiscoveredRepeatableFieldsetMarkup
} from "./discovery";
import { RepeatableFieldsetError } from "./errors";
import {
  StableKeyAllocator,
  type RepeatableFieldsetKey,
  type RepeatableFieldsetKeySource
} from "./keys";

export interface RegisteredRepeatableFieldsetItem {
  readonly element: HTMLFieldSetElement;
  readonly legend: HTMLLegendElement;
  readonly removeButton: HTMLButtonElement;
  readonly key: RepeatableFieldsetKey;
}

export interface RegisterableRepeatableFieldsetItem {
  readonly element: HTMLFieldSetElement;
  readonly legend: HTMLLegendElement;
  readonly removeButton: HTMLButtonElement;
  readonly key: RepeatableFieldsetKey;
}

export interface AddedItemRegistration {
  readonly item: RegisteredRepeatableFieldsetItem;
  rollback(): void;
}

export interface RemovedItemRegistration {
  readonly item: RegisteredRepeatableFieldsetItem;
  readonly index: number;
  rollback(): void;
}

export interface MovedItemRegistration {
  readonly item: RegisteredRepeatableFieldsetItem;
  readonly previousIndex: number;
  readonly index: number;
  rollback(): void;
}

export interface ExistingItemRegistry {
  readonly items: readonly RegisteredRepeatableFieldsetItem[];
  getByElement(
    element: HTMLFieldSetElement
  ): RegisteredRepeatableFieldsetItem | null;
  getByKey(
    key: RepeatableFieldsetKey
  ): RegisteredRepeatableFieldsetItem | null;
  allocateKey(
    source: RepeatableFieldsetKeySource,
    element?: Element
  ): RepeatableFieldsetKey;
  reserveKey(
    key: unknown,
    element?: Element
  ): RepeatableFieldsetKey;
  registerAddedItem(
    item: Readonly<RegisterableRepeatableFieldsetItem>,
    index?: number
  ): AddedItemRegistration;
  unregisterItem(
    item: RegisteredRepeatableFieldsetItem
  ): RemovedItemRegistration;
  moveItem(
    item: RegisteredRepeatableFieldsetItem,
    index: number
  ): MovedItemRegistration;
  hasReservedKey(key: RepeatableFieldsetKey): boolean;
  getReservedKeys(): readonly RepeatableFieldsetKey[];
}

export interface ExistingItemRegistration {
  readonly registry: ExistingItemRegistry;
  rollback(): void;
}

interface PlannedItemRegistration {
  readonly discovered: DiscoveredRepeatableFieldsetItem;
  readonly key: RepeatableFieldsetKey;
  readonly assignKey: boolean;
}

function createRegistry(
  plannedItems: readonly PlannedItemRegistration[],
  allocator: StableKeyAllocator,
  root: HTMLElement
): ExistingItemRegistry {
  const byElement = new WeakMap<
    HTMLFieldSetElement,
    RegisteredRepeatableFieldsetItem
  >();
  const byKey = new Map<
    RepeatableFieldsetKey,
    RegisteredRepeatableFieldsetItem
  >();
  const items = plannedItems.map(({ discovered, key }) => {
    const registered = Object.freeze({
      element: discovered.element,
      legend: discovered.legend,
      removeButton: discovered.removeButton,
      key
    });

    byElement.set(registered.element, registered);
    byKey.set(key, registered);
    return registered;
  });

  return Object.freeze({
    get items(): readonly RegisteredRepeatableFieldsetItem[] {
      return Object.freeze(Array.from(items));
    },
    getByElement(
      element: HTMLFieldSetElement
    ): RegisteredRepeatableFieldsetItem | null {
      return byElement.get(element) ?? null;
    },
    getByKey(
      key: RepeatableFieldsetKey
    ): RegisteredRepeatableFieldsetItem | null {
      return byKey.get(key) ?? null;
    },
    allocateKey(
      source: RepeatableFieldsetKeySource,
      element?: Element
    ): RepeatableFieldsetKey {
      return allocator.allocate(source, element);
    },
    reserveKey(
      key: unknown,
      element?: Element
    ): RepeatableFieldsetKey {
      return allocator.reserve(key, element);
    },
    registerAddedItem(
      item: Readonly<RegisterableRepeatableFieldsetItem>,
      index: number = items.length
    ): AddedItemRegistration {
      if (!allocator.has(item.key)) {
        throw new RepeatableFieldsetError(
          "invalid-key",
          "A new item must use a key reserved by this component instance.",
          {
            root,
            element: item.element
          }
        );
      }

      if (
        byElement.has(item.element) ||
        byKey.has(item.key)
      ) {
        throw new RepeatableFieldsetError(
          "invalid-template",
          "A new item cannot duplicate an active item or key.",
          {
            root,
            element: item.element
          }
        );
      }

      if (
        !Number.isSafeInteger(index) ||
        index < 0 ||
        index > items.length
      ) {
        throw new RepeatableFieldsetError(
          "invalid-item",
          "A new item must use a valid collection insertion index.",
          {
            root,
            element: item.element
          }
        );
      }

      const registered = Object.freeze({
        element: item.element,
        legend: item.legend,
        removeButton: item.removeButton,
        key: item.key
      });

      items.splice(index, 0, registered);
      byElement.set(registered.element, registered);
      byKey.set(registered.key, registered);

      let active = true;

      return Object.freeze({
        item: registered,
        rollback(): void {
          if (!active) {
            return;
          }

          active = false;
          const index = items.indexOf(registered);

          if (index !== -1) {
            items.splice(index, 1);
          }

          byElement.delete(registered.element);

          if (byKey.get(registered.key) === registered) {
            byKey.delete(registered.key);
          }
        }
      });
    },
    unregisterItem(
      item: RegisteredRepeatableFieldsetItem
    ): RemovedItemRegistration {
      const index = items.indexOf(item);

      if (
        index === -1 ||
        byElement.get(item.element) !== item ||
        byKey.get(item.key) !== item
      ) {
        throw new RepeatableFieldsetError(
          "invalid-item",
          "Only a currently registered item can be removed.",
          {
            root,
            element: item.element
          }
        );
      }

      items.splice(index, 1);
      byElement.delete(item.element);
      byKey.delete(item.key);

      let active = true;

      return Object.freeze({
        item,
        index,
        rollback(): void {
          if (!active) {
            return;
          }

          active = false;

          if (
            byElement.has(item.element) ||
            byKey.has(item.key)
          ) {
            throw new RepeatableFieldsetError(
              "invalid-item",
              "The removed item registration could not be restored.",
              {
                root,
                element: item.element
              }
            );
          }

          items.splice(Math.min(index, items.length), 0, item);
          byElement.set(item.element, item);
          byKey.set(item.key, item);
        }
      });
    },
    moveItem(
      item: RegisteredRepeatableFieldsetItem,
      index: number
    ): MovedItemRegistration {
      const previousIndex = items.indexOf(item);

      if (
        previousIndex === -1 ||
        byElement.get(item.element) !== item ||
        byKey.get(item.key) !== item ||
        !Number.isSafeInteger(index) ||
        index < 0 ||
        index >= items.length ||
        index === previousIndex
      ) {
        throw new RepeatableFieldsetError(
          "invalid-item",
          "Only a currently registered item can move to a different valid index.",
          {
            root,
            element: item.element
          }
        );
      }

      items.splice(previousIndex, 1);
      items.splice(index, 0, item);
      let active = true;

      return Object.freeze({
        item,
        previousIndex,
        index,
        rollback(): void {
          if (!active) {
            return;
          }

          active = false;
          const currentIndex = items.indexOf(item);

          if (currentIndex === -1) {
            throw new RepeatableFieldsetError(
              "invalid-item",
              "The moved item registration could not be restored.",
              {
                root,
                element: item.element
              }
            );
          }

          items.splice(currentIndex, 1);
          items.splice(previousIndex, 0, item);
        }
      });
    },
    hasReservedKey(key: RepeatableFieldsetKey): boolean {
      return allocator.has(key);
    },
    getReservedKeys(): readonly RepeatableFieldsetKey[] {
      return allocator.getReservedKeys();
    }
  });
}

function removeAssignedKeys(
  assignedItems: readonly HTMLFieldSetElement[]
): void {
  for (let index = assignedItems.length - 1; index >= 0; index -= 1) {
    assignedItems[index]?.removeAttribute(ATTRIBUTES.key);
  }
}

/**
 * Registers existing items in discovery/DOM order and assigns identity only
 * to fieldsets whose key attribute was absent.
 */
export function registerExistingRepeatableFieldsetItems(
  markup: Readonly<DiscoveredRepeatableFieldsetMarkup>
): ExistingItemRegistration {
  if (markup.items.length === 0 && markup.options.minimum !== 0) {
    throw new RepeatableFieldsetError(
      "invalid-options",
      "A repeatable fieldset with no existing items requires a minimum of 0.",
      {
        root: markup.root,
        element: markup.itemsContainer
      }
    );
  }

  const allocator = new StableKeyAllocator(
    markup.root,
    markup.items.flatMap(({ key }) => (key === null ? [] : [key])),
    markup.options.keyFactory
  );

  const plannedItems = markup.items.map(
    (discovered): PlannedItemRegistration => {
      if (discovered.key !== null) {
        return Object.freeze({
          discovered,
          key: discovered.key,
          assignKey: false
        });
      }

      return Object.freeze({
        discovered,
        key: allocator.allocate(
          "initialization",
          discovered.element
        ),
        assignKey: true
      });
    }
  );
  const registry = createRegistry(
    plannedItems,
    allocator,
    markup.root
  );
  const assignedItems: HTMLFieldSetElement[] = [];
  let currentAssignment: HTMLFieldSetElement | null = null;

  try {
    for (const planned of plannedItems) {
      if (!planned.assignKey) {
        continue;
      }

      currentAssignment = planned.discovered.element;
      assignedItems.push(currentAssignment);
      currentAssignment.setAttribute(ATTRIBUTES.key, planned.key);
    }
  } catch (cause) {
    removeAssignedKeys(assignedItems);

    throw new RepeatableFieldsetError(
      "invalid-key",
      "The component could not assign a stable key to an existing item.",
      {
        root: markup.root,
        element: currentAssignment ?? markup.itemsContainer,
        cause
      }
    );
  }

  let rolledBack = false;

  return Object.freeze({
    registry,
    rollback(): void {
      if (rolledBack) {
        return;
      }

      rolledBack = true;
      removeAssignedKeys(assignedItems);
    }
  });
}
