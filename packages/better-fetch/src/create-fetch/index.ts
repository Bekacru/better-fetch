import { z } from "zod";
import { betterFetch } from "../fetch";
import { BetterFetchPlugin } from "../plugins";
import type { BetterFetchOption } from "../types";
import { createSchema, methods } from "./schema";
import type { BetterFetch, CreateFetchOption } from "./types";

const applySchemaPlugin = (config: CreateFetchOption) =>
	({
		id: "apply-schema",
		name: "Apply Schema",
		version: "1.0.0",
		async init(url, options) {
			const schema =
				config.plugins?.find((plugin) =>
					plugin.schema?.config
						? url.startsWith(plugin.schema.config.baseURL || "") ||
							url.startsWith(plugin.schema.config.prefix || "")
						: false,
				)?.schema || config.schema;
			if (schema) {
				let urlKey = url;
				if (schema.config?.prefix) {
					if (urlKey.startsWith(schema.config.prefix)) {
						urlKey = urlKey.replace(schema.config.prefix, "");
						if (schema.config.baseURL) {
							url = url.replace(schema.config.prefix, schema.config.baseURL);
						}
					}
				}
				if (schema.config?.baseURL) {
					if (urlKey.startsWith(schema.config.baseURL)) {
						urlKey = urlKey.replace(schema.config.baseURL, "");
					}
				}
				const keySchema = schema.schema[urlKey];
				if (keySchema) {
					let opts = {
						...options,
						method: keySchema.method,
						output: keySchema.output,
					};
					if (!options?.disableValidation) {
						opts = {
							...opts,
							body: keySchema.input
								? keySchema.input.parse(options?.body)
								: options?.body,
							params: keySchema.params
								? keySchema.params.parse(options?.params)
								: options?.params,
							query: keySchema.query
								? keySchema.query.parse(options?.query)
								: options?.query,
						};
					}
					return {
						url,
						options: opts,
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
			plugins: [...(config?.plugins || []), applySchemaPlugin(config || {})],
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
