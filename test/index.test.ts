import { describe, it, expect, beforeAll, afterAll } from "vitest";
import betterFetch, { createFetch } from "../src";
import {
	createApp,
	createError,
	eventHandler,
	readBody,
	readRawBody,
	toNodeListener,
} from "h3";
import { listen } from "listhen";
import { IncomingHttpHeaders } from "http";

describe("fetch", () => {
	const getURL = (path?: string) =>
		path ? `http://localhost:4000/${path}` : "http://localhost:4000";
	let listener;
	beforeAll(async () => {
		// const app = Bun.serve({
		// 	port: 4000,
		// 	async fetch(request) {
		// 		const url = new URL(request.url);
		// 		if (url.pathname === "/text" && request.method === "GET") {
		// 			return new Response("OK");
		// 		}
		// 		if (url.pathname === "/json") {
		// 			return new Response(
		// 				JSON.stringify({
		// 					userId: 1,
		// 					id: 1,
		// 					title: "Hello",
		// 					completed: false,
		// 				}),
		// 			);
		// 		}
		// 		if (url.pathname === "/blob" && request.method === "GET") {
		// 			const blob = new Blob(["binary"]);
		// 			return new Response(blob, {
		// 				headers: {
		// 					"Content-Type": "application/octet-stream",
		// 				},
		// 			});
		// 		}
		// 		if (url.pathname === "/error") {
		// 			return new Response("Error Message", {
		// 				status: 400,
		// 			});
		// 		}

		// 		if (url.pathname === "/error-json") {
		// 			return new Response(
		// 				JSON.stringify({
		// 					key: "error",
		// 				}),
		// 				{
		// 					status: 400,
		// 				},
		// 			);
		// 		}

		// 		if (url.pathname === "/echo" && request.method === "POST") {
		// 			const body = await request.text();
		// 			return new Response(body, {
		// 				status: 200,
		// 				headers: request.headers,
		// 			});
		// 		}

		// 		if (url.pathname === "/form" && request.method === "POST") {
		// 			const body = await request.formData();
		// 			return new Response(
		// 				JSON.stringify(Object.fromEntries(body.entries())),
		// 			);
		// 		}

		// 		if (url.pathname === "/url-params" && request.method === "POST") {
		// 			const body = await request.formData();
		// 			return new Response(
		// 				JSON.stringify(Object.fromEntries(body.entries())),
		// 			);
		// 		}

		// 		if (url.pathname === "/403") {
		// 			return new Response("Forbidden", {
		// 				status: 403,
		// 			});
		// 		}

		// 		if (url.pathname === "/query" && request.method === "GET") {
		// 			const query = Object.fromEntries(url.searchParams.entries());
		// 			return new Response(JSON.stringify(query));
		// 		}

		// 		return new Response(null, {
		// 			status: 404,
		// 			statusText: "Not Found",
		// 		});
		// 	},
		// });
		const app = createApp()
			.use(
				"/ok",
				eventHandler(() => "ok"),
			)
			.use(
				"/params",
				eventHandler((event) =>
					new URLSearchParams(event.node.req.url).toString(),
				),
			)
			.use(
				"/url",
				eventHandler((event) => event.node.req.url),
			)
			.use(
				"/echo",
				eventHandler(async (event) => ({
					path: event.path,
					body:
						event.node.req.method === "POST"
							? await readRawBody(event)
							: undefined,
					headers: event.node.req.headers,
				})),
			)
			.use(
				"/post",
				eventHandler(async (event) => {
					return {
						body: await readBody(event),
						headers: event.node.req.headers,
					};
				}),
			)
			.use(
				"/binary",
				eventHandler((event) => {
					event.node.res.setHeader("Content-Type", "application/octet-stream");
					return new Blob(["binary"]);
				}),
			);
		listener = await listen(toNodeListener(app), {
			port: 4000,
		});
	});

	const $echo = createFetch<{
		body: any;
		path: string;
		headers: IncomingHttpHeaders;
	}>({
		baseURL: getURL(),
	});

	// afterAll(() => {
	// 	server.stop();
	// });

	it("ok", async () => {
		expect((await betterFetch(getURL("ok"))).data).to.equal("ok");
	});

	it("returns a blob for binary content-type", async () => {
		const { data } = await betterFetch<Blob>(getURL("binary"));
		expect(data).to.has.property("size");
	});

	it("baseURL", async () => {
		const { data } = await betterFetch("/x?foo=123", {
			baseURL: getURL("url"),
		});
		expect(data).to.equal("/x?foo=123");
	});

	it("stringifies posts body automatically", async () => {
		const res = await betterFetch<{ body: { num: number } }>(getURL("post"), {
			method: "POST",
			body: { num: 42 },
		});
		expect(res.data?.body).toEqual({ num: 42 });

		const res2 = await betterFetch(getURL("post"), {
			method: "POST",
			body: [{ num: 42 }, { num: 43 }],
		});
		expect(res2.data?.body).toEqual([{ num: 42 }, { num: 43 }]);

		const headerFetches = [
			[["X-header", "1"]],
			{ "x-header": "1" },
			new Headers({ "x-header": "1" }),
		];

		for (const sentHeaders of headerFetches) {
			const res2 = await betterFetch(getURL("post"), {
				method: "POST",
				body: { num: 42 },
				headers: sentHeaders as HeadersInit,
			});
			expect(res2.data.headers).to.include({ "x-header": "1" });
			expect(res2.data.headers).to.include({ accept: "application/json" });
		}
	});

	it("does not stringify body when content type != application/json", async () => {
		const message = '"Hallo von Pascal"';
		const { data } = await $echo("/echo", {
			method: "POST",
			body: message,
			headers: { "Content-Type": "text/plain" },
		});
		expect(data?.body).toEqual(message);
	});

	it("Handle Buffer body", async () => {
		const message = "Hallo von Pascal";
		const { data } = await $echo("/echo", {
			method: "POST",
			body: Buffer.from("Hallo von Pascal"),
			headers: { "Content-Type": "text/plain" },
		});
		expect(data?.body).to.deep.eq(message);
	});

	it("Bypass FormData body", async () => {
		const data = new FormData();
		data.append("foo", "bar");
		const { data: data2 } = await $echo("/post", {
			method: "POST",
			body: data,
		});
		console.log({ data2: data2?.body });
	});

	// it("json", async () => {
	// 	const { data } = await betterFetch<Record<string, any>>(getURL("/json"));
	// 	expect(data).toEqual({
	// 		userId: 1,
	// 		id: 1,
	// 		title: "Hello",
	// 		completed: false,
	// 	});
	// });

	// it("blob", async () => {
	// 	const { data } = await betterFetch<Blob>(getURL("/blob"));
	// 	expect(data).toBeInstanceOf(Blob);
	// });

	// it("error", async () => {
	// 	const { error } = await betterFetch(getURL("/error"));
	// 	expect(error).toEqual({
	// 		status: 400,
	// 		statusText: "Bad Request",
	// 		message: "Error Message",
	// 	});
	// });

	// it("error-json", async () => {
	// 	const { error } = await betterFetch<null, { key: string }>(
	// 		getURL("/error-json"),
	// 	);
	// 	expect(error).toEqual({
	// 		status: 400,
	// 		statusText: "Bad Request",
	// 		key: "error",
	// 	});
	// });

	// it("does not stringify body when content type != application/json", async () => {
	// 	const message = "Hallo";
	// 	const { data } = await betterFetch(getURL("/echo"), {
	// 		method: "POST",
	// 		body: message,
	// 		headers: { "Content-Type": "text/plain" },
	// 	});
	// 	expect(data).toBe(message);
	// });

	// it("baseURL", async () => {
	// 	const { data } = await betterFetch("/text", { baseURL: getURL() });
	// 	expect(data).toBe("OK");
	// });

	// it("stringifies posts body automatically", async () => {
	// 	const { data } = await betterFetch(getURL("/echo"), {
	// 		method: "POST",
	// 		body: {
	// 			test: "test",
	// 			num: 10,
	// 		},
	// 	});
	// 	expect(data).toEqual({ test: "test", num: 10 });
	// 	const { data: data2 } = await betterFetch(getURL("/echo"), {
	// 		method: "POST",
	// 		body: [{ num: 42 }, { test: "test" }],
	// 	});
	// 	expect(data2).toEqual([{ num: 42 }, { test: "test" }]);
	// });

	// it("does not stringify body when content type != application/json", async () => {
	// 	const message = `{name: "test"}`;
	// 	const { data } = await betterFetch(getURL("/echo"), {
	// 		method: "POST",
	// 		body: message,
	// 		headers: { "Content-Type": "text/plain" },
	// 	});
	// 	expect(data).toBe(message);
	// });

	// it("Handle Buffer body", async () => {
	// 	const message = "Test Message";
	// 	const { data } = await betterFetch(getURL("/echo"), {
	// 		method: "POST",
	// 		body: Buffer.from(message),
	// 		headers: { "Content-Type": "text/plain" },
	// 	});
	// 	expect(data).toBe(message);
	// });

	// it("Bypass FormData body", async () => {
	// 	const formData = new FormData();
	// 	formData.append("foo", "bar");
	// 	const { data } = await betterFetch(getURL("/form"), {
	// 		method: "POST",
	// 		body: formData,
	// 	});
	// 	expect(data).toEqual({ foo: "bar" });
	// });

	// it("Bypass URLSearchParams body", async () => {
	// 	const data = new URLSearchParams({ foo: "bar" });
	// 	const { data: body } = await betterFetch(getURL("/url-params"), {
	// 		method: "POST",
	// 		body: data,
	// 	});
	// 	expect(body).toMatchObject({ foo: "bar" });
	// });

	// it("404", async () => {
	// 	const { error } = await betterFetch(getURL("/404"));
	// 	expect(error).toEqual({
	// 		status: 404,
	// 		statusText: "Not Found",
	// 	});
	// });

	// it("403 with ignoreResponseError", async () => {
	// 	const { error } = await betterFetch(getURL("/403"));
	// 	expect(error).toEqual({
	// 		status: 403,
	// 		statusText: "Forbidden",
	// 		message: "Forbidden",
	// 	});
	// });

	// it("HEAD no content", async () => {
	// 	const { data, error } = await betterFetch(getURL("/text"), {
	// 		method: "HEAD",
	// 	});
	// 	expect(data).toEqual({});
	// 	expect(error).toBeNull();
	// });

	// it("appends query params", async () => {
	// 	const { data } = await betterFetch(getURL("/query"), {
	// 		query: { test: "test" },
	// 	});
	// 	expect(data).toEqual({ test: "test" });
	// });

	// it("should retry on error", async () => {
	// 	let count = 0;
	// 	await betterFetch(getURL("/error"), {
	// 		retry: 3,
	// 		onError() {
	// 			count++;
	// 		},
	// 	});
	// 	expect(count).toBe(4);
	// });

	// it("should use custom fetch implementation", async () => {
	// 	const { data } = await betterFetch(getURL("/text"), {
	// 		customFetchImpl: async () => {
	// 			return new Response("Custom Fetch", {
	// 				status: 200,
	// 			});
	// 		},
	// 	});
	// 	expect(data).toBe("Custom Fetch");
	// });
});
