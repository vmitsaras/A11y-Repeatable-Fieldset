import { afterEach, describe, expect, it, vi } from "vitest";

import { ATTRIBUTES, CLASSES, SELECTORS } from "../src/constants";
import { createRepeatableFieldset } from "../src/index";
import { STATUS_CLEAR_DELAY_MS } from "../src/status";
import {
  createTestRepeatableFieldsetMarkup,
  type TestRepeatableFieldsetMarkup
} from "./helpers/create-markup";

function createMarkup(): TestRepeatableFieldsetMarkup {
  return createTestRepeatableFieldsetMarkup(document);
}

function getStatus(root: HTMLElement): HTMLElement {
  const status = root.querySelector<HTMLElement>(SELECTORS.status);

  if (status === null) {
    throw new Error("The managed status region is missing.");
  }

  return status;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("polite status announcements", () => {
  it("creates at most one owned polite atomic region when enabled", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root);
    const status = getStatus(markup.root);

    expect(
      markup.root.querySelectorAll(SELECTORS.status)
    ).toHaveLength(1);
    expect(status.parentElement).toBe(markup.root);
    expect(status.className).toBe(CLASSES.status);
    expect(status.getAttribute("role")).toBe("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.getAttribute("aria-atomic")).toBe("true");
    expect(status.textContent).toBe("");

    instance.init();

    expect(
      markup.root.querySelectorAll(SELECTORS.status)
    ).toHaveLength(1);
  });

  it("reuses author DOM and restores its exact empty semantics on destroy", () => {
    const markup = createMarkup();
    const status = document.createElement("div");
    status.setAttribute(ATTRIBUTES.status, "");
    status.setAttribute("role", "log");
    status.setAttribute("aria-live", "assertive");
    status.setAttribute("aria-atomic", "false");
    status.className = "author-status";
    markup.root.append(status);
    const before = status.cloneNode(true);
    const instance = createRepeatableFieldset(markup.root, {
      itemLabel: "Contact"
    });

    expect(status.getAttribute("role")).toBe("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.getAttribute("aria-atomic")).toBe("true");
    expect(instance.add().ok).toBe(true);
    expect(status.textContent).toBe(
      "Contact 2 added. 2 items total."
    );

    instance.destroy();

    expect(status.parentElement).toBe(markup.root);
    expect(status.isEqualNode(before)).toBe(true);
  });

  it("creates no region and writes nothing when announcements are disabled", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root, {
      announceChanges: false
    });
    const added = instance.add();

    expect(added.ok).toBe(true);
    expect(markup.root.querySelector(SELECTORS.status)).toBeNull();

    if (added.ok) {
      expect(instance.remove(added.item).ok).toBe(true);
    }

    expect(markup.root.querySelector(SELECTORS.status)).toBeNull();
  });

  it("does not mutate an author region when announcements are disabled", () => {
    const markup = createMarkup();
    const status = document.createElement("div");
    status.setAttribute(ATTRIBUTES.status, "");
    status.setAttribute("role", "log");
    status.setAttribute("aria-live", "off");
    markup.root.append(status);
    const before = status.cloneNode(true);
    const instance = createRepeatableFieldset(markup.root, {
      announceChanges: false
    });

    expect(instance.add().ok).toBe(true);
    expect(status.isEqualNode(before)).toBe(true);

    instance.destroy();

    expect(status.isEqualNode(before)).toBe(true);
  });

  it("combines the Add and maximum-boundary messages", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root, {
      itemLabel: "Contact",
      maximum: 2
    });

    const result = instance.add();

    expect(result.ok).toBe(true);
    expect(getStatus(markup.root).textContent).toBe(
      "Contact 2 added. 2 items total. Maximum of 2 items reached."
    );
  });

  it("combines the Remove and minimum-boundary messages", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root, {
      itemLabel: "Contact"
    });
    const added = instance.add();

    if (!added.ok) {
      throw new Error("Expected Add to succeed.");
    }

    const result = instance.remove(added.item);

    expect(result.ok).toBe(true);
    expect(getStatus(markup.root).textContent).toBe(
      "Contact 2 removed. 1 item remaining. Minimum of 1 item reached."
    );
  });

  it("announces blocked API boundaries without structural success", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 1,
      maximum: 1
    });
    const status = getStatus(markup.root);

    expect(instance.add()).toMatchObject({
      ok: false,
      reason: "maximum"
    });
    expect(status.textContent).toBe(
      "Maximum of 1 item reached."
    );
    expect(instance.getCount()).toBe(1);

    expect(instance.remove(markup.item)).toMatchObject({
      ok: false,
      reason: "minimum"
    });
    expect(status.textContent).toBe(
      "Minimum of 1 item reached."
    );
    expect(instance.getCount()).toBe(1);
  });

  it("replaces a stale clear timer after a newer operation", () => {
    vi.useFakeTimers();
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root, {
      itemLabel: "Contact"
    });
    const status = getStatus(markup.root);
    const added = instance.add();

    if (!added.ok) {
      throw new Error("Expected Add to succeed.");
    }

    expect(status.textContent).toBe(
      "Contact 2 added. 2 items total."
    );
    vi.advanceTimersByTime(STATUS_CLEAR_DELAY_MS / 2);

    expect(instance.remove(added.item).ok).toBe(true);
    expect(status.textContent).toBe(
      "Contact 2 removed. 1 item remaining. Minimum of 1 item reached."
    );

    vi.advanceTimersByTime(STATUS_CLEAR_DELAY_MS / 2);
    expect(status.textContent).not.toBe("");

    vi.advanceTimersByTime(STATUS_CLEAR_DELAY_MS / 2);
    expect(status.textContent).toBe("");
  });

  it("cancels pending work and removes only generated status DOM on destroy", () => {
    vi.useFakeTimers();
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root);
    const status = getStatus(markup.root);

    expect(instance.add().ok).toBe(true);
    expect(status.textContent).not.toBe("");

    instance.destroy();

    expect(status.isConnected).toBe(false);
    expect(markup.root.querySelector(SELECTORS.status)).toBeNull();

    vi.advanceTimersByTime(STATUS_CLEAR_DELAY_MS * 2);

    expect(markup.root.querySelector(SELECTORS.status)).toBeNull();
    expect(status.textContent).not.toBe("");
  });

  it("does not announce an Add that fails template validation", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root);
    const templateFocus =
      markup.templateItem.querySelector<HTMLInputElement>(
        `[${ATTRIBUTES.focus}]`
      );

    if (templateFocus === null) {
      throw new Error("The template focus target is missing.");
    }

    templateFocus.disabled = true;

    expect(instance.add()).toMatchObject({
      ok: false,
      reason: "invalid-template"
    });
    expect(getStatus(markup.root).textContent).toBe("");
  });

  it("rolls generated status DOM back after a later initialization failure", () => {
    const markup = createMarkup();
    const addEventListener = vi
      .spyOn(markup.root, "addEventListener")
      .mockImplementationOnce(() => {
        throw new Error("listener setup failed");
      });

    expect(() => createRepeatableFieldset(markup.root)).toThrow();
    expect(markup.root.querySelector(SELECTORS.status)).toBeNull();
    expect(markup.addButton.hidden).toBe(true);
    expect(markup.removeButton.hidden).toBe(true);

    addEventListener.mockRestore();

    expect(() =>
      createRepeatableFieldset(markup.root)
    ).not.toThrow();
    expect(
      markup.root.querySelectorAll(SELECTORS.status)
    ).toHaveLength(1);
  });

  it("removes a generated region before clean reinitialization creates one replacement", () => {
    const markup = createMarkup();
    const first = createRepeatableFieldset(markup.root);
    const firstStatus = getStatus(markup.root);

    first.destroy();
    const replacement = createRepeatableFieldset(markup.root);
    const replacementStatus = getStatus(markup.root);

    expect(replacement).not.toBe(first);
    expect(firstStatus.isConnected).toBe(false);
    expect(replacementStatus).not.toBe(firstStatus);
    expect(
      markup.root.querySelectorAll(SELECTORS.status)
    ).toHaveLength(1);
  });
});
