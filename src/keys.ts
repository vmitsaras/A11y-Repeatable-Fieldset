import {
  GENERATED_KEY_PREFIX,
  ITEM_KEY_PATTERN
} from "./constants";
import {
  RepeatableFieldsetError,
  type RepeatableFieldsetErrorCode,
  type RepeatableFieldsetErrorOptions
} from "./errors";

export type RepeatableFieldsetKey = string;

export type RepeatableFieldsetKeySource =
  | "initialization"
  | "add"
  | "duplicate";

export interface RepeatableFieldsetKeyFactoryContext {
  readonly root: HTMLElement;
  readonly source: RepeatableFieldsetKeySource;
  readonly sequence: number;
  readonly reservedKeys: readonly RepeatableFieldsetKey[];
}

export type RepeatableFieldsetKeyFactory = (
  context: Readonly<RepeatableFieldsetKeyFactoryContext>
) => RepeatableFieldsetKey;

function createErrorOptions(
  root: HTMLElement,
  element: Element | undefined,
  cause: unknown
): RepeatableFieldsetErrorOptions {
  return {
    root,
    ...(element === undefined ? {} : { element }),
    ...(cause === undefined ? {} : { cause })
  };
}

/**
 * Owns every key observed or allocated during one component lifetime.
 *
 * There is intentionally no release operation: detaching an item cannot make
 * its key available for reuse.
 */
export class StableKeyAllocator {
  private readonly reservedKeys = new Set<RepeatableFieldsetKey>();

  private readonly root: HTMLElement;

  private readonly keyFactory: RepeatableFieldsetKeyFactory | undefined;

  private nextDefaultNumber = 1;

  private allocationSequence = 0;

  public constructor(
    root: HTMLElement,
    initialKeys: Iterable<RepeatableFieldsetKey> = [],
    keyFactory: RepeatableFieldsetKeyFactory | undefined = undefined
  ) {
    this.root = root;
    this.keyFactory = keyFactory;

    for (const key of initialKeys) {
      this.reserve(key);
    }
  }

  public allocate(
    source: RepeatableFieldsetKeySource,
    element?: Element
  ): RepeatableFieldsetKey {
    this.allocationSequence += 1;

    if (this.keyFactory === undefined) {
      return this.allocateDefault();
    }

    const context = Object.freeze({
      root: this.root,
      source,
      sequence: this.allocationSequence,
      reservedKeys: this.getReservedKeys()
    }) satisfies Readonly<RepeatableFieldsetKeyFactoryContext>;
    let candidate: unknown;

    try {
      candidate = this.keyFactory(context);
    } catch (cause) {
      throw this.error(
        "invalid-key",
        "The key factory threw while generating a stable item key.",
        element,
        cause
      );
    }

    return this.reserve(candidate, element);
  }

  public reserve(
    candidate: unknown,
    element?: Element
  ): RepeatableFieldsetKey {
    if (
      typeof candidate !== "string" ||
      !ITEM_KEY_PATTERN.test(candidate)
    ) {
      throw this.error(
        "invalid-key",
        `Generated item keys must match ${ITEM_KEY_PATTERN.source}.`,
        element
      );
    }

    if (this.reservedKeys.has(candidate)) {
      throw this.error(
        "duplicate-key",
        `The item key "${candidate}" is already reserved.`,
        element
      );
    }

    this.reservedKeys.add(candidate);
    return candidate;
  }

  public has(key: RepeatableFieldsetKey): boolean {
    return this.reservedKeys.has(key);
  }

  public getReservedKeys(): readonly RepeatableFieldsetKey[] {
    return Object.freeze(Array.from(this.reservedKeys));
  }

  private allocateDefault(): RepeatableFieldsetKey {
    let key = `${GENERATED_KEY_PREFIX}${this.nextDefaultNumber}`;
    this.nextDefaultNumber += 1;

    while (this.reservedKeys.has(key)) {
      key = `${GENERATED_KEY_PREFIX}${this.nextDefaultNumber}`;
      this.nextDefaultNumber += 1;
    }

    this.reservedKeys.add(key);
    return key;
  }

  private error(
    code: Extract<
      RepeatableFieldsetErrorCode,
      "invalid-key" | "duplicate-key"
    >,
    message: string,
    element?: Element,
    cause?: unknown
  ): RepeatableFieldsetError {
    return new RepeatableFieldsetError(
      code,
      message,
      createErrorOptions(this.root, element, cause)
    );
  }
}
