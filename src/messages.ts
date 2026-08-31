import type { RepeatableFieldsetKey } from "./keys";

export interface RepeatableFieldsetMessageContext {
  readonly itemLabel: string;
  readonly count: number;
  readonly minimum: number;
  readonly maximum: number | null;
}

export interface RepeatableFieldsetItemMessageContext
  extends RepeatableFieldsetMessageContext {
  /**
   * The added item's current position or the removed item's previous
   * position.
   */
  readonly position: number;
  readonly key: RepeatableFieldsetKey;
}

export interface RepeatableFieldsetMoveMessageContext
  extends RepeatableFieldsetItemMessageContext {
  readonly previousPosition: number;
  readonly direction: "up" | "down";
}

export interface RepeatableFieldsetDuplicateMessageContext
  extends RepeatableFieldsetItemMessageContext {
  readonly sourceKey: RepeatableFieldsetKey;
  readonly sourcePosition: number;
}

export interface RepeatableFieldsetMoveBoundaryMessageContext
  extends RepeatableFieldsetItemMessageContext {
  readonly direction: "up" | "down";
  readonly boundary: "start" | "end";
}

export interface RepeatableFieldsetBoundaryMessageContext
  extends RepeatableFieldsetMessageContext {
  /**
   * Identifies the item associated with a reached boundary. Both values are
   * null when a blocked Add has no candidate item.
   */
  readonly position: number | null;
  readonly key: RepeatableFieldsetKey | null;
}

export type RepeatableFieldsetMessageFormatter<
  Context extends RepeatableFieldsetMessageContext
> = (context: Readonly<Context>) => string;

export interface RepeatableFieldsetMessageFormatters {
  readonly added: RepeatableFieldsetMessageFormatter<
    RepeatableFieldsetItemMessageContext
  >;
  readonly removed: RepeatableFieldsetMessageFormatter<
    RepeatableFieldsetItemMessageContext
  >;
  readonly restored: RepeatableFieldsetMessageFormatter<
    RepeatableFieldsetItemMessageContext
  >;
  readonly duplicated: RepeatableFieldsetMessageFormatter<
    RepeatableFieldsetDuplicateMessageContext
  >;
  readonly moved: RepeatableFieldsetMessageFormatter<
    RepeatableFieldsetMoveMessageContext
  >;
  readonly moveBoundary: RepeatableFieldsetMessageFormatter<
    RepeatableFieldsetMoveBoundaryMessageContext
  >;
  readonly maximum: RepeatableFieldsetMessageFormatter<
    RepeatableFieldsetBoundaryMessageContext
  >;
  readonly minimum: RepeatableFieldsetMessageFormatter<
    RepeatableFieldsetBoundaryMessageContext
  >;
}

function countNoun(count: number): "item" | "items" {
  return count === 1 ? "item" : "items";
}

export const DEFAULT_MESSAGE_FORMATTERS = Object.freeze({
  added(
    context: Readonly<RepeatableFieldsetItemMessageContext>
  ): string {
    return `${context.itemLabel} ${context.position} added. ${context.count} ${countNoun(context.count)} total.`;
  },
  removed(
    context: Readonly<RepeatableFieldsetItemMessageContext>
  ): string {
    return `${context.itemLabel} ${context.position} removed. ${context.count} ${countNoun(context.count)} remaining.`;
  },
  restored(
    context: Readonly<RepeatableFieldsetItemMessageContext>
  ): string {
    return `${context.itemLabel} restored at position ${context.position}. ${context.count} ${countNoun(context.count)} total.`;
  },
  duplicated(
    context: Readonly<RepeatableFieldsetDuplicateMessageContext>
  ): string {
    return `${context.itemLabel} ${context.sourcePosition} duplicated as position ${context.position}. ${context.count} ${countNoun(context.count)} total.`;
  },
  moved(
    context: Readonly<RepeatableFieldsetMoveMessageContext>
  ): string {
    return `${context.itemLabel} moved to position ${context.position} of ${context.count}.`;
  },
  moveBoundary(
    context: Readonly<RepeatableFieldsetMoveBoundaryMessageContext>
  ): string {
    return context.boundary === "start"
      ? `${context.itemLabel} ${context.position} is already first.`
      : `${context.itemLabel} ${context.position} is already last.`;
  },
  maximum(
    context: Readonly<RepeatableFieldsetBoundaryMessageContext>
  ): string {
    const maximum = context.maximum;

    return maximum === null
      ? "Maximum item limit reached."
      : `Maximum of ${maximum} ${countNoun(maximum)} reached.`;
  },
  minimum(
    context: Readonly<RepeatableFieldsetBoundaryMessageContext>
  ): string {
    return `Minimum of ${context.minimum} ${countNoun(context.minimum)} reached.`;
  }
} satisfies RepeatableFieldsetMessageFormatters);

