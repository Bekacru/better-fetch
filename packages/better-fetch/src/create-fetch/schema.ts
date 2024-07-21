import type { ZodSchema, z } from "zod";
import type { StringLiteralUnion } from "../type-utils";

export type ParameterSchema = z.ZodString | z.ZodNumber;
export type FetchSchema = {
	input?: ZodSchema;
	output?: ZodSchema;
	query?: ZodSchema;
	params?: z.ZodObject<{
		[key: string]: ParameterSchema;
	}>;
	method?: Methods;
};

export type Methods = "get" | "post" | "put" | "patch" | "delete";

export const methods = ["get", "post", "put", "patch", "delete"];

type RouteKey = StringLiteralUnion<`@${Methods}/`>;

export type FetchSchemaRoutes = {
	[key in RouteKey]?: FetchSchema;
};

export const createSchema = <
	F extends FetchSchemaRoutes,
	S extends {
		strict?: boolean;
	},
>(
	schema: F,
	config?: S,
) => {
	return {
		schema,
		config: config as S,
	};
};

export type Schema = {
	schema: FetchSchemaRoutes;
	config: {
		strict: boolean;
		/**
		 * The base url of the schema. By default it's the baseURL of the fetch instance.
		 */
		baseURL?: "" | (string & Record<never, never>);
		prefix?: "" | (string & Record<never, never>);
	};
};

export type InferQuery<Q> = Q extends z.ZodSchema ? z.infer<Q> : any;

export type IsFieldOptional<T> = T extends z.ZodSchema
	? T extends z.ZodOptional<any>
		? true
		: false
	: true;

export type IsOptionRequired<T extends FetchSchema> = IsFieldOptional<
	T["input"]
> extends false
	? true
	: IsFieldOptional<T["query"]> extends false
		? true
		: IsFieldOptional<T["params"]> extends false
			? true
			: false;

export type RequiredOptionKeys<T extends FetchSchema> =
	| (IsFieldOptional<T["input"]> extends false ? "body" : never)
	| (IsFieldOptional<T["query"]> extends false ? "query" : never)
	| (IsFieldOptional<T["params"]> extends false ? "params" : never);
