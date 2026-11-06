import type { Table as TanStackTable } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { TableHead, TableHeader, TableRow } from "../../../../components/table";
import { cn } from "../../../../lib/utils";
import {
  getPinningHeaderClassNames,
  getPinningHeaderStyles,
} from "../../utils/pinning-utils";

export interface GridHeaderProps<TData> {
  table: TanStackTable<TData>;
  mode: "normal" | "virtual";
  headerClassName?: string;
}

/** The <thead> shared by normal and virtual mode. */
export function GridHeader<TData>({
  table,
  mode,
  headerClassName,
}: GridHeaderProps<TData>) {
  return (
    <TableHeader
      className={cn("sticky top-0 z-10 bg-background", headerClassName)}
    >
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <TableHead
              key={header.id}
              colSpan={header.colSpan}
              style={getPinningHeaderStyles(header)}
              className={cn(
                getPinningHeaderClassNames(header),
                "has-[button]:px-0 not-last:border-r",
                header.id === "select"
                  ? mode === "virtual"
                    ? "min-w-10"
                    : "min-w-10 max-w-10"
                  : ""
              )}
            >
              {header.id === "select" ? (
                <div className="flex items-center justify-center">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </div>
              ) : header.isPlaceholder ? null : (
                flexRender(header.column.columnDef.header, header.getContext())
              )}
            </TableHead>
          ))}
        </TableRow>
      ))}
    </TableHeader>
  );
}
