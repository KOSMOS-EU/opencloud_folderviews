import { n as __mf_146, t as __mf_12 } from "./_virtual_mf___mfe_internal__folderviews__loadShare___mf_0_opencloud_mf_2_eu_mf_1_web_mf_2_pkg__loadShare__.mjs-D6gd6tf7.mjs";
import { a as __mf_55, c as __mf_82, d as __mf_90, f as __mf_93, i as __mf_45, l as __mf_83, n as __mf_132, o as __mf_61, r as __mf_139, s as __mf_80, t as __mf_112, u as __mf_84 } from "./_virtual_mf___mfe_internal__folderviews__loadShare__vue__loadShare__.mjs-BrzYkBol.mjs";
//#region src/views/AktenplanView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$3 = { class: "typed-folder-view aktenplan-view" };
var _hoisted_2$2 = { class: "typed-folder-header" };
var _hoisted_3 = { class: "typed-folder-type-badge" };
var AktenplanView_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ __mf_93({
	__name: "AktenplanView",
	setup(__props) {
		const resource = __mf_112("resource");
		const showNewDialog = __mf_45(false);
		const isShielded = __mf_80(() => __mf_55(resource)?.immutableState === "shielded");
		const isProtected = __mf_80(() => __mf_55(resource)?.immutableState === "protected");
		const canCreateChild = __mf_80(() => __mf_55(isShielded) || !__mf_55(isProtected));
		return (_ctx, _cache) => {
			return __mf_132(), __mf_83("div", _hoisted_1$3, [__mf_84("div", _hoisted_2$2, [__mf_84("span", _hoisted_3, __mf_61(isShielded.value ? "Aktenschrank" : "Aktenplan"), 1), canCreateChild.value ? (__mf_132(), __mf_83("button", {
				key: 0,
				class: "typed-action-btn",
				onClick: _cache[0] || (_cache[0] = ($event) => showNewDialog.value = true)
			}, [_cache[1] || (_cache[1] = __mf_84("span", { class: "typed-action-icon" }, "+", -1)), __mf_90(" " + __mf_61(isShielded.value ? "Neue Akte" : "Neue Sachgruppe"), 1)])) : __mf_82("", true)]), __mf_139(_ctx.$slots, "default", {}, void 0, true)]);
		};
	}
});
//#endregion
//#region \0plugin-vue:export-helper
var _plugin_vue_export_helper_default = (sfc, props) => {
	const target = sfc.__vccOpts || sfc;
	for (const [key, val] of props) target[key] = val;
	return target;
};
//#endregion
//#region src/views/AktenplanView.vue
var AktenplanView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(AktenplanView_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-0295f814"]]);
//#endregion
//#region src/views/AkteView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$2 = { class: "typed-folder-view akte-view" };
var _hoisted_2$1 = { class: "typed-folder-header" };
//#endregion
//#region src/views/AkteView.vue
var AkteView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ __mf_93({
	__name: "AkteView",
	emits: ["new-child"],
	setup(__props) {
		return (_ctx, _cache) => {
			return __mf_132(), __mf_83("div", _hoisted_1$2, [__mf_84("div", _hoisted_2$1, [_cache[2] || (_cache[2] = __mf_84("span", { class: "typed-folder-type-badge akte" }, "Akte", -1)), __mf_84("button", {
				class: "typed-action-btn",
				onClick: _cache[0] || (_cache[0] = ($event) => _ctx.$emit("new-child", "vorgang"))
			}, [..._cache[1] || (_cache[1] = [__mf_84("span", { class: "typed-action-icon" }, "+", -1), __mf_90(" Neuer Vorgang ", -1)])])]), __mf_139(_ctx.$slots, "default", {}, void 0, true)]);
		};
	}
}), [["__scopeId", "data-v-dfbe8531"]]);
//#endregion
//#region src/views/VorgangView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$1 = { class: "typed-folder-view vorgang-view" };
var _hoisted_2 = { class: "typed-folder-header" };
//#endregion
//#region src/views/VorgangView.vue
var VorgangView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ __mf_93({
	__name: "VorgangView",
	emits: ["new-child"],
	setup(__props) {
		return (_ctx, _cache) => {
			return __mf_132(), __mf_83("div", _hoisted_1$1, [__mf_84("div", _hoisted_2, [_cache[2] || (_cache[2] = __mf_84("span", { class: "typed-folder-type-badge vorgang" }, "Vorgang", -1)), __mf_84("button", {
				class: "typed-action-btn",
				onClick: _cache[0] || (_cache[0] = ($event) => _ctx.$emit("new-child", "register"))
			}, [..._cache[1] || (_cache[1] = [__mf_84("span", { class: "typed-action-icon" }, "+", -1), __mf_90(" Neues Register ", -1)])])]), __mf_139(_ctx.$slots, "default", {}, void 0, true)]);
		};
	}
}), [["__scopeId", "data-v-9841a994"]]);
//#endregion
//#region src/views/RegisterView.vue
var _sfc_main = {};
var _hoisted_1 = { class: "typed-folder-view register-view" };
function _sfc_render(_ctx, _cache) {
	return __mf_132(), __mf_83("div", _hoisted_1, [_cache[0] || (_cache[0] = __mf_84("div", { class: "typed-folder-header" }, [__mf_84("span", { class: "typed-folder-type-badge register" }, "Register"), __mf_84("span", { class: "typed-folder-hint" }, "Dokumente ablegen")], -1)), __mf_139(_ctx.$slots, "default", {}, void 0, true)]);
}
var RegisterView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-557897cd"]]);
//#endregion
//#region src/index.ts
var applicationId = "folderviews";
var src_default = __mf_146({ setup() {
	const routes = [{
		name: "folderviews",
		path: "/:driveAliasAndItem(.*)?",
		component: __mf_12(AktenplanView_default, { applicationId }),
		meta: {
			authContext: "hybrid",
			patchCleanPath: true
		}
	}];
	return {
		appInfo: {
			name: "Folder Views",
			id: applicationId,
			icon: "archive",
			color: "#5c6bc0",
			defaultExtension: "",
			extensions: []
		},
		routes,
		folderViewHandlers: {
			aktenplan: AktenplanView_default,
			akte: AkteView_default,
			vorgang: VorgangView_default,
			register: RegisterView_default
		}
	};
} });
//#endregion
export { src_default as default };
