import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["./src/index.ts"],
	splitting: false,
	sourcemap: true,
	format: ["esm", "cjs"],
	dts: true,
	clean: true,
	external: ["zod"],
});
