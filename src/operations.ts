import type { RepeatableFieldsetKey } from "./keys";

export type RepeatableFieldsetOperationSource = "control" | "api";

export interface RepeatableFieldsetItem {
  readonly element: HTMLFieldSetElement;
  readonly key: RepeatableFieldsetKey;
  readonly index: number;
  readonly position: number;
}

export interface RepeatableFieldsetAddOptions {
  /**
   * Requests the A11Y-001 focus decision order for this API addition.
   * Omitted and false values preserve the API caller's current focus.
   */
  readonly focus?: boolean;
}

export interface RepeatableFieldsetDuplicateStateContext {
  /** The current owned item selected as the duplication source. */
  readonly sourceItem: Readonly<RepeatableFieldsetItem>;
  /**
   * A disconnected fieldset materialized from the trusted template with a
   * fresh stable key. The callback may update current native-control state,
   * but must not change structure, attributes, defaults, validity, errors, or
   * file inputs.
   */
  readonly candidate: HTMLFieldSetElement;
}

export type RepeatableFieldsetDuplicateStateCopier = (
  context: Readonly<RepeatableFieldsetDuplicateStateContext>
) => void;

export interface RepeatableFieldsetDuplicateOptions {
  /**
   * Requests the Add focus decision order for the duplicated item. Omitted
   * and false values preserve unrelated focus.
   */
  readonly focus?: boolean;
  /**
   * Synchronously copies explicitly approved current control state into the
   * disconnected template candidate before insertion and addon setup.
   */
  readonly copyState?: RepeatableFieldsetDuplicateStateCopier;
}

export interface RepeatableFieldsetRemoveOptions {
  /**
   * Requests the A11Y-002 focus decision order for this API removal.
   * Focus inside the removed item is recovered even when this is omitted or
   * false; unrelated focus is otherwise preserved.
   */
  readonly focus?: boolean;
}

export interface RepeatableFieldsetRestoreStateContext {
  /**
   * A disconnected fieldset materialized from the trusted template with the
   * removed item's already-reserved stable key.
   */
  readonly candidate: HTMLFieldSetElement;
}

export type RepeatableFieldsetRestoreState = (
  context: Readonly<RepeatableFieldsetRestoreStateContext>
) => void;

export interface RepeatableFieldsetRestoreOptions {
  /** Requests the Add focus decision order for the restored item. */
  readonly focus?: boolean;
  /**
   * Restores explicitly approved current control state into the disconnected
   * template candidate. The callback must be synchronous and structural-DOM
   * preserving.
   */
  readonly restoreState?: RepeatableFieldsetRestoreState;
}

export type RepeatableFieldsetRemoveTarget =
  | Readonly<RepeatableFieldsetItem>
  | HTMLFieldSetElement
  | RepeatableFieldsetKey;

export type RepeatableFieldsetMoveTarget = RepeatableFieldsetRemoveTarget;

export type RepeatableFieldsetDuplicateTarget =
  RepeatableFieldsetRemoveTarget;

export type RepeatableFieldsetMoveDirection = "up" | "down";

export type RepeatableFieldsetMoveBoundary = "start" | "end";

export type RepeatableFieldsetAddFailureReason =
  | "inactive"
  | "maximum"
  | "invalid-key"
  | "duplicate-key"
  | "invalid-template"
  | "addon-error";

export interface RepeatableFieldsetAddSuccess {
  readonly ok: true;
  readonly item: Readonly<RepeatableFieldsetItem>;
}

export type RepeatableFieldsetAddFailure =
  | {
      readonly ok: false;
      readonly reason: "inactive" | "maximum";
    }
  | {
      readonly ok: false;
      readonly reason: Exclude<
        RepeatableFieldsetAddFailureReason,
        "inactive" | "maximum"
      >;
      readonly error: unknown;
    };

export type RepeatableFieldsetAddResult =
  | RepeatableFieldsetAddSuccess
  | RepeatableFieldsetAddFailure;

