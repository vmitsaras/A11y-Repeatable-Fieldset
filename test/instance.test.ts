import { describe, expect, it } from "vitest";

import { ATTRIBUTES } from "../src/constants";
import {
  A11yRepeatableFieldset,
  createRepeatableFieldset,
  initRepeatableFieldsetAll,
  RepeatableFieldsetError
} from "../src/index";
import {
  createTestRepeatableFieldsetMarkup,
  type TestRepeatableFieldsetMarkup
} from "./helpers/create-markup";

function createMarkup(): TestRepeatableFieldsetMarkup {
  return createTestRepeatableFieldsetMarkup(document);
}

function rekeyMarkup(
  markup: TestRepeatableFieldsetMarkup,
  key: string
): void {
  markup.item.setAttribute(ATTRIBUTES.key, key);
  markup.input.id = `contact-${key}-name`;
  markup.input.name = `contacts[${key}][name]`;

  const label = markup.item.querySelector("label");

  if (label !== null) {
    label.htmlFor = markup.input.id;
  }
}

describe("A11yRepeatableFieldset duplicate-instance protection", () => {
  it("reuses one active instance across constructors and the factory", () => {
    const markup = createMarkup();
    const first = new A11yRepeatableFieldset(markup.root);
    const second = new A11yRepeatableFieldset(markup.root);
    const fromFactory = createRepeatableFieldset(markup.root);

    expect(second).toBe(first);
    expect(fromFactory).toBe(first);
  });

  it("makes repeated init calls idempotent", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root);

    expect(instance.init()).toBe(instance);
    expect(instance.init()).toBe(instance);
    expect(createRepeatableFieldset(markup.root)).toBe(instance);
  });

  it("ignores replacement options when an active root is reused", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root, {
      minimum: 1
    });

    expect(
      new A11yRepeatableFieldset(markup.root, {
        minimum: -1
      })
    ).toBe(instance);
  });

  it("keeps separate roots isolated", () => {
    const firstMarkup = createMarkup();
    const secondMarkup = createMarkup();
    rekeyMarkup(secondMarkup, "server-84");

    const first = createRepeatableFieldset(firstMarkup.root);
    const second = createRepeatableFieldset(secondMarkup.root);

    expect(first).not.toBe(second);
    expect(createRepeatableFieldset(firstMarkup.root)).toBe(first);
    expect(createRepeatableFieldset(secondMarkup.root)).toBe(second);
  });

  it("does not retain a registration after failed discovery", () => {
    const markup = createMarkup();
    markup.addButton.hidden = false;

    expect(() => createRepeatableFieldset(markup.root)).toThrowError(
      RepeatableFieldsetError
    );

    markup.addButton.hidden = true;
    const recovered = createRepeatableFieldset(markup.root);

    expect(recovered).toBeInstanceOf(A11yRepeatableFieldset);
    expect(createRepeatableFieldset(markup.root)).toBe(recovered);
  });

  it("unregisters on destroy without changing author markup", () => {
    const markup = createMarkup();
    const before = markup.root.cloneNode(true);
    const first = createRepeatableFieldset(markup.root);

    first.destroy();

    expect(markup.root.isEqualNode(before)).toBe(true);

    const replacement = createRepeatableFieldset(markup.root);

    expect(replacement).not.toBe(first);
    expect(createRepeatableFieldset(markup.root)).toBe(replacement);
  });

  it("does not revive a destroyed instance or let it remove a replacement", () => {
    const markup = createMarkup();
    const first = createRepeatableFieldset(markup.root);
    first.destroy();

    const replacement = createRepeatableFieldset(markup.root);

    expect(first.init()).toBe(first);
    first.destroy();
    expect(createRepeatableFieldset(markup.root)).toBe(replacement);
  });

  it("makes repeated destroy calls safe and silent", () => {
    const markup = createMarkup();
    const instance = createRepeatableFieldset(markup.root);

    expect(() => {
      instance.destroy();
      instance.destroy();
    }).not.toThrow();
  });
});

describe("initRepeatableFieldsetAll", () => {
  it("initializes every top-level root once and returns a frozen array", () => {
    const firstMarkup = createMarkup();
    const secondMarkup = createMarkup();
    rekeyMarkup(secondMarkup, "server-84");

    const firstPass = initRepeatableFieldsetAll(document);
    const secondPass = initRepeatableFieldsetAll(document);

    expect(firstPass).toHaveLength(2);
    expect(Object.isFrozen(firstPass)).toBe(true);
    expect(secondPass).toHaveLength(2);
    expect(secondPass[0]).toBe(firstPass[0]);
    expect(secondPass[1]).toBe(firstPass[1]);
    expect(firstPass[0]).toBe(
      createRepeatableFieldset(firstMarkup.root)
    );
    expect(firstPass[1]).toBe(
      createRepeatableFieldset(secondMarkup.root)
    );
  });

  it("uses document only when the explicit initializer is called", () => {
    const markup = createMarkup();
    const initialized = initRepeatableFieldsetAll();

    expect(initialized).toHaveLength(1);
    expect(initialized[0]).toBe(
      createRepeatableFieldset(markup.root)
    );
  });

  it("includes a marked scope root itself", () => {
    const markup = createMarkup();

    const [instance] = initRepeatableFieldsetAll(markup.root);

    expect(instance).toBe(createRepeatableFieldset(markup.root));
  });

  it("skips nested roots while initializing their top-level owner", () => {
    const parent = createMarkup();
    const nested = createMarkup();
    rekeyMarkup(nested, "nested-1");
    parent.item.append(nested.root);

    const initialized = initRepeatableFieldsetAll(document);

    expect(initialized).toHaveLength(1);
    expect(initialized[0]).toBe(
      createRepeatableFieldset(parent.root)
    );
  });

  it("rejects a non-parent-node scope with a typed error", () => {
    let thrown: unknown;

    try {
      initRepeatableFieldsetAll(
        "not-a-scope" as unknown as ParentNode
      );
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(RepeatableFieldsetError);
    expect(thrown).toMatchObject({
      code: "invalid-root",
      root: null
    });
  });

  it("rejects a marked non-HTML scope root", () => {
    const svg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    svg.setAttribute(ATTRIBUTES.root, "");
    let thrown: unknown;

    try {
      initRepeatableFieldsetAll(svg);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(RepeatableFieldsetError);
    expect(thrown).toMatchObject({
      code: "invalid-root",
      element: svg
    });
  });
});
