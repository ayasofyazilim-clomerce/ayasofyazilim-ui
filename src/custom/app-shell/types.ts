import type * as React from "react";

/** One link in the sidebar and in the ⌘K menu. */
export type AppShellNavItem = {
  /** Stable key, unique within its group. */
  id: string;
  href: string;
  label: string;
  /** Decorative: rendered inside an `aria-hidden` wrapper, sized to 16px. */
  icon?: React.ReactNode;
  /** Shown next to the label, in the sidebar and in the ⌘K menu. */
  badge?: React.ReactNode;
  /** Spread onto the link (for example `data-tour` anchors). */
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
  labels?: AppShellLabels;
  className?: string;
  classNames?: { sidebar?: string; header?: string; main?: string };
  children: React.ReactNode;
};