export type RepeatableFieldsetDuplicateFailureReason =
  | "inactive"
  | "maximum"
  | "unowned-item"
  | "invalid-key"
  | "duplicate-key"
  | "invalid-template"
  | "copy-error"
  | "addon-error";

export interface RepeatableFieldsetDuplicateSuccess {
  readonly ok: true;
  readonly item: Readonly<RepeatableFieldsetItem>;
  readonly sourceItem: Readonly<RepeatableFieldsetItem>;
}

export type RepeatableFieldsetDuplicateFailure =
  | {
      readonly ok: false;
      readonly reason: "inactive" | "maximum" | "unowned-item";
    }
  | {
      readonly ok: false;
      readonly reason: Exclude<
        RepeatableFieldsetDuplicateFailureReason,
        "inactive" | "maximum" | "unowned-item"
      >;
      readonly error: unknown;
    };

export type RepeatableFieldsetDuplicateResult =
  | RepeatableFieldsetDuplicateSuccess
  | RepeatableFieldsetDuplicateFailure;

export type RepeatableFieldsetRemoveFailureReason =
  | "inactive"
  | "minimum"
  | "unowned-item"
  | "addon-error";

export interface RepeatableFieldsetRemoveSuccess {
  readonly ok: true;
  /**
   * Snapshot immediately before removal. Its element is detached after the
   * command succeeds and should not be retained longer than necessary.
   */
  readonly item: Readonly<RepeatableFieldsetItem>;
}

export type RepeatableFieldsetRemoveFailure =
  | {
      readonly ok: false;
      readonly reason: "inactive" | "minimum" | "unowned-item";
    }
  | {
      readonly ok: false;
      readonly reason: "addon-error";
      readonly error: unknown;
    };

export type RepeatableFieldsetRemoveResult =
  | RepeatableFieldsetRemoveSuccess
  | RepeatableFieldsetRemoveFailure;

export type RepeatableFieldsetRestoreFailureReason =
  | "inactive"
  | "not-ready"
  | "consumed"
  | "maximum"
  | "conflict"
  | "invalid-template"
  | "restore-error"
  | "addon-error";

export interface RepeatableFieldsetRestoreSuccess {
  readonly ok: true;
  readonly item: Readonly<RepeatableFieldsetItem>;
  readonly previousIndex: number;
  readonly previousPosition: number;
}

export type RepeatableFieldsetRestoreFailure =
  | {
      readonly ok: false;
      readonly reason:
        | "inactive"
        | "not-ready"
        | "consumed"
        | "maximum"
        | "conflict";
    }
  | {
      readonly ok: false;
      readonly reason:
        | "invalid-template"
        | "restore-error"
        | "addon-error";
      readonly error: unknown;
    };

export type RepeatableFieldsetRestoreResult =
  | RepeatableFieldsetRestoreSuccess
  | RepeatableFieldsetRestoreFailure;

export type RepeatableFieldsetMoveFailureReason =
  | "inactive"
  | "unowned-item"
  | "boundary"
  | "move-error";

export interface RepeatableFieldsetMoveSuccess {
  readonly ok: true;
  readonly item: Readonly<RepeatableFieldsetItem>;
  readonly previousIndex: number;
  readonly previousPosition: number;
  readonly direction: RepeatableFieldsetMoveDirection;
}

export type RepeatableFieldsetMoveFailure =
  | {
      readonly ok: false;
      readonly reason: "inactive" | "unowned-item";
    }
  | {
      readonly ok: false;
      readonly reason: "boundary";
      readonly boundary: RepeatableFieldsetMoveBoundary;
      readonly item: Readonly<RepeatableFieldsetItem>;
    }
  | {
      readonly ok: false;
      readonly reason: "move-error";
      readonly error: unknown;
    };

export type RepeatableFieldsetMoveResult =
  | RepeatableFieldsetMoveSuccess
  | RepeatableFieldsetMoveFailure;
