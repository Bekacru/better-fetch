import type { BetterFetchOption } from "./types";

export type typeOrTypeReturning<T> = T | (() => T);
/**
 * Bearer token authentication
 *
 * the value of `token` will be added to a header as
 * `auth: Bearer token`,
 */
export type Bearer = {
	type: "Bearer";
	token: typeOrTypeReturning<string | undefined | Promise<string | undefined>>;
};

/**
 * Basic auth
 */
export type Basic = {
	type: "Basic";
	username: typeOrTypeReturning<string | undefined>;
	password: typeOrTypeReturning<string | undefined>;
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
	prefix: typeOrTypeReturning<string | undefined>;
	value: typeOrTypeReturning<string | undefined>;
};

export type Auth = Bearer | Basic | Custom;

export const getAuthHeader = async (options?: BetterFetchOption) => {
	const headers: Record<string, string> = {};
	const getValue = async (
		value: typeOrTypeReturning<
			string | undefined | Promise<string | undefined>
		>,
	) => (typeof value === "function" ? await value() : value);
	if (options?.auth) {
		if (options.auth.type === "Bearer") {
			const token = await getValue(options.auth.token);
			if (!token) {
				return headers;
			}
			headers["authorization"] = `Bearer ${token}`;
		} else if (options.auth.type === "Basic") {
			const username = await getValue(options.auth.username);
			const password = await getValue(options.auth.password) ?? "";
			if (!username) {
				return headers;
			}
			headers["authorization"] = `Basic ${btoa(`${username}:${password}`)}`;
		} else if (options.auth.type === "Custom") {
			const value = await getValue(options.auth.value);
			if (!value) {
				return headers;
			}
			headers["authorization"] = `${getValue(options.auth.prefix)} ${value}`;
		}
	}
	return headers;
};
