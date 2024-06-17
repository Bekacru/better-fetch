import { BetterFetchOption } from ".";
/**
 * Bearer token authentication
 *
 * the value of `token` will be added to a header as
 * `Authorization: Bearer token`,
 */
export type Bearer = {
	type: "bearer";
	token: string;
};

/**
 * Basic auth
 */
export type Basic = {
	type: "basic";
	username: string;
	password: string;
};

export type CustomAuth = {
	type: "custom";
	/**
	 * Custom header value.
	 * This will be added to a header as `key: value`
	 */
	[key: string]: any;
};

export type Auth = Bearer | Basic | CustomAuth;

export const getAuthHeader = (options?: BetterFetchOption) => {
	const headers: Record<string, string> = {};

	if (options?.auth) {
		if (options.auth.type === "bearer") {
			headers["Authorization"] = `Bearer ${options.auth.token}`;
		} else if (options.auth.type === "basic") {
			headers["Authorization"] = `Basic ${btoa(
				`${options.auth.username}:${options.auth.password}`,
			)}`;
		} else if (options.auth.type === "custom") {
			Object.entries(options.auth).forEach(([key, value]) => {
				if (key !== "type") {
					headers[key] = value;
				}
			});
		}
	}

	return headers;
};
