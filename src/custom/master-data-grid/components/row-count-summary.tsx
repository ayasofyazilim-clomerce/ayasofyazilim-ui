"use client";
"use no memo";

import type { Table } from "@tanstack/react-table";
import { cn } from "../../../lib/utils";
import type { Localization, MasterDataGridResources } from "../types";
import { Badge } from "@repo/ayasofyazilim-ui/components/badge";

interface RowCountSummaryProps<TData> {
  table: Table<TData>;
  t?: MasterDataGridResources;
  localization?: Localization;
  unfilteredRowCount?: number;
  className?: string;
}

export function RowCountSummary<TData>({
  table,
  t,
  localization,
  unfilteredRowCount,
  className,
}: RowCountSummaryProps<TData>) {
  // Resolves to config.rowCount for server-paged grids and to the filtered row
  // count for client-paged ones, which is the total we want in both cases.
  const total = table.getRowCount();

  // A server-paged grid only holds one page, so counting loaded rows says
  // nothing about the unfiltered total - only the API can supply it there.
  const unfiltered =
    unfilteredRowCount ??
    (table.options.manualPagination
      ? undefined
      : table.getCoreRowModel().rows.length);

  // An explicit locale keeps server and client renders identical. localization
  // .locale is empty until the tenant loads, and "" throws in Intl.
  const locale =
    localization?.locale || (localization?.lang === "tr" ? "tr-TR" : "en-US");
  const format = (value: number) =>
    new Intl.NumberFormat(locale).format(value);

  // "of" is defined in the resources, so the literal only shows up on a grid
  // rendered without them, where every other string is a raw key anyway.
  const count =
    unfiltered != null && unfiltered !== total
      ? `${format(total)} ${t?.["pagination.of"] ?? "of"} ${format(unfiltered)}`
      : format(total);

  // Left unlabelled until the resources define a label, so a missing key shows
  // a bare count rather than an untranslated one.
  const label = t?.["pagination.totalItems"];

  return (
    <Badge
      variant="outline"
      className={cn("rounded-md text-nowrap", className)}
      data-testid="row-count-summary"
    >
      {label ? `${label}: ${count}` : count}
    </Badge>
  );
}
