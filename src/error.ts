export class BetterFetchError extends Error {
	constructor(public message: string, public error?: any) {
		super(message);
	}
}

export class FetchError extends BetterFetchError {
	constructor(
		public status: number,
		public statusText: string,
		public error: any,
	) {
		super(statusText);
	}
}
