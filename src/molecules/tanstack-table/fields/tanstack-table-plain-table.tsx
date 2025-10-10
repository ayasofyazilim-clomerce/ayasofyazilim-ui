import {
  ColumnDef,
  flexRender,
  Table as TableType,
} from '@tanstack/react-table';
import { UnfoldHorizontal } from 'lucide-react';
import { Fragment } from 'react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getCommonPinningStyles } from '../utils';

export function TanstackTablePlainTable<TData, TValue>({
  table,
  columns,
  editable,
  resizeable,
  expandedRowComponent,
}: {
  columns: ColumnDef<TData, TValue>[];
  editable?: boolean;
  expandedRowComponent?: (
    row: TData,
    toggleExpanded: () => void
  ) => JSX.Element;
  table: TableType<TData>;
  resizeable?: boolean;
}) {
  return (
    <div className="overflow-x-auto w-full flex flex-1">
      <Table
        style={{
          width: table.getCenterTotalSize(),
          minWidth: '100%',
        }}
      >
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="group">
              {headerGroup.headers.map((header) => {
                if (header.id === 'actions') return null;
                return (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(
                      ' relative border-r border-gray-200',
                      header.column.getIsResizing() &&
                        'border-dashed border-black border-r-[1px]'
                    )}
                    style={{
                      ...getCommonPinningStyles({
                        column: header.column,
                        withBorder: true,
                      }),
                    }}
                  >
                    <div
                      className={cn(
                        header.column.getIsResizing() && 'resizing',
                        'group-has-[.resizing]:pointer-events-none group-has-[.resizing]:select-none'
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
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            header.column.resetSize();
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label="Resize column"
                        className={`resizer absolute -right-2 w-4 top-0 h-10 z-10 flex items-center cursor-pointer select-none touch-none'
                        }`}
                      >
                        <UnfoldHorizontal
                          className={cn(
                            'w-4',
                            header.column.getIsResizing() && 'text-black'
                          )}
                        />
                      </div>
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
                  data-state={row.getIsSelected() && 'selected'}
                  className={cn(editable && '[&>td:last-child]:border-r-0')}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        (editable || cell.column.id === 'actions') &&
                          'p-0 border border-b-0'
                      )}
                      style={{
                        ...getCommonPinningStyles({
                          column: cell.column,
                          withBorder: true,
                        }),
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
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
              <TableCell
                colSpan={columns.length}
                className="h-auto text-center"
              >
                No data results
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
