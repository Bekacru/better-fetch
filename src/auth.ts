import type { BetterFetchOption } from ".";

type stringOrReturning = string | (() => string);
/**
 * Bearer token authentication
 *
 * the value of `token` will be added to a header as
 * `Authorization: Bearer token`,
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
	if (options?.authorization) {
		if (options.authorization.type === "Bearer") {
			headers["Authorization"] = `Bearer ${getValue(
				options.authorization.token,
			)}`;
		} else if (options.authorization.type === "Basic") {
			headers["Authorization"] = `Basic ${btoa(
				`${getValue(options.authorization.username)}:${getValue(
					options.authorization.password,
				)}`,
			)}`;
		} else if (options.authorization.type === "Custom") {
			headers["Authorization"] = `${getValue(
				options.authorization.prefix,
			)} ${getValue(options.authorization.value)}`;
		}
	}
	return headers;
};
