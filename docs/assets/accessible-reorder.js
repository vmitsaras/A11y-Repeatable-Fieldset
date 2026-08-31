//#region src/addons/accessible-reorder.ts
const ADDON_ID = "a11y-repeatable-fieldset.accessible-reorder";
const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const ALLOWED_OPTION_KEYS = /* @__PURE__ */ new Set(["moveUpLabel", "moveDownLabel"]);
const ACCESSIBLE_REORDER_ATTRIBUTES = Object.freeze({
	controls: "data-a11y-repeatable-fieldset-reorder-controls",
	moveUp: "data-a11y-repeatable-fieldset-move-up",
	moveDown: "data-a11y-repeatable-fieldset-move-down"
});
function invalidOptions(message) {
	return /* @__PURE__ */ new TypeError(`Accessible Reorder: ${message}`);
}
function normalizeLabel(value, name, fallback) {
	if (value === void 0) return fallback;
	if (typeof value !== "string" || value.trim() === "") throw invalidOptions(`${name} must be a non-empty string.`);
	return value.trim();
}
function normalizeOptions(options) {
	if (typeof options !== "object" || options === null || Array.isArray(options)) throw invalidOptions("options must be an object.");
	const unknownKey = Reflect.ownKeys(options).find((key) => typeof key !== "string" || !ALLOWED_OPTION_KEYS.has(key));
	if (unknownKey !== void 0) throw invalidOptions(`unknown option \"${String(unknownKey)}\".`);
	return Object.freeze({
		moveUpLabel: normalizeLabel(options.moveUpLabel, "moveUpLabel", "Move up"),
		moveDownLabel: normalizeLabel(options.moveDownLabel, "moveDownLabel", "Move down")
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
function findControlsTarget(context) {
	const selector = `[${ACCESSIBLE_REORDER_ATTRIBUTES.controls}]`;
	const candidates = Array.from(context.item.element.querySelectorAll(selector)).filter((candidate) => candidate.closest("[data-a11y-repeatable-fieldset-item]") === context.item.element && candidate.closest("[data-a11y-repeatable-fieldset]") === context.root);
	if (candidates.length !== 1 || !isHTMLElement(candidates[0])) throw invalidOptions("every item must contain exactly one owned HTML reorder-controls target.");
	const target = candidates[0];
	if (target.closest("legend") !== null || isHiddenOrInert(target, context.item.element) || isInsideLiveOutput(target, context.item.element) || target.childNodes.length !== 0) throw invalidOptions("the reorder-controls target must be empty, exposed, outside the legend, and outside live output.");
	return target;
}
function createMoveButton(context, attribute, label, direction) {
	const button = context.root.ownerDocument.createElement("button");
	button.type = "button";
	button.setAttribute(attribute, "");
	button.className = `a11y-repeatable-fieldset__move a11y-repeatable-fieldset__move--${direction}`;
	button.textContent = label;
	return button;
}
/**
* Adds native adjacent-move controls while core owns every structural change.
*/
function createAccessibleReorder(options = {}) {
	const normalized = normalizeOptions(options);
	return Object.freeze({
		id: ADDON_ID,
		setupItem(context) {
			const target = findControlsTarget(context);
			const moveUp = createMoveButton(context, ACCESSIBLE_REORDER_ATTRIBUTES.moveUp, normalized.moveUpLabel, "up");
			const moveDown = createMoveButton(context, ACCESSIBLE_REORDER_ATTRIBUTES.moveDown, normalized.moveDownLabel, "down");
			const moveUpItem = () => {
				context.instance.move(context.item.element, "up");
			};
			const moveDownItem = () => {
				context.instance.move(context.item.element, "down");
			};
			moveUp.addEventListener("click", moveUpItem);
			moveDown.addEventListener("click", moveDownItem);
			try {
				target.append(moveUp, moveDown);
			} catch (error) {
				moveUp.removeEventListener("click", moveUpItem);
				moveDown.removeEventListener("click", moveDownItem);
				moveUp.remove();
				moveDown.remove();
				throw error;
			}
			let active = true;
			return () => {
				if (!active) return;
				active = false;
				moveUp.removeEventListener("click", moveUpItem);
				moveDown.removeEventListener("click", moveDownItem);
				moveUp.remove();
				moveDown.remove();
			};
		}
	});
}
//#endregion
export { ACCESSIBLE_REORDER_ATTRIBUTES, createAccessibleReorder };

//# sourceMappingURL=accessible-reorder.js.map