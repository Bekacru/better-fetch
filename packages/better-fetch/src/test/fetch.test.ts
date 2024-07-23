import { createApp, toNodeListener } from "h3";
import { type Listener, listen } from "listhen";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { BetterFetchError, betterFetch, createFetch } from "..";
import { router } from "./test-router";

describe("fetch", () => {
	const getURL = (path?: string) =>
		path ? `http://localhost:4000/${path}` : "http://localhost:4000";

	let listener: Listener;

	beforeAll(async () => {
		const app = createApp().use(router);
		listener = await listen(toNodeListener(app), {
			port: 4000,
		});
	});

	afterAll(async () => {
		await listener.close().catch(console.error);
	});

	const $echo = createFetch({
		baseURL: getURL(),
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
			retry: 3,
			onError() {
				count++;
			},
		});
		expect(count).toBe(4);
	});

	it("should retry with linear delay", async () => {
		let count = 0;

		const beforeCall = Date.now();
		let lastCallTime = 0;

		const fetchPromise = betterFetch(getURL("error"), {
			retry: {
				type: "linear",
				attempts: 3,
				delay: 200,
			},
			onError() {
				count++;
				lastCallTime = Date.now();
			},
		});

		await fetchPromise;

		expect(count).toBe(4);
		expect(lastCallTime - beforeCall).toBeGreaterThanOrEqual(200 * 3);
	});

	it("should retry with exponential backoff and increasing delays", async () => {
		let count = 0;
		const delays: number[] = [];
		let lastCallTime = 0;

		const fetchPromise = betterFetch(getURL("error"), {
			retry: {
				type: "exponential",
				attempts: 3,
				baseDelay: 100,
				maxDelay: 1000,
			},
			onError() {
				count++;
				const currentTime = Date.now();
				if (lastCallTime > 0) {
					delays.push(currentTime - lastCallTime);
				}
				lastCallTime = currentTime;
			},
		});

		await fetchPromise;

		expect(count).toBe(4);

		expect(delays[1]).toBeGreaterThan(delays[0]);
		expect(delays[2]).toBeGreaterThan(delays[1]);

		expect(delays[0]).toBeGreaterThanOrEqual(100);
		expect(delays[1]).toBeGreaterThanOrEqual(200);
		expect(delays[2]).toBeGreaterThanOrEqual(400);
	});

	it("abort with retry", () => {
		const controller = new AbortController();
		async function abortHandle() {
			controller.abort();
			const response = await betterFetch("", {
				baseURL: getURL("ok"),
				retry: 3,
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

	it("should work with method modifier string", async () => {
		const url = getURL();
		const response = await betterFetch("@post/method", {
			baseURL: url,
		});
		expect(response.data).toBe("POST");
		const response2 = await betterFetch("@get/method", {
			baseURL: url,
		});
		expect(response2.data).toBe("GET");
	});

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

describe("fetch-error", () => {
	const f = createFetch({
		baseURL: "http://localhost:4001",
		customFetchImpl: async (req, init) => {
			return new Response(null, {
				status: 500,
			});
		},
		throw: true,
	});
	it("should throw if the response is not ok", async () => {
		await expect(f("/ok")).rejects.toThrowError(BetterFetchError);
	});
});

describe("fetch-error-throw", () => {
	const f = createFetch({
		baseURL: "http://localhost:4001",
		customFetchImpl: async (req, init) => {
			const url = new URL(req.toString());
			if (url.pathname.startsWith("/ok")) {
				return new Response(JSON.stringify({ message: "ok" }));
			}
			if (url.pathname.startsWith("/error")) {
				return new Response(JSON.stringify({ message: "error" }), {
					status: 400,
				});
			}
			return new Response(null, {
				status: 500,
			});
		},
		throw: true,
	});
	it("should throw if the response is not ok", async () => {
		await expect(f("/not-ok")).rejects.toThrowError(BetterFetchError);
	});

	it("error should have error object", async () => {
		try {
			await f("/error");
		} catch (error) {
			if (error instanceof BetterFetchError) {
				expect(error.error).toEqual({ message: "error" });
			}
		}
	});

	it("should return data without error object", async () => {
		const res = await f<{ message: "ok" }>("/ok");
		expect(res).toEqual({ message: "ok" });
	});
});
