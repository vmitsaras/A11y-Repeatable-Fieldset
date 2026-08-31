import { describe, expect, expectTypeOf, it, vi } from "vitest";

import {
  createRepeatableFieldset,
  EVENTS,
  type RepeatableFieldsetCustomEvent,
  type RepeatableFieldsetDestroyEventDetail,
  type RepeatableFieldsetEventMap,
  type RepeatableFieldsetInitEventDetail,
  type RepeatableFieldsetItemAddedEventDetail,
  type RepeatableFieldsetItemDuplicatedEventDetail,
  type RepeatableFieldsetItemMovedEventDetail,
  type RepeatableFieldsetItemRemovedEventDetail
} from "../src/index";
import { createTestRepeatableFieldsetMarkup } from "./helpers/create-markup";

describe("lifecycle event detail exports", () => {
  it("maps every exact EVENTS value to its documented detail type", () => {
    expectTypeOf<
      RepeatableFieldsetEventMap[typeof EVENTS.init]
    >().toEqualTypeOf<RepeatableFieldsetInitEventDetail>();
    expectTypeOf<
      RepeatableFieldsetEventMap[typeof EVENTS.itemAdded]
    >().toEqualTypeOf<RepeatableFieldsetItemAddedEventDetail>();
    expectTypeOf<
      RepeatableFieldsetEventMap[typeof EVENTS.itemDuplicated]
    >().toEqualTypeOf<RepeatableFieldsetItemDuplicatedEventDetail>();
    expectTypeOf<
      RepeatableFieldsetEventMap[typeof EVENTS.itemRemoved]
    >().toEqualTypeOf<RepeatableFieldsetItemRemovedEventDetail>();
    expectTypeOf<
      RepeatableFieldsetEventMap[typeof EVENTS.itemMoved]
    >().toEqualTypeOf<RepeatableFieldsetItemMovedEventDetail>();
    expectTypeOf<
      RepeatableFieldsetEventMap[typeof EVENTS.destroy]
    >().toEqualTypeOf<RepeatableFieldsetDestroyEventDetail>();
    expectTypeOf<
      RepeatableFieldsetCustomEvent<typeof EVENTS.init>
    >().toEqualTypeOf<CustomEvent<RepeatableFieldsetInitEventDetail>>();
  });

  it("supports an owner-realm typed detail fixture without private state", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const instance = createRepeatableFieldset(markup.root);
    const item = instance.getItems()[0];
    const CustomEventConstructor = document.defaultView?.CustomEvent;

    if (item === undefined || CustomEventConstructor === undefined) {
      throw new Error("The lifecycle event test fixture is incomplete.");
    }

    const detail = Object.freeze({
      instance,
      root: markup.root,
      count: instance.getCount(),
      minimum: 1,
      maximum: null,
      items: Object.freeze([item])
    } satisfies RepeatableFieldsetInitEventDetail);
    const event: RepeatableFieldsetCustomEvent<typeof EVENTS.init> =
      new CustomEventConstructor<RepeatableFieldsetInitEventDetail>(
        EVENTS.init,
        {
          detail
        }
      );

    expect(event.detail).toBe(detail);
    expect(event.detail.items).toEqual([item]);
    expect(Object.isFrozen(event.detail)).toBe(true);
    expect(Object.isFrozen(event.detail.items)).toBe(true);

    instance.destroy();
  });

  it("dispatches the completed init, item, and destroy observations from the root", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const observed: CustomEvent[] = [];

    for (const name of [
      EVENTS.init,
      EVENTS.itemAdded,
      EVENTS.itemRemoved,
      EVENTS.itemMoved,
      EVENTS.destroy
    ]) {
      markup.root.addEventListener(name, (event) => {
        observed.push(event as CustomEvent);
      });
    }

    const instance = createRepeatableFieldset(markup.root, { minimum: 0 });
    const added = instance.add();

    expect(added.ok).toBe(true);

    if (!added.ok) {
      throw new Error("Expected Add to succeed.");
    }

    expect(instance.move(added.item, "up")).toMatchObject({ ok: true });
    expect(instance.remove(added.item)).toMatchObject({ ok: true });
    instance.destroy();

    expect(observed.map((event) => event.type)).toEqual([
      EVENTS.init,
      EVENTS.itemAdded,
      EVENTS.itemMoved,
      EVENTS.itemRemoved,
      EVENTS.destroy
    ]);
    expect(observed.every((event) => event.target === markup.root)).toBe(true);
    expect(
      observed.every(
        (event) =>
          event.bubbles && !event.composed && !event.cancelable
      )
    ).toBe(true);
    expect(observed[0]?.detail).toMatchObject({
      instance,
      root: markup.root,
      count: 1,
      items: [expect.objectContaining({ key: "server-42" })]
    });
    expect(observed[1]?.detail).toMatchObject({
      source: "api",
      trigger: null,
      count: 2
    });
    expect(observed[2]?.detail).toMatchObject({
      key: "item-1",
      previousIndex: 1,
      previousPosition: 2,
      index: 0,
      position: 1,
      direction: "up",
      count: 2
    });
    expect(observed[3]?.detail).toMatchObject({
      source: "api",
      trigger: null,
      previousIndex: 0,
      count: 1
    });
    expect(observed[4]?.detail).toMatchObject({ count: 1 });
  });

  it("uses control source and trigger only for user control actions", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const added: CustomEvent[] = [];
    const removed: CustomEvent[] = [];
    markup.root.addEventListener(EVENTS.itemAdded, (event) => {
      added.push(event as CustomEvent);
    });
    markup.root.addEventListener(EVENTS.itemRemoved, (event) => {
      removed.push(event as CustomEvent);
    });
    const instance = createRepeatableFieldset(markup.root, { minimum: 0 });

    markup.addButton.click();
    const addedItem = instance.getItems()[1];

    if (addedItem === undefined) {
      throw new Error("Expected control-driven Add to create an item.");
    }

    const removeButton = addedItem.element.querySelector<HTMLButtonElement>(
      "[data-a11y-repeatable-fieldset-remove]"
    );

    if (removeButton === null) {
      throw new Error("Expected the added item to have its Remove button.");
    }

    removeButton.click();

    expect(added).toHaveLength(1);
    expect(added[0]?.detail).toMatchObject({
      source: "control",
      trigger: markup.addButton,
      key: "item-1",
      index: 1,
      position: 2,
      count: 2
    });
    expect(removed).toHaveLength(1);
    expect(removed[0]?.detail).toMatchObject({
      source: "control",
      trigger: removeButton,
      key: "item-1",
      previousIndex: 1,
      previousPosition: 2,
      count: 1
    });
  });

  it("suppresses item events for blocked and rolled-back commands", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const added = vi.fn();
    const removed = vi.fn();
    const moved = vi.fn();
    markup.root.addEventListener(EVENTS.itemAdded, added);
    markup.root.addEventListener(EVENTS.itemRemoved, removed);
    markup.root.addEventListener(EVENTS.itemMoved, moved);
    const instance = createRepeatableFieldset(markup.root, {
      maximum: 1,
      addons: [
        {
          id: "example.add-rollback",
          setupItem(context) {
            if (context.phase === "added") {
              throw new Error("stop added item");
            }
          }
        }
      ]
    });

    expect(instance.add()).toMatchObject({ ok: false, reason: "maximum" });
    expect(instance.remove(markup.item)).toMatchObject({
      ok: false,
      reason: "minimum"
    });
    expect(instance.move(markup.item, "up")).toMatchObject({
      ok: false,
      reason: "boundary"
    });
    expect(added).not.toHaveBeenCalled();
    expect(removed).not.toHaveBeenCalled();
    expect(moved).not.toHaveBeenCalled();

    instance.destroy();
    markup.root.remove();

    const rollbackMarkup = createTestRepeatableFieldsetMarkup(document);
    const rolledBack = vi.fn();
    rollbackMarkup.root.addEventListener(EVENTS.itemAdded, rolledBack);
    const rollbackInstance = createRepeatableFieldset(rollbackMarkup.root, {
      addons: [
        {
          id: "example.add-rollback",
          setupItem(context) {
            if (context.phase === "added") {
              throw new Error("stop added item");
            }
          }
        }
      ]
    });

    expect(rollbackInstance.add()).toMatchObject({
      ok: false,
      reason: "addon-error"
    });
    expect(rolledBack).not.toHaveBeenCalled();
  });

  it("fires init and destroy once, with no later old-instance events", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const initialized = vi.fn();
    const destroyed = vi.fn();
    const added = vi.fn();
    const moved = vi.fn();
    markup.root.addEventListener(EVENTS.init, initialized);
    markup.root.addEventListener(EVENTS.destroy, destroyed);
    markup.root.addEventListener(EVENTS.itemAdded, added);
    markup.root.addEventListener(EVENTS.itemMoved, moved);

    const instance = createRepeatableFieldset(markup.root);
    expect(createRepeatableFieldset(markup.root)).toBe(instance);
    instance.init();
    instance.destroy();
    instance.destroy();
    instance.add();
    instance.move(markup.item, "up");

    expect(initialized).toHaveBeenCalledTimes(1);
    expect(destroyed).toHaveBeenCalledTimes(1);
    expect(added).not.toHaveBeenCalled();
    expect(moved).not.toHaveBeenCalled();
  });
});
