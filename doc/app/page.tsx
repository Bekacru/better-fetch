import { Icons } from "@/components/icons";
import AnimatedGridPattern from "@/components/landing/grid";
import Ripple from "@/components/landing/ripple";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Banner } from "fumadocs-ui/components/banner";
import Link from "next/link";

export default function HomePage() {
	const installCode = `npm install @better-fetch/fetch
# Then install your preferred validator
npm install zod # or valibot, arktype, etc.`;

	const usageExample = `import { betterFetch } from '@better-fetch/fetch';
import { z } from 'zod'; // or your preferred validator

const { data, error } = await betterFetch("https://api.example.com/todos/1", {
	output: z.object({
		id: z.number(),
		title: z.string(),
		completed: z.boolean()
	})
});`;

	return (
		<div className="relative min-h-screen flex w-full flex-col items-center justify-start overflow-hidden rounded-lg border bg-background p-8 md:p-20">
			<Ripple />

			{/* Hero Section */}
			<div className="z-10 flex flex-col items-center justify-center max-w-4xl">
				<h1 className="mb-4 text-6xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
					Better Fetch
				</h1>
				<p className="mb-6 text-2xl font-semibold text-center">
					Type-Safe API Calls with Your Favorite Validator
				</p>
				<p className="text-muted-foreground mx-auto max-w-2xl text-center text-lg mb-8">
					A modern fetch wrapper that works with any Standard Schema validator.
					Use Zod, Valibot, ArkType, or any spec-compliant library for powerful
					runtime validations and perfect TypeScript inference.
				</p>

				<div className="flex py-4 items-center justify-center gap-4 w-full mb-12">
					<Link href="/docs">
						<Button size="lg" className="flex gap-2 cursor-pointer">
							<Icons.docs />
							Get Started
						</Button>
					</Link>
					<Link href="https://github.com/bekacru/better-fetch">
						<Button size="lg" className="flex gap-2" variant="secondary">
							<Icons.github />
							GitHub
						</Button>
					</Link>
				</div>

				{/* Feature Grid */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full">
					{[
						{
							title: "Schema Agnostic",
							description:
								"Works with Zod, Valibot, ArkType, and any Standard Schema validator",
						},
						{
							title: "Type Safety",
							description:
								"Full TypeScript inference with your preferred validation library",
						},
						{
							title: "Runtime Validation",
							description:
								"Automatic request/response validation with detailed error messages",
						},
						{
							title: "Pre-defined Routes",
							description: "Define API schemas once, use them everywhere",
						},
						{
							title: "Universal",
							description:
								"Works in browsers, Node.js, Deno, Bun, and edge runtimes",
						},
						{
							title: "Advanced Features",
							description: "Retries, timeouts, hooks, plugins, and more",
						},
					].map((feature) => (
						<div key={feature.title} className="p-6 rounded-lg border bg-card">
							<h3 className="font-semibold mb-2">{feature.title}</h3>
							<p className="text-sm text-muted-foreground">
								{feature.description}
							</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
