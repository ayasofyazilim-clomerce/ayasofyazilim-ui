import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { defineConfig } from "tsup";

// Files the JavaScript imports or the consumer's CSS pipeline reads, copied
// next to the emitted modules so relative paths keep working.
const STATIC_FILE = /\.(json|css|png|jpe?g|gif|svg|webp|woff2?|ttf|eot)$/;

function staticFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "test" && dir === "src" ? [] : staticFiles(full);
    }
    return STATIC_FILE.test(entry.name) ? [full] : [];
  });
}

function copy(from: string, to: string) {
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
}

export default defineConfig({
  // One output file per source module (no bundling), so every subpath export
  // maps to its own file and "use client" directives stay per module.
  entry: [
    "src/{aria,components,custom,hooks,lib}/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.{test,spec}.{ts,tsx}",
    "!src/**/__tests__/**",
    "!src/**/demo.tsx",
  ],
  format: ["esm"],
  bundle: false,
  dts: false,
  sourcemap: true,
  clean: true,
  splitting: false,
  target: "es2022",
  outDir: "dist",
  async onSuccess() {
    for (const file of staticFiles("src")) {
      copy(file, join("dist", relative("src", file)));
    }
    copy("postcss.config.mjs", join("dist", "postcss.config.mjs"));
  },
});
