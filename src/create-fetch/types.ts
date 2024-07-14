import type { LiteralUnion } from "type-fest";
import type { ZodSchema, z } from "zod";
import type { BetterFetchOption, BetterFetchResponse } from "../types";
import type {
	FetchSchema,
	IsOptionRequired,
	RequiredOptionKeys,
	Schema,
} from "./schema";

export interface CreateFetchOption extends BetterFetchOption {
	schema?: Schema;
	/**
	 * Catch all error including non api errors. Like schema validation, etc.
	 * @default false
	 */
	catchAllError?: boolean;
}

type WithRequired<T, K extends keyof T | never> = T & { [P in K]-?: T[P] };

type InferBody<T> = T extends ZodSchema ? z.infer<T> : any;
type InferQuery<T> = T extends ZodSchema ? z.infer<T> : any;
export type InferParam<Path, Param> = Param extends ZodSchema
	? z.infer<Param>
	: Path extends `${infer _}:${infer P}`
		? P extends `${infer _2}:${infer _P}`
			? Array<string>
			: {
					[key in P]: string;
				}
		: never;

export type InferOptions<T extends FetchSchema, Key> = WithRequired<
	BetterFetchOption<
		InferBody<T["input"]>,
		InferQuery<T["query"]>,
		InferParam<Key, T["params"]>
	>,
	RequiredOptionKeys<T> extends keyof BetterFetchOption
		? RequiredOptionKeys<T>
		: never
>;

export type InferKey<S> = S extends Schema
	? S["config"]["strict"] extends true
		? keyof S["schema"]
		: LiteralUnion<keyof S["schema"], string>
	: string;

export type BetterFetch<
	CreateOptions extends CreateFetchOption,
	DefaultRes = unknown,
	DefaultErr = unknown,
	S extends CreateOptions["schema"] = CreateOptions["schema"],
> = <
	Res = DefaultRes,
	Err = DefaultErr,
	K extends InferKey<S> = InferKey<S>,
	F extends S extends Schema ? S["schema"][K] : unknown = S extends Schema
		? S["schema"][K]
		: unknown,
	O extends BetterFetchOption = BetterFetchOption,
>(
	url: K,
	...options: F extends FetchSchema
		? IsOptionRequired<F> extends true
			? [InferOptions<F, K>]
			: [InferOptions<F, K>?]
		: [O?]
) => Promise<
	BetterFetchResponse<
		O["output"] extends ZodSchema
			? z.infer<O["output"]>
			: F extends FetchSchema
				? F["output"] extends ZodSchema
					? z.infer<F["output"]>
					: Res
				: Res,
		Err,
		O["throw"] extends true
			? true
			: CreateOptions["throw"] extends true
				? true
				: false
	>
>;
