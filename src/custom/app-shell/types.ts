import type * as React from "react";

/** One link or folder in the sidebar and in the ⌘K menu. */
export type AppShellNavItem = {
  /**
   * Stable key, unique within its group. A folder's id is also its key in
   * `openFolders`, so folder ids must be unique across the whole nav.
   */
  id: string;
  /**
   * The page the item links to. A folder (an item with `items`) may have
   * none; a folder that has one is a link with a separate toggle.
   */
  href?: string;
  label: string;
  /** Decorative: rendered inside an `aria-hidden` wrapper, sized to 16px. */
  icon?: React.ReactNode;
  /** Shown next to the label, in the sidebar and in the ⌘K menu. */
  badge?: React.ReactNode;
  /** Spread onto the link or the folder's toggle (for example `data-tour` anchors). */
  dataAttributes?: Record<`data-${string}`, string>;
  /**
   * Makes the item a collapsible folder of these items, at any depth. A
   * folder with no items and no `href` is left out, like an empty group.
   */
  items?: AppShellNavItem[];
  /** Extra terms matched by the sidebar filter and the ⌘K search. */
  keywords?: string[];
  /**
   * Things to do with the item, on its row and in ⌘K under it: one action is
   * a button on the row, several are a dropdown behind a "more" button.
   */
  actions?: AppShellNavAction[];
};

/** Something to do with a nav item: a link (`href`) or a callback (`onSelect`). */
export type AppShellNavAction = {
  /** Stable key. Unique across the whole nav once shortcuts use it. */
  id: string;
  /** The button's accessible name and tooltip, or the dropdown entry. */
  label: string;
  /** A second line under the label in the dropdown, and a ⌘K search term. */
  description?: string;
  /** Decorative, sized to 16px. A single action without one shows a plus. */
  icon?: React.ReactNode;
  /** Where the action goes. Takes precedence over `onSelect`. */
  href?: string;
  /** Runs when the action is chosen and has no `href`. */
  onSelect?: () => void;
  /** Spread onto the action's button, link or dropdown entry. */
  dataAttributes?: Record<`data-${string}`, string>;
};

/** A labelled section of the sidebar and of the ⌘K menu. */
export type AppShellNavGroup = {
  id: string;
  label: string;
  items: AppShellNavItem[];
};

/** An action in the ⌘K menu that is not a nav link. */
export type AppShellCommand = {
  id: string;
  label: string;
  /** Group heading; commands with the same group are listed together. */
  group: string;
  icon?: React.ReactNode;
  /** Extra search terms matched by the ⌘K filter. */
  keywords?: string[];
  onSelect: () => void;
};

export type AppShellBreadcrumb = { label: string; href?: string };

/**
 * Shortcuts the user assigns from the ⌘K menu, keyed `item:<id>` for a nav
 * item and `action:<id>` for an item action, valued like "ctrl+shift+h" (see
 * `custom/app-shell/shortcuts`). `useStoredShortcuts` keeps them in
 * localStorage.
 */
export type AppShellShortcuts = {
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  /**
   * More combos that cannot be assigned, written like "ctrl+shift+p". ⌘K /
   * Ctrl+K, ⌘B / Ctrl+B and the browser's own are always reserved.
   */
  reserved?: string[];
};

/** Every built-in text of the shell. Each key falls back to its English default. */
export type AppShellLabels = {
  toggleSidebar?: string;
  search?: string;
  commandTitle?: string;
  commandPlaceholder?: string;
  commandEmpty?: string;
  breadcrumb?: string;
  navigation?: string;
  close?: string;
  mobileTitle?: string;
  /** The sidebar filter's placeholder and accessible name (`navFilter`). */
  filterPlaceholder?: string;
  /** The expand-all button's accessible name (`navFilter`). */
  expandAll?: string;
  /** The collapse-all button's accessible name (`navFilter`). */
  collapseAll?: string;
  /** The accessible name of the button that opens an item's actions. */
  moreActions?: string;
  /** The ⌘K button that records a shortcut for the highlighted entry (`shortcuts`). */
  assignShortcut?: string;
  /** The ⌘K button that removes the highlighted entry's shortcut (`shortcuts`). */
  removeShortcut?: string;
  /** Shown while a shortcut is being recorded (`shortcuts`). */
  pressShortcut?: string;
  /** Shown when the pressed combo is reserved (`shortcuts`). */
  shortcutReserved?: string;
};

export type AppShellProps = {
  nav: AppShellNavGroup[];
  brand: React.ReactNode;
  userMenu: React.ReactNode;
  breadcrumbs?: AppShellBreadcrumb[];
  pageTitle?: string;
  /** Rendered in the header right after the breadcrumb, filling the space before `headerActions`. */
  headerContent?: React.ReactNode;
  headerActions?: React.ReactNode;
  commands?: AppShellCommand[];
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  isActive?: (href: string, pathname: string) => boolean;
  /**
   * Called with the `href` of a nav item chosen in the ⌘K menu, instead of
   * `router.push(href)`. Lets the app ask before leaving (an unsaved draft).
   * Sidebar and breadcrumb links are plain links and do not call it.
   */
  onNavigate?: (href: string) => void;
  /**
   * The ids of the open folders, controlled. Without it the shell keeps its
   * own: the folders above the active page start open, and the folders above
   * each page the user reaches open as well.
   */
  openFolders?: string[];
  /** Called with the next open folder ids when the user opens or closes one. */
  onOpenFoldersChange?: (ids: string[]) => void;
  /**
   * A filter box over the sidebar (from two characters) and an expand/collapse
   * all button. Off by default.
   */
  navFilter?: boolean;
  /**
   * User-assigned shortcuts: assigned, shown and removed from the ⌘K menu,
   * and fired from anywhere. Off unless passed.
   */
  shortcuts?: AppShellShortcuts;
  labels?: AppShellLabels;
  className?: string;
  classNames?: { sidebar?: string; header?: string; main?: string };
  children: React.ReactNode;
};
