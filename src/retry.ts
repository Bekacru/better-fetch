export type RetryCondition = (
	response: Response | null,
) => boolean | Promise<boolean>;

export type LinearRetry = {
	type: "linear";
	attempts: number;
	delay: number;
	shouldRetry?: RetryCondition;
};

export type ExponentialRetry = {
	type: "exponential";
	attempts: number;
	baseDelay: number;
	maxDelay: number;
	shouldRetry?: RetryCondition;
};

export type RetryOptions = LinearRetry | ExponentialRetry | number;

export interface RetryStrategy {
	shouldAttemptRetry(
		attempt: number,
		response: Response | null,
	): Promise<boolean>;
	getDelay(attempt: number): number;
}

class LinearRetryStrategy implements RetryStrategy {
	constructor(private options: LinearRetry) {}

	shouldAttemptRetry(
		attempt: number,
		response: Response | null,
	): Promise<boolean> {
		if (this.options.shouldRetry) {
			return Promise.resolve(
				attempt < this.options.attempts && this.options.shouldRetry(response),
			);
		}
		return Promise.resolve(attempt < this.options.attempts);
	}

	getDelay(): number {
		return this.options.delay;
	}
}

class ExponentialRetryStrategy implements RetryStrategy {
	constructor(private options: ExponentialRetry) {}

	shouldAttemptRetry(
		attempt: number,
		response: Response | null,
	): Promise<boolean> {
		if (this.options.shouldRetry) {
			return Promise.resolve(
				attempt < this.options.attempts && this.options.shouldRetry(response),
			);
		}
		return Promise.resolve(attempt < this.options.attempts);
	}

	getDelay(attempt: number): number {
		const delay = Math.min(
			this.options.maxDelay,
			this.options.baseDelay * Math.pow(2, attempt),
		);
		return delay;
	}
}

export function createRetryStrategy(options: RetryOptions): RetryStrategy {
	if (typeof options === "number") {
		return new LinearRetryStrategy({
			type: "linear",
			attempts: options,
			delay: 1000,
		});
	}

	switch (options.type) {
		case "linear":
			return new LinearRetryStrategy(options);
		case "exponential":
			return new ExponentialRetryStrategy(options);
		default:
			throw new Error("Invalid retry strategy");
	}
}
