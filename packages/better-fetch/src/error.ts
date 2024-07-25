export class BetterFetchError extends Error {
	constructor(
		public status: number,
		public statusText: string,
		public error: any,
	) {
		super(statusText || status.toString(), {
			cause: error,
		});
	}
}
