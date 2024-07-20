import { createApp, toNodeListener } from "h3";
import { type Listener, listen } from "listhen";
import {
	afterAll,
	beforeAll,
	describe,
	expect,
	expectTypeOf,
	it,
} from "vitest";
import { ZodError, z } from "zod";
import {
	type FetchSchemaRoutes,
	createFetch,
	createSchema,
	methods,
} from "../create-fetch";
import type { BetterFetchResponse } from "../types";

import { router } from "./test-router";

const schema = {
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
		params: z.object({
			id: z.number(),
		}),
	},
	"/user/:id": {},
	"@post/method": {},
	"@get/method": {},
	"@delete/method": {},
	"@put/method": {},
	"@patch/method": {},
} satisfies FetchSchemaRoutes;

describe("create-fetch-runtime-test", () => {
	const $fetch = createFetch({
		baseURL: "http://localhost:4001",
		schema: createSchema(schema),
	});

	let listener: Listener;
	beforeAll(async () => {
		const app = createApp().use(router);
		listener = await listen(toNodeListener(app), {
			port: 4001,
		});
	});
	afterAll(() => {
		listener.close().catch(console.error);
	});

	it("should validate response and throw if validation fails", async () => {
		expect(
			$fetch("/post", {
				output: z.object({
					id: z.number(),
				}),
				method: "POST",
			}),
		).rejects.toThrowError(ZodError);
	});

	it("should validate response and return data if validation passes", async () => {
		const res = await $fetch("/echo", {
			output: z.object({
				path: z.any(),
				body: z.object({ id: z.number().transform((v) => v + 1) }),
				headers: z.any(),
			}),
			body: { id: 1 },
		});

		expect(res.data).toEqual({
			path: "/echo",
			body: { id: 2 },
			headers: expect.any(Object),
		});
	});

	it("should work with method modifiers", async () => {
		const $f = createFetch({
			baseURL: "http://localhost:4001",
			schema: createSchema({
				[`@put/method`]: {},
				[`@post/method`]: {},
				[`@delete/method`]: {},
				[`@get/method`]: {},
				[`@patch/method`]: {},
			}),
			customFetchImpl: async (req, init) => {
				return new Response(JSON.stringify({ method: init?.method }));
			},
		});
		for (const method of methods.slice(0, 4)) {
			const res = await $f(`@${method}/method`);
			expect(res.data).toEqual({ method: method.toUpperCase() });
		}
	});

	it("should apply method", async () => {
		const $f = createFetch({
			baseURL: "http://localhost:4001",
			schema: createSchema({
				"/": {
					method: "put",
					input: z.object({
						userId: z.string(),
						id: z.number(),
						title: z.string(),
						completed: z.boolean(),
					}),
				},
			}),
			customFetchImpl: async (req, init) => {
				return new Response(
					JSON.stringify({
						method: init?.method,
					}),
				);
			},
		});
		const res = await $f("/", {
			body: {
				userId: "1",
				id: 1,
				title: "title",
				completed: true,
			},
		});
		expect(res.data).toMatchObject({
			method: "PUT",
		});
	});
});

describe("create-fetch-type-test", () => {
	const $fetch = createFetch({
		baseURL: "http://localhost:4001",
		customFetchImpl: async (req, init) => {
			return new Response();
		},
		schema: createSchema(schema),
		catchAllError: true,
	});
	it("should return unknown if no output is defined", () => {
		const res = $fetch("/");
		expectTypeOf(res).toMatchTypeOf<Promise<BetterFetchResponse<unknown>>>();
	});

	it("should not require option/body and return message", () => {
		expectTypeOf($fetch("/")).toMatchTypeOf<
			Promise<BetterFetchResponse<{ message: string }>>
		>();
	});

	it("if output is defined it should be used", () => {
		const res = $fetch("/", {
			output: z.object({
				somethingElse: z.string(),
			}),
		});
		expectTypeOf(res).toMatchTypeOf<
			Promise<
				BetterFetchResponse<{
					somethingElse: string;
				}>
			>
		>();
		expectTypeOf(res).not.toMatchTypeOf<
			Promise<
				BetterFetchResponse<{
					message: string;
				}>
			>
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

	it("should not require optional fields and return message", () => {
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

	it("should strictly allow only specified keys as url", () => {
		const f = createFetch({
			schema: createSchema(schema, {
				strict: true,
			}),
		});
		type SchemaKey = keyof typeof schema;
		type FunctionKeys = typeof f extends (url: infer U) => any ? U : never;
		expectTypeOf<FunctionKeys>().toEqualTypeOf<SchemaKey>();
		expectTypeOf<FunctionKeys>().not.toEqualTypeOf<string>();
	});

	it("should infer params", () => {
		const f = createFetch({
			schema: createSchema(schema),
			baseURL: "http://localhost:4001",
			customFetchImpl: async (url, req) => {
				return new Response();
			},
		});

		expectTypeOf(
			f("/user", {
				params: { id: 1 },
			}),
		).toMatchTypeOf<Promise<BetterFetchResponse<unknown>>>();

		expectTypeOf(
			f("/user/:id", {
				params: {
					id: "1",
				},
			}),
		).toMatchTypeOf<Promise<BetterFetchResponse<unknown>>>();
	});

	it("should infer default response and error types", () => {
		const $fetch = createFetch({
			baseURL: "http://localhost:4001",
			defaultOutput: z.object({
				data: z.string(),
			}),
			defaultError: z.object({
				error: z.string(),
			}),
			customFetchImpl: async (url, req) => {
				return new Response();
			},
		});

		expectTypeOf($fetch("/")).toMatchTypeOf<
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
