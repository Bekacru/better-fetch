import { Readable } from "stream";
import { FetchError } from "./error";
import {
	detectResponseType,
	isJSONParsable,
	isJSONSerializable,
	jsonParse,
} from "./utils";

interface RequestContext {
	request: Request;
	controller: AbortController;
	options: FetchOption;
}

interface ResponseContext {
	response: Response;
}

export interface BaseFetchOptions extends Omit<RequestInit, "body"> {
	/**
	 * a base url that will be prepended to the url
	 */
	baseURL?: string;
	/**
	 * a callback function that will be called when a request is
	 * made.
	 */
	onRequest?: (request: RequestContext) => Promise<void> | void;
	/**
	 * a callback function that will be called when a response is
	 * successful.
	 */
	onSuccess?: (response: ResponseContext) => Promise<void> | void;
	/**
	 * a callback function that will be called when an error occurs
	 */
	onError?: (response: ResponseContext) => Promise<void> | void;
	/**
	 * a callback function that will be called when a response is
	 * received. This will be called before the response is parsed
	 * and returned.
	 */
	onResponse?: (response: ResponseContext) => Promise<void> | void;
	/**
	 * a callback function that will be called when a
	 * request is retried.
	 */
	onRetry?: (response: ResponseContext) => Promise<void> | void;
	/**
	 * a custom json parser that will be used to parse the response
	 */
	jsonParser?: <T>(text: string) => Promise<T | undefined>;
	/**
	 * a flag that will determine if the error should be thrown
	 * or not
	 */
	throw?: boolean;
	/**
	 * Fetch function that will be used to make the request
	 */
	fetch?: typeof fetch;
	/**
	 * AbortController
	 */
	AbortController?: typeof AbortController;
	/**
	 * Headers
	 */
	Headers?: typeof Headers;
	/**
	 * a timeout that will be used to abort the request
	 */
	timeout?: number;
	/**
	 * a number of times the request should be retried if it fails
	 */
	retry?: number;
	/**
	 * Duplex mode
	 */
	duplex?: "full" | "half";
	/**
	 * Query parameters
	 */
	query?: Record<string, string | number | boolean | undefined>;
}

// biome-ignore lint/suspicious/noEmptyInterface: <explanation>
interface CreateFetchOption extends BaseFetchOptions {}

type FetchOption<T extends Record<string, unknown> = any> = (
	| {
			body?: never;
	  }
	| {
			method: "POST";
			body: T;
	  }
	| {
			method: "GET";
			body?: never;
	  }
	| {
			method:
				| "PUT"
				| "DELETE"
				| "PATCH"
				| "HEAD"
				| "OPTIONS"
				| "CONNECT"
				| "TRACE";
			body?: T;
	  }
) &
	BaseFetchOptions;

type FetchResponse<T, E extends Record<string, unknown> | unknown> =
	| {
			data: T;
			error: null;
	  }
	| {
			data: null;
			error: {
				status: number;
				statusText: string;
				message?: string;
			} & E;
	  };

export const betterFetch = async <T = any, E = unknown>(
	url: string | URL,
	options?: FetchOption,
): Promise<FetchResponse<T, E>> => {
	const controller = new AbortController();
	const signal = controller.signal;

	const _url = new URL(`${options?.baseURL ?? ""}${url}`);
	const headers = new Headers(options?.headers);

	const shouldStringifyBody =
		options?.body &&
		!(options.body instanceof FormData) &&
		!(options.body instanceof URLSearchParams) &&
		isJSONSerializable(options.body) &&
		(!headers.has("content-type") ||
			headers.get("content-type") === "application/json");

	if (shouldStringifyBody) {
		!headers.has("content-type") &&
			headers.set("content-type", "application/json");
		!headers.has("accept") && headers.set("accept", "application/json");
	}
	const query = options?.query;
	if (query) {
		for (const [key, value] of Object.entries(query)) {
			_url.searchParams.append(key, String(value));
		}
	}
	const _options: FetchOption = {
		signal,
		...options,
		body: shouldStringifyBody
			? JSON.stringify(options.body)
			: options?.body
			? options.body
			: undefined,
		headers,
	};

	if (
		("pipeTo" in (_options as ReadableStream) &&
			typeof (_options as ReadableStream).pipeTo === "function") ||
		typeof (options?.body as Readable)?.pipe === "function"
	) {
		if (!("duplex" in _options)) {
			_options.duplex = "half";
		}
	}

	const context: RequestContext = {
		request: new Request(_url.toString(), _options),
		options: _options,
		controller,
	};

	let abortTimeout: NodeJS.Timeout | undefined;

	if (!context.request.signal && context.options.timeout) {
		abortTimeout = setTimeout(
			() => controller.abort(),
			context.options.timeout,
		);
	}

	await options?.onRequest?.(context);
	const response = await fetch(context.request);
	const responseContext: ResponseContext = {
		response,
	};
	if (abortTimeout) {
		clearTimeout(abortTimeout);
	}
	await options?.onResponse?.(responseContext);
	const hasBody = response.body && context.options.method !== "HEAD";
	if (!hasBody) {
		await options?.onSuccess?.(responseContext);
		return {
			data: {} as T,
			error: null,
		};
	}
	const responseType = detectResponseType(response);
	if (response.ok) {
		if (responseType === "json" || responseType === "text") {
			const parser = options?.jsonParser ?? jsonParse;
			const text = await response.text();
			const json = await parser(text);
			await options?.onSuccess?.(responseContext);
			return {
				data: json,
				error: null,
			};
		} else {
			return {
				data: (await response[responseType]()) as T,
				error: null,
			};
		}
	}
	await options?.onError?.(responseContext);
	if (options?.retry) {
		await options?.onRetry?.(responseContext);
		return await betterFetch(url, {
			...options,
			retry: options.retry - 1,
		});
	}
	const parser = options?.jsonParser ?? jsonParse;
	const text = await response.text();
	const errorObject = isJSONParsable(text)
		? await parser(text)
		: text
		? {
				message: text,
		  }
		: undefined;
	if (options?.throw) {
		throw new FetchError(response.status, response.statusText, errorObject);
	}
	if (errorObject) {
		return {
			data: null,
			error: {
				...errorObject,
				status: response.status,
				statusText: response.statusText,
			},
		};
	}
	return {
		data: null,
		error: {
			...({} as E),
			status: response.status,
			statusText: response.statusText,
		},
	};
};

export const createFetch = <Error = unknown>(config?: CreateFetchOption) => {
	return async <T = any, E = undefined>(url: string, option?: FetchOption) => {
		type ResponseError = E extends undefined ? Error : E;
		return await betterFetch<T, ResponseError>(url, {
			...config,
			...option,
		});
	};
};
betterFetch.native = fetch;
export type BetterFetch = typeof betterFetch;
export type CreateFetch = typeof createFetch;
export default betterFetch;
