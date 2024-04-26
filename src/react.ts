import { useEffect, useState } from "react";
import {
	BetterFetchResponse,
	createFetch,
	FetchOption,
	PayloadMethod,
} from ".";
import { isPayloadMethod } from "./utils";

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

export const createReactFetch = <R = unknown, F = unknown>(
	config?: ReactFetchOptions,
) => {
	const betterFetch = createFetch<R, F>(config);
	const useFetch = <R = unknown, E = unknown>(
		url: string,
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

		const [res, setRes] = useState<BetterFetchResponse<R, E>>(initial);
		const [isLoading, setIsLoading] = useState(false);
		const fetchData = async () => {
			setIsLoading(true);
			const response = await betterFetch(url, options);
			if (!response.error) {
				_cache.set(url, response);
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
			const cached = _cache.get<BetterFetchResponse<R>>(url);
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
			data: res?.data,
			error: isLoading ? null : res?.error,
			isError: res?.error && !isLoading,
			isLoading,
			refetch: fetchData,
		};
	};

	const useMutate = <T = undefined>(
		url: string,
		options?: ReactMutateOptions,
	) => {
		if (options?.method && !isPayloadMethod(options?.method)) {
			throw new Error("Method must be a payload method");
		}

		async function mutate(...args: T extends undefined ? [undefined?] : [T]) {
			const res = await betterFetch(url, {
				...options,
				body: args[0],
				method: (options?.method as PayloadMethod) || "POST",
			});
			return res;
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

export const { useFetch, useMutate, betterFetch } = createReactFetch();
