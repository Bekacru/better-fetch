import { TObject, Type } from "@sinclair/typebox";

export const T = Type;

export * from "@sinclair/typebox";

export type DefaultSchema = {
	[key: string]: any;
};

export type FetchSchema = Record<
	string,
	{
		input?: TObject;
		output?: TObject;
	}
>;
