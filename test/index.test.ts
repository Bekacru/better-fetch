import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import betterFetch from "../src";
import { Server } from "bun";

describe("fetch", () => {
	const getURL = (path?: string) =>
		path ? `http://localhost:3000${path}` : "http://localhost:3000";
	let server: Server;
	beforeAll(() => {
		server = Bun.serve({
			port: 3000,
			async fetch(request) {
				const url = new URL(request.url);
				if (url.pathname === "/text" && request.method === "GET") {
					return new Response("OK");
				}
				if (url.pathname === "/json") {
					return new Response(
						JSON.stringify({
							userId: 1,
							id: 1,
							title: "Hello",
							completed: false,
						}),
					);
				}
				if (url.pathname === "/blob" && request.method === "GET") {
					const blob = new Blob(["binary"]);
					return new Response(blob, {
						headers: {
							"Content-Type": "application/octet-stream",
						},
					});
				}
				if (url.pathname === "/error") {
					return new Response("Error Message", {
						status: 400,
					});
				}

				if (url.pathname === "/error-json") {
					return new Response(
						JSON.stringify({
							key: "error",
						}),
						{
							status: 400,
						},
					);
				}

				if (url.pathname === "/echo" && request.method === "POST") {
					const body = await request.text();
					return new Response(body, {
						status: 200,
						headers: request.headers,
					});
				}

				if (url.pathname === "/form" && request.method === "POST") {
					const body = await request.formData();
					return new Response(
						JSON.stringify(Object.fromEntries(body.entries())),
					);
				}

				if (url.pathname === "/url-params" && request.method === "POST") {
					const body = await request.formData();
					return new Response(
						JSON.stringify(Object.fromEntries(body.entries())),
					);
				}

				if (url.pathname === "/403") {
					return new Response("Forbidden", {
						status: 403,
					});
				}

				if (url.pathname === "/query" && request.method === "GET") {
					const query = Object.fromEntries(url.searchParams.entries());
					return new Response(JSON.stringify(query));
				}

				return new Response(null, {
					status: 404,
					statusText: "Not Found",
				});
			},
		});
	});

	afterAll(() => {
		server.stop();
	});

	it("text", async () => {
		const { data } = await betterFetch<string>(getURL("/text"));
		expect(data).toBe("OK");
	});

	it("json", async () => {
		const { data } = await betterFetch<Record<string, any>>(getURL("/json"));
		expect(data).toEqual({
			userId: 1,
			id: 1,
			title: "Hello",
			completed: false,
		});
	});

	it("blob", async () => {
		const { data } = await betterFetch<Blob>(getURL("/blob"));
		expect(data).toBeInstanceOf(Blob);
	});

	it("error", async () => {
		const { error } = await betterFetch(getURL("/error"));
		expect(error).toEqual({
			status: 400,
			statusText: "Bad Request",
			message: "Error Message",
		});
	});

	it("error-json", async () => {
		const { error } = await betterFetch<null, { key: string }>(
			getURL("/error-json"),
		);
		expect(error).toEqual({
			status: 400,
			statusText: "Bad Request",
			key: "error",
		});
	});

	it("does not stringify body when content type != application/json", async () => {
		const message = "Hallo";
		const { data } = await betterFetch(getURL("/echo"), {
			method: "POST",
			body: message,
			headers: { "Content-Type": "text/plain" },
		});
		expect(data).toBe(message);
	});

	it("baseURL", async () => {
		const { data } = await betterFetch("/text", { baseURL: getURL() });
		expect(data).toBe("OK");
	});

	it("stringifies posts body automatically", async () => {
		const { data } = await betterFetch(getURL("/echo"), {
			method: "POST",
			body: {
				test: "test",
				num: 10,
			},
		});
		expect(data).toEqual({ test: "test", num: 10 });
		const { data: data2 } = await betterFetch(getURL("/echo"), {
			method: "POST",
			body: [{ num: 42 }, { test: "test" }],
		});
		expect(data2).toEqual([{ num: 42 }, { test: "test" }]);
	});

	it("does not stringify body when content type != application/json", async () => {
		const message = `{name: "test"}`;
		const { data } = await betterFetch(getURL("/echo"), {
			method: "POST",
			body: message,
			headers: { "Content-Type": "text/plain" },
		});
		expect(data).toBe(message);
	});

	it("Handle Buffer body", async () => {
		const message = "Test Message";
		const { data } = await betterFetch(getURL("/echo"), {
			method: "POST",
			body: Buffer.from(message),
			headers: { "Content-Type": "text/plain" },
		});
		expect(data).toBe(message);
	});

	it("Bypass FormData body", async () => {
		const formData = new FormData();
		formData.append("foo", "bar");
		const { data } = await betterFetch(getURL("/form"), {
			method: "POST",
			body: formData,
		});
		expect(data).toEqual({ foo: "bar" });
	});

	it("Bypass URLSearchParams body", async () => {
		const data = new URLSearchParams({ foo: "bar" });
		const { data: body } = await betterFetch(getURL("/url-params"), {
			method: "POST",
			body: data,
		});
		expect(body).toMatchObject({ foo: "bar" });
	});

	it("404", async () => {
		const { error } = await betterFetch(getURL("/404"));
		expect(error).toEqual({
			status: 404,
			statusText: "Not Found",
		});
	});

	it("403 with ignoreResponseError", async () => {
		const { error } = await betterFetch(getURL("/403"));
		expect(error).toEqual({
			status: 403,
			statusText: "Forbidden",
			message: "Forbidden",
		});
	});

	it("HEAD no content", async () => {
		const { data, error } = await betterFetch(getURL("/text"), {
			method: "HEAD",
		});
		expect(data).toEqual({});
		expect(error).toBeNull();
	});

	it("appends query params", async () => {
		const { data } = await betterFetch(getURL("/query"), {
			query: { test: "test" },
		});
		expect(data).toEqual({ test: "test" });
	});

	it("should retry on error", async () => {
		let count = 0;
		await betterFetch(getURL("/error"), {
			retry: 3,
			onError() {
				count++;
			},
		});
		expect(count).toBe(4);
	});
});
