"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchIcon } from "lucide-react";
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
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@ayasofyazilim-clomerce/ui/components/command";
import { Kbd } from "@ayasofyazilim-clomerce/ui/components/kbd";
import { Separator } from "@ayasofyazilim-clomerce/ui/components/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@ayasofyazilim-clomerce/ui/components/sidebar";
import { matchActiveHref } from "./match-active-href";
import type {
  AppShellBreadcrumb,
  AppShellCommand,
  AppShellLabels,
  AppShellNavGroup,
  AppShellProps,
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

function AppShellNav({
  groups,
  isActive,
  label,
}: {
  groups: AppShellNavGroup[];
  isActive?: (href: string, pathname: string) => boolean;
  label: string;
}) {
  const pathname = usePathname();
  const idPrefix = React.useId();
  const { isMobile, setOpenMobile } = useSidebar(SIDEBAR_NAME);
  const activeHref = isActive
    ? null
    : matchActiveHref(
        groups.flatMap((group) => group.items.map((item) => item.href)),
        pathname
      );

  return (
    <nav aria-label={label} className="flex flex-col gap-2">
      {groups.map((group, groupIndex) => {
        const labelId = `${idPrefix}-group-${groupIndex}`;
        return (
          <SidebarGroup key={group.id}>
            <SidebarGroupLabel id={labelId}>{group.label}</SidebarGroupLabel>
            <SidebarMenu aria-labelledby={labelId}>
              {group.items.map((item) => {
                const active = isActive
                  ? isActive(item.href, pathname)
                  : item.href === activeHref;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      name={SIDEBAR_NAME}
                      asChild
                      isActive={active}
                      tooltip={item.label}
                    >
                      <Link
                        {...item.dataAttributes}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => {
                          if (isMobile) setOpenMobile(false);
                        }}
                      >
                        <ItemIcon icon={item.icon} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {hasContent(item.badge) ? (
                      <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        );
      })}
    </nav>
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

function AppShellCommandMenu({
  open,
  onOpenChange,
  groups,
  commands,
  labels,
  onNavigate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: AppShellNavGroup[];
  commands: readonly AppShellCommand[];
  labels: Required<AppShellLabels>;
  onNavigate?: (href: string) => void;
}) {
  const push = useAppShellNavigate();
  const navigate = onNavigate ?? push;
  const commandGroups = React.useMemo(
    () => groupCommands(commands),
    [commands]
  );
  const choose = (action: () => void) => {
    onOpenChange(false);
    action();
  };

  // cmdk filters on `value` and selects by it, so each value carries its group
  // label: searching a group name lists its entries, and an item label that
  // repeats in two groups stays two distinct entries.
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
        {groups.map((group) => (
          <CommandGroup key={`nav-${group.id}`} heading={group.label}>
            {group.items.map((item) => (
              <CommandItem
                key={item.id}
                value={`${group.label} ${item.label}`}
                onSelect={() => choose(() => navigate(item.href))}
              >
                <ItemIcon icon={item.icon} />
                <span className="truncate">{item.label}</span>
                {hasContent(item.badge) ? (
                  <span className="ml-auto">{item.badge}</span>
                ) : null}
              </CommandItem>
            ))}
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
    </CommandDialog>
  );
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
  labels,
  className,
  classNames,
  children,
}: AppShellProps): React.JSX.Element {
  const text = resolveLabels(labels);
  const [commandOpen, setCommandOpen] = React.useState(false);
  const groups = React.useMemo(
    () => nav.filter((group) => group.items.length > 0),
    [nav]
  );

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
            label={text.navigation}
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
        onOpenChange={setCommandOpen}
        groups={groups}
        commands={commands ?? NO_COMMANDS}
        labels={text}
        onNavigate={onNavigate}
      />
    </SidebarProvider>
  );
}

export { matchActiveHref } from "./match-active-href";
export { useAppShellNavigate } from "./use-app-shell-navigate";
export type {
  AppShellBreadcrumb,
  AppShellCommand,
  AppShellLabels,
  AppShellNavGroup,
  AppShellNavItem,
  AppShellProps,
} from "./types";
