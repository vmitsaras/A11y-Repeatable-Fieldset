import { EVENT_DISPATCH_OPTIONS, EVENTS } from "./constants";
import type { A11yRepeatableFieldset } from "./instance";
import type { RepeatableFieldsetKey } from "./keys";
import type {
  RepeatableFieldsetItem,
  RepeatableFieldsetMoveDirection,
  RepeatableFieldsetOperationSource
} from "./operations";

/**
 * Detail shared by every public lifecycle observation.
 *
 * Event dispatch is introduced separately. This type describes the stable
 * public shape dispatched from one initialized component root.
 */
export interface RepeatableFieldsetEventBase {
  readonly instance: A11yRepeatableFieldset;
  readonly root: HTMLElement;
}

export interface RepeatableFieldsetInitEventDetail
  extends RepeatableFieldsetEventBase {
  readonly count: number;
  readonly minimum: number;
  readonly maximum: number | null;
  readonly items: readonly RepeatableFieldsetItem[];
}

export interface RepeatableFieldsetItemAddedEventDetail
  extends RepeatableFieldsetEventBase {
  readonly item: RepeatableFieldsetItem;
  readonly key: RepeatableFieldsetKey;
  readonly index: number;
  readonly position: number;
  readonly count: number;
  readonly trigger: HTMLElement | null;
  readonly source: RepeatableFieldsetOperationSource;
}

export interface RepeatableFieldsetItemDuplicatedEventDetail
  extends RepeatableFieldsetEventBase {
  readonly item: RepeatableFieldsetItem;
  readonly key: RepeatableFieldsetKey;
  readonly index: number;
  readonly position: number;
  readonly sourceKey: RepeatableFieldsetKey;
  readonly sourceIndex: number;
  readonly sourcePosition: number;
  readonly count: number;
  readonly focusTarget: HTMLElement | null;
}

export interface RepeatableFieldsetItemRemovedEventDetail
  extends RepeatableFieldsetEventBase {
  readonly item: RepeatableFieldsetItem;
  readonly key: RepeatableFieldsetKey;
  readonly previousIndex: number;
  readonly previousPosition: number;
  readonly count: number;
  readonly focusTarget: HTMLElement | null;
  readonly trigger: HTMLElement | null;
  readonly source: RepeatableFieldsetOperationSource;
}

export interface RepeatableFieldsetItemMovedEventDetail
  extends RepeatableFieldsetEventBase {
  readonly item: RepeatableFieldsetItem;
  readonly key: RepeatableFieldsetKey;
  readonly previousIndex: number;
  readonly previousPosition: number;
  readonly index: number;
  readonly position: number;
  readonly count: number;
  readonly direction: RepeatableFieldsetMoveDirection;
  readonly focusTarget: HTMLElement | null;
}

export interface RepeatableFieldsetItemRestoredEventDetail
  extends RepeatableFieldsetEventBase {
  readonly item: RepeatableFieldsetItem;
  readonly key: RepeatableFieldsetKey;
  readonly previousIndex: number;
  readonly previousPosition: number;
  readonly index: number;
  readonly position: number;
  readonly count: number;
  readonly focusTarget: HTMLElement | null;
}

export interface RepeatableFieldsetDestroyEventDetail
  extends RepeatableFieldsetEventBase {
  readonly count: number;
}

/** Maps each exported lifecycle-event name to its public detail shape. */
export type RepeatableFieldsetEventMap = {
  readonly [EVENTS.init]: RepeatableFieldsetInitEventDetail;
  readonly [EVENTS.itemAdded]: RepeatableFieldsetItemAddedEventDetail;
  readonly [EVENTS.itemDuplicated]: RepeatableFieldsetItemDuplicatedEventDetail;
  readonly [EVENTS.itemRemoved]: RepeatableFieldsetItemRemovedEventDetail;
  readonly [EVENTS.itemRestored]: RepeatableFieldsetItemRestoredEventDetail;
  readonly [EVENTS.itemMoved]: RepeatableFieldsetItemMovedEventDetail;
  readonly [EVENTS.destroy]: RepeatableFieldsetDestroyEventDetail;
};

/** A typed CustomEvent for one exact exported lifecycle-event name. */
export type RepeatableFieldsetCustomEvent<
  Name extends keyof RepeatableFieldsetEventMap
> = CustomEvent<RepeatableFieldsetEventMap[Name]>;

/** Dispatches one completed lifecycle observation from the root's own realm. */
export function dispatchRepeatableFieldsetEvent<
  Name extends keyof RepeatableFieldsetEventMap
>(
  root: HTMLElement,
  name: Name,
  detail: RepeatableFieldsetEventMap[Name]
): void {
  const CustomEventConstructor =
    root.ownerDocument.defaultView?.CustomEvent ?? globalThis.CustomEvent;

  if (CustomEventConstructor === undefined) {
    throw new Error(
      "The repeatable-fieldset root document must provide CustomEvent."
    );
  }

  root.dispatchEvent(
    new CustomEventConstructor(name, {
      ...EVENT_DISPATCH_OPTIONS,
      detail
    })
  );
}
