import fs from "fs";
import path from "path";

const css = fs.readFileSync(
  path.join(__dirname, "../styles/globals.css"),
  "utf8",
);

function block(selector: RegExp): string {
  const match = css.match(selector);
  if (!match) throw new Error(`block not found: ${selector}`);
  return match[1] ?? "";
}

describe("globals.css tokens", () => {
  it("defines --destructive-foreground in :root", () => {
    expect(block(/^:root\s*\{([\s\S]*?)^\}/m)).toContain(
      "--destructive-foreground:",
    );
  });

  it("defines --destructive-foreground in .dark", () => {
    expect(block(/^\.dark\s*\{([\s\S]*?)^\}/m)).toContain(
      "--destructive-foreground:",
    );
  });

  it("leaves the tailwind import to the consuming app", () => {
    expect(css).not.toMatch(/^@import\s+["']tailwindcss["']/m);
  });

  it("scans its own modules relative to the stylesheet, in src and dist", () => {
    expect(css).toMatch(/^@source "\.\.\/\*\*\/\*\.\{js,ts,tsx\}";$/m);
  });

  it("has no monorepo-specific @source path", () => {
    expect(css).not.toMatch(/@source\s+["'](\.\.\/){2,}/);
  });
});
