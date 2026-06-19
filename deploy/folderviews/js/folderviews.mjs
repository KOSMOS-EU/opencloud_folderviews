import { a as __mf_243, c as __mf_83, i as __mf_241, l as __mf_89, n as __mf_228, o as __mf_306, r as __mf_237, s as __mf_314, t as __mf_146, u as __mf_91 } from "./_virtual_mf___mfe_internal__folderviews__loadShare___mf_0_opencloud_mf_2_eu_mf_1_web_mf_2_pkg__loadShare__.mjs-B_bvgBHO.mjs";
import { A as __mf_93, C as __mf_80, D as __mf_84, E as __mf_83$1, O as __mf_90, S as __mf_73, T as __mf_82, _ as __mf_45, a as __mf_130, b as __mf_61, c as __mf_138, d as __mf_142, f as __mf_154, g as __mf_39, h as __mf_24, i as __mf_126, k as __mf_91$1, l as __mf_139, m as __mf_166, n as __mf_117, o as __mf_132, p as __mf_161, r as __mf_118, s as __mf_134, t as __mf_112, u as __mf_140, v as __mf_55, w as __mf_81, x as __mf_69, y as __mf_60 } from "./_virtual_mf___mfe_internal__folderviews__loadShare__vue__loadShare__.mjs-CsPj1B2y.mjs";
//#region src/composables/useFolderviewSettings.ts
var EXTENSION_POINT_ID = "com.kosmos-eu.folderviews.aktenzeichen-display";
var EXT_ENABLED = "com.kosmos-eu.folderviews.aktenzeichen-enabled";
var EXT_DISABLED = "com.kosmos-eu.folderviews.aktenzeichen-disabled";
/**
* Returns the extension point + extensions to register in index.ts
*/
function getAktenzeichenPreferenceDefinitions() {
	return {
		extensionPoint: {
			id: EXTENSION_POINT_ID,
			extensionType: "customComponent",
			multiple: false,
			defaultExtensionId: EXT_DISABLED,
			userPreference: {
				label: "Aktenzeichen im Ordnernamen",
				description: "Aktenzeichen (z.B. 11.12.01) vor dem Ordnernamen anzeigen",
				type: "checkbox"
			}
		},
		extensions: [{
			id: EXT_ENABLED,
			type: "customComponent",
			extensionPointIds: [EXTENSION_POINT_ID],
			userPreference: { optionLabel: "Aktenzeichen anzeigen" }
		}, {
			id: EXT_DISABLED,
			type: "customComponent",
			extensionPointIds: [EXTENSION_POINT_ID],
			userPreference: { optionLabel: "Aktenzeichen ausblenden" }
		}]
	};
}
/**
* Composable to read the user's Aktenzeichen preference.
* Uses the extension preferences store (localStorage-backed).
*/
function useFolderviewSettings() {
	const store = __mf_241();
	return { showAktzInName: __mf_80(() => {
		return store.getExtensionPreference(EXTENSION_POINT_ID, [EXT_DISABLED]).selectedExtensionIds.includes(EXT_ENABLED);
	}) };
}
//#endregion
//#region src/composables/useFileReference.ts
var PROP_KEY = "oc:oy.fileReference";
/**
* Get the Aktenzeichen (oy.fileReference) from a resource.
* Requires registerExtraProp('oc:oy.fileReference') + buildPropFindBody fix.
*/
function getFileReference(resource) {
	return resource.extraProps?.[PROP_KEY] || "";
}
/**
* Build display name: "aktz name" if showAktz and fileReference exists, else just name.
*/
function displayName(resource, showAktz) {
	if (!showAktz) return resource.name || "";
	const aktz = getFileReference(resource);
	if (aktz) return `${aktz} ${resource.name}`;
	return resource.name || "";
}
/**
* Sort comparator using displayName (with optional aktz prefix).
*/
function compareByDisplayName(a, b, showAktz) {
	const na = displayName(a, showAktz).toLowerCase();
	const nb = displayName(b, showAktz).toLowerCase();
	return na.localeCompare(nb, void 0, { numeric: true });
}
//#endregion
//#region src/views/AktenplanView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$12 = { class: "typed-folder-view aktenplan-view" };
var _hoisted_2$9 = { class: "typed-folder-header" };
var _hoisted_3$6 = { class: "typed-folder-type-badge" };
var _hoisted_4$1 = {
	key: 0,
	class: "typed-folder-aktz"
};
var AktenplanView_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ __mf_93({
	__name: "AktenplanView",
	setup(__props) {
		const resourcesStore = __mf_306();
		const showNewDialog = __mf_45(false);
		const { showAktzInName } = useFolderviewSettings();
		const currentFolder = __mf_80(() => resourcesStore.currentFolder);
		const isShielded = __mf_80(() => __mf_55(currentFolder)?.immutableState === "shielded");
		const isProtected = __mf_80(() => __mf_55(currentFolder)?.immutableState === "protected");
		const canCreateChild = __mf_80(() => __mf_55(isShielded) || !__mf_55(isProtected));
		const fileRef = __mf_80(() => {
			const r = __mf_55(currentFolder);
			console.log("[AktenplanView] currentFolder:", r?.name, "extraProps:", r?.extraProps);
			return r ? getFileReference(r) : "";
		});
		return (_ctx, _cache) => {
			return __mf_132(), __mf_83$1("div", _hoisted_1$12, [__mf_84("div", _hoisted_2$9, [
				__mf_84("span", _hoisted_3$6, __mf_61(isShielded.value ? "Aktenschrank" : "Aktenplan"), 1),
				fileRef.value && __mf_55(showAktzInName) ? (__mf_132(), __mf_83$1("span", _hoisted_4$1, __mf_61(fileRef.value), 1)) : __mf_82("", true),
				canCreateChild.value ? (__mf_132(), __mf_83$1("button", {
					key: 1,
					class: "typed-action-btn",
					onClick: _cache[0] || (_cache[0] = ($event) => showNewDialog.value = true)
				}, [_cache[1] || (_cache[1] = __mf_84("span", { class: "typed-action-icon" }, "+", -1)), __mf_90(" " + __mf_61(isShielded.value ? "Neue Akte" : "Neue Sachgruppe"), 1)])) : __mf_82("", true)
			]), __mf_139(_ctx.$slots, "default", {}, void 0, true)]);
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
var AktenplanView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(AktenplanView_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-e6a8c74a"]]);
//#endregion
//#region src/views/AkteView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$11 = { class: "typed-folder-view akte-view" };
var _hoisted_2$8 = { class: "typed-folder-header" };
var _hoisted_3$5 = {
	key: 0,
	class: "typed-folder-aktz"
};
//#endregion
//#region src/views/AkteView.vue
var AkteView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ __mf_93({
	__name: "AkteView",
	emits: ["new-child"],
	setup(__props) {
		const resourcesStore = __mf_306();
		const { showAktzInName } = useFolderviewSettings();
		const fileRef = __mf_80(() => {
			const r = resourcesStore.currentFolder;
			return r ? getFileReference(r) : "";
		});
		return (_ctx, _cache) => {
			return __mf_132(), __mf_83$1("div", _hoisted_1$11, [__mf_84("div", _hoisted_2$8, [
				_cache[2] || (_cache[2] = __mf_84("span", { class: "typed-folder-type-badge akte" }, "Akte", -1)),
				fileRef.value && __mf_55(showAktzInName) ? (__mf_132(), __mf_83$1("span", _hoisted_3$5, __mf_61(fileRef.value), 1)) : __mf_82("", true),
				__mf_84("button", {
					class: "typed-action-btn",
					onClick: _cache[0] || (_cache[0] = ($event) => _ctx.$emit("new-child", "vorgang"))
				}, [..._cache[1] || (_cache[1] = [__mf_84("span", { class: "typed-action-icon" }, "+", -1), __mf_90(" Neuer Vorgang ", -1)])])
			]), __mf_139(_ctx.$slots, "default", {}, void 0, true)]);
		};
	}
}), [["__scopeId", "data-v-33620925"]]);
//#endregion
//#region src/views/VorgangView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$10 = { class: "typed-folder-view vorgang-view" };
var _hoisted_2$7 = { class: "typed-folder-header" };
var _hoisted_3$4 = {
	key: 0,
	class: "typed-folder-aktz"
};
//#endregion
//#region src/views/VorgangView.vue
var VorgangView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ __mf_93({
	__name: "VorgangView",
	emits: ["new-child"],
	setup(__props) {
		const resourcesStore = __mf_306();
		const { showAktzInName } = useFolderviewSettings();
		const fileRef = __mf_80(() => {
			const r = resourcesStore.currentFolder;
			return r ? getFileReference(r) : "";
		});
		return (_ctx, _cache) => {
			return __mf_132(), __mf_83$1("div", _hoisted_1$10, [__mf_84("div", _hoisted_2$7, [
				_cache[2] || (_cache[2] = __mf_84("span", { class: "typed-folder-type-badge vorgang" }, "Vorgang", -1)),
				fileRef.value && __mf_55(showAktzInName) ? (__mf_132(), __mf_83$1("span", _hoisted_3$4, __mf_61(fileRef.value), 1)) : __mf_82("", true),
				__mf_84("button", {
					class: "typed-action-btn",
					onClick: _cache[0] || (_cache[0] = ($event) => _ctx.$emit("new-child", "register"))
				}, [..._cache[1] || (_cache[1] = [__mf_84("span", { class: "typed-action-icon" }, "+", -1), __mf_90(" Neues Register ", -1)])])
			]), __mf_139(_ctx.$slots, "default", {}, void 0, true)]);
		};
	}
}), [["__scopeId", "data-v-067c0a42"]]);
//#endregion
//#region src/views/RegisterView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$9 = { class: "typed-folder-view register-view" };
var _hoisted_2$6 = { class: "typed-folder-header" };
var _hoisted_3$3 = {
	key: 0,
	class: "typed-folder-aktz"
};
//#endregion
//#region src/views/RegisterView.vue
var RegisterView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ __mf_93({
	__name: "RegisterView",
	setup(__props) {
		const resourcesStore = __mf_306();
		const { showAktzInName } = useFolderviewSettings();
		const fileRef = __mf_80(() => {
			const r = resourcesStore.currentFolder;
			return r ? getFileReference(r) : "";
		});
		return (_ctx, _cache) => {
			return __mf_132(), __mf_83$1("div", _hoisted_1$9, [__mf_84("div", _hoisted_2$6, [
				_cache[0] || (_cache[0] = __mf_84("span", { class: "typed-folder-type-badge register" }, "Register", -1)),
				fileRef.value && __mf_55(showAktzInName) ? (__mf_132(), __mf_83$1("span", _hoisted_3$3, __mf_61(fileRef.value), 1)) : __mf_82("", true),
				_cache[1] || (_cache[1] = __mf_84("span", { class: "typed-folder-hint" }, "Dokumente ablegen", -1))
			]), __mf_139(_ctx.$slots, "default", {}, void 0, true)]);
		};
	}
}), [["__scopeId", "data-v-3013caf1"]]);
//#endregion
//#region src/components/ResourceTree.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$8 = { class: "resource-tree" };
var _hoisted_2$5 = ["onClick"];
var _hoisted_3$2 = {
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
		dragDrop: { type: Boolean },
		headerPosition: {},
		sortBy: {},
		sortDir: {},
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
		selectedIds.value = [];
		const clientService = __mf_228();
		const { showAktzInName } = useFolderviewSettings();
		const expanded = __mf_45(/* @__PURE__ */ new Set());
		const childrenMap = __mf_45(/* @__PURE__ */ new Map());
		const loadingSet = __mf_45(/* @__PURE__ */ new Set());
		const depthMap = __mf_45(/* @__PURE__ */ new Map());
		function isExpanded(id) {
			return expanded.value.has(id);
		}
		function isLoading(id) {
			return loadingSet.value.has(id);
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
					const parentDepth = depthMap.value.get(id) || 0;
					const dm = new Map(depthMap.value);
					for (const c of children) dm.set(c.id, parentDepth + 1);
					depthMap.value = dm;
					childrenMap.value = new Map([...childrenMap.value, [id, children]]);
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
		const visibleResources = __mf_80(() => {
			const result = [];
			function walk(resources) {
				const sorted = [...resources.filter((r) => !r.name?.startsWith("_type_") && !r.name?.startsWith("."))].sort((a, b) => compareByDisplayName(a, b, showAktzInName.value));
				for (const r of sorted) {
					const display = displayName(r, showAktzInName.value);
					if (display !== r.name) result.push({
						...r,
						name: display
					});
					else result.push(r);
					if (r.type === "folder" && expanded.value.has(r.id) && childrenMap.value.has(r.id)) walk(childrenMap.value.get(r.id));
				}
			}
			const dm = new Map(depthMap.value);
			for (const r of props.resources) if (!dm.has(r.id)) dm.set(r.id, 0);
			depthMap.value = dm;
			walk(props.resources);
			return result;
		});
		__mf_161(() => props.resources, () => {
			expanded.value = /* @__PURE__ */ new Set();
			childrenMap.value = /* @__PURE__ */ new Map();
			depthMap.value = /* @__PURE__ */ new Map();
		});
		return (_ctx, _cache) => {
			const _component_oc_icon = __mf_140("oc-icon");
			const _component_oc_spinner = __mf_140("oc-spinner");
			return __mf_132(), __mf_83$1("div", _hoisted_1$8, [__mf_91$1(__mf_55(__mf_89), {
				"selected-ids": [],
				resources: visibleResources.value,
				"view-mode": "resource-table-condensed",
				space: __props.space,
				"header-position": __props.headerPosition,
				"sort-fields": [],
				onFileClick: handleFileClick,
				onSort: () => {}
			}, {
				image: __mf_166(({ resource }) => [
					__mf_84("span", {
						class: "tree-indent-block",
						style: __mf_60({
							width: depthMap.value.get(resource.id) * 20 + "px",
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
					}, null, 8, ["name"])], 8, _hoisted_2$5)) : (__mf_132(), __mf_83$1("span", _hoisted_3$2)),
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
				"resources",
				"space",
				"header-position"
			])]);
		};
	}
}), [["__scopeId", "data-v-a3b26904"]]);
//#endregion
//#region src/components/ResourceMetro.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$7 = { class: "metro-tile-label" };
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
		const { showAktzInName } = useFolderviewSettings();
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
				image: __mf_166(({ resource }) => [__mf_84("span", _hoisted_1$7, __mf_61(__mf_55(displayName)(resource, __mf_55(showAktzInName))), 1)]),
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
//#region src/composables/useContentLoader.ts
function useContentLoader(space, concurrency = 4) {
	const clientService = __mf_228();
	const cache = /* @__PURE__ */ new Map();
	const pending = /* @__PURE__ */ new Map();
	let active = 0;
	const queue = [];
	function drain() {
		while (active < concurrency && queue.length > 0) {
			const item = queue.shift();
			active++;
			doLoad(item.path, item.binary).then(item.resolve).catch(item.reject).finally(() => {
				active--;
				drain();
			});
		}
	}
	async function doLoad(path, binary) {
		const sp = space.value;
		const { body } = await clientService.webdav.getFileContents(sp, {
			path,
			...binary ? { responseType: "arrayBuffer" } : {}
		});
		const entry = {
			content: typeof body === "string" ? body : body,
			type: binary ? "binary" : "text"
		};
		cache.set(path, entry);
		pending.delete(path);
		return entry;
	}
	function loadContent(path, binary = false) {
		const cached = cache.get(path);
		if (cached) return Promise.resolve(cached);
		const inflight = pending.get(path);
		if (inflight) return inflight;
		const p = new Promise((resolve, reject) => {
			queue.push({
				path,
				binary,
				resolve,
				reject
			});
			drain();
		});
		pending.set(path, p);
		return p;
	}
	function clearCache() {
		cache.clear();
		pending.clear();
		queue.length = 0;
	}
	return {
		loadContent,
		clearCache
	};
}
//#endregion
//#region node_modules/.pnpm/marked@18.0.5/node_modules/marked/lib/marked.esm.js
/**
* marked v18.0.5 - a markdown parser
* Copyright (c) 2018-2026, MarkedJS. (MIT License)
* Copyright (c) 2011-2018, Christopher Jeffrey. (MIT License)
* https://github.com/markedjs/marked
*/
/**
* DO NOT EDIT THIS FILE
* The code in this file is generated from files in ./src/
*/
function M() {
	return {
		async: !1,
		breaks: !1,
		extensions: null,
		gfm: !0,
		hooks: null,
		pedantic: !1,
		renderer: null,
		silent: !1,
		tokenizer: null,
		walkTokens: null
	};
}
var T = M();
function N(l) {
	T = l;
}
var _ = { exec: () => null };
function E(l) {
	let e = [];
	return (t) => {
		let n = Math.max(0, Math.min(3, t - 1)), s = e[n];
		return s || (s = l(n), e[n] = s), s;
	};
}
function d(l, e = "") {
	let t = typeof l == "string" ? l : l.source, n = {
		replace: (s, r) => {
			let i = typeof r == "string" ? r : r.source;
			return i = i.replace(m.caret, "$1"), t = t.replace(s, i), n;
		},
		getRegex: () => new RegExp(t, e)
	};
	return n;
}
var Te = ((l = "") => {
	try {
		return !!new RegExp("(?<=1)(?<!1)" + l);
	} catch {
		return !1;
	}
})(), m = {
	codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm,
	outputLinkReplace: /\\([\[\]])/g,
	indentCodeCompensation: /^(\s+)(?:```)/,
	beginningSpace: /^\s+/,
	endingHash: /#$/,
	startingSpaceChar: /^ /,
	endingSpaceChar: / $/,
	nonSpaceChar: /[^ ]/,
	newLineCharGlobal: /\n/g,
	tabCharGlobal: /\t/g,
	multipleSpaceGlobal: /\s+/g,
	blankLine: /^[ \t]*$/,
	doubleBlankLine: /\n[ \t]*\n[ \t]*$/,
	blockquoteStart: /^ {0,3}>/,
	blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g,
	blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm,
	listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g,
	listIsTask: /^\[[ xX]\] +\S/,
	listReplaceTask: /^\[[ xX]\] +/,
	listTaskCheckbox: /\[[ xX]\]/,
	anyLine: /\n.*\n/,
	hrefBrackets: /^<(.*)>$/,
	tableDelimiter: /[:|]/,
	tableAlignChars: /^\||\| *$/g,
	tableRowBlankLine: /\n[ \t]*$/,
	tableAlignRight: /^ *-+: *$/,
	tableAlignCenter: /^ *:-+: *$/,
	tableAlignLeft: /^ *:-+ *$/,
	startATag: /^<a /i,
	endATag: /^<\/a>/i,
	startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i,
	endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i,
	startAngleBracket: /^</,
	endAngleBracket: />$/,
	pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/,
	unicodeAlphaNumeric: /[\p{L}\p{N}]/u,
	escapeTest: /[&<>"']/,
	escapeReplace: /[&<>"']/g,
	escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,
	escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
	caret: /(^|[^\[])\^/g,
	percentDecode: /%25/g,
	findPipe: /\|/g,
	splitPipe: / \|/,
	slashPipe: /\\\|/g,
	carriageReturn: /\r\n|\r/g,
	spaceLine: /^ +$/gm,
	notSpaceStart: /^\S*/,
	endingNewline: /\n$/,
	listItemRegex: (l) => new RegExp(`^( {0,3}${l})((?:[	 ][^\\n]*)?(?:\\n|$))`),
	nextBulletRegex: E((l) => new RegExp(`^ {0,${l}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`)),
	hrRegex: E((l) => new RegExp(`^ {0,${l}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`)),
	fencesBeginRegex: E((l) => new RegExp(`^ {0,${l}}(?:\`\`\`|~~~)`)),
	headingBeginRegex: E((l) => new RegExp(`^ {0,${l}}#`)),
	htmlBeginRegex: E((l) => new RegExp(`^ {0,${l}}<(?:[a-z].*>|!--)`, "i")),
	blockquoteBeginRegex: E((l) => new RegExp(`^ {0,${l}}>`))
}, Oe = /^(?:[ \t]*(?:\n|$))+/, we = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/, ye = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, B = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, Pe = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, j = / {0,3}(?:[*+-]|\d{1,9}[.)])/, oe = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/, ae = d(oe).replace(/bull/g, j).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex(), Se = d(oe).replace(/bull/g, j).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(), F = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, $e = /^[^\n]+/, U = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/, Le = d(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", U).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), _e = d(/^(bull)([ \t][^\n]*?)?(?:\n|$)/).replace(/bull/g, j).getRegex(), H = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", K = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, ze = d("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", K).replace("tag", H).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), le = d(F).replace("hr", B).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]+[^ \\t\\n]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", H).getRegex(), W = {
	blockquote: d(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", le).getRegex(),
	code: we,
	def: Le,
	fences: ye,
	heading: Pe,
	hr: B,
	html: ze,
	lheading: ae,
	list: _e,
	newline: Oe,
	paragraph: le,
	table: _,
	text: $e
}, se = d("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", B).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", H).getRegex(), Ee = {
	...W,
	lheading: Se,
	table: se,
	paragraph: d(F).replace("hr", B).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", se).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]+[^ \\t\\n]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", H).getRegex()
}, Ie = {
	...W,
	html: d(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", K).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
	def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
	heading: /^(#{1,6})(.*)(?:\n+|$)/,
	fences: _,
	lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
	paragraph: d(F).replace("hr", B).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", ae).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, Ae = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, Ce = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, ue = /^( {2,}|\\)\n(?!\s*$)/, Be = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, I = /[\p{P}\p{S}]/u, Z = /[\s\p{P}\p{S}]/u, X = /[^\s\p{P}\p{S}]/u, De = d(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, Z).getRegex(), pe = /(?!~)[\p{P}\p{S}]/u, qe = /(?!~)[\s\p{P}\p{S}]/u, ve = /(?:[^\s\p{P}\p{S}]|~)/u, He = d(/link|precode-code|html/, "g").replace("link", /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-", Te ? "(?<!`)()" : "(^^|[^`])").replace("code", /(?<b>`+)[^`]+\k<b>(?!`)/).replace("html", /<(?! )[^<>]*?>/).getRegex(), ce = /^(?:\*+(?:((?!\*)punct)|([^\s*]))?)|^_+(?:((?!_)punct)|([^\s_]))?/, Ze = d(ce, "u").replace(/punct/g, I).getRegex(), Ge = d(ce, "u").replace(/punct/g, pe).getRegex(), he = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)", Ne = d(he, "gu").replace(/notPunctSpace/g, X).replace(/punctSpace/g, Z).replace(/punct/g, I).getRegex(), Qe = d(he, "gu").replace(/notPunctSpace/g, ve).replace(/punctSpace/g, qe).replace(/punct/g, pe).getRegex(), je = d("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, X).replace(/punctSpace/g, Z).replace(/punct/g, I).getRegex(), Fe = d(/^~~?(?:((?!~)punct)|[^\s~])/, "u").replace(/punct/g, I).getRegex(), Ke = d("^[^~]+(?=[^~])|(?!~)punct(~~?)(?=[\\s]|$)|notPunctSpace(~~?)(?!~)(?=punctSpace|$)|(?!~)punctSpace(~~?)(?=notPunctSpace)|[\\s](~~?)(?!~)(?=punct)|(?!~)punct(~~?)(?!~)(?=punct)|notPunctSpace(~~?)(?=notPunctSpace)", "gu").replace(/notPunctSpace/g, X).replace(/punctSpace/g, Z).replace(/punct/g, I).getRegex(), We = d(/\\(punct)/, "gu").replace(/punct/g, I).getRegex(), Xe = d(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), Je = d(K).replace("(?:-->|$)", "-->").getRegex(), Ve = d("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", Je).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), v = /(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\])|[^\[\]\\`])*?/, Ye = d(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]+(?:\n[ \t]*)?|\n[ \t]*)(title))?\s*\)/).replace("label", v).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), ke = d(/^!?\[(label)\]\[(ref)\]/).replace("label", v).replace("ref", U).getRegex(), de = d(/^!?\[(ref)\](?:\[\])?/).replace("ref", U).getRegex(), et = d("reflink|nolink(?!\\()", "g").replace("reflink", ke).replace("nolink", de).getRegex(), ie = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/, J = {
	_backpedal: _,
	anyPunctuation: We,
	autolink: Xe,
	blockSkip: He,
	br: ue,
	code: Ce,
	del: _,
	delLDelim: _,
	delRDelim: _,
	emStrongLDelim: Ze,
	emStrongRDelimAst: Ne,
	emStrongRDelimUnd: je,
	escape: Ae,
	link: Ye,
	nolink: de,
	punctuation: De,
	reflink: ke,
	reflinkSearch: et,
	tag: Ve,
	text: Be,
	url: _
}, tt = {
	...J,
	link: d(/^!?\[(label)\]\((.*?)\)/).replace("label", v).getRegex(),
	reflink: d(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", v).getRegex()
}, Q = {
	...J,
	emStrongRDelimAst: Qe,
	emStrongLDelim: Ge,
	delLDelim: Fe,
	delRDelim: Ke,
	url: d(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol", ie).replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
	_backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
	del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,
	text: d(/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol", ie).getRegex()
}, nt = {
	...Q,
	br: d(ue).replace("{2,}", "*").getRegex(),
	text: d(Q.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, D = {
	normal: W,
	gfm: Ee,
	pedantic: Ie
}, A = {
	normal: J,
	gfm: Q,
	breaks: nt,
	pedantic: tt
};
var rt = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
}, ge = (l) => rt[l];
function O(l, e) {
	if (e) {
		if (m.escapeTest.test(l)) return l.replace(m.escapeReplace, ge);
	} else if (m.escapeTestNoEncode.test(l)) return l.replace(m.escapeReplaceNoEncode, ge);
	return l;
}
function V(l) {
	try {
		l = encodeURI(l).replace(m.percentDecode, "%");
	} catch {
		return null;
	}
	return l;
}
function Y(l, e) {
	let n = l.replace(m.findPipe, (r, i, o) => {
		let u = !1, a = i;
		for (; --a >= 0 && o[a] === "\\";) u = !u;
		return u ? "|" : " |";
	}).split(m.splitPipe), s = 0;
	if (n[0].trim() || n.shift(), n.length > 0 && !n.at(-1)?.trim() && n.pop(), e) if (n.length > e) n.splice(e);
	else for (; n.length < e;) n.push("");
	for (; s < n.length; s++) n[s] = n[s].trim().replace(m.slashPipe, "|");
	return n;
}
function $(l, e, t) {
	let n = l.length;
	if (n === 0) return "";
	let s = 0;
	for (; s < n;) {
		let r = l.charAt(n - s - 1);
		if (r === e && !t) s++;
		else if (r !== e && t) s++;
		else break;
	}
	return l.slice(0, n - s);
}
function ee(l) {
	let e = l.split(`
`), t = e.length - 1;
	for (; t >= 0 && m.blankLine.test(e[t]);) t--;
	return e.length - t <= 2 ? l : e.slice(0, t + 1).join(`
`);
}
function fe(l, e) {
	if (l.indexOf(e[1]) === -1) return -1;
	let t = 0;
	for (let n = 0; n < l.length; n++) if (l[n] === "\\") n++;
	else if (l[n] === e[0]) t++;
	else if (l[n] === e[1] && (t--, t < 0)) return n;
	return t > 0 ? -2 : -1;
}
function me(l, e = 0) {
	let t = e, n = "";
	for (let s of l) if (s === "	") {
		let r = 4 - t % 4;
		n += " ".repeat(r), t += r;
	} else n += s, t++;
	return n;
}
function xe(l, e, t, n, s) {
	let r = e.href, i = e.title || null, o = l[1].replace(s.other.outputLinkReplace, "$1");
	n.state.inLink = !0;
	let u = {
		type: l[0].charAt(0) === "!" ? "image" : "link",
		raw: t,
		href: r,
		title: i,
		text: o,
		tokens: n.inlineTokens(o)
	};
	return n.state.inLink = !1, u;
}
function st(l, e, t) {
	let n = l.match(t.other.indentCodeCompensation);
	if (n === null) return e;
	let s = n[1];
	return e.split(`
`).map((r) => {
		let i = r.match(t.other.beginningSpace);
		if (i === null) return r;
		let [o] = i;
		return o.length >= s.length ? r.slice(s.length) : r;
	}).join(`
`);
}
var w = class {
	options;
	rules;
	lexer;
	constructor(e) {
		this.options = e || T;
	}
	space(e) {
		let t = this.rules.block.newline.exec(e);
		if (t && t[0].length > 0) return {
			type: "space",
			raw: t[0]
		};
	}
	code(e) {
		let t = this.rules.block.code.exec(e);
		if (t) {
			let n = this.options.pedantic ? t[0] : ee(t[0]);
			return {
				type: "code",
				raw: n,
				codeBlockStyle: "indented",
				text: n.replace(this.rules.other.codeRemoveIndent, "")
			};
		}
	}
	fences(e) {
		let t = this.rules.block.fences.exec(e);
		if (t) {
			let n = t[0], s = st(n, t[3] || "", this.rules);
			return {
				type: "code",
				raw: n,
				lang: t[2] ? t[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t[2],
				text: s
			};
		}
	}
	heading(e) {
		let t = this.rules.block.heading.exec(e);
		if (t) {
			let n = t[2].trim();
			if (this.rules.other.endingHash.test(n)) {
				let s = $(n, "#");
				(this.options.pedantic || !s || this.rules.other.endingSpaceChar.test(s)) && (n = s.trim());
			}
			return {
				type: "heading",
				raw: $(t[0], `
`),
				depth: t[1].length,
				text: n,
				tokens: this.lexer.inline(n)
			};
		}
	}
	hr(e) {
		let t = this.rules.block.hr.exec(e);
		if (t) return {
			type: "hr",
			raw: $(t[0], `
`)
		};
	}
	blockquote(e) {
		let t = this.rules.block.blockquote.exec(e);
		if (t) {
			let n = $(t[0], `
`).split(`
`), s = "", r = "", i = [];
			for (; n.length > 0;) {
				let o = !1, u = [], a;
				for (a = 0; a < n.length; a++) if (this.rules.other.blockquoteStart.test(n[a])) u.push(n[a]), o = !0;
				else if (!o) u.push(n[a]);
				else break;
				n = n.slice(a);
				let c = u.join(`
`), p = c.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
				s = s ? `${s}
${c}` : c, r = r ? `${r}
${p}` : p;
				let k = this.lexer.state.top;
				if (this.lexer.state.top = !0, this.lexer.blockTokens(p, i, !0), this.lexer.state.top = k, n.length === 0) break;
				let h = i.at(-1);
				if (h?.type === "code") break;
				if (h?.type === "blockquote") {
					let R = h, f = R.raw + `
` + n.join(`
`), S = this.blockquote(f);
					i[i.length - 1] = S, s = s.substring(0, s.length - R.raw.length) + S.raw, r = r.substring(0, r.length - R.text.length) + S.text;
					break;
				} else if (h?.type === "list") {
					let R = h, f = R.raw + `
` + n.join(`
`), S = this.list(f);
					i[i.length - 1] = S, s = s.substring(0, s.length - h.raw.length) + S.raw, r = r.substring(0, r.length - R.raw.length) + S.raw, n = f.substring(i.at(-1).raw.length).split(`
`);
					continue;
				}
			}
			return {
				type: "blockquote",
				raw: s,
				tokens: i,
				text: r
			};
		}
	}
	list(e) {
		let t = this.rules.block.list.exec(e);
		if (t) {
			let n = t[1].trim(), s = n.length > 1, r = {
				type: "list",
				raw: "",
				ordered: s,
				start: s ? +n.slice(0, -1) : "",
				loose: !1,
				items: []
			};
			n = s ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`, this.options.pedantic && (n = s ? n : "[*+-]");
			let i = this.rules.other.listItemRegex(n), o = !1;
			for (; e;) {
				let a = !1, c = "", p = "";
				if (!(t = i.exec(e)) || this.rules.block.hr.test(e)) break;
				c = t[0], e = e.substring(c.length);
				let k = me(t[2].split(`
`, 1)[0], t[1].length), h = e.split(`
`, 1)[0], R = !k.trim(), f = 0;
				if (this.options.pedantic ? (f = 2, p = k.trimStart()) : R ? f = t[1].length + 1 : (f = k.search(this.rules.other.nonSpaceChar), f = f > 4 ? 1 : f, p = k.slice(f), f += t[1].length), R && this.rules.other.blankLine.test(h) && (c += h + `
`, e = e.substring(h.length + 1), a = !0), !a) {
					let S = this.rules.other.nextBulletRegex(f), te = this.rules.other.hrRegex(f), ne = this.rules.other.fencesBeginRegex(f), re = this.rules.other.headingBeginRegex(f), be = this.rules.other.htmlBeginRegex(f), Re = this.rules.other.blockquoteBeginRegex(f);
					for (; e;) {
						let G = e.split(`
`, 1)[0], C;
						if (h = G, this.options.pedantic ? (h = h.replace(this.rules.other.listReplaceNesting, "  "), C = h) : C = h.replace(this.rules.other.tabCharGlobal, "    "), ne.test(h) || re.test(h) || be.test(h) || Re.test(h) || S.test(h) || te.test(h)) break;
						if (C.search(this.rules.other.nonSpaceChar) >= f || !h.trim()) p += `
` + C.slice(f);
						else {
							if (R || k.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || ne.test(k) || re.test(k) || te.test(k)) break;
							p += `
` + h;
						}
						R = !h.trim(), c += G + `
`, e = e.substring(G.length + 1), k = C.slice(f);
					}
				}
				r.loose || (o ? r.loose = !0 : this.rules.other.doubleBlankLine.test(c) && (o = !0)), r.items.push({
					type: "list_item",
					raw: c,
					task: !!this.options.gfm && this.rules.other.listIsTask.test(p),
					loose: !1,
					text: p,
					tokens: []
				}), r.raw += c;
			}
			let u = r.items.at(-1);
			if (u) u.raw = u.raw.trimEnd(), u.text = u.text.trimEnd();
			else return;
			r.raw = r.raw.trimEnd();
			for (let a of r.items) {
				this.lexer.state.top = !1, a.tokens = this.lexer.blockTokens(a.text, []);
				let c = a.tokens[0];
				if (a.task && (c?.type === "text" || c?.type === "paragraph")) {
					a.text = a.text.replace(this.rules.other.listReplaceTask, ""), c.raw = c.raw.replace(this.rules.other.listReplaceTask, ""), c.text = c.text.replace(this.rules.other.listReplaceTask, "");
					for (let k = this.lexer.inlineQueue.length - 1; k >= 0; k--) if (this.rules.other.listIsTask.test(this.lexer.inlineQueue[k].src)) {
						this.lexer.inlineQueue[k].src = this.lexer.inlineQueue[k].src.replace(this.rules.other.listReplaceTask, "");
						break;
					}
					let p = this.rules.other.listTaskCheckbox.exec(a.raw);
					if (p) {
						let k = {
							type: "checkbox",
							raw: p[0] + " ",
							checked: p[0] !== "[ ]"
						};
						a.checked = k.checked, r.loose ? a.tokens[0] && ["paragraph", "text"].includes(a.tokens[0].type) && "tokens" in a.tokens[0] && a.tokens[0].tokens ? (a.tokens[0].raw = k.raw + a.tokens[0].raw, a.tokens[0].text = k.raw + a.tokens[0].text, a.tokens[0].tokens.unshift(k)) : a.tokens.unshift({
							type: "paragraph",
							raw: k.raw,
							text: k.raw,
							tokens: [k]
						}) : a.tokens.unshift(k);
					}
				} else a.task && (a.task = !1);
				if (!r.loose) {
					let p = a.tokens.filter((h) => h.type === "space");
					r.loose = p.length > 0 && p.some((h) => this.rules.other.anyLine.test(h.raw));
				}
			}
			if (r.loose) for (let a of r.items) {
				a.loose = !0;
				for (let c of a.tokens) c.type === "text" && (c.type = "paragraph");
			}
			return r;
		}
	}
	html(e) {
		let t = this.rules.block.html.exec(e);
		if (t) {
			let n = ee(t[0]);
			return {
				type: "html",
				block: !0,
				raw: n,
				pre: t[1] === "pre" || t[1] === "script" || t[1] === "style",
				text: n
			};
		}
	}
	def(e) {
		let t = this.rules.block.def.exec(e);
		if (t) {
			let n = t[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " "), s = t[2] ? t[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", r = t[3] ? t[3].substring(1, t[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t[3];
			return {
				type: "def",
				tag: n,
				raw: $(t[0], `
`),
				href: s,
				title: r
			};
		}
	}
	table(e) {
		let t = this.rules.block.table.exec(e);
		if (!t || !this.rules.other.tableDelimiter.test(t[2])) return;
		let n = Y(t[1]), s = t[2].replace(this.rules.other.tableAlignChars, "").split("|"), r = t[3]?.trim() ? t[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [], i = {
			type: "table",
			raw: $(t[0], `
`),
			header: [],
			align: [],
			rows: []
		};
		if (n.length === s.length) {
			for (let o of s) this.rules.other.tableAlignRight.test(o) ? i.align.push("right") : this.rules.other.tableAlignCenter.test(o) ? i.align.push("center") : this.rules.other.tableAlignLeft.test(o) ? i.align.push("left") : i.align.push(null);
			for (let o = 0; o < n.length; o++) i.header.push({
				text: n[o],
				tokens: this.lexer.inline(n[o]),
				header: !0,
				align: i.align[o]
			});
			for (let o of r) i.rows.push(Y(o, i.header.length).map((u, a) => ({
				text: u,
				tokens: this.lexer.inline(u),
				header: !1,
				align: i.align[a]
			})));
			return i;
		}
	}
	lheading(e) {
		let t = this.rules.block.lheading.exec(e);
		if (t) {
			let n = t[1].trim();
			return {
				type: "heading",
				raw: $(t[0], `
`),
				depth: t[2].charAt(0) === "=" ? 1 : 2,
				text: n,
				tokens: this.lexer.inline(n)
			};
		}
	}
	paragraph(e) {
		let t = this.rules.block.paragraph.exec(e);
		if (t) {
			let n = t[1].charAt(t[1].length - 1) === `
` ? t[1].slice(0, -1) : t[1];
			return {
				type: "paragraph",
				raw: t[0],
				text: n,
				tokens: this.lexer.inline(n)
			};
		}
	}
	text(e) {
		let t = this.rules.block.text.exec(e);
		if (t) return {
			type: "text",
			raw: t[0],
			text: t[0],
			tokens: this.lexer.inline(t[0])
		};
	}
	escape(e) {
		let t = this.rules.inline.escape.exec(e);
		if (t) return {
			type: "escape",
			raw: t[0],
			text: t[1]
		};
	}
	tag(e) {
		let t = this.rules.inline.tag.exec(e);
		if (t) return !this.lexer.state.inLink && this.rules.other.startATag.test(t[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && this.rules.other.endATag.test(t[0]) && (this.lexer.state.inLink = !1), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(t[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(t[0]) && (this.lexer.state.inRawBlock = !1), {
			type: "html",
			raw: t[0],
			inLink: this.lexer.state.inLink,
			inRawBlock: this.lexer.state.inRawBlock,
			block: !1,
			text: t[0]
		};
	}
	link(e) {
		let t = this.rules.inline.link.exec(e);
		if (t) {
			let n = t[2].trim();
			if (!this.options.pedantic && this.rules.other.startAngleBracket.test(n)) {
				if (!this.rules.other.endAngleBracket.test(n)) return;
				let i = $(n.slice(0, -1), "\\");
				if ((n.length - i.length) % 2 === 0) return;
			} else {
				let i = fe(t[2], "()");
				if (i === -2) return;
				if (i > -1) {
					let u = (t[0].indexOf("!") === 0 ? 5 : 4) + t[1].length + i;
					t[2] = t[2].substring(0, i), t[0] = t[0].substring(0, u).trim(), t[3] = "";
				}
			}
			let s = t[2], r = "";
			if (this.options.pedantic) {
				let i = this.rules.other.pedanticHrefTitle.exec(s);
				i && (s = i[1], r = i[3]);
			} else r = t[3] ? t[3].slice(1, -1) : "";
			return s = s.trim(), this.rules.other.startAngleBracket.test(s) && (this.options.pedantic && !this.rules.other.endAngleBracket.test(n) ? s = s.slice(1) : s = s.slice(1, -1)), xe(t, {
				href: s && s.replace(this.rules.inline.anyPunctuation, "$1"),
				title: r && r.replace(this.rules.inline.anyPunctuation, "$1")
			}, t[0], this.lexer, this.rules);
		}
	}
	reflink(e, t) {
		let n;
		if ((n = this.rules.inline.reflink.exec(e)) || (n = this.rules.inline.nolink.exec(e))) {
			let r = t[(n[2] || n[1]).replace(this.rules.other.multipleSpaceGlobal, " ").toLowerCase()];
			if (!r) {
				let i = n[0].charAt(0);
				return {
					type: "text",
					raw: i,
					text: i
				};
			}
			return xe(n, r, n[0], this.lexer, this.rules);
		}
	}
	emStrong(e, t, n = "") {
		let s = this.rules.inline.emStrongLDelim.exec(e);
		if (!s || !s[1] && !s[2] && !s[3] && !s[4] || s[4] && n.match(this.rules.other.unicodeAlphaNumeric)) return;
		if (!(s[1] || s[3] || "") || !n || this.rules.inline.punctuation.exec(n)) {
			let i = [...s[0]].length - 1, o, u, a = i, c = 0, p = s[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
			for (p.lastIndex = 0, t = t.slice(-1 * e.length + i); (s = p.exec(t)) !== null;) {
				if (o = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !o) continue;
				if (u = [...o].length, s[3] || s[4]) {
					a += u;
					continue;
				} else if ((s[5] || s[6]) && i % 3 && !((i + u) % 3)) {
					c += u;
					continue;
				}
				if (a -= u, a > 0) continue;
				u = Math.min(u, u + a + c);
				let k = [...s[0]][0].length, h = e.slice(0, i + s.index + k + u);
				if (Math.min(i, u) % 2) {
					let f = h.slice(1, -1);
					return {
						type: "em",
						raw: h,
						text: f,
						tokens: this.lexer.inlineTokens(f)
					};
				}
				let R = h.slice(2, -2);
				return {
					type: "strong",
					raw: h,
					text: R,
					tokens: this.lexer.inlineTokens(R)
				};
			}
		}
	}
	codespan(e) {
		let t = this.rules.inline.code.exec(e);
		if (t) {
			let n = t[2].replace(this.rules.other.newLineCharGlobal, " "), s = this.rules.other.nonSpaceChar.test(n), r = this.rules.other.startingSpaceChar.test(n) && this.rules.other.endingSpaceChar.test(n);
			return s && r && (n = n.substring(1, n.length - 1)), {
				type: "codespan",
				raw: t[0],
				text: n
			};
		}
	}
	br(e) {
		let t = this.rules.inline.br.exec(e);
		if (t) return {
			type: "br",
			raw: t[0]
		};
	}
	del(e, t, n = "") {
		let s = this.rules.inline.delLDelim.exec(e);
		if (!s) return;
		if (!(s[1] || "") || !n || this.rules.inline.punctuation.exec(n)) {
			let i = [...s[0]].length - 1, o, u, a = i, c = this.rules.inline.delRDelim;
			for (c.lastIndex = 0, t = t.slice(-1 * e.length + i); (s = c.exec(t)) !== null;) {
				if (o = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !o || (u = [...o].length, u !== i)) continue;
				if (s[3] || s[4]) {
					a += u;
					continue;
				}
				if (a -= u, a > 0) continue;
				u = Math.min(u, u + a);
				let p = [...s[0]][0].length, k = e.slice(0, i + s.index + p + u), h = k.slice(i, -i);
				return {
					type: "del",
					raw: k,
					text: h,
					tokens: this.lexer.inlineTokens(h)
				};
			}
		}
	}
	autolink(e) {
		let t = this.rules.inline.autolink.exec(e);
		if (t) {
			let n, s;
			return t[2] === "@" ? (n = t[1], s = "mailto:" + n) : (n = t[1], s = n), {
				type: "link",
				raw: t[0],
				text: n,
				href: s,
				tokens: [{
					type: "text",
					raw: n,
					text: n
				}]
			};
		}
	}
	url(e) {
		let t;
		if (t = this.rules.inline.url.exec(e)) {
			let n, s;
			if (t[2] === "@") n = t[0], s = "mailto:" + n;
			else {
				let r;
				do
					r = t[0], t[0] = this.rules.inline._backpedal.exec(t[0])?.[0] ?? "";
				while (r !== t[0]);
				n = t[0], t[1] === "www." ? s = "http://" + t[0] : s = t[0];
			}
			return {
				type: "link",
				raw: t[0],
				text: n,
				href: s,
				tokens: [{
					type: "text",
					raw: n,
					text: n
				}]
			};
		}
	}
	inlineText(e) {
		let t = this.rules.inline.text.exec(e);
		if (t) {
			let n = this.lexer.state.inRawBlock;
			return {
				type: "text",
				raw: t[0],
				text: t[0],
				escaped: n
			};
		}
	}
};
var x = class l {
	tokens;
	options;
	state;
	inlineQueue;
	tokenizer;
	constructor(e) {
		this.tokens = [], this.tokens.links = Object.create(null), this.options = e || T, this.options.tokenizer = this.options.tokenizer || new w(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
			inLink: !1,
			inRawBlock: !1,
			top: !0
		};
		let t = {
			other: m,
			block: D.normal,
			inline: A.normal
		};
		this.options.pedantic ? (t.block = D.pedantic, t.inline = A.pedantic) : this.options.gfm && (t.block = D.gfm, this.options.breaks ? t.inline = A.breaks : t.inline = A.gfm), this.tokenizer.rules = t;
	}
	static get rules() {
		return {
			block: D,
			inline: A
		};
	}
	static lex(e, t) {
		return new l(t).lex(e);
	}
	static lexInline(e, t) {
		return new l(t).inlineTokens(e);
	}
	lex(e) {
		e = e.replace(m.carriageReturn, `
`), this.blockTokens(e, this.tokens);
		for (let t = 0; t < this.inlineQueue.length; t++) {
			let n = this.inlineQueue[t];
			this.inlineTokens(n.src, n.tokens);
		}
		return this.inlineQueue = [], this.tokens;
	}
	blockTokens(e, t = [], n = !1) {
		this.tokenizer.lexer = this, this.options.pedantic && (e = e.replace(m.tabCharGlobal, "    ").replace(m.spaceLine, ""));
		let s = Infinity;
		for (; e;) {
			if (e.length < s) s = e.length;
			else {
				this.infiniteLoopError(e.charCodeAt(0));
				break;
			}
			let r;
			if (this.options.extensions?.block?.some((o) => (r = o.call({ lexer: this }, e, t)) ? (e = e.substring(r.raw.length), t.push(r), !0) : !1)) continue;
			if (r = this.tokenizer.space(e)) {
				e = e.substring(r.raw.length);
				let o = t.at(-1);
				r.raw.length === 1 && o !== void 0 ? o.raw += `
` : t.push(r);
				continue;
			}
			if (r = this.tokenizer.code(e)) {
				e = e.substring(r.raw.length);
				let o = t.at(-1);
				o?.type === "paragraph" || o?.type === "text" ? (o.raw += (o.raw.endsWith(`
`) ? "" : `
`) + r.raw, o.text += `
` + r.text, this.inlineQueue.at(-1).src = o.text) : t.push(r);
				continue;
			}
			if (r = this.tokenizer.fences(e)) {
				e = e.substring(r.raw.length), t.push(r);
				continue;
			}
			if (r = this.tokenizer.heading(e)) {
				e = e.substring(r.raw.length), t.push(r);
				continue;
			}
			if (r = this.tokenizer.hr(e)) {
				e = e.substring(r.raw.length), t.push(r);
				continue;
			}
			if (r = this.tokenizer.blockquote(e)) {
				e = e.substring(r.raw.length), t.push(r);
				continue;
			}
			if (r = this.tokenizer.list(e)) {
				e = e.substring(r.raw.length), t.push(r);
				continue;
			}
			if (r = this.tokenizer.html(e)) {
				e = e.substring(r.raw.length), t.push(r);
				continue;
			}
			if (r = this.tokenizer.def(e)) {
				e = e.substring(r.raw.length);
				let o = t.at(-1);
				o?.type === "paragraph" || o?.type === "text" ? (o.raw += (o.raw.endsWith(`
`) ? "" : `
`) + r.raw, o.text += `
` + r.raw, this.inlineQueue.at(-1).src = o.text) : this.tokens.links[r.tag] || (this.tokens.links[r.tag] = {
					href: r.href,
					title: r.title
				}, t.push(r));
				continue;
			}
			if (r = this.tokenizer.table(e)) {
				e = e.substring(r.raw.length), t.push(r);
				continue;
			}
			if (r = this.tokenizer.lheading(e)) {
				e = e.substring(r.raw.length), t.push(r);
				continue;
			}
			let i = e;
			if (this.options.extensions?.startBlock) {
				let o = Infinity, u = e.slice(1), a;
				this.options.extensions.startBlock.forEach((c) => {
					a = c.call({ lexer: this }, u), typeof a == "number" && a >= 0 && (o = Math.min(o, a));
				}), o < Infinity && o >= 0 && (i = e.substring(0, o + 1));
			}
			if (this.state.top && (r = this.tokenizer.paragraph(i))) {
				let o = t.at(-1);
				n && o?.type === "paragraph" ? (o.raw += (o.raw.endsWith(`
`) ? "" : `
`) + r.raw, o.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = o.text) : t.push(r), n = i.length !== e.length, e = e.substring(r.raw.length);
				continue;
			}
			if (r = this.tokenizer.text(e)) {
				e = e.substring(r.raw.length);
				let o = t.at(-1);
				o?.type === "text" ? (o.raw += (o.raw.endsWith(`
`) ? "" : `
`) + r.raw, o.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = o.text) : t.push(r);
				continue;
			}
			if (e) {
				this.infiniteLoopError(e.charCodeAt(0));
				break;
			}
		}
		return this.state.top = !0, t;
	}
	inline(e, t = []) {
		return this.inlineQueue.push({
			src: e,
			tokens: t
		}), t;
	}
	inlineTokens(e, t = []) {
		this.tokenizer.lexer = this;
		let n = e, s = null;
		if (this.tokens.links) {
			let a = Object.keys(this.tokens.links);
			if (a.length > 0) for (; (s = this.tokenizer.rules.inline.reflinkSearch.exec(n)) !== null;) a.includes(s[0].slice(s[0].lastIndexOf("[") + 1, -1)) && (n = n.slice(0, s.index) + "[" + "a".repeat(s[0].length - 2) + "]" + n.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
		}
		for (; (s = this.tokenizer.rules.inline.anyPunctuation.exec(n)) !== null;) n = n.slice(0, s.index) + "++" + n.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
		let r;
		for (; (s = this.tokenizer.rules.inline.blockSkip.exec(n)) !== null;) r = s[2] ? s[2].length : 0, n = n.slice(0, s.index + r) + "[" + "a".repeat(s[0].length - r - 2) + "]" + n.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
		n = this.options.hooks?.emStrongMask?.call({ lexer: this }, n) ?? n;
		let i = !1, o = "", u = Infinity;
		for (; e;) {
			if (e.length < u) u = e.length;
			else {
				this.infiniteLoopError(e.charCodeAt(0));
				break;
			}
			i || (o = ""), i = !1;
			let a;
			if (this.options.extensions?.inline?.some((p) => (a = p.call({ lexer: this }, e, t)) ? (e = e.substring(a.raw.length), t.push(a), !0) : !1)) continue;
			if (a = this.tokenizer.escape(e)) {
				e = e.substring(a.raw.length), t.push(a);
				continue;
			}
			if (a = this.tokenizer.tag(e)) {
				e = e.substring(a.raw.length), t.push(a);
				continue;
			}
			if (a = this.tokenizer.link(e)) {
				e = e.substring(a.raw.length), t.push(a);
				continue;
			}
			if (a = this.tokenizer.reflink(e, this.tokens.links)) {
				e = e.substring(a.raw.length);
				let p = t.at(-1);
				a.type === "text" && p?.type === "text" ? (p.raw += a.raw, p.text += a.text) : t.push(a);
				continue;
			}
			if (a = this.tokenizer.emStrong(e, n, o)) {
				e = e.substring(a.raw.length), t.push(a);
				continue;
			}
			if (a = this.tokenizer.codespan(e)) {
				e = e.substring(a.raw.length), t.push(a);
				continue;
			}
			if (a = this.tokenizer.br(e)) {
				e = e.substring(a.raw.length), t.push(a);
				continue;
			}
			if (a = this.tokenizer.del(e, n, o)) {
				e = e.substring(a.raw.length), t.push(a);
				continue;
			}
			if (a = this.tokenizer.autolink(e)) {
				e = e.substring(a.raw.length), t.push(a);
				continue;
			}
			if (!this.state.inLink && (a = this.tokenizer.url(e))) {
				e = e.substring(a.raw.length), t.push(a);
				continue;
			}
			let c = e;
			if (this.options.extensions?.startInline) {
				let p = Infinity, k = e.slice(1), h;
				this.options.extensions.startInline.forEach((R) => {
					h = R.call({ lexer: this }, k), typeof h == "number" && h >= 0 && (p = Math.min(p, h));
				}), p < Infinity && p >= 0 && (c = e.substring(0, p + 1));
			}
			if (a = this.tokenizer.inlineText(c)) {
				e = e.substring(a.raw.length), a.raw.slice(-1) !== "_" && (o = a.raw.slice(-1)), i = !0;
				let p = t.at(-1);
				p?.type === "text" ? (p.raw += a.raw, p.text += a.text) : t.push(a);
				continue;
			}
			if (e) {
				this.infiniteLoopError(e.charCodeAt(0));
				break;
			}
		}
		return t;
	}
	infiniteLoopError(e) {
		let t = "Infinite loop on byte: " + e;
		if (this.options.silent) console.error(t);
		else throw new Error(t);
	}
};
var y = class {
	options;
	parser;
	constructor(e) {
		this.options = e || T;
	}
	space(e) {
		return "";
	}
	code({ text: e, lang: t, escaped: n }) {
		let s = (t || "").match(m.notSpaceStart)?.[0], r = e.replace(m.endingNewline, "") + `
`;
		return s ? "<pre><code class=\"language-" + O(s) + "\">" + (n ? r : O(r, !0)) + `</code></pre>
` : "<pre><code>" + (n ? r : O(r, !0)) + `</code></pre>
`;
	}
	blockquote({ tokens: e }) {
		return `<blockquote>
${this.parser.parse(e)}</blockquote>
`;
	}
	html({ text: e }) {
		return e;
	}
	def(e) {
		return "";
	}
	heading({ tokens: e, depth: t }) {
		return `<h${t}>${this.parser.parseInline(e)}</h${t}>
`;
	}
	hr(e) {
		return `<hr>
`;
	}
	list(e) {
		let t = e.ordered, n = e.start, s = "";
		for (let o = 0; o < e.items.length; o++) {
			let u = e.items[o];
			s += this.listitem(u);
		}
		let r = t ? "ol" : "ul", i = t && n !== 1 ? " start=\"" + n + "\"" : "";
		return "<" + r + i + `>
` + s + "</" + r + `>
`;
	}
	listitem(e) {
		return `<li>${this.parser.parse(e.tokens)}</li>
`;
	}
	checkbox({ checked: e }) {
		return "<input " + (e ? "checked=\"\" " : "") + "disabled=\"\" type=\"checkbox\"> ";
	}
	paragraph({ tokens: e }) {
		return `<p>${this.parser.parseInline(e)}</p>
`;
	}
	table(e) {
		let t = "", n = "";
		for (let r = 0; r < e.header.length; r++) n += this.tablecell(e.header[r]);
		t += this.tablerow({ text: n });
		let s = "";
		for (let r = 0; r < e.rows.length; r++) {
			let i = e.rows[r];
			n = "";
			for (let o = 0; o < i.length; o++) n += this.tablecell(i[o]);
			s += this.tablerow({ text: n });
		}
		return s && (s = `<tbody>${s}</tbody>`), `<table>
<thead>
` + t + `</thead>
` + s + `</table>
`;
	}
	tablerow({ text: e }) {
		return `<tr>
${e}</tr>
`;
	}
	tablecell(e) {
		let t = this.parser.parseInline(e.tokens), n = e.header ? "th" : "td";
		return (e.align ? `<${n} align="${e.align}">` : `<${n}>`) + t + `</${n}>
`;
	}
	strong({ tokens: e }) {
		return `<strong>${this.parser.parseInline(e)}</strong>`;
	}
	em({ tokens: e }) {
		return `<em>${this.parser.parseInline(e)}</em>`;
	}
	codespan({ text: e }) {
		return `<code>${O(e, !0)}</code>`;
	}
	br(e) {
		return "<br>";
	}
	del({ tokens: e }) {
		return `<del>${this.parser.parseInline(e)}</del>`;
	}
	link({ href: e, title: t, tokens: n }) {
		let s = this.parser.parseInline(n), r = V(e);
		if (r === null) return s;
		e = r;
		let i = "<a href=\"" + e + "\"";
		return t && (i += " title=\"" + O(t) + "\""), i += ">" + s + "</a>", i;
	}
	image({ href: e, title: t, text: n, tokens: s }) {
		s && (n = this.parser.parseInline(s, this.parser.textRenderer));
		let r = V(e);
		if (r === null) return O(n);
		e = r;
		let i = `<img src="${e}" alt="${O(n)}"`;
		return t && (i += ` title="${O(t)}"`), i += ">", i;
	}
	text(e) {
		return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : "escaped" in e && e.escaped ? e.text : O(e.text);
	}
};
var L = class {
	strong({ text: e }) {
		return e;
	}
	em({ text: e }) {
		return e;
	}
	codespan({ text: e }) {
		return e;
	}
	del({ text: e }) {
		return e;
	}
	html({ text: e }) {
		return e;
	}
	text({ text: e }) {
		return e;
	}
	link({ text: e }) {
		return "" + e;
	}
	image({ text: e }) {
		return "" + e;
	}
	br() {
		return "";
	}
	checkbox({ raw: e }) {
		return e;
	}
};
var b = class l {
	options;
	renderer;
	textRenderer;
	constructor(e) {
		this.options = e || T, this.options.renderer = this.options.renderer || new y(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new L();
	}
	static parse(e, t) {
		return new l(t).parse(e);
	}
	static parseInline(e, t) {
		return new l(t).parseInline(e);
	}
	parse(e) {
		this.renderer.parser = this;
		let t = "";
		for (let n = 0; n < e.length; n++) {
			let s = e[n];
			if (this.options.extensions?.renderers?.[s.type]) {
				let i = s, o = this.options.extensions.renderers[i.type].call({ parser: this }, i);
				if (o !== !1 || ![
					"space",
					"hr",
					"heading",
					"code",
					"table",
					"blockquote",
					"list",
					"html",
					"def",
					"paragraph",
					"text"
				].includes(i.type)) {
					t += o || "";
					continue;
				}
			}
			let r = s;
			switch (r.type) {
				case "space":
					t += this.renderer.space(r);
					break;
				case "hr":
					t += this.renderer.hr(r);
					break;
				case "heading":
					t += this.renderer.heading(r);
					break;
				case "code":
					t += this.renderer.code(r);
					break;
				case "table":
					t += this.renderer.table(r);
					break;
				case "blockquote":
					t += this.renderer.blockquote(r);
					break;
				case "list":
					t += this.renderer.list(r);
					break;
				case "checkbox":
					t += this.renderer.checkbox(r);
					break;
				case "html":
					t += this.renderer.html(r);
					break;
				case "def":
					t += this.renderer.def(r);
					break;
				case "paragraph":
					t += this.renderer.paragraph(r);
					break;
				case "text":
					t += this.renderer.text(r);
					break;
				default: {
					let i = "Token with \"" + r.type + "\" type was not found.";
					if (this.options.silent) return console.error(i), "";
					throw new Error(i);
				}
			}
		}
		return t;
	}
	parseInline(e, t = this.renderer) {
		this.renderer.parser = this;
		let n = "";
		for (let s = 0; s < e.length; s++) {
			let r = e[s];
			if (this.options.extensions?.renderers?.[r.type]) {
				let o = this.options.extensions.renderers[r.type].call({ parser: this }, r);
				if (o !== !1 || ![
					"escape",
					"html",
					"link",
					"image",
					"strong",
					"em",
					"codespan",
					"br",
					"del",
					"text"
				].includes(r.type)) {
					n += o || "";
					continue;
				}
			}
			let i = r;
			switch (i.type) {
				case "escape":
					n += t.text(i);
					break;
				case "html":
					n += t.html(i);
					break;
				case "link":
					n += t.link(i);
					break;
				case "image":
					n += t.image(i);
					break;
				case "checkbox":
					n += t.checkbox(i);
					break;
				case "strong":
					n += t.strong(i);
					break;
				case "em":
					n += t.em(i);
					break;
				case "codespan":
					n += t.codespan(i);
					break;
				case "br":
					n += t.br(i);
					break;
				case "del":
					n += t.del(i);
					break;
				case "text":
					n += t.text(i);
					break;
				default: {
					let o = "Token with \"" + i.type + "\" type was not found.";
					if (this.options.silent) return console.error(o), "";
					throw new Error(o);
				}
			}
		}
		return n;
	}
};
var P = class {
	options;
	block;
	constructor(e) {
		this.options = e || T;
	}
	static passThroughHooks = new Set([
		"preprocess",
		"postprocess",
		"processAllTokens",
		"emStrongMask"
	]);
	static passThroughHooksRespectAsync = new Set([
		"preprocess",
		"postprocess",
		"processAllTokens"
	]);
	preprocess(e) {
		return e;
	}
	postprocess(e) {
		return e;
	}
	processAllTokens(e) {
		return e;
	}
	emStrongMask(e) {
		return e;
	}
	provideLexer(e = this.block) {
		return e ? x.lex : x.lexInline;
	}
	provideParser(e = this.block) {
		return e ? b.parse : b.parseInline;
	}
};
var q = class {
	defaults = M();
	options = this.setOptions;
	parse = this.parseMarkdown(!0);
	parseInline = this.parseMarkdown(!1);
	Parser = b;
	Renderer = y;
	TextRenderer = L;
	Lexer = x;
	Tokenizer = w;
	Hooks = P;
	constructor(...e) {
		this.use(...e);
	}
	walkTokens(e, t) {
		let n = [];
		for (let s of e) switch (n = n.concat(t.call(this, s)), s.type) {
			case "table": {
				let r = s;
				for (let i of r.header) n = n.concat(this.walkTokens(i.tokens, t));
				for (let i of r.rows) for (let o of i) n = n.concat(this.walkTokens(o.tokens, t));
				break;
			}
			case "list": {
				let r = s;
				n = n.concat(this.walkTokens(r.items, t));
				break;
			}
			default: {
				let r = s;
				this.defaults.extensions?.childTokens?.[r.type] ? this.defaults.extensions.childTokens[r.type].forEach((i) => {
					let o = r[i].flat(Infinity);
					n = n.concat(this.walkTokens(o, t));
				}) : r.tokens && (n = n.concat(this.walkTokens(r.tokens, t)));
			}
		}
		return n;
	}
	use(...e) {
		let t = this.defaults.extensions || {
			renderers: {},
			childTokens: {}
		};
		return e.forEach((n) => {
			let s = { ...n };
			if (s.async = this.defaults.async || s.async || !1, n.extensions && (n.extensions.forEach((r) => {
				if (!r.name) throw new Error("extension name required");
				if ("renderer" in r) {
					let i = t.renderers[r.name];
					i ? t.renderers[r.name] = function(...o) {
						let u = r.renderer.apply(this, o);
						return u === !1 && (u = i.apply(this, o)), u;
					} : t.renderers[r.name] = r.renderer;
				}
				if ("tokenizer" in r) {
					if (!r.level || r.level !== "block" && r.level !== "inline") throw new Error("extension level must be 'block' or 'inline'");
					let i = t[r.level];
					i ? i.unshift(r.tokenizer) : t[r.level] = [r.tokenizer], r.start && (r.level === "block" ? t.startBlock ? t.startBlock.push(r.start) : t.startBlock = [r.start] : r.level === "inline" && (t.startInline ? t.startInline.push(r.start) : t.startInline = [r.start]));
				}
				"childTokens" in r && r.childTokens && (t.childTokens[r.name] = r.childTokens);
			}), s.extensions = t), n.renderer) {
				let r = this.defaults.renderer || new y(this.defaults);
				for (let i in n.renderer) {
					if (!(i in r)) throw new Error(`renderer '${i}' does not exist`);
					if (["options", "parser"].includes(i)) continue;
					let o = i, u = n.renderer[o], a = r[o];
					r[o] = (...c) => {
						let p = u.apply(r, c);
						return p === !1 && (p = a.apply(r, c)), p || "";
					};
				}
				s.renderer = r;
			}
			if (n.tokenizer) {
				let r = this.defaults.tokenizer || new w(this.defaults);
				for (let i in n.tokenizer) {
					if (!(i in r)) throw new Error(`tokenizer '${i}' does not exist`);
					if ([
						"options",
						"rules",
						"lexer"
					].includes(i)) continue;
					let o = i, u = n.tokenizer[o], a = r[o];
					r[o] = (...c) => {
						let p = u.apply(r, c);
						return p === !1 && (p = a.apply(r, c)), p;
					};
				}
				s.tokenizer = r;
			}
			if (n.hooks) {
				let r = this.defaults.hooks || new P();
				for (let i in n.hooks) {
					if (!(i in r)) throw new Error(`hook '${i}' does not exist`);
					if (["options", "block"].includes(i)) continue;
					let o = i, u = n.hooks[o], a = r[o];
					P.passThroughHooks.has(i) ? r[o] = (c) => {
						if (this.defaults.async && P.passThroughHooksRespectAsync.has(i)) return (async () => {
							let k = await u.call(r, c);
							return a.call(r, k);
						})();
						let p = u.call(r, c);
						return a.call(r, p);
					} : r[o] = (...c) => {
						if (this.defaults.async) return (async () => {
							let k = await u.apply(r, c);
							return k === !1 && (k = await a.apply(r, c)), k;
						})();
						let p = u.apply(r, c);
						return p === !1 && (p = a.apply(r, c)), p;
					};
				}
				s.hooks = r;
			}
			if (n.walkTokens) {
				let r = this.defaults.walkTokens, i = n.walkTokens;
				s.walkTokens = function(o) {
					let u = [];
					return u.push(i.call(this, o)), r && (u = u.concat(r.call(this, o))), u;
				};
			}
			this.defaults = {
				...this.defaults,
				...s
			};
		}), this;
	}
	setOptions(e) {
		return this.defaults = {
			...this.defaults,
			...e
		}, this;
	}
	lexer(e, t) {
		return x.lex(e, t ?? this.defaults);
	}
	parser(e, t) {
		return b.parse(e, t ?? this.defaults);
	}
	parseMarkdown(e) {
		return (n, s) => {
			let r = { ...s }, i = {
				...this.defaults,
				...r
			}, o = this.onError(!!i.silent, !!i.async);
			if (this.defaults.async === !0 && r.async === !1) return o(/* @__PURE__ */ new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
			if (typeof n > "u" || n === null) return o(/* @__PURE__ */ new Error("marked(): input parameter is undefined or null"));
			if (typeof n != "string") return o(/* @__PURE__ */ new Error("marked(): input parameter is of type " + Object.prototype.toString.call(n) + ", string expected"));
			if (i.hooks && (i.hooks.options = i, i.hooks.block = e), i.async) return (async () => {
				let u = i.hooks ? await i.hooks.preprocess(n) : n, c = await (i.hooks ? await i.hooks.provideLexer(e) : e ? x.lex : x.lexInline)(u, i), p = i.hooks ? await i.hooks.processAllTokens(c) : c;
				i.walkTokens && await Promise.all(this.walkTokens(p, i.walkTokens));
				let h = await (i.hooks ? await i.hooks.provideParser(e) : e ? b.parse : b.parseInline)(p, i);
				return i.hooks ? await i.hooks.postprocess(h) : h;
			})().catch(o);
			try {
				i.hooks && (n = i.hooks.preprocess(n));
				let a = (i.hooks ? i.hooks.provideLexer(e) : e ? x.lex : x.lexInline)(n, i);
				i.hooks && (a = i.hooks.processAllTokens(a)), i.walkTokens && this.walkTokens(a, i.walkTokens);
				let p = (i.hooks ? i.hooks.provideParser(e) : e ? b.parse : b.parseInline)(a, i);
				return i.hooks && (p = i.hooks.postprocess(p)), p;
			} catch (u) {
				return o(u);
			}
		};
	}
	onError(e, t) {
		return (n) => {
			if (n.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
				let s = "<p>An error occurred:</p><pre>" + O(n.message + "", !0) + "</pre>";
				return t ? Promise.resolve(s) : s;
			}
			if (t) return Promise.reject(n);
			throw n;
		};
	}
};
var z = new q();
function g(l, e) {
	return z.parse(l, e);
}
g.options = g.setOptions = function(l) {
	return z.setOptions(l), g.defaults = z.defaults, N(g.defaults), g;
};
g.getDefaults = M;
g.defaults = T;
g.use = function(...l) {
	return z.use(...l), g.defaults = z.defaults, N(g.defaults), g;
};
g.walkTokens = function(l, e) {
	return z.walkTokens(l, e);
};
g.parseInline = z.parseInline;
g.Parser = b;
g.parser = b.parse;
g.Renderer = y;
g.TextRenderer = L;
g.Lexer = x;
g.lexer = x.lex;
g.Tokenizer = w;
g.Hooks = P;
g.parse = g;
g.options;
g.setOptions;
g.use;
g.walkTokens;
g.parseInline;
b.parse;
x.lex;
//#endregion
//#region src/components/viewers/MarkdownViewer.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$6 = ["innerHTML"];
//#endregion
//#region src/components/viewers/MarkdownViewer.vue
var MarkdownViewer_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ __mf_93({
	__name: "MarkdownViewer",
	props: {
		content: {},
		alt: {}
	},
	setup(__props) {
		const props = __props;
		const router = __mf_314();
		const rendered = __mf_80(() => {
			const renderer = new y();
			renderer.link = ({ href, text }) => {
				if (!href || href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:")) return `<a href="${href}">${text}</a>`;
				return `<a href="#" data-folder-link="${href}">${text}</a>`;
			};
			try {
				return g.parse(props.content, {
					async: false,
					renderer
				});
			} catch {
				return `<pre>${props.content}</pre>`;
			}
		});
		function handleClick(e) {
			const anchor = e.target.closest("a");
			if (!anchor) return;
			const folderLink = anchor.dataset.folderLink;
			if (!folderLink) return;
			e.preventDefault();
			e.stopPropagation();
			const current = router.currentRoute.value;
			const targetPath = (current.path || "").replace(/\/$/, "") + "/" + folderLink.replace(/^\//, "");
			const query = { ...current.query };
			delete query.fileId;
			delete query.scrollTo;
			delete query.page;
			router.push({
				path: targetPath,
				query
			});
		}
		return (_ctx, _cache) => {
			return __mf_132(), __mf_83$1("div", {
				class: "markdown-body",
				innerHTML: rendered.value,
				onClick: handleClick
			}, null, 8, _hoisted_1$6);
		};
	}
}), [["__scopeId", "data-v-e0a06b21"]]);
//#endregion
//#region src/components/viewers/ImageViewer.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$5 = { class: "image-viewer" };
var _hoisted_2$4 = ["src", "alt"];
//#endregion
//#region src/components/viewers/ImageViewer.vue
var ImageViewer_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ __mf_93({
	__name: "ImageViewer",
	props: {
		content: {},
		alt: {}
	},
	setup(__props) {
		const props = __props;
		const objectUrl = __mf_45("");
		__mf_161(() => props.content, (buf) => {
			if (objectUrl.value) URL.revokeObjectURL(objectUrl.value);
			if (buf) {
				const blob = new Blob([buf]);
				objectUrl.value = URL.createObjectURL(blob);
			}
		}, { immediate: true });
		__mf_130(() => {
			if (objectUrl.value) URL.revokeObjectURL(objectUrl.value);
		});
		return (_ctx, _cache) => {
			return __mf_132(), __mf_83$1("div", _hoisted_1$5, [objectUrl.value ? (__mf_132(), __mf_83$1("img", {
				key: 0,
				src: objectUrl.value,
				alt: __props.alt
			}, null, 8, _hoisted_2$4)) : __mf_82("", true)]);
		};
	}
}), [["__scopeId", "data-v-7a4422dd"]]);
//#endregion
//#region src/components/viewers/TextViewer.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$4 = { class: "text-viewer" };
//#endregion
//#region src/components/viewers/TextViewer.vue
var TextViewer_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ __mf_93({
	__name: "TextViewer",
	props: { content: {} },
	setup(__props) {
		return (_ctx, _cache) => {
			return __mf_132(), __mf_83$1("pre", _hoisted_1$4, __mf_61(__props.content), 1);
		};
	}
}), [["__scopeId", "data-v-3de5009b"]]);
//#endregion
//#region src/composables/useElementRenderer.ts
var VIEWER_COMPONENTS = {
	markdown: __mf_39(MarkdownViewer_default),
	image: __mf_39(ImageViewer_default),
	text: __mf_39(TextViewer_default)
};
var ELEMENT_RENDERER_KEY = Symbol("elementRenderer");
function useElementRenderer(space) {
	const clientService = __mf_228();
	const { loadContent, clearCache } = useContentLoader(space);
	const schemaCache = /* @__PURE__ */ new Map();
	async function loadChildren(path) {
		try {
			const { children } = await clientService.webdav.listFiles(space.value, { path });
			return children;
		} catch {
			return [];
		}
	}
	async function getSchema(typeName) {
		if (schemaCache.has(typeName)) return schemaCache.get(typeName);
		try {
			const { body } = await clientService.webdav.getFileContents(space.value, { path: `.views/${typeName}.json` });
			const schema = JSON.parse(typeof body === "string" ? body : new TextDecoder().decode(body));
			schemaCache.set(typeName, schema);
			return schema;
		} catch {
			schemaCache.set(typeName, null);
			return null;
		}
	}
	async function loadTypeParams(path) {
		try {
			const entry = await loadContent(path);
			const text = typeof entry.content === "string" ? entry.content : new TextDecoder().decode(entry.content);
			return JSON.parse(text);
		} catch {
			return null;
		}
	}
	function resolveViewer(schema, extension) {
		if (!schema?.viewers) return null;
		const viewerName = schema.viewers[extension] || schema.viewers["*"];
		if (!viewerName) return null;
		return VIEWER_COMPONENTS[viewerName] || null;
	}
	function clearAll() {
		clearCache();
		schemaCache.clear();
	}
	return {
		space,
		loadChildren,
		loadContent,
		loadTypeParams,
		getSchema,
		resolveViewer,
		clearCache: clearAll
	};
}
//#endregion
//#region src/components/ElementFrame.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$3 = { class: "element-frame" };
var _hoisted_2$3 = { class: "element-frame-toolbar" };
var _hoisted_3$1 = { class: "element-frame-name" };
var _hoisted_4 = { class: "element-frame-content" };
//#endregion
//#region src/components/ElementFrame.vue
var ElementFrame_default = /* @__PURE__ */ __mf_93({
	__name: "ElementFrame",
	props: {
		resource: {},
		space: {}
	},
	setup(__props) {
		const props = __props;
		const router = __mf_314();
		const resourcesStore = __mf_306();
		const { triggerDefaultAction } = __mf_243();
		const { downloadFile } = __mf_237();
		const menuOpen = __mf_45(false);
		const menuStyle = __mf_45({});
		function doDownload() {
			close();
			downloadFile(props.space, props.resource);
		}
		function toggleMenu(e) {
			if (menuOpen.value) {
				close();
				return;
			}
			const rect = e.currentTarget.getBoundingClientRect();
			menuStyle.value = {
				top: rect.bottom + 4 + "px",
				left: Math.max(8, rect.right - 220) + "px"
			};
			menuOpen.value = true;
		}
		function close() {
			menuOpen.value = false;
		}
		function doOpen() {
			close();
			if (props.resource.isFolder) {
				const currentPath = router.currentRoute.value.path;
				router.push({ path: currentPath.replace(/\/$/, "") + "/" + props.resource.name });
			} else triggerDefaultAction({
				resources: [props.resource],
				space: props.space
			});
		}
		function doDetails() {
			close();
			resourcesStore.upsertResource(props.resource);
			resourcesStore.setSelection([props.resource.id]);
		}
		return (_ctx, _cache) => {
			const _component_oc_icon = __mf_140("oc-icon");
			return __mf_132(), __mf_83$1("div", _hoisted_1$3, [
				__mf_84("div", _hoisted_2$3, [__mf_84("span", _hoisted_3$1, __mf_61(__props.resource.name), 1), __mf_84("button", {
					class: "element-frame-menu",
					onClick: _cache[0] || (_cache[0] = __mf_24(($event) => toggleMenu($event), ["stop", "prevent"]))
				}, [__mf_91$1(_component_oc_icon, {
					name: "more-2",
					size: "small"
				})])]),
				__mf_84("div", _hoisted_4, [__mf_139(_ctx.$slots, "default")]),
				(__mf_132(), __mf_81(__mf_73, { to: "body" }, [menuOpen.value ? (__mf_132(), __mf_83$1("div", {
					key: 0,
					class: "element-ctx-overlay",
					onClick: close
				}, [__mf_84("div", {
					class: "element-ctx-dropdown",
					style: __mf_60(menuStyle.value),
					onClick: _cache[1] || (_cache[1] = __mf_24(() => {}, ["stop"]))
				}, [
					!__props.resource.isFolder ? (__mf_132(), __mf_83$1("button", {
						key: 0,
						class: "element-ctx-action",
						onClick: doDownload
					}, [__mf_91$1(_component_oc_icon, {
						name: "file-download",
						size: "small"
					}), _cache[2] || (_cache[2] = __mf_84("span", null, "Download", -1))])) : __mf_82("", true),
					__mf_84("button", {
						class: "element-ctx-action",
						onClick: doOpen
					}, [__mf_91$1(_component_oc_icon, {
						name: "external-link",
						size: "small"
					}), __mf_84("span", null, __mf_61(__props.resource.isFolder ? "Öffnen" : "Bearbeiten"), 1)]),
					__mf_84("button", {
						class: "element-ctx-action",
						onClick: doDetails
					}, [__mf_91$1(_component_oc_icon, {
						name: "information",
						size: "small"
					}), _cache[3] || (_cache[3] = __mf_84("span", null, "Details", -1))])
				], 4)])) : __mf_82("", true)]))
			]);
		};
	}
});
//#endregion
//#region src/components/ElementContent.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$2 = {
	key: 0,
	class: "element-loading"
};
var _hoisted_2$2 = {
	key: 1,
	class: "element-error"
};
var _hoisted_3 = {
	key: 3,
	class: "element-fallback"
};
//#endregion
//#region src/components/ElementContent.vue
var ElementContent_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ __mf_93({
	__name: "ElementContent",
	props: {
		resource: {},
		schema: {}
	},
	setup(__props) {
		const props = __props;
		const ctx = __mf_112(ELEMENT_RENDERER_KEY);
		const elRef = __mf_45();
		const loading = __mf_45(false);
		const error = __mf_45("");
		const content = __mf_45(null);
		const ext = __mf_80(() => (props.resource.name || "").split(".").pop()?.toLowerCase() || "");
		const isBinary = __mf_80(() => [
			"png",
			"jpg",
			"jpeg",
			"gif",
			"webp",
			"bmp",
			"svg"
		].includes(ext.value));
		const viewer = __mf_80(() => ctx.resolveViewer(props.schema, ext.value));
		let observer = null;
		let loaded = false;
		function loadOnVisible() {
			if (!viewer.value || !props.resource.path || loaded) return;
			loaded = true;
			loading.value = true;
			ctx.loadContent(props.resource.path, isBinary.value).then((entry) => {
				content.value = entry.content;
			}).catch((e) => {
				error.value = e?.message || "Load error";
			}).finally(() => {
				loading.value = false;
			});
		}
		__mf_126(() => {
			if (!viewer.value) return;
			observer = new IntersectionObserver(([entry]) => {
				if (entry.isIntersecting) {
					observer?.disconnect();
					loadOnVisible();
				}
			}, { rootMargin: "200px" });
			if (elRef.value) observer.observe(elRef.value);
		});
		__mf_161(viewer, (v) => {
			if (v && !loaded && elRef.value) {
				if (!observer) observer = new IntersectionObserver(([entry]) => {
					if (entry.isIntersecting) {
						observer?.disconnect();
						loadOnVisible();
					}
				}, { rootMargin: "200px" });
				observer.observe(elRef.value);
			}
		});
		__mf_130(() => {
			observer?.disconnect();
		});
		return (_ctx, _cache) => {
			const _component_oc_spinner = __mf_140("oc-spinner");
			const _component_oc_icon = __mf_140("oc-icon");
			return __mf_132(), __mf_83$1("div", {
				class: "element-content",
				ref_key: "elRef",
				ref: elRef
			}, [loading.value ? (__mf_132(), __mf_83$1("div", _hoisted_1$2, [__mf_91$1(_component_oc_spinner, { size: "small" })])) : error.value ? (__mf_132(), __mf_83$1("div", _hoisted_2$2, __mf_61(error.value), 1)) : viewer.value && content.value != null ? (__mf_132(), __mf_81(__mf_142(viewer.value), {
				key: 2,
				content: content.value,
				alt: __props.resource.name
			}, null, 8, ["content", "alt"])) : !viewer.value ? (__mf_132(), __mf_83$1("div", _hoisted_3, [__mf_91$1(_component_oc_icon, {
				name: "file",
				size: "small"
			}), __mf_84("span", null, __mf_61(__props.resource.name), 1)])) : __mf_82("", true)], 512);
		};
	}
}), [["__scopeId", "data-v-55ddbbfd"]]);
//#endregion
//#region src/components/ElementContainer.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$1 = {
	key: 0,
	class: "element-container-loading"
};
var _hoisted_2$1 = { class: "element-folder-card" };
//#endregion
//#region src/components/ElementContainer.vue
var ElementContainer_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ __mf_93({
	__name: "ElementContainer",
	props: {
		resources: {},
		path: {},
		depth: {},
		schema: {},
		divParams: {},
		space: {},
		folderName: {}
	},
	setup(__props) {
		const props = __props;
		const ctx = __mf_112(ELEMENT_RENDERER_KEY);
		const loading = __mf_45(false);
		const children = __mf_45([]);
		const containerTypes = __mf_45(/* @__PURE__ */ new Map());
		const containerStyle = __mf_80(() => {
			const p = props.divParams || props.schema?.elementLayout || {};
			if (p.columns) return {
				display: "grid",
				gridTemplateColumns: `repeat(${p.columns}, 1fr)`,
				gap: p.gap || "8px",
				padding: p.padding || "0"
			};
			return {
				display: p.display || "flex",
				flexDirection: p.direction || "column",
				flexWrap: p.wrap || "nowrap",
				gap: p.gap || "8px",
				alignItems: p.align || "stretch",
				padding: p.padding || "0"
			};
		});
		const visibleChildren = __mf_80(() => {
			return children.value.filter((r) => !r.name?.startsWith("_type_") && !r.name?.startsWith("."));
		});
		async function loadAndAnalyze() {
			loading.value = true;
			try {
				const items = props.depth === 0 && props.resources.length > 0 ? props.resources : await ctx.loadChildren(props.path);
				children.value = items;
				const cTypes = /* @__PURE__ */ new Map();
				for (const r of items) {
					if (r.type !== "folder") continue;
					const typeFile = (await ctx.loadChildren(r.path)).find((c) => c.name?.startsWith("_type_"));
					if (!typeFile) continue;
					const typeName = typeFile.name.substring(6);
					const schema = await ctx.getSchema(typeName);
					if (!schema?.isContainer) continue;
					const params = typeName === "div" ? await ctx.loadTypeParams(typeFile.path) : schema.elementLayout || null;
					cTypes.set(r.id, {
						schema,
						params
					});
				}
				containerTypes.value = cTypes;
			} catch (e) {
				console.error("[ElementContainer] load error:", e);
			} finally {
				loading.value = false;
			}
		}
		__mf_126(loadAndAnalyze);
		__mf_161(() => props.path, loadAndAnalyze);
		return (_ctx, _cache) => {
			const _component_oc_spinner = __mf_140("oc-spinner");
			const _component_element_container = __mf_140("element-container", true);
			const _component_oc_icon = __mf_140("oc-icon");
			return __mf_132(), __mf_83$1("div", {
				class: "element-container",
				style: __mf_60(containerStyle.value)
			}, [loading.value ? (__mf_132(), __mf_83$1("div", _hoisted_1$1, [__mf_91$1(_component_oc_spinner, { size: "small" }), _cache[0] || (_cache[0] = __mf_90(" Laden... ", -1))])) : (__mf_132(true), __mf_83$1(__mf_69, { key: 1 }, __mf_138(visibleChildren.value, (r) => {
				return __mf_132(), __mf_83$1(__mf_69, { key: r.id }, [r.type === "folder" && containerTypes.value.has(r.id) ? (__mf_132(), __mf_81(_component_element_container, {
					key: 0,
					resources: [],
					path: r.path,
					depth: __props.depth + 1,
					schema: containerTypes.value.get(r.id).schema,
					"div-params": containerTypes.value.get(r.id).params,
					space: __props.space,
					"folder-name": r.name
				}, null, 8, [
					"path",
					"depth",
					"schema",
					"div-params",
					"space",
					"folder-name"
				])) : r.type !== "folder" ? (__mf_132(), __mf_81(ElementFrame_default, {
					key: 1,
					resource: r,
					space: __props.space
				}, {
					default: __mf_166(() => [__mf_91$1(ElementContent_default, {
						resource: r,
						schema: __props.schema
					}, null, 8, ["resource", "schema"])]),
					_: 2
				}, 1032, ["resource", "space"])) : (__mf_132(), __mf_81(ElementFrame_default, {
					key: 2,
					resource: r,
					space: __props.space
				}, {
					default: __mf_166(() => [__mf_84("div", _hoisted_2$1, [__mf_91$1(_component_oc_icon, {
						name: "folder",
						size: "medium"
					}), __mf_84("span", null, __mf_61(r.name), 1)])]),
					_: 2
				}, 1032, ["resource", "space"]))], 64);
			}), 128))], 4);
		};
	}
}), [["__scopeId", "data-v-859788aa"]]);
//#endregion
//#region src/components/ResourceElements.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "resource-elements" };
var _hoisted_2 = {
	key: 0,
	class: "resource-elements-loading"
};
//#endregion
//#region src/components/ResourceElements.vue
var ResourceElements_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ __mf_93({
	__name: "ResourceElements",
	props: {
		resources: {},
		space: {},
		viewMode: {},
		dragDrop: { type: Boolean },
		headerPosition: {},
		sortBy: {},
		sortDir: {},
		sortFields: {},
		viewSize: {}
	},
	emits: [
		"fileClick",
		"fileDropped",
		"itemVisible",
		"sort",
		"update:selectedIds"
	],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const resourcesStore = __mf_306();
		const ctx = useElementRenderer(__mf_80(() => props.space));
		__mf_134(ELEMENT_RENDERER_KEY, ctx);
		const currentPath = __mf_80(() => resourcesStore.currentFolder?.path || "");
		const ready = __mf_45(false);
		const rootSchema = __mf_45(null);
		const rootDivParams = __mf_45(null);
		async function detectRootType() {
			ready.value = false;
			const typeFile = (resourcesStore.resources || props.resources).find((r) => r.name?.startsWith("_type_"));
			if (!typeFile) {
				rootSchema.value = null;
				rootDivParams.value = null;
				ready.value = true;
				return;
			}
			const typeName = typeFile.name.substring(6);
			rootSchema.value = await ctx.getSchema(typeName);
			if (typeName === "div" && typeFile.path) rootDivParams.value = await ctx.loadTypeParams(typeFile.path);
			else rootDivParams.value = rootSchema.value?.elementLayout || null;
			ready.value = true;
		}
		__mf_161(() => props.resources, () => {
			ctx.clearCache();
			detectRootType();
		}, { immediate: true });
		return (_ctx, _cache) => {
			const _component_oc_spinner = __mf_140("oc-spinner");
			return __mf_132(), __mf_83$1("div", _hoisted_1, [!ready.value ? (__mf_132(), __mf_83$1("div", _hoisted_2, [__mf_91$1(_component_oc_spinner, { size: "small" }), _cache[0] || (_cache[0] = __mf_90(" Laden... ", -1))])) : (__mf_132(), __mf_81(ElementContainer_default, {
				key: 1,
				resources: __props.resources,
				path: currentPath.value,
				depth: 0,
				schema: rootSchema.value,
				"div-params": rootDivParams.value,
				space: __props.space
			}, null, 8, [
				"resources",
				"path",
				"schema",
				"div-params",
				"space"
			]))]);
		};
	}
}), [["__scopeId", "data-v-19ed47a7"]]);
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
	const aktzDefs = getAktenzeichenPreferenceDefinitions();
	const extensions = __mf_80(() => [
		{
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
		},
		{
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
		},
		{
			id: "com.kosmos-eu.folderviews.folder-view.resource-elements",
			type: "folderView",
			extensionPointIds: ["app.files.folder-views.folder", "app.files.folder-views.project-spaces"],
			folderView: {
				name: "resource-elements",
				label: "Element view",
				icon: {
					name: "layout-4",
					fillType: "line"
				},
				component: __mf_39(ResourceElements_default)
			}
		},
		...aktzDefs.extensions
	]);
	const extensionPoints = __mf_80(() => [aktzDefs.extensionPoint]);
	__mf_228().webdav.registerExtraProp("oc:oy.fileReference");
	return {
		appInfo,
		extensions,
		extensionPoints,
		folderViewHandlers
	};
} });
//#endregion
export { src_default as default };
