import { betterFetch } from "../fetch";
import type { BetterFetchOption } from "../types";
import type { BetterFetch, CreateFetchOption } from "./types";
import { BetterFetchPlugin } from "../plugins";
import { methods } from "./schema";

const applySchemaPlugin = (config: CreateFetchOption) =>
	({
		id: "apply-schema",
		name: "Apply Schema",
		async init(url, options) {
			let method = "";
			if (url.startsWith("@")) {
				const pMethod = url.split("@")[1]?.split("/")[0];
				if (methods.includes(pMethod)) {
					method = pMethod;
				}
			}
			if (config.schema) {
				const schema = config.schema.schema[url];
				if (schema) {
					return {
						url,
						options: {
							method: schema.method ?? method,
							output: schema.output,
							...options,
						},
					};
				}
			}
			return {
				url,
				options,
			};
		},
	}) satisfies BetterFetchPlugin;

export const createFetch = <Option extends CreateFetchOption>(
	config?: Option,
) => {
	async function $fetch(url: string, options?: BetterFetchOption) {
		const opts = {
			...config,
			...options,
			plugins: [
				...(config?.plugins || []),
				config?.schema ? applySchemaPlugin(config) : [],
			],
		} as BetterFetchOption;

		if (config?.catchAllError) {
			try {
				return await betterFetch(url, opts);
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
		return await betterFetch(url, opts);
	}
	return $fetch as BetterFetch<Option>;
};

export * from "./schema";
export * from "./types";
