import { IsEmptyObject } from "type-fest";
import type { ZodObject, ZodSchema, z } from "zod";
import { BetterFetchPlugin } from "../plugins";
import type { Prettify, StringLiteralUnion } from "../type-utils";
import type { BetterFetchOption, BetterFetchResponse } from "../types";
import type { FetchSchema, Schema } from "./schema";
export type CreateFetchOption = BetterFetchOption & {
	schema?: Schema;
	/**
	 * Catch all error including non api errors. Like schema validation, etc.
	 * @default false
	 */
	catchAllError?: boolean;
	defaultOutput?: ZodSchema;
	defaultError?: ZodSchema;
};

type WithRequired<T, K extends keyof T | never> = T & { [P in K]-?: T[P] };
type InferBody<T> = T extends ZodSchema ? z.infer<T> : any;

type InferParamPath<Path> =
	Path extends `${infer _Start}:${infer Param}/${infer Rest}`
		? { [K in Param | keyof InferParamPath<Rest>]: string }
		: Path extends `${infer _Start}:${infer Param}`
			? { [K in Param]: string }
			: Path extends `${infer _Start}/${infer Rest}`
				? InferParamPath<Rest>
				: {};

export type InferParam<Path, Param> = Param extends ZodSchema
	? z.infer<Param>
	: InferParamPath<Path>;

export type InferOptions<T extends FetchSchema, Key> = WithRequired<
	BetterFetchOption<
		InferBody<T["input"]>,
		InferQuery<T["query"]>,
		InferParam<Key, T["params"]>
	>,
	RequiredOptionKeys<T, Key> extends keyof BetterFetchOption
		? RequiredOptionKeys<T, Key>
		: never
>;

export type InferQuery<Q> = Q extends z.ZodSchema ? z.infer<Q> : any;

export type IsFieldOptional<T> = T extends z.ZodSchema
	? T extends z.ZodOptional<any>
		? true
		: false
	: true;

type IsParamOptional<T, K> = IsFieldOptional<T> extends false
	? false
	: IsEmptyObject<InferParamPath<K>> extends false
		? false
		: true;

export type IsOptionRequired<T extends FetchSchema, Key> = IsFieldOptional<
	T["input"]
> extends false
	? true
	: IsFieldOptional<T["query"]> extends false
		? true
		: IsParamOptional<T["params"], Key> extends false
			? true
			: false;

export type RequiredOptionKeys<T extends FetchSchema, Key> =
	| (IsFieldOptional<T["input"]> extends false ? "body" : never)
	| (IsFieldOptional<T["query"]> extends false ? "query" : never)
	| (IsParamOptional<T["params"], Key> extends false ? "params" : never);

export type InferKey<S> = S extends Schema
	? S["config"]["strict"] extends true
		? S["config"]["prefix"] extends string
			? `${S["config"]["prefix"]}${keyof S["schema"] extends string
					? keyof S["schema"]
					: never}`
			: S["config"]["baseURL"] extends string
				? `${S["config"]["baseURL"]}${keyof S["schema"] extends string
						? keyof S["schema"]
						: never}`
				: keyof S["schema"] extends string
					? keyof S["schema"]
					: never
		: S["config"]["prefix"] extends string
			? StringLiteralUnion<`${S["config"]["prefix"]}${keyof S["schema"] extends string
					? keyof S["schema"]
					: never}`>
			: S["config"]["baseURL"] extends string
				? StringLiteralUnion<`${S["config"]["baseURL"]}${keyof S["schema"] extends string
						? keyof S["schema"]
						: never}`>
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
		: undefined
	: undefined;

export type MergeSchema<Options extends CreateFetchOption> =
	Options["plugins"] extends Array<infer P>
		? PluginSchema<P> & Options["schema"]
		: Options["schema"];

export type InferPluginOptions<Options extends CreateFetchOption> =
	Options["plugins"] extends Array<infer P>
		? P extends BetterFetchPlugin
			? P["getOptions"] extends () => infer O
				? O extends ZodSchema
					? UnionToIntersection<z.infer<O>>
					: {}
				: {}
			: {}
		: {};

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
	F extends S extends Schema ? S["schema"][K] : unknown = S extends Schema
		? S["schema"][K]
		: unknown,
	O extends Omit<BetterFetchOption, "params"> = Omit<
		BetterFetchOption,
		"params"
	>,
	PluginOptions extends Partial<InferPluginOptions<CreateOptions>> = Partial<
		InferPluginOptions<CreateOptions>
	>,
>(
	url: U,
	...options: F extends FetchSchema
		? IsOptionRequired<F, K> extends true
			? [Prettify<InferOptions<F, K> & PluginOptions>]
			: [Prettify<InferOptions<F, K> & PluginOptions>?]
		: [
				Prettify<
					PluginOptions &
						O & {
							params?: InferParamPath<K>;
						}
				>?,
			]
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
