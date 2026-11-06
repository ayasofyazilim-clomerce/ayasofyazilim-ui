"use no memo";
import type { Table as TanStackTable } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { TableCell, TableFooter, TableRow } from "../../../../components/table";
import { cn } from "../../../../lib/utils";
import {
  getPinningHeaderClassNames,
  getPinningHeaderStyles,
} from "../../utils/pinning-utils";

export interface GridFooterProps<TData> {
  table: TanStackTable<TData>;
}

/**
 * The <tfoot> shared by normal and virtual mode. Renders nothing unless at
 * least one visible leaf column defines a footer.
 */
export function GridFooter<TData>({ table }: GridFooterProps<TData>) {
  const hasFooter = table
    .getVisibleLeafColumns()
    .some((column) => Boolean(column.columnDef.footer));
  if (!hasFooter) return null;

  return (
    <TableFooter className="sticky bottom-0 z-10 bg-background">
      {table.getFooterGroups().map((footerGroup) => (
        <TableRow key={footerGroup.id}>
          {footerGroup.headers.map((header) => (
            <TableCell
              key={header.id}
              colSpan={header.colSpan}
              style={getPinningHeaderStyles(header)}
              className={cn(
                getPinningHeaderClassNames(header),
                "not-last:border-r"
              )}
            >
              {header.isPlaceholder
                ? null
                : flexRender(
                    header.column.columnDef.footer,
                    header.getContext()
                  )}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableFooter>
  );
}