function freezeContext<
  Context extends RepeatableFieldsetMessageContext
>(context: Context): Readonly<Context> {
  return Object.freeze({ ...context });
}

function resolveMessage<
  Context extends RepeatableFieldsetMessageContext
>(
  formatter: RepeatableFieldsetMessageFormatter<Context>,
  fallback: RepeatableFieldsetMessageFormatter<Context>,
  context: Context
): string {
  const immutableContext = freezeContext(context);

  try {
    const message = formatter(immutableContext);

    if (typeof message === "string" && message.trim() !== "") {
      return message.trim();
    }
  } catch {
    // A localized formatter cannot invalidate a completed DOM operation.
  }

  return fallback(immutableContext);
}

export function formatAddedStatusMessage(
  formatters: Readonly<RepeatableFieldsetMessageFormatters>,
  context: RepeatableFieldsetItemMessageContext
): string {
  const messages = [
    resolveMessage(
      formatters.added,
      DEFAULT_MESSAGE_FORMATTERS.added,
      context
    )
  ];

  if (
    context.maximum !== null &&
    context.count === context.maximum
  ) {
    messages.push(
      resolveMessage(
        formatters.maximum,
        DEFAULT_MESSAGE_FORMATTERS.maximum,
        context
      )
    );
  }

  return messages.join(" ");
}

export function formatRemovedStatusMessage(
  formatters: Readonly<RepeatableFieldsetMessageFormatters>,
  context: RepeatableFieldsetItemMessageContext
): string {
  const messages = [
    resolveMessage(
      formatters.removed,
      DEFAULT_MESSAGE_FORMATTERS.removed,
      context
    )
  ];

  if (context.count === context.minimum) {
    messages.push(
      resolveMessage(
        formatters.minimum,
        DEFAULT_MESSAGE_FORMATTERS.minimum,
        context
      )
    );
  }

  return messages.join(" ");
}

export function formatRestoredStatusMessage(
  formatters: Readonly<RepeatableFieldsetMessageFormatters>,
  context: RepeatableFieldsetItemMessageContext
): string {
  const messages = [
    resolveMessage(
      formatters.restored,
      DEFAULT_MESSAGE_FORMATTERS.restored,
      context
    )
  ];

  if (
    context.maximum !== null &&
    context.count === context.maximum
  ) {
    messages.push(
      resolveMessage(
        formatters.maximum,
        DEFAULT_MESSAGE_FORMATTERS.maximum,
        context
      )
    );
  }

  return messages.join(" ");
}

export function formatDuplicatedStatusMessage(
  formatters: Readonly<RepeatableFieldsetMessageFormatters>,
  context: RepeatableFieldsetDuplicateMessageContext
): string {
  const messages = [
    resolveMessage(
      formatters.duplicated,
      DEFAULT_MESSAGE_FORMATTERS.duplicated,
      context
    )
  ];

  if (
    context.maximum !== null &&
    context.count === context.maximum
  ) {
    messages.push(
      resolveMessage(
        formatters.maximum,
        DEFAULT_MESSAGE_FORMATTERS.maximum,
        context
      )
    );
  }

  return messages.join(" ");
}

export function formatMovedStatusMessage(
  formatters: Readonly<RepeatableFieldsetMessageFormatters>,
  context: RepeatableFieldsetMoveMessageContext
): string {
  return resolveMessage(
    formatters.moved,
    DEFAULT_MESSAGE_FORMATTERS.moved,
    context
  );
}

export function formatMoveBoundaryStatusMessage(
  formatters: Readonly<RepeatableFieldsetMessageFormatters>,
  context: RepeatableFieldsetMoveBoundaryMessageContext
): string {
  return resolveMessage(
    formatters.moveBoundary,
    DEFAULT_MESSAGE_FORMATTERS.moveBoundary,
    context
  );
}

export function formatMaximumStatusMessage(
  formatters: Readonly<RepeatableFieldsetMessageFormatters>,
  context: RepeatableFieldsetBoundaryMessageContext
): string {
  return resolveMessage(
    formatters.maximum,
    DEFAULT_MESSAGE_FORMATTERS.maximum,
    context
  );
}

export function formatMinimumStatusMessage(
  formatters: Readonly<RepeatableFieldsetMessageFormatters>,
  context: RepeatableFieldsetBoundaryMessageContext
): string {
  return resolveMessage(
    formatters.minimum,
    DEFAULT_MESSAGE_FORMATTERS.minimum,
    context
  );
}
