import { Navbar } from "@/components/nav-bar";
import "./global.css";
import { RootProvider } from "fumadocs-ui/provider";
import type { ReactNode } from "react";
import { NavbarProvider } from "@/components/nav-mobile";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { baseUrl, createMetadata } from "@/lib/metadata";
import Loglib from "@loglib/tracker/react";

export const metadata = createMetadata({
	title: {
		template: "%s | Better Fetch",
		default: "Better Fetch",
	},
	description:
		"Advanced fetch wrapper for typescript with zod schema validations, pre-defined routes, callbacks, plugins and more.",
	metadataBase: baseUrl,
});

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<link rel="icon" href="/favicon/favicon.ico" sizes="any" />
			</head>
			<body
				className={`${GeistSans.variable} ${GeistMono.variable} font-sans relative`}
			>
				<RootProvider>
					<NavbarProvider>
						<Navbar />

						{children}
					</NavbarProvider>
				</RootProvider>
				<Loglib
					config={{
						id: "better-fetch",
						consent: "granted",
					}}
				/>
			</body>
		</html>
	);
}
