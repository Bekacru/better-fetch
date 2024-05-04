import { z } from "zod";

export type DefaultSchema = {
	[key: string]: {
		input?: any;
		output?: any;
		query?: any;
	};
};

export type FetchSchema = {
	[key: string]: {
		input?: z.ZodSchema;
		output?: z.ZodSchema;
		query?: z.ZodSchema;
	};
};

// const LoginSchema = v.object({
// 	email: v.string(),
// 	password: v.string(),
// });
