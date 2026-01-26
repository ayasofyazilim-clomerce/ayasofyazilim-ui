"use client";
"use no memo";
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
  t?: MasterDataGridResources;
}

export function Pagination<TData>({
  table,
  pageSizeOptions = [10, 20, 30, 40, 50],
  t,
}: PaginationProps<TData>) {
  const { replace } = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pagination = table.getState().pagination;

  const allPageSizeOptions = pageSizeOptions.includes(pagination.pageSize)
    ? pageSizeOptions
    : [...pageSizeOptions, pagination.pageSize].sort((a, b) => a - b);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const skipCount = pagination.pageIndex * pagination.pageSize;
    const maxResultCount = pagination.pageSize;

    const currentSkipCount = Number(searchParams?.get("skipCount")) || 0;
    const currentMaxResultCount =
      Number(searchParams?.get("maxResultCount")) || 10;

    const needsUpdate =
      currentSkipCount !== skipCount ||
      currentMaxResultCount !== maxResultCount;

    if (!needsUpdate) return;

    if (currentMaxResultCount !== maxResultCount) {
      params.set("maxResultCount", maxResultCount.toString());
    }
    if (currentSkipCount !== skipCount) {
      params.set("skipCount", skipCount.toString());
    }

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
    pathname,
    searchParams,
    replace,
  ]);

  return (
    <div className="flex items-center flex-wrap gap-4">
      {table.getIsSomeRowsSelected() && (
        <div className="text-sm text-muted-foreground text-nowrap">
          {table.getFilteredSelectedRowModel().rows.length}{" "}
          {getTranslations("pagination.of", t)}{" "}
          {table.getFilteredRowModel().rows.length}{" "}
          {getTranslations("pagination.rowsSelected", t)}
        </div>
      )}

      <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto ml-auto">
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

        <div className="flex items-center justify-center text-sm font-medium mr-auto">
          {getTranslations("pagination.page", t)}{" "}
          {table.getPageCount() === 0 ? 0 : pagination.pageIndex + 1}{" "}
          {getTranslations("pagination.of", t)} {table.getPageCount()}
        </div>

        <div className="flex items-center gap-x-2">
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
