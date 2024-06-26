const JSON_RE = /^application\/(?:[\w!#$%&*.^`~-]*\+)?json(;.+)?$/i;

export function detectResponseType(request: Response) {
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
	if (!isJSONSerializable(text)) {
		return text;
	}
	try {
		return JSON.parse(text);
	} catch (error) {
		return text;
	}
}

export interface FetchEsque {
	(input: RequestInfo, init?: RequestInit): Promise<Response>;
}

function isFunction(value: any): value is Function {
	return typeof value === "function";
}

export function getFetch(customFetchImpl?: FetchEsque) {
	if (customFetchImpl) {
		return customFetchImpl;
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
