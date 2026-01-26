import type { Table as TanStackTable } from "@tanstack/react-table";
import {
  Columns3,
  Download,
  Filter,
  Menu,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "../../../../components/button";
import { ButtonGroup } from "../../../../components/button-group";
import { Input } from "../../../../components/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../../../../components/drawer";
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
            <Filter className="mr-2 h-4 w-4" />
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
          <Columns3 className="mr-2 h-4 w-4" />
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
          <Download className="mr-2 h-4 w-4" />
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
          <RefreshCw className="mr-2 h-4 w-4" />
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
          <RotateCcw className="mr-2 h-4 w-4" />
          <span>{getTranslations("toolbar.reset", t)}</span>
        </Button>
      )}
    </>
  );

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

      return (
        <Button
          key={action.id}
          variant={action.variant}
          disabled={disabled}
          onClick={() => {
            action.onClick?.(selectedRows);
            if (isMobile) setMobileMenuOpen(false);
          }}
          className={isMobile ? "w-full justify-start" : action.className}
        >
          {Icon && <Icon className="mr-2 h-4 w-4" />}
          {action.label}
        </Button>
      );
    });
  return (
    <div className="flex items-center gap-2 w-full">
      <Input
        placeholder={getTranslations("toolbar.search", t)}
        value={searchValue}
        onChange={(event) => handleSearchChange(event.target.value)}
        className="md:max-w-sm"
      />
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
