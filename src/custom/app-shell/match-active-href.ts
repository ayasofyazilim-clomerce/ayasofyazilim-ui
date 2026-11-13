/** Drops the query string and hash, and any trailing slash except the root's. */
function pathOf(url: string): string {
  const end = url.search(/[?#]/);
  let path = end === -1 ? url : url.slice(0, end);
  while (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path;
}

/** True when `target` is `path` or one of its ancestors, by whole segments. */
function covers(target: string, path: string): boolean {
  if (target === "/") return path === "/";
  return path === target || path.startsWith(`${target}/`);
}

/**
 * The href in `hrefs` that best matches `pathname`: the longest one that is
 * the path itself or an ancestor of it, compared by whole segments, so
 * `/playground` matches `/playground/x` but never `/playground-x`. Query
 * strings, hashes and trailing slashes are ignored on both sides. The root
 * `/` matches only `/`. Returns the href exactly as given, or `null`.
 */
export function matchActiveHref(
  hrefs: readonly string[],
  pathname: string
): string | null {
  const path = pathOf(pathname);
  let best: string | null = null;
  let bestLength = -1;
  for (const href of hrefs) {
    const target = pathOf(href);
    if (target === "" || !covers(target, path)) continue;
    if (target.length > bestLength) {
      best = href;
      bestLength = target.length;
    }
  }
  return best;
}
