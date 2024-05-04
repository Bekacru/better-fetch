import { useEffect, useState } from "react";
import {
	BetterFetchResponse,
	createFetch,
	FetchOption,
	PayloadMethod,
} from ".";
import { isPayloadMethod } from "./utils";
import { DefaultSchema } from "./typed";
import { FetchSchema } from "./typed";
import { z, ZodSchema } from "zod";

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

export type ReactFetchOptions<T = any> = {
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
} & FetchOption;

export type ReactMutateOptions = {} & FetchOption;

const defaultOptions: ReactFetchOptions = {
	refetchInterval: 0,
	refetchOnMount: true,
	refetchOnFocus: false,
	disableCache: false,
};

export const createReactFetch = <
	Routes extends FetchSchema = DefaultSchema,
	R = unknown,
	F = unknown,
>(
	config?: ReactFetchOptions,
) => {
	const betterFetch = createFetch<Routes, R, F>(config);
	const useFetch = <
		R = unknown,
		E = unknown,
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
				Routes[K]["output"] extends ZodSchema
					? BetterFetchResponse<z.infer<Routes[K]["output"]>>
					: BetterFetchResponse<R>
			>(initial);
		const [isLoading, setIsLoading] = useState(false);
		const fetchData = async () => {
			setIsLoading(true);
			const response = await betterFetch(url.toString(), options as any);
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
			data: res?.data as Routes[K]["output"] extends ZodSchema
				? z.infer<Routes[K]["output"]>
				: R,
			error: isLoading ? null : res?.error,
			isError: res?.error && !isLoading,
			isLoading,
			refetch: fetchData,
		};
	};

	const useMutate = <T = undefined, K extends keyof Routes = keyof Routes>(
		url: K | URL | Omit<string, keyof Routes>,
		options?: ReactMutateOptions,
	) => {
		if (options?.method && !isPayloadMethod(options?.method)) {
			throw new Error("Method must be a payload method");
		}

		async function mutate(
			...args: T extends undefined
				? Routes[K]["input"] extends ZodSchema
					? [z.infer<NonNullable<Routes[K]["input"]>>]
					: [undefined?]
				: [T]
		) {
			const res = await betterFetch<Routes>(url.toString(), {
				...options,
				body: args[0],
				method: (options?.method as PayloadMethod) || "POST",
			} as any);
			return res as BetterFetchResponse<
				z.infer<NonNullable<Routes[K]["output"]>>
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
