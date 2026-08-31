import { describe, expect, it } from "vitest";

import { DEFAULT_OPTIONS } from "../src/constants";
import {
  REPEATABLE_FIELDSET_ERROR_CODES,
  RepeatableFieldsetError
} from "../src/errors";
import {
  normalizeRepeatableFieldsetOptions,
  type RepeatableFieldsetOptions
} from "../src/options";
import { DEFAULT_MESSAGE_FORMATTERS } from "../src/messages";

function createRoot(): HTMLElement {
  const root = document.createElement("section");
  root.setAttribute("data-a11y-repeatable-fieldset", "");
  return root;
}

describe("RepeatableFieldsetError", () => {
  it("centralizes the complete frozen initialization error-code contract", () => {
    expect(REPEATABLE_FIELDSET_ERROR_CODES).toEqual([
      "invalid-root",
      "invalid-options",
      "missing-items-container",
      "multiple-items-containers",
      "missing-template",
      "multiple-templates",
      "invalid-template",
      "missing-add-control",
      "multiple-add-controls",
      "invalid-item",
      "missing-legend",
      "missing-remove-control",
      "multiple-remove-controls",
      "invalid-focus-target",
      "multiple-status-regions",
      "nonempty-status-region",
      "invalid-key",
      "duplicate-key",
      "duplicate-id",
      "unresolved-template-token"
    ]);
    expect(Object.isFrozen(REPEATABLE_FIELDSET_ERROR_CODES)).toBe(true);
  });

  it("retains typed context and an optional cause", () => {
    const root = createRoot();
    const element = document.createElement("button");
    const cause = new Error("Original failure");
    const error = new RepeatableFieldsetError(
      "invalid-options",
      "Invalid component options.",
      { root, element, cause }
    );

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("RepeatableFieldsetError");
    expect(error.code).toBe("invalid-options");
    expect(error.message).toBe("Invalid component options.");
    expect(error.root).toBe(root);
    expect(error.element).toBe(element);
    expect(error.cause).toBe(cause);
  });
});

