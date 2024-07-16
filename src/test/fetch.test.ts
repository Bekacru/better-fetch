import { createApp, toNodeListener } from "h3";
import { type Listener, listen } from "listhen";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { betterFetch, createFetch } from "..";
import { router } from "./test-router";

describe("fetch", () => {
	const getURL = (path?: string) =>
		path ? `http://localhost:4001/${path}` : "http://localhost:4001";
	let listener: Listener;
	beforeAll(async () => {
		const app = createApp().use(router);
		listener = await listen(toNodeListener(app), {
			port: 4001,
		});
	});

	const $echo = createFetch({
		baseURL: getURL(),
	});

	afterAll(() => {
		listener.close().catch(console.error);
	});

	it("ok", async () => {
		expect((await betterFetch(getURL("ok"))).data).to.equal("ok");
	});

	it("returns a blob for binary content-type", async () => {
		const { data } = await betterFetch<Blob>(getURL("binary"));
		expect(data).to.has.property("size");
	});

	it("baseURL", async () => {
		const { data } = await betterFetch("/ok", {
			baseURL: getURL(),
		});
		expect(data).to.equal("ok");
	});

	it("stringifies posts body automatically", async () => {
		const res = await betterFetch<{ body: { num: number } }>(getURL("post"), {
			method: "POST",
			body: { num: 42 },
		});
		expect(res.data?.body).toEqual({ num: 42 });
		const res2 = await betterFetch<any>(getURL("post"), {
			method: "POST",
			body: [{ num: 42 }, { num: 43 }],
		});
		expect(res2.data?.body).toEqual([{ num: 42 }, { num: 43 }]);
	});

	it("should work with headers", async () => {
		const headerFetches = [
			[["X-header", "1"]],
			{ "x-header": "1" },
			new Headers({ "x-header": "1" }),
		];

		for (const sentHeaders of headerFetches) {
			const res2 = await betterFetch<any>(getURL("post"), {
				method: "POST",
				body: { num: 42 },
				headers: sentHeaders as HeadersInit,
			});

			expect(res2.data.headers).to.include({ "x-header": "1" });
			expect(res2.data.headers).to.include({
				"content-type": "application/json",
			});
		}
	});

	it("does not stringify body when content type != application/json", async () => {
		const message = '"Hallo von Pascal"';
		const { data } = await $echo<any>("/echo", {
			method: "POST",
			body: message,
			headers: { "Content-Type": "text/plain" },
		});
		expect(data?.body).toEqual(message);
	});

	it("Handle Buffer body", async () => {
		const message = "Hallo von Pascal";
		const { data } = await $echo<any>("/echo", {
			method: "POST",
			body: Buffer.from("Hallo von Pascal"),
			headers: { "Content-Type": "text/plain" },
		});
		expect(data?.body).to.deep.eq(message);
	});

	it("Bypass URLSearchParams body", async () => {
		const data = new URLSearchParams({ foo: "bar" });
		const { data: res } = await betterFetch<any>(getURL("post"), {
			method: "POST",
			body: data,
		});
		expect(res.body).toMatchObject({ foo: "bar" });
	});

	it("404", async () => {
		const { error, data } = await betterFetch<
			{
				test: string;
			},
			{
				statusCode: number;
				stack: [];
				statusMessage: string;
			}
		>(getURL("404"));

		expect(error).to.deep.eq({
			statusCode: 404,
			statusMessage: "Cannot find any path matching /404.",
			stack: [],
			status: 404,
			statusText: "Cannot find any path matching /404.",
		});
		expect(data).toBe(null);
	});

	it("204 no content", async () => {
		const { data } = await betterFetch(getURL("204"));

		expect(data).toEqual("");
	});

	it("HEAD no content", async () => {
		const { data } = await betterFetch(getURL("ok"), {
			method: "HEAD",
		});
		expect(data).toEqual("");
	});

	it("should retry on error", async () => {
		let count = 0;
		await betterFetch(getURL("error"), {
			retry: {
				count: 3,
				interval: 0,
			},
			onError() {
				count++;
			},
		});
		expect(count).toBe(4);
	});

	it("abort with retry", () => {
		const controller = new AbortController();
		async function abortHandle() {
			controller.abort();
			const response = await betterFetch("", {
				baseURL: getURL("ok"),
				retry: {
					count: 3,
				},
				signal: controller.signal,
			});
		}
		expect(abortHandle()).rejects.toThrow(/aborted/);
	});

	it("should work with params", async () => {
		const response = await betterFetch(getURL("param/:id"), {
			params: ["2"],
		});
		expect(response.data).toBe("/param/2");
	});

	it("should work with params", async () => {
		const response = await betterFetch(getURL("param/:id"), {
			params: ["2"],
		});
		expect(response.data).toBe("/param/2");
	});

	// it("should work with method modifier string", async () => {
	// 	const url = getURL();
	// 	const response = await betterFetch("@post/method", {
	// 		baseURL: url,
	// 	});
	// 	expect(response.data).toBe("POST");
	// 	const response2 = await betterFetch("@get/method", {
	// 		baseURL: url,
	// 	});
	// 	expect(response2.data).toBe("GET");
	// });

	it("should set auth headers", async () => {
		const url = getURL("post");
		const res = await betterFetch<any>(url, {
			auth: {
				type: "Bearer",
				token: "test",
			},
			method: "POST",
		});

		expect(res.data.headers).to.include({
			authorization: "Bearer test",
		});
	});
});
