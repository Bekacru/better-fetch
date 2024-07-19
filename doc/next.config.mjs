import { rehypeCodeDefaultOptions } from "fumadocs-core/mdx-plugins";
import { remarkInstall } from "fumadocs-docgen";
import createMDX from "fumadocs-mdx/config";
import { transformerTwoslash } from "fumadocs-twoslash";
const withMDX = createMDX({
	mdxOptions: {
		rehypeCodeOptions: {
			transformers: [
				...rehypeCodeDefaultOptions.transformers,
				transformerTwoslash(),
			],
		},
		remarkPlugins: [
			[
				remarkInstall,
				{
					persist: {
						id: "persist-install",
					},
				},
			],
		],
	},
});

/** @type {import('next').NextConfig} */
const config = {
	reactStrictMode: true,
};

export default withMDX(config);
