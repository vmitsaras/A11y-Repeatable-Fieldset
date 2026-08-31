import {
  type RepeatableFieldsetAddon,
  type RepeatableFieldsetAddonContext,
  type RepeatableFieldsetCleanup,
  type RepeatableFieldsetCustomEvent,
  type RepeatableFieldsetEventMap,
  type RepeatableFieldsetItemAddonContext
} from "../../src/index";

export type AddonHarnessRecord = Readonly<{
  readonly kind:
    | "component-setup"
    | "component-cleanup"
    | "item-setup"
    | "item-cleanup";
  readonly addonId: string;
  readonly key: string | null;
  readonly phase: "existing" | "added" | null;
}>;

export interface AddonHarnessAddonOptions {
  readonly componentSetup?: (
    context: RepeatableFieldsetAddonContext
  ) => void | RepeatableFieldsetCleanup;
  readonly itemSetup?: (
    context: RepeatableFieldsetItemAddonContext
  ) => void | RepeatableFieldsetCleanup;
  readonly subscribeTo?: keyof RepeatableFieldsetEventMap;
  readonly onEvent?: (
    event: RepeatableFieldsetCustomEvent<keyof RepeatableFieldsetEventMap>
  ) => void;
}

export interface AddonHarness {
  readonly records: readonly AddonHarnessRecord[];
  readonly retainedItems: ReadonlySet<HTMLFieldSetElement>;
  createAddon(
    id: string,
    options?: AddonHarnessAddonOptions
  ): RepeatableFieldsetAddon;
  getSubscriptionCount(): number;
}

function combineCleanups(
  first: void | RepeatableFieldsetCleanup,
  second: void | RepeatableFieldsetCleanup
): void | RepeatableFieldsetCleanup {
  if (first === undefined && second === undefined) {
    return undefined;
  }

  return () => {
    second?.();
    first?.();
  };
}

/**
 * Creates test-only addon values and observable lifecycle records. It never
 * enters the runtime bundle and makes retained item references explicit.
 */
export function createAddonHarness(): AddonHarness {
  const records: AddonHarnessRecord[] = [];
  const retainedItems = new Set<HTMLFieldSetElement>();
  let subscriptions = 0;

  const record = (
    kind: AddonHarnessRecord["kind"],
    addonId: string,
    key: string | null = null,
    phase: AddonHarnessRecord["phase"] = null
  ): void => {
    records.push(Object.freeze({ kind, addonId, key, phase }));
  };

  return Object.freeze({
    records,
    retainedItems,
    createAddon(
      id: string,
      options: AddonHarnessAddonOptions = {}
    ): RepeatableFieldsetAddon {
      return {
        id,
        setup(context) {
          record("component-setup", id);
          const suppliedCleanup = options.componentSetup?.(context);

          if (options.subscribeTo === undefined) {
            return suppliedCleanup;
          }

          let subscribed = true;
          subscriptions += 1;
          const unsubscribe = context.on(options.subscribeTo, (event) => {
            options.onEvent?.(
              event as RepeatableFieldsetCustomEvent<
                keyof RepeatableFieldsetEventMap
              >
            );
          });

          return combineCleanups(suppliedCleanup, () => {
            if (!subscribed) {
              return;
            }

            subscribed = false;
            subscriptions -= 1;
            unsubscribe();
            record("component-cleanup", id);
          });
        },
        setupItem(context) {
          record("item-setup", id, context.item.key, context.phase);
          retainedItems.add(context.item.element);
          const suppliedCleanup = options.itemSetup?.(context);

          return combineCleanups(suppliedCleanup, () => {
            retainedItems.delete(context.item.element);
            record("item-cleanup", id, context.item.key, context.phase);
          });
        }
      } satisfies RepeatableFieldsetAddon;
    },
    getSubscriptionCount: () => subscriptions
  });
}
