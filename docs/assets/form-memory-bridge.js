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
const TEMPLATE_KEY_TOKEN = "__A11Y_REPEATABLE_KEY__";
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
//#region src/focus.ts
const HTML_NAMESPACE$2 = "http://www.w3.org/1999/xhtml";
function isHTMLElement$3(element) {
	return element.namespaceURI === HTML_NAMESPACE$2;
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
/**
* Tests semantic programmatic-focus eligibility without relying on layout
* measurements, which are unavailable in jsdom and unreliable for inert
* template content.
*/
function isPotentialFocusTarget(element, boundary) {
	if (!isHTMLElement$3(element) || isHiddenOrInertWithin(element, boundary)) return false;
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
//#endregion
//#region src/options.ts
function invalidOptions$1(root, message) {
	return new RepeatableFieldsetError("invalid-options", message, { root });
}
function hasJavaScriptValue(options, name) {
	return options[name] !== void 0;
}
function readDatasetValue(root, attribute) {
	return root.hasAttribute(attribute) ? root.getAttribute(attribute) ?? "" : void 0;
}
function parseJavaScriptInteger(root, name, value) {
	if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw invalidOptions$1(root, `The JavaScript option "${name}" must be a non-negative safe integer.`);
	return value;
}
function parseDatasetInteger(root, attribute, value) {
	const trimmed = value.trim();
	if (!/^\d+$/.test(trimmed)) throw invalidOptions$1(root, `The ${attribute} attribute must be a non-negative integer.`);
	const parsed = Number(trimmed);
	if (!Number.isSafeInteger(parsed)) throw invalidOptions$1(root, `The ${attribute} attribute must be a safe integer.`);
	return parsed;
}
function parseJavaScriptBoolean(root, name, value) {
	if (typeof value !== "boolean") throw invalidOptions$1(root, `The JavaScript option "${name}" must be a boolean.`);
	return value;
}
function parseDatasetBoolean(root, attribute, value) {
	const trimmed = value.trim();
	if (trimmed === "true") return true;
	if (trimmed === "false") return false;
	throw invalidOptions$1(root, `The ${attribute} attribute must be the string "true" or "false".`);
}
function parseItemLabel(root, source, value) {
	if (typeof value !== "string" || value.trim() === "") throw invalidOptions$1(root, `${source} must be a non-empty string.`);
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
	if (typeof options.keyFactory !== "function") throw invalidOptions$1(root, "The JavaScript option \"keyFactory\" must be a function.");
	return options.keyFactory;
}
function normalizeAddons(root, options) {
	const supplied = options.addons;
	if (supplied === void 0) return;
	if (!Array.isArray(supplied)) throw invalidOptions$1(root, "The JavaScript option \"addons\" must be an array.");
	const ids = /* @__PURE__ */ new Set();
	for (const candidate of supplied) {
		if (candidate === null || typeof candidate !== "object" || Array.isArray(candidate)) throw invalidOptions$1(root, "Every JavaScript addon must be an object.");
		const addon = candidate;
		if (typeof addon.id !== "string" || addon.id.trim() === "" || addon.id !== addon.id.trim()) throw invalidOptions$1(root, "Every JavaScript addon must have a trimmed, non-empty id.");
		if (addon.setup !== void 0 && typeof addon.setup !== "function") throw invalidOptions$1(root, `The addon "${addon.id}" setup hook must be a function.`);
		if (addon.setupItem !== void 0 && typeof addon.setupItem !== "function") throw invalidOptions$1(root, `The addon "${addon.id}" item setup hook must be a function.`);
		if (ids.has(addon.id)) throw invalidOptions$1(root, `The JavaScript option "addons" contains duplicate id "${addon.id}".`);
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
	if (typeof formatter !== "function") throw invalidOptions$1(root, `The JavaScript message formatter "${name}" must be a function.`);
	return formatter;
}
function normalizeMessageFormatters(root, options) {
	const supplied = options.messageFormatters;
	if (supplied === void 0) return DEFAULT_OPTIONS.messageFormatters;
	if (supplied === null || typeof supplied !== "object" || Array.isArray(supplied)) throw invalidOptions$1(root, "The JavaScript option \"messageFormatters\" must be an object.");
	if (Reflect.ownKeys(supplied).some((key) => typeof key !== "string" || !MESSAGE_FORMATTER_NAMES.includes(key))) throw invalidOptions$1(root, "The JavaScript option \"messageFormatters\" contains an unknown formatter.");
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
	if (options === null || typeof options !== "object" || Array.isArray(options)) throw invalidOptions$1(root, "JavaScript options must be an object.");
	const minimum = normalizeMinimum(root, options);
	const maximum = normalizeMaximum(root, options);
	if (maximum !== null && maximum < minimum) throw invalidOptions$1(root, "The normalized \"maximum\" option must be greater than or equal to \"minimum\".");
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
const HTML_NAMESPACE$1 = "http://www.w3.org/1999/xhtml";
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
function isHTMLElement$2(value) {
	if (typeof value !== "object" || value === null) return false;
	const candidate = value;
	return candidate.nodeType === 1 && candidate.namespaceURI === HTML_NAMESPACE$1 && typeof candidate.matches === "function" && typeof candidate.querySelectorAll === "function" && typeof candidate.hasAttribute === "function" && candidate.ownerDocument !== void 0;
}
function isHTMLFieldSetElement(element) {
	return element.namespaceURI === HTML_NAMESPACE$1 && element.localName === "fieldset";
}
function isHTMLLegendElement(element) {
	return element.namespaceURI === HTML_NAMESPACE$1 && element.localName === "legend";
}
function isHTMLButtonElement(element) {
	return element.namespaceURI === HTML_NAMESPACE$1 && element.localName === "button";
}
function isHTMLTemplateElement(element) {
	return element.namespaceURI === HTML_NAMESPACE$1 && element.localName === "template";
}
function validateRoot(value) {
	if (!isHTMLElement$2(value)) throw new RepeatableFieldsetError("invalid-root", "The repeatable-fieldset root must be an HTML element.");
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
	if (item === null || !isHTMLFieldSetElement(item) || !item.matches(ITEM_MARKER_SELECTOR)) throw markupError("invalid-template", root, "The template top-level element must be a marked item fieldset.", item ?? element);
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
	if (!isHTMLElement$2(match)) throw markupError("nonempty-status-region", root, "The author-provided status region must be an HTML element.", match);
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
	if (!isHTMLElement$2(itemsElement)) throw markupError("missing-items-container", root, "The owned items container must be an HTML element.", itemsElement);
	const templateElement = requireSingleOwnedElement(root, TEMPLATE_MARKER_SELECTOR, "missing-template", "multiple-templates", "template");
	const addElement = requireSingleOwnedElement(root, ADD_MARKER_SELECTOR, "missing-add-control", "multiple-add-controls", "Add control");
	if (itemsElement.contains(addElement)) throw markupError("invalid-item", root, "The owned Add control must be outside the items container.", addElement);
	const addButton = validateEnhancementButton(root, addElement, "missing-add-control", "Add control");
	const template = validateTemplate(root, templateElement, itemsElement);
	const markedItems = findOwnedElements(root, ITEM_MARKER_SELECTOR);
	for (const markedItem of markedItems) if (!isHTMLFieldSetElement(markedItem) || markedItem.parentElement !== itemsElement) throw markupError("invalid-item", root, "Every owned marked item must be a direct-child fieldset of the items container.", markedItem);
	const usedKeys = /* @__PURE__ */ new Set();
	const items = Object.freeze(Array.from(itemsElement.children).filter((element) => isHTMLFieldSetElement(element) && element.matches(ITEM_MARKER_SELECTOR) && element.closest(SELECTORS.root) === root).map((item) => validateExistingItem(root, item, usedKeys)));
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
//#region src/template.ts
const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const ASCII_WHITESPACE = /[\u0009\u000a\u000c\u000d\u0020]+/;
const LEADING_ASCII_WHITESPACE = /^[\u0009\u000a\u000c\u000d\u0020]+/;
const TRAILING_ASCII_WHITESPACE = /[\u0009\u000a\u000c\u000d\u0020]+$/;
function templateError(code, root, message, element) {
	return new RepeatableFieldsetError(code, message, element === void 0 ? { root } : {
		root,
		element
	});
}
function isHTMLElement$1(element) {
	return element.namespaceURI === HTML_NAMESPACE;
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
	if (item.namespaceURI !== HTML_NAMESPACE || item.localName !== "fieldset" || !item.matches(SELECTORS.item)) throw templateError("invalid-template", root, "The materialized template root must remain a marked fieldset.", item);
	const nestedItem = item.querySelector(SELECTORS.item);
	if (nestedItem !== null) throw templateError("invalid-template", root, "The materialized item must not contain a nested marked item.", nestedItem);
	const nestedRoot = item.querySelector(SELECTORS.root);
	if (nestedRoot !== null) throw templateError("invalid-template", root, "The materialized item must not contain a nested component root.", nestedRoot);
	const legends = Array.from(item.children).filter((element) => element.namespaceURI === HTML_NAMESPACE && element.localName === "legend");
	const legend = legends[0];
	if (legends.length !== 1 || legend === void 0 || (legend.textContent ?? "").trim() === "") throw templateError("invalid-template", root, "The materialized item must contain one meaningful direct legend.", legend ?? item);
	const removeCandidates = findScopedCandidates(item, SELECTORS.remove);
	const removeCandidate = removeCandidates[0];
	if (removeCandidates.length !== 1 || removeCandidate === void 0 || removeCandidate.namespaceURI !== HTML_NAMESPACE || removeCandidate.localName !== "button" || removeCandidate.getAttribute("type")?.trim().toLowerCase() !== "button" || !removeCandidate.hasAttribute("hidden") || (removeCandidate.textContent ?? "").trim() === "") throw templateError("invalid-template", root, "The materialized item must retain one hidden button-type Remove control.", removeCandidate ?? item);
	const removeButton = removeCandidate;
	const focusCandidates = findScopedCandidates(item, SELECTORS.focus);
	if (focusCandidates.length > 1) throw templateError("invalid-template", root, "The materialized item must not contain multiple focus markers.", focusCandidates[1]);
	const focusCandidate = focusCandidates[0];
	if (focusCandidate !== void 0 && (focusCandidate === item || !isHTMLElement$1(focusCandidate) || !isPotentialFocusTarget(focusCandidate, item))) throw templateError("invalid-template", root, "The materialized focus marker must remain on an enabled, non-hidden, programmatically focusable HTML descendant.", focusCandidate);
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
/**
* Convenience wrapper for callers that do not need the Add command's
* clone-before-allocation staging.
*/
function materializeRepeatableFieldsetTemplate(root, template, key) {
	return materializeClonedRepeatableFieldsetTemplate(root, cloneRepeatableFieldsetTemplate(root, template), key);
}
function materializeDiscoveredRepeatableFieldsetTemplate(markup, key) {
	return materializeRepeatableFieldsetTemplate(markup.root, markup.template, key);
}
//#endregion
//#region src/addons/form-memory-bridge.ts
const ADDON_ID = "a11y-repeatable-fieldset.form-memory-bridge";
const DRAFT_ADAPTER_ID = "a11y-repeatable-fieldset.form-memory-bridge.v1";
const SNAPSHOT_SCHEMA_VERSION = 1;
const ALLOWED_OPTION_KEYS = /* @__PURE__ */ new Set([
	"root",
	"fieldKey",
	"createInstance",
	"save",
	"onSaveError"
]);
function invalidOptions(message) {
	return /* @__PURE__ */ new TypeError(`Form Memory Bridge: ${message}`);
}
function isHTMLElement(value) {
	if (typeof value !== "object" || value === null) return false;
	const candidate = value;
	return candidate.nodeType === 1 && candidate.namespaceURI === "http://www.w3.org/1999/xhtml" && typeof candidate.matches === "function" && typeof candidate.querySelectorAll === "function";
}
function normalizeOptions(options) {
	if (typeof options !== "object" || options === null || Array.isArray(options)) throw invalidOptions("options must be an object.");
	const unknownKey = Object.keys(options).find((key) => !ALLOWED_OPTION_KEYS.has(key));
	if (unknownKey !== void 0) throw invalidOptions(`unknown option \"${unknownKey}\".`);
	if (!isHTMLElement(options.root)) throw invalidOptions("root must be an HTML element.");
	if (typeof options.fieldKey !== "string" || options.fieldKey.trim() === "" || options.fieldKey !== options.fieldKey.trim()) throw invalidOptions("fieldKey must be a trimmed, non-empty string.");
	if (typeof options.save !== "function") throw invalidOptions("save must be a function.");
	if (typeof options.createInstance !== "function") throw invalidOptions("createInstance must be a function.");
	if (options.onSaveError !== void 0 && typeof options.onSaveError !== "function") throw invalidOptions("onSaveError must be a function when supplied.");
	return Object.freeze({ ...options });
}
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function parseSnapshot(value) {
	if (!isRecord(value)) return null;
	const keys = Object.keys(value);
	if (keys.length !== 2 || !keys.includes("schemaVersion") || !keys.includes("itemKeys") || value["schemaVersion"] !== SNAPSHOT_SCHEMA_VERSION || !Array.isArray(value["itemKeys"])) return null;
	const itemKeys = value["itemKeys"];
	const uniqueKeys = /* @__PURE__ */ new Set();
	for (const key of itemKeys) {
		if (typeof key !== "string" || !ITEM_KEY_PATTERN.test(key) || uniqueKeys.has(key)) return null;
		uniqueKeys.add(key);
	}
	return Object.freeze({
		schemaVersion: SNAPSHOT_SCHEMA_VERSION,
		itemKeys: Object.freeze([...uniqueKeys])
	});
}
function snapshotSignature(snapshot) {
	return JSON.stringify(snapshot);
}
function extractSnapshot(record, fieldKey) {
	if (record === void 0) return Object.freeze({ status: "not-found" });
	if (typeof record !== "object" || record === null || !Array.isArray(record.fields)) return Object.freeze({ status: "invalid" });
	const matchingFields = record.fields.filter((field) => typeof field === "object" && field !== null && field.fieldKey === fieldKey);
	if (matchingFields.length === 0) return Object.freeze({ status: "not-found" });
	const field = matchingFields[0];
	if (matchingFields.length !== 1 || field === void 0 || field.kind !== "custom" || field.adapterId !== DRAFT_ADAPTER_ID) return Object.freeze({ status: "invalid" });
	const snapshot = parseSnapshot(field.value);
	return snapshot === null ? Object.freeze({ status: "invalid" }) : Object.freeze({
		status: "valid",
		snapshot
	});
}
function getKey(item, allowMissing) {
	if (!item.hasAttribute(ATTRIBUTES.key)) return allowMissing ? null : invalidItemKey(item);
	const key = (item.getAttribute(ATTRIBUTES.key) ?? "").trim();
	return ITEM_KEY_PATTERN.test(key) ? key : invalidItemKey(item);
}
function invalidItemKey(item) {
	throw new TypeError(`Form Memory Bridge: item key on ${item.localName} must match ${ITEM_KEY_PATTERN.source}.`);
}
function getCurrentOwnedItems(root) {
	return Object.freeze(Array.from(root.querySelectorAll(SELECTORS.item)).filter((item) => item.closest(SELECTORS.root) === root && item.parentElement?.matches(SELECTORS.items) === true && item.parentElement?.closest(SELECTORS.root) === root));
}
function readCurrentSnapshot(root) {
	const itemKeys = [];
	const usedKeys = /* @__PURE__ */ new Set();
	for (const item of getCurrentOwnedItems(root)) {
		const key = getKey(item, true);
		if (key === null) continue;
		if (usedKeys.has(key)) throw new TypeError(`Form Memory Bridge: item key \"${key}\" is duplicated.`);
		usedKeys.add(key);
		itemKeys.push(key);
	}
	return Object.freeze({
		schemaVersion: SNAPSHOT_SCHEMA_VERSION,
		itemKeys: Object.freeze(itemKeys)
	});
}
function createDesiredItemOrder(currentItems, restoredItems, snapshot) {
	const snapshotKeys = new Set(snapshot.itemKeys);
	const desired = snapshot.itemKeys.map((key) => {
		const item = restoredItems.get(key);
		if (item === void 0) throw new TypeError(`Form Memory Bridge: no fieldset was prepared for key \"${key}\".`);
		return item;
	});
	const preserved = currentItems.filter(({ key }) => key === null || !snapshotKeys.has(key)).map(({ element }) => element);
	return Object.freeze({
		items: Object.freeze([...desired, ...preserved]),
		preservedItemCount: preserved.length
	});
}
function validatePreparedItemIds(items) {
	const ids = /* @__PURE__ */ new Set();
	for (const item of items) {
		const elements = [item, ...item.querySelectorAll("[id]")];
		for (const element of elements) {
			const id = element.getAttribute("id");
			if (id === null || id === "") continue;
			if (ids.has(id)) throw new TypeError(`Form Memory Bridge: prepared items duplicate the id \"${id}\".`);
			ids.add(id);
		}
	}
}
function mergeItemsIntoAuthorChildren(originalChildren, currentItems, desiredItems) {
	if (currentItems.length === 0) return Object.freeze([...originalChildren, ...desiredItems]);
	const currentElements = new Set(currentItems.map(({ element }) => element));
	const lastCurrent = currentItems.at(-1)?.element;
	const finalChildren = [];
	let desiredIndex = 0;
	for (const child of originalChildren) {
		if (!currentElements.has(child)) {
			finalChildren.push(child);
			continue;
		}
		const desired = desiredItems[desiredIndex];
		if (desired !== void 0) {
			finalChildren.push(desired);
			desiredIndex += 1;
		}
		if (child === lastCurrent) {
			finalChildren.push(...desiredItems.slice(desiredIndex));
			desiredIndex = desiredItems.length;
		}
	}
	return Object.freeze(finalChildren);
}
function sameElementOrder(left, right) {
	return left.length === right.length && left.every((element, index) => element === right[index]);
}
function normalizeInitializeOptions(options) {
	if (options === void 0) return Object.freeze({});
	if (typeof options !== "object" || options === null || Array.isArray(options)) throw invalidOptions("initialize options must be an object.");
	const unknownKey = Object.keys(options).find((key) => key !== "record" && key !== "repeatableFieldsetOptions");
	if (unknownKey !== void 0) throw invalidOptions(`unknown initialize option \"${unknownKey}\".`);
	return options;
}
/**
* Creates a two-phase, opt-in integration for A11yFormDraftPersistence.
*
* The bridge persists stable keys and order only. Its explicit initialize()
* method restores that structure from the trusted template before the core
* discovers items; A11yFormDraftPersistence remains responsible for values,
* expiry, storage, user consent, sensitive-field exclusions, and clearing.
*/
function createFormMemoryBridge(suppliedOptions) {
	const options = normalizeOptions(suppliedOptions);
	const root = options.root;
	const fieldKey = options.fieldKey;
	let addonActive = false;
	let acceptedRestoreSignature = null;
	let saveQueued = false;
	let saveRunning = false;
	let saveGeneration = 0;
	const queue = (callback) => {
		const ownerWindow = root.ownerDocument.defaultView;
		if (ownerWindow !== null) ownerWindow.queueMicrotask(callback);
		else globalThis.queueMicrotask(callback);
	};
	const reportSaveError = (error) => {
		try {
			options.onSaveError?.(error);
		} catch {}
	};
	const flushSave = (generation) => {
		if (!addonActive || generation !== saveGeneration || saveRunning || !saveQueued) return;
		saveQueued = false;
		saveRunning = true;
		let result;
		try {
			result = options.save();
		} catch (error) {
			saveRunning = false;
			reportSaveError(error);
			if (saveQueued) queue(() => flushSave(generation));
			return;
		}
		Promise.resolve(result).then(() => {
			if (generation !== saveGeneration) return;
			saveRunning = false;
			if (saveQueued) queue(() => flushSave(generation));
		}, (error) => {
			if (generation !== saveGeneration) return;
			saveRunning = false;
			reportSaveError(error);
			if (saveQueued) queue(() => flushSave(generation));
		});
	};
	const requestSave = () => {
		if (!addonActive) return;
		acceptedRestoreSignature = snapshotSignature(readCurrentSnapshot(root));
		saveQueued = true;
		const generation = saveGeneration;
		queue(() => flushSave(generation));
	};
	const draftControlAdapter = Object.freeze({
		id: DRAFT_ADAPTER_ID,
		matches(element) {
			return element === root;
		},
		getFieldKey(element, _context) {
			return element === root ? fieldKey : null;
		},
		read(element, _context) {
			if (element !== root) throw new TypeError("Form Memory Bridge: the draft adapter received an unowned element.");
			return readCurrentSnapshot(root);
		},
		compare(current, saved, _context) {
			const currentSnapshot = parseSnapshot(current);
			const savedSnapshot = parseSnapshot(saved);
			return currentSnapshot !== null && savedSnapshot !== null && snapshotSignature(currentSnapshot) === snapshotSignature(savedSnapshot);
		},
		write(element, saved, _context) {
			const snapshot = parseSnapshot(saved);
			if (element !== root || !addonActive || snapshot === null || acceptedRestoreSignature !== snapshotSignature(snapshot)) throw new TypeError("Form Memory Bridge: restore structure was not prepared for this snapshot.");
		}
	});
	const addon = {
		id: ADDON_ID,
		draftControlAdapter,
		setup(context) {
			if (context.root !== root) throw invalidOptions("one bridge instance cannot be reused for a different root.");
			addonActive = true;
			saveGeneration += 1;
			const cleanups = [];
			try {
				cleanups.push(context.on(EVENTS.itemAdded, requestSave), context.on(EVENTS.itemDuplicated, requestSave), context.on(EVENTS.itemRemoved, requestSave), context.on(EVENTS.itemRestored, requestSave), context.on(EVENTS.itemMoved, requestSave));
			} catch (error) {
				addonActive = false;
				saveGeneration += 1;
				for (const cleanup of [...cleanups].reverse()) cleanup();
				throw error;
			}
			return () => {
				addonActive = false;
				acceptedRestoreSignature = null;
				saveQueued = false;
				saveRunning = false;
				saveGeneration += 1;
				for (const cleanup of [...cleanups].reverse()) cleanup();
			};
		},
		initialize(suppliedInitializeOptions) {
			if (addonActive) throw invalidOptions("the bridge root is already initialized.");
			const initializeOptions = normalizeInitializeOptions(suppliedInitializeOptions);
			const coreOptions = initializeOptions.repeatableFieldsetOptions ?? {};
			const extracted = extractSnapshot(initializeOptions.record, fieldKey);
			if (extracted.status === "invalid") return Object.freeze({
				ok: false,
				reason: "invalid-snapshot"
			});
			const markup = discoverRepeatableFieldsetMarkup(root, coreOptions);
			const originalChildren = Object.freeze(Array.from(markup.itemsContainer.children));
			let finalChildren = originalChildren;
			let addedKeys = Object.freeze([]);
			let preservedItemCount = markup.items.length;
			let reordered = false;
			if (extracted.status === "valid") {
				const existingByKey = /* @__PURE__ */ new Map();
				for (const item of markup.items) if (item.key !== null) existingByKey.set(item.key, item.element);
				const missingKeys = extracted.snapshot.itemKeys.filter((key) => !existingByKey.has(key));
				const requiredCount = markup.items.length + missingKeys.length;
				if (markup.options.maximum !== null && requiredCount > markup.options.maximum) return Object.freeze({
					ok: false,
					reason: "maximum-exceeded",
					maximum: markup.options.maximum,
					requiredCount
				});
				const restoredItems = new Map(existingByKey);
				const preparedItems = [];
				try {
					for (const key of missingKeys) {
						const materialized = materializeDiscoveredRepeatableFieldsetTemplate(markup, key);
						restoredItems.set(key, materialized.item);
						preparedItems.push(materialized.item);
					}
					validatePreparedItemIds(preparedItems);
					const desired = createDesiredItemOrder(markup.items, restoredItems, extracted.snapshot);
					finalChildren = mergeItemsIntoAuthorChildren(originalChildren, markup.items, desired.items);
					addedKeys = Object.freeze([...missingKeys]);
					preservedItemCount = desired.preservedItemCount;
					reordered = !sameElementOrder(originalChildren, finalChildren);
					acceptedRestoreSignature = snapshotSignature(extracted.snapshot);
				} catch (error) {
					acceptedRestoreSignature = null;
					return Object.freeze({
						ok: false,
						reason: "structure-error",
						error
					});
				}
			} else acceptedRestoreSignature = null;
			if (reordered) markup.itemsContainer.replaceChildren(...finalChildren);
			try {
				const instance = options.createInstance(root, {
					...coreOptions,
					addons: Object.freeze([...coreOptions.addons ?? [], addon])
				});
				if (!addonActive) throw invalidOptions("createInstance must initialize the supplied root with the supplied addon options.");
				return Object.freeze({
					ok: true,
					instance,
					structure: extracted.status === "valid" ? "restored" : "not-found",
					addedKeys,
					preservedItemCount,
					reordered
				});
			} catch (error) {
				acceptedRestoreSignature = null;
				if (reordered) markup.itemsContainer.replaceChildren(...originalChildren);
				throw error;
			}
		}
	};
	return Object.freeze(addon);
}
//#endregion
export { createFormMemoryBridge };

//# sourceMappingURL=form-memory-bridge.js.map