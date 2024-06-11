import { z, ZodBoolean, ZodNumber, ZodRecord, ZodString } from "zod";

export type DefaultSchema = {
	[key: string]: {
		output?: any;
	};
};

export type ParameterSchema = ZodString | ZodBoolean | ZodNumber;

export type FetchSchema = {
	[key: string]: {
		input?: z.ZodSchema;
		output?: z.ZodSchema;
		query?: z.ZodSchema;
		params?: {
			[key: string]: ParameterSchema;
		};
	};
};

export const strict = <F extends FetchSchema>(schema: F) => {
	return {
		strict: true,
		schema,
	};
};
export type Strict<F extends FetchSchema> = ReturnType<typeof strict<F>>;
