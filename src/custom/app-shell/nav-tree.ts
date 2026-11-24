import { matchActiveHref } from "./match-active-href";
import type { AppShellNavGroup, AppShellNavItem } from "./types";

/**
 * Pure helpers over the nav tree. No "use client": a Server Component can
 * import them from `@ayasofyazilim-clomerce/ui/custom/app-shell/nav-tree`.
 */

/** True when the item has child items, so it renders as a folder. */
export function isNavFolder(
  item: AppShellNavItem
): item is AppShellNavItem & { items: AppShellNavItem[] } {
  return item.items !== undefined && item.items.length > 0;
}

function pruneItems(items: AppShellNavItem[]): AppShellNavItem[] {
  let changed = false;
  const kept: AppShellNavItem[] = [];
  for (const item of items) {
    if (item.items === undefined) {
      if (item.href === undefined) changed = true;
      else kept.push(item);
      continue;
    }
    const children = pruneItems(item.items);
    if (children.length === 0 && item.href === undefined) {
      changed = true;
      continue;
    }
    if (children !== item.items) {
      changed = true;
      kept.push({ ...item, items: children });
    } else kept.push(item);
  }
  return changed ? kept : items;
}

/**
 * The nav without the entries that would render nothing: an item with no
 * `href` and no items, a folder whose items are all left out and that has no
 * `href` of its own, and a group with no items left. Unchanged items and
 * groups keep their identity.
 */
export function pruneNav(nav: AppShellNavGroup[]): AppShellNavGroup[] {
  const groups: AppShellNavGroup[] = [];
  for (const group of nav) {
    const items = pruneItems(group.items);
    if (items.length === 0) continue;
    groups.push(items === group.items ? group : { ...group, items });
  }
  return groups;
}

function visitItems(
  items: AppShellNavItem[],
  ancestors: AppShellNavItem[],
  visit: (item: AppShellNavItem, ancestors: AppShellNavItem[]) => void
) {
  for (const item of items) {
    visit(item, ancestors);
    if (item.items) visitItems(item.items, [...ancestors, item], visit);
  }
}

/** Every item of the nav, folders before their items, with its folders. */
export function walkNav(
  nav: AppShellNavGroup[],
  visit: (
    item: AppShellNavItem,
    ancestors: AppShellNavItem[],
    group: AppShellNavGroup
  ) => void
): void {
  for (const group of nav) {
    visitItems(group.items, [], (item, ancestors) =>
      visit(item, ancestors, group)
    );
  }
}

/** The ids of every folder in the nav, in tree order. */
export function navFolderIds(nav: AppShellNavGroup[]): string[] {
  const ids: string[] = [];
  walkNav(nav, (item) => {
    if (isNavFolder(item)) ids.push(item.id);
  });
  return ids;
}

/** Every `href` in the nav, folders included, in tree order. */
export function navHrefs(nav: AppShellNavGroup[]): string[] {
  const hrefs: string[] = [];
  walkNav(nav, (item) => {
    if (item.href !== undefined) hrefs.push(item.href);
  });
  return hrefs;
}

/**
 * The ids of the folders above the active page, outermost first, so the
 * sidebar can open them. The active page is the item `isActive` accepts or,
 * without it, the `href` `matchActiveHref` picks from every `href` in the
 * tree. A folder whose own `href` is active is not in the list; the folders
 * above it are.
 */
export function foldersAbove(
  nav: AppShellNavGroup[],
  pathname: string,
  isActive?: (href: string, pathname: string) => boolean
): string[] {
  const activeHref = isActive ? null : matchActiveHref(navHrefs(nav), pathname);
  const ids = new Set<string>();
  walkNav(nav, (item, ancestors) => {
    if (item.href === undefined || ancestors.length === 0) return;
    const active = isActive
      ? isActive(item.href, pathname)
      : item.href === activeHref;
    if (active) for (const folder of ancestors) ids.add(folder.id);
  });
  return Array.from(ids);
}

/**
 * Text folded for matching: lower case, without accents and with the dotless
 * ı as i, so "istanbul" finds "İstanbul" and "cafe" finds "Café".
 */
export function foldNavText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ı/g, "i");
}

/** The shortest filter the sidebar applies; a shorter one shows everything. */
export const NAV_FILTER_MIN_LENGTH = 2;

function itemMatches(item: AppShellNavItem, query: string): boolean {
  if (foldNavText(item.label).includes(query)) return true;
  return (item.keywords ?? []).some((keyword) =>
    foldNavText(keyword).includes(query)
  );
}

function filterItems(
  items: AppShellNavItem[],
  query: string
): AppShellNavItem[] {
  const kept: AppShellNavItem[] = [];
  for (const item of items) {
    // A match keeps its whole folder; otherwise a folder stays for the
    // matches inside it.
    if (itemMatches(item, query)) kept.push(item);
    else if (item.items) {
      const children = filterItems(item.items, query);
      if (children.length > 0) kept.push({ ...item, items: children });
    }
  }
  return kept;
}

/**
 * The nav as the sidebar filter shows it: the items whose label or keywords
 * contain `query` (folded, see `foldNavText`), every item inside a matching
 * folder, and the folders above each match. Groups with nothing left are
 * left out. A query shorter than `NAV_FILTER_MIN_LENGTH` characters (after
 * trimming) returns `null`: no filter.
 */
export function filterNav(
  nav: AppShellNavGroup[],
  query: string
): AppShellNavGroup[] | null {
  const folded = foldNavText(query.trim());
  if (folded.length < NAV_FILTER_MIN_LENGTH) return null;
  const groups: AppShellNavGroup[] = [];
  for (const group of nav) {
    const items = filterItems(group.items, folded);
    if (items.length > 0) groups.push({ ...group, items });
  }
  return groups;
}
