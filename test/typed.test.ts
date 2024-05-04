import { describe, expectTypeOf } from "vitest";
import { DefaultSchema, FetchSchema } from "../src/typed";
import { BetterFetchResponse, createFetch } from "../src";
import { createReactFetch } from "../src/react";
import { z } from "zod";

const routes = {
	"/": {
		output: z.object({
			message: z.string(),
		}),
	},
	"/signin": {
		input: z.object({
			username: z.string(),
			password: z.string(),
		}),
		output: z.object({
			token: z.string(),
		}),
	},
	"/signup": {
		input: z.object({
			username: z.string(),
			password: z.string(),
			optional: z.optional(z.string()),
		}),
		output: z.object({
			message: z.string(),
		}),
	},
	"/query": {
		query: z.object({
			term: z.string(),
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
		expectTypeOf(
			$fetch("/signin", {
				body: {
					username: "",
					password: "",
				},
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
		const f = createFetch<DefaultSchema, { data: string }, { error: string }>({
			baseURL: "http://localhost:3000",
			customFetchImpl: async (url, req) => {
				return new Response();
			},
		});
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
