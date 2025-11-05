"use client";

import { Table } from "@tanstack/react-table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  TanstackTableFiltersType,
  TanstackTableSelectedRowActionType,
  TanstackTableTableActionsType,
} from "../types";
import { TanstackTableDateFilter } from "./tanstack-table-filter-date";
import { TanstackTableFacetedFilter } from "./tanstack-table-filter-faceted";
import { TanstackTableTextFilter } from "./tanstack-table-filter-text";
import { TanstackTableViewOptions } from "./tanstack-table-view-options";
import { Label } from "@repo/ayasofyazilim-ui/components/label";

interface TanstackTableToolbarProps<TData> {
  title?: string;
  editable?: boolean;
  filters?: TanstackTableFiltersType;
  selectedRowAction?: TanstackTableSelectedRowActionType<TData>;
  setTableAction: (actions: TanstackTableTableActionsType<TData>) => void;
  table: Table<TData>;
  tableActions?: TanstackTableTableActionsType<TData>[];
  tableData: TData[];
}

export const TanstackTableToolbar = <TData,>({
  title,
  table,
  filters,
  tableData,
  selectedRowAction,
  tableActions,
  setTableAction,
  editable,
}: TanstackTableToolbarProps<TData>) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const columnNames = table.getAllColumns().map((column) => column.id);
  function onFilter(accessorKey: string, selectedValues: string) {
    const newParams = new URLSearchParams(searchParams.toString());
    if (selectedValues) {
      newParams.set(accessorKey, selectedValues);
    } else {
      newParams.delete(accessorKey);
    }
    if (newParams.get(accessorKey) !== searchParams.get(accessorKey)) {
      router.replace(`${pathname}?${newParams.toString()}`);
    }
  }
  function onFilterMultiple(
    filter: { accessorKey: string; selectedValues: string }[]
  ) {
    const newParams = new URLSearchParams(searchParams.toString());
    filter.forEach(({ accessorKey, selectedValues }) => {
      if (selectedValues) {
        newParams.set(accessorKey, selectedValues);
      } else {
        newParams.delete(accessorKey);
      }
    });
    if (newParams.toString() !== searchParams.toString()) {
      router.replace(`${pathname}?${newParams.toString()}`);
    }
  }
  if (!editable && !tableActions && !title && !filters) return null;
  return (
    <div className="flex w-full items-center justify-between p-px">
      <div className="flex flex-1 h-full flex-wrap items-center gap-x-2">
        {title && (
          <Label className="mt-auto text-slate-600" asChild>
            <p>{title}</p>
          </Label>
        )}
        {filters?.textFilters &&
          filters.textFilters.map((accessorKey) => (
            <TanstackTableTextFilter
              title={filters?.filterTitles?.[accessorKey]}
              key={accessorKey}
              column={
                columnNames.includes(accessorKey)
                  ? table.getColumn(accessorKey)
                  : undefined
              }
              accessorKey={accessorKey}
              params={params}
              onFilter={(accessorKey, selectedValues) =>
                onFilter(accessorKey, selectedValues)
              }
            />
          ))}

        {filters?.dateFilters &&
          filters.dateFilters.map((dateItem) => (
            <TanstackTableDateFilter
              key={dateItem.label}
              accessorKey={dateItem.label}
              column={
                columnNames.includes(dateItem.label)
                  ? table.getColumn(dateItem.label)
                  : undefined
              }
              dateItem={dateItem}
              params={params}
              onFilter={(accessorKey, selectedValues) =>
                onFilter(accessorKey, selectedValues)
              }
              onFilterMultiple={(filter) => onFilterMultiple(filter)}
            />
          ))}

        {filters?.facetedFilters &&
          Object.keys(filters.facetedFilters)?.map((column) => (
            <TanstackTableFacetedFilter
              key={column}
              column={
                columnNames.includes(column)
                  ? table.getColumn(column)
                  : undefined
              }
              accessorKey={column}
              params={params}
              onFilter={(accessorKey, selectedValues) => {
                onFilter(accessorKey, selectedValues);
              }}
              title={filters?.facetedFilters?.[column]?.title ?? column}
              options={filters?.facetedFilters?.[column]?.options ?? []}
            />
          ))}
      </div>
      <TanstackTableViewOptions
        table={table}
        selectedRowAction={selectedRowAction}
        tableActions={tableActions}
        setTableAction={setTableAction}
        tableData={tableData}
        editable={editable}
      />
    </div>
  );
};
