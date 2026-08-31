//#region src/addons/validation-bridge.ts
function invalidOptions(message) {
	return /* @__PURE__ */ new TypeError(`Validation Bridge: ${message}`);
}
/**
* Creates an opt-in addon that maps repeatable-item lifecycle to a validator.
*
* The bridge imports no validation library and has no import-time DOM side
* effects. The parent repeatable-fieldset instance owns every cleanup returned
* by `registerItem`, runs it before item detachment, and runs it for retained
* items during destroy.
*/
function createValidationBridge(options) {
	if (typeof options !== "object" || options === null || Array.isArray(options)) throw invalidOptions("options must be an object.");
	if (typeof options.id !== "string" || options.id.trim() === "" || options.id !== options.id.trim()) throw invalidOptions("id must be a trimmed, non-empty string.");
	if (typeof options.registerItem !== "function") throw invalidOptions("registerItem must be a function.");
	const id = options.id;
	const registerItem = options.registerItem;
	return Object.freeze({
		id,
		setupItem(context) {
			const bridgeContext = Object.freeze({
				instance: context.instance,
				root: context.root,
				item: context.item,
				phase: context.phase
			});
			return registerItem(bridgeContext);
		}
	});
}
//#endregion
export { createValidationBridge };

//# sourceMappingURL=validation-bridge.js.map