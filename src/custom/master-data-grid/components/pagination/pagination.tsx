"use client";
import type { Table } from "@tanstack/react-table";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Button } from "../../../../components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/select";
import { getTranslations } from "../../utils/translation-utils";
import { MasterDataGridResources } from "../../types";

interface PaginationProps<TData> {
  table: Table<TData>;
  pageSizeOptions?: number[];
  syncWithUrl?: boolean;
  t?: MasterDataGridResources;
}

/**
 * Pagination component for MasterDataGrid
 * Features:
 * - Page navigation (first, previous, next, last)
 * - Page size selector
 * - URL synchronization (skipCount/maxResultCount)
 * - Row selection display (automatically shown when rows are selected)
 */
export function Pagination<TData>({
  table,
  pageSizeOptions = [10, 20, 30, 40, 50],
  syncWithUrl = false,
  t,
}: PaginationProps<TData>) {
  const { replace } = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pagination = table.getState().pagination;

  // Ensure current pageSize is in options
  const allPageSizeOptions = pageSizeOptions.includes(pagination.pageSize)
    ? pageSizeOptions
    : [...pageSizeOptions, pagination.pageSize].sort((a, b) => a - b);

  // Sync pagination state with URL params
  // Only update URL when table pagination state changes, not when URL changes
  useEffect(() => {
    if (!syncWithUrl) return;

    const params = new URLSearchParams(searchParams.toString());
    const skipCount = pagination.pageIndex * pagination.pageSize;
    const maxResultCount = pagination.pageSize;

    const currentSkipCount = Number(searchParams?.get("skipCount")) || 0;
    const currentMaxResultCount =
      Number(searchParams?.get("maxResultCount")) || 10;

    // Only update URL if values actually changed
    const needsUpdate =
      currentSkipCount !== skipCount ||
      currentMaxResultCount !== maxResultCount;

    if (!needsUpdate) return;

    // Update URL params
    if (currentMaxResultCount !== maxResultCount) {
      params.set("maxResultCount", maxResultCount.toString());
    }
    if (currentSkipCount !== skipCount) {
      params.set("skipCount", skipCount.toString());
    }

    // Remove default values to keep URL clean
    if (maxResultCount === 10) {
      params.delete("maxResultCount");
    }
    if (skipCount === 0) {
      params.delete("skipCount");
    }

    replace(`${pathname}?${params.toString()}`);
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    syncWithUrl,
    pathname,
    searchParams,
    replace,
  ]);

  return (
    <div className="flex items-center flex-wrap gap-4">
      {/* Row Selection Display */}
      {table.getIsSomeRowsSelected() && (
        <div className="text-sm text-muted-foreground text-nowrap">
          {table.getFilteredSelectedRowModel().rows.length}{" "}
          {getTranslations("pagination.of", t)}{" "}
          {table.getFilteredRowModel().rows.length}{" "}
          {getTranslations("pagination.rowsSelected", t)}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto ml-auto">
        {/* Page Size Selector */}
        <div className="flex items-center w-full justify-between gap-2 sm:w-auto md:mr-4">
          <p className="text-sm font-medium">
            {getTranslations("pagination.rowsPerPage", t)}
          </p>
          <Select
            value={`${pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {allPageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page Display */}
        <div className="flex items-center justify-center text-sm font-medium mr-auto">
          {getTranslations("pagination.page", t)} {pagination.pageIndex + 1}{" "}
          {getTranslations("pagination.of", t)} {table.getPageCount()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-x-2">
          {/* First Page */}
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            title={getTranslations("pagination.firstPage", t)}
          >
            <span className="sr-only">
              {getTranslations("pagination.firstPage", t)}
            </span>
            <ChevronsLeftIcon className="h-4 w-4" />
          </Button>

          {/* Previous Page */}
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            title={getTranslations("pagination.previousPage", t)}
          >
            <span className="sr-only">
              {getTranslations("pagination.previousPage", t)}
            </span>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>

          {/* Next Page */}
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            title={getTranslations("pagination.nextPage", t)}
          >
            <span className="sr-only">
              {getTranslations("pagination.nextPage", t)}
            </span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>

          {/* Last Page */}
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            title={getTranslations("pagination.lastPage", t)}
          >
            <span className="sr-only">
              {getTranslations("pagination.lastPage", t)}
            </span>
            <ChevronsRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
