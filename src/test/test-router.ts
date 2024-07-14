import { createRouter, eventHandler, readBody, readRawBody } from "h3";

export const router = createRouter()
	.use(
		"/ok",
		eventHandler(() => "ok"),
	)
	.use(
		"/params",
		eventHandler((event) => new URLSearchParams(event.node.req.url).toString()),
	)
	.use(
		"/url",
		eventHandler((event) => event.node.req.url),
	)
	.use(
		"/echo",
		eventHandler(async (event) => {
			return {
				path: event.path,
				body:
					event.node.req.method === "POST" ? await readBody(event) : undefined,
				headers: event.node.req.headers,
			};
		}),
	)
	.use(
		"/post",
		eventHandler(async (event) => {
			const rawBody = await readBody(event);
			return {
				body: rawBody,
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
	)
	.use(
		"/204",
		eventHandler(() => null),
	)
	.use(
		"/param/:id",
		eventHandler((event) => {
			return event.node.req.url?.toString();
		}),
	)
	.use(
		"/method",
		eventHandler((event) => {
			return event.node.req.method;
		}),
	);
