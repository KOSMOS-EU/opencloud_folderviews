import { t as init$1 } from "./js/dist-BLfJdeHk.mjs";
import { t as __vitePreload } from "./js/preload-helper-CW7Fztz1.mjs";
//#region virtual:mf-REMOTE_ENTRY_ID:__mfe_internal__folderviews__remoteEntry_mjs
if (typeof __VUE_HMR_RUNTIME__ === "undefined") globalThis.__VUE_HMR_RUNTIME__ = {
	createRecord() {},
	rerender() {},
	reload() {}
};
var __mfResolveGlobalKey = "__mf_init__virtual:mf:__mfe_internal__folderviews__mf_v__runtimeInit__mf_v__.js__";
var __mfResolveState = globalThis[__mfResolveGlobalKey];
if (!__mfResolveState) {
	let initResolve, initReject;
	const initPromise = new Promise((re, rj) => {
		initResolve = re;
		initReject = rj;
	});
	__mfResolveState = globalThis[__mfResolveGlobalKey] = {
		initPromise,
		initResolve,
		initReject
	};
	if (typeof window === "undefined") initResolve({
		loadRemote: function() {
			return Promise.resolve(void 0);
		},
		loadShare: function() {
			return Promise.resolve(void 0);
		}
	});
}
var initResolve = __mfResolveState.initResolve;
var __mfCacheGlobalKey = "__mf_module_cache__";
globalThis[__mfCacheGlobalKey] ||= {
	share: {},
	remote: {}
};
globalThis[__mfCacheGlobalKey].share ||= {};
globalThis[__mfCacheGlobalKey].remote ||= {};
var __mfModuleCache = globalThis[__mfCacheGlobalKey];
var initTokens = {};
var shareScopeName = "default";
var mfName = "__mfe_internal__folderviews";
var localSharedImportMapPromise;
var exposesMapPromise;
async function retrySharedInit(fn) {
	for (let attempt = 0;; attempt++) try {
		return await fn();
	} catch (e) {
		throw e;
	}
}
async function getLocalSharedImportMap() {
	if (!localSharedImportMapPromise) localSharedImportMapPromise = retrySharedInit(() => __vitePreload(() => import("./js/_virtual_mf-localSharedImportMap___mfe_internal__folderviews-C6ViaWYL.mjs"), [], import.meta.url)).catch((e) => {
		localSharedImportMapPromise = void 0;
		throw e;
	});
	return localSharedImportMapPromise;
}
async function getExposesMap() {
	if (!exposesMapPromise) exposesMapPromise = retrySharedInit(() => __vitePreload(() => import("./js/virtualExposes-C0MgBVRv.mjs"), [], import.meta.url)).then((mod) => mod.default ?? mod).catch((e) => {
		exposesMapPromise = void 0;
		throw e;
	});
	return exposesMapPromise;
}
async function init(shared = {}, initScope = []) {
	const { usedShared, usedRemotes } = await getLocalSharedImportMap();
	const initRes = init$1({
		name: mfName,
		remotes: usedRemotes,
		shared: usedShared,
		plugins: [],
		shareStrategy: "version-first"
	});
	var initToken = initTokens[shareScopeName];
	if (!initToken) initToken = initTokens[shareScopeName] = { from: mfName };
	if (initScope.indexOf(initToken) >= 0) return;
	initScope.push(initToken);
	initRes.initShareScopeMap("default", shared);
	initResolve(initRes);
	try {
		await retrySharedInit(async () => {
			await Promise.all(await initRes.initializeSharing("default", {
				strategy: "version-first",
				from: "build",
				initScope
			}));
		});
	} catch (e) {
		console.error("[Module Federation]", e);
	}
	for (const [pkg, share] of Object.entries(usedShared)) {
		if (share.shareConfig?.import !== false || __mfModuleCache.share[pkg] !== void 0) continue;
		const __mfNormalizeRuntimeShare = (mod) => {
			let current = mod;
			for (let i = 0; i < 5; i++) {
				const defaultExport = current?.default;
				if (!defaultExport || typeof defaultExport !== "object") break;
				const namedValues = Object.keys(current).filter((key) => key !== "default").map((key) => current[key]);
				if (namedValues.length > 0 && namedValues.some((value) => value !== void 0)) break;
				current = defaultExport;
			}
			return current;
		};
		const versions = shared?.[pkg];
		const provider = versions && versions[Object.keys(versions)[0]];
		if (!provider) continue;
		const factory = provider.lib || (provider.loading ? await provider.loading : await provider.get?.());
		const mod = typeof factory === "function" ? factory() : factory;
		const resolved = await Promise.resolve(mod);
		__mfModuleCache.share[pkg] = __mfNormalizeRuntimeShare(resolved);
	}
	return initRes;
}
async function getExposes(moduleName) {
	const exposesMap = await getExposesMap();
	if (!(moduleName in exposesMap)) throw new Error(`[Module Federation] Module ${moduleName} does not exist in container.`);
	return exposesMap[moduleName]().then((res) => () => res);
}
//#endregion
export { getExposes as get, init };
