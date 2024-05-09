import { z } from "zod";

export type DefaultSchema = {
	[key: string]: {
		output?: any;
	};
};

export type FetchSchema = {
	[key: string]: {
		input?: z.ZodSchema;
		output?: z.ZodSchema;
		query?: z.ZodSchema;
	};
};

export type Strict<T extends FetchSchema> = {
	schema: T;
};
