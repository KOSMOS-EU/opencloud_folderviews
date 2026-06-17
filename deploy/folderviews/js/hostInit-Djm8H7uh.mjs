import { t as __vitePreload } from "./preload-helper-CW7Fztz1.mjs";
//#region \0virtual:mf:__mfe_internal__folderviews__H_A_I__hostAutoInit__H_A_I__.js
var __mfCacheGlobalKey = "__mf_module_cache__";
globalThis[__mfCacheGlobalKey] ||= {
	share: {},
	remote: {}
};
globalThis[__mfCacheGlobalKey].share ||= {};
globalThis[__mfCacheGlobalKey].remote ||= {};
var __mfModuleCache = globalThis[__mfCacheGlobalKey];
var hostInitPromise;
async function initHost() {
	if (!hostInitPromise) hostInitPromise = (async () => {
		const runtime = await (await __vitePreload(() => import("../remoteEntry.mjs"), [], import.meta.url)).init();
		const usedShared = {
			"@opencloud-eu/web-client": { shareConfig: {
				singleton: true,
				requiredVersion: "*",
				import: false
			} },
			"@opencloud-eu/web-client/graph": { shareConfig: {
				singleton: true,
				requiredVersion: "*",
				import: false
			} },
			"@opencloud-eu/web-client/graph/generated": { shareConfig: {
				singleton: true,
				requiredVersion: "*",
				import: false
			} },
			"@opencloud-eu/web-client/ocs": { shareConfig: {
				singleton: true,
				requiredVersion: "*",
				import: false
			} },
			"@opencloud-eu/web-client/sse": { shareConfig: {
				singleton: true,
				requiredVersion: "*",
				import: false
			} },
			"@opencloud-eu/web-client/webdav": { shareConfig: {
				singleton: true,
				requiredVersion: "*",
				import: false
			} },
			"@opencloud-eu/web-pkg": { shareConfig: {
				singleton: true,
				requiredVersion: "*",
				import: false
			} },
			"@opencloud-eu/web-pkg/editor": { shareConfig: {
				singleton: true,
				requiredVersion: "*",
				import: false
			} },
			"luxon": { shareConfig: {
				singleton: true,
				requiredVersion: "*",
				import: false
			} },
			"pinia": { shareConfig: {
				singleton: true,
				requiredVersion: "*",
				import: false
			} },
			"vue": { shareConfig: {
				singleton: true,
				requiredVersion: "*",
				import: false
			} },
			"vue3-gettext": { shareConfig: {
				singleton: true,
				requiredVersion: "*",
				import: false
			} }
		};
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
		for (const [pkg, share] of Object.entries(usedShared)) {
			if (__mfModuleCache.share[pkg] !== void 0) continue;
			await runtime.loadShare(pkg, { customShareInfo: { shareConfig: share.shareConfig } }).then((factory) => {
				const mod = typeof factory === "function" ? factory() : factory;
				return Promise.resolve(mod).then((resolved) => {
					__mfModuleCache.share[pkg] = __mfNormalizeRuntimeShare(resolved);
				});
			});
		}
		await Promise.all([]);
		return runtime;
	})();
	return hostInitPromise;
}
hostInitPromise = initHost();
//#endregion
export { hostInitPromise, initHost };
