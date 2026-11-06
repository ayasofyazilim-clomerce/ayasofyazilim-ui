"use client";
"use no memo";
import { ButtonGroup } from "@repo/ayasofyazilim-ui/components/button-group";
import type { Table } from "@tanstack/react-table";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Button } from "../../../../components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/select";
import {
  GridUrlState,
  Localization,
  MasterDataGridResources,
} from "../../types";
import { useGridNavigation } from "../../hooks/use-grid-navigation";
import { getTranslations } from "../../utils/translation-utils";
import {
  isPrefixUrlState,
  scopedKey,
  urlPrefixOf,
} from "../../utils/url-scope";
import { RowCountSummary } from "../row-count-summary";

interface PaginationProps<TData> {
  table: Table<TData>;
  pageSizeOptions?: number[];
  t?: MasterDataGridResources;
  localization?: Localization;
  unfilteredRowCount?: number;
  navigate?: (url: string, options?: { replace?: boolean }) => void;
  pending?: boolean;
  /** The grid's urlState. Absent: today's un-prefixed URL sync. */
  urlState?: GridUrlState;
  /** Prefix mode only: the grid's pageSize, which the URL leaves out. */
  defaultPageSize?: number;
}

export function Pagination<TData>({
  table,
  pageSizeOptions = [10, 20, 30, 40, 50],
  t,
  localization,
  unfilteredRowCount,
  navigate: navigateProp,
  pending,
  urlState,
  defaultPageSize = 10,
}: PaginationProps<TData>) {
  const { navigate: ownNavigate } = useGridNavigation();
  const navigate = navigateProp ?? ownNavigate;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pagination = table.getState().pagination;

  const allPageSizeOptions = pageSizeOptions.includes(pagination.pageSize)
    ? pageSizeOptions
    : [...pageSizeOptions, pagination.pageSize].sort((a, b) => a - b);

  // "none" keeps the page in table state only (onPaginationChange reports it).
  const syncsUrl = urlState !== "none";
  const prefix = urlPrefixOf(urlState);
  // Default mode keeps today's fixed 10. Prefix mode leaves the grid's own
  // pageSize out, matching what getGridUrlParams and the first render assume.
  const omittedPageSize = isPrefixUrlState(urlState) ? defaultPageSize : 10;

  useEffect(() => {
    if (!syncsUrl) return;
    const skipKey = scopedKey("skipCount", prefix);
    const maxKey = scopedKey("maxResultCount", prefix);

    const params = new URLSearchParams(searchParams.toString());
    const skipCount = pagination.pageIndex * pagination.pageSize;
    const maxResultCount = pagination.pageSize;

    const currentSkipCount = Number(searchParams?.get(skipKey)) || 0;
    const currentMaxResultCount =
      Number(searchParams?.get(maxKey)) || omittedPageSize;

    const needsUpdate =
      currentSkipCount !== skipCount ||
      currentMaxResultCount !== maxResultCount;

    if (!needsUpdate) return;

    if (currentMaxResultCount !== maxResultCount) {
      params.set(maxKey, maxResultCount.toString());
    }
    if (currentSkipCount !== skipCount) {
      params.set(skipKey, skipCount.toString());
    }

    if (maxResultCount === omittedPageSize) {
      params.delete(maxKey);
    }
    if (skipCount === 0) {
      params.delete(skipKey);
    }

    navigate(`${pathname}?${params.toString()}`, { replace: true });
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    pathname,
    searchParams,
    navigate,
    syncsUrl,
    prefix,
    omittedPageSize,
  ]);

  return (
    <div className="flex items-center flex-wrap gap-4">
      {(table.getIsAllPageRowsSelected() || table.getIsSomeRowsSelected()) && (
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
            <SelectTrigger size="sm" className="w-18">
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

        <div className="flex items-center justify-center text-sm font-medium mr-auto gap-2">
          {getTranslations("pagination.page", t)}{" "}
          {table.getPageCount() === 0 ? 0 : pagination.pageIndex + 1}{" "}
        {getTranslations("pagination.of", t)} {table.getPageCount()}
        <RowCountSummary
        table={table}
        t={t}
        localization={localization}
        unfilteredRowCount={unfilteredRowCount}
        pending={pending}
      />
        </div>
        
        <ButtonGroup>
          <Button
            variant="outline"
            size="icon-sm"
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
            size="icon-sm"
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
            size="icon-sm"
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
            size="icon-sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            title={getTranslations("pagination.lastPage", t)}
          >
            <span className="sr-only">
              {getTranslations("pagination.lastPage", t)}
            </span>
            <ChevronsRightIcon className="h-4 w-4" />
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
}
