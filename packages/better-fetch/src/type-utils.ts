export type StringLiteralUnion<T extends string> = T | (string & {});

export type Prettify<T> = {
	[key in keyof T]: T[key];
} & {};
