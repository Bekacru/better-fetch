import React from "react";
import { useId } from "react";

export function Features() {
	return (
		<div className="py-2">
			<div className="grid grid-cols-1 gap-10 mx-auto mt-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 md:gap-2 max-w-7xl">
				{grid.map((feature, i) => (
					<div
						key={feature.title}
						className="relative px-6 py-2 overflow-hidden bg-gradient-to-b dark:from-neutral-900 from-neutral-100 dark:to-neutral-950 to-white"
					>
						<Grid size={i * 5 + 10} />
						<p className="relative z-0 text-base font-bold text-neutral-800 dark:text-white">
							{feature.title}
						</p>
						<p className="relative z-0 text-base font-normal text-neutral-600 dark:text-neutral-400">
							{feature.description}
						</p>
					</div>
				))}
			</div>
		</div>
	);
}

const grid = [
	{
		title: "Type Safety",
		description: "Advanced type inference and runtime validations with zod",
	},
	{
		title: "Smart Parser",
		description: "Smart response parser for any content type",
	},
	{
		title: "Fetch Schema",
		description: "Pre-defined routes with zod schema validations",
	},
	{
		title: "Extensible",
		description: "Plugins and hooks to extend the functionality",
	},
	{
		title: "Advanced Retry",
		description:
			"Advanced retry mechanisms with linear and exponential backoff strategies or custom retry conditions",
	},
	{
		title: "Compatible with fetch and fetch-like APIs",
		description:
			"Wraps around fetch and works on the browser, node (version 18+), workers, deno and bun out of the box but can also use custom fetch implementations like node-fetch",
	},
];

export const Grid = ({
	pattern,
	size,
}: {
	pattern?: number[][];
	size?: number;
}) => {
	const p = pattern ?? [
		[Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
		[Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
		[Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
		[Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
		[Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
	];
	return (
		<div className="pointer-events-none absolute left-1/2 top-0  -ml-20 -mt-2 h-full w-full [mask-image:linear-gradient(white,transparent)]">
			<div className="absolute inset-0 bg-gradient-to-r  [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] dark:from-zinc-900/30 from-zinc-100/30 to-zinc-300/30 dark:to-zinc-900/30 opacity-100">
				<GridPattern
					width={size ?? 20}
					height={size ?? 20}
					x="-12"
					y="4"
					squares={p}
					className="absolute inset-0 w-full h-full mix-blend-overlay dark:fill-white/10 dark:stroke-white/10 stroke-black/10 fill-black/10"
				/>
			</div>
		</div>
	);
};

export function GridPattern({ width, height, x, y, squares, ...props }: any) {
	const patternId = useId();

	return (
		<svg aria-hidden="true" {...props}>
			<defs>
				<pattern
					id={patternId}
					width={width}
					height={height}
					patternUnits="userSpaceOnUse"
					x={x}
					y={y}
				>
					<path d={`M.5 ${height}V.5H${width}`} fill="none" />
				</pattern>
			</defs>
			<rect
				width="100%"
				height="100%"
				strokeWidth={0}
				fill={`url(#${patternId})`}
			/>
			{squares && (
				<svg x={x} y={y} className="overflow-visible">
					{squares.map(([x, y]: any) => (
						<rect
							strokeWidth="0"
							key={`${x}-${y}`}
							width={width + 1}
							height={height + 1}
							x={x * width}
							y={y * height}
						/>
					))}
				</svg>
			)}
		</svg>
	);
}
