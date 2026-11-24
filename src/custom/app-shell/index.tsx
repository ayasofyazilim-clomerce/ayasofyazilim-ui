"use client";

import * as React from "react";
import { useCommandState } from "cmdk";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronRightIcon,
  EllipsisIcon,
  KeyboardIcon,
  ListCollapseIcon,
  ListTreeIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { cn } from "@ayasofyazilim-clomerce/ui/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@ayasofyazilim-clomerce/ui/components/breadcrumb";
import { Button } from "@ayasofyazilim-clomerce/ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@ayasofyazilim-clomerce/ui/components/collapsible";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@ayasofyazilim-clomerce/ui/components/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@ayasofyazilim-clomerce/ui/components/dropdown-menu";
import { Kbd, KbdGroup } from "@ayasofyazilim-clomerce/ui/components/kbd";
import { Separator } from "@ayasofyazilim-clomerce/ui/components/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@ayasofyazilim-clomerce/ui/components/sidebar";
import { matchActiveHref } from "./match-active-href";
import {
  filterNav,
  foldersAbove,
  isNavFolder,
  navFolderIds,
  navHrefs,
  pruneNav,
} from "./nav-tree";
import {
  actionShortcutKey,
  ariaKeyShortcut,
  formatShortcut,
  isReservedShortcut,
  itemShortcutKey,
  normalizeShortcut,
  shortcutFromEvent,
} from "./shortcuts";
import type {
  AppShellBreadcrumb,
  AppShellCommand,
  AppShellLabels,
  AppShellNavAction,
  AppShellNavGroup,
  AppShellNavItem,
  AppShellProps,
  AppShellShortcuts,
} from "./types";
import { useAppShellNavigate } from "./use-app-shell-navigate";

/** The sidebar's name in the provider; its state cookie is `sidebar_state_app-shell`. */
const SIDEBAR_NAME = "app-shell";

function resolveLabels(
  labels: AppShellLabels | undefined
): Required<AppShellLabels> {
  return {
    toggleSidebar: labels?.toggleSidebar ?? "Toggle Sidebar",
    search: labels?.search ?? "Search…",
    commandTitle: labels?.commandTitle ?? "Command menu",
    commandPlaceholder:
      labels?.commandPlaceholder ?? "Search pages and commands…",
    commandEmpty: labels?.commandEmpty ?? "No results.",
    breadcrumb: labels?.breadcrumb ?? "Breadcrumb",
    navigation: labels?.navigation ?? "Main navigation",
    close: labels?.close ?? "Close",
    mobileTitle: labels?.mobileTitle ?? "Navigation",
    filterPlaceholder: labels?.filterPlaceholder ?? "Filter menu…",
    expandAll: labels?.expandAll ?? "Expand all",
    collapseAll: labels?.collapseAll ?? "Collapse all",
    moreActions: labels?.moreActions ?? "More actions",
    assignShortcut: labels?.assignShortcut ?? "Assign shortcut",
    removeShortcut: labels?.removeShortcut ?? "Remove shortcut",
    pressShortcut:
      labels?.pressShortcut ??
      "Press a key combination with Ctrl, Alt or ⌘. Esc cancels.",
    shortcutReserved:
      labels?.shortcutReserved ?? "That combination is reserved. Try another.",
  };
}

function hasContent(node: React.ReactNode) {
  return node !== undefined && node !== null && node !== false;
}

/** A consumer icon, sized to 16px and hidden from assistive technology. */
function ItemIcon({ icon }: { icon: React.ReactNode }) {
  if (!hasContent(icon)) return null;
  return (
    <span
      aria-hidden="true"
      className="flex size-4 shrink-0 items-center justify-center [&>svg]:size-4"
    >
      {icon}
    </span>
  );
}

/** What every row of the sidebar tree needs from the nav around it. */
type NavTreeState = {
  isItemActive: (href: string) => boolean;
  isFolderOpen: (id: string) => boolean;
  onFolderOpenChange: (id: string, open: boolean) => void;
  onLinkClick: () => void;
  moreActionsLabel: string;
  /** The `aria-keyshortcuts` of a `shortcuts` key, when one is assigned. */
  keyShortcut: (key: string) => string | undefined;
  /**
   * Props for a sidebar link to `href`: none with `navPrefetch="viewport"`;
   * with `"intent"`, no in-view prefetch and a prefetch on hover, focus or
   * touch.
   */
  linkPrefetch: (href: string) => IntentPrefetchProps;
};

type IntentPrefetchProps = {
  prefetch?: false;
  onMouseEnter?: () => void;
  onFocus?: () => void;
  onTouchStart?: () => void;
};

const NavTreeContext = React.createContext<NavTreeState | null>(null);

function useNavTree(): NavTreeState {
  const state = React.useContext(NavTreeContext);
  if (!state) throw new Error("AppShell nav rows render inside AppShellNav.");
  return state;
}

/** The chevron of a folder toggle; it turns while the toggle is expanded. */
function FolderChevron({ className }: { className?: string }) {
  return (
    <ChevronRightIcon
      aria-hidden="true"
      data-app-shell-chevron=""
      className={cn("size-4 shrink-0 transition-transform", className)}
    />
  );
}

