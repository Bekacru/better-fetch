import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["./src/index.ts"],
	splitting: false,
	sourcemap: true,
	format: ["esm"],
	dts: true,
	clean: true,
});
