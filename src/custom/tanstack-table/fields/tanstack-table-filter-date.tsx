import { CirclePlusIcon } from "lucide-react";
import { Column } from "@tanstack/react-table";

import { useEffect, useState } from "react";
import { Button } from "@repo/ayasofyazilim-ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ayasofyazilim-ui/components/popover";
import { Separator } from "@repo/ayasofyazilim-ui/components/separator";
import { TanstackTableDateFilterType } from "../types";
import {
  DatePicker,
  DateRangePicker,
} from "@repo/ayasofyazilim-ui/custom/date-picker";
import { DateRange } from "@repo/ayasofyazilim-ui/custom/date-picker/types";

interface TanstackTableDateFilterProps<TData, TValue> {
  accessorKey: string;
  column?: Column<TData, TValue>;
  dateItem: TanstackTableDateFilterType;
  onFilter: (accessorKey: string, selectedValues: string) => void;
  onFilterMultiple: (
    filter: {
      accessorKey: string;
      selectedValues: string;
    }[]
  ) => void;
  params: URLSearchParams;
}

export function TanstackTableDateFilter<TData, TValue>({
  column,
  accessorKey,
  params,
  onFilter,
  onFilterMultiple,
  dateItem,
}: TanstackTableDateFilterProps<TData, TValue>) {
  const title = column?.columnDef?.meta?.toString() || accessorKey;

  // If endAccessorKey is provided, then it is a date range. Otherwise it is a single date.
  const [date, setDate] = useState<Date | DateRange | undefined>(
    dateItem?.endAccessorKey
      ? {
          start: params?.get(dateItem.startAccessorKey)
            ? new Date(params?.get(dateItem.startAccessorKey) as string)
            : undefined,
          end: params?.get(dateItem?.endAccessorKey)
            ? new Date(params?.get(dateItem.endAccessorKey) as string)
            : undefined,
        }
      : params?.get(dateItem.startAccessorKey)
        ? new Date(params?.get(dateItem.startAccessorKey) as string)
        : undefined
  );

  useEffect(() => {
    function isFilterChanged(accessorKey: string, date: Date | undefined) {
      return params.get(accessorKey) !== date?.toISOString();
    }

    function isFiltered(accessorKey: string) {
      return !!params.get(accessorKey);
    }

    const filter: {
      accessorKey: string;
      selectedValues: string;
    }[] = [];

    if (!date) {
      // This works when filters cleared
      if (isFiltered(dateItem.startAccessorKey)) {
        filter.push({
          accessorKey: dateItem.startAccessorKey,
          selectedValues: "",
        });
      }
      if (dateItem?.endAccessorKey && isFiltered(dateItem.endAccessorKey)) {
        filter.push({
          accessorKey: dateItem.endAccessorKey,
          selectedValues: "",
        });
      }

      if (filter.length > 0) {
        onFilterMultiple(filter);
      }
      return;
    }

    if (date instanceof Date) {
      // It's a single date, no endAccessorKey
      if (isFilterChanged(dateItem?.startAccessorKey, date)) {
        onFilter(dateItem?.startAccessorKey, date.toISOString());
      }
      return;
    }

    if (!dateItem.canFilteredBySingleDate && (!date.start || !date.end)) return;

    if (isFilterChanged(dateItem.startAccessorKey, date.start)) {
      filter.push({
        accessorKey: dateItem.startAccessorKey,
        selectedValues: date.start?.toISOString() || "",
      });
    }

    if (
      dateItem.endAccessorKey &&
      isFilterChanged(dateItem.endAccessorKey, date.end)
    ) {
      filter.push({
        accessorKey: dateItem.endAccessorKey,
        selectedValues: date.end?.toISOString() || "",
      });
    }

    if (filter.length > 0) {
      onFilterMultiple(filter);
    }
  }, [date]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <CirclePlusIcon className="mr-2 h-4 w-4" />
          {title}
          {date && "start" in date && "to" in date && date.start && (
            <div className="hidden space-x-1 md:flex">
              <Separator orientation="vertical" className="mx-2 h-4" />
              {new Date(date.start).toLocaleDateString()} -
              {date.end && new Date(date?.end).toLocaleDateString()}
            </div>
          )}
          {date instanceof Date && (
            <div className="hidden space-x-1 md:flex">
              <Separator orientation="vertical" className="mx-2 h-4" />
              {new Date(date).toLocaleDateString()}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-full min-w-fit" align="start">
        {dateItem?.endAccessorKey ? (
          <DateRangePicker
            id={dateItem.startAccessorKey}
            classNames={{
              dateInput: "border-0 border-b rounded-none",
            }}
            onChange={(_date) => {
              setDate(_date);
            }}
            defaultValues={date as DateRange}
          />
        ) : (
          <DatePicker
            id={dateItem.endAccessorKey || ""}
            onChange={(_date) => {
              setDate(_date);
            }}
            defaultValue={date as Date | undefined}
          />
        )}
        <div className="p-1">
          <Button
            onClick={() => setDate(undefined)}
            variant="ghost"
            className="justify-center text-center w-full hover:bg-accent text-accent-foreground"
          >
            Clean Filter
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
