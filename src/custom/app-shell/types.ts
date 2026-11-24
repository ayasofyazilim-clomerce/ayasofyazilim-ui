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
  labels?: AppShellLabels;
  className?: string;
  classNames?: { sidebar?: string; header?: string; main?: string };
  children: React.ReactNode;
};
