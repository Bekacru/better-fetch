import type { BetterFetchOption } from "./types";

type stringOrReturning = string | (() => string);
/**
 * Bearer token authentication
 *
 * the value of `token` will be added to a header as
 * `auth: Bearer token`,
 */
export type Bearer = {
	type: "Bearer";
	token: stringOrReturning;
};

/**
 * Basic auth
 */
export type Basic = {
	type: "Basic";
	username: stringOrReturning;
	password: stringOrReturning;
};

/**
 * Custom auth
 *
 * @param prefix - prefix of the header
 * @param value - value of the header
 *
 * @example
 * ```ts
 * {
 *  type: "Custom",
 *  prefix: "Token",
 *  value: "token"
 * }
 * ```
 */
export type Custom = {
	type: "Custom";
	prefix: stringOrReturning;
	value: stringOrReturning;
};

export type Auth = Bearer | Basic | Custom;

export const getAuthHeader = (options?: BetterFetchOption) => {
	const headers: Record<string, string> = {};
	const getValue = (value: stringOrReturning) =>
		typeof value === "function" ? value() : value;
	if (options?.auth) {
		if (options.auth.type === "Bearer") {
			headers["authorization"] = `Bearer ${getValue(options.auth.token)}`;
		} else if (options.auth.type === "Basic") {
			headers["authorization"] = `Basic ${btoa(
				`${getValue(options.auth.username)}:${getValue(options.auth.password)}`,
			)}`;
		} else if (options.auth.type === "Custom") {
			headers["authorization"] = `${getValue(options.auth.prefix)} ${getValue(
				options.auth.value,
			)}`;
		}
	}
	return headers;
};
