Bun.serve({
	fetch(request, server) {
		return new Response("Hello World!", {
			status: 200,
			headers: {
				"Content-Type": "text/plain",
			},
		});
	},
});
