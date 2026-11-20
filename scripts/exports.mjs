#!/usr/bin/env node
/**
 * Generates and checks the package's `exports` maps from the `src` tree.
 *
 *   node scripts/exports.mjs          write `exports` (source) and
 *                                     `publishConfig.exports` (dist)
 *   node scripts/exports.mjs --check  fail if package.json is out of date, or
 *                                     if any `@ayasofyazilim/ui/...` import in
 *                                     src or docs has no export entry
 *   node scripts/exports.mjs --dist   fail if a dist export target is missing,
 *                                     or if dist imports a package that is not
 *                                     a dependency or peer dependency
 *
 * Top-level `exports` point at `src` so a workspace consumer can use the
 * package without a build. pnpm swaps in `publishConfig.exports` when it packs
 * or publishes, so the npm tarball points at the built `dist`.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { builtinModules } from "node:module";
import { dirname, join, posix, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkgPath = join(root, "package.json");
const NAME = "@ayasofyazilim/ui";
const MODULE_DIRS = ["aria", "components", "custom", "hooks", "lib"];
const SKIP_FILE = /(\.d\.ts|\.(test|spec)\.tsx?|^demo\.tsx)$/;

const toPosix = (p) => p.split(sep).join(posix.sep);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__") continue;
      walk(full, out);
    } else out.push(full);
  }
  return out;
}

/** Every public module: subpath ("./custom/schema-form") → src file path. */
function collectModules() {
  const modules = new Map();
  for (const top of MODULE_DIRS) {
    for (const file of walk(join(root, "src", top))) {
      const name = file.split(sep).pop();
      if (!/\.tsx?$/.test(name) || SKIP_FILE.test(name)) continue;
      const rel = toPosix(relative(join(root, "src"), file));
      const noExt = rel.replace(/\.tsx?$/, "");
      const subpath = "./" + noExt.replace(/\/index$/, "");
      if (modules.has(subpath)) {
        throw new Error(
          `Two modules map to ${subpath}: ${modules.get(subpath)} and ${rel}`,
        );
      }
      modules.set(subpath, rel);
    }
  }
  return new Map([...modules].sort(([a], [b]) => a.localeCompare(b)));
}

function buildMaps() {
  const modules = collectModules();
  const source = {
    "./package.json": "./package.json",
    "./globals.css": "./src/styles/globals.css",
    "./postcss.config": "./postcss.config.mjs",
  };
  const dist = {
    "./package.json": "./package.json",
    "./globals.css": "./dist/styles/globals.css",
    "./postcss.config": "./dist/postcss.config.mjs",
  };
  for (const [subpath, rel] of modules) {
    const noExt = rel.replace(/\.tsx?$/, "");
    source[subpath] = `./src/${rel}`;
    dist[subpath] = {
      types: `./dist/${noExt}.d.ts`,
      default: `./dist/${noExt}.js`,
    };
  }
  return { source, dist };
}

const readPkg = () => JSON.parse(readFileSync(pkgPath, "utf8"));

function write() {
  const pkg = readPkg();
  const { source, dist } = buildMaps();
  pkg.exports = source;
  pkg.publishConfig = { ...pkg.publishConfig, exports: dist };
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`exports: wrote ${Object.keys(source).length} entries`);
}

/** `@ayasofyazilim/ui/...` specifiers used in src and docs. */
function selfSpecifiers() {
  const files = [
    ...walk(join(root, "src")).filter((f) => /\.tsx?$/.test(f)),
    ...walk(join(root, "docs")).filter((f) => f.endsWith(".md")),
    join(root, "README.md"),
  ].filter(existsSync);
  const found = new Map();
  const re = new RegExp(`["'](${NAME}/[^"'\\s]+)["']`, "g");
  for (const file of files) {
    for (const m of readFileSync(file, "utf8").matchAll(re)) {
      if (!found.has(m[1])) found.set(m[1], toPosix(relative(root, file)));
    }
  }
  return found;
}

function check() {
  const pkg = readPkg();
  const { source, dist } = buildMaps();
  const errors = [];
  if (JSON.stringify(pkg.exports) !== JSON.stringify(source)) {
    errors.push("`exports` is out of date: run `pnpm exports`.");
  }
  if (JSON.stringify(pkg.publishConfig?.exports) !== JSON.stringify(dist)) {
    errors.push("`publishConfig.exports` is out of date: run `pnpm exports`.");
  }
  for (const target of Object.values(source)) {
    if (!existsSync(join(root, target))) errors.push(`missing ${target}`);
  }
  for (const [spec, file] of selfSpecifiers()) {
    const subpath = "." + spec.slice(NAME.length);
    if (!(subpath in source) || !(subpath in dist)) {
      errors.push(`${file} imports ${spec}, which has no export entry`);
    }
  }
  return errors;
}

