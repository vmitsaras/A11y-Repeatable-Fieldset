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
//#region src/addons/undo-remove.ts
const ADDON_ID = "a11y-repeatable-fieldset.undo-remove";
const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const SLOT_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const DEFAULT_EXPIRY_MS = 3e4;
const MINIMUM_EXPIRY_MS = 1e3;
const MAXIMUM_EXPIRY_MS = 6e5;
const ALLOWED_OPTION_KEYS = /* @__PURE__ */ new Set(["buttonLabel", "expiryMs"]);
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
const SENSITIVE_AUTOCOMPLETE_TOKENS = /* @__PURE__ */ new Set([
	"username",
	"current-password",
	"new-password",
	"one-time-code",
	"webauthn"
]);
const UNDO_REMOVE_ATTRIBUTES = Object.freeze({
	controls: "data-a11y-repeatable-fieldset-undo-controls",
	button: "data-a11y-repeatable-fieldset-undo",
	state: "data-a11y-repeatable-fieldset-undo-state"
});
function invalidOptions(message) {
	return /* @__PURE__ */ new TypeError(`Undo Remove: ${message}`);
}
function normalizeOptions(options) {
	if (typeof options !== "object" || options === null || Array.isArray(options)) throw invalidOptions("options must be an object.");
	const unknownKey = Reflect.ownKeys(options).find((key) => typeof key !== "string" || !ALLOWED_OPTION_KEYS.has(key));
	if (unknownKey !== void 0) throw invalidOptions(`unknown option "${String(unknownKey)}".`);
	if (options.buttonLabel !== void 0 && (typeof options.buttonLabel !== "string" || options.buttonLabel.trim() === "")) throw invalidOptions("buttonLabel must be a non-empty string.");
	if (options.expiryMs !== void 0 && (!Number.isSafeInteger(options.expiryMs) || options.expiryMs < MINIMUM_EXPIRY_MS || options.expiryMs > MAXIMUM_EXPIRY_MS)) throw invalidOptions(`expiryMs must be a safe integer from ${MINIMUM_EXPIRY_MS} through ${MAXIMUM_EXPIRY_MS}.`);
	return Object.freeze({
		buttonLabel: options.buttonLabel?.trim() ?? "Undo last removal",
		expiryMs: options.expiryMs ?? DEFAULT_EXPIRY_MS
	});
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
function findControlsTarget(root) {
	const selector = `[${UNDO_REMOVE_ATTRIBUTES.controls}]`;
	const candidates = Array.from(root.querySelectorAll(selector)).filter((candidate) => candidate.closest("[data-a11y-repeatable-fieldset]") === root);
	if (candidates.length !== 1 || !isHTMLElement(candidates[0])) throw invalidOptions("the root must contain exactly one owned HTML undo-controls target.");
	const target = candidates[0];
	if (target.closest("[data-a11y-repeatable-fieldset-item]") !== null || target.closest("template") !== null || isHiddenOrInert(target, root) || isInsideLiveOutput(target, root) || target.childNodes.length !== 0) throw invalidOptions("the undo-controls target must be empty, exposed, outside items, templates, and live output.");
	return target;
}
function autocompleteTokens(control) {
	return Object.freeze((control.getAttribute("autocomplete") ?? "").trim().toLowerCase().split(/[\t\n\f\r ]+/).filter(Boolean));
}
function hasSensitiveAutocomplete(control) {
	return autocompleteTokens(control).some((token) => SENSITIVE_AUTOCOMPLETE_TOKENS.has(token) || token.startsWith("cc-") || token.startsWith("transaction-"));
}
function asStateControl(element, item) {
	if (!isHTMLElement(element) || element.localName !== "input" && element.localName !== "select" && element.localName !== "textarea") throw invalidOptions("state markers are supported only on native HTML input, select, and textarea controls.");
	const control = element;
	if (isHiddenOrInert(control, item) || control.matches(":disabled") || control.hasAttribute("disabled")) throw invalidOptions("hidden, inert, aria-hidden, and disabled controls cannot be retained.");
	if ((control.localName === "input" || control.localName === "textarea") && control.hasAttribute("readonly")) throw invalidOptions("readonly controls cannot be retained.");
	if (hasSensitiveAutocomplete(control)) throw invalidOptions("credential, authentication-code, payment, and transaction fields cannot be retained.");
	if (control.localName === "input") {
		const input = control;
		if (input.type === "file") throw invalidOptions("file controls can never be retained or restored.");
		if (input.type === "password" || input.type === "hidden") throw invalidOptions(`input type "${input.type}" cannot be retained.`);
		if (input.type !== "checkbox" && input.type !== "radio" && !SUPPORTED_VALUE_INPUT_TYPES.has(input.type)) throw invalidOptions(`input type "${input.type}" cannot be retained.`);
	}
	return control;
}
function controlKind(control) {
	if (control.localName === "input") return `input:${control.type}`;
	if (control.localName === "select") return control.multiple ? "select:multiple" : "select:single";
	return "textarea";
}
function collectMarkedControls(item, root) {
	const selector = `[${UNDO_REMOVE_ATTRIBUTES.state}]`;
	const controls = /* @__PURE__ */ new Map();
	const candidates = Array.from(item.querySelectorAll(selector)).filter((candidate) => candidate.closest("[data-a11y-repeatable-fieldset-item]") === item && (root === null || candidate.closest("[data-a11y-repeatable-fieldset]") === root));
	for (const candidate of candidates) {
		const rawSlot = candidate.getAttribute(UNDO_REMOVE_ATTRIBUTES.state);
		const slot = rawSlot?.trim() ?? "";
		if (rawSlot !== slot || !SLOT_PATTERN.test(slot)) throw invalidOptions(`state marker values must match ${SLOT_PATTERN.source}.`);
		if (controls.has(slot)) throw invalidOptions(`state marker "${slot}" must be unique within one item.`);
		controls.set(slot, asStateControl(candidate, item));
	}
	return controls;
}
function isOptionDisabled(option) {
	return option.disabled || option.closest("optgroup")?.disabled === true;
}
function captureStates(controls) {
	const states = [];
	for (const [slot, control] of controls) {
		const kind = controlKind(control);
		if (control.localName === "input") {
			const input = control;
			states.push(Object.freeze(input.type === "checkbox" || input.type === "radio" ? {
				slot,
				kind,
				checked: input.checked
			} : {
				slot,
				kind,
				value: input.value
			}));
			continue;
		}
		if (control.localName === "textarea") {
			states.push(Object.freeze({
				slot,
				kind,
				value: control.value
			}));
			continue;
		}
		const values = Array.from(control.selectedOptions).filter((option) => !isOptionDisabled(option)).map((option) => option.value);
		states.push(Object.freeze({
			slot,
			kind,
			values: Object.freeze(values)
		}));
	}
	return Object.freeze(states);
}
function restoreSelectState(select, values) {
	if (!select.multiple) {
		const value = values[0];
		if (value === void 0) return;
		const match = Array.from(select.options).find((option) => !isOptionDisabled(option) && option.value === value);
		if (match !== void 0) match.selected = true;
		return;
	}
	const remaining = /* @__PURE__ */ new Map();
	for (const value of values) remaining.set(value, (remaining.get(value) ?? 0) + 1);
	for (const option of select.options) {
		if (isOptionDisabled(option)) continue;
		const count = remaining.get(option.value) ?? 0;
		option.selected = count > 0;
		if (count > 0) remaining.set(option.value, count - 1);
	}
}
function restoreStates(states, context) {
	const controls = collectMarkedControls(context.candidate, null);
	for (const state of states) {
		const control = controls.get(state.slot);
		if (control === void 0 || controlKind(control) !== state.kind) throw invalidOptions(`the trusted template does not provide a matching state marker "${state.slot}".`);
		if ("checked" in state) control.checked = state.checked;
		else if ("values" in state) restoreSelectState(control, state.values);
		else if (control.localName === "textarea") control.value = state.value;
		else control.value = state.value;
	}
}
function findTemplateItem(root) {
	const template = Array.from(root.querySelectorAll("template[data-a11y-repeatable-fieldset-template]")).find((candidate) => candidate.closest("[data-a11y-repeatable-fieldset]") === root);
	const candidates = template === void 0 ? [] : Array.from(template.content.querySelectorAll("fieldset[data-a11y-repeatable-fieldset-item]"));
	if (candidates.length !== 1) throw invalidOptions("the trusted template must contain one item for state restoration.");
	return candidates[0];
}
/**
* Adds one short-lived native Undo button per root. Structure is restored by
* the core from the trusted template with the removed reserved key; the addon
* retains only explicitly marked, nonsensitive current control state.
*/
function createUndoRemove(options = {}) {
	const normalized = normalizeOptions(options);
	return Object.freeze({
		id: ADDON_ID,
		setup(context) {
			const target = findControlsTarget(context.root);
			collectMarkedControls(findTemplateItem(context.root), null);
			const button = context.root.ownerDocument.createElement("button");
			const ownerWindow = context.root.ownerDocument.defaultView;
			let pending = null;
			let timer = null;
			button.type = "button";
			button.hidden = true;
			button.className = "a11y-repeatable-fieldset__undo";
			button.setAttribute(UNDO_REMOVE_ATTRIBUTES.button, "");
			button.textContent = normalized.buttonLabel;
			const cancelTimer = () => {
				if (timer !== null) {
					ownerWindow?.clearTimeout(timer);
					timer = null;
				}
			};
			const clearPending = () => {
				cancelTimer();
				pending = null;
				button.hidden = true;
				button.disabled = false;
			};
			const expire = () => {
				if (context.root.ownerDocument.activeElement === button) return;
				clearPending();
			};
			const schedule = (delay) => {
				cancelTimer();
				if (pending === null) return;
				pending.remainingMs = delay;
				pending.expiresAt = Date.now() + delay;
				timer = ownerWindow?.setTimeout(expire, delay) ?? null;
			};
			const installPending = (value, delay) => {
				pending = value;
				button.hidden = false;
				button.disabled = !context.instance.canAdd();
				button.removeAttribute("aria-disabled");
				if (context.root.ownerDocument.activeElement !== button) schedule(delay);
			};
			const synchronize = () => {
				if (pending !== null) {
					button.disabled = !context.instance.canAdd();
					button.removeAttribute("aria-disabled");
				}
			};
			const pauseExpiry = () => {
				if (pending === null) return;
				pending.remainingMs = Math.max(1, pending.expiresAt - Date.now());
				cancelTimer();
			};
			const resumeExpiry = () => {
				if (pending !== null) schedule(pending.remainingMs);
			};
			const undo = () => {
				const current = pending;
				if (current === null) return;
				const result = current.restoration.restore({
					focus: true,
					restoreState: (restoreContext) => {
						restoreStates(current.states, restoreContext);
					}
				});
				if (result.ok) {
					clearPending();
					return;
				}
				if (result.reason === "maximum") {
					synchronize();
					return;
				}
				clearPending();
			};
			context.on(EVENTS.init, synchronize);
			context.on(EVENTS.itemAdded, synchronize);
			context.on(EVENTS.itemDuplicated, synchronize);
			context.on(EVENTS.itemRemoved, synchronize);
			context.on(EVENTS.itemRestored, synchronize);
			context.onRemovePreparation((preparationContext) => {
				const states = captureStates(collectMarkedControls(preparationContext.item.element, context.root));
				let previous = null;
				let committed = false;
				return Object.freeze({
					commit() {
						previous = pending;
						cancelTimer();
						committed = true;
						installPending({
							restoration: preparationContext.restoration,
							states,
							expiresAt: Date.now() + normalized.expiryMs,
							remainingMs: normalized.expiryMs
						}, normalized.expiryMs);
					},
					rollback() {
						if (!committed) return;
						clearPending();
						if (previous !== null) {
							const remaining = Math.max(1, previous.expiresAt - Date.now());
							installPending(previous, remaining);
						}
					}
				});
			});
			button.addEventListener("click", undo);
			button.addEventListener("focus", pauseExpiry);
			button.addEventListener("blur", resumeExpiry);
			try {
				target.append(button);
			} catch (error) {
				clearPending();
				button.removeEventListener("click", undo);
				button.removeEventListener("focus", pauseExpiry);
				button.removeEventListener("blur", resumeExpiry);
				button.remove();
				throw error;
			}
			return () => {
				clearPending();
				button.removeEventListener("click", undo);
				button.removeEventListener("focus", pauseExpiry);
				button.removeEventListener("blur", resumeExpiry);
				button.remove();
			};
		},
		setupItem(context) {
			const templateControls = collectMarkedControls(findTemplateItem(context.root), null);
			const itemControls = collectMarkedControls(context.item.element, context.root);
			for (const [slot, control] of itemControls) {
				const templateControl = templateControls.get(slot);
				if (templateControl === void 0 || controlKind(templateControl) !== controlKind(control)) throw invalidOptions(`state marker "${slot}" must have a matching control kind in the trusted template.`);
			}
		}
	});
}
//#endregion
export { UNDO_REMOVE_ATTRIBUTES, createUndoRemove };

//# sourceMappingURL=undo-remove.js.map