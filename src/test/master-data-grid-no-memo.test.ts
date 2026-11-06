import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

/**
 * Guard: the React Compiler compiles this package from source in the web app.
 * A component that reads a TanStack Table/Row/Header/Column/Cell from its props
 * gets its output cached behind the (stable) object identity, so it stops
 * updating. Such files must opt out with a top-level "use no memo" directive.
 *
 * Detection (deliberately simple): the file imports Table, Row, Header, Column
 * or Cell from "@tanstack/react-table" (aliases respected) AND the local name
 * is used as a type annotation (`name: Type` / `name?: Type`), i.e. in a props
 * interface or a parameter. The directive must sit in the leading run of
 * string-literal statements, before any import.
 */
const ROOT = join(__dirname, "../custom/master-data-grid/components");
const TANSTACK_TYPES = ["Table", "Row", "Header", "Column", "Cell"];

// Existing files flagged when this guard was added, left untouched on purpose.
// They are not yet known to be affected; review each, then opt out or remove.
const KNOWN_UNGUARDED = [
  "filters/inline-column-filter.tsx",
  "filters/multi-filter-dialog.tsx",
  "toolbar/toolbar.tsx",
];

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return walk(full);
    return full.endsWith(".tsx") ? [full] : [];
  });

const rel = (file: string) =>
  file.split("\\").join("/").split("master-data-grid/components/")[1] ?? file;

const takesTanstackProps = (src: string) => {
  const imports = [
    ...src.matchAll(
      /import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+"@tanstack\/react-table"/g
    ),
  ];
  const locals = imports.flatMap((m) =>
    (m[1] ?? "")
      .split(",")
      .map((s) => s.trim().replace(/^type\s+/, ""))
      .filter(Boolean)
      .map((s) => {
        const [orig = "", alias] = s.split(/\s+as\s+/);
        return TANSTACK_TYPES.includes(orig) ? (alias ?? orig) : null;
      })
      .filter((x): x is string => !!x)
  );
  return locals.some((l) => new RegExp(`\\w\\??:\\s*${l}\\b`).test(src));
};

const hasNoMemo = (src: string) => {
  const directives: string[] = [];
  for (const line of src.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    const m = t.match(/^(["'])(.*)\1;?$/);
    if (!m) break;
    directives.push(m[2] ?? "");
  }
  return directives.includes("use no memo");
};

describe("master-data-grid components opt out of the React Compiler", () => {
  const files = walk(ROOT).filter((f) =>
    takesTanstackProps(readFileSync(f, "utf8"))
  );

  it("detects the known TanStack-prop components", () => {
    expect(files.map(rel)).toEqual(
      expect.arrayContaining([
        "table/grid-header.tsx",
        "table/grid-row.tsx",
        "table/header-cell.tsx",
      ])
    );
  });

  it.each(
    files.filter((f) => !KNOWN_UNGUARDED.includes(rel(f))).map((f) => [rel(f), f])
  )(
    '%s starts with "use no memo"',
    (_name, file) => {
      expect(hasNoMemo(readFileSync(file, "utf8"))).toBe(true);
    }
  );
});
