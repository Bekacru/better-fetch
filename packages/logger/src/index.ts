import { BetterFetchPlugin } from "@better-fetch/fetch";
import { createConsola } from "consola";
import { getStatusText } from "./util";

type ConsoleEsque = {
	log: (...args: any[]) => void;
	error: (...args: any[]) => void;
	success?: (...args: any[]) => void;
	fail?: (...args: any[]) => void;
	warn?: (...args: any[]) => void;
};

const c = createConsola({
	fancy: true,
	formatOptions: {
		columns: 80,
		colors: true,
		compact: 10,
		date: false,
	},
});

export interface LoggerOptions {
	/**
	 * Enable or disable the logger
	 * @default true
	 */
	enabled?: boolean;
	/**
	 * Custom console object
	 */
	console?: ConsoleEsque;
	/**
	 * Enable or disable verbose mode
	 */
	verbose?: boolean;
}

const defaultConsole: ConsoleEsque = {
	error(...args) {
		c.error("", ...args);
	},
	log(...args) {
		c.info("", ...args);
	},
	success(...args) {
		c.success("", ...args);
	},
	fail(...args) {
		c.fail("", ...args);
	},
	warn(...args) {
		c.warn("", ...args);
	},
};

export const logger = (options?: LoggerOptions) => {
	const opts = {
		console: defaultConsole,
		enabled: true,
		...options,
	};
	const { enabled } = opts;
	return {
		id: "logger",
		name: "Logger",
		version: "1.0.0",
		hooks: {
			onRequest(context) {
				if (!enabled) return;
				opts.console.log("Request being sent to:", context.url.toString());
			},
			async onSuccess(context) {
				if (!enabled) return;
				const log = opts.console.success || opts.console.log;
				log("Request succeeded", context.data);
			},
			onRetry(response) {
				if (!enabled) return;
				const log = opts.console.warn || opts.console.log;
				log(
					"Retrying request...",
					"Attempt:",
					(response.request.retryAttempt || 0) + 1,
				);
			},
			async onError(context) {
				if (!enabled) return;
				const log = opts.console.fail || opts.console.error;
				let obj: any;
				try {
					if (opts.verbose) {
						const res = context.response.clone();
						const json = await res.json();
						if (json) {
							obj = json;
						}
					}
				} catch (e) {}
				log(
					"Request failed with status: ",
					context.response.status,
					`(${
						context.response.statusText ||
						getStatusText(context.response.status)
					})`,
				);
				options?.verbose && obj && opts.console.error(obj);
			},
		},
	} satisfies BetterFetchPlugin;
};
