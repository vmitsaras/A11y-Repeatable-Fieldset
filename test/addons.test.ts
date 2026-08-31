import { describe, expectTypeOf, it } from "vitest";

import {
  EVENTS,
  type RepeatableFieldsetAddon,
  type RepeatableFieldsetItemAddonContext,
  type RepeatableFieldsetRemoveRequest
} from "../src/index";

describe("addon type exports", () => {
  it("supports synchronous component and item hooks with typed event cleanup", () => {
    const addon = {
      id: "example.validation-bridge",
      setup(context) {
        const unsubscribe = context.on(EVENTS.itemAdded, (event) => {
          expectTypeOf(event.detail.source).toEqualTypeOf<"control" | "api">();
          expectTypeOf(event.detail.item.element).toEqualTypeOf<HTMLFieldSetElement>();
        });
        const moveCleanup = context.on(EVENTS.itemMoved, (event) => {
          expectTypeOf(event.detail.direction).toEqualTypeOf<"up" | "down">();
          expectTypeOf(event.detail.previousPosition).toEqualTypeOf<number>();
        });
        const removeRequestCleanup = context.onRemoveRequest((request) => {
          expectTypeOf(request).toEqualTypeOf<
            Readonly<RepeatableFieldsetRemoveRequest>
          >();
          expectTypeOf(request.trigger).toEqualTypeOf<HTMLButtonElement>();
          expectTypeOf(request.remove).toBeFunction();
        });

        return () => {
          unsubscribe();
          moveCleanup();
          removeRequestCleanup();
        };
      },
      setupItem(context) {
        expectTypeOf(context).toEqualTypeOf<RepeatableFieldsetItemAddonContext>();
        expectTypeOf(context.phase).toEqualTypeOf<"existing" | "added">();
      }
    } satisfies RepeatableFieldsetAddon;

    expectTypeOf(addon.setup).toMatchTypeOf<
      NonNullable<RepeatableFieldsetAddon["setup"]>
    >();
  });
});
