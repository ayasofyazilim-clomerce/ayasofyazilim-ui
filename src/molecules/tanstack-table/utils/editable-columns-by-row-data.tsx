import { ColumnDef } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { TanstackTableColumnHeader } from '../fields';
import { TanstacktableEditableColumnsByRowId } from '../types';
import { tanstackTableCreateTitleWithLanguageData } from './columnNames';
import { Switch } from '@/components/ui/switch';

export function tanstackTableEditableColumnsByRowData<T>(
  params: TanstacktableEditableColumnsByRowId<T>
) {
  const { rows, excludeColumns, languageData } = params;
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
        cell: ({ getValue, row: { index }, column: { id }, table }) => {
          const initialValue = (getValue() as string)?.toString() || '';

          const [value, setValue] = useState(initialValue);
          const rowId = (table.options.data[index] as { id: string })?.id;
          const isRowSelected = rowId
            ? table.getRow(rowId)?.getIsSelected()
            : false;

          // When the input is blurred, we'll call our table meta's updateData function
          const onBlur = () => {
            let $value: string | number | boolean;
            switch (rows[accessorKey]?.type) {
              case 'number':
                $value = Number(value);
                break;
              case 'boolean':
                $value = value === 'true';
                break;
              default:
                $value = value;
            }
            table.options.meta?.updateData(index, id, $value);
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
                defaultValue={value as string}
                onValueChange={(_value) => {
                  handleValueChange(_value);
                  const $value =
                    rows[accessorKey].type === 'number'
                      ? Number(_value)
                      : _value;
                  table.options.meta?.updateData(index, id, $value);
                }}
              >
                <SelectTrigger
                  className={cn(
                    'w-[180px] min-w-max border-none rounded-none focus-visible:border-none focus-within:border-none ring-0 focus-visible:ring-0 focus-within:ring-0 ring-transparent shadow-none',
                    isRowSelected ? 'font-medium italic' : '',
                    !value && 'text-muted-foreground'
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
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            );
          }

          if (rows[accessorKey]?.type === 'boolean') {
            return (
              <div className="text-center">
                <Switch
                  className="align-middle"
                  defaultChecked={value === 'true'}
                  onBlur={onBlur}
                  onCheckedChange={(value) => {
                    handleValueChange(String(value));
                  }}
                />
              </div>
            );
          }
          return (
            <Input
              value={value as string}
              className={cn(
                'w-full border-none rounded-none focus-visible:border-none focus-within:border-none ring-0 focus-visible:ring-0 focus-within:ring-0 ring-transparent shadow-none',
                isRowSelected ? 'font-medium italic' : ''
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
