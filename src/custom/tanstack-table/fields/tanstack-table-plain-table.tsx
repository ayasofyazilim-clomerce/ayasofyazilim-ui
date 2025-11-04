"use no memo";
import {
  ColumnDef,
  flexRender,
  Table as TableType,
} from "@tanstack/react-table";
import { Fragment, JSX } from "react";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ayasofyazilim-ui/components/table";
import { getCommonPinningStyles } from "../utils";

export function TanstackTablePlainTable<TData, TValue>({
  table,
  columns,
  fillerColumn,
  editable,
  resizeable,
  expandedRowComponent,
}: {
  columns: ColumnDef<TData, TValue>[];
  fillerColumn?: keyof TData;
  editable?: boolean;
  expandedRowComponent?: (
    row: TData,
    toggleExpanded: () => void
  ) => JSX.Element;
  table: TableType<TData>;
  resizeable?: boolean;
}) {
  return (
    <Table style={{ width: table.getCenterTotalSize(), minWidth: "100%" }}>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className="group">
            {headerGroup.headers.map((header) => {
              if (header.id === "actions") return null;
              return (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  className={cn(
                    " relative group/th border-r border-gray-200",
                    header.column.getIsResizing() &&
                      "border-dashed border-black border-r"
                  )}
                  style={{
                    ...getCommonPinningStyles({
                      column: header.column,
                      withBorder: true,
                      fillerColumn,
                      resizeable,
                    }),
                  }}
                >
                  <div
                    className={cn(
                      header.column.getIsResizing() && "resizing",
                      "group-has-[.resizing]:pointer-events-none group-has-[.resizing]:select-none"
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </div>
                  {resizeable && (
                    <div
                      onDoubleClick={() => header.column.resetSize()}
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      role="button"
                      tabIndex={0}
                      aria-label="Resize column"
                      className="resizer w-0.5 hidden group-hover:flex absolute right-0 bg-muted-foreground top-0 h-10 z-10 items-center cursor-col-resize select-none touch-none"
                    />
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <Fragment key={row.id}>
              <TableRow
                data-state={row.getIsSelected() && "selected"}
                className={cn(editable && "[&>td:last-child]:border-r-0")}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      (editable || cell.column.id === "actions") &&
                        "p-0 border border-b-0"
                    )}
                    style={{
                      ...getCommonPinningStyles({
                        column: cell.column,
                        fillerColumn,
                        resizeable,
                        withBorder: true,
                      }),
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
              {row.getIsExpanded() && expandedRowComponent && (
                <TableRow>
                  <TableCell colSpan={row.getAllCells().length}>
                    {expandedRowComponent(
                      row.original,
                      row.getToggleExpandedHandler()
                    )}
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-auto text-center">
              No data results
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
