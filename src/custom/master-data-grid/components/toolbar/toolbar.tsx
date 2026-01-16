import type { Table as TanStackTable } from "@tanstack/react-table";
import {
  Columns3,
  Download,
  Filter,
  Menu,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { useEffect, useState } from "react";
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
import type { MasterDataGridConfig } from "../../types";
import { getTranslations } from "../../utils/translation-utils";
import { MultiFilterDialog } from "../filters";

interface ToolbarProps<TData> {
  table: TanStackTable<TData>;
  config: MasterDataGridConfig<TData>;
  selectedRows: TData[];
  onExport?: (format: string) => void;
  onRefresh?: () => void;
  onReset?: () => void;
  onOpenColumnSettings?: () => void;
}

/**
 * Data grid toolbar with actions and global search
 */
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

  // Local state for search input to make it responsive
  const [searchValue, setSearchValue] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync with table state
  useEffect(() => {
    const currentFilter = table.getState().globalFilter as string;
    if (currentFilter !== searchValue) {
      setSearchValue(currentFilter ?? "");
    }
  }, [table.getState().globalFilter]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    table.setGlobalFilter(value);
  };

  const renderActionButtons = (isMobile = false) => (
    <>
      {config.enableFiltering && (
        <MultiFilterDialog table={table} t={config.t}>
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
      {tableActions?.map((action) => {
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
      })}
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
      {onReset && (
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

  return (
    <div className="flex items-center justify-between gap-2 w-full">
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

      {/* Desktop: Button Group */}
      <ButtonGroup className="hidden md:flex">
        {renderActionButtons(false)}
      </ButtonGroup>

      {/* Mobile: Drawer */}
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
            {renderActionButtons(true)}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
