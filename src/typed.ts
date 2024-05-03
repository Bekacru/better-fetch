import { TNever, TObject, Type } from "@sinclair/typebox";

export const T = Type;

export * from "@sinclair/typebox";

export type DefaultSchema = {
	[key: string]: {
		input?: TNever;
		output?: TNever;
		query?: TNever;
	};
};

export type FetchSchema = Record<
	string,
	{
		input?: TObject | TNever;
		output?: TObject | TNever;
		query?: TObject | TNever;
	}
>;
