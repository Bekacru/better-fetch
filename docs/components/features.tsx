"use client";
import {
	Blocks,
	BookOpenCheck,
	BookType,
	PlugZap2Icon,
	Plus,
	RefreshCw,
	TimerReset,
	Variable,
} from "lucide-react";
import React from "react";
import { Ripple } from "./ripple";
import { GithubStat } from "./github-stat";

const feats = [
	{
		icon: <BookType className="w-4 h-4" />,
		title: "Type Safety",
		short: "Zod-based type checks & validations",
		description:
			"Advanced type inference and runtime validations with zod, allowing developers to define schemas to ensure data structures are validated properly at both compile time and runtime, providing a robust type-safe environment.",
	},
	{
		icon: <Variable className="w-4 h-4" />,
		title: "Smart Parser",
		short: "Handles various response types",
		description:
			"Smart response parser for any content type, efficiently handling JSON, text, form data, and Stream responses, catering to diverse API response formats and ensuring seamless data parsing across varying response types.",
	},
	{
		icon: <BookOpenCheck className="w-4 h-4" />,
		title: "Fetch Schema",
		short: "Route validation with zod",
		description:
			"Pre-defined routes with zod schema validations to formalize API interactions, enabling automated validation of request and response formats to maintain consistent API usage and reduce runtime errors.",
	},
	{
		icon: <Blocks className="w-4 h-4" />,
		title: "Extensible",
		short: "Easily extend with plugins",
		description:
			"Plugins and hooks to extend the functionality, offering a modular approach to customize and enhance core features, allowing developers to implement additional logic or integrate third-party capabilities effortlessly.",
	},
	{
		icon: <TimerReset className="w-4 h-4" />,
		title: "Advanced Retry",
		short: "Linear & exponential retry strategies",
		description:
			"Advanced retry mechanisms with linear and exponential backoff strategies or custom retry conditions, enhancing request reliability by automatically handling transient failures and optimizing retry logic tailored to specific use cases.",
	},
	{
		icon: <PlugZap2Icon className="w-4 h-4" />,
		title: "Compatible with fetch-like APIs",
		short: "Works across environments",
		description:
			"Wraps around fetch and works on the browser, Node (version 18+), workers, Deno, and Bun out of the box but can also use custom fetch implementations like node-fetch, providing versatility and ease of integration across various JavaScript environments while facilitating seamless HTTP request handling.",
	},
];

export default function Features({ stars }: { stars: string | null }) {
	return (
		<div className="md:w-10/12 overflow-hidden mt-10 mx-auto font-geist relative md:border-l-0 md:border-[1.2px] rounded-none -pr-2">
			<Plus className="absolute top-[-17px] left-[-17px] text-black/20 dark:text-white/30  w-8 h-8" />
			<div className="grid w-full grid-cols-1 grid-rows-4 md:grid-cols-3 md:mx-0 md:grid-rows-4">
				{feats.map((feat) => (
					<div
						key={feat.title}
						className="relative items-start justify-start border-l-[1.2px] border-t-[1.2px] md:border-t-0  transform-gpu  flex flex-col p-10 overflow-clip"
					>
						<Plus className="absolute bottom-[-17px] left-[-17px] text-black/20 dark:text-white/30  w-8 h-8" />

						<div className="flex items-center gap-2 my-1">
							{feat.icon}
							<p className="text-gray-600 dark:text-gray-400">{feat.title}</p>
						</div>
						<div className="mt-2">
							<div className="max-w-full">
								<div className="flex gap-3 ">
									<p className="max-w-lg text-xl font-normal tracking-tighter md:text-2xl">
										{feat.short}
									</p>
								</div>
							</div>
							<p className="mt-2 text-sm text-left text-muted-foreground">
								{feat.description}{" "}
								<a className="text-gray-50" href="/docs" target="_blank">
									Learn more
								</a>
							</p>
						</div>
					</div>
				))}
				<div className="relative md:grid md:col-span-3 grid-cols-2 row-span-2 border-t-[1.2px] border-l-[1.2px]  md:border-b-[1.2px] dark:border-b-0  h-full py-20 ">
					<div className="top-0 left-0 w-full h-full p-16 pt-10 md:px-10 md:absolute">
						<div className="flex flex-col items-center justify-center w-full h-full gap-3">
							<div className="flex items-center gap-2">
								<GithubStat stars={stars} />
							</div>
							<Ripple />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
