import { PlusCircledIcon } from '@radix-ui/react-icons';
import { Column } from '@tanstack/react-table';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandInput } from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useDebounce } from '../../../hooks/useDebounce';

interface TanstackTableTextFilterProps<TData, TValue> {
  accessorKey: string;
  column?: Column<TData, TValue>;
  onFilter: (accessorKey: string, selectedValues: string) => void;
  params: URLSearchParams;
}

export function TanstackTableTextFilter<TData, TValue>({
  column,
  accessorKey,
  params,
  onFilter,
}: TanstackTableTextFilterProps<TData, TValue>) {
  const title = column?.columnDef?.meta?.toString() || accessorKey;
  const [searchInput, setSearchInput] = useState('');
  const filterValue = useDebounce(searchInput || '', 500);

  useEffect(() => {
    if (params?.get(accessorKey) !== filterValue) {
      onFilter(accessorKey, filterValue);
    }
  }, [filterValue]);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircledIcon className="mr-2 h-4 w-4" />
          {title}
          {filterValue?.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <div className="hidden space-x-1 lg:flex">{filterValue}</div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder={title}
            value={searchInput}
            onValueChange={(value) => setSearchInput(value)}
          />
        </Command>
        <div className="p-1">
          <Button
            onClick={() => setSearchInput('')}
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
