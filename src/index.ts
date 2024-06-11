import { Readable } from "stream";
import { BetterFetchError, FetchError } from "./error";
import {
	detectResponseType,
	FetchEsque,
	getFetch,
	isJSONParsable,
	isJSONSerializable,
	isRouteMethod,
	jsonParse,
} from "./utils";
import { FetchSchema, ParameterSchema, Strict } from "./typed";
import { z, ZodObject, ZodOptional } from "zod";

interface RequestContext {
	request: Request;
	controller: AbortController;
	options: BetterFetchOption;
}

interface ResponseContext {
	response: Response;
}

export type BaseFetchOptions<
	R extends FetchSchema | Strict<FetchSchema> = any,
> = {
	routes?: R;
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
	(url: string, options?: BetterFetchOption): Promise<{
		url: string;
		options?: BetterFetchOption;
	}>;
}

export type CreateFetchOption<R extends FetchSchema | Strict<FetchSchema>> =
	BaseFetchOptions & {
		routes?: R;
	};

export type PayloadMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type NonPayloadMethod = "GET" | "HEAD" | "OPTIONS";

export type BetterFetchOption<
	T extends Record<string, unknown> = any,
	Q extends Record<string, unknown> = any,
	P extends Record<string, unknown> | false = false,
	R extends FetchSchema | Strict<FetchSchema> = any,
> = InferBody<T> & InferQuery<Q> & BaseFetchOptions & InferParams<P>;

type InferParams<P> = P extends Record<string, any> | Array<any>
	? {
			params: P;
	  }
	: {
			params?: string[];
	  };

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

export const betterFetch = async <T = any, E = unknown>(
	url: string,
	options?: BetterFetchOption,
): Promise<BetterFetchResponse<T, E>> => {
	const fetch = getFetch(options?.customFetchImpl);
	const controller = new AbortController();
	const signal = controller.signal;

	for (const plugin of options?.plugins || []) {
		const pluginRes = await plugin(url.toString(), options);
		url = pluginRes.url as any;
		options = pluginRes.options;
	}

	const routes = options?.routes;
	const schema = routes
		? (("schema" in routes ? routes.schema : routes) as FetchSchema)
		: null;
	const path = options?.baseURL ? url.replace(options.baseURL, "") : url;
	const route = schema ? schema[path] : null;
	if (!route && routes?.strict) {
		throw new BetterFetchError(`Cannot find any path matching ${path}.`);
	}

	const pMethod = url.split("@")[1]?.split("/")[0];

	/**
	 * Dynamic Parameters.
	 * If more than one they are going to be an array else they'll be an object
	 */
	const params = options?.params
		? Array.isArray(options.params)
			? `/${options.params.join("/")}`
			: `/${Object.values(options.params).join("/")}`
		: "";
	let u = url.toString().split("/:")[0];

	u = u.replace(`@${pMethod}`, "");

	const _url = new URL(`${options?.baseURL ?? ""}${u}${params}`);
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
	const query = route?.query
		? route.query.parse(options?.query)
		: options?.query;
	if (query) {
		for (const [key, value] of Object.entries(query)) {
			_url.searchParams.append(key, String(value));
		}
	}
	const body = route?.input ? route.input.parse(options?.body) : options?.body;

	const method = url.startsWith("@")
		? isRouteMethod(pMethod)
			? pMethod
			: options?.method
		: options?.method;

	const _options: BetterFetchOption = {
		signal,
		...options,
		body: shouldStringifyBody ? JSON.stringify(body) : body ? body : undefined,
		headers,
		method: method
			? (method as "POST" | "GET")
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
			data: {} as any,
			error: null,
		};
	}
	const responseType = detectResponseType(response);
	if (response.ok) {
		if (responseType === "json" || responseType === "text") {
			const parser = options?.jsonParser ?? jsonParse;
			const text = await response.text();
			const json = isJSONParsable(text) ? await parser(text) : text;
			const routeOutput = route?.output ? route.output.parse(json) : json;
			await options?.onSuccess?.(responseContext);
			return {
				data: routeOutput,
				error: null,
			};
		} else {
			return {
				data: (await response[responseType]()) as any,
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
			status: response.status,
			statusText: response.statusText,
		} as any,
	};
};

