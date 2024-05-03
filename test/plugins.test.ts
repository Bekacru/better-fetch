import { beforeAll, describe, expect } from "vitest";
import { createFetch } from "../src";
import { csrfProtection } from "../src/plugins";

describe.only("CSRF Protection Plugin", (it) => {
	beforeAll(() => {});
	const $fetch = createFetch({
		baseURL: "https://exmaple.com",
		plugins: [csrfProtection({ path: "/csrf" })],
		customFetchImpl: async (url, req) => {
			const path = url.toString().replace("https://exmaple.com", "");
			switch (path) {
				case "/csrf":
					return new Response(
						JSON.stringify({
							csrfToken: "csrf-token",
						}),
						{
							status: 200,
							statusText: "OK",
						},
					);
				case "/login":
					// biome-ignore lint/style/noNonNullAssertion: <explanation>
					// biome-ignore lint/correctness/noSwitchDeclarations: <explanation>
					const body = JSON.parse(req?.body as string);
					if (!body.csrfToken) {
						console.log("error");
						return new Response(null, {
							status: 403,
							statusText: "Unauthorized Access",
						});
					}
					return new Response(
						JSON.stringify({
							message: "logged in",
						}),
						{
							status: 200,
							statusText: "OK",
						},
					);
				default:
					return new Response(
						JSON.stringify({
							message: "Not Found",
						}),
						{
							status: 404,
							statusText: "Not Found",
						},
					);
			}
		},
	});
	it("should add csrf token to the body of the request", async () => {
		const { data, error } = await $fetch("/login", {
			method: "POST",
			body: {
				username: "user",
				password: "password",
			},
		});

		expect(data).toEqual({ message: "logged in" });
	});
});
