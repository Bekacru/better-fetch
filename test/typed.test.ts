import { describe, expectTypeOf } from "vitest";
import { DefaultSchema, FetchSchema, T } from "../src/typed";
import { BetterFetchResponse, createFetch } from "../src";
import { createReactFetch } from "../src/react";

const routes = {
	"/": {
		output: T.Object({
			message: T.String(),
		}),
	},
	"/signin": {
		input: T.Object({
			username: T.String(),
			password: T.String(),
		}),
		output: T.Object({
			token: T.String(),
		}),
	},
	"/signup": {
		input: T.Object({
			username: T.String(),
			password: T.String(),
			optional: T.Optional(T.String()),
		}),
		output: T.Object({
			message: T.String(),
		}),
	},
	"/query": {
		query: T.Object({
			term: T.String(),
		}),
	},
} satisfies FetchSchema;

describe("typed router", (it) => {
	const $fetch = createFetch<typeof routes>({
		baseURL: "https://example.com",
		customFetchImpl: async (url, req) => {
			return new Response();
		},
	});
	it("should not required body and return message", () => {
		expectTypeOf($fetch("/")).toMatchTypeOf<
			Promise<BetterFetchResponse<{ message: string }>>
		>();
	});
	it("should required body and return token", () => {
		//TODO: Check if we can fix excessively deep type error
		expectTypeOf(
			$fetch("/signin", {
				//@ts-ignore
				body: { username: "", password: "" },
			}),
		).toMatchTypeOf<Promise<BetterFetchResponse<{ token: string }>>>();
	});

	it("should required body but should not required optional and return message", () => {
		expectTypeOf(
			$fetch("/signup", {
				body: {
					username: "",
					password: "",
				},
			}),
		).toMatchTypeOf<Promise<BetterFetchResponse<{ message: string }>>>();
	});

	it("should require query param", () => {
		expectTypeOf($fetch("/query", { query: { term: "" } })).toMatchTypeOf<
			Promise<BetterFetchResponse<unknown>>
		>();
	});

	it("should infer default response and error types", () => {
		const f = createFetch<DefaultSchema, { data: string }, { error: string }>();
		expectTypeOf(f("/")).toMatchTypeOf<
			Promise<
				BetterFetchResponse<
					{
						data: string;
					},
					{
						error: string;
					}
				>
			>
		>();
	});
});

describe("react typed router", (it) => {
	const { useFetch, useMutate } = createReactFetch<typeof routes>();
	it("use fetch", () => {
		function _() {
			expectTypeOf(useFetch("/").data).toMatchTypeOf<{
				message: string;
			} | null>();
			return null;
		}
	});

	it("use mutate", () => {
		function _() {
			expectTypeOf(
				useMutate("/signin").mutate({ username: "", password: "" }),
			).toMatchTypeOf<Promise<BetterFetchResponse<{ token: string }>>>();
		}
	});

	it("use mutate with optional property", () => {
		function _() {
			expectTypeOf(
				useMutate("/signup").mutate({ username: "", password: "" }),
			).toMatchTypeOf<Promise<BetterFetchResponse<{ message: string }>>>();
		}
	});
});
