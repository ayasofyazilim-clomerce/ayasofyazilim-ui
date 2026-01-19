import { ButtonGroup } from "@repo/ayasofyazilim-ui/components/button-group";
import type { Table } from "@tanstack/react-table";
import {
  ArrowUpDown,
  CalendarCheck,
  CalendarX,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleOff,
  Equal,
  List,
  ListX,
  X as NotEqual,
  SearchCode,
  SearchX,
  TextCursor,
  TextCursorInput,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../../../components/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../../../../components/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/select";
import type { ColumnFilter, ColumnMeta, FilterOperator } from "../../types";
import { getFilterOperators } from "../../utils/filter-fns";
import { getColumnName, getTranslations } from "../../utils/translation-utils";
import { FilterInput } from "./filter-input";

interface FilterRow {
  id: string;
  columnId: string;
  operator: FilterOperator;
  value: string;
  value2?: string;
}

interface MultiFilterDialogProps<TData> {
  table: Table<TData>;
  t?: Record<string, string>;
  children: React.ReactNode;
}

/**
 * Get icon for filter operator
 */
function getOperatorIcon(operator: FilterOperator) {
  const icons: Record<FilterOperator, React.ReactNode> = {
    equals: <Equal className="h-3.5 w-3.5 min-w-3.5" />,
    notEquals: <NotEqual className="h-3.5 w-3.5 min-w-3.5" />,
    contains: <SearchCode className="h-3.5 w-3.5 min-w-3.5" />,
    notContains: <SearchX className="h-3.5 w-3.5 min-w-3.5" />,
    startsWith: <TextCursorInput className="h-3.5 w-3.5 min-w-3.5" />,
    endsWith: <TextCursor className="h-3.5 w-3.5 min-w-3.5" />,
    isEmpty: <Circle className="h-3.5 w-3.5 min-w-3.5" />,
    isNotEmpty: <CircleOff className="h-3.5 w-3.5 min-w-3.5" />,
    greaterThan: <ChevronRight className="h-3.5 w-3.5 min-w-3.5" />,
    greaterThanOrEqual: <ChevronRight className="h-3.5 w-3.5 min-w-3.5" />,
    lessThan: <ChevronLeft className="h-3.5 w-3.5 min-w-3.5" />,
    lessThanOrEqual: <ChevronLeft className="h-3.5 w-3.5 min-w-3.5" />,
    between: <ArrowUpDown className="h-3.5 w-3.5 min-w-3.5" />,
    inRange: <ArrowUpDown className="h-3.5 w-3.5 min-w-3.5" />,
    before: <CalendarX className="h-3.5 w-3.5 min-w-3.5" />,
    after: <CalendarCheck className="h-3.5 w-3.5 min-w-3.5" />,
    inList: <List className="h-3.5 w-3.5 min-w-3.5" />,
    notInList: <ListX className="h-3.5 w-3.5 min-w-3.5" />,
  };
  return icons[operator] || <SearchCode className="h-3.5 w-3.5 min-w-3.5" />;
}

/**
 * Multi-column filter popover
 */
export function MultiFilterDialog<TData>({
  table,
  t,
  children,
}: MultiFilterDialogProps<TData>) {
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);

  // Detect screen size
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");
    setIsMobile(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Initialize filters from current table state
  const currentFilters = table.getState().columnFilters as ColumnFilter[];
  const [filterRows, setFilterRows] = useState<FilterRow[]>(() => {
    if (currentFilters.length > 0) {
      return currentFilters.map((filter, index) => ({
        id: `filter-${index}`,
        columnId: filter.id,
        operator: filter.operator,
        value: String(filter.value || ""),
        value2: String(filter.value2 || ""),
      }));
    }
    return [
      {
        id: "filter-0",
        columnId: "",
        operator: "contains",
        value: "",
        value2: "",
      },
    ];
  });

  // Get filterable columns
  const filterableColumns = table
    .getAllColumns()
    .filter((col) => col.getCanFilter());

  const addFilter = () => {
    const newId = `filter-${Date.now()}`;
    setFilterRows([
      ...filterRows,
      { id: newId, columnId: "", operator: "contains", value: "", value2: "" },
    ]);
  };

  const removeFilter = (id: string) => {
    if (filterRows.length === 1) {
      // Reset to empty instead of removing last one
      setFilterRows([
        {
          id: "filter-0",
          columnId: "",
          operator: "contains",
          value: "",
          value2: "",
        },
      ]);
    } else {
      setFilterRows(filterRows.filter((row) => row.id !== id));
    }
  };

  const updateFilter = (id: string, updates: Partial<FilterRow>) => {
    setFilterRows(
      filterRows.map((row) => (row.id === id ? { ...row, ...updates } : row))
    );
  };

  const getAvailableOperators = (columnId: string): FilterOperator[] => {
    if (!columnId) return ["contains"];
    const column = table.getColumn(columnId);
    if (!column) return ["contains"];

    const meta = column.columnDef.meta as ColumnMeta | undefined;
    const schemaProperty = meta?.schemaProperty;
    const filterOperators = meta?.filterOperators;

    return (
      filterOperators ||
      (schemaProperty
        ? getFilterOperators(schemaProperty.type, schemaProperty.format)
        : ["contains"])
    );
  };

  const getColumnType = (columnId: string): string | undefined => {
    if (!columnId) return undefined;
    const column = table.getColumn(columnId);
    if (!column) return undefined;
    const meta = column.columnDef.meta as ColumnMeta | undefined;
    return meta?.schemaProperty?.type;
  };

  const getColumnMeta = (columnId: string): ColumnMeta | undefined => {
    if (!columnId) return undefined;
    const column = table.getColumn(columnId);
    if (!column) return undefined;
    return column.columnDef.meta as ColumnMeta | undefined;
  };

  const handleColumnChange = (filterId: string, columnId: string) => {
    const operators = getAvailableOperators(columnId);
    updateFilter(filterId, { columnId, operator: operators[0] || "contains" });
  };

  const applyFilters = (closePopover?: () => void) => {
    // Clear all existing filters
    table.resetColumnFilters();

    // Apply new filters
    filterRows.forEach((row) => {
      const isRange = row.operator === "between" || row.operator === "inRange";
      const needsNoInput =
        row.operator === "isEmpty" || row.operator === "isNotEmpty";

      if (row.columnId) {
        const column = table.getColumn(row.columnId);
        if (column) {
          // For isEmpty/isNotEmpty, apply even without value
          if (needsNoInput) {
            const filter: ColumnFilter = {
              id: row.columnId,
              operator: row.operator,
              value: "",
            };
            column.setFilterValue(filter);
          }
          // For range operators, need both values
          else if (isRange && row.value && row.value2) {
            const filter: ColumnFilter = {
              id: row.columnId,
              operator: row.operator,
              value: row.value,
              value2: row.value2,
            };
            column.setFilterValue(filter);
          }
          // For single value operators
          else if (!isRange && row.value) {
            const filter: ColumnFilter = {
              id: row.columnId,
              operator: row.operator,
              value: row.value,
            };
            column.setFilterValue(filter);
          }
        }
      }
    });

    closePopover?.();
    setOpen(false);
  };

  const resetFilters = () => {
    table.resetColumnFilters();
    setFilterRows([
      {
        id: "filter-0",
        columnId: "",
        operator: "contains",
        value: "",
        value2: "",
      },
    ]);
    setOpen(false);
  };

  const filterContent = (
    <div className="space-y-4">
      <div className="font-semibold text-sm sm:hidden">
        {getTranslations("filter.title", t)}
      </div>

      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {filterRows.map((row, index) => {
          const availableOps = getAvailableOperators(row.columnId);
          const columnMeta = getColumnMeta(row.columnId);

          return (
            <ButtonGroup
              className="w-full min-w-0 flex-wrap sm:flex-nowrap"
              key={row.id}
            >
              {index === 0 ? (
                <div className="w-12 sm:w-16 rounded-l-md border flex items-center justify-center px-1 sm:px-2 text-xs font-medium text-muted-foreground shrink-0">
                  {getTranslations("filter.where", t)}
                </div>
              ) : (
                <div className="w-12 sm:w-16 rounded-l-md border flex items-center justify-center px-1 sm:px-2 text-xs font-medium text-muted-foreground shrink-0">
                  {getTranslations("filter.and", t)}
                </div>
              )}
              <Select
                value={row.columnId}
                onValueChange={(value) => handleColumnChange(row.id, value)}
              >
                <SelectTrigger className="w-32 sm:w-40 min-w-0">
                  <SelectValue
                    placeholder={getTranslations("filter.selectColumn", t)}
                  />
                </SelectTrigger>
                <SelectContent>
                  {filterableColumns.map((col) => (
                    <SelectItem key={col.id} value={col.id}>
                      {getColumnName(col, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={row.operator}
                onValueChange={(value) =>
                  updateFilter(row.id, { operator: value as FilterOperator })
                }
                disabled={!row.columnId}
              >
                <SelectTrigger className="w-16 sm:w-40 min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="sm:hidden">
                      {getOperatorIcon(row.operator)}
                    </span>
                    <span className="hidden sm:inline">
                      {getTranslations(`filter.operator.${row.operator}`, t)}
                    </span>
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {availableOps.map((op) => (
                    <SelectItem key={op} value={op}>
                      <span className="flex items-center gap-2">
                        {getOperatorIcon(op)}
                        <span>
                          {getTranslations(`filter.operator.${op}`, t)}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FilterInput
                operator={row.operator}
                value={row.value}
                value2={row.value2}
                columnMeta={columnMeta}
                onValueChange={(value) => updateFilter(row.id, { value })}
                onValue2Change={(value2) => updateFilter(row.id, { value2 })}
                onSliderChange={(values) => {
                  const [min, max] = values;
                  updateFilter(row.id, {
                    value: String(min),
                    value2: String(max),
                  });
                }}
                onClear={() => updateFilter(row.id, { value: "", value2: "" })}
                t={t}
                variant="popover"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => removeFilter(row.id)}
                className="shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </ButtonGroup>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-4 border-t">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={addFilter}
            variant="outline"
            size="sm"
            className="text-xs sm:text-sm"
          >
            {getTranslations("filter.addFilter", t)}
          </Button>
          <Button
            onClick={resetFilters}
            variant="outline"
            size="sm"
            className="text-xs sm:text-sm"
          >
            {getTranslations("filter.resetFilters", t)}
          </Button>
        </div>
        <Button
          onClick={() => applyFilters()}
          size="sm"
          className="text-xs sm:text-sm"
        >
          {getTranslations("filter.apply", t)}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{getTranslations("filter.title", t)}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 max-h-[70vh] overflow-y-auto">
            {filterContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-auto max-w-3xl" align="end">
        {filterContent}
      </PopoverContent>
    </Popover>
  );
}
