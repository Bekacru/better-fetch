import { ZodSchema, type z } from "zod";
import { BetterFetchError } from "./error";
import { initializePlugins } from "./plugins";
import type { BetterFetchOption, BetterFetchResponse } from "./types";
import {
	detectResponseType,
	getBody,
	getFetch,
	getHeaders,
	getMethod,
	getTimeout,
	getURL,
	isJSONParsable,
	jsonParse,
} from "./utils";

export const betterFetch = async <
	TRes extends Option["output"] extends ZodSchema
		? z.infer<Option["output"]>
		: unknown,
	TErr = unknown,
	Option extends BetterFetchOption = BetterFetchOption,
>(
	url: string,
	options?: Option,
): Promise<
	BetterFetchResponse<
		TRes,
		TErr,
		Option["throw"] extends true ? true : TErr extends false ? true : false
	>
> => {
	const {
		hooks,
		url: __url,
		options: opts,
	} = await initializePlugins(url, options);
	const fetch = getFetch(opts);
	const controller = new AbortController();
	const signal = opts.signal ?? controller.signal;
	const _url = getURL(__url, opts);
	const body = getBody(opts);
	const headers = getHeaders(opts);
	const method = getMethod(__url, opts);

	let context = {
		...opts,
		url: _url,
		headers,
		body,
		method,
		signal,
	};
	/**
	 * Run all on request hooks
	 */
	for (const onRequest of hooks.onRequest) {
		if (onRequest) {
			context = await onRequest(context);
		}
	}

	if (
		("pipeTo" in (context as any) &&
			typeof (context as any).pipeTo === "function") ||
		typeof options?.body?.pipe === "function"
	) {
		if (!("duplex" in context)) {
			context.duplex = "half";
		}
	}

	const { clearTimeout } = getTimeout(opts, controller);

	let response = await fetch(context.url, context);
	clearTimeout();

	const responseContext = {
		response,
		request: context,
	};

	for (const onResponse of hooks.onResponse) {
		if (onResponse) {
			response = await onResponse(responseContext);
		}
	}

	/**
	 * OK Branch
	 */
	if (response.ok) {
		const hasBody = context.method !== "HEAD";
		if (!hasBody) {
			return {
				data: "" as any,
				error: null,
			} as any;
		}
		const responseType = detectResponseType(response);
		const successContext = {
			data: "" as any,
			response,
			request: context,
		};
		if (responseType === "json") {
			const text = await response.text();
			const parser = context.jsonParser ?? jsonParse;
			const data = await parser(text);
			successContext.data = data;
		} else {
			successContext.data = await response[responseType]();
		}
		/**
		 * Parse the data if the output schema is defined
		 */
		if (options?.output) {
			if (options.output instanceof ZodSchema && !options.disableValidation) {
				successContext.data = options.output.parse(successContext.data);
			}
		}

		for (const onSuccess of hooks.onSuccess) {
			if (onSuccess) {
				await onSuccess(successContext);
			}
		}

		if (options?.throw) {
			return {
				data: successContext.data,
			} as any;
		}

		return {
			data: successContext.data,
			error: null,
		} as any;
	}
	/**
	 * Error Branch
	 */
	const errorContext = {
		response,
		request: context,
	};
	for (const onError of hooks.onError) {
		if (onError) {
			await onError(errorContext);
		}
	}
	if (options?.retry && options.retry.count > 0) {
		if (options.retry.interval) {
			await new Promise((resolve) =>
				setTimeout(resolve, options.retry?.interval),
			);
		}
		return await betterFetch(url, {
			...options,
			retry: {
				count: options.retry.count - 1,
				interval: options.retry.interval,
			},
		});
	}

	const parser = options?.jsonParser ?? jsonParse;
	const text = await response.text();
	const errorObject = isJSONParsable(text) ? await parser(text) : {};

	if (options?.throw) {
		throw new BetterFetchError(
			response.status,
			response.statusText,
			errorObject,
		);
	}
	return {
		data: null,
		error: {
			...errorObject,
			status: response.status,
			statusText: response.statusText,
		},
	} as any;
};
