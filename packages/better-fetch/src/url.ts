import { methods } from "./create-fetch";
import { BetterFetchOption } from "./types";

/**
 * Normalize URL
 */
export function getURL(url: string, option?: BetterFetchOption) {
	let { baseURL, params, query } = option || {
		query: {},
		params: {},
		baseURL: "",
	};
	let basePath = url.startsWith("http")
		? url.split("/").slice(0, 3).join("/")
		: baseURL || "";

	/**
	 * Remove method modifiers
	 */
	if (url.startsWith("@")) {
		const m = url.toString().split("@")[1].split("/")[0];
		if (methods.includes(m)) {
			url = url.replace(`@${m}/`, "/");
		}
	}

	if (!basePath.endsWith("/")) basePath += "/";
	let [path, urlQuery] = url.replace(basePath, "").split("?");
	const queryParams = new URLSearchParams(urlQuery);
	for (const [key, value] of Object.entries(query || {})) {
		if (value == null) continue;
		queryParams.set(key, String(value));
	}
	if (params) {
		if (Array.isArray(params)) {
			const paramPaths = path.split("/").filter((p) => p.startsWith(":"));
			for (const [index, key] of paramPaths.entries()) {
				const value = params[index];
				path = path.replace(key, value);
			}
		} else {
			for (const [key, value] of Object.entries(params)) {
				path = path.replace(`:${key}`, String(value));
			}
		}
	}

	path = path.split("/").map(encodeURIComponent).join("/");
	if (path.startsWith("/")) path = path.slice(1);
	let queryParamString =
		queryParams.size > 0 ? `?${queryParams}`.replace(/\+/g, "%20") : "";
	if (!basePath.startsWith("http")) {
		return `${basePath}${path}${queryParamString}`;
	}
	const _url = new URL(`${path}${queryParamString}`, basePath);
	return _url;
}
