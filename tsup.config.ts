import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		index: "./src/index.ts",
		typed: "./src/typed.ts",
	},
	splitting: false,
	sourcemap: true,
	format: ["esm", "cjs"],
	dts: true,
	clean: true,
	external: ["zod"],
});
