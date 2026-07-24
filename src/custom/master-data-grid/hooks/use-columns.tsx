import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import type { ButtonVariant } from "@repo/ayasofyazilim-ui/components/button";
import { GenericObjectType } from "@rjsf/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Save, X } from "lucide-react";
import { useMemo, useState, type RefObject } from "react";
import { Button } from "../../../components/button";
import { Checkbox } from "../../../components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../../components/tooltip";
import type {
  CellProps,
  ColumnConfig,
  DialogRowAction,
  ExpandableColumnMeta,
  JSONSchema,
  MasterDataGridConfig,
  MasterDataGridResources,
} from "../types";
import {
  generateColumnsFromSchema,
  mergeColumns,
} from "../utils/column-generator";

// Maps a ButtonVariant to the DropdownMenuItem's supported variant + extra className.
function getDropdownItemProps(variant: ButtonVariant | undefined): {
  variant?: "default" | "destructive";
  extraClassName?: string;
} {
  switch (variant) {
    case "destructive":
    case "destructive-outline":
      // DropdownMenuItem's built-in destructive variant handles text color;
      // force the icon color too since the base class uses muted-foreground for svgs.
      return {
        variant: "destructive",
        extraClassName: "[&_svg]:!text-destructive",
      };
    case "constructive":
    case "constructive-outline":
      return {
        extraClassName:
          "text-green-600 focus:text-green-600 focus:bg-green-600/10 dark:text-green-400 dark:focus:text-green-400 [&_svg]:!text-green-600 dark:[&_svg]:!text-green-400",
      };
    default:
      return {};
  }
}

