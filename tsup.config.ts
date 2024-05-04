import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		index: "./src/index.ts",
		react: "./src/react.ts",
		typed: "./src/typed.ts",
	},
	splitting: false,
	sourcemap: true,
	format: ["esm", "cjs"],
	dts: true,
	clean: true,
	external: ["react", "@sinclair/typebox"],
});
