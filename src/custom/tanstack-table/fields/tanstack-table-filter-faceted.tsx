import { CheckIcon, CirclePlusIcon } from "lucide-react";
import { Column } from "@tanstack/react-table";

import { useEffect, useState } from "react";
import { Badge } from "@repo/ayasofyazilim-ui/components/badge";
import { Button } from "@repo/ayasofyazilim-ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@repo/ayasofyazilim-ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ayasofyazilim-ui/components/popover";
import { Separator } from "@repo/ayasofyazilim-ui/components/separator";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { TanstackTableFacetedFilterType } from "../types";

interface DataTableFacetedFilterProps<TData, TValue> {
  accessorKey: string;
  column?: Column<TData, TValue>;
  onFilter: (accessorKey: string, selectedValues: string) => void;
  options: TanstackTableFacetedFilterType[];
  params: URLSearchParams;
  title: string;
}

export function TanstackTableFacetedFilter<TData, TValue>({
  column,
  accessorKey,
  options,
  onFilter,
  params,
  title,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const facets = column?.getFacetedUniqueValues();
  const [selectedValues, setSelectedValues] = useState(
    new Set(params?.get(accessorKey)?.split(",") || []),
  );
  useEffect(() => {
    setSelectedValues(new Set(params?.get(accessorKey)?.split(",") || []));
  }, [params?.get(accessorKey)]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <CirclePlusIcon className="mr-2 h-4 w-4" />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.size} Selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No Filter results</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      const current = Array.from(selectedValues);
                      if (isSelected) {
                        current.splice(
                          current.findIndex((i) => i === option.value),
                          1,
                        );
                      } else {
                        current.push(option.value);
                      }

                      onFilter(accessorKey, current.join(","));
                      setSelectedValues(new Set(current));
                    }}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible",
                      )}
                    >
                      <CheckIcon className={cn("h-4 w-4")} />
                    </div>
                    {option.icon && (
                      <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{option.label}</span>
                    {facets?.get(option.value) && (
                      <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                        {facets.get(option.value)}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onFilter(accessorKey, "")}
                    className="justify-center text-center"
                  >
                    Clean Filter
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
