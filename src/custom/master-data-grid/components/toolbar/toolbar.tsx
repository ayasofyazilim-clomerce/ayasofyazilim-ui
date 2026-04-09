import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import type { Table as TanStackTable } from "@tanstack/react-table";
import {
  Columns3,
  Download,
  Filter,
  Menu,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, buttonVariants } from "../../../../components/button";
import { ButtonGroup } from "../../../../components/button-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../../components/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../../../../components/drawer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../../../components/sheet";
import { Input } from "../../../../components/input";
import type { MasterDataGridConfig, ServerFilterConfig } from "../../types";
import { getTranslations } from "../../utils/translation-utils";
import { MultiFilterDialog } from "../filters";

interface ToolbarProps<TData> {
  table: TanStackTable<TData>;
  config: MasterDataGridConfig<TData>;
  selectedRows: TData[];
  serverFilters?: ServerFilterConfig[];
  onExport?: (format: string) => void;
  onRefresh?: () => void;
  onReset?: () => void;
  onOpenColumnSettings?: () => void;
}

export function Toolbar<TData>({
  table,
  config,
  selectedRows,
  onExport,
  onRefresh,
  onReset,
  onOpenColumnSettings,
}: ToolbarProps<TData>) {
  const { t, tableActions, enableExport } = config;

  const [searchValue, setSearchValue] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const initialStateRef = useRef<{
    globalFilter: string | undefined;
    columnFilters: any[];
    sorting: any[];
    columnVisibility: Record<string, boolean>;
    columnPinning: { left?: string[]; right?: string[] };
  } | null>(null);

  useEffect(() => {
    if (!initialStateRef.current) {
      const state = table.getState();
      initialStateRef.current = {
        globalFilter: state.globalFilter as string | undefined,
        columnFilters: [...state.columnFilters],
        sorting: [...state.sorting],
        columnVisibility: { ...state.columnVisibility },
        columnPinning: {
          left: state.columnPinning?.left ? [...state.columnPinning.left] : [],
          right: state.columnPinning?.right
            ? [...state.columnPinning.right]
            : [],
        },
      };
    }
  }, []);

  useEffect(() => {
    const currentFilter = table.getState().globalFilter as string;
    if (currentFilter !== searchValue) {
      setSearchValue(currentFilter ?? "");
    }
  }, [table.getState().globalFilter]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        table.setGlobalFilter(value);
      }, 300);
    },
    [table]
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const hasTableChanges = () => {
    if (!initialStateRef.current) return false;

    const state = table.getState();
    const initial = initialStateRef.current;

    const hasGlobalFilterChanged = state.globalFilter !== initial.globalFilter;

    const hasColumnFiltersChanged =
      state.columnFilters.length !== initial.columnFilters.length ||
      JSON.stringify(state.columnFilters) !==
        JSON.stringify(initial.columnFilters);

    const hasSortingChanged =
      state.sorting.length !== initial.sorting.length ||
      JSON.stringify(state.sorting) !== JSON.stringify(initial.sorting);

    const hasColumnVisibilityChanged =
      JSON.stringify(state.columnVisibility) !==
      JSON.stringify(initial.columnVisibility);

    const currentPinning = {
      left: state.columnPinning?.left || [],
      right: state.columnPinning?.right || [],
    };
    const initialPinning = {
      left: initial.columnPinning?.left || [],
      right: initial.columnPinning?.right || [],
    };
    const hasColumnPinningChanged =
      JSON.stringify(currentPinning) !== JSON.stringify(initialPinning);

    return (
      hasGlobalFilterChanged ||
      hasColumnFiltersChanged ||
      hasSortingChanged ||
      hasColumnVisibilityChanged ||
      hasColumnPinningChanged
    );
  };

  const renderTableButtons = (isMobile = false) => (
    <>
      {config.enableFiltering && (
        <MultiFilterDialog table={table} config={config}>
          <Button
            variant="outline"
            className={isMobile ? "w-full justify-start" : ""}
          >
            <Filter className="h-4 w-4" />
            <span>{getTranslations("toolbar.filters", t)}</span>
            {table.getState().columnFilters.length > 0 && (
              <span
                className={
                  (isMobile ? "ml-auto" : "ml-2") +
                  " rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground"
                }
              >
                {table.getState().columnFilters.length}
              </span>
            )}
          </Button>
        </MultiFilterDialog>
      )}
      {config.enableColumnVisibility && (
        <Button
          variant="outline"
          onClick={() => {
            onOpenColumnSettings?.();
            if (isMobile) setMobileMenuOpen(false);
          }}
          className={isMobile ? "w-full justify-start" : ""}
        >
          <Columns3 className="h-4 w-4" />
          <span>{getTranslations("toolbar.columns", t)}</span>
        </Button>
      )}
      {enableExport && onExport && (
        <Button
          variant="outline"
          onClick={() => {
            onExport("csv");
            if (isMobile) setMobileMenuOpen(false);
          }}
          className={isMobile ? "w-full justify-start" : ""}
        >
          <Download className="h-4 w-4" />
          <span>{getTranslations("toolbar.export", t)}</span>
        </Button>
      )}
      {onRefresh && (
        <Button
          variant="outline"
          onClick={() => {
            onRefresh();
            if (isMobile) setMobileMenuOpen(false);
          }}
          className={isMobile ? "w-full justify-start" : ""}
        >
          <RefreshCw className="h-4 w-4" />
          <span>{getTranslations("toolbar.refresh", t)}</span>
        </Button>
      )}
      {onReset && hasTableChanges() && (
        <Button
          variant="outline"
          onClick={() => {
            onReset();
            if (isMobile) setMobileMenuOpen(false);
          }}
          className={isMobile ? "w-full justify-start" : ""}
        >
          <RotateCcw className="h-4 w-4" />
          <span>{getTranslations("toolbar.reset", t)}</span>
        </Button>
      )}
    </>
  );

  const [dialogOpenStates, setDialogOpenStates] = useState<
    Record<string, boolean>
  >({});
  const [preventCloseStates, setPreventCloseStates] = useState<
    Record<string, boolean>
  >({});

  const renderTableActions = (isMobile = false) =>
    tableActions?.map((action) => {
      const disabled =
        typeof action.disabled === "function"
          ? action.disabled(selectedRows)
          : action.disabled;

      const hidden =
        typeof action.hidden === "function"
          ? action.hidden(selectedRows)
          : action.hidden;

      if (hidden) return null;

      if (action.requiresSelection && selectedRows.length === 0) {
        return null;
      }

      const Icon = action.icon;
      if (action.type === "link") {
        return (
          <Link
            key={action.id}
            href={action.href}
            className={cn(
              buttonVariants({ variant: action.variant || "outline" }),
              isMobile ? "w-full justify-start" : action.className
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {action.label}
          </Link>
        );
      }
      if (action.type === "dialog") {
        const isOpen = dialogOpenStates[action.id] ?? false;
        const isPreventClose =
          action.preventClose || (preventCloseStates[action.id] ?? false);

        const setOpen = (open: boolean) => {
          if (!open && isPreventClose) return;
          setDialogOpenStates((prev) => ({ ...prev, [action.id]: open }));
          if (!open) {
            setPreventCloseStates((prev) => ({
              ...prev,
              [action.id]: false,
            }));
          }
        };

        const setPreventClose = (prevent: boolean) => {
          setPreventCloseStates((prev) => ({
            ...prev,
            [action.id]: prevent,
          }));
        };

        const close = () => {
          setPreventCloseStates((prev) => ({ ...prev, [action.id]: false }));
          setDialogOpenStates((prev) => ({ ...prev, [action.id]: false }));
        };

        const triggerButton = (
          <Button
            variant={action.variant || "outline"}
            disabled={disabled}
            className={isMobile ? "w-full justify-start" : action.className}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {action.label}
          </Button>
        );

        const childrenContent = action.children({
          selectedRows,
          preventClose: isPreventClose,
          setPreventClose,
          close,
        });

        const interactionProps = {
          onPointerDownOutside: (e: Event) => {
            if (isPreventClose) e.preventDefault();
          },
          onEscapeKeyDown: (e: Event) => {
            if (isPreventClose) e.preventDefault();
          },
        };

        if (action.dialogType === "sheet") {
          return (
            <Sheet key={action.id} open={isOpen} onOpenChange={setOpen}>
              <SheetTrigger asChild>{triggerButton}</SheetTrigger>
              <SheetContent {...interactionProps}>
                {(action.title || action.description) && (
                  <SheetHeader className="pb-0">
                    {action.title && <SheetTitle>{action.title}</SheetTitle>}
                    {action.description && (
                      <SheetDescription>{action.description}</SheetDescription>
                    )}
                  </SheetHeader>
                )}
                <div className={cn("px-4", action.contentClassName)}>
                  {childrenContent}
                </div>
              </SheetContent>
            </Sheet>
          );
        }

        return (
          <Dialog key={action.id} open={isOpen} onOpenChange={setOpen}>
            <DialogTrigger asChild>{triggerButton}</DialogTrigger>
            <DialogContent
              className={action.contentClassName}
              showCloseButton={action.showCloseButton}
              {...interactionProps}
            >
              {(action.title || action.description) && (
                <DialogHeader>
                  {action.title && <DialogTitle>{action.title}</DialogTitle>}
                  {action.description && (
                    <DialogDescription>{action.description}</DialogDescription>
                  )}
                </DialogHeader>
              )}
              {childrenContent}
            </DialogContent>
          </Dialog>
        );
      }
      return (
        <Button
          key={action.id}
          variant={action.variant || "outline"}
          disabled={disabled}
          onClick={() => {
            action.onClick?.(selectedRows);
            if (isMobile) setMobileMenuOpen(false);
          }}
          className={isMobile ? "w-full justify-start" : action.className}
        >
          {Icon && <Icon className="h-4 w-4" />}
          {action.label}
        </Button>
      );
    });

  const hasAnyEnabledFeature =
    config.enableSearch ||
    config.enableFiltering ||
    config.enableColumnVisibility ||
    enableExport ||
    onRefresh ||
    (tableActions && tableActions.length > 0);

  if (!hasAnyEnabledFeature) {
    return null;
  }
  return (
    <div className="flex items-center gap-2 w-full">
      {config.enableSearch && (
        <Input
          placeholder={getTranslations("toolbar.search", t)}
          value={searchValue}
          onChange={(event) => handleSearchChange(event.target.value)}
          className="md:max-w-sm"
        />
      )}
      {selectedRows.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {selectedRows.length} {getTranslations("toolbar.selected", t)}
        </div>
      )}

      <ButtonGroup className="hidden ml-auto md:flex">
        {renderTableButtons(false)}
      </ButtonGroup>
      <ButtonGroup className="hidden md:has-first:flex">
        {renderTableActions(false)}
      </ButtonGroup>
      <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DrawerTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="p-2">
          <DrawerHeader>
            <DrawerTitle>{getTranslations("toolbar.actions", t)}</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-2 mt-4">
            {renderTableButtons(true)}
            {renderTableActions(true)}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
