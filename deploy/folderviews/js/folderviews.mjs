import { a as __mf_89, i as __mf_83, n as __mf_228, o as __mf_91, r as __mf_306, t as __mf_146 } from "./_virtual_mf___mfe_internal__folderviews__loadShare___mf_0_opencloud_mf_2_eu_mf_1_web_mf_2_pkg__loadShare__.mjs-CbYRYTOX.mjs";
import { C as __mf_93, S as __mf_91$1, _ as __mf_81, a as __mf_139, b as __mf_84, c as __mf_161, d as __mf_39, f as __mf_45, g as __mf_80, h as __mf_61, i as __mf_132, l as __mf_166, m as __mf_60, n as __mf_117, o as __mf_140, p as __mf_55, r as __mf_118, s as __mf_154, t as __mf_112, u as __mf_24, v as __mf_82, x as __mf_90, y as __mf_83$1 } from "./_virtual_mf___mfe_internal__folderviews__loadShare__vue__loadShare__.mjs-DqPXX7ew.mjs";
//#region src/views/AktenplanView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$5 = { class: "typed-folder-view aktenplan-view" };
var _hoisted_2$3 = { class: "typed-folder-header" };
var _hoisted_3$1 = { class: "typed-folder-type-badge" };
var AktenplanView_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ __mf_93({
	__name: "AktenplanView",
	setup(__props) {
		const resource = __mf_112("resource");
		const showNewDialog = __mf_45(false);
		const isShielded = __mf_80(() => __mf_55(resource)?.immutableState === "shielded");
		const isProtected = __mf_80(() => __mf_55(resource)?.immutableState === "protected");
		const canCreateChild = __mf_80(() => __mf_55(isShielded) || !__mf_55(isProtected));
		return (_ctx, _cache) => {
			return __mf_132(), __mf_83$1("div", _hoisted_1$5, [__mf_84("div", _hoisted_2$3, [__mf_84("span", _hoisted_3$1, __mf_61(isShielded.value ? "Aktenschrank" : "Aktenplan"), 1), canCreateChild.value ? (__mf_132(), __mf_83$1("button", {
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
var _hoisted_1$4 = { class: "typed-folder-view akte-view" };
var _hoisted_2$2 = { class: "typed-folder-header" };
//#endregion
//#region src/views/AkteView.vue
var AkteView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ __mf_93({
	__name: "AkteView",
	emits: ["new-child"],
	setup(__props) {
		return (_ctx, _cache) => {
			return __mf_132(), __mf_83$1("div", _hoisted_1$4, [__mf_84("div", _hoisted_2$2, [_cache[2] || (_cache[2] = __mf_84("span", { class: "typed-folder-type-badge akte" }, "Akte", -1)), __mf_84("button", {
				class: "typed-action-btn",
				onClick: _cache[0] || (_cache[0] = ($event) => _ctx.$emit("new-child", "vorgang"))
			}, [..._cache[1] || (_cache[1] = [__mf_84("span", { class: "typed-action-icon" }, "+", -1), __mf_90(" Neuer Vorgang ", -1)])])]), __mf_139(_ctx.$slots, "default", {}, void 0, true)]);
		};
	}
}), [["__scopeId", "data-v-dfbe8531"]]);
//#endregion
//#region src/views/VorgangView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$3 = { class: "typed-folder-view vorgang-view" };
var _hoisted_2$1 = { class: "typed-folder-header" };
//#endregion
//#region src/views/VorgangView.vue
var VorgangView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ __mf_93({
	__name: "VorgangView",
	emits: ["new-child"],
	setup(__props) {
		return (_ctx, _cache) => {
			return __mf_132(), __mf_83$1("div", _hoisted_1$3, [__mf_84("div", _hoisted_2$1, [_cache[2] || (_cache[2] = __mf_84("span", { class: "typed-folder-type-badge vorgang" }, "Vorgang", -1)), __mf_84("button", {
				class: "typed-action-btn",
				onClick: _cache[0] || (_cache[0] = ($event) => _ctx.$emit("new-child", "register"))
			}, [..._cache[1] || (_cache[1] = [__mf_84("span", { class: "typed-action-icon" }, "+", -1), __mf_90(" Neues Register ", -1)])])]), __mf_139(_ctx.$slots, "default", {}, void 0, true)]);
		};
	}
}), [["__scopeId", "data-v-9841a994"]]);
//#endregion
//#region src/views/RegisterView.vue
var _sfc_main = {};
var _hoisted_1$2 = { class: "typed-folder-view register-view" };
function _sfc_render(_ctx, _cache) {
	return __mf_132(), __mf_83$1("div", _hoisted_1$2, [_cache[0] || (_cache[0] = __mf_84("div", { class: "typed-folder-header" }, [__mf_84("span", { class: "typed-folder-type-badge register" }, "Register"), __mf_84("span", { class: "typed-folder-hint" }, "Dokumente ablegen")], -1)), __mf_139(_ctx.$slots, "default", {}, void 0, true)]);
}
var RegisterView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-557897cd"]]);
//#endregion
//#region src/components/ResourceTree.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$1 = { class: "resource-tree" };
var _hoisted_2 = ["onClick"];
var _hoisted_3 = {
	key: 1,
	class: "tree-spacer"
};
//#endregion
//#region src/components/ResourceTree.vue
var ResourceTree_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ __mf_93({
	__name: "ResourceTree",
	props: /*@__PURE__*/ __mf_117({
		resources: {},
		space: {},
		viewMode: {},
		sortBy: {},
		sortDir: {},
		dragDrop: { type: Boolean },
		headerPosition: {},
		sortFields: {},
		viewSize: {}
	}, {
		"selectedIds": { default: () => [] },
		"selectedIdsModifiers": {}
	}),
	emits: /*@__PURE__*/ __mf_117([
		"fileClick",
		"fileDropped",
		"itemVisible",
		"sort",
		"update:selectedIds"
	], ["update:selectedIds"]),
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const selectedIds = __mf_154(__props, "selectedIds");
		const clientService = __mf_228();
		const resourcesStore = __mf_306();
		const expanded = __mf_45(/* @__PURE__ */ new Set());
		const childrenMap = __mf_45(/* @__PURE__ */ new Map());
		const loadingSet = __mf_45(/* @__PURE__ */ new Set());
		function isExpanded(id) {
			return expanded.value.has(id);
		}
		function isLoading(id) {
			return loadingSet.value.has(id);
		}
		function calcDepth(resource) {
			if (!resource.path) return 0;
			const rootPaths = props.resources.filter((r) => !r.name?.startsWith("_type_")).map((r) => r.path);
			const segments = resource.path.split("/").filter(Boolean);
			let minRootSegments = Infinity;
			for (const rp of rootPaths) {
				const cnt = rp.split("/").filter(Boolean).length;
				if (cnt < minRootSegments) minRootSegments = cnt;
			}
			if (minRootSegments === Infinity) return 0;
			return segments.length - minRootSegments;
		}
		async function toggleExpand(resource) {
			const id = resource.id;
			const next = new Set(expanded.value);
			if (next.has(id)) {
				next.delete(id);
				expanded.value = next;
				return;
			}
			next.add(id);
			expanded.value = next;
			if (!childrenMap.value.has(id)) {
				loadingSet.value = new Set([...loadingSet.value, id]);
				try {
					const { children } = await clientService.webdav.listFiles(props.space, { path: resource.path });
					childrenMap.value = new Map([...childrenMap.value, [id, children]]);
					children.forEach((c) => resourcesStore.upsertResource(c));
				} catch {
					childrenMap.value = new Map([...childrenMap.value, [id, []]]);
				} finally {
					const ls = new Set(loadingSet.value);
					ls.delete(id);
					loadingSet.value = ls;
				}
			}
		}
		function handleFileClick(options) {
			emit("fileClick", options);
		}
		function handleSort(options) {
			emit("sort", options);
		}
		const visibleResources = __mf_80(() => {
			const result = [];
			function walk(resources) {
				for (const r of resources) {
					if (r.name?.startsWith("_type_")) continue;
					result.push(r);
					if (r.type === "folder" && expanded.value.has(r.id) && childrenMap.value.has(r.id)) walk(childrenMap.value.get(r.id));
				}
			}
			walk(props.resources.filter((r) => !r.name?.startsWith("_type_")));
			return result;
		});
		__mf_161(() => props.resources, () => {
			expanded.value = /* @__PURE__ */ new Set();
			childrenMap.value = /* @__PURE__ */ new Map();
		});
		return (_ctx, _cache) => {
			const _component_oc_icon = __mf_140("oc-icon");
			const _component_oc_spinner = __mf_140("oc-spinner");
			return __mf_132(), __mf_83$1("div", _hoisted_1$1, [__mf_91$1(__mf_55(__mf_89), {
				"selected-ids": selectedIds.value,
				"onUpdate:selectedIds": _cache[0] || (_cache[0] = ($event) => selectedIds.value = $event),
				resources: visibleResources.value,
				"view-mode": "resource-table-condensed",
				space: __props.space,
				"header-position": __props.headerPosition,
				"sort-by": __props.sortBy,
				"sort-dir": __props.sortDir,
				"sort-fields": __props.sortFields,
				onFileClick: handleFileClick,
				onSort: handleSort
			}, {
				image: __mf_166(({ resource }) => [
					__mf_84("span", {
						class: "tree-indent-block",
						style: __mf_60({
							width: calcDepth(resource) * 20 + "px",
							display: "inline-block",
							flexShrink: 0
						})
					}, null, 4),
					resource.type === "folder" ? (__mf_132(), __mf_83$1("button", {
						key: 0,
						class: "tree-btn",
						onClick: __mf_24(($event) => toggleExpand(resource), ["stop", "prevent"])
					}, [__mf_91$1(_component_oc_icon, {
						name: isExpanded(resource.id) ? "arrow-down-s" : "arrow-right-s",
						size: "small"
					}, null, 8, ["name"])], 8, _hoisted_2)) : (__mf_132(), __mf_83$1("span", _hoisted_3)),
					__mf_91$1(__mf_55(__mf_83), {
						resource,
						size: "small",
						class: "mr-1"
					}, null, 8, ["resource"]),
					isLoading(resource.id) ? (__mf_132(), __mf_81(_component_oc_spinner, {
						key: 2,
						size: "xsmall",
						class: "ml-1"
					})) : __mf_82("", true)
				]),
				quickActions: __mf_166(({ resource }) => [__mf_139(_ctx.$slots, "quickActions", { resource }, void 0, true)]),
				contextMenu: __mf_166(({ resource }) => [__mf_139(_ctx.$slots, "contextMenu", { resource }, void 0, true)]),
				footer: __mf_166(() => [__mf_139(_ctx.$slots, "footer", {}, void 0, true)]),
				_: 3
			}, 8, [
				"selected-ids",
				"resources",
				"space",
				"header-position",
				"sort-by",
				"sort-dir",
				"sort-fields"
			])]);
		};
	}
}), [["__scopeId", "data-v-d34319b8"]]);
//#endregion
//#region src/components/ResourceMetro.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "metro-tile-label" };
//#endregion
//#region src/components/ResourceMetro.vue
var ResourceMetro_default = /* @__PURE__ */ __mf_93({
	__name: "ResourceMetro",
	props: /*@__PURE__*/ __mf_117({
		resources: {},
		space: {},
		viewMode: {},
		sortBy: {},
		sortDir: {},
		dragDrop: { type: Boolean },
		headerPosition: {},
		sortFields: {},
		viewSize: {}
	}, {
		"selectedIds": { default: () => [] },
		"selectedIdsModifiers": {}
	}),
	emits: /*@__PURE__*/ __mf_117([
		"fileClick",
		"fileDropped",
		"itemVisible",
		"sort",
		"update:selectedIds"
	], ["update:selectedIds"]),
	setup(__props) {
		const props = __props;
		const selectedIds = __mf_154(__props, "selectedIds");
		const filteredResources = __mf_80(() => {
			return props.resources.filter((r) => !r.name?.startsWith("_type_"));
		});
		return (_ctx, _cache) => {
			return __mf_132(), __mf_81(__mf_55(__mf_91), __mf_118(_ctx.$attrs, {
				"selected-ids": selectedIds.value,
				"onUpdate:selectedIds": _cache[0] || (_cache[0] = ($event) => selectedIds.value = $event),
				resources: filteredResources.value,
				space: __props.space,
				"view-mode": __props.viewMode,
				"sort-by": __props.sortBy,
				"sort-dir": __props.sortDir,
				"sort-fields": __props.sortFields,
				"header-position": __props.headerPosition,
				"view-size": __props.viewSize,
				"drag-drop": __props.dragDrop,
				class: "metro-view",
				onFileClick: _cache[1] || (_cache[1] = ($event) => _ctx.$emit("fileClick", $event)),
				onFileDropped: _cache[2] || (_cache[2] = ($event) => _ctx.$emit("fileDropped", $event)),
				onItemVisible: _cache[3] || (_cache[3] = ($event) => _ctx.$emit("itemVisible", $event)),
				onSort: _cache[4] || (_cache[4] = ($event) => _ctx.$emit("sort", $event))
			}), {
				image: __mf_166(({ resource }) => [__mf_84("span", _hoisted_1, __mf_61(resource.name), 1)]),
				contextMenu: __mf_166(({ resource }) => [__mf_139(_ctx.$slots, "contextMenu", { resource })]),
				_: 3
			}, 16, [
				"selected-ids",
				"resources",
				"space",
				"view-mode",
				"sort-by",
				"sort-dir",
				"sort-fields",
				"header-position",
				"view-size",
				"drag-drop"
			]);
		};
	}
});
//#endregion
//#region src/index.ts
var applicationId = "folderviews";
var src_default = __mf_146({ setup() {
	const appInfo = {
		name: "Folder Views",
		id: applicationId,
		icon: "archive",
		color: "#5c6bc0",
		defaultExtension: "",
		extensions: []
	};
	const folderViewHandlers = {
		aktenplan: __mf_39(AktenplanView_default),
		akte: __mf_39(AkteView_default),
		vorgang: __mf_39(VorgangView_default),
		register: __mf_39(RegisterView_default)
	};
	return {
		appInfo,
		extensions: [{
			id: "com.kosmos-eu.folderviews.folder-view.resource-tree",
			type: "folderView",
			extensionPointIds: ["app.files.folder-views.folder", "app.files.folder-views.project-spaces"],
			folderView: {
				name: "resource-tree",
				label: "Tree view",
				icon: {
					name: "node-tree",
					fillType: "none"
				},
				component: __mf_39(ResourceTree_default)
			}
		}, {
			id: "com.kosmos-eu.folderviews.folder-view.resource-metro",
			type: "folderView",
			extensionPointIds: ["app.files.folder-views.folder", "app.files.folder-views.project-spaces"],
			folderView: {
				name: "resource-metro",
				label: "Metro tiles view",
				icon: {
					name: "dashboard",
					fillType: "fill"
				},
				component: __mf_39(ResourceMetro_default)
			}
		}],
		folderViewHandlers
	};
} });
//#endregion
export { src_default as default };
