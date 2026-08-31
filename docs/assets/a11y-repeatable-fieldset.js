//#region src/messages.ts
function countNoun(count) {
	return count === 1 ? "item" : "items";
}
const DEFAULT_MESSAGE_FORMATTERS = Object.freeze({
	added(context) {
		return `${context.itemLabel} ${context.position} added. ${context.count} ${countNoun(context.count)} total.`;
	},
	removed(context) {
		return `${context.itemLabel} ${context.position} removed. ${context.count} ${countNoun(context.count)} remaining.`;
	},
	restored(context) {
		return `${context.itemLabel} restored at position ${context.position}. ${context.count} ${countNoun(context.count)} total.`;
	},
	duplicated(context) {
		return `${context.itemLabel} ${context.sourcePosition} duplicated as position ${context.position}. ${context.count} ${countNoun(context.count)} total.`;
	},
	moved(context) {
		return `${context.itemLabel} moved to position ${context.position} of ${context.count}.`;
	},
	moveBoundary(context) {
		return context.boundary === "start" ? `${context.itemLabel} ${context.position} is already first.` : `${context.itemLabel} ${context.position} is already last.`;
	},
	maximum(context) {
		const maximum = context.maximum;
		return maximum === null ? "Maximum item limit reached." : `Maximum of ${maximum} ${countNoun(maximum)} reached.`;
	},
	minimum(context) {
		return `Minimum of ${context.minimum} ${countNoun(context.minimum)} reached.`;
	}
});
function freezeContext(context) {
	return Object.freeze({ ...context });
}
function resolveMessage(formatter, fallback, context) {
	const immutableContext = freezeContext(context);
	try {
		const message = formatter(immutableContext);
		if (typeof message === "string" && message.trim() !== "") return message.trim();
	} catch {}
	return fallback(immutableContext);
}
function formatAddedStatusMessage(formatters, context) {
	const messages = [resolveMessage(formatters.added, DEFAULT_MESSAGE_FORMATTERS.added, context)];
	if (context.maximum !== null && context.count === context.maximum) messages.push(resolveMessage(formatters.maximum, DEFAULT_MESSAGE_FORMATTERS.maximum, context));
	return messages.join(" ");
}
function formatRemovedStatusMessage(formatters, context) {
	const messages = [resolveMessage(formatters.removed, DEFAULT_MESSAGE_FORMATTERS.removed, context)];
	if (context.count === context.minimum) messages.push(resolveMessage(formatters.minimum, DEFAULT_MESSAGE_FORMATTERS.minimum, context));
	return messages.join(" ");
}
function formatRestoredStatusMessage(formatters, context) {
	const messages = [resolveMessage(formatters.restored, DEFAULT_MESSAGE_FORMATTERS.restored, context)];
	if (context.maximum !== null && context.count === context.maximum) messages.push(resolveMessage(formatters.maximum, DEFAULT_MESSAGE_FORMATTERS.maximum, context));
	return messages.join(" ");
}
function formatDuplicatedStatusMessage(formatters, context) {
	const messages = [resolveMessage(formatters.duplicated, DEFAULT_MESSAGE_FORMATTERS.duplicated, context)];
	if (context.maximum !== null && context.count === context.maximum) messages.push(resolveMessage(formatters.maximum, DEFAULT_MESSAGE_FORMATTERS.maximum, context));
	return messages.join(" ");
}
function formatMovedStatusMessage(formatters, context) {
	return resolveMessage(formatters.moved, DEFAULT_MESSAGE_FORMATTERS.moved, context);
}
function formatMoveBoundaryStatusMessage(formatters, context) {
	return resolveMessage(formatters.moveBoundary, DEFAULT_MESSAGE_FORMATTERS.moveBoundary, context);
}
function formatMaximumStatusMessage(formatters, context) {
	return resolveMessage(formatters.maximum, DEFAULT_MESSAGE_FORMATTERS.maximum, context);
}
function formatMinimumStatusMessage(formatters, context) {
	return resolveMessage(formatters.minimum, DEFAULT_MESSAGE_FORMATTERS.minimum, context);
}
//#endregion
//#region src/constants.ts
const COMPONENT_NAME = "a11y-repeatable-fieldset";
const TEMPLATE_KEY_TOKEN = "__A11Y_REPEATABLE_KEY__";
const GENERATED_KEY_PREFIX = "item-";
const ITEM_KEY_PATTERN = Object.freeze(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/);
const ATTRIBUTES = Object.freeze({
	root: "data-a11y-repeatable-fieldset",
	items: "data-a11y-repeatable-fieldset-items",
	item: "data-a11y-repeatable-fieldset-item",
	template: "data-a11y-repeatable-fieldset-template",
	add: "data-a11y-repeatable-fieldset-add",
	remove: "data-a11y-repeatable-fieldset-remove",
	key: "data-a11y-repeatable-fieldset-key",
	position: "data-a11y-repeatable-fieldset-position",
	focus: "data-a11y-repeatable-fieldset-focus",
	status: "data-a11y-repeatable-fieldset-status",
	minimum: "data-min-items",
	maximum: "data-max-items",
	itemLabel: "data-item-label",
	focusOnAdd: "data-focus-on-add",
	announceChanges: "data-announce-changes"
});
const SELECTORS = Object.freeze({
	root: `[${ATTRIBUTES.root}]`,
	items: `[${ATTRIBUTES.items}]`,
	item: `fieldset[${ATTRIBUTES.item}]`,
	template: `template[${ATTRIBUTES.template}]`,
	add: `[${ATTRIBUTES.add}]`,
	remove: `[${ATTRIBUTES.remove}]`,
	key: `[${ATTRIBUTES.key}]`,
	position: `[${ATTRIBUTES.position}]`,
	focus: `[${ATTRIBUTES.focus}]`,
	status: `[${ATTRIBUTES.status}]`,
	legend: "legend"
});
/** Style-only BEM hooks. Runtime behavior must use ATTRIBUTES and SELECTORS. */
const CLASSES = Object.freeze({
	root: "a11y-repeatable-fieldset",
	items: "a11y-repeatable-fieldset__items",
	item: "a11y-repeatable-fieldset__item",
	legend: "a11y-repeatable-fieldset__legend",
	controls: "a11y-repeatable-fieldset__controls",
	add: "a11y-repeatable-fieldset__add",
	remove: "a11y-repeatable-fieldset__remove",
	position: "a11y-repeatable-fieldset__position",
	limit: "a11y-repeatable-fieldset__limit",
	status: "a11y-repeatable-fieldset__status"
});
const DEFAULT_OPTIONS = Object.freeze({
	minimum: 1,
	maximum: null,
	itemLabel: "Item",
	focusOnAdd: true,
	announceChanges: true,
	messageFormatters: DEFAULT_MESSAGE_FORMATTERS
});
const TOKEN_ATTRIBUTES = Object.freeze({
	scalar: Object.freeze([
		"id",
		"name",
		"for",
		"list"
	]),
	idReference: Object.freeze([
		"aria-labelledby",
		"aria-describedby",
		"aria-controls",
		"headers"
	]),
	hashOnly: Object.freeze(["href"])
});
const EVENT_DISPATCH_OPTIONS = Object.freeze({
	bubbles: true,
	composed: false,
	cancelable: false
});
const EVENTS = Object.freeze({
	init: `${COMPONENT_NAME}:init`,
	itemAdded: `${COMPONENT_NAME}:item-added`,
	itemDuplicated: `${COMPONENT_NAME}:item-duplicated`,
	itemRemoved: `${COMPONENT_NAME}:item-removed`,
	itemRestored: `${COMPONENT_NAME}:item-restored`,
	itemMoved: `${COMPONENT_NAME}:item-moved`,
	destroy: `${COMPONENT_NAME}:destroy`
});
Object.freeze([
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
/**
* A contract error raised while validating options or initializing a root.
*
* Normal operation boundaries such as minimum and maximum counts use typed
* operation results instead of this error class.
*/
var RepeatableFieldsetError = class extends Error {
	code;
	root;
	element;
	constructor(code, message, options = {}) {
		super(message, options.cause === void 0 ? void 0 : { cause: options.cause });
		this.name = "RepeatableFieldsetError";
		this.code = code;
		this.root = options.root ?? null;
		this.element = options.element ?? null;
	}
};
//#endregion
//#region src/addon-manager.ts
const NOOP_CLEANUP = () => {};
const NOOP_REMOVE_PREPARATION = Object.freeze({
	commit() {},
	rollback() {}
});
/** Internal marker so initialization can retain an addon exception as cause. */
var RepeatableFieldsetAddonSetupError = class extends Error {
	addonCause;
	constructor(cause) {
		super("An addon setup hook failed.");
		this.name = "RepeatableFieldsetAddonSetupError";
		this.addonCause = cause;
	}
};
/** Owns component-level and per-item addon setup, routing, and cleanup. */
var RepeatableFieldsetAddonManager = class {
	componentCleanups = [];
	itemCleanups = /* @__PURE__ */ new Map();
	itemPhases = /* @__PURE__ */ new Map();
	addons = Object.freeze([]);
	removeRequestHandler = null;
	removePreparationHandler = null;
	active = true;
	setup(addons, instance, root) {
		this.addons = addons;
		const on = (name, listener) => this.subscribe(root, this.componentCleanups, name, listener);
		const onRemoveRequest = (handler) => this.subscribeRemoveRequest(this.componentCleanups, handler);
		const onRemovePreparation = (handler) => this.subscribeRemovePreparation(this.componentCleanups, handler);
		const context = this.createComponentContext(instance, root, on, onRemoveRequest, onRemovePreparation);
		try {
			for (const addon of addons) {
				if (addon.setup === void 0) continue;
				this.registerCleanup(this.componentCleanups, addon.setup(context));
			}
		} catch (error) {
			this.destroy();
			throw new RepeatableFieldsetAddonSetupError(error);
		}
	}
	setupItem(instance, root, item, phase) {
		const cleanups = [];
		const on = (name, listener) => this.subscribe(root, cleanups, name, listener);
		const context = Object.freeze({
			instance,
			root,
			on,
			item,
			phase
		});
		try {
			for (const addon of this.addons) {
				if (addon.setupItem === void 0) continue;
				this.registerCleanup(cleanups, addon.setupItem(context));
			}
		} catch (error) {
			this.runCleanups(cleanups);
			throw new RepeatableFieldsetAddonSetupError(error);
		}
		this.itemPhases.set(item.element, phase);
		if (cleanups.length > 0) this.itemCleanups.set(item.element, cleanups);
	}
	/** Runs and releases one item's cleanup callbacks before detachment. */
	cleanupItem(item) {
		const cleanups = this.itemCleanups.get(item);
		if (cleanups === void 0) return null;
		this.itemCleanups.delete(item);
		return this.runCleanups(cleanups);
	}
	/** Re-runs item setup when a failed removal restores the author item. */
	restoreItem(instance, root, item) {
		const phase = this.itemPhases.get(item.element);
		if (phase === void 0) return;
		this.setupItem(instance, root, item, phase);
	}
	/** Releases the manager's last reference to a successfully detached item. */
	releaseItem(item) {
		this.itemCleanups.delete(item);
		this.itemPhases.delete(item);
	}
	/** Captures addon state before item cleanup, without exposing private DOM. */
	prepareItemRemoval(context) {
		if (!this.active || this.removePreparationHandler === null) return NOOP_REMOVE_PREPARATION;
		const preparation = this.removePreparationHandler(context);
		if (typeof preparation !== "object" || preparation === null || typeof preparation.commit !== "function" || typeof preparation.rollback !== "function") throw new TypeError("An addon removal-preparation handler must return commit and rollback functions.");
		return preparation;
	}
	/** Routes an owned control activation to the optional single request owner. */
	routeRemoveRequest(request) {
		if (!this.active || this.removeRequestHandler === null) return false;
		this.removeRequestHandler(request);
		return true;
	}
	/**
	* Invokes all registered cleanups exactly once in reverse registration
	* order. It returns the first failure only after attempting every cleanup.
	*/
	destroy() {
		if (!this.active) return null;
		this.active = false;
		let firstFailure = null;
		const itemCleanupEntries = Array.from(this.itemCleanups.entries()).reverse();
		for (const [item, cleanups] of itemCleanupEntries) {
			this.itemCleanups.delete(item);
			firstFailure ??= this.runCleanups(cleanups);
		}
		firstFailure ??= this.runCleanups(this.componentCleanups);
		this.itemPhases.clear();
		return firstFailure;
	}
	createComponentContext(instance, root, on, onRemoveRequest, onRemovePreparation) {
		return Object.freeze({
			instance,
			root,
			on,
			onRemoveRequest,
			onRemovePreparation
		});
	}
	subscribeRemovePreparation(cleanups, handler) {
		if (!this.active) return NOOP_CLEANUP;
		if (typeof handler !== "function") throw new TypeError("An addon removal-preparation handler must be a function.");
		if (this.removePreparationHandler !== null) throw new TypeError("Only one addon may own removal snapshots in an instance.");
		this.removePreparationHandler = handler;
		let subscribed = true;
		const unsubscribe = () => {
			if (!subscribed) return;
			subscribed = false;
			if (this.removePreparationHandler === handler) this.removePreparationHandler = null;
		};
		cleanups.push(unsubscribe);
		return unsubscribe;
	}
	subscribeRemoveRequest(cleanups, handler) {
		if (!this.active) return NOOP_CLEANUP;
		if (typeof handler !== "function") throw new TypeError("An addon Remove-request handler must be a function.");
		if (this.removeRequestHandler !== null) throw new TypeError("Only one addon may own control-driven Remove requests in an instance.");
		this.removeRequestHandler = handler;
		let subscribed = true;
		const unsubscribe = () => {
			if (!subscribed) return;
			subscribed = false;
			if (this.removeRequestHandler === handler) this.removeRequestHandler = null;
		};
		cleanups.push(unsubscribe);
		return unsubscribe;
	}
	registerCleanup(cleanups, result) {
		if (result === void 0) return;
		if (typeof result !== "function") throw new TypeError("An addon setup hook must return a cleanup function.");
		cleanups.push(result);
	}
	subscribe(root, cleanups, name, listener) {
		if (!this.active) return NOOP_CLEANUP;
		if (typeof listener !== "function") throw new TypeError("An addon event listener must be a function.");
		const eventListener = (event) => {
			listener(event);
		};
		let subscribed = true;
		const unsubscribe = () => {
			if (!subscribed) return;
			subscribed = false;
			root.removeEventListener(name, eventListener);
		};
		root.addEventListener(name, eventListener);
		cleanups.push(unsubscribe);
		return unsubscribe;
	}
	runCleanups(cleanups) {
		let firstFailure = null;
		while (cleanups.length > 0) {
			const cleanup = cleanups.pop();
			if (cleanup === void 0) continue;
			try {
				cleanup();
			} catch (error) {
				firstFailure ??= error;
			}
		}
		return firstFailure;
	}
};
//#endregion
//#region src/events.ts
/** Dispatches one completed lifecycle observation from the root's own realm. */
function dispatchRepeatableFieldsetEvent(root, name, detail) {
	const CustomEventConstructor = root.ownerDocument.defaultView?.CustomEvent ?? globalThis.CustomEvent;
	if (CustomEventConstructor === void 0) throw new Error("The repeatable-fieldset root document must provide CustomEvent.");
	root.dispatchEvent(new CustomEventConstructor(name, {
		...EVENT_DISPATCH_OPTIONS,
		detail
	}));
}
//#endregion
//#region src/constraints.ts
function createConstraintState(count, options) {
	return Object.freeze({
		canAdd: options.maximum === null || count < options.maximum,
		canRemove: count > options.minimum
	});
}
function restoreButtonStates(states) {
	for (let index = states.length - 1; index >= 0; index -= 1) {
		const state = states[index];
		if (state === void 0) continue;
		try {
			state.button.hidden = state.hidden;
		} catch {}
		try {
			state.button.disabled = state.disabled;
		} catch {}
	}
}
/**
* Owns the derived minimum/maximum state and remembers author control state
* without retaining detached Remove buttons.
*/
var RepeatableFieldsetConstraintController = class {
	root;
	options;
	authorStates = /* @__PURE__ */ new WeakMap();
	constructor(root, options) {
		this.root = root;
		this.options = options;
	}
	getState(count) {
		return createConstraintState(count, this.options);
	}
	synchronize(addButton, items) {
		const state = this.getState(items.length);
		const planned = [{
			button: addButton,
			disabled: !state.canAdd
		}, ...items.map(({ removeButton }) => ({
			button: removeButton,
			disabled: !state.canRemove
		}))];
		const previousStates = [];
		let currentButton = null;
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
			throw new RepeatableFieldsetError("invalid-item", "The component could not synchronize its native action controls.", {
				root: this.root,
				...currentButton === null ? {} : { element: currentButton },
				cause
			});
		}
		let rolledBack = false;
		return Object.freeze({
			state,
			rollback() {
				if (rolledBack) return;
				rolledBack = true;
				restoreButtonStates(previousStates);
			}
		});
	}
	restoreAuthorStates(addButton, items) {
		for (const button of [addButton, ...items.map(({ removeButton }) => removeButton)]) {
			const state = this.authorStates.get(button);
			if (state === void 0) continue;
			try {
				button.hidden = state.hidden;
			} catch {}
			try {
				button.disabled = state.disabled;
			} catch {}
		}
	}
	rememberAuthorState(button) {
		if (this.authorStates.has(button)) return;
		this.authorStates.set(button, Object.freeze({
			hidden: button.hidden,
			disabled: button.disabled
		}));
	}
};
//#endregion
//#region src/focus.ts
const HTML_NAMESPACE$3 = "http://www.w3.org/1999/xhtml";
const LABELABLE_CONTROL_SELECTOR = "button, input, meter, output, progress, select, textarea";
function isHTMLElement$2(element) {
	return element.namespaceURI === HTML_NAMESPACE$3;
}
function isHiddenOrInertWithin(element, boundary) {
	let current = element;
	while (current !== null) {
		if (current.hasAttribute("hidden") || current.hasAttribute("inert")) return true;
		if (current === boundary) return false;
		current = current.parentElement;
	}
	return true;
}
function hasValidTabIndex(element) {
	const value = element.getAttribute("tabindex");
	return value !== null && /^-?\d+$/.test(value.trim());
}
function isOwnedItemDescendant(root, item, element) {
	return element !== item && element.closest(SELECTORS.item) === item && element.closest(SELECTORS.root) === root;
}
/**
* Tests semantic programmatic-focus eligibility without relying on layout
* measurements, which are unavailable in jsdom and unreliable for inert
* template content.
*/
function isPotentialFocusTarget(element, boundary) {
	if (!isHTMLElement$2(element) || isHiddenOrInertWithin(element, boundary)) return false;
	if (element.matches(":disabled")) return false;
	if (hasValidTabIndex(element)) return true;
	switch (element.localName) {
		case "a":
		case "area": return element.hasAttribute("href");
		case "audio":
		case "video": return element.hasAttribute("controls");
		case "button":
		case "select":
		case "textarea":
		case "iframe":
		case "object":
		case "embed":
		case "summary": return true;
		case "input": return element.getAttribute("type")?.trim().toLowerCase() !== "hidden";
		default: {
			const contentEditable = element.getAttribute("contenteditable")?.trim().toLowerCase();
			return contentEditable === "" || contentEditable === "true" || contentEditable === "plaintext-only";
		}
	}
}
function isLabelableControlCandidate(root, item, element) {
	return isOwnedItemDescendant(root, item, element) && !element.matches(SELECTORS.remove) && isPotentialFocusTarget(element, item);
}
function tryFocus(ownerDocument, element) {
	try {
		element.focus();
	} catch {
		return false;
	}
	return ownerDocument.activeElement === element;
}
/**
* Applies the locked focus order after an item has been inserted and all
* native control constraints have reached their final state.
*/
function focusAddedRepeatableFieldsetItem(root, item, explicitTarget) {
	if (item.ownerDocument !== root.ownerDocument || item.closest(SELECTORS.root) !== root || item.closest(SELECTORS.item) !== item) return null;
	const ownerDocument = root.ownerDocument;
	if (explicitTarget !== null && isOwnedItemDescendant(root, item, explicitTarget) && isPotentialFocusTarget(explicitTarget, item) && tryFocus(ownerDocument, explicitTarget)) return explicitTarget;
	const controls = item.querySelectorAll(LABELABLE_CONTROL_SELECTOR);
	for (const control of controls) if (control !== explicitTarget && isLabelableControlCandidate(root, item, control) && tryFocus(ownerDocument, control)) return control;
	if (hasValidTabIndex(item) && isPotentialFocusTarget(item, item) && tryFocus(ownerDocument, item)) return item;
	return null;
}
function isOwnedRemovalCandidate(root, removedItem, candidate) {
	return candidate.ownerDocument === root.ownerDocument && candidate.closest(SELECTORS.root) === root && !removedItem.contains(candidate);
}
/**
* Resolves the post-removal candidate order while the target is still
* attached. Native disabled state is intentionally checked later, after the
* collection constraints have been synchronized for the resulting count.
*/
function planRemovedRepeatableFieldsetItemFocus(root, removedItem, nextRemoveButton, previousRemoveButton, addButton, canRemoveAfter, activeElement, focusRequested) {
	const focusWasInside = activeElement !== null && (activeElement === removedItem || removedItem.contains(activeElement));
	const candidates = [];
	if (canRemoveAfter) {
		for (const removeButton of [nextRemoveButton, previousRemoveButton]) if (removeButton !== null && isOwnedRemovalCandidate(root, removedItem, removeButton)) candidates.push(removeButton);
	}
	if (isOwnedRemovalCandidate(root, removedItem, addButton)) candidates.push(addButton);
	if (hasValidTabIndex(root)) candidates.push(root);
	return Object.freeze({
		shouldMove: focusRequested || focusWasInside,
		candidates: Object.freeze(candidates),
		rollbackTarget: focusWasInside && activeElement !== null && isHTMLElement$2(activeElement) ? activeElement : null
	});
}
/**
* Moves focus only after the removed item is detached and positions,
* constraints, and public collection snapshots are stable.
*/
function focusAfterRepeatableFieldsetItemRemoval(root, plan) {
	if (!plan.shouldMove) return null;
	for (const candidate of plan.candidates) {
		if (candidate.ownerDocument !== root.ownerDocument || candidate !== root && candidate.closest(SELECTORS.root) !== root || !isPotentialFocusTarget(candidate, root)) continue;
		if (tryFocus(root.ownerDocument, candidate)) return candidate;
	}
	return null;
}
/**
* Restores the pre-command focus when a technical failure rolls the removed
* item back into the owned collection.
*/
function restoreFocusAfterFailedRepeatableFieldsetItemRemoval(root, restoredItem, plan) {
	const target = plan.rollbackTarget;
	if (target === null || target !== restoredItem && !restoredItem.contains(target) || restoredItem.closest(SELECTORS.root) !== root) return;
	tryFocus(root.ownerDocument, target);
}
/** Captures focus only when it belongs to the item about to move. */
function planMovedRepeatableFieldsetItemFocus(root, item, activeElement) {
	const target = activeElement !== null && isHTMLElement$2(activeElement) && activeElement.closest(SELECTORS.root) === root && (activeElement === item || item.contains(activeElement)) ? activeElement : null;
	return Object.freeze({ target });
}
/** Restores the same owned active element after its item changes DOM order. */
function focusAfterRepeatableFieldsetItemMove(root, item, plan) {
	const target = plan.target;
	if (target === null || item.closest(SELECTORS.root) !== root || target !== item && !item.contains(target) || !isPotentialFocusTarget(target, item)) return null;
	if (root.ownerDocument.activeElement === target) return target;
	return tryFocus(root.ownerDocument, target) ? target : null;
}
//#endregion
//#region src/options.ts
function invalidOptions(root, message) {
	return new RepeatableFieldsetError("invalid-options", message, { root });
}
function hasJavaScriptValue(options, name) {
	return options[name] !== void 0;
}
function readDatasetValue(root, attribute) {
	return root.hasAttribute(attribute) ? root.getAttribute(attribute) ?? "" : void 0;
}
function parseJavaScriptInteger(root, name, value) {
	if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw invalidOptions(root, `The JavaScript option "${name}" must be a non-negative safe integer.`);
	return value;
}
function parseDatasetInteger(root, attribute, value) {
	const trimmed = value.trim();
	if (!/^\d+$/.test(trimmed)) throw invalidOptions(root, `The ${attribute} attribute must be a non-negative integer.`);
	const parsed = Number(trimmed);
	if (!Number.isSafeInteger(parsed)) throw invalidOptions(root, `The ${attribute} attribute must be a safe integer.`);
	return parsed;
}
function parseJavaScriptBoolean(root, name, value) {
	if (typeof value !== "boolean") throw invalidOptions(root, `The JavaScript option "${name}" must be a boolean.`);
	return value;
}
function parseDatasetBoolean(root, attribute, value) {
	const trimmed = value.trim();
	if (trimmed === "true") return true;
	if (trimmed === "false") return false;
	throw invalidOptions(root, `The ${attribute} attribute must be the string "true" or "false".`);
}
function parseItemLabel(root, source, value) {
	if (typeof value !== "string" || value.trim() === "") throw invalidOptions(root, `${source} must be a non-empty string.`);
	return value.trim();
}
function normalizeMinimum(root, options) {
	if (hasJavaScriptValue(options, "minimum")) return parseJavaScriptInteger(root, "minimum", options.minimum);
	const datasetValue = readDatasetValue(root, ATTRIBUTES.minimum);
	return datasetValue === void 0 ? DEFAULT_OPTIONS.minimum : parseDatasetInteger(root, ATTRIBUTES.minimum, datasetValue);
}
function normalizeMaximum(root, options) {
	if (hasJavaScriptValue(options, "maximum")) return options.maximum === null ? null : parseJavaScriptInteger(root, "maximum", options.maximum);
	const datasetValue = readDatasetValue(root, ATTRIBUTES.maximum);
	return datasetValue === void 0 ? DEFAULT_OPTIONS.maximum : parseDatasetInteger(root, ATTRIBUTES.maximum, datasetValue);
}
function normalizeItemLabel(root, options) {
	if (hasJavaScriptValue(options, "itemLabel")) return parseItemLabel(root, "The JavaScript option \"itemLabel\"", options.itemLabel);
	const datasetValue = readDatasetValue(root, ATTRIBUTES.itemLabel);
	return datasetValue === void 0 ? DEFAULT_OPTIONS.itemLabel : parseItemLabel(root, `The ${ATTRIBUTES.itemLabel} attribute`, datasetValue);
}
function normalizeBoolean(root, options, name, attribute, fallback) {
	if (hasJavaScriptValue(options, name)) return parseJavaScriptBoolean(root, name, options[name]);
	const datasetValue = readDatasetValue(root, attribute);
	return datasetValue === void 0 ? fallback : parseDatasetBoolean(root, attribute, datasetValue);
}
function normalizeKeyFactory(root, options) {
	if (options.keyFactory === void 0) return;
	if (typeof options.keyFactory !== "function") throw invalidOptions(root, "The JavaScript option \"keyFactory\" must be a function.");
	return options.keyFactory;
}
function normalizeAddons(root, options) {
	const supplied = options.addons;
	if (supplied === void 0) return;
	if (!Array.isArray(supplied)) throw invalidOptions(root, "The JavaScript option \"addons\" must be an array.");
	const ids = /* @__PURE__ */ new Set();
	for (const candidate of supplied) {
		if (candidate === null || typeof candidate !== "object" || Array.isArray(candidate)) throw invalidOptions(root, "Every JavaScript addon must be an object.");
		const addon = candidate;
		if (typeof addon.id !== "string" || addon.id.trim() === "" || addon.id !== addon.id.trim()) throw invalidOptions(root, "Every JavaScript addon must have a trimmed, non-empty id.");
		if (addon.setup !== void 0 && typeof addon.setup !== "function") throw invalidOptions(root, `The addon "${addon.id}" setup hook must be a function.`);
		if (addon.setupItem !== void 0 && typeof addon.setupItem !== "function") throw invalidOptions(root, `The addon "${addon.id}" item setup hook must be a function.`);
		if (ids.has(addon.id)) throw invalidOptions(root, `The JavaScript option "addons" contains duplicate id "${addon.id}".`);
		ids.add(addon.id);
	}
	return Object.freeze([...supplied]);
}
const MESSAGE_FORMATTER_NAMES = Object.freeze([
	"added",
	"removed",
	"restored",
	"duplicated",
	"moved",
	"moveBoundary",
	"maximum",
	"minimum"
]);
function resolveMessageFormatter(root, supplied, name, fallback) {
	if (!Object.prototype.hasOwnProperty.call(supplied, name)) return fallback;
	const formatter = supplied[name];
	if (typeof formatter !== "function") throw invalidOptions(root, `The JavaScript message formatter "${name}" must be a function.`);
	return formatter;
}
function normalizeMessageFormatters(root, options) {
	const supplied = options.messageFormatters;
	if (supplied === void 0) return DEFAULT_OPTIONS.messageFormatters;
	if (supplied === null || typeof supplied !== "object" || Array.isArray(supplied)) throw invalidOptions(root, "The JavaScript option \"messageFormatters\" must be an object.");
	if (Reflect.ownKeys(supplied).some((key) => typeof key !== "string" || !MESSAGE_FORMATTER_NAMES.includes(key))) throw invalidOptions(root, "The JavaScript option \"messageFormatters\" contains an unknown formatter.");
	return Object.freeze({
		added: resolveMessageFormatter(root, supplied, "added", DEFAULT_OPTIONS.messageFormatters.added),
		removed: resolveMessageFormatter(root, supplied, "removed", DEFAULT_OPTIONS.messageFormatters.removed),
		restored: resolveMessageFormatter(root, supplied, "restored", DEFAULT_OPTIONS.messageFormatters.restored),
		duplicated: resolveMessageFormatter(root, supplied, "duplicated", DEFAULT_OPTIONS.messageFormatters.duplicated),
		moved: resolveMessageFormatter(root, supplied, "moved", DEFAULT_OPTIONS.messageFormatters.moved),
		moveBoundary: resolveMessageFormatter(root, supplied, "moveBoundary", DEFAULT_OPTIONS.messageFormatters.moveBoundary),
		maximum: resolveMessageFormatter(root, supplied, "maximum", DEFAULT_OPTIONS.messageFormatters.maximum),
		minimum: resolveMessageFormatter(root, supplied, "minimum", DEFAULT_OPTIONS.messageFormatters.minimum)
	});
}
/**
* Normalizes safe primitive datasets and JavaScript-only callback options
* without changing the root or caller input.
*/
function normalizeRepeatableFieldsetOptions(root, options = {}) {
	if (options === null || typeof options !== "object" || Array.isArray(options)) throw invalidOptions(root, "JavaScript options must be an object.");
	const minimum = normalizeMinimum(root, options);
	const maximum = normalizeMaximum(root, options);
	if (maximum !== null && maximum < minimum) throw invalidOptions(root, "The normalized \"maximum\" option must be greater than or equal to \"minimum\".");
	const normalized = {
		minimum,
		maximum,
		itemLabel: normalizeItemLabel(root, options),
		focusOnAdd: normalizeBoolean(root, options, "focusOnAdd", ATTRIBUTES.focusOnAdd, DEFAULT_OPTIONS.focusOnAdd),
		announceChanges: normalizeBoolean(root, options, "announceChanges", ATTRIBUTES.announceChanges, DEFAULT_OPTIONS.announceChanges),
		messageFormatters: normalizeMessageFormatters(root, options)
	};
	const keyFactory = normalizeKeyFactory(root, options);
	const addons = normalizeAddons(root, options);
	return Object.freeze({
		...normalized,
		...keyFactory === void 0 ? {} : { keyFactory },
		...addons === void 0 ? {} : { addons }
	});
}
//#endregion
//#region src/discovery.ts
const HTML_NAMESPACE$2 = "http://www.w3.org/1999/xhtml";
const ITEM_MARKER_SELECTOR = `[${ATTRIBUTES.item}]`;
const ITEMS_MARKER_SELECTOR = `[${ATTRIBUTES.items}]`;
const TEMPLATE_MARKER_SELECTOR = `[${ATTRIBUTES.template}]`;
const ADD_MARKER_SELECTOR = `[${ATTRIBUTES.add}]`;
const REMOVE_MARKER_SELECTOR = `[${ATTRIBUTES.remove}]`;
const FOCUS_MARKER_SELECTOR = `[${ATTRIBUTES.focus}]`;
const STATUS_MARKER_SELECTOR = `[${ATTRIBUTES.status}]`;
function markupError(code, root, message, element) {
	return new RepeatableFieldsetError(code, message, element === void 0 ? { root } : {
		root,
		element
	});
}
function isHTMLElement$1(value) {
	if (typeof value !== "object" || value === null) return false;
	const candidate = value;
	return candidate.nodeType === 1 && candidate.namespaceURI === HTML_NAMESPACE$2 && typeof candidate.matches === "function" && typeof candidate.querySelectorAll === "function" && typeof candidate.hasAttribute === "function" && candidate.ownerDocument !== void 0;
}
function isHTMLFieldSetElement$1(element) {
	return element.namespaceURI === HTML_NAMESPACE$2 && element.localName === "fieldset";
}
function isHTMLLegendElement(element) {
	return element.namespaceURI === HTML_NAMESPACE$2 && element.localName === "legend";
}
function isHTMLButtonElement(element) {
	return element.namespaceURI === HTML_NAMESPACE$2 && element.localName === "button";
}
function isHTMLTemplateElement(element) {
	return element.namespaceURI === HTML_NAMESPACE$2 && element.localName === "template";
}
function validateRoot(value) {
	if (!isHTMLElement$1(value)) throw new RepeatableFieldsetError("invalid-root", "The repeatable-fieldset root must be an HTML element.");
	if (!value.matches(SELECTORS.root)) throw markupError("invalid-root", value, `The root must have the ${ATTRIBUTES.root} attribute.`, value);
	const ancestorRoot = value.parentElement?.closest(SELECTORS.root);
	if (ancestorRoot !== null && ancestorRoot !== void 0) throw markupError("invalid-root", value, "Nested repeatable-fieldset roots are not supported.", value);
	return value;
}
function findOwnedElements(root, selector) {
	return [...root.matches(selector) ? [root] : [], ...root.querySelectorAll(selector)].filter((element) => element.closest(SELECTORS.root) === root);
}
function requireSingleOwnedElement(root, selector, missingCode, multipleCode, description) {
	const matches = findOwnedElements(root, selector);
	if (matches.length === 0) throw markupError(missingCode, root, `The root must contain one owned ${description}.`);
	if (matches.length > 1) throw markupError(multipleCode, root, `The root must not contain more than one owned ${description}.`, matches[1]);
	const match = matches[0];
	if (match === void 0) throw markupError(missingCode, root, `The root must contain one owned ${description}.`);
	return match;
}
function hasMeaningfulText(element) {
	return (element.textContent ?? "").trim() !== "";
}
function validateEnhancementButton(root, element, errorCode, description) {
	if (!isHTMLButtonElement(element)) throw markupError(errorCode, root, `The ${description} must be a native button element.`, element);
	if (element.getAttribute("type")?.trim().toLowerCase() !== "button") throw markupError(errorCode, root, `The ${description} must explicitly use type="button".`, element);
	if (!element.hasAttribute("hidden")) throw markupError(errorCode, root, `The ${description} must be hidden before initialization.`, element);
	if (!hasMeaningfulText(element)) throw markupError(errorCode, root, `The ${description} must have a visible text label.`, element);
	return element;
}
function findDirectLegend(root, item, malformedCode) {
	const legends = Array.from(item.children).filter(isHTMLLegendElement);
	if (legends.length === 0) throw markupError("missing-legend", root, "Every repeatable item must have a direct-child legend.", item);
	if (legends.length > 1) throw markupError(malformedCode, root, "A repeatable item must not contain multiple direct-child legends.", legends[1]);
	const legend = legends[0];
	if (legend === void 0 || !hasMeaningfulText(legend)) throw markupError("missing-legend", root, "Every repeatable item must have a meaningful non-empty legend.", legend ?? item);
	return legend;
}
function findScopedElements(item, selector, root) {
	return [...item.matches(selector) ? [item] : [], ...item.querySelectorAll(selector)].filter((element) => {
		if (element.closest(ITEM_MARKER_SELECTOR) !== item) return false;
		return root === void 0 || element.closest(SELECTORS.root) === root;
	});
}
function findFocusTarget(root, item, malformedCode, ownedRoot) {
	const markers = findScopedElements(item, FOCUS_MARKER_SELECTOR, ownedRoot);
	if (markers.length > 1) throw markupError("invalid-focus-target", root, "A repeatable item must not contain multiple focus markers.", markers[1]);
	const marker = markers[0];
	if (marker === void 0) return null;
	if (marker === item || !isPotentialFocusTarget(marker, item)) throw markupError("invalid-focus-target", root, `The focus marker in the ${malformedCode === "invalid-template" ? "template" : "item"} must identify an enabled, non-hidden, programmatically focusable descendant.`, marker);
	return marker;
}
function findRemoveButton(root, item, ownedRoot) {
	const matches = findScopedElements(item, REMOVE_MARKER_SELECTOR, ownedRoot);
	if (matches.length === 0) throw markupError("missing-remove-control", root, "Every repeatable item must contain one owned Remove button.", item);
	if (matches.length > 1) throw markupError("multiple-remove-controls", root, "A repeatable item must not contain multiple owned Remove buttons.", matches[1]);
	const match = matches[0];
	if (match === void 0) throw markupError("missing-remove-control", root, "Every repeatable item must contain one owned Remove button.", item);
	return validateEnhancementButton(root, match, "missing-remove-control", "Remove control");
}
function readExistingKey(root, item, usedKeys) {
	if (!item.hasAttribute(ATTRIBUTES.key)) return null;
	const key = (item.getAttribute(ATTRIBUTES.key) ?? "").trim();
	if (!ITEM_KEY_PATTERN.test(key)) throw markupError("invalid-key", root, `Existing item keys must match ${ITEM_KEY_PATTERN.source}.`, item);
	if (usedKeys.has(key)) throw markupError("duplicate-key", root, `The existing item key "${key}" is duplicated.`, item);
	usedKeys.add(key);
	return key;
}
function validateExistingItem(root, item, usedKeys) {
	return Object.freeze({
		element: item,
		legend: findDirectLegend(root, item, "invalid-item"),
		removeButton: findRemoveButton(root, item, root),
		key: readExistingKey(root, item, usedKeys)
	});
}
function hasOnlyOneTopLevelTemplateElement(template) {
	if (template.content.children.length !== 1) return false;
	return Array.from(template.content.childNodes).every((node) => node.nodeType === node.ELEMENT_NODE || node.nodeType === node.COMMENT_NODE || node.nodeType === node.TEXT_NODE && (node.textContent ?? "").trim() === "");
}
function validateTemplateIds(root, template) {
	const ids = /* @__PURE__ */ new Set();
	for (const element of template.content.querySelectorAll("[id]")) {
		if (element.id === "") continue;
		if (ids.has(element.id)) throw markupError("duplicate-id", root, `The template contains the duplicate id "${element.id}".`, element);
		ids.add(element.id);
	}
}
function validateTemplate(root, element, itemsContainer) {
	if (!isHTMLTemplateElement(element)) throw markupError("invalid-template", root, "The template marker must be placed on an HTML template element.", element);
	if (itemsContainer.contains(element)) throw markupError("invalid-template", root, "The owned template must be outside the items container.", element);
	if (!hasOnlyOneTopLevelTemplateElement(element)) throw markupError("invalid-template", root, "The template must contain exactly one top-level element and no non-whitespace top-level text.", element);
	const item = element.content.firstElementChild;
	if (item === null || !isHTMLFieldSetElement$1(item) || !item.matches(ITEM_MARKER_SELECTOR)) throw markupError("invalid-template", root, "The template top-level element must be a marked item fieldset.", item ?? element);
	if (element.content.querySelectorAll(ITEM_MARKER_SELECTOR).length !== 1) throw markupError("invalid-template", root, "The template must not contain nested marked repeatable items.", item);
	const nestedRoot = item.querySelector(SELECTORS.root);
	if (nestedRoot !== null) throw markupError("invalid-template", root, "The template must not contain a nested repeatable-fieldset root.", nestedRoot);
	if (item.hasAttribute(ATTRIBUTES.key)) {
		if ((item.getAttribute(ATTRIBUTES.key) ?? "") !== "__A11Y_REPEATABLE_KEY__") throw markupError("invalid-template", root, `A template item key must use the literal token ${TEMPLATE_KEY_TOKEN}.`, item);
	}
	validateTemplateIds(root, element);
	return Object.freeze({
		element,
		item,
		legend: findDirectLegend(root, item, "invalid-template"),
		removeButton: findRemoveButton(root, item),
		focusTarget: findFocusTarget(root, item, "invalid-template")
	});
}
function validateStatusRegion(root, itemsContainer) {
	const matches = findOwnedElements(root, STATUS_MARKER_SELECTOR);
	if (matches.length > 1) throw markupError("multiple-status-regions", root, "The root must not contain multiple owned status regions.", matches[1]);
	const match = matches[0];
	if (match === void 0) return null;
	if (!isHTMLElement$1(match)) throw markupError("nonempty-status-region", root, "The author-provided status region must be an HTML element.", match);
	if (itemsContainer.contains(match)) throw markupError("invalid-item", root, "The author-provided status region must be outside the items container.", match);
	if (match.childNodes.length !== 0) throw markupError("nonempty-status-region", root, "The author-provided status region must be empty at initialization.", match);
	return match;
}
function validateOwnedIds(root) {
	const ownedElements = findOwnedElements(root, "[id]");
	const ownedIds = /* @__PURE__ */ new Set();
	for (const element of ownedElements) {
		if (element.id === "") continue;
		if (ownedIds.has(element.id)) throw markupError("duplicate-id", root, `The owned id "${element.id}" is duplicated.`, element);
		ownedIds.add(element.id);
	}
	const documentElements = root.ownerDocument.querySelectorAll("[id]");
	for (const element of ownedElements) {
		if (element.id === "") continue;
		if (Array.from(documentElements).find((candidate) => candidate !== element && candidate.id === element.id) !== void 0) throw markupError("duplicate-id", root, `The owned id "${element.id}" collides with another element in the owner document.`, element);
	}
}
/**
* Validates and returns the author-owned semantic structure without changing
* author markup or allocating identity.
*/
function discoverRepeatableFieldsetMarkup(rootValue, options = {}) {
	const root = validateRoot(rootValue);
	const normalizedOptions = normalizeRepeatableFieldsetOptions(root, options);
	const itemsElement = requireSingleOwnedElement(root, ITEMS_MARKER_SELECTOR, "missing-items-container", "multiple-items-containers", "items container");
	if (!isHTMLElement$1(itemsElement)) throw markupError("missing-items-container", root, "The owned items container must be an HTML element.", itemsElement);
	const templateElement = requireSingleOwnedElement(root, TEMPLATE_MARKER_SELECTOR, "missing-template", "multiple-templates", "template");
	const addElement = requireSingleOwnedElement(root, ADD_MARKER_SELECTOR, "missing-add-control", "multiple-add-controls", "Add control");
	if (itemsElement.contains(addElement)) throw markupError("invalid-item", root, "The owned Add control must be outside the items container.", addElement);
	const addButton = validateEnhancementButton(root, addElement, "missing-add-control", "Add control");
	const template = validateTemplate(root, templateElement, itemsElement);
	const markedItems = findOwnedElements(root, ITEM_MARKER_SELECTOR);
	for (const markedItem of markedItems) if (!isHTMLFieldSetElement$1(markedItem) || markedItem.parentElement !== itemsElement) throw markupError("invalid-item", root, "Every owned marked item must be a direct-child fieldset of the items container.", markedItem);
	const usedKeys = /* @__PURE__ */ new Set();
	const items = Object.freeze(Array.from(itemsElement.children).filter((element) => isHTMLFieldSetElement$1(element) && element.matches(ITEM_MARKER_SELECTOR) && element.closest(SELECTORS.root) === root).map((item) => validateExistingItem(root, item, usedKeys)));
	const statusRegion = validateStatusRegion(root, itemsElement);
	validateOwnedIds(root);
	return Object.freeze({
		root,
		options: normalizedOptions,
		itemsContainer: itemsElement,
		items,
		addButton,
		template,
		statusRegion
	});
}
//#endregion
//#region src/keys.ts
function createErrorOptions(root, element, cause) {
	return {
		root,
		...element === void 0 ? {} : { element },
		...cause === void 0 ? {} : { cause }
	};
}
/**
* Owns every key observed or allocated during one component lifetime.
*
* There is intentionally no release operation: detaching an item cannot make
* its key available for reuse.
*/
var StableKeyAllocator = class {
	reservedKeys = /* @__PURE__ */ new Set();
	root;
	keyFactory;
	nextDefaultNumber = 1;
	allocationSequence = 0;
	constructor(root, initialKeys = [], keyFactory = void 0) {
		this.root = root;
		this.keyFactory = keyFactory;
		for (const key of initialKeys) this.reserve(key);
	}
	allocate(source, element) {
		this.allocationSequence += 1;
		if (this.keyFactory === void 0) return this.allocateDefault();
		const context = Object.freeze({
			root: this.root,
			source,
			sequence: this.allocationSequence,
			reservedKeys: this.getReservedKeys()
		});
		let candidate;
		try {
			candidate = this.keyFactory(context);
		} catch (cause) {
			throw this.error("invalid-key", "The key factory threw while generating a stable item key.", element, cause);
		}
		return this.reserve(candidate, element);
	}
	reserve(candidate, element) {
		if (typeof candidate !== "string" || !ITEM_KEY_PATTERN.test(candidate)) throw this.error("invalid-key", `Generated item keys must match ${ITEM_KEY_PATTERN.source}.`, element);
		if (this.reservedKeys.has(candidate)) throw this.error("duplicate-key", `The item key "${candidate}" is already reserved.`, element);
		this.reservedKeys.add(candidate);
		return candidate;
	}
	has(key) {
		return this.reservedKeys.has(key);
	}
	getReservedKeys() {
		return Object.freeze(Array.from(this.reservedKeys));
	}
	allocateDefault() {
		let key = `${GENERATED_KEY_PREFIX}${this.nextDefaultNumber}`;
		this.nextDefaultNumber += 1;
		while (this.reservedKeys.has(key)) {
			key = `${GENERATED_KEY_PREFIX}${this.nextDefaultNumber}`;
			this.nextDefaultNumber += 1;
		}
		this.reservedKeys.add(key);
		return key;
	}
	error(code, message, element, cause) {
		return new RepeatableFieldsetError(code, message, createErrorOptions(this.root, element, cause));
	}
};
//#endregion
//#region src/items.ts
function createRegistry(plannedItems, allocator, root) {
	const byElement = /* @__PURE__ */ new WeakMap();
	const byKey = /* @__PURE__ */ new Map();
	const items = plannedItems.map(({ discovered, key }) => {
		const registered = Object.freeze({
			element: discovered.element,
			legend: discovered.legend,
			removeButton: discovered.removeButton,
			key
		});
		byElement.set(registered.element, registered);
		byKey.set(key, registered);
		return registered;
	});
	return Object.freeze({
		get items() {
			return Object.freeze(Array.from(items));
		},
		getByElement(element) {
			return byElement.get(element) ?? null;
		},
		getByKey(key) {
			return byKey.get(key) ?? null;
		},
		allocateKey(source, element) {
			return allocator.allocate(source, element);
		},
		reserveKey(key, element) {
			return allocator.reserve(key, element);
		},
		registerAddedItem(item, index = items.length) {
			if (!allocator.has(item.key)) throw new RepeatableFieldsetError("invalid-key", "A new item must use a key reserved by this component instance.", {
				root,
				element: item.element
			});
			if (byElement.has(item.element) || byKey.has(item.key)) throw new RepeatableFieldsetError("invalid-template", "A new item cannot duplicate an active item or key.", {
				root,
				element: item.element
			});
			if (!Number.isSafeInteger(index) || index < 0 || index > items.length) throw new RepeatableFieldsetError("invalid-item", "A new item must use a valid collection insertion index.", {
				root,
				element: item.element
			});
			const registered = Object.freeze({
				element: item.element,
				legend: item.legend,
				removeButton: item.removeButton,
				key: item.key
			});
			items.splice(index, 0, registered);
			byElement.set(registered.element, registered);
			byKey.set(registered.key, registered);
			let active = true;
			return Object.freeze({
				item: registered,
				rollback() {
					if (!active) return;
					active = false;
					const index = items.indexOf(registered);
					if (index !== -1) items.splice(index, 1);
					byElement.delete(registered.element);
					if (byKey.get(registered.key) === registered) byKey.delete(registered.key);
				}
			});
		},
		unregisterItem(item) {
			const index = items.indexOf(item);
			if (index === -1 || byElement.get(item.element) !== item || byKey.get(item.key) !== item) throw new RepeatableFieldsetError("invalid-item", "Only a currently registered item can be removed.", {
				root,
				element: item.element
			});
			items.splice(index, 1);
			byElement.delete(item.element);
			byKey.delete(item.key);
			let active = true;
			return Object.freeze({
				item,
				index,
				rollback() {
					if (!active) return;
					active = false;
					if (byElement.has(item.element) || byKey.has(item.key)) throw new RepeatableFieldsetError("invalid-item", "The removed item registration could not be restored.", {
						root,
						element: item.element
					});
					items.splice(Math.min(index, items.length), 0, item);
					byElement.set(item.element, item);
					byKey.set(item.key, item);
				}
			});
		},
		moveItem(item, index) {
			const previousIndex = items.indexOf(item);
			if (previousIndex === -1 || byElement.get(item.element) !== item || byKey.get(item.key) !== item || !Number.isSafeInteger(index) || index < 0 || index >= items.length || index === previousIndex) throw new RepeatableFieldsetError("invalid-item", "Only a currently registered item can move to a different valid index.", {
				root,
				element: item.element
			});
			items.splice(previousIndex, 1);
			items.splice(index, 0, item);
			let active = true;
			return Object.freeze({
				item,
				previousIndex,
				index,
				rollback() {
					if (!active) return;
					active = false;
					const currentIndex = items.indexOf(item);
					if (currentIndex === -1) throw new RepeatableFieldsetError("invalid-item", "The moved item registration could not be restored.", {
						root,
						element: item.element
					});
					items.splice(currentIndex, 1);
					items.splice(previousIndex, 0, item);
				}
			});
		},
		hasReservedKey(key) {
			return allocator.has(key);
		},
		getReservedKeys() {
			return allocator.getReservedKeys();
		}
	});
}
function removeAssignedKeys(assignedItems) {
	for (let index = assignedItems.length - 1; index >= 0; index -= 1) assignedItems[index]?.removeAttribute(ATTRIBUTES.key);
}
/**
* Registers existing items in discovery/DOM order and assigns identity only
* to fieldsets whose key attribute was absent.
*/
function registerExistingRepeatableFieldsetItems(markup) {
	if (markup.items.length === 0 && markup.options.minimum !== 0) throw new RepeatableFieldsetError("invalid-options", "A repeatable fieldset with no existing items requires a minimum of 0.", {
		root: markup.root,
		element: markup.itemsContainer
	});
	const allocator = new StableKeyAllocator(markup.root, markup.items.flatMap(({ key }) => key === null ? [] : [key]), markup.options.keyFactory);
	const plannedItems = markup.items.map((discovered) => {
		if (discovered.key !== null) return Object.freeze({
			discovered,
			key: discovered.key,
			assignKey: false
		});
		return Object.freeze({
			discovered,
			key: allocator.allocate("initialization", discovered.element),
			assignKey: true
		});
	});
	const registry = createRegistry(plannedItems, allocator, markup.root);
	const assignedItems = [];
	let currentAssignment = null;
	try {
		for (const planned of plannedItems) {
			if (!planned.assignKey) continue;
			currentAssignment = planned.discovered.element;
			assignedItems.push(currentAssignment);
			currentAssignment.setAttribute(ATTRIBUTES.key, planned.key);
		}
	} catch (cause) {
		removeAssignedKeys(assignedItems);
		throw new RepeatableFieldsetError("invalid-key", "The component could not assign a stable key to an existing item.", {
			root: markup.root,
			element: currentAssignment ?? markup.itemsContainer,
			cause
		});
	}
	let rolledBack = false;
	return Object.freeze({
		registry,
		rollback() {
			if (rolledBack) return;
			rolledBack = true;
			removeAssignedKeys(assignedItems);
		}
	});
}
//#endregion
//#region src/positions.ts
function findOwnedPositionMarkers(root, item) {
	if (item.matches(SELECTORS.position)) throw new RepeatableFieldsetError("invalid-item", "A position marker must be a dedicated descendant of its item fieldset.", {
		root,
		element: item
	});
	return Array.from(item.querySelectorAll(SELECTORS.position)).filter((marker) => marker.closest(SELECTORS.item) === item && marker.closest(SELECTORS.root) === root);
}
function restoreMarkerContents(originalContents) {
	for (let index = originalContents.length - 1; index >= 0; index -= 1) {
		const original = originalContents[index];
		if (original !== void 0) original.marker.replaceChildren(...original.childNodes);
	}
}
/**
* Updates dedicated owned position markers and returns fresh immutable
* zero-based-index/one-based-position snapshots.
*/
function synchronizeRepeatableFieldsetPositions(root, items) {
	const snapshots = Object.freeze(items.map((item, index) => Object.freeze({
		element: item.element,
		key: item.key,
		index,
		position: index + 1
	})));
	const plannedWrites = snapshots.flatMap(({ element, position }) => findOwnedPositionMarkers(root, element).map((marker) => ({
		marker,
		text: String(position)
	})));
	const originalContents = [];
	let currentMarker = null;
	try {
		for (const write of plannedWrites) {
			currentMarker = write.marker;
			originalContents.push({
				marker: write.marker,
				childNodes: Object.freeze(Array.from(write.marker.childNodes))
			});
			write.marker.textContent = write.text;
		}
	} catch (cause) {
		restoreMarkerContents(originalContents);
		throw new RepeatableFieldsetError("invalid-item", "The component could not synchronize an item position marker.", {
			root,
			...currentMarker === null ? {} : { element: currentMarker },
			cause
		});
	}
	let rolledBack = false;
	return Object.freeze({
		snapshots,
		rollback() {
			if (rolledBack) return;
			rolledBack = true;
			restoreMarkerContents(originalContents);
		}
	});
}
//#endregion
//#region src/status.ts
const STATUS_CLEAR_DELAY_MS = 5e3;
const MANAGED_ATTRIBUTES = Object.freeze([
	"role",
	"aria-live",
	"aria-atomic"
]);
function restoreManagedAttributes(region, states) {
	for (const state of states) try {
		if (state.value === null) region.removeAttribute(state.name);
		else region.setAttribute(state.name, state.value);
	} catch {}
}
function statusError(root, region, cause) {
	return new RepeatableFieldsetError("invalid-item", "The component could not initialize its polite status region.", {
		root,
		...region === null ? {} : { element: region },
		cause
	});
}
function createRepeatableFieldsetStatusController(root, authorRegion, enabled) {
	if (!enabled) return Object.freeze({
		region: null,
		write() {},
		destroy() {}
	});
	const generated = authorRegion === null;
	let region = authorRegion;
	const attributeStates = [];
	try {
		if (region === null) {
			region = root.ownerDocument.createElement("div");
			region.setAttribute(ATTRIBUTES.status, "");
			region.className = CLASSES.status;
		} else for (const name of MANAGED_ATTRIBUTES) attributeStates.push({
			name,
			value: region.getAttribute(name)
		});
		region.setAttribute("role", "status");
		region.setAttribute("aria-live", "polite");
		region.setAttribute("aria-atomic", "true");
		if (generated) root.append(region);
	} catch (cause) {
		if (region !== null) if (generated) try {
			region.remove();
		} catch {}
		else restoreManagedAttributes(region, attributeStates);
		throw statusError(root, region, cause);
	}
	if (region === null) throw statusError(root, null, /* @__PURE__ */ new Error("No status region was created."));
	const managedRegion = region;
	let active = true;
	let clearTimer = null;
	const timerWindow = root.ownerDocument.defaultView;
	function cancelClearTimer() {
		if (clearTimer === null) return;
		try {
			if (timerWindow !== null) timerWindow.clearTimeout(clearTimer);
		} catch {} finally {
			clearTimer = null;
		}
	}
	function scheduleClear(message) {
		const clear = () => {
			clearTimer = null;
			try {
				if (active && managedRegion.textContent === message) managedRegion.textContent = "";
			} catch {}
		};
		if (timerWindow !== null) clearTimer = timerWindow.setTimeout(clear, STATUS_CLEAR_DELAY_MS);
	}
	return Object.freeze({
		region: managedRegion,
		write(message) {
			if (!active) return;
			cancelClearTimer();
			try {
				managedRegion.textContent = message;
				scheduleClear(message);
			} catch {
				cancelClearTimer();
			}
		},
		destroy() {
			if (!active) return;
			active = false;
			cancelClearTimer();
			if (generated) {
				try {
					managedRegion.remove();
				} catch {}
				return;
			}
			try {
				managedRegion.textContent = "";
			} catch {}
			restoreManagedAttributes(managedRegion, attributeStates);
		}
	});
}
//#endregion
//#region src/template.ts
const HTML_NAMESPACE$1 = "http://www.w3.org/1999/xhtml";
const ASCII_WHITESPACE = /[\u0009\u000a\u000c\u000d\u0020]+/;
const LEADING_ASCII_WHITESPACE = /^[\u0009\u000a\u000c\u000d\u0020]+/;
const TRAILING_ASCII_WHITESPACE = /[\u0009\u000a\u000c\u000d\u0020]+$/;
function templateError(code, root, message, element) {
	return new RepeatableFieldsetError(code, message, element === void 0 ? { root } : {
		root,
		element
	});
}
function isHTMLElement(element) {
	return element.namespaceURI === HTML_NAMESPACE$1;
}
function findScopedCandidates(item, selector) {
	return [...item.matches(selector) ? [item] : [], ...item.querySelectorAll(selector)].filter((element) => element.closest(SELECTORS.item) === item);
}
function getCloneElements(item) {
	return [item, ...item.querySelectorAll("*")];
}
function replaceToken(value, key) {
	return value.split(TEMPLATE_KEY_TOKEN).join(key);
}
function splitASCIIWhitespace(value) {
	const trimmed = value.replace(LEADING_ASCII_WHITESPACE, "").replace(TRAILING_ASCII_WHITESPACE, "");
	return trimmed === "" ? [] : trimmed.split(ASCII_WHITESPACE);
}
function rewriteScalarAttributes(elements, key, references) {
	for (const element of elements) for (const attribute of TOKEN_ATTRIBUTES.scalar) {
		const value = element.getAttribute(attribute);
		if (value === null || !value.includes("__A11Y_REPEATABLE_KEY__")) continue;
		const replaced = replaceToken(value, key);
		element.setAttribute(attribute, replaced);
		if (attribute === "for" || attribute === "list") references.push({
			source: element,
			attribute,
			id: replaced
		});
	}
}
function rewriteIDReferenceAttributes(elements, key, references) {
	for (const element of elements) for (const attribute of TOKEN_ATTRIBUTES.idReference) {
		const value = element.getAttribute(attribute);
		if (value === null || !value.includes("__A11Y_REPEATABLE_KEY__")) continue;
		const replacedTokens = splitASCIIWhitespace(value).map((token) => {
			if (!token.includes("__A11Y_REPEATABLE_KEY__")) return token;
			const replaced = replaceToken(token, key);
			references.push({
				source: element,
				attribute,
				id: replaced
			});
			return replaced;
		});
		element.setAttribute(attribute, replacedTokens.join(" "));
	}
}
function rewriteHashReferences(elements, key, references) {
	for (const element of elements) {
		const href = element.getAttribute("href");
		if (href === null || !href.startsWith("#") || !href.includes("__A11Y_REPEATABLE_KEY__")) continue;
		const replaced = replaceToken(href, key);
		element.setAttribute("href", replaced);
		references.push({
			source: element,
			attribute: "href",
			id: replaced.slice(1)
		});
	}
}
function validateNoSupportedResidualTokens(root, item, elements) {
	if ((item.getAttribute(ATTRIBUTES.key) ?? "").includes("__A11Y_REPEATABLE_KEY__")) throw templateError("unresolved-template-token", root, "The materialized item key retains the template token.", item);
	for (const element of elements) {
		for (const attribute of [...TOKEN_ATTRIBUTES.scalar, ...TOKEN_ATTRIBUTES.idReference]) if ((element.getAttribute(attribute) ?? "").includes("__A11Y_REPEATABLE_KEY__")) throw templateError("unresolved-template-token", root, `The materialized ${attribute} attribute retains the template token.`, element);
		const href = element.getAttribute("href");
		if (href !== null && href.startsWith("#") && href.includes("__A11Y_REPEATABLE_KEY__")) throw templateError("unresolved-template-token", root, "A materialized same-document href retains the template token.", element);
	}
}
function collectAndValidateIds(root, elements) {
	const cloneIds = /* @__PURE__ */ new Map();
	for (const element of elements) {
		const id = element.getAttribute("id");
		if (id === null || id === "") continue;
		if (cloneIds.has(id)) throw templateError("duplicate-id", root, `The materialized item contains the duplicate id "${id}".`, element);
		cloneIds.set(id, element);
	}
	const documentElements = root.ownerDocument.querySelectorAll("[id]");
	for (const [id, element] of cloneIds) if (Array.from(documentElements).some((documentElement) => documentElement.id === id)) throw templateError("duplicate-id", root, `The materialized id "${id}" collides with the owner document.`, element);
	return cloneIds;
}
function validateLocalReferences(root, references, cloneIds) {
	for (const reference of references) if (reference.id === "" || !cloneIds.has(reference.id)) throw templateError("invalid-template", root, `The tokenized ${reference.attribute} reference "${reference.id}" does not resolve inside the materialized item.`, reference.source);
}
function findCloneStructure(root, item) {
	if (item.namespaceURI !== HTML_NAMESPACE$1 || item.localName !== "fieldset" || !item.matches(SELECTORS.item)) throw templateError("invalid-template", root, "The materialized template root must remain a marked fieldset.", item);
	const nestedItem = item.querySelector(SELECTORS.item);
	if (nestedItem !== null) throw templateError("invalid-template", root, "The materialized item must not contain a nested marked item.", nestedItem);
	const nestedRoot = item.querySelector(SELECTORS.root);
	if (nestedRoot !== null) throw templateError("invalid-template", root, "The materialized item must not contain a nested component root.", nestedRoot);
	const legends = Array.from(item.children).filter((element) => element.namespaceURI === HTML_NAMESPACE$1 && element.localName === "legend");
	const legend = legends[0];
	if (legends.length !== 1 || legend === void 0 || (legend.textContent ?? "").trim() === "") throw templateError("invalid-template", root, "The materialized item must contain one meaningful direct legend.", legend ?? item);
	const removeCandidates = findScopedCandidates(item, SELECTORS.remove);
	const removeCandidate = removeCandidates[0];
	if (removeCandidates.length !== 1 || removeCandidate === void 0 || removeCandidate.namespaceURI !== HTML_NAMESPACE$1 || removeCandidate.localName !== "button" || removeCandidate.getAttribute("type")?.trim().toLowerCase() !== "button" || !removeCandidate.hasAttribute("hidden") || (removeCandidate.textContent ?? "").trim() === "") throw templateError("invalid-template", root, "The materialized item must retain one hidden button-type Remove control.", removeCandidate ?? item);
	const removeButton = removeCandidate;
	const focusCandidates = findScopedCandidates(item, SELECTORS.focus);
	if (focusCandidates.length > 1) throw templateError("invalid-template", root, "The materialized item must not contain multiple focus markers.", focusCandidates[1]);
	const focusCandidate = focusCandidates[0];
	if (focusCandidate !== void 0 && (focusCandidate === item || !isHTMLElement(focusCandidate) || !isPotentialFocusTarget(focusCandidate, item))) throw templateError("invalid-template", root, "The materialized focus marker must remain on an enabled, non-hidden, programmatically focusable HTML descendant.", focusCandidate);
	return Object.freeze({
		legend,
		removeButton,
		focusTarget: focusCandidate ?? null
	});
}
/**
* Clones the trusted inert template before key allocation. The returned
* fieldset remains disconnected and no token replacement has occurred.
*/
function cloneRepeatableFieldsetTemplate(root, template) {
	if (template.element.ownerDocument !== root.ownerDocument) throw templateError("invalid-template", root, "The template must belong to the component root's document.", template.element);
	const clone = template.item.cloneNode(true);
	return root.ownerDocument.adoptNode(clone);
}
/**
* Applies one already-reserved stable key to a disconnected clone and
* validates every supported identity relationship before insertion.
*/
function materializeClonedRepeatableFieldsetTemplate(root, item, key) {
	if (typeof key !== "string" || !ITEM_KEY_PATTERN.test(key)) throw templateError("invalid-key", root, `A materialized item key must match ${ITEM_KEY_PATTERN.source}.`, item);
	if (item.ownerDocument !== root.ownerDocument || item.isConnected) throw templateError("invalid-template", root, "Template materialization requires a disconnected clone in the root's document.", item);
	const structure = findCloneStructure(root, item);
	const templateItemKey = item.getAttribute(ATTRIBUTES.key);
	if (templateItemKey !== null && templateItemKey !== "__A11Y_REPEATABLE_KEY__") throw templateError("invalid-template", root, `The template item key must use ${TEMPLATE_KEY_TOKEN}.`, item);
	item.setAttribute(ATTRIBUTES.key, key);
	const elements = getCloneElements(item);
	const references = [];
	rewriteScalarAttributes(elements, key, references);
	rewriteIDReferenceAttributes(elements, key, references);
	rewriteHashReferences(elements, key, references);
	validateNoSupportedResidualTokens(root, item, elements);
	validateLocalReferences(root, references, collectAndValidateIds(root, elements));
	return Object.freeze({
		item,
		key,
		...structure
	});
}
//#endregion
//#region src/instance.ts
const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const INACTIVE_ADD_RESULT = Object.freeze({
	ok: false,
	reason: "inactive"
});
const MAXIMUM_ADD_RESULT = Object.freeze({
	ok: false,
	reason: "maximum"
});
const INACTIVE_DUPLICATE_RESULT = Object.freeze({
	ok: false,
	reason: "inactive"
});
const MAXIMUM_DUPLICATE_RESULT = Object.freeze({
	ok: false,
	reason: "maximum"
});
const UNOWNED_DUPLICATE_RESULT = Object.freeze({
	ok: false,
	reason: "unowned-item"
});
const INACTIVE_REMOVE_RESULT = Object.freeze({
	ok: false,
	reason: "inactive"
});
const MINIMUM_REMOVE_RESULT = Object.freeze({
	ok: false,
	reason: "minimum"
});
const UNOWNED_REMOVE_RESULT = Object.freeze({
	ok: false,
	reason: "unowned-item"
});
const INACTIVE_MOVE_RESULT = Object.freeze({
	ok: false,
	reason: "inactive"
});
const UNOWNED_MOVE_RESULT = Object.freeze({
	ok: false,
	reason: "unowned-item"
});
function validateOperationOptions(root, operation, options) {
	const keys = typeof options === "object" && options !== null && !Array.isArray(options) ? Reflect.ownKeys(options) : [];
	if (typeof options !== "object" || options === null || Array.isArray(options) || keys.some((key) => key !== "focus") || "focus" in options && typeof options.focus !== "boolean") throw new RepeatableFieldsetError("invalid-options", `${operation} options may contain only a boolean "focus" value.`, { root });
}
function validateDuplicateOptions(root, options) {
	const keys = typeof options === "object" && options !== null && !Array.isArray(options) ? Reflect.ownKeys(options) : [];
	if (typeof options !== "object" || options === null || Array.isArray(options) || keys.some((key) => key !== "focus" && key !== "copyState") || "focus" in options && typeof options.focus !== "boolean" || "copyState" in options && typeof options.copyState !== "function") throw new RepeatableFieldsetError("invalid-options", "Duplicate options may contain only a boolean \"focus\" value and a synchronous \"copyState\" function.", { root });
}
function validateRestoreOptions(root, options) {
	const keys = typeof options === "object" && options !== null && !Array.isArray(options) ? Reflect.ownKeys(options) : [];
	if (typeof options !== "object" || options === null || Array.isArray(options) || keys.some((key) => key !== "focus" && key !== "restoreState") || "focus" in options && typeof options.focus !== "boolean" || "restoreState" in options && typeof options.restoreState !== "function") throw new RepeatableFieldsetError("invalid-options", "Restore options may contain only a boolean \"focus\" value and a synchronous \"restoreState\" function.", { root });
}
function isPromiseLike(value) {
	if ((typeof value !== "object" || value === null) && typeof value !== "function") return false;
	return typeof value.then === "function";
}
function isHTMLFieldSetElement(value) {
	if (typeof value !== "object" || value === null) return false;
	const candidate = value;
	return candidate.nodeType === 1 && candidate.namespaceURI === HTML_NAMESPACE && candidate.localName === "fieldset";
}
function resolveItemTarget(registry, target) {
	if (typeof target === "string") return registry.getByKey(target);
	if (isHTMLFieldSetElement(target)) return registry.getByElement(target);
	if (typeof target !== "object" || target === null) return null;
	const candidate = target;
	if (!isHTMLFieldSetElement(candidate.element) || typeof candidate.key !== "string") return null;
	const item = registry.getByElement(candidate.element);
	return item !== null && item.key === candidate.key ? item : null;
}
function validateMoveDirection(root, direction) {
	if (direction !== "up" && direction !== "down") throw new RepeatableFieldsetError("invalid-options", "Move direction must be either \"up\" or \"down\".", { root });
}
function mapAddFailureReason(error) {
	if (error instanceof RepeatableFieldsetError) {
		if (error.code === "invalid-key") return "invalid-key";
		if (error.code === "duplicate-key") return "duplicate-key";
	}
	return "invalid-template";
}
/**
* Discovery-initialized component with one-item Add/Remove/Duplicate/Move support.
*
* Structural focus and polite status UI are integrated. Lifecycle events,
* addons, and their teardown hooks are added by dependency-ordered tasks.
*/
var A11yRepeatableFieldset = class A11yRepeatableFieldset {
	static activeInstances = /* @__PURE__ */ new WeakMap();
	state = "initializing";
	root = null;
	markup = null;
	itemRegistry = null;
	itemSnapshots = null;
	constraintController = null;
	statusController = null;
	addonManager = null;
	rootClickListenerInstalled = false;
	disconnectedStatePhaseActive = false;
	handleRootClick = (event) => {
		const root = this.root;
		const markup = this.markup;
		if (this.state !== "active" || this.disconnectedStatePhaseActive || root === null || markup === null) return;
		const target = event.target;
		if (target === null || target.nodeType !== 1 || typeof target.closest !== "function") return;
		const addControl = target.closest(SELECTORS.add);
		if (addControl === markup.addButton && addControl.closest(SELECTORS.root) === root) {
			this.performAdd("control", markup.addButton, markup.options.focusOnAdd);
			return;
		}
		const removeControl = target.closest(SELECTORS.remove);
		const itemElement = removeControl?.closest(SELECTORS.item);
		const registry = this.itemRegistry;
		if (removeControl === null || itemElement === null || itemElement === void 0 || removeControl.closest(SELECTORS.root) !== root || itemElement.closest(SELECTORS.root) !== root || !isHTMLFieldSetElement(itemElement) || registry === null) return;
		const item = registry.getByElement(itemElement);
		if (item === null || item.removeButton !== removeControl) return;
		const index = registry.items.indexOf(item);
		if (index === -1) return;
		let approvedResult = null;
		const request = Object.freeze({
			instance: this,
			root,
			item: Object.freeze({
				element: item.element,
				key: item.key,
				index,
				position: index + 1
			}),
			trigger: item.removeButton,
			remove: () => {
				approvedResult ??= this.performRemove("control", item, item.removeButton, true);
				return approvedResult;
			}
		});
		if (this.addonManager?.routeRemoveRequest(request) === true) return;
		request.remove();
	};
	constructor(root, options = {}) {
		const existing = A11yRepeatableFieldset.activeInstances.get(root);
		if (existing !== void 0) return existing;
		const markup = discoverRepeatableFieldsetMarkup(root, options);
		const registration = registerExistingRepeatableFieldsetItems(markup);
		const constraintController = new RepeatableFieldsetConstraintController(markup.root, markup.options);
		let positionSynchronization = null;
		let controlSynchronization = null;
		let statusController = null;
		const addonManager = new RepeatableFieldsetAddonManager();
		try {
			positionSynchronization = synchronizeRepeatableFieldsetPositions(markup.root, registration.registry.items);
			controlSynchronization = constraintController.synchronize(markup.addButton, registration.registry.items);
			statusController = createRepeatableFieldsetStatusController(markup.root, markup.statusRegion, markup.options.announceChanges);
			this.root = markup.root;
			this.markup = markup;
			this.itemRegistry = registration.registry;
			this.itemSnapshots = positionSynchronization.snapshots;
			this.constraintController = constraintController;
			this.statusController = statusController;
			addonManager.setup(markup.options.addons ?? Object.freeze([]), this, markup.root);
			for (const item of this.itemSnapshots) addonManager.setupItem(this, markup.root, item, "existing");
			this.addonManager = addonManager;
			markup.root.addEventListener("click", this.handleRootClick);
			this.rootClickListenerInstalled = true;
			A11yRepeatableFieldset.activeInstances.set(markup.root, this);
			this.state = "active";
			dispatchRepeatableFieldsetEvent(markup.root, EVENTS.init, Object.freeze({
				instance: this,
				root: markup.root,
				count: this.itemSnapshots.length,
				minimum: markup.options.minimum,
				maximum: markup.options.maximum,
				items: this.getItems()
			}));
		} catch (error) {
			this.state = "failed";
			if (this.rootClickListenerInstalled) {
				markup.root.removeEventListener("click", this.handleRootClick);
				this.rootClickListenerInstalled = false;
			}
			this.root = null;
			this.markup = null;
			this.itemRegistry = null;
			this.itemSnapshots = null;
			this.constraintController = null;
			this.statusController = null;
			this.addonManager = null;
			const addonSetupFailure = addonManager.destroy();
			statusController?.destroy();
			controlSynchronization?.rollback();
			positionSynchronization?.rollback();
			registration.rollback();
			if (A11yRepeatableFieldset.activeInstances.get(markup.root) === this) A11yRepeatableFieldset.activeInstances.delete(markup.root);
			if (error instanceof RepeatableFieldsetError) throw error;
			throw new RepeatableFieldsetError("invalid-options", "An addon setup hook failed during initialization.", {
				root: markup.root,
				cause: error instanceof RepeatableFieldsetAddonSetupError ? error.addonCause : addonSetupFailure ?? error
			});
		}
	}
	init() {
		return this;
	}
	add(options = {}) {
		if (this.state !== "active" || this.root === null) return INACTIVE_ADD_RESULT;
		this.assertNoDisconnectedStateReentry();
		validateOperationOptions(this.root, "Add", options);
		return this.performAdd("api", null, options.focus ?? false);
	}
	remove(target, options = {}) {
		if (this.state !== "active" || this.root === null) return INACTIVE_REMOVE_RESULT;
		this.assertNoDisconnectedStateReentry();
		validateOperationOptions(this.root, "Remove", options);
		return this.performRemove("api", target, null, options.focus ?? false);
	}
	duplicate(target, options = {}) {
		if (this.state !== "active" || this.root === null) return INACTIVE_DUPLICATE_RESULT;
		this.assertNoDisconnectedStateReentry();
		validateDuplicateOptions(this.root, options);
		return this.performDuplicate(target, options.focus ?? false, options.copyState);
	}
	move(target, direction) {
		if (this.state !== "active" || this.root === null) return INACTIVE_MOVE_RESULT;
		this.assertNoDisconnectedStateReentry();
		validateMoveDirection(this.root, direction);
		return this.performMove(target, direction);
	}
	getItems() {
		if (this.state !== "active" || this.itemSnapshots === null) return Object.freeze([]);
		return Object.freeze(this.itemSnapshots.map((item) => Object.freeze({
			element: item.element,
			key: item.key,
			index: item.index,
			position: item.position
		})));
	}
	getCount() {
		return this.state === "active" && this.itemSnapshots !== null ? this.itemSnapshots.length : 0;
	}
	canAdd() {
		return this.getCapability("canAdd");
	}
	canRemove() {
		return this.getCapability("canRemove");
	}
	destroy() {
		if (this.state !== "active" || this.root === null) return;
		const root = this.root;
		const markup = this.markup;
		const registry = this.itemRegistry;
		const constraintController = this.constraintController;
		const statusController = this.statusController;
		const addonManager = this.addonManager;
		const destroyedCount = registry?.items.length ?? 0;
		this.state = "destroyed";
		const addonCleanupFailure = addonManager?.destroy() ?? null;
		if (this.rootClickListenerInstalled) try {
			root.removeEventListener("click", this.handleRootClick);
		} catch {} finally {
			this.rootClickListenerInstalled = false;
		}
		statusController?.destroy();
		if (markup !== null && registry !== null && constraintController !== null) try {
			constraintController.restoreAuthorStates(markup.addButton, registry.items);
		} catch {}
		if (A11yRepeatableFieldset.activeInstances.get(root) === this) A11yRepeatableFieldset.activeInstances.delete(root);
		this.root = null;
		this.markup = null;
		this.itemRegistry = null;
		this.itemSnapshots = null;
		this.constraintController = null;
		this.statusController = null;
		this.addonManager = null;
		dispatchRepeatableFieldsetEvent(root, EVENTS.destroy, Object.freeze({
			instance: this,
			root,
			count: destroyedCount
		}));
		if (addonCleanupFailure !== null) throw new RepeatableFieldsetError("invalid-options", "An addon cleanup hook failed during destroy.", {
			root,
			cause: addonCleanupFailure
		});
	}
	performAdd(source, trigger, focusRequested) {
		const root = this.root;
		const markup = this.markup;
		const registry = this.itemRegistry;
		const constraintController = this.constraintController;
		const statusController = this.statusController;
		const addonManager = this.addonManager;
		if (this.state !== "active" || root === null || markup === null || registry === null || constraintController === null || statusController === null || addonManager === null) return INACTIVE_ADD_RESULT;
		const items = registry.items;
		if (!constraintController.getState(items.length).canAdd) {
			if (source === "api" && markup.options.maximum !== null) statusController.write(formatMaximumStatusMessage(markup.options.messageFormatters, {
				itemLabel: markup.options.itemLabel,
				key: null,
				position: null,
				count: items.length,
				minimum: markup.options.minimum,
				maximum: markup.options.maximum
			}));
			return MAXIMUM_ADD_RESULT;
		}
		let candidate = null;
		let addedRegistration = null;
		let positionSynchronization = null;
		let controlSynchronization = null;
		const previousItemSnapshots = this.itemSnapshots;
		try {
			candidate = cloneRepeatableFieldsetTemplate(root, markup.template);
			const key = registry.allocateKey("add", candidate);
			const materialized = materializeClonedRepeatableFieldsetTemplate(root, candidate, key);
			materialized.focusTarget?.removeAttribute(ATTRIBUTES.focus);
			markup.itemsContainer.append(materialized.item);
			addedRegistration = registry.registerAddedItem({
				element: materialized.item,
				legend: materialized.legend,
				removeButton: materialized.removeButton,
				key: materialized.key
			});
			addonManager.setupItem(this, root, Object.freeze({
				element: materialized.item,
				key: materialized.key,
				index: registry.items.length - 1,
				position: registry.items.length
			}), "added");
			positionSynchronization = synchronizeRepeatableFieldsetPositions(root, registry.items);
			controlSynchronization = constraintController.synchronize(markup.addButton, registry.items);
			const item = positionSynchronization.snapshots[positionSynchronization.snapshots.length - 1];
			if (item === void 0 || item.element !== materialized.item) throw new RepeatableFieldsetError("invalid-template", "The added item could not be represented in collection order.", {
				root,
				element: materialized.item
			});
			this.itemSnapshots = positionSynchronization.snapshots;
			focusRequested && focusAddedRepeatableFieldsetItem(root, materialized.item, materialized.focusTarget);
			statusController.write(formatAddedStatusMessage(markup.options.messageFormatters, {
				itemLabel: markup.options.itemLabel,
				key: item.key,
				position: item.position,
				count: positionSynchronization.snapshots.length,
				minimum: markup.options.minimum,
				maximum: markup.options.maximum
			}));
			dispatchRepeatableFieldsetEvent(root, EVENTS.itemAdded, Object.freeze({
				instance: this,
				root,
				item: Object.freeze({
					element: item.element,
					key: item.key,
					index: item.index,
					position: item.position
				}),
				key: item.key,
				index: item.index,
				position: item.position,
				count: positionSynchronization.snapshots.length,
				trigger,
				source
			}));
			return Object.freeze({
				ok: true,
				item
			});
		} catch (error) {
			const addonCleanupFailure = candidate === null ? null : addonManager.cleanupItem(candidate);
			if (candidate !== null) addonManager.releaseItem(candidate);
			this.itemSnapshots = previousItemSnapshots;
			controlSynchronization?.rollback();
			positionSynchronization?.rollback();
			addedRegistration?.rollback();
			if (candidate !== null && candidate.parentElement === markup.itemsContainer) candidate.remove();
			const failureReason = error instanceof RepeatableFieldsetAddonSetupError || addonCleanupFailure !== null ? "addon-error" : mapAddFailureReason(error);
			return Object.freeze({
				ok: false,
				reason: failureReason,
				error: addonCleanupFailure ?? error
			});
		}
	}
	performDuplicate(target, focusRequested, copyState) {
		const root = this.root;
		const markup = this.markup;
		const registry = this.itemRegistry;
		const constraintController = this.constraintController;
		const statusController = this.statusController;
		const addonManager = this.addonManager;
		if (this.state !== "active" || root === null || markup === null || registry === null || constraintController === null || statusController === null || addonManager === null) return INACTIVE_DUPLICATE_RESULT;
		const source = resolveItemTarget(registry, target);
		if (source === null) return UNOWNED_DUPLICATE_RESULT;
		const items = registry.items;
		const sourceIndex = items.indexOf(source);
		if (sourceIndex === -1) return UNOWNED_DUPLICATE_RESULT;
		if (!constraintController.getState(items.length).canAdd) {
			if (markup.options.maximum !== null) statusController.write(formatMaximumStatusMessage(markup.options.messageFormatters, {
				itemLabel: markup.options.itemLabel,
				key: source.key,
				position: sourceIndex + 1,
				count: items.length,
				minimum: markup.options.minimum,
				maximum: markup.options.maximum
			}));
			return MAXIMUM_DUPLICATE_RESULT;
		}
		const sourceSnapshot = Object.freeze({
			element: source.element,
			key: source.key,
			index: sourceIndex,
			position: sourceIndex + 1
		});
		const insertionIndex = sourceIndex + 1;
		let candidate = null;
		let addedRegistration = null;
		let positionSynchronization = null;
		let controlSynchronization = null;
		const previousItemSnapshots = this.itemSnapshots;
		let copyFailed = false;
		let copyError;
		try {
			candidate = cloneRepeatableFieldsetTemplate(root, markup.template);
			const key = registry.allocateKey("duplicate", candidate);
			const materialized = materializeClonedRepeatableFieldsetTemplate(root, candidate, key);
			if (copyState !== void 0) {
				const structuralBaseline = materialized.item.cloneNode(true);
				try {
					this.disconnectedStatePhaseActive = true;
					let returnValue;
					try {
						returnValue = copyState(Object.freeze({
							sourceItem: sourceSnapshot,
							candidate: materialized.item
						}));
					} finally {
						this.disconnectedStatePhaseActive = false;
					}
					if (isPromiseLike(returnValue)) throw new TypeError("Duplicate copyState must complete synchronously.");
					if (!materialized.item.isEqualNode(structuralBaseline)) throw new TypeError("Duplicate copyState may change only current control state, not candidate structure, attributes, or defaults.");
				} catch (error) {
					copyFailed = true;
					copyError = error;
					throw error;
				}
			}
			materialized.focusTarget?.removeAttribute(ATTRIBUTES.focus);
			const nextItem = registry.items[insertionIndex] ?? null;
			markup.itemsContainer.insertBefore(materialized.item, nextItem?.element ?? null);
			addedRegistration = registry.registerAddedItem({
				element: materialized.item,
				legend: materialized.legend,
				removeButton: materialized.removeButton,
				key: materialized.key
			}, insertionIndex);
			addonManager.setupItem(this, root, Object.freeze({
				element: materialized.item,
				key: materialized.key,
				index: insertionIndex,
				position: insertionIndex + 1
			}), "added");
			positionSynchronization = synchronizeRepeatableFieldsetPositions(root, registry.items);
			controlSynchronization = constraintController.synchronize(markup.addButton, registry.items);
			const item = positionSynchronization.snapshots[insertionIndex];
			if (item === void 0 || item.element !== materialized.item || item.key !== materialized.key) throw new RepeatableFieldsetError("invalid-template", "The duplicated item could not be represented in collection order.", {
				root,
				element: materialized.item
			});
			this.itemSnapshots = positionSynchronization.snapshots;
			const focusTarget = focusRequested ? focusAddedRepeatableFieldsetItem(root, materialized.item, materialized.focusTarget) : null;
			statusController.write(formatDuplicatedStatusMessage(markup.options.messageFormatters, {
				itemLabel: markup.options.itemLabel,
				key: item.key,
				position: item.position,
				sourceKey: sourceSnapshot.key,
				sourcePosition: sourceSnapshot.position,
				count: positionSynchronization.snapshots.length,
				minimum: markup.options.minimum,
				maximum: markup.options.maximum
			}));
			dispatchRepeatableFieldsetEvent(root, EVENTS.itemDuplicated, Object.freeze({
				instance: this,
				root,
				item: Object.freeze({
					element: item.element,
					key: item.key,
					index: item.index,
					position: item.position
				}),
				key: item.key,
				index: item.index,
				position: item.position,
				sourceKey: sourceSnapshot.key,
				sourceIndex: sourceSnapshot.index,
				sourcePosition: sourceSnapshot.position,
				count: positionSynchronization.snapshots.length,
				focusTarget
			}));
			return Object.freeze({
				ok: true,
				item,
				sourceItem: sourceSnapshot
			});
		} catch (error) {
			const addonCleanupFailure = candidate === null ? null : addonManager.cleanupItem(candidate);
			if (candidate !== null) addonManager.releaseItem(candidate);
			this.disconnectedStatePhaseActive = false;
			this.itemSnapshots = previousItemSnapshots;
			controlSynchronization?.rollback();
			positionSynchronization?.rollback();
			addedRegistration?.rollback();
			if (candidate !== null && candidate.parentElement === markup.itemsContainer) candidate.remove();
			let failureReason;
			if (copyFailed) failureReason = "copy-error";
			else if (error instanceof RepeatableFieldsetAddonSetupError || addonCleanupFailure !== null) failureReason = "addon-error";
			else failureReason = mapAddFailureReason(error);
			return Object.freeze({
				ok: false,
				reason: failureReason,
				error: copyFailed ? copyError : addonCleanupFailure ?? error
			});
		}
	}
	performRemove(source, target, trigger, focusRequested) {
		const root = this.root;
		const markup = this.markup;
		const registry = this.itemRegistry;
		const constraintController = this.constraintController;
		const statusController = this.statusController;
		const addonManager = this.addonManager;
		if (this.state !== "active" || root === null || markup === null || registry === null || constraintController === null || statusController === null || addonManager === null) return INACTIVE_REMOVE_RESULT;
		const item = resolveItemTarget(registry, target);
		if (item === null) return UNOWNED_REMOVE_RESULT;
		const items = registry.items;
		const index = items.indexOf(item);
		if (index === -1) return UNOWNED_REMOVE_RESULT;
		if (!constraintController.getState(items.length).canRemove) {
			if (source === "api") statusController.write(formatMinimumStatusMessage(markup.options.messageFormatters, {
				itemLabel: markup.options.itemLabel,
				key: item.key,
				position: index + 1,
				count: items.length,
				minimum: markup.options.minimum,
				maximum: markup.options.maximum
			}));
			return MINIMUM_REMOVE_RESULT;
		}
		const removedSnapshot = Object.freeze({
			element: item.element,
			key: item.key,
			index,
			position: index + 1
		});
		const resultingConstraintState = constraintController.getState(items.length - 1);
		const focusPlan = planRemovedRepeatableFieldsetItemFocus(root, item.element, items[index + 1]?.removeButton ?? null, items[index - 1]?.removeButton ?? null, markup.addButton, resultingConstraintState.canRemove, root.ownerDocument.activeElement, focusRequested);
		const nextSibling = item.element.nextSibling;
		const previousItemSnapshots = this.itemSnapshots;
		const restorationRecord = {
			key: item.key,
			previousIndex: index,
			previousPosition: index + 1,
			previousKey: items[index - 1]?.key ?? null,
			nextKey: items[index + 1]?.key ?? null,
			state: "pending"
		};
		const restoration = Object.freeze({ restore: (options = {}) => {
			if (this.root !== null) validateRestoreOptions(this.root, options);
			this.assertNoDisconnectedStateReentry();
			return this.performRestore(restorationRecord, options.focus ?? false, options.restoreState);
		} });
		let removedRegistration = null;
		let positionSynchronization = null;
		let controlSynchronization = null;
		let preparation;
		try {
			preparation = addonManager.prepareItemRemoval(Object.freeze({
				instance: this,
				root,
				item: removedSnapshot,
				restoration
			}));
		} catch (error) {
			restorationRecord.state = "invalid";
			return Object.freeze({
				ok: false,
				reason: "addon-error",
				error
			});
		}
		const addonCleanupFailure = addonManager.cleanupItem(item.element);
		if (addonCleanupFailure !== null) {
			restorationRecord.state = "invalid";
			try {
				preparation.rollback();
			} catch {}
			return Object.freeze({
				ok: false,
				reason: "addon-error",
				error: addonCleanupFailure
			});
		}
		try {
			item.element.remove();
			if (item.element.parentNode !== null) throw new RepeatableFieldsetError("invalid-item", "The owned item could not be detached.", {
				root,
				element: item.element
			});
			removedRegistration = registry.unregisterItem(item);
			positionSynchronization = synchronizeRepeatableFieldsetPositions(root, registry.items);
			controlSynchronization = constraintController.synchronize(markup.addButton, registry.items);
			this.itemSnapshots = positionSynchronization.snapshots;
			const focusTarget = focusAfterRepeatableFieldsetItemRemoval(root, focusPlan);
			preparation.commit();
			restorationRecord.state = "ready";
			statusController.write(formatRemovedStatusMessage(markup.options.messageFormatters, {
				itemLabel: markup.options.itemLabel,
				key: removedSnapshot.key,
				position: removedSnapshot.position,
				count: positionSynchronization.snapshots.length,
				minimum: markup.options.minimum,
				maximum: markup.options.maximum
			}));
			dispatchRepeatableFieldsetEvent(root, EVENTS.itemRemoved, Object.freeze({
				instance: this,
				root,
				item: removedSnapshot,
				key: removedSnapshot.key,
				previousIndex: removedSnapshot.index,
				previousPosition: removedSnapshot.position,
				count: positionSynchronization.snapshots.length,
				focusTarget,
				trigger,
				source
			}));
			addonManager.releaseItem(item.element);
			return Object.freeze({
				ok: true,
				item: removedSnapshot
			});
		} catch (error) {
			restorationRecord.state = "invalid";
			try {
				preparation.rollback();
			} catch {}
			this.itemSnapshots = previousItemSnapshots;
			controlSynchronization?.rollback();
			positionSynchronization?.rollback();
			if (item.element.parentNode !== markup.itemsContainer) {
				const originalNextSibling = nextSibling?.parentNode === markup.itemsContainer ? nextSibling : markup.itemsContainer.children.item(index);
				markup.itemsContainer.insertBefore(item.element, originalNextSibling);
			}
			removedRegistration?.rollback();
			try {
				addonManager.restoreItem(this, root, removedSnapshot);
			} catch {}
			restoreFocusAfterFailedRepeatableFieldsetItemRemoval(root, item.element, focusPlan);
			return Object.freeze({
				ok: false,
				reason: "addon-error",
				error
			});
		}
	}
	performRestore(record, focusRequested, restoreState) {
		const root = this.root;
		const markup = this.markup;
		const registry = this.itemRegistry;
		const constraintController = this.constraintController;
		const statusController = this.statusController;
		const addonManager = this.addonManager;
		if (this.state !== "active" || root === null || markup === null || registry === null || constraintController === null || statusController === null || addonManager === null) return Object.freeze({
			ok: false,
			reason: "inactive"
		});
		if (record.state === "consumed") return Object.freeze({
			ok: false,
			reason: "consumed"
		});
		if (record.state !== "ready") return Object.freeze({
			ok: false,
			reason: "not-ready"
		});
		if (registry.getByKey(record.key) !== null) return Object.freeze({
			ok: false,
			reason: "conflict"
		});
		if (!constraintController.getState(registry.items.length).canAdd) {
			if (markup.options.maximum !== null) statusController.write(formatMaximumStatusMessage(markup.options.messageFormatters, {
				itemLabel: markup.options.itemLabel,
				key: record.key,
				position: record.previousPosition,
				count: registry.items.length,
				minimum: markup.options.minimum,
				maximum: markup.options.maximum
			}));
			return Object.freeze({
				ok: false,
				reason: "maximum"
			});
		}
		record.state = "restoring";
		let candidate = null;
		let addedRegistration = null;
		let positionSynchronization = null;
		let controlSynchronization = null;
		const previousItemSnapshots = this.itemSnapshots;
		let restoreFailed = false;
		let restoreError;
		try {
			candidate = cloneRepeatableFieldsetTemplate(root, markup.template);
			const materialized = materializeClonedRepeatableFieldsetTemplate(root, candidate, record.key);
			if (restoreState !== void 0) {
				const structuralBaseline = materialized.item.cloneNode(true);
				try {
					this.disconnectedStatePhaseActive = true;
					let returnValue;
					try {
						returnValue = restoreState(Object.freeze({ candidate: materialized.item }));
					} finally {
						this.disconnectedStatePhaseActive = false;
					}
					if (isPromiseLike(returnValue)) throw new TypeError("Restore restoreState must complete synchronously.");
					if (!materialized.item.isEqualNode(structuralBaseline)) throw new TypeError("Restore restoreState may change only current control state, not candidate structure, attributes, defaults, validity, errors, or file inputs.");
				} catch (error) {
					restoreFailed = true;
					restoreError = error;
					throw error;
				}
			}
			materialized.focusTarget?.removeAttribute(ATTRIBUTES.focus);
			const nextItem = record.nextKey === null ? null : registry.getByKey(record.nextKey);
			const previousItem = record.previousKey === null ? null : registry.getByKey(record.previousKey);
			const insertionIndex = nextItem !== null ? registry.items.indexOf(nextItem) : previousItem !== null ? registry.items.indexOf(previousItem) + 1 : Math.min(record.previousIndex, registry.items.length);
			const reference = registry.items[insertionIndex] ?? null;
			markup.itemsContainer.insertBefore(materialized.item, reference?.element ?? null);
			addedRegistration = registry.registerAddedItem({
				element: materialized.item,
				legend: materialized.legend,
				removeButton: materialized.removeButton,
				key: materialized.key
			}, insertionIndex);
			addonManager.setupItem(this, root, Object.freeze({
				element: materialized.item,
				key: materialized.key,
				index: insertionIndex,
				position: insertionIndex + 1
			}), "added");
			positionSynchronization = synchronizeRepeatableFieldsetPositions(root, registry.items);
			controlSynchronization = constraintController.synchronize(markup.addButton, registry.items);
			const item = positionSynchronization.snapshots[insertionIndex];
			if (item === void 0 || item.element !== materialized.item || item.key !== record.key) throw new RepeatableFieldsetError("invalid-template", "The restored item could not be represented in collection order.", {
				root,
				element: materialized.item
			});
			this.itemSnapshots = positionSynchronization.snapshots;
			const focusTarget = focusRequested ? focusAddedRepeatableFieldsetItem(root, materialized.item, materialized.focusTarget) : null;
			statusController.write(formatRestoredStatusMessage(markup.options.messageFormatters, {
				itemLabel: markup.options.itemLabel,
				key: item.key,
				position: item.position,
				count: positionSynchronization.snapshots.length,
				minimum: markup.options.minimum,
				maximum: markup.options.maximum
			}));
			dispatchRepeatableFieldsetEvent(root, EVENTS.itemRestored, Object.freeze({
				instance: this,
				root,
				item: Object.freeze({
					element: item.element,
					key: item.key,
					index: item.index,
					position: item.position
				}),
				key: item.key,
				previousIndex: record.previousIndex,
				previousPosition: record.previousPosition,
				index: item.index,
				position: item.position,
				count: positionSynchronization.snapshots.length,
				focusTarget
			}));
			record.state = "consumed";
			return Object.freeze({
				ok: true,
				item,
				previousIndex: record.previousIndex,
				previousPosition: record.previousPosition
			});
		} catch (error) {
			this.disconnectedStatePhaseActive = false;
			this.itemSnapshots = previousItemSnapshots;
			controlSynchronization?.rollback();
			positionSynchronization?.rollback();
			addedRegistration?.rollback();
			const addonCleanupFailure = candidate === null ? null : addonManager.cleanupItem(candidate);
			if (candidate !== null) {
				addonManager.releaseItem(candidate);
				if (candidate.parentElement === markup.itemsContainer) candidate.remove();
			}
			record.state = "ready";
			const reason = restoreFailed ? "restore-error" : error instanceof RepeatableFieldsetAddonSetupError || addonCleanupFailure !== null ? "addon-error" : "invalid-template";
			return Object.freeze({
				ok: false,
				reason,
				error: restoreFailed ? restoreError : addonCleanupFailure ?? error
			});
		}
	}
	performMove(target, direction) {
		const root = this.root;
		const markup = this.markup;
		const registry = this.itemRegistry;
		const statusController = this.statusController;
		if (this.state !== "active" || root === null || markup === null || registry === null || statusController === null) return INACTIVE_MOVE_RESULT;
		const item = resolveItemTarget(registry, target);
		if (item === null) return UNOWNED_MOVE_RESULT;
		const items = registry.items;
		const previousIndex = items.indexOf(item);
		if (previousIndex === -1) return UNOWNED_MOVE_RESULT;
		const previousSnapshot = Object.freeze({
			element: item.element,
			key: item.key,
			index: previousIndex,
			position: previousIndex + 1
		});
		const index = direction === "up" ? previousIndex - 1 : previousIndex + 1;
		if (index < 0 || index >= items.length) {
			const boundary = direction === "up" ? "start" : "end";
			statusController.write(formatMoveBoundaryStatusMessage(markup.options.messageFormatters, {
				itemLabel: markup.options.itemLabel,
				key: previousSnapshot.key,
				position: previousSnapshot.position,
				count: items.length,
				minimum: markup.options.minimum,
				maximum: markup.options.maximum,
				direction,
				boundary
			}));
			return Object.freeze({
				ok: false,
				reason: "boundary",
				boundary,
				item: previousSnapshot
			});
		}
		const focusPlan = planMovedRepeatableFieldsetItemFocus(root, item.element, root.ownerDocument.activeElement);
		const originalNextSibling = item.element.nextSibling;
		const previousItemSnapshots = this.itemSnapshots;
		let movedRegistration = null;
		let positionSynchronization = null;
		try {
			movedRegistration = registry.moveItem(item, index);
			const followingItem = registry.items[index + 1] ?? null;
			markup.itemsContainer.insertBefore(item.element, followingItem?.element ?? null);
			if (item.element.parentElement !== markup.itemsContainer) throw new RepeatableFieldsetError("invalid-item", "The moved item could not be placed in the owned items container.", {
				root,
				element: item.element
			});
			positionSynchronization = synchronizeRepeatableFieldsetPositions(root, registry.items);
			const movedSnapshot = positionSynchronization.snapshots[index];
			if (movedSnapshot === void 0 || movedSnapshot.element !== item.element || movedSnapshot.key !== item.key) throw new RepeatableFieldsetError("invalid-item", "The moved item could not be represented in collection order.", {
				root,
				element: item.element
			});
			this.itemSnapshots = positionSynchronization.snapshots;
			const focusTarget = focusAfterRepeatableFieldsetItemMove(root, item.element, focusPlan);
			statusController.write(formatMovedStatusMessage(markup.options.messageFormatters, {
				itemLabel: markup.options.itemLabel,
				key: movedSnapshot.key,
				position: movedSnapshot.position,
				previousPosition: previousSnapshot.position,
				count: positionSynchronization.snapshots.length,
				minimum: markup.options.minimum,
				maximum: markup.options.maximum,
				direction
			}));
			dispatchRepeatableFieldsetEvent(root, EVENTS.itemMoved, Object.freeze({
				instance: this,
				root,
				item: Object.freeze({
					element: movedSnapshot.element,
					key: movedSnapshot.key,
					index: movedSnapshot.index,
					position: movedSnapshot.position
				}),
				key: movedSnapshot.key,
				previousIndex: previousSnapshot.index,
				previousPosition: previousSnapshot.position,
				index: movedSnapshot.index,
				position: movedSnapshot.position,
				count: positionSynchronization.snapshots.length,
				direction,
				focusTarget
			}));
			return Object.freeze({
				ok: true,
				item: movedSnapshot,
				previousIndex: previousSnapshot.index,
				previousPosition: previousSnapshot.position,
				direction
			});
		} catch (error) {
			this.itemSnapshots = previousItemSnapshots;
			positionSynchronization?.rollback();
			try {
				const rollbackReference = originalNextSibling?.parentNode === markup.itemsContainer ? originalNextSibling : markup.itemsContainer.children.item(previousIndex);
				markup.itemsContainer.insertBefore(item.element, rollbackReference);
			} catch {}
			try {
				movedRegistration?.rollback();
			} catch {}
			focusAfterRepeatableFieldsetItemMove(root, item.element, focusPlan);
			return Object.freeze({
				ok: false,
				reason: "move-error",
				error
			});
		}
	}
	getCapability(capability) {
		if (this.state !== "active" || this.itemSnapshots === null || this.constraintController === null) return false;
		return this.constraintController.getState(this.itemSnapshots.length)[capability];
	}
	assertNoDisconnectedStateReentry() {
		if (!this.disconnectedStatePhaseActive || this.root === null) return;
		throw new RepeatableFieldsetError("invalid-options", "Structural commands cannot run from a disconnected state callback.", { root: this.root });
	}
};
function createRepeatableFieldset(root, options = {}) {
	return new A11yRepeatableFieldset(root, options);
}
function isParentNode(value) {
	if (typeof value !== "object" || value === null) return false;
	return typeof value.querySelectorAll === "function";
}
function asHTMLRoot(value) {
	const candidate = value;
	if (candidate.nodeType !== 1 || typeof candidate.matches !== "function") return null;
	if (!candidate.matches(SELECTORS.root)) return null;
	if (candidate.namespaceURI !== HTML_NAMESPACE) throw new RepeatableFieldsetError("invalid-root", "Every repeatable-fieldset root must be an HTML element.", { element: candidate });
	return candidate;
}
function collectRoots(scope) {
	const roots = [];
	const scopeRoot = asHTMLRoot(scope);
	if (scopeRoot !== null) roots.push(scopeRoot);
	for (const element of scope.querySelectorAll(SELECTORS.root)) {
		if (element.namespaceURI !== HTML_NAMESPACE) throw new RepeatableFieldsetError("invalid-root", "Every repeatable-fieldset root must be an HTML element.", { element });
		const root = element;
		const ancestorRoot = root.parentElement?.closest(SELECTORS.root);
		if (ancestorRoot !== null && ancestorRoot !== void 0) continue;
		roots.push(root);
	}
	return roots;
}
function initRepeatableFieldsetAll(scope, options = {}) {
	const resolvedScope = scope ?? (typeof document === "undefined" ? void 0 : document);
	if (resolvedScope === void 0 || !isParentNode(resolvedScope)) throw new RepeatableFieldsetError("invalid-root", "initRepeatableFieldsetAll requires a document or parent-node scope.");
	return Object.freeze(collectRoots(resolvedScope).map((root) => createRepeatableFieldset(root, options)));
}
//#endregion
export { A11yRepeatableFieldset, DEFAULT_MESSAGE_FORMATTERS, EVENTS, RepeatableFieldsetError, createRepeatableFieldset, initRepeatableFieldsetAll };

//# sourceMappingURL=index.js.map