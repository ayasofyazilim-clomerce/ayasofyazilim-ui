"use no memo";
import type { Column, Header } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  EyeOff,
  FilterIcon,
  PinIcon,
  PinOffIcon,
  Undo2,
} from "lucide-react";
import { Button } from "../../../../components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../../components/dropdown-menu";
import { getTranslations } from "../../utils/translation-utils";
import { InlineColumnFilter } from "../filters";

interface HeaderCellProps<TData> {
  column: Column<TData>;
  header?: Header<TData, unknown>;
  label: string;
  t?: Record<string, string>;
  onFilterClick?: (columnId: string) => void;
}

/**
 * Table header cell with sorting, pinning, and visibility options
 */
export function HeaderCell<TData>({
  column,
  header,
  label,
  t,
  onFilterClick,
}: HeaderCellProps<TData>) {
  const isSorted = column.getIsSorted();
  const isPinned = column.getIsPinned();

  return (
    <div className="flex items-center size-full relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-accent w-full rounded-none"
          >
            <span className="font-semibold mr-auto truncate">{label}</span>
            {isSorted === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : isSorted === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ChevronDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {column.getCanSort() && (
            <>
              <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                <ArrowUp className="mr-2 h-4 w-4" />
                {getTranslations("column.sortAsc", t)}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                <ArrowDown className="mr-2 h-4 w-4" />
                {getTranslations("column.sortDesc", t)}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {column.getCanPin() && (
            <>
              <DropdownMenuItem onClick={() => column.pin("left")}>
                <PinIcon className="mr-2 h-4 w-4" />
                {getTranslations("column.pinLeft", t)}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => column.pin("right")}>
                <PinIcon className="mr-2 h-4 w-4" />
                {getTranslations("column.pinRight", t)}
              </DropdownMenuItem>
              {isPinned && (
                <DropdownMenuItem onClick={() => column.pin(false)}>
                  <PinOffIcon className="mr-2 h-4 w-4" />
                  {getTranslations("column.unpin", t)}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
            </>
          )}

          {column.getCanFilter() && (
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center gap-4 font-normal">
                <FilterIcon className="h-4 w-4 text-muted-foreground" />
                {getTranslations("column.filter", t)}
              </DropdownMenuLabel>
              <DropdownMenuItem className="p-0" asChild>
                <InlineColumnFilter column={column} t={t} />
              </DropdownMenuItem>
            </DropdownMenuGroup>
          )}

          {header &&
            column.getCanResize() &&
            column.getSize() !== column.columnDef.size && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => header.column.resetSize()}>
                  <Undo2 className="mr-2 h-4 w-4" />
                  {getTranslations("column.resetSize", t)}
                </DropdownMenuItem>
              </>
            )}

          {column.getCanHide() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
                <EyeOff className="mr-2 h-4 w-4" />
                {getTranslations("column.hide", t)}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Column Resizer */}
      {header && column.getCanResize() && (
        <div
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-primary transition-opacity ${
            column.getIsResizing()
              ? "bg-primary opacity-100"
              : "opacity-0 hover:opacity-50"
          }`}
          style={{
            transform: column.getIsResizing() ? "translateX(0)" : undefined,
          }}
        />
      )}
    </div>
  );
}
