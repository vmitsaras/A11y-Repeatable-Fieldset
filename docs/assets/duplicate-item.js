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
//#endregion
//#region src/constants.ts
const COMPONENT_NAME = "a11y-repeatable-fieldset";
Object.freeze(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/);
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
Object.freeze({
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
Object.freeze({
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
Object.freeze({
	minimum: 1,
	maximum: null,
	itemLabel: "Item",
	focusOnAdd: true,
	announceChanges: true,
	messageFormatters: DEFAULT_MESSAGE_FORMATTERS
});
Object.freeze({
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
Object.freeze({
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
//#endregion
//#region src/addons/duplicate-item.ts
const ADDON_ID = "a11y-repeatable-fieldset.duplicate-item";
const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const SLOT_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const ALLOWED_OPTION_KEYS = /* @__PURE__ */ new Set(["buttonLabel"]);
const SUPPORTED_VALUE_INPUT_TYPES = /* @__PURE__ */ new Set([
	"text",
	"search",
	"email",
	"tel",
	"url",
	"number",
	"range",
	"date",
	"month",
	"week",
	"time",
	"datetime-local",
	"color"
]);
const CREDENTIAL_AUTOCOMPLETE_TOKENS = /* @__PURE__ */ new Set([
	"username",
	"current-password",
	"new-password",
	"one-time-code",
	"webauthn"
]);
const DUPLICATE_ITEM_ATTRIBUTES = Object.freeze({
	controls: "data-a11y-repeatable-fieldset-duplicate-controls",
	button: "data-a11y-repeatable-fieldset-duplicate",
	copy: "data-a11y-repeatable-fieldset-duplicate-copy"
});
function invalidOptions(message) {
	return /* @__PURE__ */ new TypeError(`Duplicate Item: ${message}`);
}
function normalizeOptions(options) {
	if (typeof options !== "object" || options === null || Array.isArray(options)) throw invalidOptions("options must be an object.");
	const unknownKey = Reflect.ownKeys(options).find((key) => typeof key !== "string" || !ALLOWED_OPTION_KEYS.has(key));
	if (unknownKey !== void 0) throw invalidOptions(`unknown option \"${String(unknownKey)}\".`);
	if (options.buttonLabel !== void 0 && (typeof options.buttonLabel !== "string" || options.buttonLabel.trim() === "")) throw invalidOptions("buttonLabel must be a non-empty string.");
	return Object.freeze({ buttonLabel: options.buttonLabel?.trim() ?? "Duplicate item" });
}
function isHTMLElement(element) {
	return element.namespaceURI === HTML_NAMESPACE;
}
function isHiddenOrInert(element, boundary) {
	let current = element;
	while (current !== null) {
		if (current.hasAttribute("hidden") || current.hasAttribute("inert") || current.getAttribute("aria-hidden")?.trim().toLowerCase() === "true") return true;
		if (current === boundary) return false;
		current = current.parentElement;
	}
	return true;
}
function isInsideLiveOutput(element, boundary) {
	let current = element;
	while (current !== null && current !== boundary) {
		const role = current.getAttribute("role")?.trim().toLowerCase();
		const live = current.getAttribute("aria-live")?.trim().toLowerCase();
		if (role === "status" || role === "alert" || live !== void 0 && live !== "" && live !== "off") return true;
		current = current.parentElement;
	}
	return false;
}
function findControlsTarget(context) {
	const selector = `[${DUPLICATE_ITEM_ATTRIBUTES.controls}]`;
	const candidates = Array.from(context.item.element.querySelectorAll(selector)).filter((candidate) => candidate.closest("[data-a11y-repeatable-fieldset-item]") === context.item.element && candidate.closest("[data-a11y-repeatable-fieldset]") === context.root);
	if (candidates.length !== 1 || !isHTMLElement(candidates[0])) throw invalidOptions("every item must contain exactly one owned HTML duplicate-controls target.");
	const target = candidates[0];
	if (target.closest("legend") !== null || isHiddenOrInert(target, context.item.element) || isInsideLiveOutput(target, context.item.element) || target.childNodes.length !== 0) throw invalidOptions("the duplicate-controls target must be empty, exposed, outside the legend, and outside live output.");
	return target;
}
function autocompleteTokens(control) {
	return Object.freeze((control.getAttribute("autocomplete") ?? "").trim().toLowerCase().split(/[\t\n\f\r ]+/).filter(Boolean));
}
function hasSensitiveAutocomplete(control) {
	return autocompleteTokens(control).some((token) => CREDENTIAL_AUTOCOMPLETE_TOKENS.has(token) || token.startsWith("cc-") || token.startsWith("transaction-"));
}
function asCopyableControl(element, item) {
	if (!isHTMLElement(element)) throw invalidOptions("copy markers are supported only on native HTML input, select, and textarea controls.");
	if (element.localName !== "input" && element.localName !== "select" && element.localName !== "textarea") throw invalidOptions("custom form-associated controls and non-form elements cannot use a copy marker.");
	const control = element;
	if (isHiddenOrInert(control, item) || control.matches(":disabled") || control.hasAttribute("disabled")) throw invalidOptions("hidden, inert, aria-hidden, and disabled controls cannot be copied.");
	if ((control.localName === "input" || control.localName === "textarea") && control.hasAttribute("readonly")) throw invalidOptions("readonly controls cannot be copied.");
	if (hasSensitiveAutocomplete(control)) throw invalidOptions("credential, authentication-code, payment, and transaction autocomplete fields cannot be copied.");
	if (control.localName === "input") {
		const input = control;
		if (input.type === "password") throw invalidOptions("password controls cannot be copied.");
		if (input.type !== "checkbox" && input.type !== "radio" && !SUPPORTED_VALUE_INPUT_TYPES.has(input.type)) throw invalidOptions(`input type \"${input.type}\" cannot be copied.`);
	}
	return control;
}
function collectMarkedControls(item, root) {
	const selector = `[${DUPLICATE_ITEM_ATTRIBUTES.copy}]`;
	const controls = /* @__PURE__ */ new Map();
	const candidates = Array.from(item.querySelectorAll(selector)).filter((candidate) => candidate.closest("[data-a11y-repeatable-fieldset-item]") === item && (root === null || candidate.closest("[data-a11y-repeatable-fieldset]") === root));
	for (const candidate of candidates) {
		const rawSlot = candidate.getAttribute(DUPLICATE_ITEM_ATTRIBUTES.copy);
		const slot = rawSlot?.trim() ?? "";
		if (rawSlot !== slot || !SLOT_PATTERN.test(slot)) throw invalidOptions(`copy marker values must match ${SLOT_PATTERN.source}.`);
		if (controls.has(slot)) throw invalidOptions(`copy marker \"${slot}\" must be unique within one item.`);
		controls.set(slot, asCopyableControl(candidate, item));
	}
	return controls;
}
function controlKind(control) {
	if (control.localName === "input") return `input:${control.type}`;
	if (control.localName === "select") return control.multiple ? "select:multiple" : "select:single";
	return "textarea";
}
function isOptionDisabled(option) {
	const group = option.closest("optgroup");
	return option.disabled || group?.disabled === true;
}
function copySingleSelectState(source, candidate) {
	const selected = source.selectedOptions.item(0);
	if (selected === null || isOptionDisabled(selected)) return;
	const match = Array.from(candidate.options).find((option) => !isOptionDisabled(option) && option.value === selected.value);
	if (match !== void 0) match.selected = true;
}
function copyMultipleSelectState(source, candidate) {
	const remainingValues = /* @__PURE__ */ new Map();
	for (const option of source.options) {
		if (!option.selected || isOptionDisabled(option)) continue;
		remainingValues.set(option.value, (remainingValues.get(option.value) ?? 0) + 1);
	}
	for (const option of candidate.options) {
		if (isOptionDisabled(option)) continue;
		const remaining = remainingValues.get(option.value) ?? 0;
		option.selected = remaining > 0;
		if (remaining > 0) remainingValues.set(option.value, remaining - 1);
	}
}
function copyControlState(source, candidate) {
	const sourceKind = controlKind(source);
	if (sourceKind !== controlKind(candidate)) throw invalidOptions(`source and template controls for a copy marker must have the same kind; received ${sourceKind} and ${controlKind(candidate)}.`);
	if (source.localName === "input") {
		const sourceInput = source;
		const candidateInput = candidate;
		if (sourceInput.type === "checkbox" || sourceInput.type === "radio") {
			candidateInput.checked = sourceInput.checked;
			candidateInput.indeterminate = false;
			return;
		}
		candidateInput.value = sourceInput.value;
		return;
	}
	if (source.localName === "textarea") {
		candidate.value = source.value;
		return;
	}
	const sourceSelect = source;
	const candidateSelect = candidate;
	if (sourceSelect.multiple) {
		copyMultipleSelectState(sourceSelect, candidateSelect);
		return;
	}
	copySingleSelectState(sourceSelect, candidateSelect);
}
function copyMarkedState(context) {
	const sourceRoot = context.sourceItem.element.closest("[data-a11y-repeatable-fieldset]");
	const sourceControls = collectMarkedControls(context.sourceItem.element, sourceRoot);
	const candidateControls = collectMarkedControls(context.candidate, null);
	for (const [slot, source] of sourceControls) {
		const candidate = candidateControls.get(slot);
		if (candidate === void 0) throw invalidOptions(`the trusted template is missing copy marker \"${slot}\".`);
		copyControlState(source, candidate);
	}
}
/**
* Adds one native Duplicate button per item. Core owns template
* materialization, insertion, registry state, focus, status, rollback, and
* lifecycle dispatch; this addon supplies only the explicit control copier.
*/
function createDuplicateItem(options = {}) {
	const normalized = normalizeOptions(options);
	const buttons = /* @__PURE__ */ new Map();
	const synchronizeButtons = (canDuplicate) => {
		for (const button of buttons.values()) {
			button.disabled = !canDuplicate;
			button.removeAttribute("aria-disabled");
		}
	};
	return Object.freeze({
		id: ADDON_ID,
		setup(context) {
			const synchronize = () => {
				synchronizeButtons(context.instance.canAdd());
			};
			context.on(EVENTS.init, synchronize);
			context.on(EVENTS.itemAdded, synchronize);
			context.on(EVENTS.itemDuplicated, synchronize);
			context.on(EVENTS.itemRemoved, synchronize);
			return () => {
				buttons.clear();
			};
		},
		setupItem(context) {
			const target = findControlsTarget(context);
			collectMarkedControls(context.item.element, context.root);
			const button = context.root.ownerDocument.createElement("button");
			button.type = "button";
			button.setAttribute(DUPLICATE_ITEM_ATTRIBUTES.button, "");
			button.className = "a11y-repeatable-fieldset__duplicate";
			button.textContent = normalized.buttonLabel;
			button.disabled = !context.instance.canAdd();
			const duplicate = () => {
				context.instance.duplicate(context.item.element, {
					focus: true,
					copyState: copyMarkedState
				});
			};
			button.addEventListener("click", duplicate);
			try {
				target.append(button);
				buttons.set(context.item.element, button);
			} catch (error) {
				button.removeEventListener("click", duplicate);
				button.remove();
				throw error;
			}
			let active = true;
			return () => {
				if (!active) return;
				active = false;
				buttons.delete(context.item.element);
				button.removeEventListener("click", duplicate);
				button.remove();
			};
		}
	});
}
//#endregion
export { DUPLICATE_ITEM_ATTRIBUTES, createDuplicateItem };

//# sourceMappingURL=duplicate-item.js.map