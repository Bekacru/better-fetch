import Link from "next/link";
import { Logo } from "./logo";
import { NavLink } from "./nav-link";
import { ThemeToggle } from "./theme-toggler";
import { NavbarMobile, NavbarMobileBtn } from "./nav-mobile";

export const Navbar = () => {
	return (
		<div className="sticky top-0 z-30 flex flex-col bg-background backdrop-blur-md">
			<nav className="top-0 flex items-center justify-between grid-cols-12 md:grid md:border-b ">
				<Link
					href="/"
					className="md:border-r md:px-5 px-2.5 py-4 text-foreground md:col-span-2 shrink-0 transition-colors md:w-[--fd-sidebar-width]"
				>
					<div className="flex flex-col w-full gap-2">
						<div className="flex items-center gap-2">
							<Logo />
							<p>BETTER-FETCH.</p>
						</div>
					</div>
				</Link>
				<div className="relative flex items-center justify-end md:col-span-10">
					<ul className="items-center hidden border-r divide-x md:flex w-max shrink-0">
						{navMenu.map((menu, i) => (
							<NavLink key={menu.name} href={menu.path}>
								{menu.name}
							</NavLink>
						))}
					</ul>
					<ThemeToggle />
					<NavbarMobileBtn />
				</div>
			</nav>
			<NavbarMobile />
		</div>
	);
};

export const navMenu = [
	{
		name: "helo_",
		path: "/",
	},
	{
		name: "docs",
		path: "/docs",
	},
	{
		name: "community",
		path: "https://discord.gg/GYC3W7tZzb",
	},
];
