import { betterFetch, createFetch, createSchema } from "@better-fetch/fetch";
import { z } from "zod";

const $fetch = createFetch({
	schema: createSchema({
		"@patch/user": {
			input: z.object({
				id: z.string(),
			}),
		},
	}),
	baseURL: "http://localhost:3000",
	onRequest(context) {
		console.log("onRequest", JSON.parse(context.body));
	},
});

const f = $fetch("https://jsonplaceholder.typicode.com/todos/:id", {
	method: "GET",
	params: {
		id: "1",
	},
});
