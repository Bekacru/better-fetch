import { SVGProps } from "react";

export const Logo = (props: SVGProps<any>) => {
	return (
		<svg
			className="w-5 h-5"
			width="60"
			height="45"
			viewBox="0 0 60 45"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				className="fill-black dark:fill-white"
				fillRule="evenodd"
				clipRule="evenodd"
				d="M0 0H15V15H30V0H45H60V15V30V45H45V30V15H30V30H15V45H0V30V15V0Z"
			/>
		</svg>
	);
};
