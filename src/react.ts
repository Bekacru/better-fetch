import { useEffect, useState } from "react";
import {
	BetterFetchResponse,
	createFetch,
	BetterFetchOption,
	PayloadMethod,
	InferResponse,
	InferSchema,
} from ".";
import { isPayloadMethod } from "./utils";
import { DefaultSchema, Strict } from "./typed";
import { FetchSchema } from "./typed";
import { z } from "zod";

const cache = (storage: Storage, disable?: boolean) => {
	return {
		set: (key: string, value: any) => {
			if (disable) return;
			storage.setItem(key, JSON.stringify(value));
		},
		get: <T>(key: string) => {
			if (disable) return null;
			const value = storage.getItem(key);
			return value ? (JSON.parse(value) as T) : null;
		},
	};
};

export type ReactFetchOptions<
	T = any,
	R extends FetchSchema | Strict<any> = any,
> = {
	storage?: Storage;
	/**
	 * Interval to refetch data in milliseconds
	 */
	refetchInterval?: number;
	/**
	 * Refetch data on mount
	 */
	refetchOnMount?: boolean;
	/**
	 * Refetch data on focus
	 */
	refetchOnFocus?: boolean;
	/**
	 * Initial data
	 */
	initialData?: T;
	/**
	 * Disable cache
	 * @default false
	 */
	disableCache?: boolean;
} & BetterFetchOption<R>;

export type ReactMutateOptions = {} & BetterFetchOption;

const defaultOptions: ReactFetchOptions = {
	refetchInterval: 0,
	refetchOnMount: true,
	refetchOnFocus: false,
	disableCache: false,
};

export const createReactFetch = <
	R = unknown,
	F = unknown,
	Routes extends FetchSchema | Strict<FetchSchema> = any,
>(
	config?: ReactFetchOptions<any, Routes>,
) => {
	const betterFetch = createFetch(config);
	const useFetch = <
		R = undefined,
		E = undefined,
		K extends keyof Routes = keyof Routes,
	>(
		url: K | URL | Omit<string, K>,
		opts?: ReactFetchOptions<R>,
	) => {
		const options = {
			...defaultOptions,
			...config,
			...opts,
		};
		const _cache = cache(
			options?.storage || config?.storage || sessionStorage,
			options.disableCache,
		);
		const initial = {
			data: options?.initialData ? options.initialData : null,
			error: options?.initialData
				? null
				: { status: 404, statusText: "Not Found" },
		} as any;

		const [res, setRes] =
			useState<
				BetterFetchResponse<
					typeof betterFetch["routes"] extends Strict<any>
						? InferResponse<typeof betterFetch["routes"]["schema"], K>
						: typeof betterFetch["routes"] extends FetchSchema
						? unknown
						: any
				>
			>(initial);
		const [isLoading, setIsLoading] = useState(false);
		const fetchData = async () => {
			setIsLoading(true);
			const response = await betterFetch(url.toString() as any, options);
			if (!response.error) {
				_cache.set(url.toString(), response);
			}
			setIsLoading(false);
			setRes(response as any);
		};

		useEffect(() => {
			const onFocus = () => {
				if (options?.refetchOnFocus) {
					fetchData();
				}
			};
			window.addEventListener("focus", onFocus);
			return () => {
				window.removeEventListener("focus", onFocus);
			};
		}, []);

		useEffect(() => {
			const refetchInterval = options?.refetchInterval
				? setInterval(fetchData, options?.refetchInterval)
				: null;
			const cached = _cache.get<BetterFetchResponse<R>>(url.toString());
			if (cached && !options.refetchOnMount) {
				setRes(cached as any);
			} else {
				fetchData();
			}
			return () => {
				setRes(initial);
				if (refetchInterval) {
					clearInterval(refetchInterval);
				}
			};
		}, []);
		return {
			data: res?.data as R extends undefined ? typeof res.data : R,
			error: isLoading ? null : res?.error,
			isError: res?.error && !isLoading,
			isLoading,
			refetch: fetchData,
		};
	};

	const useMutate = <
		T = undefined,
		K extends keyof InferSchema<Routes> = keyof InferSchema<Routes>,
	>(
		url: Routes extends Strict<any> ? K : K | URL | Omit<string, K>,
		options?: ReactMutateOptions,
	) => {
		if (options?.method && !isPayloadMethod(options?.method)) {
			throw new Error("Method must be a payload method");
		}

		async function mutate(
			...args: T extends undefined
				? Routes extends FetchSchema
					? K extends keyof Routes
						? [z.infer<NonNullable<Routes[K]["input"]>>]
						: [undefined?]
					: Routes extends Strict<FetchSchema>
					? K extends keyof Routes["schema"]
						? [z.infer<NonNullable<Routes["schema"][K]["input"]>>]
						: [undefined?]
					: [undefined?]
				: [T]
		) {
			const res = await betterFetch<Routes>(url.toString() as any, {
				...options,
				body: args[0],
				method: (options?.method as PayloadMethod) || "POST",
			});
			return res as BetterFetchResponse<
				Routes extends Strict<any>
					? InferResponse<Routes["schema"], K>
					: Routes extends FetchSchema
					? K extends string | number
						? InferResponse<Routes, K>
						: R
					: R
			>;
		}
		return {
			mutate,
		};
	};

	return {
		betterFetch,
		useFetch,
		useMutate,
	};
};

export const { useFetch, betterFetch, useMutate } =
	createReactFetch<DefaultSchema>();
