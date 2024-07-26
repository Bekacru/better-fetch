import { getAuthHeader } from "./auth";
import { methods } from "./create-fetch";
import type { BetterFetchOption, FetchEsque } from "./types";

const JSON_RE = /^application\/(?:[\w!#$%&*.^`~-]*\+)?json(;.+)?$/i;

export type ResponseType = "json" | "text" | "blob";
export function detectResponseType(request: Response): ResponseType {
	const _contentType = request.headers.get("content-type");
	const textTypes = new Set([
		"image/svg",
		"application/xml",
		"application/xhtml",
		"application/html",
	]);
	if (!_contentType) {
		return "json";
	}
	const contentType = _contentType.split(";").shift() || "";
	if (JSON_RE.test(contentType)) {
		return "json";
	}
	if (textTypes.has(contentType) || contentType.startsWith("text/")) {
		return "text";
	}
	return "blob";
}

export function isJSONParsable(value: any) {
	try {
		JSON.parse(value);
		return true;
	} catch (error) {
		return false;
	}
}

//https://github.com/unjs/ofetch/blob/main/src/utils.ts
export function isJSONSerializable(value: any) {
	if (value === undefined) {
		return false;
	}
	const t = typeof value;
	if (t === "string" || t === "number" || t === "boolean" || t === null) {
		return true;
	}
	if (t !== "object") {
		return false;
	}
	if (Array.isArray(value)) {
		return true;
	}
	if (value.buffer) {
		return false;
	}
	return (
		(value.constructor && value.constructor.name === "Object") ||
		typeof value.toJSON === "function"
	);
}

export function jsonParse(text: string) {
	try {
		return JSON.parse(text);
	} catch (error) {
		return text;
	}
}

export function isFunction(value: any): value is () => any {
	return typeof value === "function";
}

export function getFetch(options?: BetterFetchOption): FetchEsque {
	if (options?.customFetchImpl) {
		return options.customFetchImpl;
	}
	if (typeof globalThis !== "undefined" && isFunction(globalThis.fetch)) {
		return globalThis.fetch;
	}
	if (typeof window !== "undefined" && isFunction(window.fetch)) {
		return window.fetch;
	}
	throw new Error("No fetch implementation found");
}

export function isPayloadMethod(method?: string) {
	if (!method) {
		return false;
	}
	const payloadMethod = ["POST", "PUT", "PATCH", "DELETE"];
	return payloadMethod.includes(method.toUpperCase());
}

export function isRouteMethod(method?: string) {
	const routeMethod = ["GET", "POST", "PUT", "PATCH", "DELETE"];
	if (!method) {
		return false;
	}
	return routeMethod.includes(method.toUpperCase());
}

export function getHeaders(opts?: BetterFetchOption) {
	const headers = new Headers(opts?.headers);
	const authHeader = getAuthHeader(opts);
	for (const [key, value] of Object.entries(authHeader || {})) {
		headers.set(key, value);
	}
	if (!headers.has("content-type")) {
		const t = detectContentType(opts?.body);
		if (t) {
			headers.set("content-type", t);
		}
	}

	return headers;
}

export function detectContentType(body: any) {
	if (isJSONSerializable(body)) {
		return "application/json";
	}

	return null;
}

export function getBody(options?: BetterFetchOption) {
	if (!options?.body) {
		return null;
	}
	const headers = new Headers(options?.headers);
	if (isJSONSerializable(options.body) && !headers.has("content-type")) {
		return JSON.stringify(options.body);
	}

	return options.body;
}

export function getMethod(url: string, options?: BetterFetchOption) {
	if (options?.method) {
		return options.method.toUpperCase();
	}
	if (url.startsWith("@")) {
		const pMethod = url.split("@")[1]?.split("/")[0];
		if (!methods.includes(pMethod)) {
			return options?.body ? "POST" : "GET";
		}
		return pMethod.toUpperCase();
	}
	return options?.body ? "POST" : "GET";
}

export function getTimeout(
	options?: BetterFetchOption,
	controller?: AbortController,
) {
	let abortTimeout: ReturnType<typeof setTimeout> | undefined;
	if (!options?.signal && options?.timeout) {
		abortTimeout = setTimeout(() => controller?.abort(), options?.timeout);
	}
	return {
		abortTimeout,
		clearTimeout: () => {
			if (abortTimeout) {
				clearTimeout(abortTimeout);
			}
		},
	};
}

export function bodyParser(data: any, responseType: ResponseType) {
	if (responseType === "json") {
		return JSON.parse(data);
	}
	return data;
}
