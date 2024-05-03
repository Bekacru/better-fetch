import { createFetch, Plugin } from "..";

interface CSRFOptions {
	/**
	 * The path to fetch the csrf token
	 */
	path: string;
	/**
	 * Determines which url should run the csrf fetch
	 */
	urlMatch?: {
		re?: RegExp;
		startsWith?: string;
		in?: string[];
	};
}
/**
 * A plugin to add csrf protection to your requests
 */
export const csrfProtection = (opts: CSRFOptions): Plugin => {
	return async (url, options) => {
		const { path, urlMatch } = opts;
		if (urlMatch) {
			if (
				(urlMatch.re && !urlMatch.re.test(url)) ||
				(urlMatch.startsWith && !url.startsWith(urlMatch.startsWith)) ||
				(urlMatch.in && !urlMatch.in.includes(url))
			) {
				return {
					url,
					options,
				};
			}
		}
		const $fetch = createFetch({
			baseURL: options?.baseURL,
		});
		const { data } = await $fetch(url);
		options = {
			...options,

			body: {
				...options?.body,
				csrfToken: data,
			},
		};
		return {
			url,
			options,
		};
	};
};