// Used in dropdown mode - avoids nesting a Button inside a DropdownMenuItem
function DropdownDialogMenuItem<TData>({
  action,
  row,
  disabled,
}: {
  action: DialogRowAction<TData>;
  row: TData;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [preventClose, setPreventClose] = useState(
    action.preventClose ?? false
  );

  const label =
    typeof action.label === "function" ? action.label(row) : action.label;
  const title =
    typeof action.title === "function" ? action.title(row) : action.title;
  const description =
    typeof action.description === "function"
      ? action.description(row)
      : action.description;
  const Icon = action.icon;

  const close = () => {
    setPreventClose(action.preventClose ?? false);
    setOpen(false);
  };

  const { variant: dmVariant, extraClassName } = getDropdownItemProps(
    action.variant
  );

  return (
    <>
      <DropdownMenuItem
        variant={dmVariant}
        disabled={disabled}
        className={cn(extraClassName, action.className)}
        onSelect={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
      >
        {Icon && <Icon className="size-3.5" />}
        {label}
      </DropdownMenuItem>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next && preventClose) return;
          setOpen(next);
        }}
      >
        <DialogContent
          className={cn("flex flex-col", action.contentClassName)}
          showCloseButton={action.showCloseButton}
          onPointerDownOutside={(e) => {
            if (preventClose) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (preventClose) e.preventDefault();
          }}
        >
          {(title || description) && (
            <DialogHeader>
              {title && <DialogTitle>{title}</DialogTitle>}
              {description && (
                <DialogDescription>{description}</DialogDescription>
              )}
            </DialogHeader>
          )}
          {action.children({ row, preventClose, setPreventClose, close })}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Used in inline/responsive mode - icon-only button with tooltip that opens a dialog
function InlineDialogActionItem<TData>({
  action,
  row,
  disabled,
}: {
  action: DialogRowAction<TData>;
  row: TData;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [preventClose, setPreventClose] = useState(
    action.preventClose ?? false
  );

  const label =
    typeof action.label === "function" ? action.label(row) : action.label;
  const title =
    typeof action.title === "function" ? action.title(row) : action.title;
  const description =
    typeof action.description === "function"
      ? action.description(row)
      : action.description;
  const Icon = action.icon;

  const close = () => {
    setPreventClose(action.preventClose ?? false);
    setOpen(false);
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={action.variant ?? "ghost"}
            size="icon-xs"
            disabled={disabled}
            className={cn("shrink-0", action.className)}
            onClick={() => setOpen(true)}
          >
            {Icon ? (
              <Icon className="size-3.5" />
            ) : (
              <span className="text-xs">{label}</span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next && preventClose) return;
          setOpen(next);
        }}
      >
        <DialogContent
          className={cn("flex flex-col", action.contentClassName)}
          showCloseButton={action.showCloseButton}
          onPointerDownOutside={(e) => {
            if (preventClose) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (preventClose) e.preventDefault();
          }}
        >
          {(title || description) && (
            <DialogHeader>
              {title && <DialogTitle>{title}</DialogTitle>}
              {description && (
                <DialogDescription>{description}</DialogDescription>
              )}
            </DialogHeader>
          )}
          {action.children({ row, preventClose, setPreventClose, close })}
        </DialogContent>
      </Dialog>
    </>
  );
}

export interface UseColumnsProps<TData> {
  config: MasterDataGridConfig<TData>;
  configRef: RefObject<MasterDataGridConfig<TData>>;
  schema?: JSONSchema | GenericObjectType;
  customColumns?: ColumnConfig<TData>[];
  enableColumnVisibility: boolean;
  editingRowsRef: RefObject<Record<string, Record<string, unknown>>>;
  updateCellValue: (rowId: string, columnId: string, value: unknown) => void;
  getRowId?: (row: TData, index: number) => string;
  t?: MasterDataGridResources;
  startEditingRow: (rowId: string, row: TData) => void;
  cancelEditingRow: (rowId: string, row: TData) => void;
  saveEditingRow: (rowId: string, row: TData) => Promise<void>;
}

export function useColumns<TData>({
  config,
  configRef,
  schema,
  customColumns,
  enableColumnVisibility,
  editingRowsRef,
  updateCellValue,
  getRowId,
  t,
  startEditingRow,
  cancelEditingRow,
  saveEditingRow,
}: UseColumnsProps<TData>): ColumnDef<TData>[] {
  return useMemo<ColumnDef<TData>[]>(() => {
    const editingContext = config.editing?.enabled
      ? {
          get editingRows() {
            return editingRowsRef.current;
          },
          onCellUpdate: updateCellValue,
          getRowId: getRowId || ((row: TData, index: number) => String(index)),
        }
      : undefined;

    const generatedColumns = schema
      ? generateColumnsFromSchema<TData>(
          schema,
          configRef.current.localization,
          t,
          editingContext,
          configRef.current.cellClassName,
          configRef.current.dateOptions,
          configRef.current.customRenderers,
          configRef.current.editing?.errorDisplayMode,
          enableColumnVisibility,
          config.expansion?.expanderColumns,
          config.schemaColumns
        )
      : [];

    // Auto-generate groupBy columns that were excluded by schemaColumns.
    // These are non-toggleable hidden columns required for grouping to work.
    const groupByKeys =
      (config.grouping?.groupBy as string[] | undefined) || [];
    const missingGroupByKeys = groupByKeys.filter(
      (key) => !generatedColumns.find((col) => col.id === key)
    );
    const groupByColumns =
      schema && missingGroupByKeys.length > 0
        ? generateColumnsFromSchema<TData>(
            schema,
            configRef.current.localization,
            t,
            editingContext,
            undefined,
            undefined,
            undefined,
            undefined,
            false,
            undefined,
            {
              mode: "include",
              columns: missingGroupByKeys as (keyof TData & string)[],
            }
          ).map((col) => ({
            ...col,
            enableHiding: false,
            enableColumnFilter: false,
          }))
        : [];

    const mergeContext = editingContext
      ? {
          get editingRows() {
            return editingRowsRef.current;
          },
          getRowId: editingContext.getRowId,
        }
      : undefined;

    const merged = mergeColumns<TData>(
      [...generatedColumns, ...groupByColumns],
      customColumns,
      mergeContext,
      enableColumnVisibility,
      t
    );

    const mergedWithExpansion = merged.map((col) => {
      const shouldExpandOnClick =
        (col.meta as ExpandableColumnMeta)?.isExpanderColumn ||
        customColumns?.find((c) => c.id === col.id)?.isExpanderColumn;

      if (!shouldExpandOnClick || !configRef.current.expansion?.enabled) {
        return col;
      }

      const originalCell = col.cell;
      return {
        ...col,
        cell: (props: CellProps<TData>) => {
          const content =
            typeof originalCell === "function"
              ? originalCell(props)
              : originalCell;

          return (
            <div
              onClick={(e) => {
                e.stopPropagation();
                props.row.toggleExpanded();
              }}
              className="cursor-pointer hover:bg-muted/50 h-full flex items-center px-2 expander"
            >
              {content}
            </div>
          );
        },
      };
    });

    const finalColumns: ColumnDef<TData>[] = [];

    if (config.selection?.enabled) {
      finalColumns.push({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label={t?.["select_all"]}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={t?.["select_row"]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      });
    }

    finalColumns.push(...mergedWithExpansion);

    if (config.rowActions && config.rowActions.length > 0) {
      const displayMode = config.rowActionsDisplay ?? "dropdown";
      const isInline = displayMode === "inline";
      const isResponsive = displayMode === "responsive";
      finalColumns.push({
        id: "actions",
        header: t?.["actions"],
        size: isInline || isResponsive ? 120 : 40,
        minSize: isInline || isResponsive ? 80 : 40,
        maxSize: isInline || isResponsive ? undefined : 40,
        cell: ({ row }) => {
          const rowActions = config.rowActions?.filter((action) => {
            if (typeof action.hidden === "function") {
              return !action.hidden(row.original);
            }
            return !action.hidden;
          });

          if (!rowActions || rowActions.length === 0) return null;

          // Shared renderer helpers (used by inline and responsive modes)
          const renderInlineButtons = () =>
            rowActions.map((action) => {
              const disabled =
                typeof action.disabled === "function"
                  ? action.disabled(row.original)
                  : action.disabled;
              const Icon = action.icon;

              if ("type" in action && action.type === "dialog") {
                return (
                  <InlineDialogActionItem
                    key={action.id}
                    action={action}
                    row={row.original}
                    disabled={disabled}
                  />
                );
              }
              if ("render" in action && action.render) {
                return <div key={action.id}>{action.render(row.original)}</div>;
              }
              if ("label" in action && "onClick" in action) {
                const label =
                  typeof action.label === "function"
                    ? action.label(row.original)
                    : action.label;
                return (
                  <Tooltip key={action.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={action.variant ?? "ghost"}
                        size="icon-xs"
                        disabled={disabled}
                        className={cn("shrink", action.className)}
                        onClick={(e) => action.onClick?.(row.original, e)}
                      >
                        {Icon ? (
                          <Icon className="size-3.5" />
                        ) : (
                          <span className="text-xs">{label}</span>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{label}</TooltipContent>
                  </Tooltip>
                );
              }
              return null;
            });

          const renderDropdown = () => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="w-full h-full rounded-none"
                  aria-label={t?.["open_menu"]}
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {rowActions.map((action) => {
                  const disabled =
                    typeof action.disabled === "function"
                      ? action.disabled(row.original)
                      : action.disabled;

                  if ("type" in action && action.type === "dialog") {
                    return (
                      <DropdownDialogMenuItem
                        key={action.id}
                        action={action}
                        row={row.original}
                        disabled={disabled}
                      />
                    );
                  }
                  if ("render" in action && action.render) {
                    return (
                      <DropdownMenuItem
                        key={action.id}
                        disabled={disabled}
                        className={cn("w-full", action.className)}
                        onSelect={(e) => e.preventDefault()}
                        asChild
                      >
                        {action.render(row.original)}
                      </DropdownMenuItem>
                    );
                  }
                  if ("label" in action && "onClick" in action) {
                    const { variant: dmVariant2, extraClassName: extraCn2 } =
                      getDropdownItemProps(action.variant);
                    return (
                      <DropdownMenuItem
                        key={action.id}
                        variant={dmVariant2}
                        onClick={(e) => action.onClick?.(row.original, e)}
                        disabled={disabled}
                        className={cn(extraCn2, action.className)}
                      >
                        {action.icon && <action.icon className="size-3.5" />}
                        {typeof action.label === "function"
                          ? action.label(row.original)
                          : action.label}
                      </DropdownMenuItem>
                    );
                  }
                  return null;
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          );

          // ── Responsive mode ───────────────────────────────────────────────
          if (isResponsive) {
            return (
              <>
                <div className="md:hidden">{renderDropdown()}</div>
                <div className="hidden md:flex items-center gap-1 px-2">
                  {renderInlineButtons()}
                </div>
              </>
            );
          }

          // ── Inline mode ──────────────────────────────────────────────────
          if (isInline) {
            return (
              <div className="flex items-center gap-1 px-2">
                {renderInlineButtons()}
              </div>
            );
          }

          // ── Dropdown mode (default) ───────────────────────────────────────
          return renderDropdown();
        },
        enableSorting: false,
        enableHiding: false,
      });
    }

    if (config.editing?.enabled && config.editing.mode === "row") {
      finalColumns.push({
        id: "edit-actions",
        header: t?.["column.edit"] || "Edit",
        cell: ({ row }) => {
          const rowId = getRowId
            ? getRowId(row.original, row.index)
            : String(row.index);
          const isEditing = !!editingRowsRef.current[rowId];
          const isRowEditable =
            !config.editing?.isRowEditable ||
            config.editing.isRowEditable(row.original);

          if (!isRowEditable) return null;

          return (
            <div className="flex gap-1 px-2">
              {isEditing ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => saveEditingRow(rowId, row.original)}
                    className="h-7 px-2"
                    aria-label={t?.["save"]}
                  >
                    <Save className="size-3.5" />
                    {t?.["column.save"]}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => cancelEditingRow(rowId, row.original)}
                    className="h-7 px-2"
                    aria-label={t?.["cancel"]}
                  >
                    <X className="size-3.5" />
                    {t?.["column.cancel"]}
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditingRow(rowId, row.original)}
                  className="h-7 px-2"
                  aria-label={t?.["edit"]}
                >
                  <Pencil className="size-3.5" />
                  {t?.["column.edit"]}
                </Button>
              )}
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      });
    }

    if (config.columnOrder && config.columnOrder.length > 0) {
      const orderedColumns: ColumnDef<TData>[] = [];
      const columnMap = new Map(finalColumns.map((col) => [col.id, col]));

      for (const colId of config.columnOrder) {
        const col = columnMap.get(String(colId));
        if (col) {
          orderedColumns.push(col);
          columnMap.delete(String(colId));
        }
      }
      orderedColumns.push(...Array.from(columnMap.values()));

      return orderedColumns;
    }

    if (
      !config.columnOrder &&
      config.columnVisibility?.mode === "show" &&
      config.columnVisibility.columns.length > 0
    ) {
      const orderedColumns: ColumnDef<TData>[] = [];
      const columnMap = new Map(finalColumns.map((col) => [col.id, col]));

      for (const colId of config.columnVisibility.columns) {
        const col = columnMap.get(String(colId));
        if (col) {
          orderedColumns.push(col);
          columnMap.delete(String(colId));
        }
      }

      orderedColumns.push(...Array.from(columnMap.values()));

      return orderedColumns;
    }

    return finalColumns;
  }, [
    schema,
    customColumns,
    enableColumnVisibility,
    config,
    configRef,
    editingRowsRef,
    updateCellValue,
    getRowId,
    t,
    startEditingRow,
    cancelEditingRow,
    saveEditingRow,
  ]);
}