function packageOf(spec) {
  const parts = spec.split("/");
  return spec.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

/**
 * tsc keeps side-effect imports such as `import "leaflet/dist/leaflet.css"` in
 * declarations. They carry no types and make a consumer's type-check resolve
 * CSS files, so drop them from dist `.d.ts` files (the `.js` keeps them).
 */
function stripCssFromDeclarations() {
  for (const file of walk(join(root, "dist"))) {
    if (!file.endsWith(".d.ts")) continue;
    const code = readFileSync(file, "utf8");
    const next = code.replace(/^import\s*["'][^"']+\.css["'];?\r?\n/gm, "");
    if (next !== code) writeFileSync(file, next);
  }
}

function checkDist() {
  const pkg = readPkg();
  const errors = [];
  if (!existsSync(join(root, "dist"))) return ["dist is missing: run `pnpm build`."];
  stripCssFromDeclarations();
  const targets = Object.values(pkg.publishConfig?.exports ?? {}).flatMap(
    (t) => (typeof t === "string" ? [t] : Object.values(t)),
  );
  for (const t of targets) {
    if (!existsSync(join(root, t))) errors.push(`dist target missing: ${t}`);
  }
  const allowed = new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {}),
  ]);
  const builtins = new Set(builtinModules);
  const seen = new Map();
  for (const file of walk(join(root, "dist"))) {
    const isDts = file.endsWith(".d.ts");
    if (!isDts && !file.endsWith(".js")) continue;
    for (const spec of specifiers(readFileSync(file, "utf8"))) {
      if (spec.startsWith(".") || spec.startsWith("node:")) continue;
      const name = packageOf(spec);
      if (name === NAME || builtins.has(name)) continue;
      const typesName = `@types/${name.replace(/^@/, "").replace("/", "__")}`;
      let problem;
      if (!isDts && !allowed.has(name)) {
        problem = "is not a dependency or peer";
      } else if (isDts && !allowed.has(name) && !allowed.has(typesName)) {
        problem = `is not a dependency or peer (nor is ${typesName})`;
      } else if (isDts && !allowed.has(typesName) && !shipsTypes(name)) {
        problem = `ships no types and ${typesName} is not a dependency`;
      }
      const key = `${name} ${problem}`;
      if (problem && !seen.has(key)) {
        seen.set(key, `${toPosix(relative(root, file))} imports "${name}", which ${problem}`);
      }
    }
  }
  errors.push(...seen.values());
  return errors;
}

/** Module specifiers in emitted JS or declarations. */
function specifiers(code) {
  const patterns = [
    /\bfrom\s*["']([^"'\s]+)["']/g,
    /\bimport\s*\(\s*["']([^"'\s]+)["']\s*\)/g,
    /^\s*import\s*["']([^"'\s]+)["']/gm,
    /\brequire\s*\(\s*["']([^"'\s]+)["']\s*\)/g,
    /reference types=["']([^"'\s]+)["']/g,
  ];
  const valid = /^(@[\w.-]+\/)?[\w.-]+(\/[^\s]*)?$|^\.{1,2}\//;
  return patterns
    .flatMap((re) => [...code.matchAll(re)].map((m) => m[1]))
    .filter((s) => valid.test(s));
}

/** Whether an installed package carries its own type declarations. */
function shipsTypes(name) {
  const dir = join(root, "node_modules", name);
  const manifest = join(dir, "package.json");
  if (!existsSync(manifest)) return false;
  const pkg = JSON.parse(readFileSync(manifest, "utf8"));
  return Boolean(
    pkg.types ||
      pkg.typings ||
      JSON.stringify(pkg.exports ?? {}).includes('"types"') ||
      existsSync(join(dir, "index.d.ts")),
  );
}

const mode = process.argv[2];
let errors = [];
if (mode === "--check") errors = check();
else if (mode === "--dist") errors = checkDist();
else write();

if (errors.length) {
  console.error(errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
} else if (mode) {
  console.log(`exports ${mode}: ok`);
}
