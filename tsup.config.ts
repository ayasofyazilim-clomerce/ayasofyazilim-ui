import { defineConfig } from "tsup";
import { copyFileSync, mkdirSync, readdirSync, statSync } from "fs";
import { dirname, join, relative } from "path";

// Recursively find all files matching a pattern
function findFiles(
  dir: string,
  pattern: RegExp,
  files: string[] = [],
): string[] {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      findFiles(fullPath, pattern, files);
    } else if (pattern.test(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

export default defineConfig({
  entry: ["src/**/*.{ts,tsx}", "!src/**/*.test.{ts,tsx}", "!src/test/**"],
  format: ["esm"],
  dts: false,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom", "next", "next-themes"],
  bundle: false,
  outDir: "dist",
  async onSuccess() {
    // Copy all JSON and other static files from src to dist
    const staticFiles = findFiles(
      "src",
      /\.(json|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
    );

    staticFiles.forEach((file) => {
      const relativePath = relative("src", file);
      const dest = join("dist", relativePath);
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(file, dest);
      console.log(`Copied: ${file} → ${dest}`);
    });
  },
});
