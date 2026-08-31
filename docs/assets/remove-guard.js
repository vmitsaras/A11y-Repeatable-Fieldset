//#region src/addons/remove-guard.ts
const ADDON_ID = "a11y-repeatable-fieldset.remove-guard";
const ALLOWED_OPTION_KEYS = /* @__PURE__ */ new Set([
	"shouldConfirm",
	"confirm",
	"onError"
]);
function invalidOptions(message) {
	return /* @__PURE__ */ new TypeError(`Remove Guard: ${message}`);
}
function normalizeOptions(options) {
	if (typeof options !== "object" || options === null || Array.isArray(options)) throw invalidOptions("options must be an object.");
	const unknownKey = Reflect.ownKeys(options).find((key) => typeof key !== "string" || !ALLOWED_OPTION_KEYS.has(key));
	if (unknownKey !== void 0) throw invalidOptions(`unknown option \"${String(unknownKey)}\".`);
	if (typeof options.shouldConfirm !== "function") throw invalidOptions("shouldConfirm must be a function.");
	if (typeof options.confirm !== "function") throw invalidOptions("confirm must be a function.");
	if (options.onError !== void 0 && typeof options.onError !== "function") throw invalidOptions("onError must be a function when supplied.");
	return Object.freeze({
		shouldConfirm: options.shouldConfirm,
		confirm: options.confirm,
		...options.onError === void 0 ? {} : { onError: options.onError }
	});
}
function createContext(request) {
	return Object.freeze({
		instance: request.instance,
		root: request.root,
		item: request.item,
		trigger: request.trigger
	});
}
/**
* Creates an opt-in control-request guard without changing lifecycle events.
*
* Public `instance.remove()` calls are already-approved commands and bypass
* this addon. A control request is approved through its single-use command,
* which revalidates ownership and the current minimum when approval arrives.
*/
function createRemoveGuard(options) {
	const normalized = normalizeOptions(options);
	return Object.freeze({
		id: ADDON_ID,
		setup(context) {
			let active = true;
			const pendingItems = /* @__PURE__ */ new Set();
			const reportError = (error, guardContext) => {
				if (!active || normalized.onError === void 0) return;
				try {
					normalized.onError(error, guardContext);
				} catch {}
			};
			const settle = (decision, request, guardContext) => {
				pendingItems.delete(request.item.element);
				if (!active) return;
				if (typeof decision !== "boolean") {
					reportError(invalidOptions("confirm must return or resolve to a boolean."), guardContext);
					return;
				}
				if (decision) request.remove();
			};
			context.onRemoveRequest((request) => {
				if (!active || pendingItems.has(request.item.element)) return;
				const guardContext = createContext(request);
				let shouldConfirm;
				try {
					shouldConfirm = normalized.shouldConfirm(guardContext);
				} catch (error) {
					reportError(error, guardContext);
					return;
				}
				if (typeof shouldConfirm !== "boolean") {
					reportError(invalidOptions("shouldConfirm must return a boolean."), guardContext);
					return;
				}
				if (!shouldConfirm) {
					request.remove();
					return;
				}
				pendingItems.add(request.item.element);
				let confirmation;
				try {
					confirmation = normalized.confirm(guardContext);
				} catch (error) {
					pendingItems.delete(request.item.element);
					reportError(error, guardContext);
					return;
				}
				if (typeof confirmation === "boolean") {
					settle(confirmation, request, guardContext);
					return;
				}
				Promise.resolve(confirmation).then((decision) => {
					settle(decision, request, guardContext);
				}, (error) => {
					pendingItems.delete(request.item.element);
					reportError(error, guardContext);
				});
			});
			return () => {
				active = false;
				pendingItems.clear();
			};
		}
	});
}
//#endregion
export { createRemoveGuard };

//# sourceMappingURL=remove-guard.js.map