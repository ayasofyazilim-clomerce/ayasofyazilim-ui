import { ColumnDef, Row } from '@tanstack/react-table';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { tanstackTableCreateTitleWithLanguageData, testConditions } from '.';
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
  } = props;
  let content: JSX.Element | string =
    row.getValue(accessorKey.toString())?.toString() || '';
  if (format) {
    if (format === 'date' || format === 'date-time')
      content = content
        ? new Date(content).toLocaleDateString(
            config?.locale,
            config?.dateOptions || {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }
          )
        : '';
  }

  if (icon) {
    const position = icon.position || 'before';
    content = (
      <>
        {icon.icon && position === 'before' && (
          <icon.icon className={cn('w-4 h-4', icon.iconClassName)} />
        )}
        {row.getValue(accessorKey.toString())}
        {icon.icon && position === 'after' && (
          <icon.icon className={cn('w-4 h-4', icon.iconClassName)} />
        )}
      </>
    );
  }
  if (badge) {
    const badges = badge.values.map((item) =>
      item.conditions?.map((condition) => {
        if (condition.when(row.getValue(condition.conditionAccessorKey))) {
          return (
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
      })
    );
    content = (
      <>
        {badges}
        {!badge.hideColumnValue && content}
      </>
    );
  }
  if (faceted) {
    const facetedItem = faceted.find(
      (item) =>
        item.value ===
        (row.getValue(accessorKey.toString()) as string).toString()
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
          <span>{facetedItem.label}</span>
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
    url +=
      `/${row
        ._getAllCellsByColumnId()
        ?.[link.targetAccessorKey || ''].getValue()
        ?.toString()}` || '';
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
  } = params;
  const columns: ColumnDef<T>[] = [];
  if (params.selectableRows) {
    columns.push({
      size: 64,
      id: 'select',
      header: ({ table }) => (
        <div className="w-14">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
            className="translate-y-0.5  align-middle"
          />
        </div>
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-0.5 align-top"
        />
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
          }),
      };
      if (faceted?.[accessorKey]) {
        column.filterFn = (row, id, value) => value.includes(row.getValue(id));
      }
      columns.push(column);
    });

  return columns;
}
