'use client';

import { ColumnDef, Row } from '@tanstack/react-table';
import Link from 'next/link';
import { Badge } from '@repo/ayasofyazilim-ui/components/badge';
import { Checkbox } from '@repo/ayasofyazilim-ui/components/checkbox';
import { cn } from '@repo/ayasofyazilim-ui/lib/utils';
import { tanstackTableCreateTitleWithLanguageData, testConditions } from '.';
import DateTooltip, { Localization } from '../../date-tooltip';
import { TanstackTableColumnHeader } from '../fields';
import {
  TanstackTableColumCell,
  TanstackTableColumnBadge,
  TanstackTableColumnClassNames,
  TanstackTableColumnIcon,
  TanstackTableColumnLink,
  TanstackTableConfig,
  TanstackTableCreateColumnsByRowId,
  TanstackTableFacetedFilterType,
} from '../types';
import { JSX } from 'react';

export function createCell<T>(props: {
  accessorKey: keyof T;
  row: Row<T>;
  link?: TanstackTableColumnLink;
  faceted?: TanstackTableFacetedFilterType[];
  badge?: TanstackTableColumnBadge;
  icon?: TanstackTableColumnIcon;
  className?: TanstackTableColumnClassNames[];
  expandRowTrigger?: boolean;
  format?: string;
  custom?: TanstackTableColumCell<T>;
  config?: TanstackTableConfig;
  localization: Localization;
}) {
  const {
    accessorKey,
    row,
    link,
    badge,
    icon,
    className,
    expandRowTrigger,
    format,
    custom,
    config,
    faceted,
    localization,
  } = props;

  let content: JSX.Element | string | null =
    row.getValue(accessorKey.toString())?.toString() || '';
  if (format) {
    if (format === 'date' || format === 'date-time') {
      content = content ? (
        <DateTooltip
          date={content}
          dateOptions={config?.dateOptions}
          localization={localization}
        />
      ) : (
        ''
      );
    }
  }

  if (icon) {
    const position = icon.position || 'before';
    content = (
      <div className="inline-flex">
        {icon.icon && position === 'before' && (
          <icon.icon className={cn('w-4 h-4 mr-2', icon.iconClassName)} />
        )}
        {row.getValue(accessorKey.toString())}
        {icon.icon && position === 'after' && (
          <icon.icon className={cn('w-4 h-4 ml-2', icon.iconClassName)} />
        )}
      </div>
    );
  }
  if (badge) {
    const position: { before: JSX.Element[]; after: JSX.Element[] } = {
      before: [],
      after: [],
    };
    badge.values.forEach((item) => {
      const itemPosition = item.position || 'before';
      item.conditions?.forEach((condition) => {
        if (condition.when(row.getValue(condition.conditionAccessorKey))) {
          position[itemPosition].push(
            <Badge
              variant="outline"
              className={item.badgeClassName}
              key={item.label}
            >
              {item.label}
            </Badge>
          );
        }
        return null;
      });
    });
    content = (
      <>
        {position.before}
        {!badge.hideColumnValue && content}
        {position.after}
      </>
    );
  }
  if (faceted) {
    const facetedItem = faceted.find(
      (item) =>
        item.when?.(row.getValue(accessorKey.toString())) ||
        row.getValue(accessorKey.toString()) === item.value
    );
    if (facetedItem) {
      content = (
        <div className={cn('flex items-center', facetedItem.className)}>
          {facetedItem.icon && (
            <facetedItem.icon
              className={cn(
                'text-muted-foreground mr-2 h-4 w-4',
                facetedItem.iconClassName
              )}
            />
          )}
          {facetedItem.hideColumnValue ? '' : <span>{facetedItem.label}</span>}
        </div>
      );
    }
  }
  const containerClassName = className
    ?.map((item) => {
      if (testConditions(item.conditions, row)) {
        return item.className;
      }
      return null;
    })
    .join(' ');

  if (custom) content = custom.content(row.original);
  if (!link || !testConditions(link.conditions, row)) {
    if (expandRowTrigger) {
      return (
        <button
          type="button"
          onClick={row.getToggleExpandedHandler()}
          data-testid={`expand-row-${accessorKey.toString()}`}
          className={cn(
            'font-medium text-blue-700 flex items-center gap-2 cursor-pointer',
            containerClassName
          )}
        >
          {content}
        </button>
      );
    }
    return (
      <div className={cn(' flex items-center gap-2', containerClassName)}>
        {content}
      </div>
    );
  }
  let url = link.prefix;
  if (link.targetAccessorKey) {
    url += `/${row._getAllCellsByColumnId()?.[link.targetAccessorKey || '']?.getValue()?.toString()}`;
  }
  if (link.suffix) {
    url += `/${link.suffix}`;
  }
  return (
    <Link
      href={url}
      className={cn(
        'font-medium text-blue-700 flex items-center gap-2',
        containerClassName
      )}
    >
      {content}
    </Link>
  );
}
export function tanstackTableCreateColumnsByRowData<T>(
  params: TanstackTableCreateColumnsByRowId<T>
) {
  const { rows, config } = params;

  const {
    excludeColumns,
    languageData,
    links,
    faceted,
    badges,
    classNames,
    icons,
    expandRowTrigger,
    custom,
    localization,
    onSelectedRowChange,
  } = params;
  const columns: ColumnDef<T>[] = [];
  if (params.selectableRows) {
    columns.push({
      size: 64,
      id: 'select',
      header: ({ table }) => (
        <div className="w-full h-9 flex items-center justify-center">
          <Checkbox
            checked={
              table
                .getRowModel()
                .rows.filter((row) => !params.disabledRowIds?.includes(row.id))
                .every((row) => row.getIsSelected()) &&
              table
                .getRowModel()
                .rows.some(
                  (row) =>
                    !params.disabledRowIds?.includes(row.id) &&
                    row.getIsSelected()
                )
            }
            onCheckedChange={(value) => {
              const selectedRows: T[] = [];
              table.getRowModel().rows.forEach((row) => {
                if (!params.disabledRowIds?.includes(row.id)) {
                  row.toggleSelected(!!value);
                  if (value) {
                    selectedRows.push(row.original);
                  }
                }
              });
              onSelectedRowChange?.(selectedRows);
            }}
            aria-label="Select all"
            className="translate-y-0.5 align-middle"
          />
        </div>
      ),

      cell: ({ row, table }) => (
        <div className="w-full h-9 flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => {
              const selectedRows: T[] = [];
              table.getSelectedRowModel().rows.forEach((row) => {
                selectedRows.push(row.original);
              });
              if (value) {
                selectedRows.push(row.original);
              } else {
                selectedRows.splice(selectedRows.indexOf(row.original), 1);
              }
              row.toggleSelected(!!value);
              onSelectedRowChange?.(selectedRows);
            }}
            disabled={params.disabledRowIds?.some((id) => id === row.id)}
            aria-label="Select row"
            className="translate-y-0.5 align-top"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    });
  }
  const rowKeys = Object.keys(rows) as (keyof T)[];
  rowKeys
    .filter((key) => !excludeColumns?.includes(key as keyof T))
    .forEach((accessorKey) => {
      const title = tanstackTableCreateTitleWithLanguageData({
        languageData,
        accessorKey: accessorKey.toString(),
      });
      const link = links?.[accessorKey as keyof T];
      const { format } = rows[accessorKey];
      const column: ColumnDef<T> = {
        id: accessorKey.toString(),
        accessorKey,
        meta: title,
        header:
          !custom?.[accessorKey] || custom?.[accessorKey]?.showHeader
            ? ({ column }) => (
              <TanstackTableColumnHeader column={column} title={title} />
            )
            : undefined,
        cell: ({ row }) =>
          createCell<T>({
            accessorKey,
            row,
            link,
            faceted: faceted?.[accessorKey]?.options,
            badge: badges?.[accessorKey],
            icon: icons?.[accessorKey],
            className: classNames?.[accessorKey],
            expandRowTrigger: expandRowTrigger === accessorKey,
            format,
            custom: custom?.[accessorKey],
            config,
            localization,
          }),
      };
      if (faceted?.[accessorKey]) {
        column.filterFn = (row, id, value) => value.includes(row.getValue(id));
      }
      columns.push(column);
    });

  return columns;
}
