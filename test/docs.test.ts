import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { docs } from "../src/docs";

describe("structured docs metadata", () => {
  it("identifies the published package with installation metadata", () => {
    expect(docs.name).toBe("A11yRepeatableFieldset");
    expect(docs.packageName).toBe("a11y-repeatable-fieldset");
    expect(docs.version).toBe("1.0.0");
    expect(docs.status).toBe("published");
    expect(docs.npm).toBe(
      "https://www.npmjs.com/package/a11y-repeatable-fieldset"
    );
    expect(docs.install).toBe("npm install a11y-repeatable-fieldset");
    expect(docs.usage).toContain("createRepeatableFieldset");
    expect(Object.isFrozen(docs)).toBe(true);
  });

  it("records the locked selectors, results, errors, and events", () => {
    expect(docs.selectors.map(({ selector }) => selector)).toContain(
      "[data-a11y-repeatable-fieldset]"
    );
    expect(docs.defaults).toContainEqual(
      expect.objectContaining({
        name: "templateToken",
        value: "__A11Y_REPEATABLE_KEY__"
      })
    );
    expect(docs.cssCustomProperties).toHaveLength(11);
    expect(
      docs.cssCustomProperties.every(({ name }) =>
        name.startsWith("--a11y-repeatable-fieldset-")
      )
    ).toBe(true);
    expect(docs.cssCustomProperties).toContainEqual(
      expect.objectContaining({
        name: "--a11y-repeatable-fieldset-focus-ring-color",
        defaultValue: "Highlight"
      })
    );
    expect(JSON.stringify(docs.cssCustomProperties)).not.toContain("--_");
    expect(docs.results).toContainEqual({
      operation: "add",
      failureReasons: [
        "inactive",
        "maximum",
        "invalid-key",
        "duplicate-key",
        "invalid-template",
        "addon-error"
      ]
    });
    expect(docs.results).toContainEqual({
      operation: "duplicate",
      failureReasons: [
        "inactive",
        "maximum",
        "unowned-item",
        "invalid-key",
        "duplicate-key",
        "invalid-template",
        "copy-error",
        "addon-error"
      ]
    });
    expect(docs.results).toContainEqual({
      operation: "remove",
      failureReasons: [
        "inactive",
        "minimum",
        "unowned-item",
        "addon-error"
      ]
    });
    expect(docs.results).toContainEqual({
      operation: "restore",
      failureReasons: [
        "inactive",
        "not-ready",
        "consumed",
        "maximum",
        "conflict",
        "invalid-template",
        "restore-error",
        "addon-error"
      ]
    });
    expect(docs.results).toContainEqual({
      operation: "move",
      failureReasons: ["inactive", "unowned-item", "boundary", "move-error"]
    });
    expect(docs.errorCodes).toContain("unresolved-template-token");
    expect(docs.limitations).toContain(
      "MANUAL_ACCESSIBILITY_TEST_RECORD.md records 2 of 6 target environments exercised as of 2026-08-31: the basic Add/Remove flow passed with Chrome reduced-motion emulation on macOS, VoiceOver + Safari produced a partial result with open middle-removal and stale-group-context evidence, and a supplemental 320 CSS-pixel check found documentation-shell clipping."
    );
    expect(docs.events.map(({ name }) => name)).toEqual([
      "a11y-repeatable-fieldset:init",
      "a11y-repeatable-fieldset:item-added",
      "a11y-repeatable-fieldset:item-duplicated",
      "a11y-repeatable-fieldset:item-removed",
      "a11y-repeatable-fieldset:item-restored",
      "a11y-repeatable-fieldset:item-moved",
      "a11y-repeatable-fieldset:destroy"
    ]);
  });

  it("marks completed APIs and executable examples implemented", () => {
    expect(docs.api).not.toHaveLength(0);
    const implemented = docs.api
      .filter(({ status }) => status === "implemented")
      .map(({ name }) => name);

    expect(implemented).toEqual([
      "new A11yRepeatableFieldset(root, options)",
      "createRepeatableFieldset(root, options)",
      "initRepeatableFieldsetAll(scope, options)",
      "init()",
      "RepeatableFieldsetInstance",
      "RepeatableFieldsetKey",
      "RepeatableFieldsetKeySource",
      "RepeatableFieldsetKeyFactoryContext",
      "RepeatableFieldsetKeyFactory",
      "RepeatableFieldsetItem",
      "RepeatableFieldsetOperationSource",
      "RepeatableFieldsetAddOptions",
      "RepeatableFieldsetAddResult",
      "add(options)",
      "RepeatableFieldsetDuplicateTarget",
      "RepeatableFieldsetDuplicateOptions",
      "RepeatableFieldsetDuplicateResult",
      "duplicate(target, options)",
      "RepeatableFieldsetRemoveTarget",
      "RepeatableFieldsetRemoveOptions",
      "RepeatableFieldsetRemoveResult",
      "remove(target, options)",
      "RepeatableFieldsetRestoreOptions",
      "RepeatableFieldsetRestoreResult",
      "RepeatableFieldsetMoveTarget",
      "RepeatableFieldsetMoveDirection",
      "RepeatableFieldsetMoveBoundary",
      "RepeatableFieldsetMoveResult",
      "move(target, direction)",
      "getItems()",
      "getCount()",
      "canAdd()",
      "canRemove()",
      "destroy()",
      "DEFAULT_MESSAGE_FORMATTERS",
      "RepeatableFieldsetMessageContext",
      "RepeatableFieldsetItemMessageContext",
      "RepeatableFieldsetBoundaryMessageContext",
      "RepeatableFieldsetDuplicateMessageContext",
      "RepeatableFieldsetMoveMessageContext",
      "RepeatableFieldsetMoveBoundaryMessageContext",
      "RepeatableFieldsetMessageFormatter",
      "RepeatableFieldsetMessageFormatters",
      "RepeatableFieldsetOptions",
      "RepeatableFieldsetError",
      "RepeatableFieldsetEventBase",
      "RepeatableFieldsetInitEventDetail",
      "RepeatableFieldsetItemAddedEventDetail",
      "RepeatableFieldsetItemDuplicatedEventDetail",
      "RepeatableFieldsetItemRemovedEventDetail",
      "RepeatableFieldsetItemRestoredEventDetail",
      "RepeatableFieldsetItemMovedEventDetail",
      "RepeatableFieldsetDestroyEventDetail",
      "RepeatableFieldsetCleanup",
      "RepeatableFieldsetRemoveRequest",
      "RepeatableFieldsetRemoveRequestHandler",
      "RepeatableFieldsetRemovalRestoration",
      "RepeatableFieldsetRemovePreparationContext",
      "RepeatableFieldsetRemovePreparation",
      "RepeatableFieldsetAddonContext",
      "RepeatableFieldsetItemAddonContext",
      "RepeatableFieldsetAddon",
      "createValidationBridge(options)",
      "ValidationBridgeOptions",
      "ValidationBridgeItemContext",
      "ValidationBridgeRegisterItem",
      "createLegendSyncAddon(options)",
      "LegendSyncOptions",
      "LegendSyncUpdateEvent",
      "createRemoveGuard(options)",
      "RemoveGuardOptions",
      "RemoveGuardContext",
      "RemoveGuardShouldConfirm",
      "RemoveGuardConfirm",
      "RemoveGuardErrorHandler",
      "createAccessibleReorder(options)",
      "AccessibleReorderOptions",
      "ACCESSIBLE_REORDER_ATTRIBUTES",
      "createDuplicateItem(options)",
      "DuplicateItemOptions",
      "DUPLICATE_ITEM_ATTRIBUTES",
      "createUndoRemove(options)",
      "UndoRemoveOptions",
      "UNDO_REMOVE_ATTRIBUTES",
      "createFormMemoryBridge(options)",
      "FormMemoryBridgeOptions",
      "FormMemoryDraftControlAdapter",
      "FormMemoryBridgeInitializeResult",
      "RepeatableFieldsetEventMap",
      "RepeatableFieldsetCustomEvent<Name>",
      "EVENTS"
    ]);
    expect(
      docs.api
        .filter(({ name }) => !implemented.includes(name))
        .every(({ status }) => status === "planned")
    ).toBe(true);
    expect(
      docs.api.find(({ name }) => name === "RepeatableFieldsetOptions")
        ?.type
    ).toContain("keyFactory?: RepeatableFieldsetKeyFactory");
    expect(
      docs.api.find(({ name }) => name === "RepeatableFieldsetOptions")
        ?.type
    ).toContain(
      "messageFormatters?: Partial<RepeatableFieldsetMessageFormatters>"
    );
    expect(
      docs.api.find(({ name }) => name === "RepeatableFieldsetOptions")
        ?.type
    ).toContain("addons?: readonly RepeatableFieldsetAddon[]");
    expect(
      docs.api.find(({ name }) => name === "RepeatableFieldsetAddOptions")
        ?.type
    ).toContain("focus?: boolean");
    expect(
      docs.api.find(({ name }) => name === "RepeatableFieldsetRemoveOptions")
        ?.type
    ).toContain("focus?: boolean");
    expect(docs.examples).toHaveLength(16);
    expect(
      docs.examples.every(({ status }) => status === "implemented")
    ).toBe(true);
    expect(docs.examples.map(({ path }) => path)).toEqual([
      "docs/basic.html",
      "examples/basic/index.html",
      "docs/existing-items.html",
      "docs/limits.html",
      "docs/complex-fields.html",
      "docs/no-javascript.html",
      "docs/event-inspector.html",
      "docs/realistic-multi-person.html",
      "docs/transactional-failure-lab.html",
      "docs/edge-cases.html",
      "docs/addons.html",
      "docs/addons.html",
      "docs/duplicate-item.html",
      "docs/undo-remove.html",
      "docs/validation-integration.html",
      "docs/form-memory-integration.html"
    ]);
    expect(
      docs.examples.every(({ path }) =>
        existsSync(resolve(process.cwd(), path))
      )
    ).toBe(true);
    expect(docs.limitations).toContain(
      "Validation Bridge, Legend Sync, Remove Guard, Accessible Reorder, Duplicate Item, Undo Remove, and Form Memory Bridge are the implemented concrete addons; all are optional, separately exported, dependency-free, and absent from the main runtime entry."
    );
  });
});