const TURN_CHEVRON = "aria-expanded:[&_[data-app-shell-chevron]]:rotate-90";

/**
 * A row button inside a folder is marked `menu-sub-action`, not the
 * primitive's `menu-action`: the top-level row pads its button for any
 * `menu-action` inside its item, which would also count the nested rows.
 */
function subRowAction(depth: number) {
  return depth > 0 ? { "data-sidebar": "menu-sub-action" } : {};
}

/** An action's icon: its own, or a plus. */
function ActionIcon({ action }: { action: AppShellNavAction }) {
  return (
    <ItemIcon icon={hasContent(action.icon) ? action.icon : <PlusIcon />} />
  );
}

/** An action's label, with its description on a second line. */
function ActionText({ action }: { action: AppShellNavAction }) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="truncate">{action.label}</span>
      {action.description ? (
        <span className="text-muted-foreground truncate text-xs">
          {action.description}
        </span>
      ) : null}
    </span>
  );
}

/**
 * An item's actions at the right of its row: one action is a button (a link
 * when it has an `href`), several are a dropdown behind a "more" button. Like
 * the primitive's row actions they are hidden in the icon rail; ⌘K lists
 * them there too. `nextToChevron` moves them left of a folder's toggle.
 */
function NavItemActions({
  item,
  depth,
  nextToChevron,
}: {
  item: AppShellNavItem;
  depth: number;
  nextToChevron: boolean;
}) {
  const tree = useNavTree();
  const actions = item.actions ?? [];
  if (actions.length === 0) return null;
  const position = cn(depth > 0 && "top-1", nextToChevron && "right-7");
  const run = (action: AppShellNavAction) => {
    action.onSelect?.();
    tree.onLinkClick();
  };

  if (actions.length === 1) {
    const action = actions[0] as AppShellNavAction;
    return (
      <SidebarMenuAction {...subRowAction(depth)} asChild className={position}>
        {action.href !== undefined ? (
          <Link
            {...action.dataAttributes}
            {...tree.linkPrefetch(action.href)}
            href={action.href}
            aria-label={action.label}
            aria-keyshortcuts={tree.keyShortcut(actionShortcutKey(action.id))}
            title={action.label}
            onClick={tree.onLinkClick}
          >
            <ActionIcon action={action} />
          </Link>
        ) : (
          <button
            {...action.dataAttributes}
            type="button"
            aria-label={action.label}
            aria-keyshortcuts={tree.keyShortcut(actionShortcutKey(action.id))}
            title={action.label}
            onClick={() => run(action)}
          >
            <ActionIcon action={action} />
          </button>
        )}
      </SidebarMenuAction>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuAction
          {...subRowAction(depth)}
          aria-label={tree.moreActionsLabel}
          title={tree.moreActionsLabel}
          className={cn(position, "data-[state=open]:bg-sidebar-accent")}
        >
          <EllipsisIcon aria-hidden="true" />
        </SidebarMenuAction>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" className="min-w-48">
        <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
          {item.label}
        </DropdownMenuLabel>
        {actions.map((action) =>
          action.href !== undefined ? (
            <DropdownMenuItem key={action.id} asChild>
              <Link
                {...action.dataAttributes}
                {...tree.linkPrefetch(action.href)}
                href={action.href}
                aria-keyshortcuts={tree.keyShortcut(
                  actionShortcutKey(action.id)
                )}
                onClick={tree.onLinkClick}
              >
                <ActionIcon action={action} />
                <ActionText action={action} />
              </Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              key={action.id}
              {...action.dataAttributes}
              aria-keyshortcuts={tree.keyShortcut(actionShortcutKey(action.id))}
              onSelect={() => run(action)}
            >
              <ActionIcon action={action} />
              <ActionText action={action} />
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** A link row. At the top level its markup is the one 0.3.0 rendered. */
function NavLinkRow({
  item,
  href,
  depth,
}: {
  item: AppShellNavItem;
  href: string;
  depth: number;
}) {
  const tree = useNavTree();
  const active = tree.isItemActive(href);
  const hasActions = (item.actions?.length ?? 0) > 0;
  if (depth === 0) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          name={SIDEBAR_NAME}
          asChild
          isActive={active}
          tooltip={item.label}
        >
          <Link
            {...item.dataAttributes}
            {...tree.linkPrefetch(href)}
            href={href}
            aria-current={active ? "page" : undefined}
            aria-keyshortcuts={tree.keyShortcut(itemShortcutKey(item.id))}
            onClick={tree.onLinkClick}
          >
            <ItemIcon icon={item.icon} />
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
        {hasContent(item.badge) ? (
          <SidebarMenuBadge className={hasActions ? "right-7" : undefined}>
            {item.badge}
          </SidebarMenuBadge>
        ) : null}
        <NavItemActions item={item} depth={0} nextToChevron={false} />
      </SidebarMenuItem>
    );
  }
  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton
        asChild
        isActive={active}
        className={hasActions ? "pr-7" : undefined}
      >
        <Link
          {...item.dataAttributes}
          {...tree.linkPrefetch(href)}
          href={href}
          aria-current={active ? "page" : undefined}
          aria-keyshortcuts={tree.keyShortcut(itemShortcutKey(item.id))}
          onClick={tree.onLinkClick}
        >
          <ItemIcon icon={item.icon} />
          <span className="truncate">{item.label}</span>
          {hasContent(item.badge) ? (
            <span className="ml-auto shrink-0">{item.badge}</span>
          ) : null}
        </Link>
      </SidebarMenuSubButton>
      <NavItemActions item={item} depth={depth} nextToChevron={false} />
    </SidebarMenuSubItem>
  );
}

/**
 * A folder row and, while it is open, its items. A folder without an `href`
 * is one toggle button; a folder with one is a link plus a chevron toggle.
 */
function NavFolderRow({
  item,
  items,
  depth,
}: {
  item: AppShellNavItem;
  items: AppShellNavItem[];
  depth: number;
}) {
  const tree = useNavTree();
  const open = tree.isFolderOpen(item.id);
  const active = item.href !== undefined && tree.isItemActive(item.href);
  const badge = hasContent(item.badge) ? item.badge : null;
  const hasActions = (item.actions?.length ?? 0) > 0;
  const Row = depth === 0 ? SidebarMenuItem : SidebarMenuSubItem;

  let head: React.ReactNode;
  if (item.href === undefined) {
    const content = (
      <>
        <ItemIcon icon={item.icon} />
        <span className="truncate">{item.label}</span>
        {badge ? (
          <span className="ml-auto shrink-0 group-data-[collapsible=icon]:hidden">
            {badge}
          </span>
        ) : null}
        <FolderChevron className={badge ? undefined : "ml-auto"} />
      </>
    );
    head =
      depth === 0 ? (
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            {...item.dataAttributes}
            name={SIDEBAR_NAME}
            tooltip={item.label}
            className={TURN_CHEVRON}
          >
            {content}
          </SidebarMenuButton>
        </CollapsibleTrigger>
      ) : (
        <CollapsibleTrigger asChild>
          <SidebarMenuSubButton asChild>
            <button
              {...item.dataAttributes}
              type="button"
              className={cn(
                "w-full text-left",
                hasActions && "pr-7",
                TURN_CHEVRON
              )}
            >
              {content}
            </button>
          </SidebarMenuSubButton>
        </CollapsibleTrigger>
      );
  } else {
    const link = (
      <Link
        {...item.dataAttributes}
        {...tree.linkPrefetch(item.href)}
        href={item.href}
        aria-current={active ? "page" : undefined}
        aria-keyshortcuts={tree.keyShortcut(itemShortcutKey(item.id))}
        onClick={tree.onLinkClick}
      >
        <ItemIcon icon={item.icon} />
        <span className="truncate">{item.label}</span>
        {depth > 0 && badge ? (
          <span className="ml-auto shrink-0">{badge}</span>
        ) : null}
      </Link>
    );
    head = (
      <>
        {depth === 0 ? (
          <SidebarMenuButton
            name={SIDEBAR_NAME}
            asChild
            isActive={active}
            tooltip={item.label}
            className={
              hasActions
                ? "group-has-data-[sidebar=menu-action]/menu-item:pr-14"
                : undefined
            }
          >
            {link}
          </SidebarMenuButton>
        ) : (
          <SidebarMenuSubButton
            asChild
            isActive={active}
            className={hasActions ? "pr-13" : "pr-7"}
          >
            {link}
          </SidebarMenuSubButton>
        )}
        {depth === 0 && badge ? (
          <SidebarMenuBadge className={hasActions ? "right-13" : "right-7"}>
            {badge}
          </SidebarMenuBadge>
        ) : null}
        <CollapsibleTrigger asChild>
          <SidebarMenuAction
            {...subRowAction(depth)}
            aria-label={item.label}
            className={cn(depth > 0 && "top-1", TURN_CHEVRON)}
          >
            <FolderChevron />
          </SidebarMenuAction>
        </CollapsibleTrigger>
      </>
    );
  }

  return (
    <Collapsible
      asChild
      open={open}
      onOpenChange={(next) => tree.onFolderOpenChange(item.id, next)}
    >
      <Row>
        {head}
        <NavItemActions
          item={item}
          depth={depth}
          nextToChevron={item.href !== undefined}
        />
        <CollapsibleContent>
          <SidebarMenuSub className={depth > 0 ? "mr-0 pr-0" : undefined}>
            {items.map((child) => (
              <NavTreeRow key={child.id} item={child} depth={depth + 1} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Row>
    </Collapsible>
  );
}

function NavTreeRow({ item, depth }: { item: AppShellNavItem; depth: number }) {
  if (isNavFolder(item)) {
    return <NavFolderRow item={item} items={item.items} depth={depth} />;
  }
  // `pruneNav` has left out every item that is neither a folder nor a link.
  return <NavLinkRow item={item} href={item.href as string} depth={depth} />;
}

/** The open folders: the `openFolders` prop, or the shell's own state. */
type OpenFolders = {
  ids: string[];
  set: (ids: string[]) => void;
};

/**
 * Uncontrolled, the folders above the active page start open, so the server
 * HTML already shows the page, and the folders above every later active page
 * (a navigation, or a nav that arrives after a permission check) open too,
 * leaving the folders the user opened or closed alone.
 */
function useOpenFolders(
  groups: AppShellNavGroup[],
  isActive: AppShellProps["isActive"],
  openFolders: string[] | undefined,
  onOpenFoldersChange: ((ids: string[]) => void) | undefined
): OpenFolders {
  const pathname = usePathname();
  const above = React.useMemo(
    () => foldersAbove(groups, pathname, isActive),
    [groups, pathname, isActive]
  );
  const aboveKey = above.join("\n");
  const [own, setOwn] = React.useState<string[]>(above);
  const [seenKey, setSeenKey] = React.useState(aboveKey);
  if (seenKey !== aboveKey) {
    setSeenKey(aboveKey);
    setOwn((previous) => {
      const missing = above.filter((id) => !previous.includes(id));
      return missing.length === 0 ? previous : [...previous, ...missing];
    });
  }

  const controlled = openFolders !== undefined;
  const set = React.useCallback(
    (ids: string[]) => {
      if (!controlled) setOwn(ids);
      onOpenFoldersChange?.(ids);
    },
    [controlled, onOpenFoldersChange]
  );
  return { ids: openFolders ?? own, set };
}

function NavFilterBox({
  query,
  onQueryChange,
  labels,
  folderIds,
  folders,
  filtering,
}: {
  query: string;
  onQueryChange: (query: string) => void;
  labels: Required<AppShellLabels>;
  folderIds: string[];
  folders: OpenFolders;
  filtering: boolean;
}) {
  const anyOpen = folderIds.some((id) => folders.ids.includes(id));
  const toggleLabel = anyOpen ? labels.collapseAll : labels.expandAll;
  return (
    <div
      role="search"
      data-slot="app-shell-nav-filter"
      className="bg-sidebar sticky top-0 z-10 flex items-center gap-1 px-2 pt-2 group-data-[collapsible=icon]:hidden"
    >
      <SidebarInput
        type="search"
        value={query}
        placeholder={labels.filterPlaceholder}
        aria-label={labels.filterPlaceholder}
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && query !== "") {
            event.preventDefault();
            onQueryChange("");
          }
        }}
      />
      {folderIds.length > 0 ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          aria-label={toggleLabel}
          title={toggleLabel}
          disabled={filtering}
          onClick={() => folders.set(anyOpen ? [] : folderIds)}
        >
          {anyOpen ? (
            <ListCollapseIcon aria-hidden="true" />
          ) : (
            <ListTreeIcon aria-hidden="true" />
          )}
        </Button>
      ) : null}
    </div>
  );
}

function AppShellNav({
  groups,
  isActive,
  labels,
  folders,
  navFilter,
  shortcuts,
  prefetch,
}: {
  groups: AppShellNavGroup[];
  isActive?: (href: string, pathname: string) => boolean;
  labels: Required<AppShellLabels>;
  folders: OpenFolders;
  navFilter: boolean;
  shortcuts?: AppShellShortcuts;
  prefetch: "viewport" | "intent";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const idPrefix = React.useId();
  const { isMobile, setOpenMobile, state, setOpen } = useSidebar(SIDEBAR_NAME);
  const [query, setQuery] = React.useState("");
  // Folders the user opened or closed while filtering; the filter itself
  // opens every folder it shows, without touching `folders`.
  const [filterToggles, setFilterToggles] = React.useState<
    Record<string, boolean>
  >({});
  const deferredQuery = React.useDeferredValue(query);
  const filtered = React.useMemo(
    () => (navFilter ? filterNav(groups, deferredQuery) : null),
    [navFilter, groups, deferredQuery]
  );
  const shown = filtered ?? groups;
  const folderIds = React.useMemo(() => navFolderIds(groups), [groups]);
  const activeHref = isActive
    ? null
    : matchActiveHref(navHrefs(groups), pathname);

  const openIds = folders.ids;
  const tree: NavTreeState = {
    isItemActive: (href) =>
      isActive ? isActive(href, pathname) : href === activeHref,
    isFolderOpen: (id) =>
      filtered ? (filterToggles[id] ?? true) : openIds.includes(id),
    onFolderOpenChange: (id, open) => {
      // In the icon rail a folder has no room for its items: choosing it
      // expands the sidebar with the folder open.
      if (state === "collapsed" && !isMobile) {
        setOpen(true);
        if (!openIds.includes(id)) folders.set([...openIds, id]);
        return;
      }
      if (filtered) {
        setFilterToggles((previous) => ({ ...previous, [id]: open }));
        return;
      }
      folders.set(
        open
          ? openIds.includes(id)
            ? openIds
            : [...openIds, id]
          : openIds.filter((openId) => openId !== id)
      );
    },
    onLinkClick: () => {
      if (isMobile) setOpenMobile(false);
    },
    moreActionsLabel: labels.moreActions,
    keyShortcut: (key) => {
      const shortcut = shortcuts?.value[key];
      return shortcut ? ariaKeyShortcut(shortcut) : undefined;
    },
    // "intent": no prefetch while a link is merely in view; its page is
    // prefetched when the person points at it (hover, keyboard focus or a
    // touch).
    linkPrefetch: (href) =>
      prefetch === "intent"
        ? {
            prefetch: false,
            onMouseEnter: () => router.prefetch(href),
            onFocus: () => router.prefetch(href),
            onTouchStart: () => router.prefetch(href),
          }
        : {},
  };

  return (
    <>
      {navFilter ? (
        <NavFilterBox
          query={query}
          onQueryChange={(next) => {
            setQuery(next);
            setFilterToggles({});
          }}
          labels={labels}
          folderIds={folderIds}
          folders={folders}
          filtering={filtered !== null}
        />
      ) : null}
      <nav aria-label={labels.navigation} className="flex flex-col gap-2">
        {filtered && filtered.length === 0 ? (
          <p role="status" className="text-muted-foreground px-4 py-2 text-sm">
            {labels.commandEmpty}
          </p>
        ) : null}
        <NavTreeContext.Provider value={tree}>
          {shown.map((group, groupIndex) => {
            const labelId = `${idPrefix}-group-${groupIndex}`;
            return (
              <SidebarGroup key={group.id}>
                <SidebarGroupLabel id={labelId}>
                  {group.label}
                </SidebarGroupLabel>
                <SidebarMenu aria-labelledby={labelId}>
                  {group.items.map((item) => (
                    <NavTreeRow key={item.id} item={item} depth={0} />
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            );
          })}
        </NavTreeContext.Provider>
      </nav>
    </>
  );
}

function AppShellBreadcrumbs({
  crumbs,
  label,
}: {
  crumbs: AppShellBreadcrumb[];
  label: string;
}) {
  const lastIndex = crumbs.length - 1;
  return (
    <Breadcrumb aria-label={label} className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((crumb, index) => {
          const isLast = index === lastIndex;
          return (
            <React.Fragment key={`${index}-${crumb.label}`}>
              {index > 0 ? (
                <BreadcrumbSeparator className="hidden sm:block" />
              ) : null}
              {/* Below `sm` only the page itself is shown. */}
              <BreadcrumbItem
                className={cn("min-w-0", !isLast && "hidden sm:inline-flex")}
              >
                {isLast ? (
                  <BreadcrumbPage className="block truncate">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : crumb.href ? (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/** Commands grouped by `group`, groups and commands in first-seen order. */
function groupCommands(commands: readonly AppShellCommand[]) {
  const groups = new Map<string, AppShellCommand[]>();
  for (const command of commands) {
    const group = groups.get(command.group);
    if (group) group.push(command);
    else groups.set(command.group, [command]);
  }
  return Array.from(groups, ([heading, items]) => ({ heading, items }));
}

/**
 * A link of a nav group, or one of an item's actions, as ⌘K lists it, with
 * the labels above it.
 */
type NavCommandEntry = {
  key: string;
  kind: "item" | "action";
  /** The item's id, or the action's. */
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  keywords?: string[];
  /** The folders above an item, or the folders and the item above an action. */
  path: string[];
  href?: string;
  onSelect?: () => void;
};

/**
 * Every link of the group, folders with an `href` included, each followed by
 * its actions, in tree order. A folder without an `href` lists only its
 * actions.
 */
function navCommandEntries(group: AppShellNavGroup): NavCommandEntry[] {
  const entries: NavCommandEntry[] = [];
  const visit = (items: AppShellNavItem[], ids: string[], path: string[]) => {
    for (const item of items) {
      const itemIds = [...ids, item.id];
      if (item.href !== undefined) {
        entries.push({
          key: itemIds.join("/"),
          kind: "item",
          id: item.id,
          label: item.label,
          icon: item.icon,
          badge: item.badge,
          keywords: item.keywords,
          path,
          href: item.href,
        });
      }
      for (const action of item.actions ?? []) {
        entries.push({
          key: `${itemIds.join("/")}#${action.id}`,
          kind: "action",
          id: action.id,
          label: action.label,
          icon: action.icon,
          keywords: action.description ? [action.description] : undefined,
          path: [...path, item.label],
          href: action.href,
          onSelect: action.onSelect,
        });
      }
      if (item.items) visit(item.items, itemIds, [...path, item.label]);
    }
  };
  visit(group.items, [], []);
  return entries;
}

/** The value cmdk filters and selects a nav entry by. */
function entryValue(group: AppShellNavGroup, entry: NavCommandEntry): string {
  return entry.path.length === 0
    ? `${group.label} ${entry.label}`
    : `${group.label} ${[...entry.path, entry.label].join(" / ")}`;
}

/** The `shortcuts.value` key of a nav entry. */
function entryShortcutKey(entry: NavCommandEntry): string {
  return entry.kind === "item"
    ? itemShortcutKey(entry.id)
    : actionShortcutKey(entry.id);
}

/** An entry as the shortcut bar names it: "Orders / New order". */
function entryDisplay(entry: NavCommandEntry): string {
  return [...entry.path, entry.label].join(" / ");
}

type NavCommandGroup = { group: AppShellNavGroup; entries: NavCommandEntry[] };

/** A shortcut as keys: Ctrl Shift H. Hidden from assistive tech, which reads `aria-keyshortcuts`. */
function ShortcutKeys({
  shortcut,
  className,
}: {
  shortcut: string;
  className?: string;
}) {
  return (
    <KbdGroup aria-hidden="true" className={cn("shrink-0", className)}>
      {formatShortcut(shortcut).map((part, index) => (
        <Kbd key={index}>{part}</Kbd>
      ))}
    </KbdGroup>
  );
}

/** The entry a shortcut is being recorded for. */
type Recording = { key: string; display: string };

/**
 * The bar under the ⌘K list that assigns and removes the highlighted entry's
 * shortcut. Its buttons are reached with Tab from the search box, so the
 * keyboard needs no buttons inside the options. While recording it says what
 * to do, and why a combo was refused.
 */
function ShortcutBar({
  navGroups,
  shortcuts,
  labels,
  recording,
  rejected,
  onRecordingChange,
}: {
  navGroups: NavCommandGroup[];
  shortcuts: AppShellShortcuts;
  labels: Required<AppShellLabels>;
  recording: Recording | null;
  rejected: string | null;
  onRecordingChange: (recording: Recording | null) => void;
}) {
  const selected = useCommandState((state) => state.value);
  const labelId = React.useId();
  const targets = React.useMemo(() => {
    const map = new Map<string, Recording>();
    for (const { group, entries } of navGroups) {
      for (const entry of entries) {
        map.set(entryValue(group, entry), {
          key: entryShortcutKey(entry),
          display: entryDisplay(entry),
        });
      }
    }
    return map;
  }, [navGroups]);
  const target = recording ?? targets.get(selected);
  if (!target) return null;
  const current = shortcuts.value[target.key];

  return (
    <div
      data-slot="app-shell-shortcut-bar"
      className="flex flex-wrap items-center gap-2 border-t px-3 py-2 text-xs"
      // cmdk handles Enter and the arrows on the whole menu; here they belong
      // to the bar's buttons. Escape still closes the dialog (Radix listens
      // on the document).
      onKeyDown={(event) => event.stopPropagation()}
    >
      <span
        id={labelId}
        className="text-muted-foreground min-w-0 flex-1 truncate"
      >
        {target.display}
      </span>
      {recording ? (
        <span role="status" className="text-foreground">
          {labels.pressShortcut}
        </span>
      ) : current ? (
        <ShortcutKeys shortcut={current} />
      ) : null}
      {recording && rejected ? (
        <span role="alert" className="text-destructive flex items-center gap-1">
          {labels.shortcutReserved}
          <ShortcutKeys shortcut={rejected} />
        </span>
      ) : null}
      {!recording && current ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-describedby={labelId}
          onClick={() => {
            const next = { ...shortcuts.value };
            delete next[target.key];
            shortcuts.onChange(next);
          }}
        >
          <XIcon aria-hidden="true" />
          {labels.removeShortcut}
        </Button>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-describedby={labelId}
        aria-pressed={recording !== null}
        className="aria-pressed:bg-accent aria-pressed:text-accent-foreground"
        onClick={() => onRecordingChange(recording ? null : target)}
      >
        <KeyboardIcon aria-hidden="true" />
        {labels.assignShortcut}
      </Button>
    </div>
  );
}

function AppShellCommandMenu({
  open,
  onOpenChange,
  navGroups,
  commands,
  labels,
  run,
  shortcuts,
  recording,
  rejected,
  onRecordingChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  navGroups: NavCommandGroup[];
  commands: readonly AppShellCommand[];
  labels: Required<AppShellLabels>;
  run: (entry: NavCommandEntry) => void;
  shortcuts?: AppShellShortcuts;
  recording: Recording | null;
  rejected: string | null;
  onRecordingChange: (recording: Recording | null) => void;
}) {
  const commandGroups = React.useMemo(
    () => groupCommands(commands),
    [commands]
  );
  const choose = (action: () => void) => {
    onOpenChange(false);
    action();
  };

  // cmdk filters on `value` and selects by it, so each value carries its group
  // label and its folders: searching a group or folder name lists its
  // entries, and an item label that repeats in two places stays two distinct
  // entries.
  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={labels.commandTitle}
      description={labels.commandPlaceholder}
      inputLabel={labels.commandPlaceholder}
      closeLabel={labels.close}
    >
      <CommandInput placeholder={labels.commandPlaceholder} />
      <CommandList label={labels.commandTitle}>
        <CommandEmpty>{labels.commandEmpty}</CommandEmpty>
        {navGroups.map(({ group, entries }) => (
          <CommandGroup key={`nav-${group.id}`} heading={group.label}>
            {entries.map((entry) => {
              const shortcut = shortcuts?.value[entryShortcutKey(entry)];
              return (
                <CommandItem
                  key={entry.key}
                  value={entryValue(group, entry)}
                  keywords={entry.keywords}
                  aria-keyshortcuts={
                    shortcut ? ariaKeyShortcut(shortcut) : undefined
                  }
                  onSelect={() => choose(() => run(entry))}
                >
                  <ItemIcon icon={entry.icon} />
                  <span className="truncate">
                    {entry.path.length > 0 ? (
                      <span className="text-muted-foreground">
                        {`${entry.path.join(" / ")} / `}
                      </span>
                    ) : null}
                    {entry.label}
                  </span>
                  {hasContent(entry.badge) ? (
                    <span className="ml-auto">{entry.badge}</span>
                  ) : null}
                  {shortcut ? (
                    <ShortcutKeys
                      shortcut={shortcut}
                      className={hasContent(entry.badge) ? "ml-2" : "ml-auto"}
                    />
                  ) : null}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
        {commandGroups.map((group) => (
          <CommandGroup
            key={`command-${group.heading}`}
            heading={group.heading}
          >
            {group.items.map((command) => (
              <CommandItem
                key={command.id}
                value={`${command.group} ${command.label}`}
                keywords={command.keywords}
                onSelect={() => choose(command.onSelect)}
              >
                <ItemIcon icon={command.icon} />
                <span className="truncate">{command.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
      {shortcuts ? (
        <ShortcutBar
          navGroups={navGroups}
          shortcuts={shortcuts}
          labels={labels}
          recording={recording}
          rejected={rejected}
          onRecordingChange={onRecordingChange}
        />
      ) : null}
    </CommandDialog>
  );
}

/**
 * Records a shortcut while `recording` is set: every key press is taken
 * before anything else sees it (the search box, cmdk, the dialog's Escape).
 * Escape cancels; a reserved combo is refused; any other combo with Ctrl,
 * Alt or ⌘ is assigned, taken from any entry that had it.
 */
function useShortcutRecorder(
  shortcuts: AppShellShortcuts | undefined,
  recording: Recording | null,
  setRecording: (recording: Recording | null) => void,
  setRejected: (combo: string | null) => void
) {
  React.useEffect(() => {
    if (!shortcuts || !recording) return;
    const onKeyDown = (event: KeyboardEvent) => {
      // Plain Tab still moves focus.
      if (
        event.key === "Tab" &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey
      ) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.key === "Escape") {
        setRecording(null);
        setRejected(null);
        return;
      }
      const combo = shortcutFromEvent(event);
      if (!combo) return;
      if (isReservedShortcut(combo, shortcuts.reserved)) {
        setRejected(combo);
        return;
      }
      const next: Record<string, string> = {};
      for (const [key, value] of Object.entries(shortcuts.value)) {
        if (key !== recording.key && normalizeShortcut(value) !== combo) {
          next[key] = value;
        }
      }
      next[recording.key] = combo;
      shortcuts.onChange(next);
      setRecording(null);
      setRejected(null);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [shortcuts, recording, setRecording, setRejected]);
}

/**
 * Fires the entry a pressed shortcut is assigned to, from anywhere, except
 * while recording. A press a page already handled (`defaultPrevented`), an
 * auto-repeat of a held combo, a reserved combo and a key for an entry not in
 * the nav are left alone.
 */
function useShortcutFiring(
  shortcuts: AppShellShortcuts | undefined,
  recording: Recording | null,
  navGroups: NavCommandGroup[],
  fire: (entry: NavCommandEntry) => void
) {
  const targets = React.useMemo(() => {
    const map = new Map<string, NavCommandEntry>();
    for (const { entries } of navGroups) {
      for (const entry of entries) {
        const key = entryShortcutKey(entry);
        if (!map.has(key)) map.set(key, entry);
      }
    }
    return map;
  }, [navGroups]);

  React.useEffect(() => {
    if (!shortcuts || recording) return;
    const onKeyDown = (event: KeyboardEvent) => {
      // A held combo auto-repeats; it fires once.
      if (event.defaultPrevented || event.repeat) return;
      const combo = shortcutFromEvent(event);
      if (!combo || isReservedShortcut(combo, shortcuts.reserved)) return;
      for (const [key, value] of Object.entries(shortcuts.value)) {
        if (normalizeShortcut(value) !== combo) continue;
        const entry = targets.get(key);
        if (!entry) continue;
        event.preventDefault();
        fire(entry);
        return;
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [shortcuts, recording, targets, fire]);
}

const NO_COMMANDS: readonly AppShellCommand[] = [];

/**
 * The application frame: a sidebar of grouped links that collapses to an
 * icon rail (an off-canvas sheet on mobile), a header with the breadcrumb and
 * a search button, and a ⌘K / Ctrl+K command menu over the same links plus
 * `commands`. Every text arrives through `labels`.
 */
export function AppShell({
  nav,
  brand,
  userMenu,
  breadcrumbs,
  pageTitle,
  headerContent,
  headerActions,
  commands,
  defaultOpen,
  onOpenChange,
  isActive,
  onNavigate,
  openFolders,
  onOpenFoldersChange,
  navFilter = false,
  shortcuts,
  navPrefetch = "viewport",
  labels,
  className,
  classNames,
  children,
}: AppShellProps): React.JSX.Element {
  const text = resolveLabels(labels);
  const [commandOpen, setCommandOpen] = React.useState(false);
  const groups = React.useMemo(() => pruneNav(nav), [nav]);
  // Kept here, not in the nav, so the mobile sheet's folders survive the
  // sheet closing.
  const folders = useOpenFolders(
    groups,
    isActive,
    openFolders,
    onOpenFoldersChange
  );
  const push = useAppShellNavigate();
  const navigate = onNavigate ?? push;
  const navGroups = React.useMemo(
    () => groups.map((group) => ({ group, entries: navCommandEntries(group) })),
    [groups]
  );
  const run = React.useCallback(
    (entry: NavCommandEntry) => {
      if (entry.href !== undefined) navigate(entry.href);
      else entry.onSelect?.();
    },
    [navigate]
  );
  const [recording, setRecording] = React.useState<Recording | null>(null);
  const [rejected, setRejected] = React.useState<string | null>(null);
  useShortcutRecorder(shortcuts, recording, setRecording, setRejected);
  const fire = React.useCallback(
    (entry: NavCommandEntry) => {
      setCommandOpen(false);
      run(entry);
    },
    [run]
  );
  useShortcutFiring(shortcuts, recording, navGroups, fire);
  const handleCommandOpenChange = React.useCallback((open: boolean) => {
    setCommandOpen(open);
    if (!open) {
      setRecording(null);
      setRejected(null);
    }
  }, []);

  // ⌘K / Ctrl+K opens the menu from anywhere, text fields included.
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // `key` is missing on the keydown some browsers fire for autofill.
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key?.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleOpenChange = React.useMemo(
    () =>
      onOpenChange
        ? (openNames: string[]) =>
            onOpenChange(openNames.includes(SIDEBAR_NAME))
        : undefined,
    [onOpenChange]
  );

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      onOpenChange={handleOpenChange}
      className={className}
    >
      <Sidebar
        name={SIDEBAR_NAME}
        collapsible="icon"
        mobileTitle={text.mobileTitle}
        mobileDescription={text.navigation}
        className={classNames?.sidebar}
      >
        <SidebarHeader className="min-h-16 justify-center border-b">
          {brand}
        </SidebarHeader>
        <SidebarContent>
          <AppShellNav
            groups={groups}
            isActive={isActive}
            labels={text}
            folders={folders}
            navFilter={navFilter}
            shortcuts={shortcuts}
            prefetch={navPrefetch}
          />
        </SidebarContent>
        <SidebarFooter>{userMenu}</SidebarFooter>
        <SidebarRail name={SIDEBAR_NAME} label={text.toggleSidebar} />
      </Sidebar>
      <div data-slot="app-shell-frame" className="flex min-w-0 flex-1 flex-col">
        <header
          data-slot="app-shell-header"
          className={cn(
            "bg-background sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4",
            classNames?.header
          )}
        >
          <SidebarTrigger
            name={SIDEBAR_NAME}
            label={text.toggleSidebar}
            className="-ml-1"
          />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <AppShellBreadcrumbs crumbs={breadcrumbs} label={text.breadcrumb} />
          ) : null}
          {pageTitle ? <h1 className="sr-only">{pageTitle}</h1> : null}
          {headerContent ? (
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {headerContent}
            </div>
          ) : null}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {headerActions}
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-haspopup="dialog"
              aria-keyshortcuts="Meta+K Control+K"
              className="text-muted-foreground"
              onClick={() => setCommandOpen(true)}
            >
              <SearchIcon aria-hidden="true" className="size-4" />
              <span className="sr-only sm:not-sr-only">{text.search}</span>
              <Kbd aria-hidden="true" className="hidden sm:inline-flex">
                ⌘K
              </Kbd>
            </Button>
          </div>
        </header>
        <SidebarInset className={classNames?.main}>{children}</SidebarInset>
      </div>
      <AppShellCommandMenu
        open={commandOpen}
        onOpenChange={handleCommandOpenChange}
        navGroups={navGroups}
        commands={commands ?? NO_COMMANDS}
        labels={text}
        run={run}
        shortcuts={shortcuts}
        recording={recording}
        rejected={rejected}
        onRecordingChange={(next) => {
          setRecording(next);
          setRejected(null);
        }}
      />
    </SidebarProvider>
  );
}

export { matchActiveHref } from "./match-active-href";
export { filterNav, foldersAbove } from "./nav-tree";
export {
  formatShortcut,
  isReservedShortcut,
  normalizeShortcut,
  RESERVED_SHORTCUTS,
  shortcutFromEvent,
} from "./shortcuts";
export { useAppShellNavigate } from "./use-app-shell-navigate";
export {
  DEFAULT_SHORTCUTS_STORAGE_KEY,
  useStoredShortcuts,
} from "./use-stored-shortcuts";
export type {
  AppShellBreadcrumb,
  AppShellCommand,
  AppShellLabels,
  AppShellNavAction,
  AppShellNavGroup,
  AppShellNavItem,
  AppShellProps,
  AppShellShortcuts,
} from "./types";
