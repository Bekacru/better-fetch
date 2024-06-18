import { BetterFetchOption } from ".";
/**
 * Bearer token authentication
 *
 * the value of `token` will be added to a header as
 * `Authorization: Bearer token`,
 */
export type Bearer = {
	type: "Bearer";
	token: string;
};

/**
 * Basic auth
 */
export type Basic = {
	type: "Basic";
	username: string;
	password: string;
};

export type Auth = Bearer | Basic;

export const getAuthHeader = (options?: BetterFetchOption) => {
	const headers: Record<string, string> = {};

	if (options?.authorization) {
		if (options.authorization.type === "Bearer") {
			headers["Authorization"] = `Bearer ${options.authorization.token}`;
		} else if (options.authorization.type === "Basic") {
			headers["Authorization"] = `Basic ${btoa(
				`${options.authorization.username}:${options.authorization.password}`,
			)}`;
		}
	}

	return headers;
};
