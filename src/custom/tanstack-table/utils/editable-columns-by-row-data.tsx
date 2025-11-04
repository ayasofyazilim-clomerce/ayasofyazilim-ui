"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { Input } from "@repo/ayasofyazilim-ui/components/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ayasofyazilim-ui/components/select";
import { Switch } from "@repo/ayasofyazilim-ui/components/switch";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { createCell, tanstackTableCreateTitleWithLanguageData } from ".";
import { TanstackTableColumnHeader } from "../fields";
import {
  TanstackTableCreateColumnsByRowId,
  TanstacktableEditableColumnsByRowId,
} from "../types";
import { DatePicker } from "@repo/ayasofyazilim-ui/custom/date-picker";

export function tanstackTableEditableColumnsByRowData<T>(
  params: TanstacktableEditableColumnsByRowId<T> &
    Omit<TanstackTableCreateColumnsByRowId<T>, "rows" | "selectableRows">
) {
  const {
    rows,
    excludeColumns,
    languageData,
    editableColumns,
    config,
    faceted,
    links,
    badges,
    classNames,
    custom,
    expandRowTrigger,
    icons,
    localization,
  } = params;
  const columns: ColumnDef<T>[] = [];

  Object.keys(rows)
    .filter((key) => !excludeColumns?.includes(key as keyof T))
    .forEach((accessorKey) => {
      const title = tanstackTableCreateTitleWithLanguageData({
        languageData,
        accessorKey,
      });
      const column: ColumnDef<T> = {
        id: accessorKey,
        accessorKey,
        meta: title,
        header: ({ column }) => (
          <TanstackTableColumnHeader column={column} title={title} />
        ),
        cell: ({ getValue, row, column: { id }, table }) => {
          const _accesorKey = accessorKey as keyof T;
          if (editableColumns && !editableColumns.includes(_accesorKey)) {
            return createCell<T>({
              accessorKey: _accesorKey,
              row,
              link: links?.[_accesorKey],
              faceted: faceted?.[_accesorKey]?.options,
              badge: badges?.[_accesorKey],
              icon: icons?.[_accesorKey],
              className: classNames?.[_accesorKey],
              expandRowTrigger: expandRowTrigger === _accesorKey,
              format: rows[accessorKey]?.format,
              custom: custom?.[_accesorKey],
              config,
              localization,
            });
          }
          const initialValue = (getValue() as string)?.toString() || "";
          const [value, setValue] = useState(initialValue);
          const rowId = row.index.toString();
          const isRowSelected = table.getRow(rowId)?.getIsSelected();

          // When the input is blurred, we'll call our table meta's updateData function
          const onBlur = () => {
            let $value: string | number | boolean;
            switch (rows[accessorKey]?.type) {
              case "number":
                $value = Number(value);
                break;
              case "boolean":
                $value = value === "true";
                break;
              default:
                $value = value;
            }
            table.options.meta?.updateData(row.index, id, $value);
          };

          function handleValueChange(newValue: string) {
            setValue(newValue);
            if (isRowSelected && newValue === initialValue) {
              table.setRowSelection((old) => ({
                ...old,
                [rowId]: false,
              }));
              return;
            }

            if (!isRowSelected && newValue !== initialValue) {
              table.setRowSelection((old) => ({
                ...old,
                [rowId]: true,
              }));
            }
          }

          useEffect(() => {
            setValue(initialValue);
          }, [initialValue]);

          if (rows[accessorKey]?.enum) {
            return (
              <Select
                value={value as string}
                onValueChange={(_value) => {
                  handleValueChange(_value);
                  const $value =
                    rows[accessorKey]?.type === "number"
                      ? Number(_value)
                      : _value;
                  table.options.meta?.updateData(row.index, id, $value);
                }}
              >
                <SelectTrigger
                  className={cn(
                    "w-[180px] min-w-max border-none rounded-none focus-visible:border-none focus-within:border-none ring-0 focus-visible:ring-0 focus-within:ring-0 ring-transparent shadow-none",
                    isRowSelected ? "font-medium italic" : "",
                    !value && "text-muted-foreground"
                  )}
                >
                  <SelectValue
                    placeholder={
                      (languageData?.[
                        accessorKey as keyof typeof languageData
                      ] as string) || accessorKey
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {rows[accessorKey]?.enum?.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            );
          }
          if (rows[accessorKey]?.type === "boolean") {
            return (
              <div className="text-center">
                <Switch
                  className="align-middle"
                  checked={value === "true"}
                  onBlur={onBlur}
                  onCheckedChange={(_value) => {
                    handleValueChange(String(value));
                    table.options.meta?.updateData(row.index, id, _value);
                  }}
                />
              </div>
            );
          }
          if (rows[accessorKey]?.format === "date-time") {
            const date = new Date(value);
            return (
              <div className="text-center">
                <DatePicker
                  id={`${accessorKey}_date`}
                  defaultValue={
                    date instanceof Date && !Number.isNaN(date.getTime())
                      ? date
                      : undefined
                  }
                  onChange={(date) => {
                    const $value =
                      rows[accessorKey]?.format === "date-time"
                        ? date?.toISOString()
                        : date;
                    table.options.meta?.updateData(row.index, id, $value);
                  }}
                  classNames={{
                    dateInput: "border-none rounded-none",
                  }}
                />
              </div>
            );
          }
          return (
            <Input
              value={value as string}
              className={cn(
                "w-full border-none rounded-none focus-visible:border-none focus-within:border-none ring-0 focus-visible:ring-0 focus-within:ring-0 ring-transparent shadow-none",
                isRowSelected ? "font-medium italic" : ""
              )}
              placeholder={accessorKey}
              onChange={(e) => {
                handleValueChange(e.target.value);
              }}
              onBlur={onBlur}
            />
          );
        },
      };
      columns.push(column);
    });
  return columns;
}
