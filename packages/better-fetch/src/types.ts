import type { ZodSchema } from "zod";
import type { Auth } from "./auth";
import type { BetterFetchPlugin, FetchHooks } from "./plugins";
import type { RetryOptions } from "./retry";
import type { Prettify, StringLiteralUnion } from "./type-utils";

type CommonHeaders = {
	accept: "application/json" | "text/plain" | "application/octet-stream";
	"content-type":
		| "application/json"
		| "text/plain"
		| "application/x-www-form-urlencoded"
		| "multipart/form-data"
		| "application/octet-stream";
	authorization: "Bearer" | "Basic";
};
export type FetchEsque = (
	input: string | URL | globalThis.Request,
	init?: RequestInit,
) => Promise<Response>;

export type PayloadMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type NonPayloadMethod = "GET" | "HEAD" | "OPTIONS";
export type Method = PayloadMethod | NonPayloadMethod;

export type BetterFetchOption<
	Body = any,
	Query extends Record<string, any> = any,
	Params extends Record<string, any> | Array<string> | undefined = any,
	ExtraOptions extends Record<string, any> = {},
> = Prettify<
	ExtraOptions &
		Omit<RequestInit, "body"> &
		FetchHooks & {
			/**
			 * a timeout that will be used to abort the
			 * request. Should be in milliseconds.
			 */
			timeout?: number;
			/**
			 * Custom fetch implementation
			 */
			customFetchImpl?: FetchEsque;
			/**
			 * Better fetch plugins
			 * @see https://better-fetch.vercel.app/docs/plugins
			 */
			plugins?: BetterFetchPlugin[];
			/**
			 * Base url that will be prepended to the url passed
			 * to the fetch function
			 */
			baseURL?: string;
			/**
			 * Throw if the request fails.
			 *
			 * By default better fetch responds error as a
			 * value. But if you like it to throw instead you
			 * can pass throw:true here.
			 * @default false
			 */
			throw?: boolean;
			/**
			 * Authorization headers
			 */
			auth?: Auth;
			/**
			 * Headers
			 */
			headers?: CommonHeaders | Headers | HeadersInit;
			/**
			 * Body
			 */
			body?: Body;
			/**
			 * Query parameters (key-value pairs)
			 */
			query?: Query;
			/**
			 * Dynamic parameters
			 */
			params?: Params;
			/**
			 * Duplex mode
			 */
			duplex?: "full" | "half";
			/**
			 * Custom JSON parser
			 */
			jsonParser?: <T>(text: string) => Promise<T | undefined>;
			/**
			 * Retry count
			 */
			retry?: RetryOptions;
			/**
			 * the number of times the request has already been retried
			 */
			retryAttempt?: number;
			/**
			 * HTTP method
			 */
			method?: StringLiteralUnion<PayloadMethod | NonPayloadMethod>;
			/**
			 * Expected output schema
			 * You can use this to infer the response
			 * type and to validate the response.
			 *
			 * @example
			 * ```ts
			 * const { data, error } = await $fetch
			 * ("https://jsonplaceholder.typicode.com/
			 * todos/1", {
			 *   output: z.object({
			 *     userId: z.number(),
			 *     id: z.number(),
			 *     title: z.string(),
			 *     completed: z.boolean(),
			 *   }),
			 * });
			 * ```
			 */
			output?: ZodSchema | typeof Blob | typeof File;
			/**
			 * Additional error schema for the error object if the
			 * response fails.
			 */
			errorSchema?: ZodSchema;
			/**
			 * Disable zod validation for the response
			 * @default false
			 */
			disableValidation?: boolean;
		}
>;

type Data<T> = { data: T; error: null };
type Error<E> = {
	data: null;
	error: Prettify<
		(E extends Record<string, any> ? E : { message?: string }) & {
			status: number;
			statusText: string;
		}
	>;
};
export type BetterFetchResponse<
	T,
	E extends Record<string, unknown> | unknown = unknown,
	Throw extends boolean = false,
> = Throw extends true ? T : Data<T> | Error<E>;
