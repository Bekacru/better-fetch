import { Readable } from "stream";
import { FetchError } from "./error";
import {
	detectResponseType,
	FetchEsque,
	getFetch,
	isJSONParsable,
	isJSONSerializable,
	jsonParse,
} from "./utils";
import { FetchSchema, Static } from "./typed";
import { TNever, TObject } from "@sinclair/typebox";

interface RequestContext {
	request: Request;
	controller: AbortController;
	options: FetchOption;
}

interface ResponseContext {
	response: Response;
}

export type BetterFetchOptions<B extends Record<string, any> = any> = {
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
	 * HTTP method
	 */
	method?: PayloadMethod | NonPayloadMethod;
	/**
	 * Custom fetch implementation
	 */
	customFetchImpl?: FetchEsque;
	/**
	 * Plugins
	 */
	plugins?: Plugin[];
} & Omit<RequestInit, "body">;

/**
 * A plugin that can be used to modify the url and options.
 * All plugins will be called before the request is made.
 */
export interface Plugin {
	(url: string, options?: FetchOption): Promise<{
		url: string;
		options?: FetchOption;
	}>;
}

// biome-ignore lint/suspicious/noEmptyInterface: <explanation>
export interface CreateFetchOption extends BetterFetchOptions {}

export type PayloadMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type NonPayloadMethod = "GET" | "HEAD" | "OPTIONS";

export type FetchOption<
	T extends Record<string, unknown> = any,
	Q extends Record<string, unknown> = any,
> = InferBody<T> & InferQuery<Q> & BetterFetchOptions;

type InferBody<T> = T extends Record<string, any> ? { body: T } : { body?: T };
type InferQuery<Q> = Q extends Record<string, any>
	? { query: Q }
	: { query?: Q };

export type BetterFetchResponse<
	T,
	E extends Record<string, unknown> | unknown = unknown,
> =
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

export const betterFetch: BetterFetch = async (url, options) => {
	const fetch = getFetch(options?.customFetchImpl);
	const controller = new AbortController();
	const signal = controller.signal;

	//run plugins first
	// const fetcher = createFetch(options);
	for (const plugin of options?.plugins || []) {
		const pluginRes = await plugin(url.toString(), options);
		url = pluginRes.url;
		options = pluginRes.options;
	}

	const _url = new URL(`${options?.baseURL ?? ""}${url.toString()}`);
	const headers = new Headers(options?.headers);

	const shouldStringifyBody =
		options?.body &&
		isJSONSerializable(options.body) &&
		(!headers.has("content-type") ||
			headers.get("content-type") === "application/json") &&
		typeof options?.body !== "string";

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
			? JSON.stringify(options?.body)
			: options?.body
			? options.body
			: undefined,
		headers,
		method: options?.method?.length
			? options.method
			: options?.body
			? "POST"
			: "GET",
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

	const response = await fetch(_url.toString(), _options);

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
			data: {},
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
				data: await response[responseType](),
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
			...{},
			status: response.status,
			statusText: response.statusText,
		},
	};
};

export const createFetch = <
	Routes extends FetchSchema = any,
	R = unknown,
	E = unknown,
>(
	config?: CreateFetchOption,
): BetterFetch<Routes, R, E> => {
	const $fetch: BetterFetch = async (url, options) => {
		return await betterFetch(url, {
			...config,
			...options,
		});
	};
	$fetch.native = fetch;
	return $fetch;
};

betterFetch.native = fetch;

export interface BetterFetch<
	Routes extends FetchSchema = {
		[key in string]: {
			output: TNever;
		};
	},
	BaseT = any,
	BaseE = unknown,
> {
	<T = BaseT, E = BaseE, K extends keyof Routes = keyof Routes>(
		url: K | URL | Omit<string, keyof Routes>,
		...options: Routes[K]["input"] extends TObject
			? [
					FetchOption<
						Static<Routes[K]["input"]>,
						Routes[K]["query"] extends TObject
							? Static<Routes[K]["query"]>
							: any
					>,
			  ]
			: Routes[K]["query"] extends TObject
			? [FetchOption<any, Static<Routes[K]["query"]>>]
			: [FetchOption?]
	): Promise<
		BetterFetchResponse<
			Routes[K]["output"] extends TObject ? Static<Routes[K]["output"]> : T,
			E
		>
	>;
	native: typeof fetch;
}

export type CreateFetch = typeof createFetch;
export default betterFetch;
