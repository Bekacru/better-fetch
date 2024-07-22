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
import { BetterFetchPlugin } from "../plugins";

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
			baseURL: "http://localhost:4001",
			customFetchImpl: async (url, req) => {
				return new Response();
			},
		});
		f("/");
		//@ts-expect-error
		f("/not-allowed");
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

	it("should require params", async () => {
		const $fetch = createFetch({
			schema: createSchema(schema),
			customFetchImpl: async (url, req) => {
				return new Response();
			},
			baseURL: "http://localhost:4001",
		});
		//@ts-expect-error
		const f = $fetch("/user/:id", {});
	});
});

describe("plugin", () => {
	const plugin = {
		id: "test",
		name: "Test",
		schema: createSchema(
			{
				"/path": {
					output: z.object({
						message: z.string(),
					}),
					input: z.object({
						param: z.string(),
					}),
				},
				"/path/:param": {
					output: z.object({
						message: z.string(),
					}),
				},
			},
			{
				baseURL: "http://localhost:4001",
				prefix: "prefix",
				strict: true,
			},
		),
	} satisfies BetterFetchPlugin;
	const plugin2 = {
		id: "test",
		name: "Test",
		schema: createSchema(
			{
				"/path": {
					output: z.object({
						message: z.string(),
					}),
				},
			},
			{
				baseURL: "http://localhost:4001",
				strict: true,
			},
		),
	} satisfies BetterFetchPlugin;

	const plugin3 = {
		id: "test",
		name: "Test",
	};

	it("should infer prefix", async () => {
		const $fetch = createFetch({
			plugins: [plugin],
		});
		expectTypeOf($fetch)
			.parameter(0)
			.toMatchTypeOf<"prefix/path" | "prefix/path/:param">();
	});

	it("should infer baseURL", async () => {
		const $fetch = createFetch({
			plugins: [plugin2],
		});
		expectTypeOf($fetch)
			.parameter(0)
			.toMatchTypeOf<"http://localhost:4001/path">();
	});

	it("should infer input and output", async () => {
		const $fetch = createFetch({
			plugins: [plugin],
			customFetchImpl: async (url, req) => {
				return new Response();
			},
		});
		//@ts-expect-error
		const f = $fetch("prefix/path");
		expectTypeOf(f).toMatchTypeOf<
			Promise<
				BetterFetchResponse<{
					message: string;
				}>
			>
		>();
	});

	it("should replace baseURL", async () => {
		const $fetch = createFetch({
			plugins: [plugin],
			customFetchImpl: async (url, req) => {
				return new Response();
			},
		});
		await $fetch("prefix/path", {
			body: {
				param: "1",
			},
			onResponse(context) {
				expect(context.request.url.toString()).toBe(
					"http://localhost:4001/path",
				);
			},
		});
		await $fetch("prefix/path/:param", {
			params: {
				param: "1",
			},
			onResponse(context) {
				expect(context.request.url.toString()).toBe(
					"http://localhost:4001/path/1",
				);
			},
		});
	});

	it("should not break if plugin is not define schema", async () => {
		const $fetch = createFetch({
			plugins: [plugin3],
			customFetchImpl: async (url, req) => {
				return new Response();
			},
		});
		await $fetch("prefix/path", {
			body: {
				param: "1",
			},
			onResponse(context) {
				expect(context.request.url.toString()).toBe(
					"http://localhost:4001/path",
				);
			},
		});
	});
});
