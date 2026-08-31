import { describe, expect, it } from "vitest";

import { createTestRepeatableFieldsetMarkup } from "./helpers/create-markup";

describe.sequential("Vitest jsdom scaffold", () => {
  it("creates semantic repeatable-fieldset markup in the supplied document", () => {
    const markup = createTestRepeatableFieldsetMarkup(document);
    const view = document.defaultView;

    if (!view) {
      throw new Error("The test document has no default view.");
    }

    expect(markup.root.ownerDocument).toBe(document);
    expect(markup.item).toBeInstanceOf(view.HTMLFieldSetElement);
    expect(markup.item.querySelector("legend")?.textContent).toContain(
      "Contact 1"
    );
    expect(markup.input.labels?.item(0)?.textContent).toBe("Name");
    expect(markup.addButton.type).toBe("button");
    expect(markup.removeButton.type).toBe("button");
    expect(markup.addButton.hidden).toBe(true);
    expect(markup.removeButton.hidden).toBe(true);
    expect(markup.template.content.contains(markup.templateItem)).toBe(true);
    expect(markup.templateItem.isConnected).toBe(false);
  });

  it("supports focus and owner-realm bubbling CustomEvents", () => {
    expect(document.body.childElementCount).toBe(0);

    const markup = createTestRepeatableFieldsetMarkup(document);
    const CustomEventConstructor = document.defaultView?.CustomEvent;
    const observedEvents: Event[] = [];

    if (!CustomEventConstructor) {
      throw new Error("The test document has no CustomEvent constructor.");
    }

    document.addEventListener(
      "a11y-repeatable-fieldset:test",
      (event) => {
        observedEvents.push(event);
      },
      { once: true }
    );

    markup.input.focus();
    markup.root.dispatchEvent(
      new CustomEventConstructor("a11y-repeatable-fieldset:test", {
        bubbles: true,
        composed: false,
        cancelable: false,
        detail: {
          root: markup.root
        }
      })
    );

    expect(document.activeElement).toBe(markup.input);
    expect(observedEvents).toHaveLength(1);
    expect(observedEvents[0]).toBeInstanceOf(CustomEventConstructor);
    expect(observedEvents[0]?.target).toBe(markup.root);
  });
});