export const createFetch = <
	R = unknown,
	E = unknown,
	Routes extends FetchSchema | Strict<FetchSchema> = FetchSchema,
>(
	config?: CreateFetchOption<Routes>,
): BetterFetch<R, E, Routes> => {
	const $fetch = async (url: string, options: BetterFetchOption) => {
		return await betterFetch(url, {
			...config,
			...options,
		});
	};
	$fetch.native = fetch;
	$fetch.routes = config?.routes;
	return $fetch as any;
};

betterFetch.native = fetch;

type InferParam<S, Z> = Z extends Record<string, ParameterSchema>
	? {
			[key in keyof Z]: z.infer<Z[key]>;
	  }
	: S extends `${infer _}:${infer P}`
	? P extends `${infer _2}:${infer _P}`
		? Array<string>
		: {
				[key in P]: string;
		  }
	: false;

export type InferOptions<
	T extends FetchSchema,
	K extends string,
> = T[K]["input"] extends z.ZodSchema
	? T[K]["input"] extends ZodOptional<ZodObject<any>>
		? [
				BetterFetchOption<
					z.infer<T[K]["input"]>,
					T[K]["query"] extends z.ZodSchema ? z.infer<T[K]["query"]> : any,
					InferParam<K, T[K]["params"]>
				>?,
		  ]
		: [
				BetterFetchOption<
					z.infer<T[K]["input"]>,
					T[K]["query"] extends z.ZodSchema ? z.infer<T[K]["query"]> : any,
					InferParam<K, T[K]["params"]>
				>,
		  ]
	: T[K]["query"] extends z.ZodSchema
	? [BetterFetchOption<any, z.infer<T[K]["query"]>>]
	: T[K]["params"] extends {
			[key: string]: ParameterSchema;
	  }
	? [BetterFetchOption<any, any, InferParam<K, T[K]["params"]>>]
	: K extends `${infer _}/:${infer __}`
	? [BetterFetchOption<any, any, InferParam<K, T[K]["params"]>>]
	: [BetterFetchOption?];

export type InferResponse<
	T extends FetchSchema,
	K extends keyof T,
> = T[K]["output"] extends z.ZodSchema ? z.infer<T[K]["output"]> : never;

export type InferSchema<Routes extends FetchSchema | Strict<FetchSchema>> =
	Routes extends FetchSchema ? Routes : Routes["schema"];

export interface BetterFetch<
	BaseT = any,
	BaseE = unknown,
	Routes extends FetchSchema | Strict<FetchSchema> = {
		[key in string]: {
			output: any;
		};
	},
> {
	<
		T = undefined,
		E = BaseE,
		K extends Routes extends Strict<any>
			? keyof InferSchema<Routes>
			:
					| Omit<string, keyof Routes>
					| keyof InferSchema<Routes>
					| URL = Routes extends Strict<any>
			? keyof InferSchema<Routes>
			: Omit<string, keyof Routes> | keyof InferSchema<Routes> | URL,
		Key extends string = K extends string ? K : never,
	>(
		url: K,
		...options: Routes extends FetchSchema
			? InferOptions<InferSchema<Routes>, Key>
			: Routes extends Strict<any>
			? K extends keyof Routes["schema"]
				? InferOptions<Routes["schema"], Key>
				: [BetterFetchOption?]
			: [BetterFetchOption?]
	): Promise<
		BetterFetchResponse<
			T extends undefined
				? Routes extends Strict<any>
					? InferResponse<Routes["schema"], Key>
					: Routes extends FetchSchema
					? InferResponse<InferSchema<Routes>, Key> extends never
						? BaseT
						: InferResponse<InferSchema<Routes>, Key>
					: BaseT
				: T,
			E
		>
	>;
	native: typeof fetch;
	routes: Routes;
}

export type CreateFetch = typeof createFetch;
export default betterFetch;
