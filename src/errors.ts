export const REPEATABLE_FIELDSET_ERROR_CODES = Object.freeze([
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
] as const);

export type RepeatableFieldsetErrorCode =
  (typeof REPEATABLE_FIELDSET_ERROR_CODES)[number];

export interface RepeatableFieldsetErrorOptions {
  readonly root?: HTMLElement;
  readonly element?: Element;
  readonly cause?: unknown;
}

/**
 * A contract error raised while validating options or initializing a root.
 *
 * Normal operation boundaries such as minimum and maximum counts use typed
 * operation results instead of this error class.
 */
export class RepeatableFieldsetError extends Error {
  public readonly code: RepeatableFieldsetErrorCode;

  public readonly root: HTMLElement | null;

  public readonly element: Element | null;

  public constructor(
    code: RepeatableFieldsetErrorCode,
    message: string,
    options: RepeatableFieldsetErrorOptions = {}
  ) {
    super(
      message,
      options.cause === undefined ? undefined : { cause: options.cause }
    );

    this.name = "RepeatableFieldsetError";
    this.code = code;
    this.root = options.root ?? null;
    this.element = options.element ?? null;
  }
}
