import type {
  RegisteredRepeatableFieldsetItem
} from "./items";
import { RepeatableFieldsetError } from "./errors";
import type {
  NormalizedRepeatableFieldsetOptions
} from "./options";

export interface RepeatableFieldsetConstraintState {
  readonly canAdd: boolean;
  readonly canRemove: boolean;
}

export interface RepeatableFieldsetControlSynchronization {
  readonly state: Readonly<RepeatableFieldsetConstraintState>;
  rollback(): void;
}

interface ButtonState {
  readonly button: HTMLButtonElement;
  readonly hidden: HTMLButtonElement["hidden"];
  readonly disabled: boolean;
}

function createConstraintState(
  count: number,
  options: Readonly<NormalizedRepeatableFieldsetOptions>
): Readonly<RepeatableFieldsetConstraintState> {
  return Object.freeze({
    canAdd:
      options.maximum === null ||
      count < options.maximum,
    canRemove: count > options.minimum
  });
}

function restoreButtonStates(
  states: readonly ButtonState[]
): void {
  for (let index = states.length - 1; index >= 0; index -= 1) {
    const state = states[index];

    if (state === undefined) {
      continue;
    }

    try {
      state.button.hidden = state.hidden;
    } catch {
      // Continue restoring the independent disabled state.
    }

    try {
      state.button.disabled = state.disabled;
    } catch {
      // A replaced or non-writable author control is restored where possible.
    }
  }
}

/**
 * Owns the derived minimum/maximum state and remembers author control state
 * without retaining detached Remove buttons.
 */
export class RepeatableFieldsetConstraintController {
  private readonly root: HTMLElement;

  private readonly options: Readonly<NormalizedRepeatableFieldsetOptions>;

  private readonly authorStates = new WeakMap<
    HTMLButtonElement,
    Readonly<Omit<ButtonState, "button">>
  >();

  public constructor(
    root: HTMLElement,
    options: Readonly<NormalizedRepeatableFieldsetOptions>
  ) {
    this.root = root;
    this.options = options;
  }

  public getState(
    count: number
  ): Readonly<RepeatableFieldsetConstraintState> {
    return createConstraintState(count, this.options);
  }

  public synchronize(
    addButton: HTMLButtonElement,
    items: readonly RegisteredRepeatableFieldsetItem[]
  ): RepeatableFieldsetControlSynchronization {
    const state = this.getState(items.length);
    const planned = [
      {
        button: addButton,
        disabled: !state.canAdd
      },
      ...items.map(({ removeButton }) => ({
        button: removeButton,
        disabled: !state.canRemove
      }))
    ];
    const previousStates: ButtonState[] = [];
    let currentButton: HTMLButtonElement | null = null;

    try {
      for (const plan of planned) {
        currentButton = plan.button;
        this.rememberAuthorState(plan.button);
        previousStates.push({
          button: plan.button,
          hidden: plan.button.hidden,
          disabled: plan.button.disabled
        });
        plan.button.disabled = plan.disabled;
        plan.button.hidden = false;
      }
    } catch (cause) {
      restoreButtonStates(previousStates);

      throw new RepeatableFieldsetError(
        "invalid-item",
        "The component could not synchronize its native action controls.",
        {
          root: this.root,
          ...(currentButton === null
            ? {}
            : { element: currentButton }),
          cause
        }
      );
    }

    let rolledBack = false;

    return Object.freeze({
      state,
      rollback(): void {
        if (rolledBack) {
          return;
        }

        rolledBack = true;
        restoreButtonStates(previousStates);
      }
    });
  }

  public restoreAuthorStates(
    addButton: HTMLButtonElement,
    items: readonly RegisteredRepeatableFieldsetItem[]
  ): void {
    for (const button of [
      addButton,
      ...items.map(({ removeButton }) => removeButton)
    ]) {
      const state = this.authorStates.get(button);

      if (state === undefined) {
        continue;
      }

      try {
        button.hidden = state.hidden;
      } catch {
        // Continue restoring the independent disabled state.
      }

      try {
        button.disabled = state.disabled;
      } catch {
        // Destroy is best-effort for author controls that have been replaced
        // or made non-writable after initialization.
      }
    }
  }

  private rememberAuthorState(button: HTMLButtonElement): void {
    if (this.authorStates.has(button)) {
      return;
    }

    this.authorStates.set(
      button,
      Object.freeze({
        hidden: button.hidden,
        disabled: button.disabled
      })
    );
  }
}
