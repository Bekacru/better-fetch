import { Schema } from "./create-fetch";
import type { BetterFetchOption } from "./types";

export type RequestContext = {
	url: URL;
	headers: Headers;
	body: any;
	method: string;
	signal: AbortSignal;
} & BetterFetchOption;
export type ResponseContext = {
	response: Response;
	request: RequestContext;
};
export type SuccessContext = {
	data: any;
	response: Response;
	request: RequestContext;
};
export type ErrorContext = {
	response: Response;
	request: RequestContext;
};

export interface FetchHooks {
	/**
	 * a callback function that will be called when a
	 * request is made.
	 *
	 * The returned context object will be reassigned to
	 * the original request context.
	 */
	onRequest?: (
		context: RequestContext,
	) => Promise<RequestContext> | RequestContext;
	/**
	 * a callback function that will be called when
	 * response is received. This will be called before
	 * the response is parsed and returned.
	 *
	 * The returned response will be reassigned to the
	 * original response if it's changed.
	 */
	onResponse?: (context: ResponseContext) => Promise<Response> | Response;
	/**
	 * a callback function that will be called when a
	 * response is successful.
	 */
	onSuccess?: (context: SuccessContext) => Promise<void> | void;
	/**
	 * a callback function that will be called when an
	 * error occurs.
	 */
	onError?: (context: ErrorContext) => Promise<void> | void;
	/**
	 * a callback function that will be called when a
	 * request is retried.
	 */
	onRetry?: (response: ResponseContext) => Promise<void> | void;
}

/**
 * A plugin that returns an id and hooks
 */
export type BetterFetchPlugin = {
	/**
	 * A unique id for the plugin
	 */
	id: string;
	/**
	 * A name for the plugin
	 */
	name: string;
	/**
	 * A description for the plugin
	 */
	description?: string;
	/**
	 * Hooks for the plugin
	 */
	hooks?: FetchHooks;
	/**
	 * A function that will be called when the plugin is
	 * initialized. This will be called before the any
	 * of the other internal functions.
	 *
	 * The returned options will be merged with the
	 * original options.
	 */
	init?: (
		url: string,
		options?: BetterFetchOption,
	) => Promise<{
		url: string;
		options?: BetterFetchOption;
	}>;
	schema?: Schema;
};

export const initializePlugins = async (
	url: string,
	options?: BetterFetchOption,
) => {
	let opts = options || {};
	const hooks: {
		onRequest: Array<FetchHooks["onRequest"]>;
		onResponse: Array<FetchHooks["onResponse"]>;
		onSuccess: Array<FetchHooks["onSuccess"]>;
		onError: Array<FetchHooks["onError"]>;
	} = {
		onRequest: [options?.onRequest],
		onResponse: [options?.onResponse],
		onSuccess: [options?.onSuccess],
		onError: [options?.onError],
	};
	if (!options || !options?.plugins) {
		return {
			url,
			options: opts,
			hooks,
		};
	}
	for (const plugin of options?.plugins || []) {
		if (plugin.init) {
			const pluginRes = await plugin.init?.(url.toString(), options);
			opts = pluginRes.options || opts;
			url = pluginRes.url;
		}
		hooks.onRequest.push(plugin.hooks?.onRequest);
		hooks.onResponse.push(plugin.hooks?.onResponse);
		hooks.onSuccess.push(plugin.hooks?.onSuccess);
		hooks.onError.push(plugin.hooks?.onError);
	}

	return {
		url,
		options: opts,
		hooks,
	};
};
