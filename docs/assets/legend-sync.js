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
Object.freeze({
	init: `${COMPONENT_NAME}:init`,
	itemAdded: `${COMPONENT_NAME}:item-added`,
	itemDuplicated: `${COMPONENT_NAME}:item-duplicated`,
	itemRemoved: `${COMPONENT_NAME}:item-removed`,
	itemRestored: `${COMPONENT_NAME}:item-restored`,
	itemMoved: `${COMPONENT_NAME}:item-moved`,
	destroy: `${COMPONENT_NAME}:destroy`
});
//#endregion
//#region src/addons/legend-sync.ts
const ADDON_ID = "a11y-repeatable-fieldset.legend-sync";
const DEFAULT_SOURCE_SELECTOR = "[data-a11y-repeatable-fieldset-legend-source]";
const DEFAULT_TARGET_SELECTOR = "[data-a11y-repeatable-fieldset-legend-value]";
const ALLOWED_OPTION_KEYS = /* @__PURE__ */ new Set([
	"source",
	"target",
	"updateOn",
	"emptyText"
]);
const ALLOWED_INPUT_TYPES = /* @__PURE__ */ new Set([
	"email",
	"search",
	"tel",
	"text",
	"url"
]);
const SENSITIVE_AUTOCOMPLETE_TOKENS = /* @__PURE__ */ new Set([
	"current-password",
	"new-password",
	"one-time-code"
]);
function invalidOptions(message) {
	return /* @__PURE__ */ new TypeError(`Legend Sync: ${message}`);
}
function normalizeDisplayText(value) {
	return value.replace(/\s+/gu, " ").trim();
}
function normalizeSelector(value, name, fallback) {
	if (value === void 0) return fallback;
	if (typeof value !== "string" || value.trim() === "" || value !== value.trim()) throw invalidOptions(`${name} must be a trimmed, non-empty selector.`);
	return value;
}
function normalizeOptions(options) {
	if (options === void 0) return Object.freeze({
		source: DEFAULT_SOURCE_SELECTOR,
		target: DEFAULT_TARGET_SELECTOR,
		updateOn: "change",
		emptyText: ""
	});
	if (typeof options !== "object" || options === null || Array.isArray(options)) throw invalidOptions("options must be an object.");
	const unknownKey = Object.keys(options).find((key) => !ALLOWED_OPTION_KEYS.has(key));
	if (unknownKey !== void 0) throw invalidOptions(`unknown option \"${unknownKey}\".`);
	if (options.updateOn !== void 0 && options.updateOn !== "change") throw invalidOptions("updateOn must be \"change\".");
	if (options.emptyText !== void 0 && typeof options.emptyText !== "string") throw invalidOptions("emptyText must be a string.");
	const source = normalizeSelector(options.source, "source", DEFAULT_SOURCE_SELECTOR);
	const target = normalizeSelector(options.target, "target", DEFAULT_TARGET_SELECTOR);
	if (source === target) throw invalidOptions("source and target must use different selectors.");
	return Object.freeze({
		source,
		target,
		updateOn: "change",
		emptyText: normalizeDisplayText(options.emptyText ?? "")
	});
}
function getOwnedMatches(item, root, selector, label) {
	let matches;
	try {
		matches = Array.from(item.querySelectorAll(selector));
	} catch {
		throw invalidOptions(`${label} must be a valid selector.`);
	}
	return matches.filter((element) => element.closest(SELECTORS.root) === root && element.closest(SELECTORS.item) === item);
}
function getOnlyOwnedMatch(context, selector, label) {
	const matches = getOwnedMatches(context.item.element, context.root, selector, label);
	if (matches.length !== 1) throw invalidOptions(`item \"${context.item.key}\" must contain exactly one owned ${label}.`);
	const match = matches[0];
	if (match === void 0) throw invalidOptions(`item \"${context.item.key}\" must contain exactly one owned ${label}.`);
	return match;
}
function isStructurallyHidden(element, item) {
	let current = element;
	while (current !== null) {
		if (current.hidden || current.hasAttribute("inert") || current.getAttribute("aria-hidden") === "true") return true;
		if (current === item) return false;
		current = current.parentElement;
	}
	return false;
}
function hasLiveRegionSemantics(element, legend) {
	let current = element;
	while (current !== null) {
		const role = current.getAttribute("role");
		const live = current.getAttribute("aria-live");
		if (role === "status" || role === "alert" || live !== null && live !== "off") return true;
		if (current === legend) return false;
		current = current.parentElement;
	}
	return false;
}
function getDirectLegend(item, view) {
	const legend = Array.from(item.children).find((element) => element instanceof view.HTMLLegendElement);
	if (legend === void 0) throw invalidOptions("an owned item is missing its direct legend.");
	return legend;
}
function validateTarget(target, item, view) {
	const legend = getDirectLegend(item, view);
	if (!(target instanceof view.HTMLElement) || !legend.contains(target)) throw invalidOptions("target must be an HTML element inside the item's direct legend.");
	if (target.matches(SELECTORS.position) || target.closest(SELECTORS.position) !== null || target.querySelector(SELECTORS.position) !== null) throw invalidOptions("target must not replace a visible position marker.");
	if (target.children.length > 0) throw invalidOptions("target must be a dedicated text-only element.");
	if (isStructurallyHidden(target, item)) throw invalidOptions("target must remain exposed and visible.");
	if (hasLiveRegionSemantics(target, legend)) throw invalidOptions("target must not be inside a live region.");
	return target;
}
function hasSensitiveAutocompleteToken(source) {
	const autocomplete = source.getAttribute("autocomplete");
	if (autocomplete === null) return false;
	return autocomplete.toLowerCase().split(/\s+/u).filter(Boolean).some((token) => token.startsWith("cc-") || SENSITIVE_AUTOCOMPLETE_TOKENS.has(token));
}
function validateSource(source, item, legend, view) {
	const isInput = source instanceof view.HTMLInputElement;
	const isSelect = source instanceof view.HTMLSelectElement;
	const isTextArea = source instanceof view.HTMLTextAreaElement;
	if (!isInput && !isSelect && !isTextArea) throw invalidOptions("source must be a supported input, single-select, or textarea.");
	if (legend.contains(source)) throw invalidOptions("source must remain outside the item's legend.");
	if (isStructurallyHidden(source, item)) throw invalidOptions("source must not be hidden, inert, or aria-hidden.");
	if (isInput && !ALLOWED_INPUT_TYPES.has(source.type)) throw invalidOptions("source input type must be text, search, email, tel, or url.");
	if (isSelect && source.multiple) throw invalidOptions("source select must not allow multiple values.");
	if (hasSensitiveAutocompleteToken(source)) throw invalidOptions("source must not expose password, one-time-code, or payment autocomplete data.");
	return source;
}
function readSourceValue(source) {
	if (source instanceof source.ownerDocument.defaultView.HTMLSelectElement) {
		if (normalizeDisplayText(source.value) === "") return "";
		return normalizeDisplayText(source.selectedOptions.item(0)?.label ?? "");
	}
	return normalizeDisplayText(source.value);
}
function createLegendSuffix(value, emptyText) {
	const displayValue = value === "" ? emptyText : value;
	return displayValue === "" ? "" : ` — ${displayValue}`;
}
/**
* Creates an opt-in addon that appends one committed, deliberately selected
* control value to each item's generic legend and visible position.
*
* It creates no DOM, live region, lifecycle event, or import-time behavior.
* The parent instance owns listener cleanup and restores the author target
* text during removal, destroy, and transactional rollback.
*/
function createLegendSyncAddon(options) {
	const normalized = normalizeOptions(options);
	return Object.freeze({
		id: ADDON_ID,
		setupItem(context) {
			const view = context.root.ownerDocument.defaultView;
			if (view === null) throw invalidOptions("the owning document must have a window.");
			const item = context.item.element;
			const legend = getDirectLegend(item, view);
			const source = validateSource(getOnlyOwnedMatch(context, normalized.source, "source"), item, legend, view);
			const target = validateTarget(getOnlyOwnedMatch(context, normalized.target, "target"), item, view);
			const initialText = target.textContent ?? "";
			let active = true;
			const update = () => {
				target.textContent = createLegendSuffix(readSourceValue(source), normalized.emptyText);
			};
			source.addEventListener(normalized.updateOn, update);
			try {
				update();
			} catch (error) {
				source.removeEventListener(normalized.updateOn, update);
				try {
					target.textContent = initialText;
				} catch {}
				throw error;
			}
			return () => {
				if (!active) return;
				active = false;
				source.removeEventListener(normalized.updateOn, update);
				target.textContent = initialText;
			};
		}
	});
}
//#endregion
export { createLegendSyncAddon };

//# sourceMappingURL=legend-sync.js.map