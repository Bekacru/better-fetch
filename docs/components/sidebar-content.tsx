import {
	BookOpenCheck,
	BookType,
	CircleEllipsis,
	Fingerprint,
	LucideAArrowDown,
	LucideIcon,
	RectangleEllipsis,
	ScrollText,
	ShieldX,
	SquareMousePointer,
	TimerReset,
	ToyBrick,
	Variable,
} from "lucide-react";
import { ReactNode, SVGProps } from "react";

interface Content {
	title: string;
	href?: string;
	Icon: ((props?: SVGProps<any>) => ReactNode) | LucideIcon;
	list: {
		title: string;
		href: string;
		icon: ((props?: SVGProps<any>) => ReactNode) | LucideIcon;
		group?: boolean;
	}[];
}

export const contents: Content[] = [
	{
		title: "Get Started",
		Icon: () => (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="1.4em"
				height="1.4em"
				viewBox="0 0 24 24"
			>
				<path
					fill="currentColor"
					d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m-1 14H9V8h2zm1 0V8l5 4z"
				/>
			</svg>
		),
		list: [
			{
				title: "Introduction",
				href: "/docs/introduction",
				icon: () => (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="1.2em"
						height="1.2em"
						viewBox="0 0 256 256"
					>
						<path
							fill="currentColor"
							d="M232 48h-64a32 32 0 0 0-32 32v87.73a8.17 8.17 0 0 1-7.47 8.25a8 8 0 0 1-8.53-8V80a32 32 0 0 0-32-32H24a8 8 0 0 0-8 8v144a8 8 0 0 0 8 8h72a24 24 0 0 1 24 23.94a7.9 7.9 0 0 0 5.12 7.55A8 8 0 0 0 136 232a24 24 0 0 1 24-24h72a8 8 0 0 0 8-8V56a8 8 0 0 0-8-8m-24 120h-39.73a8.17 8.17 0 0 1-8.25-7.47a8 8 0 0 1 8-8.53h39.73a8.17 8.17 0 0 1 8.25 7.47a8 8 0 0 1-8 8.53m0-32h-39.73a8.17 8.17 0 0 1-8.25-7.47a8 8 0 0 1 8-8.53h39.73a8.17 8.17 0 0 1 8.25 7.47a8 8 0 0 1-8 8.53m0-32h-39.73a8.17 8.17 0 0 1-8.27-7.47a8 8 0 0 1 8-8.53h39.73a8.17 8.17 0 0 1 8.27 7.47a8 8 0 0 1-8 8.53"
						/>
					</svg>
				),
			},
			{
				title: "Installation",
				href: "/docs/installation",
				icon: () => (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="1.2em"
						height="1.2em"
						viewBox="0 0 24 24"
					>
						<path
							fill="currentColor"
							fillRule="evenodd"
							d="M2 12c0-4.714 0-7.071 1.464-8.536C4.93 2 7.286 2 12 2c4.714 0 7.071 0 8.535 1.464C22 4.93 22 7.286 22 12c0 4.714 0 7.071-1.465 8.535C19.072 22 16.714 22 12 22s-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12m10-5.75a.75.75 0 0 1 .75.75v5.19l1.72-1.72a.75.75 0 1 1 1.06 1.06l-3 3a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 1 1 1.06-1.06l1.72 1.72V7a.75.75 0 0 1 .75-.75m-4 10a.75.75 0 0 0 0 1.5h8a.75.75 0 0 0 0-1.5z"
							clipRule="evenodd"
						/>
					</svg>
				),
			},
		],
	},
	{
		title: "Helpers",
		list: [
			{
				href: "/docs/helpers/authorization",
				title: "Authorization",
				icon: () => <Fingerprint className="w-4 h-4" />,
			},
			{
				title: "Dynamic Parameters",
				icon: () => <Variable className="w-4 h-4" />,
				href: "/docs/helpers/dynamic-parameters",
			},
			{
				title: "Timeout and Retry",
				href: "/docs/helpers/timeout-and-retry",
				icon: () => <TimerReset className="w-4 h-4" />,
			},
			{
				title: "Handling Errors",
				href: "/docs/helpers/handling-errors",
				icon: () => <ShieldX className="w-4 h-4" />,
			},
		],
		Icon: () => (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="1.4em"
				height="1.4em"
				viewBox="0 0 24 24"
			>
				<path
					fill="currentColor"
					fillRule="evenodd"
					d="M14.25 4.48v3.057c0 .111 0 .27.021.406a.94.94 0 0 0 .444.683a.96.96 0 0 0 .783.072c.13-.04.272-.108.378-.159L17 8.005l1.124.534c.106.05.248.119.378.16a.96.96 0 0 0 .783-.073a.94.94 0 0 0 .444-.683c.022-.136.021-.295.021-.406V3.031q.17-.008.332-.013C21.154 2.98 22 3.86 22 4.933v11.21c0 1.112-.906 2.01-2.015 2.08c-.97.06-2.108.179-2.985.41c-1.082.286-2.373.904-3.372 1.436q-.422.224-.878.323V5.174a3.6 3.6 0 0 0 .924-.371q.277-.162.576-.323m5.478 8.338a.75.75 0 0 1-.546.91l-4 1a.75.75 0 1 1-.364-1.456l4-1a.75.75 0 0 1 .91.546M11.25 5.214a3.4 3.4 0 0 1-.968-.339C9.296 4.354 8.05 3.765 7 3.487c-.887-.233-2.041-.352-3.018-.412C2.886 3.008 2 3.9 2 4.998v11.146c0 1.11.906 2.01 2.015 2.079c.97.06 2.108.179 2.985.41c1.081.286 2.373.904 3.372 1.436q.422.224.878.324zM4.273 8.818a.75.75 0 0 1 .91-.546l4 1a.75.75 0 1 1-.365 1.456l-4-1a.75.75 0 0 1-.545-.91m.91 3.454a.75.75 0 1 0-.365 1.456l4 1a.75.75 0 0 0 .364-1.456z"
					clipRule="evenodd"
				></path>
				<path
					className="fill-foreground"
					d="M18.25 3.151c-.62.073-1.23.18-1.75.336a8 8 0 0 0-.75.27v3.182l.75-.356l.008-.005a1.1 1.1 0 0 1 .492-.13q.072 0 .138.01c.175.029.315.1.354.12l.009.005l.75.356V3.15"
				></path>
			</svg>
		),
	},
	{
		title: "Advanced",
		Icon: () => (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="1.3em"
				height="1.3em"
				viewBox="0 0 48 48"
			>
				<path
					fill="currentColor"
					stroke="currentColor"
					strokeLinejoin="round"
					strokeWidth="4"
					d="M18 6H8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Zm0 22H8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V30a2 2 0 0 0-2-2ZM40 6H30a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Zm0 22H30a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V30a2 2 0 0 0-2-2Z"
				></path>
			</svg>
		),
		list: [
			{
				title: "Fetch Schema",
				href: "/docs/advanced/fetch-schema",
				icon: () => <BookOpenCheck className="w-4 h-4" />,
			},
			{
				title: "Default Types",
				href: "/docs/advanced/default-types",
				icon: () => <BookType className="w-4 h-4" />,
			},

			{
				title: "Hooks",
				href: "/docs/advanced/hooks",
				icon: () => <SquareMousePointer className="w-4 h-4" />,
			},
			{
				title: "Plugins",
				href: "/docs/advanced/plugins",
				icon: () => <ToyBrick className="w-4 h-4" />,
			},
		],
	},
	{
		title: "Plugins",
		Icon: () => (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="1.4em"
				height="1.4em"
				viewBox="0 0 24 24"
			>
				<g fill="none">
					<path d="M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022m-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
					<path
						fill="currentColor"
						d="M15 20a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2zm0-18a1 1 0 0 1 .993.883L16 3v3h2a2 2 0 0 1 1.995 1.85L20 8v5a6 6 0 0 1-5.775 5.996L14 19h-4a6 6 0 0 1-5.996-5.775L4 13V8a2 2 0 0 1 1.85-1.995L6 6h2V3a1 1 0 0 1 1.993-.117L10 3v3h4V3a1 1 0 0 1 1-1"
					/>
				</g>
			</svg>
		),
		list: [
			{
				title: "Utility",
				group: true,
				href: "/docs/plugins/1st-party-plugins",
				icon: () => <LucideAArrowDown className="w-4 h-4" />,
			},
			{
				title: "Logger",
				icon: () => <ScrollText className="w-4 h-4" />,
				href: "/docs/plugins/logger",
			},
		],
	},
	{
		title: "Reference",
		Icon: () => (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="1.3em"
				height="1.3em"
				viewBox="0 0 20 20"
			>
				<path
					fill="currentColor"
					d="M0 3v16h5V3zm4 12H1v-1h3zm0-3H1v-1h3zm2-9v16h5V3zm4 12H7v-1h3zm0-3H7v-1h3zm1-8.5l4.1 15.4l4.8-1.3l-4-15.3zm7 10.6l-2.9.8l-.3-1l2.9-.8zm-.8-2.9l-2.9.8l-.2-1l2.9-.8z"
				></path>
			</svg>
		),
		list: [
			{
				title: "All Options",
				icon: () => <CircleEllipsis className="w-4 h-4" />,
				href: "/docs/reference/all-options",
			},
			{
				title: "Extra Options",
				icon: () => <RectangleEllipsis className="w-4 h-4" />,
				href: "/docs/reference/extra-options",
			},
		],
	},
];
