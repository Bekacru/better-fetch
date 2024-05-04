import { z } from "zod";

export type DefaultSchema = {
	[key: string]: {
		input?: z.ZodAny;
		output?: z.ZodAny;
		query?: z.ZodAny;
	};
};

export type FetchSchema = {
	[key: string]: {
		input?: z.ZodSchema;
		output?: z.ZodSchema;
		query?: z.ZodSchema;
	};
};
