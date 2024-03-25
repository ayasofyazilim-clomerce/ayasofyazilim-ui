'use client';

import * as React from 'react';

import { Button } from '../../../@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../../../@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../@/components/ui/tooltip';

type CountrySelectItem = {
  label?: string;
  rtl?: boolean;
  value?: string;
};

type CountrySelectorProps = {
  countries?: Array<CountrySelectItem>;
  defaultValue?: CountrySelectItem;
  menuAlign: 'start' | 'center' | 'end';
  onValueChange?: (value: string) => void;
  searchEmptyValue?: string;
  searchText?: string;
  showLabel?: boolean;
  tooltipText?: string;
};

function CountrySelector({
  searchText,
  searchEmptyValue,
  defaultValue,
  menuAlign,
  tooltipText,
  showLabel = false,
  countries = [],
  onValueChange,
}: CountrySelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<string>('');

  return (
    <TooltipProvider>
      <Tooltip>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger>
            <TooltipTrigger>
              <Button
                role="combobox"
                variant="ghost"
                aria-expanded={open}
                className="justify-between border-none bg-transparent px-2 gap-2 rtl:flex-row-reverse"
              >
                {value ? (
                  <SelectedCountry
                    {...countries.find((country) => country.value === value)}
                    showLabel={showLabel}
                  />
                ) : (
                  <SelectedCountry {...defaultValue} showLabel={showLabel} />
                )}
              </Button>
            </TooltipTrigger>
            {tooltipText ? <TooltipContent>{tooltipText}</TooltipContent> : ''}
          </PopoverTrigger>
          <PopoverContent className="w-[160px] p-0" align={menuAlign}>
            <Command>
              <CommandList>
                <CommandInput
                  placeholder={searchText}
                  className="h-9 text-xs"
                />
                <CommandEmpty>{searchEmptyValue}</CommandEmpty>
                <CommandGroup>
                  {countries.map((country) => (
                    <CommandItem
                      key={country.value}
                      value={country.value}
                      onSelect={(currentValue: string) => {
                        setValue(currentValue);
                        setOpen(false);
                        if (onValueChange) onValueChange(value);
                      }}
                    >
                      <SelectedCountry {...country} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </Tooltip>
    </TooltipProvider>
  );
}

type SelectedCountryProps = CountrySelectItem & {
  showLabel?: boolean;
};
const SelectedCountry = ({
  value = '',
  label,
  rtl,
  showLabel = true,
}: SelectedCountryProps) => (
  <div
    className={`${rtl ?? 'flex-row-reverse'} rtl:flex-row-reverse flex w-full justify-between gap-2 overflow-hidden items-center`}
  >
    {showLabel && <span className="text-xs">{label}</span>}
    <div className="border  rounded-sm overflow-hidden">
      <img
        className="w-6"
        src={`https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/${value}.svg`}
        alt={label}
      />
    </div>
  </div>
);

export { CountrySelectItem, CountrySelector };
