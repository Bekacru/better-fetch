import { describe, expectTypeOf } from "vitest";
import { FetchSchema, strict } from "../src/typed";
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
	"/user": {
		params: {
			id: z.number(),
		},
	},
	"/user/:id": {},
} satisfies FetchSchema;

describe("typed router", (it) => {
	const $fetch = createFetch({
		baseURL: "https://example.com",
		customFetchImpl: async (url, req) => {
			return new Response();
		},
		routes,
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
		const f = createFetch<{ data: string }, { error: string }>({
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

	it("should strictly allow only specified keys as url", () => {
		const f = createFetch({
			routes: strict(routes),
		});
		expectTypeOf(f).parameter(0).toMatchTypeOf<keyof typeof routes>();
	});

	it("should infer params", () => {
		const f = createFetch({
			routes: strict(routes),
			baseURL: "http://localhost:3000",
		});
		expectTypeOf(f("/user", { params: { id: 1 } })).toMatchTypeOf<
			Promise<BetterFetchResponse<unknown>>
		>();

		expectTypeOf(f("/user/:id", { params: { id: "1" } })).toMatchTypeOf<
			Promise<BetterFetchResponse<unknown>>
		>();
	});
});

describe("react typed router", (it) => {
	const { useFetch, useMutate } = createReactFetch({
		routes,
	});
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
