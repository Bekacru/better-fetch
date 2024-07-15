import { betterFetch } from "../fetch";
import type { BetterFetchOption } from "../types";
import type { BetterFetch, CreateFetchOption } from "./types";

export const createFetch = <Option extends CreateFetchOption>(
	config?: Option,
) => {
	async function $fetch(url: string, options?: BetterFetchOption) {
		if (config?.catchAllError) {
			try {
				return await betterFetch(url, {
					...config,
					...options,
				});
			} catch (error) {
				return {
					data: null,
					error: {
						status: 500,
						statusText: "Fetch Error",
						message:
							"Fetch related error. Captured by catchAllError option. See error property for more details.",
						error,
					},
				};
			}
		}
		return await betterFetch(url, {
			...config,
			...options,
		});
	}
	return $fetch as BetterFetch<Option>;
};

export * from "./schema";
export * from "./types";
