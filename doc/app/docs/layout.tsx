import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { DocsLayout } from "fumadocs-ui/layout";
import Link from "next/link";
import type { ReactNode } from "react";
import { docsOptions } from "../layout.config";

export default function Layout({ children }: { children: ReactNode }) {
	return <DocsLayout {...docsOptions}>{children}</DocsLayout>;
}
