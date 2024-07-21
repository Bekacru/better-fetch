import type { ZodObject, ZodSchema, z } from "zod";
import type { StringLiteralUnion } from "../type-utils";
import type { BetterFetchOption, BetterFetchResponse } from "../types";
import type {
	FetchSchema,
	IsOptionRequired,
	RequiredOptionKeys,
	Schema,
} from "./schema";
import { BetterFetchPlugin } from "../plugins";

export interface CreateFetchOption extends BetterFetchOption {
	schema?: Schema;
	/**
	 * Catch all error including non api errors. Like schema validation, etc.
	 * @default false
	 */
	catchAllError?: boolean;
	defaultOutput?: ZodSchema;
	defaultError?: ZodSchema;
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
		: S["config"]["prefix"] extends string
			? StringLiteralUnion<`${S["config"]["prefix"]}${keyof S["schema"] extends string
					? keyof S["schema"]
					: never}`>
			: S["config"]["baseURL"] extends string
				? `${S["config"]["baseURL"]}${keyof S["schema"] extends string
						? keyof S["schema"]
						: never}`
				: StringLiteralUnion<
						keyof S["schema"] extends string ? keyof S["schema"] : never
					>
	: string;

export type GetKey<S, K> = S extends Schema
	? S["config"]["baseURL"] extends string
		? K extends `${S["config"]["baseURL"]}${infer AK}`
			? AK extends string
				? AK
				: string
			: S["config"]["prefix"] extends string
				? K extends `${S["config"]["prefix"]}${infer AP}`
					? AP
					: string
				: string
		: K
	: K;

type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (
	x: infer I,
) => void
	? I
	: never;

export type PluginSchema<P> = P extends BetterFetchPlugin
	? P["schema"] extends Schema
		? P["schema"]
		: never
	: never;

export type MergeSchema<Options extends CreateFetchOption> =
	Options["plugins"] extends Array<infer P>
		? PluginSchema<P> & Options["schema"]
		: Options["schema"];

export type BetterFetch<
	CreateOptions extends CreateFetchOption,
	DefaultRes = CreateOptions["defaultOutput"] extends ZodSchema
		? z.infer<CreateOptions["defaultOutput"]>
		: unknown,
	DefaultErr = CreateOptions["defaultError"] extends ZodSchema
		? z.infer<CreateOptions["defaultError"]>
		: unknown,
	S extends MergeSchema<CreateOptions> = MergeSchema<CreateOptions>,
> = <
	Res = DefaultRes,
	Err = DefaultErr,
	U extends InferKey<S> = InferKey<S>,
	K extends GetKey<S, U> = GetKey<S, U>,
	F extends S extends Schema
		? S["schema"] extends Array<infer R>
			? //@ts-expect-error
				UnionToIntersection<R>[K]
			: S["schema"][K]
		: unknown = S extends Schema
		? S["schema"] extends Array<infer R>
			? //@ts-expect-error
				UnionToIntersection<R>[K]
			: S["schema"][K]
		: unknown,
	O extends BetterFetchOption = BetterFetchOption,
>(
	url: U,
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
		O["throw"] extends boolean
			? O["throw"]
			: CreateOptions["throw"] extends true
				? true
				: Err extends false
					? true
					: false
	>
>;
