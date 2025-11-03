"use client";

import * as React from "react";

import { Badge } from "@repo/ayasofyazilim-ui/components/badge";
import { Button } from "@repo/ayasofyazilim-ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ayasofyazilim-ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ayasofyazilim-ui/components/popover";
import { ScrollArea } from "@repo/ayasofyazilim-ui/components/scroll-area";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";

export const lang = {
  searchText: "Find",
  searchEmptyValue: "No country found.",
  defaultValue: {
    label: "Test",
    value: "tr",
  },
  countries: [
    {
      cultureName: "en",
      uiCultureName: "en",
      displayName: "English",
      flagIcon: "en",
      isEnabled: true,
      isDefaultLanguage: true,
      concurrencyStamp: "1a736aee0303420f9394ce3a98523e34",
      creationTime: "2024-03-21T08:43:33.6867177",
      creatorId: null,
      id: "75fe277d-5138-285d-8088-3a1171b61635",
      extraProperties: {},
    },
    {
      cultureName: "tr",
      uiCultureName: "tr",
      displayName: "Türkçe",
      flagIcon: "tr",
      isEnabled: true,
      isDefaultLanguage: false,
      concurrencyStamp: "095c8922c1b148bd9e161beca3c635ac",
      creationTime: "2024-03-21T08:43:33.6892353",
      creatorId: null,
      id: "a8483e30-e0e6-e4e8-f2ff-3a1171b61638",
      extraProperties: {},
    },
  ],
};
export type CountryItem = {
  concurrencyStamp?: string;
  creationTime?: string;
  creatorId?: string | null;
  cultureName?: string | null;
  direction?: "rtl" | "ltr" | null;
  displayName?: string | null;
  extraProperties?: object | null;
  flagIcon?: string | null;
  id?: string | null;
  isDefaultLanguage?: boolean;
  isEnabled?: boolean;
  twoLetterISOLanguageName?: string | null;
  uiCultureName?: string | null;
};

type CountrySelectorProps = {
  countries?: Array<CountryItem>;
  defaultValue?: string;
  menuAlign?: "start" | "center" | "end";
  onValueChange?: (value: string) => void;
  searchEmptyValue?: string;
  searchText?: string;
  showLabel?: boolean;
  showFlag?: boolean;
  tooltipText?: string;
  className?: string;
};

export function CountrySelector({
  searchText,
  searchEmptyValue,
  defaultValue,
  menuAlign = "end",
  showLabel = false,
  showFlag = false,
  countries = [],
  onValueChange,
  className,
}: CountrySelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<string>("");

  function onSelect(currentValue: string) {
    setValue(currentValue);
    setOpen(false);
    if (onValueChange) onValueChange(currentValue);
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          role="combobox"
          variant="ghost"
          aria-expanded={open}
          className={cn(
            "justify-between border-none bg-transparent px-2 gap-2 rtl:flex-row-reverse min-h-8",
            className,
          )}
        >
          {value ? (
            <SelectedCountry
              {...countries.find(
                (country) => country.cultureName?.toLowerCase() === value,
              )}
              showFlag={showFlag}
              showLabel={showLabel}
            />
          ) : (
            <SelectedCountry
              {...countries.find(
                (country) =>
                  country.cultureName?.toLowerCase() === defaultValue,
              )}
              showFlag={showFlag}
              showLabel={showLabel}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-0" align={menuAlign}>
        <Command
          filter={(commandValue, search) => {
            if (
              commandValue.includes(search) ||
              countries
                .find(
                  (i) =>
                    i.cultureName?.toLocaleLowerCase() ===
                    commandValue.toLocaleLowerCase(),
                )
                ?.displayName?.toLocaleLowerCase()
                ?.includes(search.toLocaleLowerCase())
            )
              return 1;
            return 0;
          }}
        >
          <ScrollArea className="h-full overflow-auto">
            <CommandList className="h-full overflow-visible">
              <CommandInput placeholder={searchText} className="h-9 text-xs" />
              <CommandEmpty>{searchEmptyValue}</CommandEmpty>
              <CommandGroup>
                {countries.map((country) => (
                  <CommandItem
                    key={country.cultureName}
                    value={`${country.cultureName}` || ""}
                    onSelect={(currentValue: string) => onSelect(currentValue)}
                  >
                    <SelectedCountry {...country} />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

type SelectedCountryProps = Partial<CountryItem> & {
  showLabel?: boolean;
  showFlag?: boolean;
};
const SelectedCountry = ({
  displayName,
  flagIcon = "",
  direction,
  showLabel = true,
  showFlag,
}: SelectedCountryProps) => (
  <div
    className={`${direction === "rtl" && "flex-row-reverse"} rtl:flex-row-reverse flex w-full justify-between gap-2 overflow-hidden items-center`}
  >
    {showLabel && <span className="text-xs text-black">{displayName}</span>}
    <div>
      {showFlag && (
        <img
          src={`https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/1x1/${flagIcon}.svg`}
          alt={displayName || ""}
          className="w-6 h-6 object-cover rounded-full"
        />
      )}
      {!showFlag && (
        <Badge className="text-xs py-0 px-1">
          {flagIcon?.toUpperCase() || "N/A"}
        </Badge>
      )}
    </div>
    {/* <div className="w-6 h-6"> */}
    {/* {showFlag  ?<img */}
    {/* className="w-6 h-6 object-cover rounded-full" */}
    {/* src={`https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/1x1/${flagIcon}.svg`} */}
    {/* alt={displayName || ''} */}
    {/* />: <} */}
    {/* </div> */}
  </div>
);
