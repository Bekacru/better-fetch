import { AutoTypeTable } from "fumadocs-typescript/ui";
import { Callout } from "fumadocs-ui/components/callout";
import { Card, Cards } from "fumadocs-ui/components/card";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import defaultComponents from "fumadocs-ui/mdx";
import { Popup, PopupContent, PopupTrigger } from "fumadocs-ui/twoslash/popup";
import type { MDXComponents } from "mdx/types";
import Link from "next/link";

export function useMDXComponents(components: MDXComponents): MDXComponents {
	return {
		...defaultComponents,
		...components,
		Popup,
		PopupContent,
		PopupTrigger,
		Tab,
		Tabs,
		Card,
		Cards,
		Callout,
		Link,
		AutoTypeTable,
		blockquote: (props) => <Callout>{props.children}</Callout>,
	};
}