describe("normalizeRepeatableFieldsetOptions", () => {
  it("returns a new frozen object with the frozen defaults", () => {
    const root = createRoot();
    const first = normalizeRepeatableFieldsetOptions(root);
    const second = normalizeRepeatableFieldsetOptions(root);

    expect(first).toEqual(DEFAULT_OPTIONS);
    expect(second).toEqual(DEFAULT_OPTIONS);
    expect(first).not.toBe(second);
    expect(first).not.toBe(DEFAULT_OPTIONS);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(DEFAULT_OPTIONS)).toBe(true);
  });

  it("trims and parses every supported dataset primitive", () => {
    const root = createRoot();
    root.setAttribute("data-min-items", " 0 ");
    root.setAttribute("data-max-items", " 12 ");
    root.setAttribute("data-item-label", " Contact ");
    root.setAttribute("data-focus-on-add", " false ");
    root.setAttribute("data-announce-changes", " true ");

    expect(normalizeRepeatableFieldsetOptions(root)).toEqual({
      minimum: 0,
      maximum: 12,
      itemLabel: "Contact",
      focusOnAdd: false,
      announceChanges: true,
      messageFormatters: DEFAULT_MESSAGE_FORMATTERS
    });
  });

  it("gives JavaScript values precedence over datasets and defaults", () => {
    const root = createRoot();
    root.setAttribute("data-min-items", "malformed-but-overridden");
    root.setAttribute("data-max-items", "also-overridden");
    root.setAttribute("data-item-label", "Dataset label");
    root.setAttribute("data-focus-on-add", "not-a-boolean");
    root.setAttribute("data-announce-changes", "not-a-boolean");

    const options = Object.freeze({
      minimum: 2,
      maximum: null,
      itemLabel: " JavaScript label ",
      focusOnAdd: false,
      announceChanges: false
    }) satisfies RepeatableFieldsetOptions;

    expect(normalizeRepeatableFieldsetOptions(root, options)).toEqual({
      minimum: 2,
      maximum: null,
      itemLabel: "JavaScript label",
      focusOnAdd: false,
      announceChanges: false,
      messageFormatters: DEFAULT_MESSAGE_FORMATTERS
    });
  });

  it("does not mutate the JavaScript options or author attributes", () => {
    const root = createRoot();
    root.setAttribute("data-min-items", " 1 ");
    root.setAttribute("data-item-label", " Dataset item ");
    const beforeMarkup = root.outerHTML;
    const options = Object.freeze({
      maximum: 4,
      focusOnAdd: false
    }) satisfies RepeatableFieldsetOptions;
    const beforeOptions = { ...options };

    normalizeRepeatableFieldsetOptions(root, options);

    expect(options).toEqual(beforeOptions);
    expect(root.outerHTML).toBe(beforeMarkup);
  });

  it("accepts and preserves a JavaScript-only key factory", () => {
    const root = createRoot();
    const keyFactory = ({ sequence }: { readonly sequence: number }) =>
      `custom-${sequence}`;
    const normalized = normalizeRepeatableFieldsetOptions(root, {
      keyFactory
    });

    expect(normalized.keyFactory).toBe(keyFactory);
    expect(Object.isFrozen(normalized)).toBe(true);
    expect(root.hasAttribute("data-key-factory")).toBe(false);
  });

  it("merges JavaScript-only message formatters into a frozen copy", () => {
    const root = createRoot();
    const added = () => "Custom Add.";
    const supplied = { added };
    const normalized = normalizeRepeatableFieldsetOptions(root, {
      messageFormatters: supplied
    });

    expect(normalized.messageFormatters).toEqual({
      ...DEFAULT_MESSAGE_FORMATTERS,
      added
    });
    expect(normalized.messageFormatters).not.toBe(supplied);
    expect(Object.isFrozen(normalized.messageFormatters)).toBe(true);
    expect(root.hasAttribute("data-message-formatters")).toBe(false);
  });

  it.each([
    null,
    [],
    "messages",
    { added: "not a function" },
    { moved: "not a function" },
    { moveBoundary: "not a function" },
    { unknown: () => "Unknown." }
  ])("rejects invalid message formatter options: %j", (messageFormatters) => {
    const root = createRoot();
    const options = {
      messageFormatters
    } as unknown as RepeatableFieldsetOptions;
    let thrown: unknown;

    try {
      normalizeRepeatableFieldsetOptions(root, options);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(RepeatableFieldsetError);
    expect(thrown).toMatchObject({
      code: "invalid-options",
      root
    });
  });

  it.each([null, {}, [], "factory", 42, true])(
    "rejects a non-function key factory: %j",
    (keyFactory) => {
      const root = createRoot();
      const options = {
        keyFactory
      } as unknown as RepeatableFieldsetOptions;
      const error = (() => {
        try {
          normalizeRepeatableFieldsetOptions(root, options);
        } catch (thrown) {
          return thrown;
        }

        return null;
      })();

      expect(error).toBeInstanceOf(RepeatableFieldsetError);
      expect(error).toMatchObject({
        code: "invalid-options",
        root
      });
    }
  );

  it.each([
    "",
    " ",
    "-1",
    "+1",
    "1.5",
    "1e2",
    "Infinity",
    "9007199254740992"
  ])("rejects malformed dataset integers: %j", (value) => {
    const root = createRoot();
    root.setAttribute("data-min-items", value);

    expect(() => normalizeRepeatableFieldsetOptions(root)).toThrowError(
      RepeatableFieldsetError
    );
  });

  it.each([
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.MAX_SAFE_INTEGER + 1
  ])("rejects invalid JavaScript integers: %j", (minimum) => {
    const root = createRoot();

    expect(() =>
      normalizeRepeatableFieldsetOptions(root, { minimum })
    ).toThrowError(RepeatableFieldsetError);
  });

  it("rejects a maximum below the normalized minimum", () => {
    const root = createRoot();
    root.setAttribute("data-min-items", "3");
    root.setAttribute("data-max-items", "2");
    let thrown: unknown;

    try {
      normalizeRepeatableFieldsetOptions(root);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(RepeatableFieldsetError);
    expect(thrown).toMatchObject({
      code: "invalid-options",
      root
    });
  });

  it.each(["", " ", "TRUE", "False", "1", "0", "yes"])(
    "rejects non-exact dataset booleans: %j",
    (value) => {
      const root = createRoot();
      root.setAttribute("data-focus-on-add", value);

      expect(() => normalizeRepeatableFieldsetOptions(root)).toThrowError(
        RepeatableFieldsetError
      );
    }
  );

  it("rejects truthy JavaScript values instead of coercing them", () => {
    const root = createRoot();
    const options = {
      announceChanges: "true"
    } as unknown as RepeatableFieldsetOptions;
    let thrown: unknown;

    try {
      normalizeRepeatableFieldsetOptions(root, options);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(RepeatableFieldsetError);
    expect(thrown).toMatchObject({
      code: "invalid-options"
    });
  });

  it.each(["", "   "])("rejects empty labels: %j", (itemLabel) => {
    const root = createRoot();

    expect(() =>
      normalizeRepeatableFieldsetOptions(root, { itemLabel })
    ).toThrowError(RepeatableFieldsetError);
  });

  it("rejects a non-string JavaScript label", () => {
    const root = createRoot();
    const options = {
      itemLabel: 42
    } as unknown as RepeatableFieldsetOptions;

    expect(() =>
      normalizeRepeatableFieldsetOptions(root, options)
    ).toThrowError(RepeatableFieldsetError);
  });

  it.each([null, [], "options", true])(
    "rejects a non-record JavaScript options value: %j",
    (value) => {
      const root = createRoot();
      let thrown: unknown;

      try {
        normalizeRepeatableFieldsetOptions(
          root,
          value as unknown as RepeatableFieldsetOptions
        );
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(RepeatableFieldsetError);
      expect(thrown).toMatchObject({
        code: "invalid-options"
      });
    }
  );

  it("ignores unsupported callback-like datasets", () => {
    const root = createRoot();
    root.setAttribute("data-key-factory", "window.createKey");
    root.setAttribute("data-addons", "validation");

    expect(normalizeRepeatableFieldsetOptions(root)).toEqual(DEFAULT_OPTIONS);
  });
});
